import { isBlockedEmail, readCatalog } from "./catalog.server";
import { assertSession } from "./admin-auth.server";
import { couponDiscount, couponRejectReason, findCoupon } from "./coupon";
import { randomUUID } from "node:crypto";
import { normalizeInstagram } from "./order-contact";
import type {
  ClaimKind,
  ClaimStatus,
  InboxItem,
  OrderStatus,
  StoreOrder,
  StoreReview,
} from "./order-types";

export type { InboxItem, OrderStatus, StoreOrder, StoreReview };

async function db() {
  const { getSql } = await import("./db");
  return getSql();
}

export async function ensureOrderTables() {
  const sql = await db();
  await sql.query(`
    create table if not exists store_orders (
      id text primary key,
      data jsonb not null,
      status text not null default 'paid',
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(`
    create table if not exists store_inbox (
      id text primary key,
      data jsonb not null,
      status text not null default 'new',
      created_at timestamptz not null default now()
    )
  `);
  await sql.query(`create unique index if not exists store_orders_paypal_unique
    on store_orders ((data->>'paypalOrderId')) where data->>'paypalOrderId' is not null`);
  await sql.query(`
    create table if not exists store_reviews (
      id text primary key,
      data jsonb not null,
      status text not null default 'new',
      created_at timestamptz not null default now()
    )
  `);
}

function asJson<T>(data: unknown): T {
  return (typeof data === "string" ? JSON.parse(data) : data) as T;
}

function emailMatch(a: string, b: string) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

const orderSnapshots = new WeakMap<StoreOrder, { data: string; status: string }>();

/** Optimistic snapshot + authoritative status guard, shared by every order writer. */
export async function saveOrder(previous: StoreOrder, order: StoreOrder) {
  const sql = await db();
  const snapshot = orderSnapshots.get(previous) ?? {
    data: JSON.stringify(previous),
    status: previous.status,
  };
  const claims = (order.fulfillment?.packages ?? [])
    .filter((p) => p.tracking)
    .map((p) => ({ tracking: p.tracking!, package_id: p.id }));
  if (claims.length) {
    await sql.query(`create table if not exists store_ems_tracking (
      tracking text primary key, order_id text not null references store_orders(id), package_id text not null,
      unique(order_id, package_id)
    )`);
    for (const claim of claims) {
      const duplicate = await sql.query<{ id: string }>(
        `select id from store_orders where id <> $1 and (
        upper(regexp_replace(coalesce(data->>'tracking',''), '[[:space:]]', '', 'g')) = $2
        or exists (select 1 from jsonb_array_elements(coalesce(data->'fulfillment'->'packages','[]'::jsonb)) p where p->>'tracking' = $2)
      ) limit 1`,
        [order.id, claim.tracking],
      );
      if (duplicate.length) throw new Error("EMS_DUPLICATE_TRACKING");
    }
  }
  let rows: Array<{ id: string }>;
  try {
    if (claims.length) {
      rows = await sql.query<{ id: string }>(
        `with target as (
        select id from store_orders where id=$1 and data=$4::jsonb and status=$5 for update
      ), claimed as (
        insert into store_ems_tracking (tracking,order_id,package_id)
        select p->>'tracking', target.id, p->>'package_id' from target cross join jsonb_array_elements($6::jsonb) p
        on conflict (tracking) do update set order_id = case when
          store_ems_tracking.order_id=excluded.order_id and store_ems_tracking.package_id=excluded.package_id
          then store_ems_tracking.order_id else null end
        returning tracking
      ) update store_orders set data=$2::jsonb,status=$3 where id in (select id from target)
        and data=$4::jsonb and status=$5 and (select count(*) from claimed)>=0 returning id`,
        [
          order.id,
          JSON.stringify(order),
          order.status,
          snapshot.data,
          snapshot.status,
          JSON.stringify(claims),
        ],
      );
    } else {
      rows = await sql.query<{ id: string }>(
        "update store_orders set data=$2::jsonb,status=$3 where id=$1 and data=$4::jsonb and status=$5 returning id",
        [order.id, JSON.stringify(order), order.status, snapshot.data, snapshot.status],
      );
    }
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code === "23505" || code === "23502") throw new Error("EMS_DUPLICATE_TRACKING");
    throw error;
  }
  if (!rows.length) throw new Error("ORDER_CHANGED");
  orderSnapshots.set(order, { data: JSON.stringify(order), status: order.status });
}
function readSnapshot(row: { data: unknown; status: string }) {
  const raw = asJson<StoreOrder>(row.data);
  const order = { ...raw, status: row.status as OrderStatus };
  orderSnapshots.set(order, { data: JSON.stringify(raw), status: row.status });
  return order;
}
export async function findOrderById(id: string): Promise<StoreOrder | null> {
  await ensureOrderTables();
  const needle = id.trim().toUpperCase();
  if (!needle) return null;
  const sql = await db();
  const rows = await sql.query<{ data: unknown; status: string }>(
    "select data,status from store_orders where upper(id) = $1 limit 1",
    [needle],
  );
  return rows[0] ? readSnapshot(rows[0]) : null;
}

export async function lookupOrder(id: string, email: string) {
  const order = await findOrderById(id);
  if (!order || !emailMatch(order.email, email)) return null;
  return order;
}

function canRequest(order: StoreOrder, kind: ClaimKind) {
  if (order.claimStatus === "requested" || order.claimStatus === "accepted") {
    return false;
  }
  if (kind === "cancel") return ["wait", "paid", "ready"].includes(order.status);
  return ["shipped", "done", "confirmed"].includes(order.status);
}

export async function requestClaim(input: {
  id: string;
  email: string;
  kind: ClaimKind;
  reason: string;
}) {
  const order = await lookupOrder(input.id, input.email);
  if (!order) throw new Error("NOT_FOUND");
  const kind = input.kind;
  if (kind !== "cancel" && kind !== "return" && kind !== "exchange") {
    throw new Error("BAD_CLAIM");
  }
  if (!canRequest(order, kind)) throw new Error("NOT_ALLOWED");
  const reason = String(input.reason ?? "").trim();
  if (reason.length < 4) throw new Error("REASON");
  const next: StoreOrder = {
    ...order,
    claim: kind,
    claimStatus: "requested",
    claimReason: reason.slice(0, 500),
    claimAt: new Date().toISOString(),
    claimAdminNote: "",
  };
  await saveOrder(order, next);
  return next;
}

export async function decideClaim(
  token: string,
  id: string,
  decision: "accept" | "reject" | "cancel",
  note?: string,
) {
  await assertSession(token);
  const order = await findOrderById(id);
  if (!order) throw new Error("NOT_FOUND");
  if (order.claimStatus !== "requested" || !order.claim) throw new Error("NO_CLAIM");
  const next: StoreOrder = {
    ...order,
    claimAdminNote: String(note ?? "").slice(0, 300),
  };
  if (decision === "accept") {
    if (
      order.claim === "cancel" &&
      order.fulfillment?.packages.some((p) => p.tracking || p.state === "registration_unknown")
    )
      throw new Error("EMS_CANCELLATION_REVIEW");
    next.status = order.claim;
    next.claimStatus = "accepted";
  } else if (decision === "reject") {
    next.claimStatus = "rejected";
  } else {
    next.claimStatus = "cancelled";
  }
  await saveOrder(order, next);
  return next;
}

export async function withdrawClaim(id: string, email: string) {
  const order = await lookupOrder(id, email);
  if (!order) throw new Error("NOT_FOUND");
  if (order.claimStatus !== "requested" || !order.claim) throw new Error("NO_CLAIM");
  const next: StoreOrder = {
    ...order,
    claimStatus: "cancelled",
    claimAdminNote: "",
  };
  await saveOrder(order, next);
  return next;
}

export async function countOrdersByEmail(email: string) {
  await ensureOrderTables();
  const needle = email.trim().toLowerCase();
  if (!needle) return 0;
  const sql = await db();
  const rows = await sql.query<{ data: unknown }>("select data from store_orders limit 400");
  return rows.filter((r) => {
    const o = asJson<StoreOrder>(r.data);
    return o?.email?.trim().toLowerCase() === needle && o.status !== "cancel";
  }).length;
}

export async function placeOrder(
  input: Omit<StoreOrder, "id" | "createdAt" | "status"> & { status?: StoreOrder["status"] },
  preserveVerifiedQuote = false,
) {
  await ensureOrderTables();
  if (!input.email || !input.name || !input.address || !input.items?.length) {
    throw new Error("BAD_ORDER");
  }
  if (await isBlockedEmail(input.email)) {
    throw new Error("BLOCKED");
  }
  let discountKrw = input.discountKrw ?? 0;
  let discountUsd = input.discountUsd ?? 0;
  let couponCode = input.couponCode?.trim().toUpperCase() || "";
  if (couponCode && !preserveVerifiedQuote) {
    const catalog = await readCatalog();
    const coupon = findCoupon(catalog.coupons ?? [], couponCode);
    const count = await countOrdersByEmail(input.email);
    const goodsKrw = Math.max(0, Number(input.totalKrw) + discountKrw - (input.shippingKrw || 0));
    const reason = couponRejectReason(coupon, goodsKrw, count);
    if (reason || !coupon) {
      couponCode = "";
      discountKrw = 0;
      discountUsd = 0;
    } else {
      const off = couponDiscount(coupon, goodsKrw, 0);
      discountKrw = off.krw;
      discountUsd =
        coupon.type === "percent"
          ? Math.round(
              ((Number(input.totalUsd) + (input.discountUsd ?? 0) - (input.shippingUsd || 0)) *
                (coupon.percent ?? 0)) /
                100,
            )
          : (coupon.offUsd ?? 0);
    }
  }
  const wait = input.pay === "transfer";
  const order: StoreOrder = {
    ...input,
    id: `JDK-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: wait ? "wait" : "paid",
    email: String(input.email).slice(0, 200),
    phone: String(input.phone ?? "").slice(0, 40),
    instagram: normalizeInstagram(input.instagram),
    name: String(input.name).slice(0, 80),
    address: String(input.address).slice(0, 200),
    depositor: String(input.depositor ?? "").slice(0, 80),
    couponCode,
    discountKrw,
    discountUsd,
    items: input.items.slice(0, 30),
    fulfillment: undefined,
  };
  const sql = await db();
  const inserted = await sql.query<{ id: string }>(
    "insert into store_orders (id, data, status) values ($1, $2::jsonb, $3) on conflict do nothing returning id",
    [order.id, JSON.stringify(order), order.status],
  );
  if (!inserted.length) {
    if (!order.paypalOrderId) throw new Error("ORDER_ID_CONFLICT");
    const previous = await sql.query<{ data: unknown }>(
      "select data from store_orders where data->>'paypalOrderId' = $1",
      [order.paypalOrderId],
    );
    const existing = previous[0] ? asJson<StoreOrder>(previous[0].data) : null;
    if (
      !existing ||
      !emailMatch(existing.email, order.email) ||
      existing.totalUsd !== order.totalUsd
    ) {
      throw new Error("PAYPAL_ALREADY_USED");
    }
    return existing;
  }
  return order;
}

