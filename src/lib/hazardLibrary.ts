/**
 * Starter hazard suggestions keyed by common process-step names, to give
 * first-time users a running start on hazard analysis (Principle 1). This
 * is a seed list, not a substitute for a facility-specific hazard
 * analysis — the UI always lets users edit, remove, or add hazards freely.
 *
 * Also includes formulation-driven suggestions: an ingredient flagged as
 * an allergen on the Formulations step suggests an allergen cross-contact
 * hazard at the process steps where cross-contact risk is highest
 * (receiving, mixing/formulation, packaging, and allergen changeover/
 * rework) — a HACCP-Builder addition with no equivalent in the reference
 * app, since ingredient-level formulation data doesn't exist there.
 */

export type HazardTypeKey = "BIOLOGICAL" | "CHEMICAL" | "PHYSICAL" | "RADIOLOGICAL";

export interface HazardSuggestion {
  type: HazardTypeKey;
  description: string;
}

export const COMMON_STEP_NAMES = [
  "收货（原料接收）",
  "冷藏储存",
  "冷冻储存",
  "干储存",
  "清洗/漂洗",
  "切割/切片",
  "混合/调配",
  "加热/热处理",
  "冷却",
  "包装",
  "贴标",
  "金属检测/X 射线",
  "筛分",
  "脱水/干燥",
  "斩拌",
  "高速切割",
  "成型",
  "灌装",
  "填充/灌肠",
  "油炸",
  "蒸制",
  "烟熏",
  "腌制",
  "萃取/提取",
  "冷冻库储存",
  "过敏原转产/返工",
  "发运",
] as const;

const LIBRARY: Record<string, HazardSuggestion[]> = {
  "收货（原料接收）": [
    { type: "BIOLOGICAL", description: "来料原料带入的病原体污染" },
    { type: "CHEMICAL", description: "标签错误或交叉污染原料中的未申报过敏原" },
    { type: "CHEMICAL", description: "农药残留或兽药残留超过限量" },
    { type: "PHYSICAL", description: "来料中的异物（玻璃、金属、塑料）" },
  ],
  "冷藏储存": [
    { type: "BIOLOGICAL", description: "温度滥用导致病原体生长或毒素形成" },
  ],
  "冷冻储存": [
    { type: "BIOLOGICAL", description: "冷冻温度控制不当导致病原体存活/生长" },
  ],
  "干储存": [
    { type: "BIOLOGICAL", description: "受潮导致的霉菌生长" },
    { type: "PHYSICAL", description: "干储区的虫害污染" },
  ],
  "清洗/漂洗": [
    { type: "BIOLOGICAL", description: "清洗用水或共用设备造成的交叉污染" },
    { type: "CHEMICAL", description: "消毒剂残留超过安全水平" },
  ],
  "切割/切片": [
    { type: "BIOLOGICAL", description: "设备或人员造成的交叉污染" },
    { type: "PHYSICAL", description: "刀片或磨损设备产生的金属碎片" },
  ],
  "混合/调配": [
    { type: "CHEMICAL", description: "过敏原或添加剂配比错误" },
    { type: "CHEMICAL", description: "化学防腐剂/添加剂过量使用" },
  ],
  "加热/热处理": [
    { type: "BIOLOGICAL", description: "时间/温度不足导致病原体存活" },
  ],
  "冷却": [
    { type: "BIOLOGICAL", description: "冷却过慢导致产芽孢病原体生长（如产气荚膜梭菌、蜡样芽孢杆菌）" },
  ],
  "包装": [
    { type: "BIOLOGICAL", description: "包装材料或环境造成的加工后污染" },
    { type: "CHEMICAL", description: "包装/标签匹配错误导致未申报过敏原" },
  ],
  "贴标": [{ type: "CHEMICAL", description: "标签上缺失或错误的过敏原声明" }],
  "金属检测/X 射线": [
    { type: "PHYSICAL", description: "设备故障导致金属或高密度异物未被检出" },
  ],
  "筛分": [{ type: "PHYSICAL", description: "筛网破损或网目不当导致异物未被去除" }],
  "脱水/干燥": [
    { type: "BIOLOGICAL", description: "水分活度（Aw）降低不足导致病原体存活" },
  ],
  "斩拌": [
    { type: "BIOLOGICAL", description: "设备或人员造成的交叉污染" },
    { type: "PHYSICAL", description: "刀片或磨损设备产生的金属碎片" },
  ],
  "高速切割": [
    { type: "PHYSICAL", description: "高速运转时刀片磨损或断裂产生的金属碎片" },
    { type: "BIOLOGICAL", description: "设备或人员造成的交叉污染" },
  ],
  "成型": [{ type: "PHYSICAL", description: "成型设备或模具带入的异物" }],
  "灌装": [
    { type: "BIOLOGICAL", description: "灌装机或环境造成的加工后污染" },
    { type: "PHYSICAL", description: "灌装设备带入的异物" },
  ],
  "填充/灌肠": [
    { type: "BIOLOGICAL", description: "肠衣、设备或人员造成的交叉污染" },
    { type: "PHYSICAL", description: "肠衣或设备碎片进入产品" },
  ],
  "油炸": [
    { type: "BIOLOGICAL", description: "油温或时间不足导致病原体存活" },
    { type: "CHEMICAL", description: "油过热或劣化产生的丙烯酰胺/油脂分解产物" },
  ],
  "蒸制": [{ type: "BIOLOGICAL", description: "蒸汽时间/温度不足导致病原体存活" }],
  "烟熏": [
    { type: "BIOLOGICAL", description: "时间/温度或 Aw 不当导致病原体存活或生长（如肉毒梭菌、单核细胞增生李斯特菌）" },
    { type: "CHEMICAL", description: "烟雾中的多环芳烃（PAH）沉积" },
  ],
  "腌制": [
    { type: "BIOLOGICAL", description: "腌制盐或工艺控制不当导致肉毒梭菌生长或产毒" },
    { type: "CHEMICAL", description: "亚硝酸盐/硝酸盐过量使用超过法规限量" },
  ],
  "萃取/提取": [
    { type: "CHEMICAL", description: "萃取溶剂残留超过可接受限量" },
    { type: "BIOLOGICAL", description: "萃取设备或工艺用水造成的污染" },
  ],
  "冷冻库储存": [
    { type: "BIOLOGICAL", description: "冷冻温度控制不当导致病原体存活/生长" },
  ],
  "过敏原转产/返工": [
    { type: "CHEMICAL", description: "转产清洁不当或返工处理不当导致未申报过敏原交叉接触" },
  ],
  "发运": [{ type: "BIOLOGICAL", description: "运输过程中的温度滥用" }],
};

