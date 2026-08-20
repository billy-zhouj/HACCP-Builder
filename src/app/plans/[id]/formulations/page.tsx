"use client";

import { useEffect, useState } from "react";
import ProductSelector from "@/components/ProductSelector";
import AllergenChecklist from "@/components/AllergenChecklist";
import GuidancePanel from "@/components/GuidancePanel";
import type { VendorData } from "@/types";

interface IngredientData {
  id: string;
  name: string;
  percentageOfFormulation: string | null;
  functionalRole: string | null;
  supplierVendorId: string | null;
  countryOfOrigin: string | null;
  isAllergen: boolean;
  allergenType: string | null;
  notes: string | null;
}

interface ProductData {
  id: string;
  name: string;
  ingredients: IngredientData[];
}

export default function FormulationsPage({ params }: { params: { id: string } }) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load(keepActive = true) {
    const plan = await fetch(`/api/plans/${params.id}`).then((r) => r.json());
    setProducts(plan.products ?? []);
    setVendors(plan.vendors ?? []);
    if (!keepActive || !activeId) setActiveId(plan.products?.[0]?.id ?? null);
    setLoading(false);
  }

  useEffect(() => {
    load(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const active = products.find((p) => p.id === activeId) ?? null;

  async function addIngredient() {
    if (!active) return;
    await fetch(`/api/plans/${params.id}/products/${active.id}/ingredients`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "新原料" }),
    });
    load();
  }

  async function updateIngredient(ingredientId: string, patch: Partial<IngredientData>) {
    if (!active) return;
    setProducts((ps) =>
      ps.map((p) =>
        p.id === active.id
          ? { ...p, ingredients: p.ingredients.map((i) => (i.id === ingredientId ? { ...i, ...patch } : i)) }
          : p
      )
    );
    await fetch(`/api/plans/${params.id}/products/${active.id}/ingredients/${ingredientId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function removeIngredient(ingredientId: string) {
    if (!active) return;
    await fetch(`/api/plans/${params.id}/products/${active.id}/ingredients/${ingredientId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">加载中…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">配方</h1>
      <p className="mt-1 text-sm text-slate-600">
        所选产品的原料级详细信息。此处的过敏原标记会自动在危害分析步骤建议交叉接触危害，并驱动过敏原控制 SOP 中该产品的过敏原声明。
      </p>

      <GuidancePanel title="美国与加拿大优先过敏原">
        共有：牛奶、鸡蛋、鱼类、甲壳贝类、坚果、花生、小麦、大豆、芝麻。加拿大还要求：芥末、小麦以外的麸质来源（大麦、黑麦、燕麦、黑小麦），以及添加亚硫酸盐 ≥10 ppm。
      </GuidancePanel>

      <ProductSelector products={products} activeProductId={activeId} onSelect={setActiveId} />

      {active && (
        <div className="space-y-4">
          {active.ingredients.map((i) => (
            <div key={i.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  defaultValue={i.name}
                  onBlur={(e) => updateIngredient(i.id, { name: e.target.value })}
                  placeholder="原料名称"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  defaultValue={i.percentageOfFormulation ?? ""}
                  onBlur={(e) => updateIngredient(i.id, { percentageOfFormulation: e.target.value })}
                  placeholder="配方占比（如 12.5%）"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  defaultValue={i.functionalRole ?? ""}
                  onBlur={(e) => updateIngredient(i.id, { functionalRole: e.target.value })}
                  placeholder="功能作用（如：防腐剂）"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  defaultValue={i.countryOfOrigin ?? ""}
                  onBlur={(e) => updateIngredient(i.id, { countryOfOrigin: e.target.value })}
                  placeholder="原产国"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <select
                  defaultValue={i.supplierVendorId ?? ""}
                  onChange={(e) => updateIngredient(i.id, { supplierVendorId: e.target.value || null })}
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">未关联供应商</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={i.isAllergen}
                    onChange={(e) => updateIngredient(i.id, { isAllergen: e.target.checked })}
                  />
                  含有过敏原
                </label>
              </div>

              {i.isAllergen && (
                <div className="mt-3">
                  <AllergenChecklist
                    value={i.allergenType ?? ""}
                    onChange={(next) => updateIngredient(i.id, { allergenType: next })}
                  />
                </div>
              )}

              <textarea
                defaultValue={i.notes ?? ""}
                onBlur={(e) => updateIngredient(i.id, { notes: e.target.value })}
                placeholder="备注"
                rows={1}
                className="mt-3 w-full rounded-md border border-slate-300 px-3 py-2 text-xs"
              />

              <button onClick={() => removeIngredient(i.id)} className="mt-3 text-xs font-medium text-red-600 hover:underline">
                删除原料
              </button>
            </div>
          ))}

          <button
            onClick={addIngredient}
            className="rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
          >
            + 添加原料
          </button>
        </div>
      )}
    </div>
  );
}
