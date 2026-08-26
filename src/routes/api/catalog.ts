import { createFileRoute } from "@tanstack/react-router";
import type { Product } from "@/lib/products";
import type { InfoRow } from "@/lib/site-defaults";
import type { ShopCategory, SiteSeo } from "@/lib/shop-taxonomy";
import type { ShippingSettings } from "@/lib/shipping";
import type { StoreNotice } from "@/lib/catalog.server";
import {
  AUTH_HEADERS,
  assertSession,
  changeAdminPin,
  destroySession,
  issueRecoveryCode,
  resetWithRecovery,
  unlockAdmin,
} from "@/lib/admin-auth.server";
import type { Coupon } from "@/lib/order-types";
import type { BlackCustomer, FaqItem } from "@/lib/store-extras";
import type { PaySettings } from "@/lib/pay-settings";
import {
  bulkProducts,
  deleteProduct,
  readCatalog,
  reorderProducts,
  upsertProduct,
  writeBlacklist,
  writeCategories,
  writeCoupons,
  writeFaqs,
  writeNotice,
  writePay,
  writeSeo,
  writeShipping,
  writeSiteInfo,
} from "@/lib/catalog.server";

function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: AUTH_HEADERS });
}

export const Route = createFileRoute("/api/catalog")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const data = await readCatalog();
          return json(data);
        } catch (err) {
          const message = err instanceof Error ? err.message : "load_failed";
          return json({ error: message }, 500);
        }
      },
      POST: async ({ request }) => {
        try {
          const body = (await request.json()) as {
            action?: string;
            pin?: string;
            nextPin?: string;
            currentPin?: string;
            recoveryCode?: string;
            token?: string;
            product?: Product;
            id?: string;
            ids?: string[];
            op?: string;
            majorId?: string;
            minorId?: string;
            company?: InfoRow[];
            support?: InfoRow[];
            categories?: ShopCategory[];
            seo?: SiteSeo;
            shipping?: ShippingSettings;
            notice?: StoreNotice;
            coupons?: Coupon[];
            pay?: PaySettings;
            faqs?: FaqItem[];
            blacklist?: BlackCustomer[];
          };
          const token = body.token ?? "";
          if (body.action === "unlock") {
            const session = await unlockAdmin(body.pin ?? "", body.nextPin);
            return json({ ok: true, token: session, ...(await readCatalog()) });
          }
          if (body.action === "ping") {
            await assertSession(token);
            return json({ ok: true });
          }
          if (body.action === "logout") {
            await destroySession(token);
            return json({ ok: true });
          }
          if (body.action === "changePin") {
            await changeAdminPin(token, body.currentPin ?? "", body.nextPin ?? "");
            return json({ ok: true, ...(await readCatalog()) });
          }
          if (body.action === "issueRecovery") {
            const recoveryCode = await issueRecoveryCode(token);
            return json({ ok: true, recoveryCode });
          }
          if (body.action === "resetWithRecovery") {
            const session = await resetWithRecovery(
              body.recoveryCode ?? "",
              body.nextPin ?? "",
            );
            return json({ ok: true, token: session, ...(await readCatalog()) });
          }
          if (body.action === "reorder" && body.ids?.length) {
            await reorderProducts(token, body.ids);
            return json(await readCatalog());
          }
          if (body.action === "saveProduct" && body.product) {
            await upsertProduct(token, body.product);
            return json(await readCatalog());
          }
          if (body.action === "deleteProduct" && body.id) {
            await deleteProduct(token, body.id);
            return json(await readCatalog());
          }
          if (body.action === "bulk" && body.ids && body.op) {
            await bulkProducts(token, body.ids, body.op, {
              majorId: body.majorId,
              minorId: body.minorId,
            });
            return json(await readCatalog());
          }
          if (body.action === "saveInfo" && body.company && body.support) {
            await writeSiteInfo(token, body.company, body.support);
            return json(await readCatalog());
          }
          if (body.action === "saveCategories" && body.categories) {
            await writeCategories(token, body.categories);
            return json(await readCatalog());
          }
          if (body.action === "saveSeo" && body.seo) {
            await writeSeo(token, body.seo);
            return json(await readCatalog());
          }
          if (body.action === "saveShipping" && body.shipping) {
            await writeShipping(token, body.shipping);
            return json(await readCatalog());
          }
          if (body.action === "saveNotice" && body.notice) {
            await writeNotice(token, body.notice);
            return json(await readCatalog());
          }
          if (body.action === "saveCoupons" && body.coupons) {
            await writeCoupons(token, body.coupons);
            return json(await readCatalog());
          }
          if (body.action === "savePay" && body.pay) {
            await writePay(token, body.pay);
            return json(await readCatalog());
          }
          if (body.action === "saveFaqs" && body.faqs) {
            await writeFaqs(token, body.faqs);
            return json(await readCatalog());
          }
          if (body.action === "saveBlacklist" && body.blacklist) {
            await writeBlacklist(token, body.blacklist);
            return json(await readCatalog());
          }
          return json({ error: "bad_action" }, 400);
        } catch (err) {
          const message = err instanceof Error ? err.message : "save_failed";
          if (message.startsWith("LOCKED")) {
            return json({ error: message }, 429);
          }
          const status =
            message.startsWith("PIN_BAD") ||
            message === "PIN_SHORT" ||
            message === "AUTH"
              ? 401
              : 400;
          return json({ error: message }, status);
        }
      },
    },
  },
});
