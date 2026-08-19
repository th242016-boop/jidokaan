import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Coupon } from "@/lib/order-types";
import type { BlackCustomer, FaqItem } from "@/lib/store-extras";

export function CouponBoard({
  coupons,
  busy,
  onSave,
}: {
  coupons: Coupon[];
  busy: boolean;
  onSave: (c: Coupon[]) => void;
}) {
  const [rows, setRows] = useState(coupons);
  const [draft, setDraft] = useState({
    code: "",
    label: "",
    type: "amount" as "amount" | "percent",
    offKrw: 10000,
    percent: 10,
    minKrw: 0,
    target: "all" as "all" | "first" | "repeat",
    start: "",
    end: "",
  });
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#333]">
        여기서 만든 코드를 손님이 결제 화면에서 입력하면 금액이 깎입니다.
        한국은 원, 해외는 같은 비율(정률) 또는 달러 할인(정액)으로 적용됩니다.
        손님에게는 코드만 알려 주면 됩니다. 예: <b>WELCOME10</b>
      </p>
      <div className="grid gap-3 rounded border border-[#d5d7dc] bg-white p-4 sm:grid-cols-3">
        <Field label="혜택 이름">
          <Input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
        </Field>
        <Field label="쿠폰 코드">
          <Input
            value={draft.code}
            onChange={(e) => setDraft({ ...draft, code: e.target.value.toUpperCase() })}
          />
        </Field>
        <Field label="대상">
          <select
            className="h-10 w-full rounded border border-[#ccc] bg-white px-2 text-sm"
            value={draft.target}
            onChange={(e) => setDraft({ ...draft, target: e.target.value as typeof draft.target })}
          >
            <option value="all">전체고객</option>
            <option value="first">첫구매</option>
            <option value="repeat">재구매</option>
          </select>
        </Field>
        <Field label="할인종류">
          <select
            className="h-10 w-full rounded border border-[#ccc] bg-white px-2 text-sm"
            value={draft.type}
            onChange={(e) => setDraft({ ...draft, type: e.target.value as typeof draft.type })}
          >
            <option value="amount">정액(원)</option>
            <option value="percent">정률(%)</option>
          </select>
        </Field>
        {draft.type === "amount" ? (
          <Field label="할인금액">
            <Input type="number" value={draft.offKrw} onChange={(e) => setDraft({ ...draft, offKrw: Number(e.target.value) || 0 })} />
          </Field>
        ) : (
          <Field label="할인율 %">
            <Input type="number" value={draft.percent} onChange={(e) => setDraft({ ...draft, percent: Number(e.target.value) || 0 })} />
          </Field>
        )}
        <Field label="최소주문금액">
          <Input type="number" value={draft.minKrw} onChange={(e) => setDraft({ ...draft, minKrw: Number(e.target.value) || 0 })} />
        </Field>
        <Field label="시작일">
          <Input type="date" value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} />
        </Field>
        <Field label="종료일">
          <Input type="date" value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} />
        </Field>
        <div className="flex items-end">
          <Button
            type="button"
            onClick={() => {
              if (!draft.code.trim()) return;
              setRows([
                ...rows,
                {
                  id: `CP-${Date.now()}`,
                  code: draft.code.trim(),
                  label: draft.label || draft.code,
                  type: draft.type,
                  offKrw: draft.type === "amount" ? draft.offKrw : 0,
                  offUsd: Math.round((draft.type === "amount" ? draft.offKrw : 0) / 1300),
                  percent: draft.percent,
                  minKrw: draft.minKrw,
                  target: draft.target,
                  start: draft.start,
                  end: draft.end,
                  enabled: true,
                },
              ]);
            }}
          >
            혜택 추가
          </Button>
        </div>
      </div>
      <ul className="divide-y divide-[#eee] overflow-hidden rounded border border-[#d5d7dc] bg-white">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              <b>{c.code}</b> · {c.label} · {c.target === "first" ? "첫구매" : c.target === "repeat" ? "재구매" : "전체"} ·{" "}
              {c.type === "percent" ? `${c.percent}%` : `₩${c.offKrw.toLocaleString()}`}
              {c.minKrw ? ` · ${c.minKrw.toLocaleString()}원 이상` : ""}
              {c.enabled === false ? " · 중지" : ""}
            </span>
            <span className="flex gap-3">
              <button
                type="button"
                className="text-sm"
                onClick={() =>
                  setRows(rows.map((x) => (x.id === c.id ? { ...x, enabled: x.enabled === false } : x)))
                }
              >
                {c.enabled === false ? "켜기" : "끄기"}
              </button>
              <button type="button" className="text-[#c00]" onClick={() => setRows(rows.filter((x) => x.id !== c.id))}>
                삭제
              </button>
            </span>
          </li>
        ))}
        {rows.length === 0 ? <li className="px-4 py-8 text-center text-[#555]">등록된 혜택이 없습니다.</li> : null}
      </ul>
      <Button disabled={busy} onClick={() => onSave(rows)}>
        {busy ? "저장 중…" : "혜택 저장"}
      </Button>
    </div>
  );
}