export async function deleteCancelledOrders(token: string, ids: string[]) {
  await assertSession(token);
  await ensureOrderTables();
  const sql = await db();
  let deleted = 0;
  for (const raw of ids) {
    const id = String(raw || "").trim();
    if (!id) continue;
    const order = await findOrderById(id);
    if (!order || order.status !== "cancel") continue;
    await sql.query("delete from store_orders where id = $1", [order.id]);
    deleted += 1;
  }
  return deleted;
}

export async function listOrders(token: string): Promise<StoreOrder[]> {
  await assertSession(token);
  await ensureOrderTables();
  const sql = await db();
  const rows = await sql.query<{ data: unknown; status: string }>(
    "select data, status from store_orders order by created_at desc limit 200",
  );
  return rows
    .map((r) => {
      const o = asJson<StoreOrder>(r.data);
      if (!o?.id) return null;
      if (r.status && o.status !== r.status) {
        o.status = r.status as StoreOrder["status"];
      }
      return o;
    })
    .filter((o): o is StoreOrder => Boolean(o?.id));
}

export async function updateOrder(
  token: string,
  id: string,
  patch: {
    status?: OrderStatus;
    tracking?: string;
    courier?: string;
    note?: string;
    claim?: ClaimKind;
    claimStatus?: ClaimStatus;
  },
) {
  await assertSession(token);
  await ensureOrderTables();
  const order = await findOrderById(id);
  if (!order) throw new Error("NOT_FOUND");
  const next: StoreOrder = {
    ...order,
    status: patch.status ?? order.status,
    tracking: patch.tracking ?? order.tracking,
    courier: patch.courier ?? order.courier,
    note: patch.note ?? order.note,
  };
  if (
    patch.status &&
    ![
      "wait",
      "paid",
      "ready",
      "shipped",
      "done",
      "confirmed",
      "cancel",
      "return",
      "exchange",
    ].includes(patch.status)
  )
    throw new Error("ORDER_STATUS_INVALID");
  if (
    !order.fulfillment &&
    order.country?.trim().toUpperCase() === "KR" &&
    patch.status &&
    patch.status !== order.status
  ) {
    if (
      ["ready", "shipped", "done", "confirmed"].includes(patch.status) &&
      (["wait", "cancel", "return", "exchange"].includes(order.status) ||
        (order.claim && (order.claimStatus === "requested" || order.claimStatus === "accepted")))
    )
      throw new Error("ORDER_STATUS_INVALID");
  }
  const emsManaged = Boolean(order.fulfillment) || order.country?.trim().toUpperCase() !== "KR";
  if (emsManaged && patch.tracking !== undefined && patch.tracking !== order.tracking)
    throw new Error("USE_EMS_WORKFLOW");
  if (!emsManaged && patch.status === "shipped" && !next.tracking?.trim())
    throw new Error("TRACKING_REQUIRED");
  if (patch.status && patch.status !== order.status) {
    if (emsManaged && ["ready", "shipped", "done", "confirmed"].includes(patch.status))
      throw new Error("USE_EMS_WORKFLOW");
    if (
      ["done", "confirmed"].includes(order.status) &&
      !["return", "exchange", "confirmed"].includes(patch.status)
    )
      throw new Error("ORDER_COMPLETED");
    if (patch.status === "paid" && order.status !== "wait") throw new Error("ORDER_STATUS_INVALID");
    if (patch.status === "wait") throw new Error("ORDER_STATUS_INVALID");
    if (
      patch.status === "cancel" &&
      order.fulfillment?.packages.some((p) => p.tracking || p.state === "registration_unknown")
    )
      throw new Error("EMS_CANCELLATION_REVIEW");
  }
  if (patch.claim) next.claim = patch.claim;
  if (patch.claimStatus) next.claimStatus = patch.claimStatus;
  if (patch.status === "cancel" || patch.status === "return" || patch.status === "exchange") {
    next.claim = patch.status;
    if (!next.claimStatus) next.claimStatus = "accepted";
  }
  await saveOrder(order, next);
  return next;
}

