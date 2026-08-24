/**
 * Two-level food category taxonomy used at product creation time and to
 * drive receiving-step hazard suggestions.
 *
 * The major categories (大类) and subcategories (子类) follow the food
 * classification system in GB 2760-2024《食品安全国家标准 食品添加剂使用标准》
 * Appendix E (16 major categories, "大类—亚类" two-digit level). IDs mirror
 * the GB 2760 category codes so they are traceable back to the standard.
 * Only the 收货（原料接收）step consumes these categories for hazard
 * suggestions; other steps keep the step-name based library
 * (see hazardLibrary.ts).
 */

export interface FoodSubcategory {
  id: string;
  label: string;
}

export interface FoodCategory {
  id: string;
  label: string;
  subcategories: FoodSubcategory[];
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  {
    id: "01.0",
    label: "乳及乳制品",
    subcategories: [
      { id: "01.01", label: "巴氏杀菌乳、灭菌乳、高温杀菌乳和调制乳" },
      { id: "01.02", label: "发酵乳和风味发酵乳" },
      { id: "01.03", label: "乳粉和奶油粉及其调制产品" },
      { id: "01.04", label: "炼乳及其调制产品" },
      { id: "01.05", label: "稀奶油（淡奶油）及其类似品" },
      { id: "01.06", label: "干酪、再制干酪、干酪制品及干酪类似品" },
      { id: "01.07", label: "以乳为主要配料的即食风味食品或其预制产品" },
      { id: "01.08", label: "其他乳制品（如乳清粉、酪蛋白粉等）" },
    ],
  },
  {
    id: "02.0",
    label: "脂肪，油和乳化脂肪制品",
    subcategories: [
      { id: "02.01", label: "基本不含水的脂肪和油" },
      { id: "02.02", label: "水油状脂肪乳化制品（如蛋黄酱、沙拉酱）" },
      { id: "02.03", label: "02.02 类以外的脂肪乳化制品" },
      { id: "02.04", label: "脂肪类甜品（如冰淇淋浆料、甜点用奶油）" },
      { id: "02.05", label: "其他油脂或油脂制品" },
    ],
  },
  {
    id: "03.0",
    label: "冷冻饮品",
    subcategories: [
      { id: "03.01", label: "冰淇淋、雪糕类" },
      { id: "03.03", label: "风味冰、冰棍类" },
      { id: "03.04", label: "食用冰" },
      { id: "03.05", label: "其他冷冻饮品" },
    ],
  },
  {
    id: "04.0",
    label: "水果、蔬菜、豆类、食用菌、藻类、坚果以及籽类等",
    subcategories: [
      { id: "04.01", label: "水果（鲜果、加工水果等）" },
      { id: "04.02", label: "蔬菜（包括块根类）" },
      { id: "04.03", label: "食用菌和藻类" },
      { id: "04.04", label: "豆类及其制品" },
      { id: "04.05", label: "坚果和籽类" },
    ],
  },
  {
    id: "05.0",
    label: "可可制品、巧克力和巧克力制品以及糖果",
    subcategories: [
      { id: "05.01", label: "可可制品、巧克力和巧克力制品" },
      { id: "05.02", label: "糖果" },
      { id: "05.03", label: "胶基糖果" },
    ],
  },
  {
    id: "06.0",
    label: "粮食和粮食制品",
    subcategories: [
      { id: "06.01", label: "原粮（谷物、杂粮、豆类原料）" },
      { id: "06.02", label: "大米及其制品" },
      { id: "06.03", label: "小麦粉及其制品" },
      { id: "06.04", label: "杂粮粉及其制品" },
      { id: "06.05", label: "淀粉及淀粉制品（粉条、粉丝等）" },
      { id: "06.06", label: "杂粮制品（如八宝粥罐头等）" },
      { id: "06.07", label: "方便米面制品" },
      { id: "06.08", label: "冷冻米面制品（饺子、包子、汤圆等）" },
      { id: "06.09", label: "膨化食品" },
      { id: "06.10", label: "糕点（烘烤类以外的蒸煮糕点等）" },
      { id: "06.11", label: "面糊、裹粉、煎炸粉" },
      { id: "06.12", label: "其他粮食制品" },
    ],
  },
  {
    id: "07.0",
    label: "焙烤食品",
    subcategories: [
      { id: "07.01", label: "面包" },
      { id: "07.02", label: "糕点" },
      { id: "07.03", label: "饼干" },
      { id: "07.04", label: "焙烤食品馅料及表面用挂浆" },
      { id: "07.05", label: "其他焙烤食品" },
    ],
  },
  {
    id: "08.0",
    label: "肉及肉制品",
    subcategories: [
      { id: "08.01", label: "生、鲜肉" },
      { id: "08.02", label: "预制肉制品（肉丸、调理肉等）" },
      { id: "08.03", label: "熟肉制品（酱卤、熏烧烤、火腿、香肠、肉干等）" },
      { id: "08.04", label: "肉制品的可食用动物肠衣类" },
    ],
  },
  {
    id: "09.0",
    label: "水产及其制品",
    subcategories: [
      { id: "09.01", label: "鲜水产（鱼类、甲壳类、贝类等）" },
      { id: "09.02", label: "冷冻水产品及其制品（冷冻水产糜及其制品等）" },
      { id: "09.03", label: "预制水产品（不含罐头）" },
      { id: "09.04", label: "熟制水产品（可直接食用）" },
      { id: "09.05", label: "水产品罐头" },
      { id: "09.06", label: "其他水产品及其制品（干制、鱼糜制品等）" },
    ],
  },
  {
    id: "10.0",
    label: "蛋及蛋制品",
    subcategories: [
      { id: "10.01", label: "鲜蛋" },
      { id: "10.02", label: "蛋制品（卤蛋、腌蛋、蛋粉、蛋液等）" },
      { id: "10.03", label: "其他蛋制品" },
    ],
  },
  {
    id: "11.0",
    label: "甜味料（包括蜂蜜）",
    subcategories: [
      { id: "11.01", label: "食糖" },
      { id: "11.02", label: "淀粉糖" },
      { id: "11.03", label: "蜂蜜" },
      { id: "11.04", label: "其他甜味料" },
      { id: "11.05", label: "调味糖浆" },
    ],
  },
  {
    id: "12.0",
    label: "调味品",
    subcategories: [
      { id: "12.01", label: "盐及代盐制品" },
      { id: "12.02", label: "鲜味剂和增味剂" },
      { id: "12.03", label: "醋" },
      { id: "12.04", label: "酱油" },
      { id: "12.05", label: "酿造酱" },
      { id: "12.07", label: "料酒及制品" },
      { id: "12.09", label: "香辛料及制品" },
      { id: "12.10", label: "复合调味料（液体、半固体、固体）" },
    ],
  },
  {
    id: "13.0",
    label: "特殊膳食用食品",
    subcategories: [
      { id: "13.01", label: "婴幼儿配方食品" },
      { id: "13.02", label: "婴幼儿辅助食品" },
      { id: "13.03", label: "特殊医学用途配方食品" },
      { id: "13.04", label: "特殊医学用途婴儿配方食品" },
      { id: "13.05", label: "其他特殊膳食用食品（运动营养、孕妇乳母补充食品等）" },
    ],
  },
  {
    id: "14.0",
    label: "饮料类",
    subcategories: [
      { id: "14.01", label: "包装饮用水" },
      { id: "14.02", label: "果蔬汁类及其饮料" },
      { id: "14.03", label: "蛋白饮料（含乳、植物蛋白等）" },
      { id: "14.04", label: "碳酸饮料" },
      { id: "14.05", label: "茶、咖啡、植物饮料" },
      { id: "14.06", label: "固体饮料" },
      { id: "14.07", label: "特殊用途饮料" },
      { id: "14.08", label: "风味饮料" },
      { id: "14.09", label: "其他饮料类" },
    ],
  },
  {
    id: "15.0",
    label: "酒类",
    subcategories: [
      { id: "15.01", label: "蒸馏酒" },
      { id: "15.02", label: "配制酒" },
      { id: "15.03", label: "发酵酒（啤酒、葡萄酒、果酒等）" },
    ],
  },
  {
    id: "16.0",
    label: "其他类",
    subcategories: [
      { id: "16.01", label: "果冻" },
      { id: "16.02", label: "茶叶、咖啡" },
      { id: "16.03", label: "胶基糖果（已归入 05.03，此处仅作备查）" },
      { id: "16.06", label: "其他（未分类食品）" },
    ],
  },
];

export function findFoodCategory(categoryId?: string | null): FoodCategory | null {
  if (!categoryId) return null;
  return FOOD_CATEGORIES.find((c) => c.id === categoryId) ?? null;
}

export function findFoodSubcategory(
  categoryId?: string | null,
  subcategoryId?: string | null
): FoodSubcategory | null {
  const cat = findFoodCategory(categoryId);
  if (!cat || !subcategoryId) return null;
  return cat.subcategories.find((s) => s.id === subcategoryId) ?? null;
}

/** Human-readable label like "水产及其制品 › 冷冻水产品" or "未设置". */
export function formatFoodCategory(
  categoryId?: string | null,
  subcategoryId?: string | null
): string {
  const cat = findFoodCategory(categoryId);
  if (!cat) return "未设置";
  const sub = findFoodSubcategory(categoryId, subcategoryId);
  return sub ? `${cat.label} › ${sub.label}` : cat.label;
}
