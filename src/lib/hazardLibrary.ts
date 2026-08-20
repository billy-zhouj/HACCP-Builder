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

export function suggestHazardsForStep(stepName: string): HazardSuggestion[] {
  return LIBRARY[stepName] ?? [];
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
