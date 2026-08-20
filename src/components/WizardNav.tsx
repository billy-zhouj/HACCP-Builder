"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STEPS = [
  { slug: "facility", label: "1. 企业概况" },
  { slug: "haccp-team", label: "2. HACCP 团队（预备步骤 1）" },
  { slug: "gmp", label: "3. GMP 与前提方案" },
  { slug: "vendors", label: "4. 供应商" },
  { slug: "products", label: "5. 产品（预备步骤 2 和 3）" },
  { slug: "process-flow", label: "6. 工艺流程（预备步骤 4 和 5）" },
  { slug: "formulations", label: "7. 配方" },
  { slug: "hazard-analysis", label: "8. 危害分析（原则 1）" },
  { slug: "ccp-determination", label: "9. CCP 判定（原则 2）" },
  { slug: "preventive-controls", label: "10. 预防控制措施（原则 3-7）" },
  { slug: "recall", label: "11. 召回计划" },
  { slug: "sops", label: "12. SOP" },
  { slug: "review-export", label: "13. 审核与导出" },
];

export default function WizardNav({ planId }: { planId: string }) {
  const pathname = usePathname();

  return (
    <nav className="w-full shrink-0 sm:w-64">
      <ul className="space-y-1">
        {STEPS.map((step) => {
          const href = `/plans/${planId}/${step.slug}`;
          const active = pathname === href;
          return (
            <li key={step.slug}>
              <Link
                href={href}
                className={`block rounded-md px-3 py-2 text-sm ${
                  active ? "bg-brand-600 text-white" : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {step.label}
              </Link>
            </li>
          );
        })}
      </ul>
      <Link href="/dashboard" className="mt-4 block text-xs text-slate-400 hover:text-slate-600">
        ← 返回控制台
      </Link>
    </nav>
  );
}