export { addInbox, listInbox, updateInbox } from "./inbox.server";

export async function listReviews(token?: string, productId?: string): Promise<StoreReview[]> {
  await ensureOrderTables();
  const sql = await db();
  const rows = await sql.query<{ data: unknown }>(
    "select data from store_reviews order by created_at desc limit 200",
  );
  let items = rows.map((r) => asJson<StoreReview>(r.data)).filter((o) => o?.id);
  if (productId) items = items.filter((r) => r.productId === productId);
  if (!token) items = items.filter((r) => r.status === "done");
  else await assertSession(token);
  return items;
}

export async function addReview(input: {
  productId: string;
  productName: string;
  name: string;
  rating: number;
  body: string;
  trap?: string;
}) {
  if (input.trap) return { ok: true };
  if (!input.body.trim() || !input.productId) throw new Error("BAD_REVIEW");
  await ensureOrderTables();
  const item: StoreReview = {
    id: `RV-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    productId: String(input.productId).slice(0, 80),
    productName: String(input.productName).slice(0, 120),
    name: String(input.name).slice(0, 80),
    rating: Math.min(5, Math.max(1, Number(input.rating) || 5)),
    body: String(input.body).slice(0, 2000),
    status: "new",
  };
  const sql = await db();
  await sql.query("insert into store_reviews (id, data, status) values ($1, $2::jsonb, $3)", [
    item.id,
    JSON.stringify(item),
    item.status,
  ]);
  return { ok: true, item };
}

export async function updateReview(token: string, id: string, status: "new" | "done") {
  await assertSession(token);
  await ensureOrderTables();
  const sql = await db();
  const rows = await sql.query<{ data: unknown }>("select data from store_reviews where id = $1", [
    id,
  ]);
  if (!rows[0]) throw new Error("NOT_FOUND");
  const item = { ...asJson<StoreReview>(rows[0].data), status };
  await sql.query("update store_reviews set data = $2::jsonb, status = $3 where id = $1", [
    id,
    JSON.stringify(item),
    status,
  ]);
  return item;
}
