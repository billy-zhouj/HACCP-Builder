import Link from "next/link";

export const metadata = { title: "价格" };

export default function PricingPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-900">简单、按计划计费</h1>
      <p className="mt-3 text-slate-600">
        免费构建和编辑任意数量的 HACCP 计划。每个计划一次性付费即可解锁格式化 Word
        导出。可选的存储订阅能让每个计划无限期保留，而不是使用默认的保留期限。
      </p>

      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">计划解锁</h2>
          <p className="mt-1 text-3xl font-bold text-slate-900">一次性费用</p>
          <p className="mt-2 text-sm text-slate-600">
            解锁单个 HACCP 计划的可审计 .docx 导出。解锁前后编辑均免费且不受限制。
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">存储订阅</h2>
          <p className="mt-1 text-3xl font-bold text-slate-900">循环、可选</p>
          <p className="mt-2 text-sm text-slate-600">
            无限期保存您的所有计划，而非在默认保留期限后过期。可随时取消——取消后计划将恢复为标准保留期限。
          </p>
        </div>
      </div>

      <p className="mt-10 text-sm text-slate-500">
        计费通过 Stripe 进行。在某个部署真正配置计费之前，提供开发模式的&ldquo;模拟解锁&rdquo;选项，使整个向导（包括导出）无需真实支付凭据即可端到端测试。
      </p>

      <div className="mt-10">
        <Link href="/register" className="rounded-md bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700">
          开始创建计划
        </Link>
      </div>
    </main>
  );
}