export function FaqBoard({
  faqs,
  busy,
  onSave,
}: {
  faqs: FaqItem[];
  busy: boolean;
  onSave: (f: FaqItem[]) => void;
}) {
  const [rows, setRows] = useState(faqs);
  const [q, setQ] = useState("");
  const [a, setA] = useState("");
  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded border border-[#d5d7dc] bg-white p-4">
        <Label>질문</Label>
        <Input value={q} onChange={(e) => setQ(e.target.value)} />
        <Label>답변</Label>
        <textarea
          className="min-h-24 w-full rounded border border-[#ccc] px-3 py-2 text-sm"
          value={a}
          onChange={(e) => setA(e.target.value)}
        />
        <Button
          type="button"
          onClick={() => {
            if (!q.trim() || !a.trim()) return;
            setRows([...rows, { id: `FAQ-${Date.now()}`, q: q.trim(), a: a.trim(), enabled: true }]);
            setQ("");
            setA("");
          }}
        >
          추가
        </Button>
      </div>
      <ul className="divide-y divide-[#eee] overflow-hidden rounded border border-[#d5d7dc] bg-white">
        {rows.map((f) => (
          <li key={f.id} className="px-4 py-3">
            <div className="flex justify-between gap-2">
              <b className="text-sm">{f.q}</b>
              <button type="button" className="text-[#c00] text-sm" onClick={() => setRows(rows.filter((x) => x.id !== f.id))}>
                삭제
              </button>
            </div>
            <p className="mt-1 text-sm text-[#555]">{f.a}</p>
          </li>
        ))}
        {rows.length === 0 ? <li className="px-4 py-8 text-center text-[#555]">자주 묻는 질문을 넣어 두세요.</li> : null}
      </ul>
      <Button disabled={busy} onClick={() => onSave(rows)}>
        {busy ? "저장 중…" : "FAQ 저장"}
      </Button>
    </div>
  );
}

export function BlacklistBoard({
  items,
  busy,
  onSave,
}: {
  items: BlackCustomer[];
  busy: boolean;
  onSave: (b: BlackCustomer[]) => void;
}) {
  const [rows, setRows] = useState(items);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [reason, setReason] = useState("");
  return (
    <div className="space-y-4">
      <p className="text-sm text-[#333]">
        여기에 넣은 이메일은 주문과 문의가 막힙니다. 악성 문의·영업방해용입니다.
      </p>
      <div className="grid gap-2 rounded border border-[#d5d7dc] bg-white p-4 sm:grid-cols-4">
        <Input placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="사유" value={reason} onChange={(e) => setReason(e.target.value)} />
        <Button
          type="button"
          onClick={() => {
            if (!email.trim()) return;
            setRows([
              ...rows,
              {
                id: `BL-${Date.now()}`,
                email: email.trim(),
                name: name.trim(),
                reason: reason.trim(),
                createdAt: new Date().toISOString(),
              },
            ]);
            setEmail("");
            setName("");
            setReason("");
          }}
        >
          등록
        </Button>
      </div>
      <ul className="divide-y divide-[#eee] overflow-hidden rounded border border-[#d5d7dc] bg-white">
        {rows.map((b) => (
          <li key={b.id} className="flex justify-between px-4 py-3 text-sm">
            <span>
              <b>{b.email}</b> · {b.name} · {b.reason}
            </span>
            <button type="button" className="text-[#c00]" onClick={() => setRows(rows.filter((x) => x.id !== b.id))}>
              해제
            </button>
          </li>
        ))}
        {rows.length === 0 ? <li className="px-4 py-8 text-center text-[#555]">등록된 차단 고객이 없습니다.</li> : null}
      </ul>
      <Button disabled={busy} onClick={() => onSave(rows)}>
        {busy ? "저장 중…" : "차단목록 저장"}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
