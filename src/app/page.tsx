import Link from "next/link";

const steps = [
  { title: "企业概况", desc: "告诉我们您的企业信息以及适用的美国和/或加拿大法规范围。" },
  { title: "HACCP 团队", desc: "预备步骤 1——组建负责本计划的多学科团队。" },
  { title: "GMP 与前提方案", desc: "美国 21 CFR Part 117 Subpart B 与 CFIA 前提方案——卫生、清洁消毒、虫害控制、培训等。" },
  { title: "供应商", desc: "建立您的合格供应商清单、保证书和认证。" },
  { title: "产品", desc: "预备步骤 2 和 3——描述每个产品、其分销、预期用途和消费者。" },
  { title: "工艺流程", desc: "预备步骤 4 和 5——绘制流程图并在现场确认。" },
  { title: "配方", desc: "原料级详细信息，包含美国/加拿大过敏原标记，并与合格供应商清单关联。" },
  { title: "危害分析", desc: "原则 1——每个步骤的生物、化学、物理和放射性危害，提供预填与过敏原驱动的建议。" },
  { title: "CCP 判定", desc: "原则 2——Codex 四问判定树，每次作答后服务端重新评估。" },
  { title: "预防控制措施", desc: "原则 3-7——关键限值、监控、纠正措施、验证、记录保存。" },
  { title: "召回计划", desc: "指定召回团队角色和联系人，并跟踪年度模拟召回。" },
  { title: "SOP", desc: "按产品过敏原声明、供应商验证、HACCP 计划验证与再评估等。" },
  { title: "审核与导出", desc: "以 Word 文档形式下载格式化、可审计的 HACCP 计划。" },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          HACCP 计划生成器——面向中国中小食品企业运营者
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
          一步一步构建符合国际标准的 HACCP 计划
        </h1>
        <div className="mx-auto mt-4 max-w-2xl space-y-3 text-left text-base text-slate-600">
          <p>
            本向导严格遵循 <strong className="text-slate-700">Codex Alimentarius / NACMCF</strong> 的 HACCP
            框架，引导您逐步完成<strong className="text-slate-700">5 个预备步骤</strong>与<strong className="text-slate-700">7 项核心原则</strong>，一步一步构建符合国际标准（包括加拿大 CFIA、美国 FDA 水产品、果汁以及美国农业部 FSIS 肉禽 HACCP 法定要求）的 HACCP 计划。
          </p>
          <p className="pt-2 text-slate-500">
            如需要为多个产品分别建立计划，逐个添加产品，即可自动生成各自的工艺流程、配方与危害分析。
          </p>
        </div>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/register"
            className="rounded-md bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-brand-700"
          >
            开始创建计划
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-white"
          >
            查看价格
          </Link>
        </div>
      </div>

      <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
              {i + 1}
            </div>
            <h3 className="mt-3 font-semibold text-slate-900">{s.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
          </div>
        ))}
      </div>

      <p className="mt-16 text-center text-xs text-slate-400">
        本工具仅协助起草 HACCP 计划，不能替代贵企业负责食品安全的主管人员、食品安全顾问或相关机构的审核。
      </p>
    </main>
  );
}
