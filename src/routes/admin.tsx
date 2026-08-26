import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  AdminShell,
  isAdminPage,
  type AdminPageId,
} from "@/components/admin/admin-shell";
import { CategoryManager } from "@/components/admin/category-manager";
import { Dashboard } from "@/components/admin/dashboard";
import { InboxBoard } from "@/components/admin/inbox-board";
import { OrderBoard } from "@/components/admin/order-board";
import { emptyProduct, ProductForm } from "@/components/admin/product-form";
import { ProductList } from "@/components/admin/product-list";
import { ShippingForm } from "@/components/admin/shipping-form";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCatalog, type CatalogPayload } from "@/lib/use-catalog";
import type { Product } from "@/lib/products";
import type { InfoRow, StoreNotice } from "@/lib/site-defaults";
import type { ShopCategory, SiteSeo } from "@/lib/shop-taxonomy";
import { PayForm } from "@/components/admin/pay-form";
import { PinForm } from "@/components/admin/pin-form";
import { AdminGate } from "@/components/admin/pin-keypad";
import type { PaySettings } from "@/lib/pay-settings";
import type { ShippingSettings } from "@/lib/shipping";
import { GuideManual } from "@/components/admin/guide-manual";
import { AnalyticsBoard } from "@/components/admin/analytics-board";
import { SalesBoard } from "@/components/admin/sales-board";
import { BlacklistBoard, CouponBoard, FaqBoard } from "@/components/admin/store-extra-forms";
import {
  ClaimsBoard,
  CustomerBoard,
  DelayBoard,
  ReviewBoard,
  SettleBoard,
  ShipStatusBoard,
} from "@/components/admin/extra-boards";
import type { Coupon } from "@/lib/order-types";

const searchSchema = z.object({
  p: z.string().optional().catch(undefined),
  edit: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/admin")({
  validateSearch: searchSchema,
  component: AdminPage,
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "관리자" },
    ],
  }),
});

const TOKEN_KEY = "jidokaan-admin-token";

function readToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) ?? "";
  } catch {
    return "";
  }
}

function writeToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
}