/** Keywords that mark a process step as the receiving step, even when the
 *  user renames it (e.g. "接收活罗非鱼", "原料验收"). */
const RECEIVING_STEP_KEYWORDS = ["收货", "接收", "验收"];

export function isReceivingStepName(stepName: string): boolean {
  return RECEIVING_STEP_KEYWORDS.some((k) => stepName.includes(k));
}

export function suggestHazardsForStep(stepName: string): HazardSuggestion[] {
  const exact = LIBRARY[stepName];
  if (exact) return exact;
  // Fallback: a renamed step that still embeds a known step name (e.g.
  // "烤箱烘烤面包" contains "加热/热处理" → no; but "包装后冷藏" contains
  // "包装"). Longest matching key wins to avoid partial-key collisions.
  const matches = Object.keys(LIBRARY).filter((key) => stepName.includes(key));
  if (matches.length > 0) {
    matches.sort((a, b) => b.length - a.length);
    return LIBRARY[matches[0]] ?? [];
  }
  return [];
}

/**
 * Receiving-step hazard suggestions driven by the product's two-level food
 * category (selected at product creation). Returns the subcategory-specific
 * list when available, falls back to the major-category list, then to the
 * generic receiving suggestions (LIBRARY) when no category is set.
 *
 * Note: only the 收货（原料接收）step consumes food category data — other
 * steps keep the step-name based LIBRARY above.
 */
