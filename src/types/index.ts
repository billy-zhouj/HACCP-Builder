// 企业级概况——同一 HACCP 计划下的所有产品共用。
// 产品级细节（产品描述、预期用途/消费者、包装、保质期）位于 Product 模型，
// 因为一个计划可能覆盖多个产品。
export interface FacilityProfile {
  facilityName: string;
  address: string;
  // 本企业生产内容的概述（例如「即食烘焙食品、常温货架期酱料」）。产品级细节按产品记录。
  foodCategories: string;
  responsibleIndividual: string;
  responsibleIndividualContact: string;
}

export const EMPTY_FACILITY_PROFILE: FacilityProfile = {
  facilityName: "",
  address: "",
  foodCategories: "",
  responsibleIndividual: "",
  responsibleIndividualContact: "",
};

export interface ProductSummary {
  id: string;
  name: string;
}

export interface RecallContactData {
  id: string;
  role: string;
  name: string;
  phone: string | null;
  email: string | null;
  order: number;
}

export interface MockRecallRecordData {
  id: string;
  performedAt: string;
  performedBy: string | null;
  percentTraced: string | null;
  resultsSummary: string | null;
}

export interface VendorData {
  id: string;
  name: string;
  materialsSupplied: string | null;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  certification: string | null;
  status: string;
  guaranteeOnFile: boolean;
  guaranteeExpiry: string | null;
  approvalDate: string | null;
  notes: string | null;
  order: number;
}

export const VENDOR_STATUSES = ["APPROVED", "PENDING", "SUSPENDED"] as const;

export const SUGGESTED_RECALL_ROLES = [
  "召回协调员",
  "副召回协调员",
  "质量 / 食品安全负责人",
  "运营负责人",
  "沟通负责人",
  "物流 / 分销负责人",
  "法律顾问",
];

export const SUGGESTED_HACCP_TEAM_ROLES = [
  "HACCP 团队组长",
  "质量保证 / 食品安全",
  "生产 / 运营",
  "工程 / 维护",
  "微生物 / 技术",
  "卫生（清洁消毒）",
  "采购 / 供应链",
  "外部 HACCP 顾问",
];

export interface HaccpTeamMemberData {
  id: string;
  name: string;
  role: string | null;
  expertise: string | null;
  responsibilities: string | null;
  order: number;
}

export interface IngredientData {
  id: string;
  name: string;
  percentageOfFormulation: string | null;
  functionalRole: string | null;
  supplierVendorId: string | null;
  countryOfOrigin: string | null;
  isAllergen: boolean;
  allergenType: string | null;
  notes: string | null;
  order: number;
}

/** Per-product formulation summary passed into SOP rendering for the
 *  per-product allergen declaration. */
export interface ProductFormulationSummary {
  productId: string;
  productName: string;
  ingredients: IngredientData[];
}
