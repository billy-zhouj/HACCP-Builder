"use client";

import { useEffect, useState } from "react";
import { FOOD_CATEGORIES } from "@/lib/foodCategories";

interface ProductData {
  id: string;
  name: string;
  foodCategory: string | null;
  foodSubcategory: string | null;
  productDescription: string | null;
  intendedUse: string | null;
  intendedConsumer: string | null;
  packagingType: string | null;
  shelfLifeAndStorage: string | null;
}

export default function ProductsPage({ params }: { params: { id: string } }) {
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const plan = await fetch(`/api/plans/${params.id}`).then((r) => r.json());
    setProducts(plan.products ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, [params.id]);

  async function addProduct() {
    await fetch(`/api/plans/${params.id}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "新产品" }),
    });
    load();
  }

  async function updateProduct(productId: string, patch: Partial<ProductData>) {
    setProducts((ps) => ps.map((p) => (p.id === productId ? { ...p, ...patch } : p)));
    await fetch(`/api/plans/${params.id}/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  }

  async function removeProduct(productId: string) {
    await fetch(`/api/plans/${params.id}/products/${productId}`, { method: "DELETE" });
    load();
  }

  if (loading) return <p className="text-sm text-slate-500">加载中…</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">产品（预备步骤 2 和 3）</h1>
      <p className="mt-1 text-sm text-slate-600">
        添加本企业生产的每个产品。每个产品在后续步骤中都有各自的工艺流程、配方和危害分析。
      </p>

      <div className="mt-4 space-y-4">
        {products.map((p) => {
          const selectedCategory = FOOD_CATEGORIES.find((c) => c.id === p.foodCategory);
          return (
            <div key={p.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <input
                value={p.name}
                onChange={(e) => updateProduct(p.id, { name: e.target.value })}
                placeholder="产品名称"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold"
              />
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-slate-500">食品大类</label>
                  <select
                    value={p.foodCategory ?? ""}
                    onChange={(e) => {
                      const cat = e.target.value || null;
                      updateProduct(p.id, { foodCategory: cat, foodSubcategory: null });
                    }}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">请选择食品大类…</option>
                    {FOOD_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500">食品子类</label>
                  <select
                    value={p.foodSubcategory ?? ""}
                    onChange={(e) => updateProduct(p.id, { foodSubcategory: e.target.value || null })}
                    disabled={!selectedCategory}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">请选择食品子类…</option>
                    {selectedCategory?.subcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <textarea
                value={p.productDescription ?? ""}
                onChange={(e) => updateProduct(p.id, { productDescription: e.target.value })}
                placeholder="产品描述与分销（成分构成、加工方式、分销方式）"
                rows={2}
                className="mt-2 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  value={p.intendedUse ?? ""}
                  onChange={(e) => updateProduct(p.id, { intendedUse: e.target.value })}
                  placeholder="预期用途（如：即食、需烹饪后食用）"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={p.intendedConsumer ?? ""}
                  onChange={(e) => updateProduct(p.id, { intendedConsumer: e.target.value })}
                  placeholder="预期消费者（一般公众 / 易感人群）"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={p.packagingType ?? ""}
                  onChange={(e) => updateProduct(p.id, { packagingType: e.target.value })}
                  placeholder="包装类型"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={p.shelfLifeAndStorage ?? ""}
                  onChange={(e) => updateProduct(p.id, { shelfLifeAndStorage: e.target.value })}
                  placeholder="保质期与储存"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <button onClick={() => removeProduct(p.id)} className="mt-3 text-xs font-medium text-red-600 hover:underline">
                删除产品
              </button>
            </div>
          );
        })}
        <button
          onClick={addProduct}
          className="rounded-md border border-brand-200 bg-brand-50 px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
        >
          + 添加产品
        </button>
      </div>
    </div>
  );
}
