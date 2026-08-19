import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { InboxItem } from "@/lib/order-types";

export function InboxBoard({ token }: { token: string }) {
  const [items, setItems] = useState<InboxItem[]>([]);

  async function load() {
    const res = await fetch(`/api/inbox?token=${encodeURIComponent(token)}`);
    const data = (await res.json()) as { items?: InboxItem[] };
    setItems(data.items ?? []);
  }

  useEffect(() => {
    void load();
  }, [token]);

  async function mark(id: string, status: "new" | "done") {
    await fetch("/api/inbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "update", token, id, status }),
    });
    await load();
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-[#333]">
        쇼핑몰 문의하기에서 들어온 글입니다. 답은 이메일로 보내면 됩니다.
      </p>
      <ul className="divide-y divide-[#eee] overflow-hidden rounded border border-[#d5d7dc] bg-white">
        {items.map((it) => (
          <li key={it.id} className="px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">
                  {it.name || "(이름 없음)"} · {it.email}
                </p>
                <p className="text-[11px] text-[#666]">{it.createdAt.slice(0, 16).replace("T", " ")}</p>
              </div>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => void mark(it.id, it.status === "done" ? "new" : "done")}
              >
                {it.status === "done" ? "미처리로" : "처리완료"}
              </Button>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-[#222]">{it.message}</p>
          </li>
        ))}
        {items.length === 0 ? (
          <li className="px-4 py-10 text-center text-sm text-[#555]">문의가 없습니다.</li>
        ) : null}
      </ul>
    </div>
  );
}
