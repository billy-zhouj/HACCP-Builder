export default function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8 text-xs text-slate-400">
        <p>
          HACCP 计划生成器协助编制符合《国际食品法典委员会》(Codex Alimentarius) / NACMCF
          结构的 HACCP 计划。它不能替代企业食品安全负责人的审核与签署，也不代表相关机构对您计划的认可。
        </p>
        <p className="mt-2">&copy; {new Date().getFullYear()} HACCP 计划生成器。</p>
      </div>
    </footer>
  );
}