async function postCatalog(body: Record<string, unknown>): Promise<CatalogPayload> {
  const res = await fetch("/api/catalog", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as CatalogPayload & { error?: string };
  if (!res.ok) throw new Error(data.error ?? "fail");
  return data;
}

function AdminPage() {
  const { catalog, ready, replace } = useCatalog();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const page: AdminPageId =
    search.p && isAdminPage(search.p) ? search.p : "home";
  const [token, setToken] = useState(readToken);
  const [gateBusy, setGateBusy] = useState(false);
  const [gateError, setGateError] = useState<string | null>(null);
  const [freshRecovery, setFreshRecovery] = useState<string | null>(null);
  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState("");
  const [recoveryPin, setRecoveryPin] = useState("");
  const [recoveryPin2, setRecoveryPin2] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  function go(next: AdminPageId, editId?: string) {
    setMsg(null);
    void navigate({
      to: "/admin",
      search: {
        p: next === "home" ? undefined : next,
        edit: editId,
      },
    });
  }

  useEffect(() => {
    if (search.edit) {
      const found = catalog.products.find((p) => p.id === search.edit);
      setEditing(found ?? null);
      return;
    }
    if (page === "register") {
      setEditing((cur) => (cur && cur.id.startsWith("item-") ? cur : emptyProduct()));
      return;
    }
    setEditing(null);
  }, [search.edit, page, catalog.products]);

  const unlocked = Boolean(token);

  useEffect(() => {
    const existing = readToken();
    if (!existing) return;
    void postCatalog({ action: "ping", token: existing }).catch(() => {
      writeToken("");
      setToken("");
    });
  }, []);

  async function recover() {
    setGateError(null);
    if (recoveryPin.length < 8) {
      setGateError("새 비밀번호는 8자 이상으로 만들어 주세요.");
      return;
    }
    if (recoveryPin !== recoveryPin2) {
      setGateError("새 비밀번호가 서로 다릅니다.");
      return;
    }
    try {
      const next = await postCatalog({
        action: "resetWithRecovery",
        recoveryCode,
        nextPin: recoveryPin,
      });
      const session = (next as CatalogPayload & { token?: string }).token ?? "";
      writeToken(session);
      setToken(session);
      replace(next);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      if (raw === "RECOVERY_NONE") {
        setGateError("등록된 복구 코드가 없습니다. 로그인 후 설정에서 먼저 만들어 주세요.");
      } else if (raw === "PIN_SHORT") {
        setGateError("새 비밀번호는 8자 이상으로 만들어 주세요.");
      } else {
        setGateError("복구 코드가 맞지 않습니다.");
      }
    }
  }

  async function unlockWith(used: string, nextPin?: string) {
    setGateBusy(true);
    setGateError(null);
    try {
      const next = await postCatalog({
        action: "unlock",
        pin: used,
        nextPin,
      });
      const session = (next as CatalogPayload & { token?: string }).token ?? "";
      if (!session) throw new Error("AUTH");
      writeToken(session);
      setToken(session);
      replace(next);
      if (!catalog.hasPin) {
        try {
          const rec = (await postCatalog({
            action: "issueRecovery",
            token: session,
          })) as CatalogPayload & { recoveryCode?: string };
          if (rec.recoveryCode) setFreshRecovery(rec.recoveryCode);
        } catch {
          /* skip */
        }
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "";
      if (raw.startsWith("LOCKED")) {
        setGateError("비밀번호를 여러 번 틀려 잠시 잠겼습니다. 잠시 후 다시 입력해 주세요.");
      } else if (raw.startsWith("PIN_BAD")) {
        const left = raw.split(":")[1];
        setGateError(`비밀번호가 다릅니다. ${left}번 더 틀리면 잠깁니다.`);
      } else if (raw === "PIN_SHORT") {
        setGateError("비밀번호는 8자 이상으로 입력해 주세요.");
      } else {
        setGateError("지금은 들어갈 수 없습니다. 비밀번호를 다시 입력해 주세요.");
      }
    } finally {
      setGateBusy(false);
    }
  }

  async function mutate(body: Record<string, unknown>, ok: string) {
    setBusy(true);
    setMsg(null);
    try {
      const next = await postCatalog({ ...body, token });
      replace(next);
      setMsg(ok);
      return true;
    } catch {
      setMsg("저장에 실패했습니다. 다시 로그인해 주세요.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onSaveProduct(product: Product) {
    const ok = await mutate({ action: "saveProduct", product }, "상품을 저장했습니다. 검색엔진용 제목·설명도 자동 등록했습니다.");
    if (ok) go("list");
  }

  async function onDelete(id: string) {
    if (!confirm("이 상품을 삭제할까요?")) return;
    const ok = await mutate({ action: "deleteProduct", id }, "상품을 삭제했습니다.");
    if (ok) go("list");
  }

  if (!ready) {
    return (
      <div className="admin-ui grid min-h-dvh place-items-center px-4">
        <p className="text-sm text-[#555]">관리자를 불러오는 중…</p>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="admin-ui grid min-h-dvh place-items-center px-4">
        <div className="w-full max-w-sm space-y-4">
          <BrandLogo variant="full" tone="light" className="h-9" imgClassName="h-9 w-auto" />
          <h1 className="text-xl font-semibold">지도칸 관리자</h1>
          <AdminGate
            hasPin={catalog.hasPin}
            busy={gateBusy}
            error={gateError}
            onSubmitPin={(used, nextPin) => void unlockWith(used, nextPin)}
            onRecover={() => {
              setRecoverOpen((v) => !v);
              setGateError(null);
            }}
          />
          {recoverOpen ? (
            <div className="space-y-3 rounded-3xl border border-border bg-white p-6">
              <p className="text-sm leading-relaxed text-[#333]">
                설정에서 만들어 둔 복구 코드를 넣고 새 비밀번호를 정하면 바로 들어갑니다. 영문·숫자 모두 가능하고, 8자 이상이어야 합니다.
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="rec-code">복구 코드</Label>
                <Input
                  id="rec-code"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rec-pin">새 비밀번호 (8자 이상)</Label>
                <Input
                  id="rec-pin"
                  type="password"
                  autoComplete="new-password"
                  value={recoveryPin}
                  onChange={(e) => setRecoveryPin(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rec-pin2">새 비밀번호 확인</Label>
                <Input
                  id="rec-pin2"
                  type="password"
                  autoComplete="new-password"
                  value={recoveryPin2}
                  onChange={(e) => setRecoveryPin2(e.target.value)}
                />
              </div>
              <Button type="button" className="w-full" onClick={() => void recover()}>
                복구 후 들어가기
              </Button>
            </div>
          ) : null}
          <Link to="/" className="block text-center text-sm text-[#333] hover:text-fg">
            쇼핑몰로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  if (freshRecovery) {
    return (
      <div className="admin-ui grid min-h-dvh place-items-center px-4">
        <div className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-white p-6">
          <h1 className="text-xl font-semibold">복구 코드를 적어두세요</h1>
          <p className="text-sm leading-relaxed text-[#333]">
            비밀번호를 잊어버렸을 때 이 코드로 다시 들어갑니다. 사진으로 찍거나 종이에 적으세요. 한 번만 보여 줍니다.
          </p>
          <p className="rounded-2xl bg-[#111] px-3 py-4 text-center text-xl font-mono tracking-widest text-white">
            {freshRecovery}
          </p>
          <Button type="button" className="w-full" onClick={() => setFreshRecovery(null)}>
            적었습니다. 관리자 열기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AdminShell
      page={editing ? "register" : page}
      editing={Boolean(editing)}
      onPage={(id) => go(id)}
      onBack={() => {
        if (editing || page === "register") go("list");
        else go("home");
      }}
      onLogout={() => {
        void postCatalog({ action: "logout", token }).catch(() => null);
        writeToken("");
        setToken("");
        go("home");
      }}
    >
      {msg ? (
        <p className="mb-4 rounded border border-[#d5d7dc] bg-white px-3 py-2 text-sm text-[#222]">
          {msg}
        </p>
      ) : null}

      {editing ? (
        <ProductForm
          key={editing.id}
          initial={editing}
          categories={catalog.categories}
          busy={busy}
          token={token}
          onCancel={() => go("list")}
          onSave={onSaveProduct}
          onDelete={onDelete}
        />
      ) : null}

      {!editing && page === "list" ? (
        <ProductList
          products={catalog.products}
          categories={catalog.categories}
          busy={busy}
          onCreate={() => go("register")}
          onEdit={(p) => go("list", p.id)}
          onBulk={(ids, op, extra) =>
            void mutate(
              { action: "bulk", ids, op, ...extra },
              "선택한 상품을 반영했습니다.",
            )
          }
          onReorder={async (ids) => {
            const ok = await mutate(
              { action: "reorder", ids },
              "진열 순서를 저장했습니다. 쇼핑몰 상품 목록에 이 순서로 나갑니다.",
            );
            return ok;
          }}
        />
      ) : null}

      {!editing && page === "categories" ? (
        <CategoryManager
          categories={catalog.categories}
          busy={busy}
          onSave={(categories: ShopCategory[]) =>
            void mutate({ action: "saveCategories", categories }, "분류를 저장했습니다.")
          }
        />
      ) : null}

      {!editing && page === "seo" ? (
        <SeoForm
          seo={catalog.seo}
          busy={busy}
          onSave={(seo) => void mutate({ action: "saveSeo", seo }, "사이트 검색 정보를 저장했습니다.")}
        />
      ) : null}

      {!editing && page === "shipping" ? (
        <ShippingForm
          initial={catalog.shipping}
          busy={busy}
          onSave={(shipping: ShippingSettings) =>
            void mutate({ action: "saveShipping", shipping }, "배송비를 저장했습니다.")
          }
        />
      ) : null}

      {!editing && page === "home" ? (
        <Dashboard
          token={token}
          products={catalog.products}
          onGo={(id) => go(id)}
        />
      ) : null}

      {!editing && page === "orders" ? <OrderBoard token={token} /> : null}
      {!editing && page === "shipstatus" ? <ShipStatusBoard token={token} /> : null}
      {!editing && page === "claims" ? <ClaimsBoard token={token} /> : null}
      {!editing && page === "delay" ? <DelayBoard token={token} /> : null}
      {!editing && page === "settle" ? <SettleBoard token={token} /> : null}
      {!editing && page === "inbox" ? <InboxBoard token={token} /> : null}
      {!editing && page === "reviews" ? <ReviewBoard token={token} /> : null}
      {!editing && page === "sales" ? <SalesBoard token={token} /> : null}
      {!editing && page === "analytics" ? <AnalyticsBoard token={token} /> : null}
      {!editing && page === "customers" ? <CustomerBoard token={token} /> : null}
      {!editing && page === "faq" ? (
        <FaqBoard
          faqs={catalog.faqs ?? []}
          busy={busy}
          onSave={(faqs) => void mutate({ action: "saveFaqs", faqs }, "FAQ를 저장했습니다.")}
        />
      ) : null}
      {!editing && page === "blacklist" ? (
        <BlacklistBoard
          items={catalog.blacklist ?? []}
          busy={busy}
          onSave={(blacklist) =>
            void mutate({ action: "saveBlacklist", blacklist }, "차단목록을 저장했습니다.")
          }
        />
      ) : null}
      {!editing && page === "guide" ? <GuideManual /> : null}
      {!editing && page === "coupons" ? (
        <CouponBoard
          coupons={catalog.coupons ?? []}
          busy={busy}
          onSave={(coupons: Coupon[]) =>
            void mutate({ action: "saveCoupons", coupons }, "쿠폰을 저장했습니다.")
          }
        />
      ) : null}

      {!editing && page === "pay" ? (
        <PayForm
          initial={catalog.pay ?? { krBank: "", krAccount: "", krHolder: "", krMemo: "", intlBank: "", intlAccount: "", intlSwift: "", intlHolder: "", intlPaypal: "", tossClientKey: "", paypalClientId: "" }}
          busy={busy}
          onSave={(pay: PaySettings) =>
            void mutate({ action: "savePay", pay }, "계좌·결제 정보를 저장했습니다.")
          }
        />
      ) : null}

      {!editing && page === "password" ? (
        <PinForm
          busy={busy}
          onSave={async (current, next) => {
            try {
              await postCatalog({ action: "changePin", token, currentPin: current, nextPin: next });
              setMsg("비밀번호를 변경했습니다.");
              return true;
            } catch {
              setMsg("비밀번호 변경에 실패했습니다. 현재 비밀번호를 확인하세요.");
              return false;
            }
          }}
          onIssueRecovery={async () => {
            const res = await fetch("/api/catalog", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: "issueRecovery", token }),
            });
            const data = (await res.json()) as { recoveryCode?: string; error?: string };
            if (!res.ok || !data.recoveryCode) throw new Error(data.error || "fail");
            return data.recoveryCode;
          }}
        />
      ) : null}

      {!editing && page === "notice" ? (
        <NoticeForm
          notice={catalog.notice}
          busy={busy}
          onSave={(notice) =>
            void mutate({ action: "saveNotice", notice }, "공지를 저장했습니다.")
          }
        />
      ) : null}

      {!editing && page === "company" ? (
        <CompanyForm
          company={catalog.company}
          support={catalog.support}
          busy={busy}
          onSave={(company, support) =>
            void mutate({ action: "saveInfo", company, support }, "회사 정보를 저장했습니다.")
          }
        />
      ) : null}
    </AdminShell>
  );
}

function NoticeForm({
  notice,
  busy,
  onSave,
}: {
  notice: StoreNotice;
  busy: boolean;
  onSave: (n: StoreNotice) => void;
}) {
  const [n, setN] = useState(notice);
  return (
    <form
      className="space-y-4 rounded border border-[#d5d7dc] bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(n);
      }}
    >
      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={n.enabled}
          onChange={(e) => setN({ ...n, enabled: e.target.checked })}
        />
        쇼핑몰 상단에 공지 보이기
      </label>
      <textarea
        className="min-h-24 w-full rounded border border-border bg-white px-3 py-2 text-sm"
        value={n.text}
        onChange={(e) => setN({ ...n, text: e.target.value })}
        placeholder="예: 설 연휴 1/28–1/30 출고가 쉽니다."
      />
      <Button type="submit" disabled={busy}>
        {busy ? "저장 중…" : "공지 저장"}
      </Button>
    </form>
  );
}

function SeoForm({
  seo,
  busy,
  onSave,
}: {
  seo: SiteSeo;
  busy: boolean;
  onSave: (seo: SiteSeo) => void;
}) {
  const [s, setS] = useState(seo);
  return (
    <form
      className="space-y-4 rounded border border-[#d5d7dc] bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(s);
      }}
    >
      <p className="text-sm text-[#333]">
        메인·샵 페이지가 구글·네이버에 이렇게 보입니다. 상품을 등록하면 그 상품은 상품명으로 따로 자동 등록됩니다.
      </p>
      <div className="space-y-1.5">
        <Label>사이트 제목</Label>
        <Input value={s.title} onChange={(e) => setS({ ...s, title: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>사이트 설명</Label>
        <textarea
          className="min-h-24 w-full rounded border border-border bg-white px-3 py-2 text-sm"
          value={s.description}
          onChange={(e) => setS({ ...s, description: e.target.value })}
        />
      </div>
      <div className="space-y-1.5">
        <Label>키워드</Label>
        <Input value={s.keywords} onChange={(e) => setS({ ...s, keywords: e.target.value })} />
      </div>
      <Button type="submit" disabled={busy}>
        {busy ? "저장 중…" : "SEO 저장"}
      </Button>
    </form>
  );
}

function CompanyForm({
  company,
  support,
  busy,
  onSave,
}: {
  company: InfoRow[];
  support: InfoRow[];
  busy: boolean;
  onSave: (company: InfoRow[], support: InfoRow[]) => void;
}) {
  const [co, setCo] = useState(company);
  const [su, setSu] = useState(support);

  return (
    <form
      className="space-y-8"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(withHref(co), withHref(su));
      }}
    >
      <section className="space-y-3 rounded border border-border bg-white p-5">
        <h2 className="font-semibold">사업자 정보</h2>
        {co.map((row, i) => (
          <div key={row.label} className="grid gap-2 sm:grid-cols-[8rem_1fr]">
            <Label className="sm:pt-3">{row.label}</Label>
            <Input
              value={row.value}
              onChange={(e) => {
                const next = [...co];
                next[i] = { ...row, value: e.target.value };
                setCo(next);
              }}
            />
          </div>
        ))}
      </section>
      <section className="space-y-3 rounded border border-border bg-white p-5">
        <h2 className="font-semibold">상담 정보</h2>
        {su.map((row, i) => (
          <div key={row.label} className="grid gap-2 sm:grid-cols-[8rem_1fr]">
            <Label className="sm:pt-3">{row.label}</Label>
            <Input
              value={row.value}
              onChange={(e) => {
                const next = [...su];
                next[i] = { ...row, value: e.target.value };
                setSu(next);
              }}
            />
          </div>
        ))}
      </section>
      <Button type="submit" disabled={busy}>
        {busy ? "저장 중…" : "회사 정보 저장"}
      </Button>
    </form>
  );
}

function withHref(rows: InfoRow[]): InfoRow[] {
  return rows.map((row) => {
    const v = row.value.replace(/\s/g, "");
    if (row.label.includes("이메일")) return { ...row, href: `mailto:${row.value}` };
    if (row.label.includes("전화")) return { ...row, href: `tel:${v}` };
    return { label: row.label, value: row.value };
  });
}
