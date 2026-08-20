"use client";

import { useEffect, useState } from "react";
import ProductSelector from "@/components/ProductSelector";
import GuidancePanel from "@/components/GuidancePanel";

interface Hazard {
  id: string;
  type: string;
  description: string;
  ccpStatus: string;
  criticalLimit: string | null;
  monitoringProcedure: string | null;
  monitoringFrequency: string | null;
  correctionAction: string | null;
  verificationProcedure: string | null;
  recordkeepingProcedure: string | null;
  responsibleParty: string | null;
}

interface Step {
  id: string;
  order: number;
  name: string;
  hazards: Hazard[];
}

interface ProductData {
  id: string;
  name: string;
  processSteps: Step[];
}

export default function PreventiveControlsPage({ params }: { params: { id: string } }) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(keepActive = true) {
    const plan = await fetch(`/api/plans/${params.id}`).then((r) => r.json());
    setProducts(plan.products ?? []);
    if (!keepActive || !activeId) setActiveId(plan.products?.[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const active = products.find((p) => p.id === activeId) ?? null;

  async function update(stepId: string, hazardId: string, patch: Partial<Hazard>) {
    if (!active) return;
    await fetch(`/api/plans/${params.id}/products/${active.id}/process-steps/${stepId}/hazards/${hazardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  if (loading) return <p className="text-sm text-slate-500">加载中…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">预防控制措施（原则 3-7）</h1>
      <p className="mt-1 text-sm text-slate-600">
        为每个 CCP / 工艺预防控制设定关键限值、监控、纠正措施、验证、记录保存和责任人。
      </p>
      <GuidancePanel title="没有列出 CCP？">
        请先完成 CCP 判定——只有被指定为 CCP 或 PRW（工艺预防控制）的危害才会显示在这里。
      </GuidancePanel>

      <ProductSelector products={products} activeProductId={activeId} onSelect={setActiveId} />

      {active &&
        [...active.processSteps].sort((a, b) => a.order - b.order).map((step) => {
          const ccps = step.hazards.filter((h) => h.ccpStatus === "CCP" || h.ccpStatus === "PRW");
          if (ccps.length === 0) return null;
          return (
            <div key={step.id} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="text-sm font-semibold text-slate-800">
                步骤 {step.order}：{step.name}
              </h2>
              {ccps.map((h) => (
                <div key={h.id} className="mt-3 rounded-md border border-slate-100 bg-slate-50 p-3">
                  <p className="text-sm font-medium text-slate-800">
                    [{h.ccpStatus}] {h.type}: {h.description}
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <input
                      defaultValue={h.criticalLimit ?? ""}
                      onBlur={(e) => update(step.id, h.id, { criticalLimit: e.target.value })}
                      placeholder="关键限值（原则 3）"
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <input
                      defaultValue={h.monitoringProcedure ?? ""}
                      onBlur={(e) => update(step.id, h.id, { monitoringProcedure: e.target.value })}
                      placeholder="监控程序（原则 4）"
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <input
                      defaultValue={h.monitoringFrequency ?? ""}
                      onBlur={(e) => update(step.id, h.id, { monitoringFrequency: e.target.value })}
                      placeholder="监控频率"
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <input
                      defaultValue={h.correctionAction ?? ""}
                      onBlur={(e) => update(step.id, h.id, { correctionAction: e.target.value })}
                      placeholder="纠正措施（原则 5）"
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <input
                      defaultValue={h.verificationProcedure ?? ""}
                      onBlur={(e) => update(step.id, h.id, { verificationProcedure: e.target.value })}
                      placeholder="验证程序（原则 6）"
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <input
                      defaultValue={h.recordkeepingProcedure ?? ""}
                      onBlur={(e) => update(step.id, h.id, { recordkeepingProcedure: e.target.value })}
                      placeholder="记录保存程序（原则 7）"
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                    <input
                      defaultValue={h.responsibleParty ?? ""}
                      onBlur={(e) => update(step.id, h.id, { responsibleParty: e.target.value })}
                      placeholder="责任人"
                      className="rounded-md border border-slate-300 px-2 py-1 text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          );
        })}
    </div>
  );
}
