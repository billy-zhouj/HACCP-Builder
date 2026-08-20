// Central SEO constants. Set NEXT_PUBLIC_SITE_URL in your environment once
// deployed (e.g. https://haccp-builder.onrender.com) — every piece of
// metadata, the sitemap, robots.txt, and the JSON-LD structured data below
// all derive from this single value.
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://haccp-builder.onrender.com").replace(/\/$/, "");

export const SITE_NAME = "HACCP 计划生成器";

export const SITE_TITLE = "HACCP 计划生成器——面向美国和加拿大食品企业的 HACCP 计划工具";

export const SITE_DESCRIPTION =
  "为任何食品企业编制正式的 HACCP 计划（Codex/NACMCF 5 个预备步骤 + 7 项原则）：危害分析、CCP 判定、配方与过敏原控制、召回规划，以及可供审计的直接导出——满足 FDA HARPC（21 CFR 117）、FDA 海产品/果汁 HACCP、USDA FSIS HACCP 以及 CFIA/SFCR 预防控制要求。";

export const SITE_KEYWORDS = [
  "HACCP",
  "HACCP 计划生成器",
  "HACCP 软件",
  "危害分析",
  "关键控制点",
  "CCP 判定",
  "Codex Alimentarius",
  "NACMCF",
  "FSMA",
  "HARPC",
  "21 CFR 117",
  "21 CFR 123",
  "21 CFR 120",
  "9 CFR 417",
  "FDA 食品安全计划",
  "USDA FSIS HACCP",
  "CFIA",
  "加拿大食品安全条例",
  "SFCR",
  "预防控制计划",
  "食品安全计划",
  "过敏原控制",
  "食品召回计划",
];