const RECEIVING_CATEGORY_HAZARDS: Record<string, Record<string, HazardSuggestion[]>> = {
  "01.0": {
    "01.01": [
      { type: "BIOLOGICAL", description: "生乳中的病原体污染（沙门氏菌、单核细胞增生李斯特菌、致病性大肠杆菌）" },
      { type: "BIOLOGICAL", description: "来自生乳的布氏杆菌/结核杆菌（人畜共患）" },
      { type: "CHEMICAL", description: "原料乳中的兽药残留（抗生素）超标" },
      { type: "CHEMICAL", description: "原料乳中的黄曲霉毒素 M1 超标" },
    ],
    "01.02": [
      { type: "BIOLOGICAL", description: "生乳/发酵原料中的病原体污染" },
      { type: "BIOLOGICAL", description: "发酵剂污染导致有害微生物生长" },
      { type: "CHEMICAL", description: "原料乳中的抗生素残留（影响发酵）" },
      { type: "CHEMICAL", description: "原料乳中的黄曲霉毒素 M1 超标" },
    ],
    "01.03": [
      { type: "BIOLOGICAL", description: "乳粉原料中的沙门氏菌/阪崎肠杆菌（Cronobacter）污染" },
      { type: "BIOLOGICAL", description: "浓缩/干燥前原料乳中的病原体" },
      { type: "CHEMICAL", description: "原料乳中的兽药残留（抗生素）超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳）" },
    ],
    "01.04": [
      { type: "BIOLOGICAL", description: "原料乳中的病原体污染（沙门氏菌、单核细胞增生李斯特菌）" },
      { type: "BIOLOGICAL", description: "浓缩过程中芽孢残留" },
      { type: "CHEMICAL", description: "原料乳中的兽药残留（抗生素）超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳）" },
    ],
    "01.05": [
      { type: "BIOLOGICAL", description: "生乳/稀奶油原料中的单核细胞增生李斯特菌污染" },
      { type: "BIOLOGICAL", description: "未充分巴氏杀菌原料中的病原体" },
      { type: "CHEMICAL", description: "原料乳中的兽药残留（抗生素）超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳）" },
    ],
    "01.06": [
      { type: "BIOLOGICAL", description: "生乳中的单核细胞增生李斯特菌/沙门氏菌污染" },
      { type: "BIOLOGICAL", description: "未充分巴氏杀菌原料乳中的病原体" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳）" },
      { type: "CHEMICAL", description: "原料乳中的兽药残留（抗生素）超标" },
    ],
    "01.07": [
      { type: "BIOLOGICAL", description: "乳、蛋、坚果等配料中的病原体污染" },
      { type: "BIOLOGICAL", description: "即食风味配料中的单核细胞增生李斯特菌污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、蛋、坚果、麸质）" },
      { type: "CHEMICAL", description: "原料乳中的兽药残留（抗生素）超标" },
    ],
    "01.08": [
      { type: "BIOLOGICAL", description: "乳清粉/酪蛋白等原料中的沙门氏菌污染" },
      { type: "BIOLOGICAL", description: "原料乳中的病原体污染" },
      { type: "CHEMICAL", description: "原料乳中的兽药残留（抗生素）超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳）" },
    ],
  },
  "02.0": {
    "02.01": [
      { type: "BIOLOGICAL", description: "油料原料中的霉菌毒素（黄曲霉毒素）" },
      { type: "CHEMICAL", description: "原料油中的溶剂残留超标（浸出油）" },
      { type: "CHEMICAL", description: "原料中的重金属污染（砷、铅）" },
      { type: "CHEMICAL", description: "苯并（a）芘等多环芳烃超标" },
    ],
    "02.02": [
      { type: "BIOLOGICAL", description: "蛋、乳原料中的病原体污染（沙门氏菌、单核细胞增生李斯特菌）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（蛋、乳）" },
      { type: "CHEMICAL", description: "原料中的重金属污染" },
      { type: "CHEMICAL", description: "反式脂肪酸超标（氢化油原料）" },
    ],
    "02.03": [
      { type: "BIOLOGICAL", description: "油脂乳化原料中的微生物污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳）" },
      { type: "CHEMICAL", description: "反式脂肪酸超标（氢化油原料）" },
    ],
    "02.04": [
      { type: "BIOLOGICAL", description: "乳、蛋、奶油原料中的病原体污染（沙门氏菌、单核细胞增生李斯特菌）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、蛋、坚果）" },
      { type: "CHEMICAL", description: "反式脂肪酸超标（氢化油原料）" },
    ],
    "02.05": [
      { type: "BIOLOGICAL", description: "油料原料中的霉菌毒素（黄曲霉毒素）" },
      { type: "CHEMICAL", description: "原料油中的溶剂残留超标（浸出油）" },
      { type: "CHEMICAL", description: "原料中的重金属污染（砷、铅）" },
    ],
  },
  "03.0": {
    "03.01": [
      { type: "BIOLOGICAL", description: "乳、蛋原料中的病原体污染（沙门氏菌、单核细胞增生李斯特菌）" },
      { type: "BIOLOGICAL", description: "未杀菌原料中的致病菌存活" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、蛋、坚果）" },
      { type: "CHEMICAL", description: "原料乳中的兽药残留（抗生素）超标" },
    ],
    "03.03": [
      { type: "BIOLOGICAL", description: "果汁/水果原料中的病原体污染（沙门氏菌、大肠杆菌）" },
      { type: "CHEMICAL", description: "原料水果中的农药残留超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、水果致敏原）" },
      { type: "CHEMICAL", description: "原料中的甜味剂/色素超标" },
    ],
    "03.04": [
      { type: "BIOLOGICAL", description: "工艺用水中的病原体污染（水源污染）" },
      { type: "CHEMICAL", description: "水中重金属/化学污染（铅、硝酸盐）" },
    ],
    "03.05": [
      { type: "BIOLOGICAL", description: "冷冻饮品原料中的病原体污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触" },
      { type: "CHEMICAL", description: "原料中的添加剂超标" },
    ],
  },
  "04.0": {
    "04.01": [
      { type: "BIOLOGICAL", description: "生鲜水果中的病原体污染（沙门氏菌、致病性大肠杆菌）" },
      { type: "BIOLOGICAL", description: "灌溉水污染导致的病毒污染（诺如病毒、甲肝）" },
      { type: "CHEMICAL", description: "水果中的农药残留超标" },
      { type: "CHEMICAL", description: "果干/加工水果中的二氧化硫残留超标（亚硫酸盐）" },
    ],
    "04.02": [
      { type: "BIOLOGICAL", description: "生鲜蔬菜中的病原体污染（沙门氏菌、致病性大肠杆菌）" },
      { type: "BIOLOGICAL", description: "蔬菜中的寄生虫（环孢子虫、隐孢子虫）" },
      { type: "BIOLOGICAL", description: "块根类蔬菜中的微生物污染（李斯特菌）" },
      { type: "CHEMICAL", description: "蔬菜中的农药残留超标" },
    ],
    "04.03": [
      { type: "BIOLOGICAL", description: "食用菌/藻类中的微生物污染（致病菌、霉菌）" },
      { type: "CHEMICAL", description: "食用菌/藻类中的重金属污染（镉、汞、铅）" },
      { type: "CHEMICAL", description: "农药残留超标" },
      { type: "PHYSICAL", description: "来料中的异物（泥沙、昆虫碎片）" },
    ],
    "04.04": [
      { type: "BIOLOGICAL", description: "豆类原料中的霉菌毒素污染（黄曲霉毒素）" },
      { type: "CHEMICAL", description: "豆类中的农药残留超标" },
      { type: "CHEMICAL", description: "未充分加工豆制品中的天然毒素（植物血凝素、皂苷）" },
      { type: "PHYSICAL", description: "原豆中的异物（石子、金属）" },
    ],
    "04.05": [
      { type: "BIOLOGICAL", description: "坚果/籽类原料中的黄曲霉毒素污染" },
      { type: "BIOLOGICAL", description: "低水分坚果/籽类中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（坚果、花生、芝麻）" },
      { type: "PHYSICAL", description: "坚果/籽类中的异物（壳片、石子）" },
    ],
  },
  "05.0": {
    "05.01": [
      { type: "BIOLOGICAL", description: "可可豆原料中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "可可原料中的重金属污染（镉、铅）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、坚果）" },
    ],
    "05.02": [
      { type: "BIOLOGICAL", description: "糖果原料中的沙门氏菌污染（低水分）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、坚果、蛋）" },
      { type: "PHYSICAL", description: "原料中的异物（金属、硬塑料）" },
    ],
    "05.03": [
      { type: "BIOLOGICAL", description: "胶基原料中的微生物污染（低水分）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、坚果）" },
      { type: "PHYSICAL", description: "原料中的异物（金属、硬塑料）" },
    ],
  },
  "06.0": {
    "06.01": [
      { type: "BIOLOGICAL", description: "谷物原料中的霉菌毒素污染（黄曲霉毒素、呕吐毒素）" },
      { type: "CHEMICAL", description: "谷物中的农药残留超标" },
      { type: "CHEMICAL", description: "重金属污染（镉、铅）" },
      { type: "PHYSICAL", description: "原粮中的异物（石子、金属、昆虫碎片）" },
    ],
    "06.02": [
      { type: "BIOLOGICAL", description: "大米原料中的霉菌毒素污染（黄曲霉毒素）" },
      { type: "BIOLOGICAL", description: "米制品原料中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "大米中的重金属污染（镉）" },
      { type: "CHEMICAL", description: "农药残留超标" },
    ],
    "06.03": [
      { type: "BIOLOGICAL", description: "面粉/米粉中的沙门氏菌污染（低水分谷物制品）" },
      { type: "BIOLOGICAL", description: "谷物原料中的霉菌毒素污染（黄曲霉毒素、呕吐毒素）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（麸质）" },
      { type: "PHYSICAL", description: "粉状原料中的异物（金属、织物、硬塑料）" },
    ],
    "06.04": [
      { type: "BIOLOGICAL", description: "杂粮粉原料中的霉菌毒素污染（黄曲霉毒素、呕吐毒素）" },
      { type: "BIOLOGICAL", description: "粉状杂粮中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（麸质）" },
      { type: "PHYSICAL", description: "粉状原料中的异物（金属、硬塑料）" },
    ],
    "06.05": [
      { type: "BIOLOGICAL", description: "淀粉原料中的微生物污染（低水分）" },
      { type: "CHEMICAL", description: "淀粉原料中的二氧化硫残留超标" },
      { type: "CHEMICAL", description: "重金属污染（砷）" },
      { type: "PHYSICAL", description: "淀粉原料中的异物（金属、织物）" },
    ],
    "06.06": [
      { type: "BIOLOGICAL", description: "杂粮原料中的霉菌毒素污染（黄曲霉毒素、呕吐毒素）" },
      { type: "BIOLOGICAL", description: "低酸罐头制品中的产芽孢病原体（肉毒梭菌）" },
      { type: "CHEMICAL", description: "重金属污染" },
    ],
    "06.07": [
      { type: "BIOLOGICAL", description: "方便米面原料中的沙门氏菌污染（低水分）" },
      { type: "BIOLOGICAL", description: "谷物原料中的霉菌毒素污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（麸质、乳、坚果）" },
      { type: "CHEMICAL", description: "油炸原料中的油脂酸败" },
    ],
    "06.08": [
      { type: "BIOLOGICAL", description: "冷冻米面制品原料中的致病菌污染" },
      { type: "BIOLOGICAL", description: "馅料（肉、菜、蛋）中的病原体污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（麸质、蛋、乳）" },
      { type: "PHYSICAL", description: "馅料中的异物（骨碎、金属）" },
    ],
    "06.09": [
      { type: "BIOLOGICAL", description: "谷物/淀粉原料中的霉菌毒素污染" },
      { type: "CHEMICAL", description: "原料中的丙烯酰胺前体物（还原糖、天冬酰胺）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（麸质、乳）" },
      { type: "PHYSICAL", description: "原料中的异物（金属、硬塑料）" },
    ],
    "06.10": [
      { type: "BIOLOGICAL", description: "蛋、乳、馅料原料中的病原体污染（沙门氏菌）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（蛋、乳、麸质）" },
      { type: "CHEMICAL", description: "谷物原料中的霉菌毒素污染" },
    ],
    "06.11": [
      { type: "BIOLOGICAL", description: "粉状原料中的沙门氏菌污染（低水分）" },
      { type: "BIOLOGICAL", description: "谷物原料中的霉菌毒素污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（麸质、蛋、乳）" },
      { type: "PHYSICAL", description: "粉状原料中的异物（金属、织物）" },
    ],
    "06.12": [
      { type: "BIOLOGICAL", description: "谷物原料中的霉菌毒素污染（黄曲霉毒素、呕吐毒素）" },
      { type: "BIOLOGICAL", description: "粮食制品原料中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "农药残留超标" },
      { type: "PHYSICAL", description: "原料中的异物（石子、金属）" },
    ],
  },
  "07.0": {
    "07.01": [
      { type: "BIOLOGICAL", description: "来自谷物原料的霉菌毒素污染（黄曲霉毒素、呕吐毒素）" },
      { type: "BIOLOGICAL", description: "粉状原料中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（含麸质、乳、蛋的原料）" },
      { type: "PHYSICAL", description: "来料面粉/谷物中的异物（石子、金属、硬塑料）" },
    ],
    "07.02": [
      { type: "BIOLOGICAL", description: "来自蛋、乳、奶油原料的病原体污染（沙门氏菌、单核细胞增生李斯特菌）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、蛋、坚果、麸质）" },
      { type: "PHYSICAL", description: "来料坚果或装饰物中的异物" },
    ],
    "07.03": [
      { type: "BIOLOGICAL", description: "粉状原料（面粉、花生粉）中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（花生、坚果、乳、麸质）" },
      { type: "CHEMICAL", description: "花生及坚果原料中的黄曲霉毒素超标" },
      { type: "PHYSICAL", description: "来料坚果中的异物（壳片、石子）" },
    ],
    "07.04": [
      { type: "BIOLOGICAL", description: "生面团/馅料中的致病菌污染（大肠杆菌 O157:H7、沙门氏菌）" },
      { type: "BIOLOGICAL", description: "来自鸡蛋或乳原料的沙门氏菌/病原体污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（含乳、蛋、麸质）" },
      { type: "PHYSICAL", description: "来料面粉中的异物（金属屑、织物、硬塑料）" },
    ],
    "07.05": [
      { type: "BIOLOGICAL", description: "谷物/粉状原料中的沙门氏菌污染" },
      { type: "BIOLOGICAL", description: "谷物原料中的霉菌毒素污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（麸质、乳、蛋、坚果）" },
      { type: "PHYSICAL", description: "来料中的异物（石子、金属）" },
    ],
  },
  "08.0": {
    "08.01": [
      { type: "BIOLOGICAL", description: "生鲜肉中的致病菌污染（沙门氏菌、致病性大肠杆菌、弯曲杆菌、单核细胞增生李斯特菌）" },
      { type: "BIOLOGICAL", description: "生鲜肉中的寄生虫污染（绦虫、旋毛虫）" },
      { type: "CHEMICAL", description: "原料肉中的兽药残留（抗生素、瘦肉精）超标" },
      { type: "PHYSICAL", description: "原料肉中的异物（骨碎、金属）" },
    ],
    "08.02": [
      { type: "BIOLOGICAL", description: "原料肉中的致病菌污染（沙门氏菌、致病性大肠杆菌）" },
      { type: "CHEMICAL", description: "原料肉中的兽药残留（抗生素、瘦肉精）超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（含麸质、大豆的辅料）" },
      { type: "PHYSICAL", description: "原料肉中的异物（骨碎、软骨）" },
    ],
    "08.03": [
      { type: "BIOLOGICAL", description: "原料肉中的致病菌污染（沙门氏菌、单核细胞增生李斯特菌）" },
      { type: "BIOLOGICAL", description: "腌制/烟熏原料中的产芽孢病原体（肉毒梭菌）" },
      { type: "CHEMICAL", description: "原料肉中的兽药残留超标" },
      { type: "CHEMICAL", description: "亚硝酸盐/硝酸盐含量超标（腌制辅料）" },
    ],
    "08.04": [
      { type: "BIOLOGICAL", description: "动物肠衣原料中的致病菌污染（沙门氏菌、致病性大肠杆菌）" },
      { type: "CHEMICAL", description: "肠衣原料中的兽药残留超标" },
      { type: "PHYSICAL", description: "肠衣原料中的异物（污物、金属）" },
    ],
  },
  "09.0": {
    "09.01": [
      { type: "BIOLOGICAL", description: "水产品中的致病菌污染（副溶血性弧菌、创伤弧菌）" },
      { type: "BIOLOGICAL", description: "生鲜水产中的寄生虫（肝吸虫、异尖线虫）" },
      { type: "BIOLOGICAL", description: "冰鲜不当时产生的组胺（鲭科鱼类）" },
      { type: "CHEMICAL", description: "贝类原料中的贝类毒素（麻痹性贝毒 PSP、腹泻性贝毒 DSP 等）" },
      { type: "CHEMICAL", description: "水产品中的环境污染物（农药残留、重金属、PCBs等）" },
      { type: "CHEMICAL", description: "养殖水产中的兽药残留（氯霉素、呋喃类药物）" },
    ],
    "09.02": [
      { type: "BIOLOGICAL", description: "水产品中的致病菌（沙门氏菌、副溶血性弧菌等）" },
      { type: "BIOLOGICAL", description: "水产品中的寄生虫（线虫、绦虫、吸虫等）" },
      { type: "BIOLOGICAL", description: "鲭科鱼类原料中的组胺" },
      { type: "CHEMICAL", description: "贝类原料中的贝类毒素（麻痹性贝毒 PSP、腹泻性贝毒 DSP 等）" },
      { type: "CHEMICAL", description: "水产品中的环境污染物（农药残留、重金属、PCBs等）" },
      { type: "CHEMICAL", description: "养殖水产中的兽药残留超标" },
    ],
    "09.03": [
      { type: "BIOLOGICAL", description: "预制水产原料中的副溶血性弧菌污染" },
      { type: "BIOLOGICAL", description: "水产糜原料中的致病菌污染" },
      { type: "BIOLOGICAL", description: "预制过程温度失控产生的组胺（鲭科鱼类）" },
      { type: "CHEMICAL", description: "贝类原料中的贝类毒素（麻痹性贝毒 PSP、腹泻性贝毒 DSP 等）" },
      { type: "CHEMICAL", description: "水产品中的环境污染物（农药残留、重金属、PCBs等）" },
      { type: "CHEMICAL", description: "养殖水产中的兽药残留超标" },
    ],
    "09.04": [
      { type: "BIOLOGICAL", description: "即食水产原料中的单核细胞增生李斯特菌污染" },
      { type: "BIOLOGICAL", description: "原料中的副溶血性弧菌污染" },
      { type: "BIOLOGICAL", description: "原料储运不当产生的组胺（鲭科鱼类）" },
      { type: "CHEMICAL", description: "贝类原料中的贝类毒素（麻痹性贝毒 PSP、腹泻性贝毒 DSP 等）" },
      { type: "CHEMICAL", description: "水产品中的环境污染物（农药残留、重金属、PCBs等）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（甲壳类、鱼类、贝类）" },
    ],
    "09.05": [
      { type: "BIOLOGICAL", description: "低酸水产罐头原料中的产芽孢病原体（肉毒梭菌）" },
      { type: "BIOLOGICAL", description: "罐头原料中的组胺污染（鲭科鱼类）" },
      { type: "CHEMICAL", description: "贝类原料中的贝类毒素（麻痹性贝毒 PSP、腹泻性贝毒 DSP 等）" },
      { type: "CHEMICAL", description: "水产品中的环境污染物（农药残留、重金属、PCBs等）" },
    ],
    "09.06": [
      { type: "BIOLOGICAL", description: "干制水产原料中的霉菌/致病菌污染" },
      { type: "BIOLOGICAL", description: "干制过程中的水分活度控制不当导致病原体存活" },
      { type: "BIOLOGICAL", description: "干制前原料中已累积的组胺（鲭科鱼类）" },
      { type: "CHEMICAL", description: "贝类原料中的贝类毒素（麻痹性贝毒 PSP、腹泻性贝毒 DSP 等）" },
      { type: "CHEMICAL", description: "水产品中的环境污染物（农药残留、重金属、PCBs等）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（甲壳类、鱼类、贝类）" },
    ],
  },
  "10.0": {
    "10.01": [
      { type: "BIOLOGICAL", description: "鲜蛋/蛋液中的沙门氏菌污染" },
      { type: "BIOLOGICAL", description: "破损蛋带来的交叉污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（蛋）" },
      { type: "CHEMICAL", description: "蛋品中的兽药残留超标" },
    ],
    "10.02": [
      { type: "BIOLOGICAL", description: "蛋制品原料中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（蛋）" },
      { type: "CHEMICAL", description: "蛋品中的兽药残留超标" },
      { type: "CHEMICAL", description: "蛋制品原料中的添加剂超标" },
    ],
    "10.03": [
      { type: "BIOLOGICAL", description: "蛋类原料中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（蛋）" },
      { type: "CHEMICAL", description: "蛋品中的兽药残留超标" },
    ],
  },
  "11.0": {
    "11.01": [
      { type: "BIOLOGICAL", description: "食糖原料中的微生物污染（低水分）" },
      { type: "CHEMICAL", description: "食糖中的二氧化硫残留超标" },
      { type: "CHEMICAL", description: "食糖原料中的重金属污染（砷、铅）" },
      { type: "PHYSICAL", description: "食糖原料中的异物（金属、织物）" },
    ],
    "11.02": [
      { type: "BIOLOGICAL", description: "淀粉糖原料中的微生物污染（低水分）" },
      { type: "CHEMICAL", description: "淀粉糖中的二氧化硫残留超标" },
      { type: "CHEMICAL", description: "淀粉原料中的重金属污染（砷）" },
    ],
    "11.03": [
      { type: "BIOLOGICAL", description: "蜂蜜中的肉毒梭菌孢子（婴幼儿风险）" },
      { type: "CHEMICAL", description: "蜂蜜中的兽药残留（抗生素）超标" },
      { type: "CHEMICAL", description: "蜂蜜中的重金属污染（铅）" },
      { type: "CHEMICAL", description: "蜂蜜掺假（掺入糖浆、淀粉）" },
    ],
    "11.04": [
      { type: "BIOLOGICAL", description: "甜味料原料中的微生物污染（低水分）" },
      { type: "CHEMICAL", description: "甜味料中的重金属污染（砷、铅）" },
      { type: "CHEMICAL", description: "甜味剂/防腐剂超标" },
    ],
    "11.05": [
      { type: "BIOLOGICAL", description: "调味糖浆中的微生物污染（高糖环境）" },
      { type: "CHEMICAL", description: "糖浆中的二氧化硫残留超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触" },
      { type: "PHYSICAL", description: "糖浆原料中的异物" },
    ],
  },
  "12.0": {
    "12.01": [
      { type: "CHEMICAL", description: "食盐中的重金属污染（铅、砷、钡）" },
      { type: "CHEMICAL", description: "盐原料中的碘含量异常" },
      { type: "PHYSICAL", description: "盐中的异物（泥沙、金属）" },
    ],
    "12.02": [
      { type: "BIOLOGICAL", description: "增味剂原料（酵母抽提物等）中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "鲜味剂中的重金属污染（砷）" },
      { type: "PHYSICAL", description: "原料中的异物" },
    ],
    "12.03": [
      { type: "BIOLOGICAL", description: "酿造原料（粮食、麸皮）中的霉菌毒素污染" },
      { type: "CHEMICAL", description: "原料中的农药残留超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（小麦/麸质）" },
    ],
    "12.04": [
      { type: "BIOLOGICAL", description: "酿造原料（大豆、小麦）中的霉菌毒素污染" },
      { type: "CHEMICAL", description: "原料中的农药残留超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（大豆、小麦/麸质）" },
    ],
    "12.05": [
      { type: "BIOLOGICAL", description: "酱料原料中的病原体污染（沙门氏菌、芽孢杆菌）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（大豆、鱼、虾等）" },
      { type: "CHEMICAL", description: "原料中的农药残留/重金属超标" },
    ],
    "12.07": [
      { type: "BIOLOGICAL", description: "酒类/粮食原料中的霉菌毒素污染" },
      { type: "CHEMICAL", description: "料酒中的添加剂（防腐剂）超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（麸质）" },
    ],
    "12.09": [
      { type: "BIOLOGICAL", description: "香辛料原料中的沙门氏菌污染（高风险）" },
      { type: "BIOLOGICAL", description: "香辛料中的霉菌污染/霉菌毒素" },
      { type: "CHEMICAL", description: "香辛料中的农药残留超标" },
      { type: "PHYSICAL", description: "香辛料中的异物（石子、金属、昆虫碎片）" },
    ],
    "12.10": [
      { type: "BIOLOGICAL", description: "复合调味料原料中的病原体污染（芽孢杆菌、沙门氏菌）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（蛋、乳、大豆、麸质、甲壳类）" },
      { type: "CHEMICAL", description: "原料中的农药残留/重金属超标" },
    ],
  },
  "13.0": {
    "13.01": [
      { type: "BIOLOGICAL", description: "婴幼儿配方乳粉原料中的阪崎肠杆菌（Cronobacter）污染" },
      { type: "BIOLOGICAL", description: "原料中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "原料中的重金属污染（铅、砷、汞）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、大豆）" },
    ],
    "13.02": [
      { type: "BIOLOGICAL", description: "婴幼儿辅食原料中的沙门氏菌污染" },
      { type: "BIOLOGICAL", description: "谷物/果泥原料中的霉菌毒素污染" },
      { type: "CHEMICAL", description: "原料中的重金属污染（铅、镉）" },
      { type: "CHEMICAL", description: "农药残留超标" },
    ],
    "13.03": [
      { type: "BIOLOGICAL", description: "特医食品原料中的阪崎肠杆菌污染" },
      { type: "BIOLOGICAL", description: "原料中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "原料中的重金属污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、大豆）" },
    ],
    "13.04": [
      { type: "BIOLOGICAL", description: "婴儿特医食品原料中的阪崎肠杆菌（Cronobacter）污染" },
      { type: "BIOLOGICAL", description: "原料中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "原料中的重金属污染（铅、砷、汞）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、大豆）" },
    ],
    "13.05": [
      { type: "BIOLOGICAL", description: "营养补充食品原料中的微生物污染" },
      { type: "CHEMICAL", description: "原料中的重金属污染（铅、砷）" },
      { type: "CHEMICAL", description: "营养强化剂超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、大豆、坚果）" },
    ],
  },
  "14.0": {
    "14.01": [
      { type: "BIOLOGICAL", description: "水源中的病原体污染（水源污染）" },
      { type: "CHEMICAL", description: "水中重金属/化学污染（铅、硝酸盐、溴酸盐）" },
      { type: "CHEMICAL", description: "消毒副产物超标" },
    ],
    "14.02": [
      { type: "BIOLOGICAL", description: "未杀菌果蔬汁原料中的病原体（沙门氏菌、大肠杆菌 O157:H7）" },
      { type: "BIOLOGICAL", description: "浓缩汁原料中的寄生虫污染" },
      { type: "CHEMICAL", description: "原料水果中的农药残留超标" },
      { type: "CHEMICAL", description: "果汁原料中的天然毒素（如展青霉素）" },
    ],
    "14.03": [
      { type: "BIOLOGICAL", description: "乳/植物蛋白原料中的病原体污染" },
      { type: "BIOLOGICAL", description: "植物蛋白原料中的沙门氏菌污染" },
      { type: "CHEMICAL", description: "原料乳中的兽药残留（抗生素）超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、大豆、坚果）" },
    ],
    "14.04": [
      { type: "BIOLOGICAL", description: "工艺用水中的病原体污染（水源污染）" },
      { type: "CHEMICAL", description: "糖浆/浓缩原料中的化学污染" },
      { type: "CHEMICAL", description: "原料中的防腐剂/甜味剂超标" },
    ],
    "14.05": [
      { type: "BIOLOGICAL", description: "茶叶/咖啡原料中的微生物污染（霉菌、大肠菌群）" },
      { type: "CHEMICAL", description: "茶叶/咖啡原料中的农药残留超标" },
      { type: "CHEMICAL", description: "原料中的重金属污染（铅等）" },
      { type: "PHYSICAL", description: "来料中的异物（金属、石粒）" },
    ],
    "14.06": [
      { type: "BIOLOGICAL", description: "固体饮料原料中的沙门氏菌污染（低水分）" },
      { type: "BIOLOGICAL", description: "谷物/乳粉原料中的霉菌毒素污染" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、大豆、坚果）" },
      { type: "CHEMICAL", description: "原料中的重金属污染" },
    ],
    "14.07": [
      { type: "BIOLOGICAL", description: "特殊用途饮料原料中的微生物污染" },
      { type: "CHEMICAL", description: "原料中的添加剂（维生素、矿物质、咖啡因）超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触" },
    ],
    "14.08": [
      { type: "BIOLOGICAL", description: "风味饮料原料中的微生物污染" },
      { type: "CHEMICAL", description: "原料中的防腐剂/色素/甜味剂超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、大豆）" },
    ],
    "14.09": [
      { type: "BIOLOGICAL", description: "饮料原料中的微生物污染" },
      { type: "CHEMICAL", description: "原料中的添加剂超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触" },
    ],
  },
  "15.0": {
    "15.01": [
      { type: "CHEMICAL", description: "蒸馏酒中的甲醇/杂醇油超标" },
      { type: "CHEMICAL", description: "原料中的重金属污染" },
      { type: "CHEMICAL", description: "塑化剂迁移污染" },
      { type: "PHYSICAL", description: "原料中的异物" },
    ],
    "15.02": [
      { type: "CHEMICAL", description: "配制酒中的甲醇超标" },
      { type: "CHEMICAL", description: "浸泡原料（药材、水果）中的农药残留/重金属" },
      { type: "CHEMICAL", description: "添加剂（甜味剂、色素）超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（亚硫酸盐）" },
    ],
    "15.03": [
      { type: "BIOLOGICAL", description: "酿酒原料（麦芽、葡萄、果品）中的霉菌毒素污染" },
      { type: "CHEMICAL", description: "果酒中的二氧化硫残留超标（亚硫酸盐）" },
      { type: "CHEMICAL", description: "发酵酒中的氨基甲酸乙酯" },
      { type: "CHEMICAL", description: "原料中的重金属污染" },
    ],
  },
  "16.0": {
    "16.01": [
      { type: "BIOLOGICAL", description: "果冻原料中的病原体污染（低水分/高糖）" },
      { type: "CHEMICAL", description: "原料中的防腐剂/胶体添加剂超标" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、水果致敏原）" },
      { type: "PHYSICAL", description: "原料中的异物（金属、硬塑料）" },
    ],
    "16.02": [
      { type: "BIOLOGICAL", description: "茶叶/咖啡原料中的微生物污染（霉菌、大肠菌群）" },
      { type: "CHEMICAL", description: "茶叶/咖啡原料中的农药残留超标" },
      { type: "CHEMICAL", description: "原料中的重金属污染（铅等）" },
      { type: "PHYSICAL", description: "来料中的异物（金属、石粒）" },
    ],
    "16.03": [
      { type: "BIOLOGICAL", description: "胶基原料中的微生物污染（低水分）" },
      { type: "CHEMICAL", description: "未申报过敏原交叉接触（乳、坚果）" },
      { type: "PHYSICAL", description: "原料中的异物（金属、硬塑料）" },
    ],
    "16.06": [
      { type: "BIOLOGICAL", description: "来料原料带入的病原体污染" },
      { type: "CHEMICAL", description: "标签错误或交叉污染原料中的未申报过敏原" },
      { type: "CHEMICAL", description: "农药残留或兽药残留超过限量" },
      { type: "PHYSICAL", description: "来料中的异物（玻璃、金属、塑料）" },
    ],
  },
};

export function suggestHazardsForReceiving(
  foodCategoryId?: string | null,
  foodSubcategoryId?: string | null
): HazardSuggestion[] {
  const categoryMap = RECEIVING_CATEGORY_HAZARDS[foodCategoryId ?? ""];
  if (!categoryMap) return LIBRARY["收货（原料接收）"] ?? [];
  const subcategoryList = foodSubcategoryId ? categoryMap[foodSubcategoryId] : undefined;
  if (subcategoryList && subcategoryList.length > 0) return subcategoryList;
  // No subcategory-level list defined — fall back to the generic receiving list.
  return LIBRARY["收货（原料接收）"] ?? [];
}

/** Process steps where allergen cross-contact risk from a formulation
 *  ingredient is highest — used to drive per-ingredient hazard suggestions. */
export const ALLERGEN_RISK_STEP_NAMES = ["收货（原料接收）", "混合/调配", "包装", "过敏原转产/返工"];

export interface AllergenIngredientLike {
  name: string;
  isAllergen: boolean;
  allergenType?: string | null;
}

/** Given a process step name and the product's ingredient list, returns
 *  suggested allergen cross-contact hazards for that step (empty if the
 *  step isn't one of the elevated-risk steps, or no allergen ingredients
 *  are on file yet). */
export function suggestAllergenHazardsForStep(
  stepName: string,
  ingredients: AllergenIngredientLike[]
): HazardSuggestion[] {
  if (!ALLERGEN_RISK_STEP_NAMES.includes(stepName)) return [];
  return ingredients
    .filter((i) => i.isAllergen)
    .map((i) => ({
      type: "CHEMICAL" as const,
      description: `过敏原交叉接触：${i.allergenType || i.name}（来自原料「${i.name}」）`,
    }));
}
