/**
 * Priority allergen checklist covering the union of both jurisdictions'
 * lists, used to (a) suggest values for Ingredient.allergenType in the
 * Formulations wizard step, and (b) drive the per-product allergen
 * declaration inside the allergen-control SOP (src/lib/sopTemplates.ts).
 *
 * Jurisdiction tags:
 *  - "BOTH": a priority allergen under both FDA (FASTER Act / FALCPA, the
 *    "Big 9") and CFIA (Food and Drug Regulations priority allergen list).
 *  - "CA_ONLY": additional items CFIA requires to be declared (priority
 *    allergens, gluten sources beyond wheat, and added sulphites at or
 *    above 10 ppm) that are not part of the US "Big 9".
 */

export type AllergenJurisdiction = "BOTH" | "CA_ONLY";

export interface AllergenListItem {
  key: string;
  label: string;
  jurisdiction: AllergenJurisdiction;
  note?: string;
}

export const ALLERGEN_CHECKLIST: AllergenListItem[] = [
  { key: "milk", label: "牛奶", jurisdiction: "BOTH" },
  { key: "eggs", label: "鸡蛋", jurisdiction: "BOTH" },
  { key: "fish", label: "鱼类", jurisdiction: "BOTH" },
  { key: "crustacean_shellfish", label: "甲壳贝类", jurisdiction: "BOTH" },
  { key: "tree_nuts", label: "坚果", jurisdiction: "BOTH" },
  { key: "peanuts", label: "花生", jurisdiction: "BOTH" },
  { key: "wheat", label: "小麦", jurisdiction: "BOTH" },
  { key: "soybeans", label: "大豆（黄豆）", jurisdiction: "BOTH" },
  { key: "sesame", label: "芝麻", jurisdiction: "BOTH", note: "美国：2023 年起 FASTER 法案优先过敏原。加拿大：CFIA 优先过敏原。" },
  { key: "mustard", label: "芥末", jurisdiction: "CA_ONLY", note: "CFIA 优先过敏原——不属于美国「Big 9」。加拿大：" },
  { key: "gluten_barley", label: "大麦（麸质来源）", jurisdiction: "CA_ONLY", note: "CFIA 监管的小麦以外麸质来源。" },
  { key: "gluten_rye", label: "黑麦（麸质来源）", jurisdiction: "CA_ONLY", note: "CFIA 监管的小麦以外麸质来源。" },
  { key: "gluten_oats", label: "燕麦（麸质来源）", jurisdiction: "CA_ONLY", note: "CFIA 监管的小麦以外麸质来源。" },
  { key: "gluten_triticale", label: "黑小麦（麸质来源）", jurisdiction: "CA_ONLY", note: "CFIA 监管的小麦以外麸质来源。" },
  { key: "sulphites", label: "添加亚硫酸盐（≥10 ppm）", jurisdiction: "CA_ONLY", note: "当添加亚硫酸盐含量达到或超过 10 ppm 时，CFIA 要求声明。" },
];

export function allergenLabel(key: string): string {
  return ALLERGEN_CHECKLIST.find((a) => a.key === key)?.label ?? key;
}
