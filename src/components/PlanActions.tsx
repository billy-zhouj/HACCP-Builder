"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PlanActions({ planId, planName }: { planId: string; planName: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(planName);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function rename() {
    if (!name.trim() || name.trim() === planName) {
      setEditing(false);
      return;
    }
    setBusy(true);
    await fetch(`/api/plans/${planId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setBusy(false);
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    await fetch(`/api/plans/${planId}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => {
          setEditing(true);
          setName(planName);
        }}
        className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
      >
        重命名
      </button>
      {confirming ? (
        <>
          <span className="text-xs text-red-600">确认删除？</span>
          <button
            onClick={remove}
            disabled={busy}
            className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "删除中…" : "删除"}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-sm text-slate-500 hover:text-slate-700"
          >
            取消
          </button>
        </>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="rounded-md border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          删除
        </button>
      )}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40" onClick={() => setEditing(false)}>
          <div
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-semibold text-slate-900">重命名计划</h3>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && rename()}
              autoFocus
              className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setEditing(false)}
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                取消
              </button>
              <button
                onClick={rename}
                disabled={busy}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
              >
                {busy ? "保存中…" : "保存"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
