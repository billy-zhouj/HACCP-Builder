// Central SEO constants. Set NEXT_PUBLIC_SITE_URL in your environment once
// deployed (e.g. https://haccp-builder.onrender.com) — every piece of
// metadata, the sitemap, robots.txt, and the JSON-LD structured data below
// all derive from this single value.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haccp-builder.onrender.com").replace(/\/$/, "");

export const SITE_NAME = "HACCP 计划生成器";

export const SITE_TITLE = "HACCP 计划生成器——面向中国中小食品企业的 HACCP 计划工具";

export const SITE_DESCRIPTION =
  "为任何食品企业编制正式的 HACCP 计划（Codex/NACMCF 5 个预备步骤 + 7 项原则）：危害分析、CCP 判定、配方与过敏原控制、召回规划，以及可供审计的直接导出——符合国际公认的 HACCP 实施框架。";

export const SITE_KEYWORDS = [
  "HACCP",
  "HACCP 计划生成器",
  "HACCP 软件",
  "危害分析",
  "关键控制点",
  "CCP 判定",
  "Codex Alimentarius",
  "NACMCF",
  "预防控制计划",
  "食品安全计划",
  "过敏原控制",
  "食品召回计划",
  "HACCP 计划模板",
  "食品安全管理体系",
];
