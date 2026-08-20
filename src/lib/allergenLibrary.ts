/**
 * Major allergen checklist, aligned with the Codex Alimentarius allergen list
 * and China's GB 7718 food-labeling standard. Used to (a) suggest values for
 * Ingredient.allergenType in the Formulations wizard step, and (b) drive the
 * per-product allergen declaration inside the allergen-control SOP
 * (src/lib/sopTemplates.ts).
 */

export type AllergenJurisdiction = "CODE_GB7718";

export interface AllergenListItem {
  key: string;
  label: string;
  jurisdiction: AllergenJurisdiction;
  note?: string;
}

export const ALLERGEN_CHECKLIST: AllergenListItem[] = [
  { key: "gluten", label: "含麸质的谷类（小麦、大麦、燕麦等）", jurisdiction: "CODE_GB7718" },
  { key: "crustacean_shellfish", label: "甲壳纲类动物及其制品", jurisdiction: "CODE_GB7718" },
  { key: "fish", label: "鱼类及其制品", jurisdiction: "CODE_GB7718" },
  { key: "eggs", label: "蛋类及其制品", jurisdiction: "CODE_GB7718" },
  { key: "peanuts", label: "花生及其制品", jurisdiction: "CODE_GB7718" },
  { key: "soybeans", label: "大豆及其制品", jurisdiction: "CODE_GB7718" },
  { key: "milk", label: "乳及乳制品（包括乳糖）", jurisdiction: "CODE_GB7718" },
  { key: "tree_nuts", label: "坚果及其果仁类制品", jurisdiction: "CODE_GB7718" },
  { key: "sesame", label: "芝麻", jurisdiction: "CODE_GB7718", note: "国际食品法典委员会（Codex）认可的主要过敏原。" },
  { key: "sulphites", label: "添加亚硫酸盐（≥10 mg/kg 或 10 mg/L）", jurisdiction: "CODE_GB7718", note: "当添加亚硫酸盐含量达到或超过 10 mg/kg 或 10 mg/L 时须声明。" },
];

export function allergenLabel(key: string): string {
  return ALLERGEN_CHECKLIST.find((a) => a.key === key)?.label ?? key;
}
