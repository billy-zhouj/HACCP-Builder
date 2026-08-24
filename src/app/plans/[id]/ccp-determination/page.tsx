"use client";

import { useEffect, useState } from "react";
import ProductSelector from "@/components/ProductSelector";
import DecisionTreeGuide from "@/components/DecisionTreeGuide";
import { evaluateDecisionTree, describeAnswerPath, type DecisionTreeAnswers } from "@/lib/ccpDecisionTree";

interface Hazard {
  id: string;
  type: string;
  description: string;
  requiresPreventiveControl: boolean;
  ccpQ1CanBeControlledByPrp: boolean | null;
  ccpQ2HasSpecificControlMeasures: boolean | null;
  ccpQ3WillLaterStepPreventOrEliminate: boolean | null;
  ccpQ4CanStepPreventOrEliminate: boolean | null;
  ccpStatus: string;
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

function toAnswers(h: Hazard): DecisionTreeAnswers {
  return {
    q1CanBeControlledByPrp: h.ccpQ1CanBeControlledByPrp,
    q2HasSpecificControlMeasures: h.ccpQ2HasSpecificControlMeasures,
    q3WillLaterStepPreventOrEliminate: h.ccpQ3WillLaterStepPreventOrEliminate,
    q4CanStepPreventOrEliminate: h.ccpQ4CanStepPreventOrEliminate,
  };
}

export default function CcpDeterminationPage({ params }: { params: { id: string } }) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

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

  async function answer(stepId: string, hazardId: string, field: keyof DecisionTreeAnswers, value: boolean) {
    if (!active) return;
    const fieldMap: Record<keyof DecisionTreeAnswers, string> = {
      q1CanBeControlledByPrp: "ccpQ1CanBeControlledByPrp",
      q2HasSpecificControlMeasures: "ccpQ2HasSpecificControlMeasures",
      q3WillLaterStepPreventOrEliminate: "ccpQ3WillLaterStepPreventOrEliminate",
      q4CanStepPreventOrEliminate: "ccpQ4CanStepPreventOrEliminate",
    };
    await fetch(`/api/plans/${params.id}/products/${active.id}/process-steps/${stepId}/hazards/${hazardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [fieldMap[field]]: value }),
    });
    load();
  }

  async function resetStep(stepId: string) {
    if (!active) return;
    if (!confirm("将该步骤所有危害恢复为未评定状态？此操作将清除全部四问作答。")) return;
    await fetch(`/api/plans/${params.id}/products/${active.id}/process-steps/${stepId}/reset-ccp`, { method: "POST" });
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">加载中…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">CCP 判定（原则 2）</h1>
      <p className="mt-1 text-sm text-slate-600">
        让每个重大危害通过 Codex 四问判定树（2022 修订版，CXC 1-1969 附件 IV 图 1：前提方案控制 →
        本步骤特定控制措施 → 后续步骤控制 → 本步骤控制能力）。
      </p>
      <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        判定树已升级为 Codex 2022 修订版。此前的四问（经典版）作答不会自动沿用——请对每个重大危害重新判定。
      </p>
      <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
        <input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />
        显示所有危害（不仅限于标记为重大的）
      </label>

      <ProductSelector products={products} activeProductId={activeId} onSelect={setActiveId} />

      {active &&
        [...active.processSteps].sort((a, b) => a.order - b.order).map((step) => {
          const hazards = step.hazards.filter((h) => showAll || h.requiresPreventiveControl);
          if (hazards.length === 0) return null;
          return (
            <div key={step.id} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
              <h2 className="flex items-center justify-between text-sm font-semibold text-slate-800">
                <span>
                  步骤 {step.order}：{step.name}
                </span>
                <button
                  onClick={() => resetStep(step.id)}
                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                >
                  重新评定
                </button>
              </h2>
              <div className="mt-3 space-y-4">
                {hazards.map((h) => {
                  const answers = toAnswers(h);
                  const result = evaluateDecisionTree(answers);
                  return (
                    <div key={h.id} className="rounded-md border border-slate-100 bg-slate-50 p-3">
                      <p className="text-sm font-medium text-slate-800">
                        {h.type}: {h.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{describeAnswerPath(answers) || "暂无作答"}</p>
                      <p
                        className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                          result.status === "CCP"
                            ? "bg-red-100 text-red-700"
                            : result.status === "NOT_A_CCP"
                            ? "bg-slate-200 text-slate-700"
                            : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {result.status}
                      </p>
                      {result.reason && <p className="mt-1 text-xs text-slate-600">{result.reason}</p>}

                      {result.nextQuestion && (
                        <>
                          <DecisionTreeGuide nextQuestion={result.nextQuestion} />
                          <div className="flex gap-2">
                            <button
                              onClick={() => answer(step.id, h.id, result.nextQuestion!, true)}
                              className="rounded-md bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                            >
                              是
                            </button>
                            <button
                              onClick={() => answer(step.id, h.id, result.nextQuestion!, false)}
                              className="rounded-md border border-slate-300 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              否
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
    </div>
  );
}
