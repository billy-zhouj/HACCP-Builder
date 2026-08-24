"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PaymentOptions } from "@/components/PaymentOptions";

interface PlanSummary {
  id: string;
  name: string;
  isPaid: boolean;
  products: { id: string; processSteps: { hazards: { ccpStatus: string }[] }[] }[];
  sops: { id: string }[];
  recallContacts: { id: string }[];
  mockRecallRecords: { id: string }[];
  haccpTeamMembers: { id: string }[];
}

function ReviewExportInner({ params }: { params: { id: string } }) {
  const searchParams = useSearchParams();
  const [plan, setPlan] = useState<PlanSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const p = await fetch(`/api/plans/${params.id}`).then((r) => r.json());
    setPlan(p);
    setLoading(false);
  }

  useEffect(() => {
    load();
    if (searchParams.get("unlocked")) setMessage("计划已解锁！您现在可以在下方导出。");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  if (loading || !plan) return <p className="text-sm text-slate-500">加载中…</p>;

  const totalHazards = plan.products.reduce((sum, p) => sum + p.processSteps.reduce((s, st) => s + st.hazards.length, 0), 0);
  const totalCcps = plan.products.reduce(
    (sum, p) =>
      sum +
      p.processSteps.reduce(
        (s, st) => s + st.hazards.filter((h) => h.ccpStatus === "CCP" || h.ccpStatus === "PRW").length,
        0
      ),
    0
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">审核与导出</h1>
      <p className="mt-1 text-sm text-slate-600">{plan.name} 的摘要，以及解锁/导出选项。</p>

      {message && <p className="mt-3 rounded-md border border-brand-200 bg-brand-50 p-2 text-sm text-brand-800">{message}</p>}

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ["产品", plan.products.length],
          ["已识别危害", totalHazards],
          ["CCP / 预防控制", totalCcps],
          ["HACCP 团队成员", plan.haccpTeamMembers.length],
          ["已生成 SOP", plan.sops.length],
          ["召回团队成员", plan.recallContacts.length],
          ["已记录模拟召回", plan.mockRecallRecords.length],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-lg border border-slate-200 bg-white p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </dl>

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        {plan.isPaid ? (
          <>
            <p className="text-sm font-semibold text-brand-700">此计划已解锁。</p>
            <a
              href={`/api/plans/${params.id}/export`}
              className="mt-3 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              下载 .docx
            </a>
          </>
        ) : (
          <PaymentOptions planId={params.id} planName={plan.name} onSuccess={() => load()} />
        )}
      </div>
    </div>
  );
}

export default function ReviewExportPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">加载中…</p>}>
      <ReviewExportInner params={params} />
    </Suspense>
  );
}
