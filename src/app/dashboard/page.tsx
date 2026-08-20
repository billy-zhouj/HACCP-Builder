import Link from "next/link";
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";

export const metadata = { title: "控制台" };

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const plans = await db.plan.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    include: { products: { select: { id: true } } },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">您的 HACCP 计划</h1>
        <Link
          href="/plans/new"
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
        >
          + 新建计划
        </Link>
      </div>

      {plans.length === 0 ? (
        <p className="mt-8 rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
          您还没有任何计划。创建一个开始吧。
        </p>
      ) : (
        <ul className="mt-8 space-y-3">
          {plans.map((p) => (
            <li key={p.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{p.name}</p>
                  <p className="text-xs text-slate-500">
                    状态：{p.status} · {p.products.length} 个产品 ·{" "}
                    {p.isPaid ? "已解锁" : "尚未解锁"}
                  </p>
                </div>
                <Link
                  href={`/plans/${p.id}/facility`}
                  className="rounded-md border border-brand-200 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-50"
                >
                  打开
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
