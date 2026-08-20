import type {
  FacilityProfile,
  RecallContactData,
  MockRecallRecordData,
  ProductSummary,
  VendorData,
  HaccpTeamMemberData,
  ProductFormulationSummary,
} from "@/types";

export interface SopRenderContext {
  facility: FacilityProfile;
  products?: ProductSummary[];
  recallContacts?: RecallContactData[];
  mockRecalls?: MockRecallRecordData[];
  vendors?: VendorData[];
  haccpTeam?: HaccpTeamMemberData[];
  /** Per-product ingredient/allergen data — drives the per-product allergen
   *  declaration in the allergen-control SOP. This is a genuine improvement
   *  over the reference app, whose allergen-control document is facility-wide
   *  only; here each product gets its own declaration built from real
   *  ingredient data instead of a manually-filled-in blank list. */
  productFormulations?: ProductFormulationSummary[];
}

function fallback(value: string | undefined | null, placeholder: string) {
  return value && value.trim().length > 0 ? value : placeholder;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("zh-CN");
}

function productListText(products: ProductSummary[] | undefined, facility: FacilityProfile): string {
  if (products && products.length > 0) return products.map((p) => p.name).join("、");
  return fallback(facility.foodCategories, "[产品类别]");
}

function approvedSupplierTable(vendors: VendorData[] | undefined): string {
  if (!vendors || vendors.length === 0) {
    return "[尚未添加供应商——请先在「供应商」步骤添加并重新生成本文档。]";
  }
  const header =
    "| 供应商 | 供应物料 | 状态 | 认证 | 保证书 | 联系人 |\n| --- | --- | --- | --- | --- | --- |";
  const rows = vendors
    .map((v) => {
      const contact = [v.contactName, v.phone, v.email].filter(Boolean).join(", ") || "—";
      return `| ${v.name || "—"} | ${v.materialsSupplied || "—"} | ${v.status || "—"} | ${
        v.certification || "—"
      } | ${v.guaranteeOnFile ? "有" : "无"}${v.guaranteeExpiry ? `（有效期 ${v.guaranteeExpiry}）` : ""} | ${contact} |`;
    })
    .join("\n");
  return `${header}\n${rows}`;
}

function haccpTeamTable(team: HaccpTeamMemberData[] | undefined, f: FacilityProfile): string {
  if (!team || team.length === 0) {
    return `[尚未添加 HACCP 团队成员——请先在 HACCP 团队步骤添加。在此之前，${fallback(
      f.responsibleIndividual,
      "[姓名 / 职位]"
    )} 记录为档案中的团队组长。]`;
  }
  const header = "| 姓名 | 角色 | 专业领域 | 职责 |\n| --- | --- | --- | --- |";
  const rows = team
    .map((m) => `| ${m.name || "—"} | ${m.role || "—"} | ${m.expertise || "—"} | ${m.responsibilities || "—"} |`)
    .join("\n");
  return `${header}\n${rows}`;
}

/** 多个模板复用的法规引注说明。 */
const REG_CITATION_NOTE =
  "本文件遵循《国际食品法典委员会》(Codex Alimentarius) / NACMCF 的 HACCP 结构（5 个预备步骤、7 项原则）。该结构是美国海产品 HACCP（21 CFR 123）、美国果汁 HACCP（21 CFR 120）和美国 USDA FSIS 肉类/禽类 HACCP（9 CFR 417）的强制性要求。对一般美国食品生产设施而言，它在功能上满足 FDA FSMA 危害分析与基于风险的预防性控制要求（21 CFR Part 117 Subpart C，即「HARPC」）。对加拿大企业而言，它是 CFIA 依据《安全食品法条例》(SFCR) 制定预防性控制计划所需的同一套 HACCP 基础。如果您加工海产品、果汁或肉类/禽类，请确认您的计划还额外满足该行业的具体法规。";

export type SopCategory = "gmp" | "food_safety" | "recall";

export interface SopTemplateDef {
  key: string;
  title: string;
  category: SopCategory;
  render: (ctx: SopRenderContext) => string;
}

// --- GMP / Prerequisite Program templates --------------------------------
// US citation: 21 CFR Part 117 Subpart B (Current Good Manufacturing
// Practice). Canada citation: CFIA prerequisite program guidance under the
// SFCR. Both regimes expect the same underlying practices.

const GMP_TEMPLATES: SopTemplateDef[] = [
  {
    key: "personnel_hygiene",
    title: "人员健康与卫生政策",
    category: "gmp",
    render: ({ facility: f }) => `# 人员健康与卫生政策

**企业：** ${fallback(f.facilityName, "[企业名称]")}

## 法规依据
美国：21 CFR § 117.10（人员——疾病控制、清洁卫生）。加拿大：CFIA 依据
SFCR 对人员卫生前提方案的期望。

## 目的
防止人员造成食品、食品接触表面和包装材料的污染。

## 健康报告
员工在开始工作前，如出现腹泻、呕吐、发热、黄疸、确诊的传染性疾病，
或暴露皮肤上有开放性/感染性伤口等症状，必须向主管报告。受影响的员工
被调离食品接触岗位，或禁止进入企业，直至获准返回。

## 手部卫生
1. 在开始工作前、休息后、使用洗手间后、处理废弃物或非食品物品后，以及
   任何手部受污染时，都要洗手并消毒。
2. 洗手站配备肥皂、一次性纸巾（或等效的干手方式）和温热流动水。
3. 使用手套不能替代洗手，且在任务之间以及手套损坏或受污染时应更换。

## 首饰、个人物品与习惯
生产区域不允许佩戴首饰（企业政策允许的普通婚戒除外）、假指甲/指甲油和
携带个人物品。生产区域内禁止进食、饮水（指定饮水站除外）、嚼口香糖和
吸烟。

## 监控
主管对进入生产区域的所有人员和访客进行班前视觉卫生检查，并记录例外情况。

## 纠正措施
不符合本政策的员工在进入生产区域前被纠正；报告与食源性病原体相符病症
的员工，在症状消失达到企业政策规定的时长前（请参考现行公共卫生指南），
不得从事食品接触工作。

## 记录保存
班前卫生检查记录和疾病报告记录保存 [保存期限]，并由 ${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 审核。
`,
  },
  {
    key: "code_of_conduct",
    title: "员工行为准则（食品安全）",
    category: "gmp",
    render: ({ facility: f }) => `# 员工行为准则——食品安全

**企业：** ${fallback(f.facilityName, "[企业名称]")}

## 目的
设定保护 ${fallback(f.facilityName, "[企业名称]")} 食品安全和质量的员工行为期望。

## 行为期望
1. 始终遵守所有公示的 GMP、卫生和食品安全程序。
2. 立即向主管报告食品安全危害、事故和不符合项，不惧怕报复。
3. 不得故意放行不符合要求的产品。
4. 在生产区域独立作业前，完成必要的食品安全培训。
5. 遵守企业关于访客、承包商和生产区域个人物品的政策。
6. 全面配合内部审核，以及 FDA、USDA FSIS 或 CFIA 的任何检查和第三方审核。

## 违规后果
违规行为通过企业标准的分级纪律程序处理；故意的食品安全违规可能导致
立即纠正措施，直至解雇。

## 确认
全体员工在入职时及任何重大修订后，均以书面形式确认本行为准则。签署的
确认书保存在每位员工的个人档案中。
`,
  },
  {
    key: "dress_code",
    title: "工作服（着装规范）政策",
    category: "gmp",
    render: ({ facility: f }) => `# 工作服政策

**企业：** ${fallback(f.facilityName, "[企业名称]")}

## 目的
规定生产区域所需的着装，以防止 ${fallback(f.foodCategories, "[产品类别]")} 受到物理和生物污染。

## 生产区域的着装要求
1. 干净的工作服或外衣，在企业内穿着，不得穿出厂区（或在上下班途中遮盖）。
2. 发网或帽子覆盖全部头发；如有胡须，须佩戴胡须网。
3. 穿着指定或专用生产车间的封闭式防滑鞋。
4. 不得佩戴暴露的首饰（依据《人员健康与卫生政策》）。
5. 作业需要时佩戴手套，并按卫生政策更换。

## 访客与承包商
进入生产区域的访客和承包商，在进入前须配备并穿戴相同的防护着装，并接受基本卫生规则的说明。

## 监控
主管在每班开始时目视检查着装合规情况，并在所有访客进入生产区域前进行检查。

## 纠正措施
着装不合规的人员或访客，在进入或继续停留于生产区域之前须予以纠正。

## 记录保存
着装合规检查作为每日班前或 GMP 检查清单的一部分予以记录，并保存 [保存期限]。
`,
  },
  {
    key: "vendor_qualification",
    title: "供应商与供货商资质审定程序",
    category: "gmp",
    render: ({ facility: f, vendors }) => `# 供应商与供货商资质审定程序

**企业：** ${fallback(f.facilityName, "[企业名称]")}

## 目的
确保原料、包装和食品接触服务的供应商与供货商，在获准使用前符合
${fallback(f.facilityName, "[企业名称]")} 的食品安全要求。
为关键物料保持一家以上合格供应商，可避免单一供应源风险。

## 资质审定流程
1. 新供应商在首次发货前提交相关文件（如食品安全认证/GFSI 状况、许可证/注册号、
   规格说明书、过敏原声明、适用时提供保险证明）。
2. 依据本企业的要求审核文件；向本企业供应其须协助控制的危害物料的供应商，
   须接受供应链程序中规定的附加验证活动。
3. 合格供应商连同批准日期和批准人，被添加到下方的合格供应商名单。

## 合格供应商名单
${approvedSupplierTable(vendors)}

## 持续要求
合格供应商须将配方、过敏原状况、货源或食品安全认证状况的任何变更通知
${fallback(
      f.facilityName,
      "[企业名称]"
    )}。

## 再评估
供应商至少每年再评估一次，或在出现不符合项、投诉趋势或认证失效时立即再评估。

## 记录保存
合格供应商名单及支持性资质文件由 ${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 维护并审核。
`,
  },
  {
    key: "transportation_guarantee",
    title: "运输保证书",
    category: "gmp",
    render: ({ facility: f }) => `# 运输保证书

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**地址：** ${fallback(f.address, "[企业地址]")}

## 目的
向承运方（或要求承运方出具）一份保证书范本，用于运输
${fallback(f.foodCategories, "[产品类别]")}，以
${fallback(f.facilityName, "[企业名称]")} 的名义确认食品安全的运输操作，
同时符合 FDA 卫生运输法规（21 CFR Part 1, Subpart O）和 CFIA 的运输要求。

---

致：[承运方名称]
发件人：${fallback(f.facilityName, "[企业名称]")}
日期：[日期]

本函确认 [承运方名称] 同意按以下条件为
${fallback(f.facilityName, "[企业名称]")} 运输产品：

1. 装货前，所用挂车/集装箱清洁、无虫害、状况良好。
2. 需要温控的产品在整个运输过程中保持在
   [温度范围]，并在装货和卸货时核验并记录温度。
3. 食品不得与非食品或危险物料以可能造成污染的方式混装。
4. 运输期间任何影响产品完整性的意外（温度偏离、污染、事故）须立即报告给
   ${fallback(f.facilityName, "[企业名称]")}。
5. 承运方保留足以证明其遵守上述要求的记录，并应要求提供。

确认方：

承运方代表：________________________  日期：___________

${fallback(f.facilityName, "[企业名称]")} 代表：________________________  日期：___________

---

## 记录保存
所使用各承运方的已签署保证书存档保存，并至少每年更新/重新确认一次。
`,
  },
  {
    key: "sanitation",
    title: "卫生标准操作程序（SSOP）",
    category: "gmp",
    render: ({ facility: f, products }) => `# 卫生标准操作程序

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**地址：** ${fallback(f.address, "[企业地址]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 法规依据
美国：21 CFR § 117.35（卫生操作）。加拿大：CFIA 依据
SFCR 的卫生前提方案。

## 目的
规定 ${fallback(
      f.facilityName,
      "[企业名称]"
    )} 对食品接触表面、设备和企业环境进行清洁和消毒的程序，
以防止 ${fallback(f.foodCategories, "[产品类别]")} 受到污染。

## 范围
适用于生产 ${productListText(products, f)} 所用的一切食品接触表面、生产区域内的非食品接触表面、设备和工器具。

## 程序
1. 对所有食品接触表面进行班前目视检查。
2. 在适用湿洗前，先清除粗大污物（干式清洁）。
3. 使用经批准的清洁剂，随后用饮用水冲洗。
4. 按标签规定的浓度和接触时间使用经批准的消毒剂；用试纸或等效方法核验浓度。
5. 恢复生产前，食品接触表面自然晾干或用一次性抹布擦干。
6. 依据企业的环境监控计划，对指定区域进行环境监控（如适用）。

## 监控
每次生产开始前，由经过培训的员工执行并记录班前卫生检查。

## 纠正措施
如果表面未通过班前检查或消毒剂核验，则不得开始（或须暂停）生产，
直至重新清洁和重新核验完成并记录。

## 验证
主管或责任人（${fallback(
      f.responsibleIndividual,
      "[姓名 / 职位]"
    )}）至少每周审核卫生记录，并与生产计划核对。

## 记录保存
卫生记录保存至少 [保存期限（与适用法规一致，通常为 2 年）]，
并可供 FDA、USDA FSIS 或 CFIA 等要求时审查。
`,
  },
  {
    key: "pest_control",
    title: "虫害防治方案",
    category: "gmp",
    render: ({ facility: f }) => `# 虫害防治方案

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**地址：** ${fallback(f.address, "[企业地址]")}

## 目的
防止虫害活动污染 ${fallback(
      f.foodCategories,
      "[产品类别]"
    )}、食品接触表面或包装，保障 ${fallback(f.facilityName, "[企业名称]")}。

## 方案要素
1. **外围：** 建筑周边保持无杂物/植被过度生长；门、窗和公用设施穿墙处密封，
   防止虫害进入。
2. **监控装置：** 依据厂区虫害防治图，在厂区入口、接收区、仓储区和生产区
   布设灭虫灯、鼠饵/捕鼠器和信息素诱捕器，并由
   [企业内部受训人员 / 持证虫害防治服务商——请注明] 维护。
3. **检查频率：** 至少每 [月 / 按承包商计划] 检查一次装置，并记录发现情况。
4. **化学防治：** 如使用农药，须为食品企业批准使用品种，仅在非生产区域
   或按标签限制使用，并记录施药情况。

## 监控
每次维护服务时审查虫害活动趋势（装置捕获数、目击记录、粪便），并
[每月/每季度] 汇总。

## 纠正措施
在生产区或仓储区发现虫害活动证据时，须对附近产品开展污染调查，加强
诱捕/处理，并实施根本原因纠正措施（如封堵进入口）。

## 记录保存
虫害防治服务报告、装置分布图和趋势记录保存 [保存期限]，
并由 ${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 审核。
`,
  },
  {
    key: "personnel_training",
    title: "人员培训方案",
    category: "gmp",
    render: ({ facility: f }) => `# 人员培训方案

**企业：** ${fallback(f.facilityName, "[企业名称]")}

## 目的
确保 ${fallback(
      f.facilityName,
      "[企业名称]"
    )} 的人员具备安全履行职责所需的知识，并符合本 HACCP 计划以及适用的
FDA/USDA FSIS/CFIA 要求。美国 HARPC（21 CFR § 117.4）还要求从事预防控制相关
活动的人员须通过培训和/或经验具备相应「资质」。

## 培训要求
1. **入职培训**（在独立上岗前）：GMP、人员卫生、着装、过敏原意识和岗位
   特定的食品安全职责。
2. **岗位特定培训：** 从事预防控制（如 CCP、过敏原控制点）的员工，在独立
   执行该控制前，须接受针对该控制的具体关键限值、监控程序和纠正措施培训。
3. **更新培训：** 至少每年进行一次；或在程序变更、发现不符合趋势、或员工
   休长假返岗时进行。

## 监控
完成的培训须记录员工姓名、培训主题、讲师和日期。主管须核实新员工在
培训完成前不会被分配独立的食品安全关键职责。

## 纠正措施
未经所需培训即履行职责的员工，须在接受再培训后方可恢复该职责；
如发现培训缺口具有系统性，须评审培训方案。

## 记录保存
每位员工的个人档案中保留个人培训记录，并保存至其离职后
再满 [保存期限]。
`,
  },
  {
    key: "corporate_structure",
    title: "组织结构 / 组织架构图",
    category: "gmp",
    render: ({ facility: f }) => `# 组织结构

**企业：** ${fallback(f.facilityName, "[企业名称]")}

## 目的
记录 ${fallback(f.facilityName, "[企业名称]")} 的报告关系及食品安全相关岗位，
以确保本 HACCP 计划的职责清晰明确。

## 组织架构图
[在此插入或描述贵单位的组织架构图——例如：]

- 业主 / 总经理
  - HACCP 团队组长 / 责任人：${fallback(
    f.responsibleIndividual,
    "[姓名 / 职位]"
  )}
  - 生产主管
  - 质量 / 食品安全负责人
  - 卫生负责人
  - 维修负责人
  - 发运/收货负责人

## 岗位职责汇总
各食品安全相关岗位的具体职责，记录在该岗位的《岗位说明书》中
（参见《岗位说明书》）。

## 评审
当发生重大人事或组织变动时，以及至少每年，对本组织结构进行评审和更新。
`,
  },
  {
    key: "job_descriptions",
    title: "岗位说明书（食品安全岗位）",
    category: "gmp",
    render: ({ facility: f }) => `# 岗位说明书——食品安全岗位

**企业：** ${fallback(f.facilityName, "[企业名称]")}

以下为起始范本——请为贵单位每个食品安全相关岗位复制该模块并填写具体内容。

## [岗位名称——例如「生产主管」]
- **汇报对象：** [职位]
- **食品安全职责：**
  - [例如「生产开始前核验班前卫生检查」]
  - [例如「依据 HACCP 计划监控并记录 CCP 关键限值」]
- **所需培训/资质：** [例如 GMP 入职培训、过敏原意识、CCP 特定监控培训]
- **权限：** [例如「关键限值未达到时有权停止生产」]

## [岗位名称——例如「HACCP 团队组长」]
- **姓名：** ${fallback(f.responsibleIndividual, "[姓名]")}
- **汇报对象：** [职位]
- **食品安全职责：**
  - 制定、实施并维护本 HACCP 计划
  - 召集并领导 HACCP 团队；协调年度再评估
  - 审核监控、验证和纠正措施记录
  - 作为与 FDA、USDA FSIS 或 CFIA 就本计划相关检查的主要联系人
- **所需培训/资质：** [例如符合您监管范围的 HACCP 培训、与贵单位产品相关的
  食品安全培训]

## 记录保存
所有食品安全相关岗位的现行《岗位说明书》存档保存，并至少每年或岗位变动时审核。
`,
  },
  {
    key: "pre_operational_inspection",
    title: "班前检查 SOP",
    category: "gmp",
    render: ({ facility: f, products }) => `# 班前检查 SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
在每日生产 ${productListText(products, f)} 之前，确认企业、设备和食品接触
表面清洁、卫生且状况良好，以便预先发现既存污染或设备缺陷，防止其影响产品。

## 范围
适用于每班或每批生产开始前的一切生产线、食品接触表面、工器具、吊顶结构、
地漏及相邻的非食品接触区域。

## 程序
在生产开始前，受训员工检查并确认：
1. 食品接触表面目视清洁、已消毒且干燥（交叉核对《卫生 SOP》已完成）。
2. 无积水、暴露产品上方无冷凝水、无地漏倒灌。
3. 设备完好——无缺失螺栓、磨损密封垫、剥落油漆、胶带或松动的五金件，
   以免成为物理危害。
4. 无虫害活动迹象（粪便、啃咬痕迹、昆虫）。
5. 工器具、软管和小零件离地存放并妥善保护。
6. 洗手和消毒站备货齐全且可用。
7. 现场仅有经批准且标签正确的化学品；化学品不得存放在暴露产品
   或包装的上方或附近。

## 监控
在做出「开始生产」决定之前，将检查结果记录在班前检查清单上，并签名、注明日期。

## 纠正措施
任何缺陷须在生产开始前予以纠正并复检。如发现可能已影响前一批次产品的缺陷，
该批产品须扣留并调查。

## 验证
${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 至少每周审核已完成的
班前检查清单。

## 记录保存
班前检查清单保存 [保存期限]，并可供监管审查。
`,
  },
  {
    key: "preventive_maintenance",
    title: "预防性维护 SOP",
    category: "gmp",
    render: ({ facility: f }) => `# 预防性维护 SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
保持设备按设计运行，以预防与维护相关的危害（磨损零件产生的金属碎片、
温控失效、监控仪表校准漂移），而不是在其影响产品后才被发现。

## 范围
适用于所有一旦失效可能影响食品安全的设备和监控仪表——包括温度计/温度记录仪、
金属探测器/X 射线、秤、切割机/刀片、密封件与密封垫、制冷设备，以及与 CCP
或预防控制相关的任何设备。

## 方案要素
1. **设备清单：** 维护一份食品安全相关设备清单，载明所需维护任务及频率
   （依据制造商建议和企业经验）。
2. **计划维护：** 按计划执行并记录预防性维护（如刀片/密封垫检查、仅使用
   食品级润滑剂润滑、皮带和紧固件检查）。
3. **校准：** 依据已知标准，按既定频率并在任何维修后校准/核验用于关键限值
   的监控仪表（温度计、金属探测器、秤、pH/Aw 计）。
4. **维修：** 食品接触设备不得使用临时维修（胶带、铁丝、纸板）；任何维修后，
   该区域须清洁/消毒并检查后方可恢复生产。

## 监控
已完成的维护和校准须记录设备编号、任务、日期、结果和技工。

## 纠正措施
如发现监控仪表失准，须对上次良好校准以来生产的产品就相关参数进行评估，
必要时扣留。可能影响安全的维护未达标的设备，须停止使用，直至修复并验证。

## 验证
${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 至少每月审核维护
和校准记录，并确认计划任务均已按期完成。

## 记录保存
维护计划、工作单和校准记录保存 [保存期限]。
`,
  },
];

// --- Food-safety (hazard-specific) templates ------------------------------

const FOOD_SAFETY_TEMPLATES: SopTemplateDef[] = [
  {
    key: "recall",
    title: "召回计划",
    category: "recall",
    render: ({ facility: f, products, recallContacts, mockRecalls }) => {
      const contacts = recallContacts ?? [];
      const teamSection =
        contacts.length > 0
          ? contacts
              .map(
                (c) =>
                  `- **${fallback(c.role, "团队成员")}:** ${fallback(c.name, "[姓名]")}${
                    c.phone ? ` — ${c.phone}` : ""
                  }${c.email ? ` — ${c.email}` : ""}`
              )
              .join("\n")
          : `- 召回协调人：${fallback(
              f.responsibleIndividual,
              "[姓名 / 职位]"
            )}\n- 候补及跨职能联系人：[请在「召回计划」步骤添加召回团队成员]`;

      const sortedMockRecalls = [...(mockRecalls ?? [])].sort(
        (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
      );
      const latestMockRecall = sortedMockRecalls[0];
      const mockRecallSection = latestMockRecall
        ? `最近一次模拟召回：**${formatDate(latestMockRecall.performedAt)}**，由 ${fallback(
            latestMockRecall.performedBy,
            "[姓名]"
          )} 执行，追溯完成 ${fallback(latestMockRecall.percentTraced, "[追溯完成比例]")}。${fallback(
            latestMockRecall.resultsSummary,
            ""
          )}`.trim()
        : "目前档案中尚无模拟召回记录——在最终确定本计划前，应在「召回计划」步骤进行一次模拟召回并记录。";

      const mockRecallHistory =
        sortedMockRecalls.length > 0
          ? sortedMockRecalls
              .map(
                (r) =>
                  `- ${formatDate(r.performedAt)} — 由 ${fallback(r.performedBy, "[姓名]")} 执行，追溯 ${fallback(
                    r.percentTraced,
                    "[追溯完成比例]"
                  )}${r.resultsSummary ? ` — ${r.resultsSummary}` : ""}`
              )
              .join("\n")
          : "- 尚未记录模拟召回。";

      return `# 召回计划

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")} — ${fallback(
        f.responsibleIndividualContact,
        "[联系方式]"
      )}
**CFIA 许可证号（如适用）：** ${fallback(f.cfiaLicenseNumber, "[许可证号]")}
**FDA 注册号（如适用）：** ${fallback(f.fdaRegistrationNumber, "[注册号]")}

## 目的
当产品（${productListText(products, f)}）被发现可能对消费者构成风险时，
确立及时有效将其撤出市场的程序，符合美国召回要求（FDA 21 CFR Part 7
Subpart C；USDA FSIS 召回程序如适用）以及 CFIA 依据《加拿大安全食品条例》的召回要求。

## 召回团队
${teamSection}

## 启动标准
当企业获悉已分销产品可能以构成健康风险的方式被掺假或错误标识时（例如
病原体检测阳性、未声明过敏原、异物投诉模式、供应商通知原料受污染），
即启动召回。

## 程序
1. 发现潜在问题时，立即召集召回团队。
2. 使用批号和分销记录，确定所有受影响产品及其在供应链中的位置。
3. 在 [目标时限，例如 24 小时] 内，连同批号、原因和指示，通知直接
   客户/经销商。
4. 按要求通知适用监管机构——美国 FDA（及/或肉类/禽类的 USDA FSIS），
   及/或加拿大的加拿大食品检验局（CFIA），使用上述企业的注册号/许可证号。
5. 如需发布公告，须与监管机构协调进行。
6. 追踪退回/销毁的产品，并与分销记录核对，以确认召回有效性。

## 模拟召回
至少**每年**进行一次模拟召回，以验证可追溯记录能够使企业在合理时间内
（通常为一个工作日）核算所有受影响产品。

${mockRecallSection}

### 模拟召回历史
${mockRecallHistory}

## 记录保存
足以执行召回的分销和批号记录保存 [保存期限]，并每季度审核其完整性。
`;
    },
  },
  {
    key: "allergen_control",
    title: "过敏原控制计划（按产品）",
    category: "food_safety",
    render: ({ facility: f, productFormulations }) => {
      const products = productFormulations ?? [];

      if (products.length === 0) {
        return `# 过敏原控制计划

**企业：** ${fallback(f.facilityName, "[企业名称]")}

目前档案中尚无带配方数据的产品。请在「产品」和「配方」步骤添加产品及其
成分，然后重新生成本文档——每个产品将直接依据其成分清单生成各自的过敏原声明，
而非手动维护的厂区级统一清单。

## 法规依据
美国：依据《FASTER 法案》/ FALCPA 的优先过敏原（「九大类」：牛奶、蛋、
鱼类、甲壳类、树坚果、花生、小麦、大豆、芝麻）。
加拿大：CFIA 优先过敏原（相同的 9 类，外加芥末）、麸质来源
（小麦、大麦、黑麦、燕麦、小黑麦），以及含量达或超过
10 ppm 的添加亚硫酸盐，均须依据加拿大《食品药品条例》予以声明。
`;
      }

      const perProduct = products
        .map((p) => {
          const allergenIngredients = p.ingredients.filter((i) => i.isAllergen);
          const declaration =
            allergenIngredients.length > 0
              ? allergenIngredients
                  .map((i) => `- **${i.allergenType || "[过敏原类型未设定]"}** — 来自成分「${i.name}」${
                      i.percentageOfFormulation ? `（占配方的 ${i.percentageOfFormulation}）` : ""
                    }${i.supplierVendorId ? "" : ""}`)
                  .join("\n")
              : "- 目前该产品的成分均未被标记为含过敏原。在最终确定前，请在「配方」步骤确认此情况属实。";

          const table =
            p.ingredients.length > 0
              ? [
                  "| 成分 | 占配方比例 | 功能作用 | 原产国 | 是否过敏原？ | 过敏原类型 |",
                  "| --- | --- | --- | --- | --- | --- |",
                  ...p.ingredients.map(
                    (i) =>
                      `| ${i.name || "—"} | ${i.percentageOfFormulation || "—"} | ${i.functionalRole || "—"} | ${
                        i.countryOfOrigin || "—"
                      } | ${i.isAllergen ? "是" : "否"} | ${i.allergenType || "—"} |`
                  ),
                ].join("\n")
              : "[该产品尚未记录成分——请在「配方」步骤添加。]";

          return `## ${p.productName}

### 过敏原声明（依据配方数据自动生成）
${declaration}

### 完整配方
${table}
`;
        })
        .join("\n");

      return `# 过敏原控制计划

**企业：** ${fallback(f.facilityName, "[企业名称]")}

## 法规依据
美国：依据《FASTER 法案》/ FALCPA 的优先过敏原（「九大类」：牛奶、蛋、
鱼类、甲壳类、树坚果、花生、小麦、大豆、芝麻）。
加拿大：CFIA 优先过敏原（相同的 9 类，外加芥末）、麸质来源
（小麦、大麦、黑麦、燕麦、小黑麦），以及含量达或超过
10 ppm 的添加亚硫酸盐。本企业下列过敏原声明综合了美国与加拿大优先项——
请依据您的监管范围（「企业档案」步骤）确认合法适用于您标签的子集。

## 目的
通过对成分接收、储存、配方、换产/清洁和标签的控制，防止成品中出现未声明
的过敏原。与厂区级统一清单不同，下方每个产品都有各自的过敏原声明，直接
依据该产品的成分记录（「配方」步骤）生成——因此在配方变更时仍能保持准确。

${perProduct}

## 控制措施
1. **接收：** 验收前，核验供应商的成分规格/标签与企业存档的过敏原声明一致。
2. **储存：** 将含过敏原成分存放在指定且清晰标识的区域，防止交叉接触；
   在可行时与无过敏原成分隔离。
3. **排产/换产：** 在可行时，安排先生产无过敏原产品，再生产含过敏原产品；
   换产之间执行经验证的过敏原清洁程序。
4. **标签：** 在放行前，核验每一生产批次所贴标签与实际配方一致
   （含销往加拿大时所需的双语英/法文内容）。
5. **返工：** 仅使用与被添加产品具有相同过敏原谱的返工料，并记录该添加。

## 监控
每个生产批次开始时，检查并记录标签/配方核对结果。过敏原清洁效果须依据
企业的清洁验证方法（如 ATP 擦拭或过敏原特异性检测）核验通过后，方可恢复
无过敏原产品的生产。

## 纠正措施
如发现标签/配方不一致，受影响产品须扣留以待调查，必要时重新贴标或启动
召回计划。

## 验证
${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 至少每月审核过敏原控制
记录，并在任一产品配方变更时，重新确认上方各产品的过敏原声明。
`;
    },
  },
  {
    key: "raw_material_inspection",
    title: "原料 / 来料检验 SOP",
    category: "food_safety",
    render: ({ facility: f, products }) => `# 原料 / 来料检验 SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
确保用于生产 ${productListText(products, f)} 的来料成分、包装及其他物料在
验收时，就其污染、损坏、温度滥用和标识正确性进行检查——在接收步骤控制危害。

## 范围
适用于企业在接收时收到的每一批原料、成分、加工助剂和食品接触包装。

## 程序
收货时，受训员工核验并记录：
1. **供应商：** 物料来自合格供应商（参见《供应商与供货商资质审定程序》）。
2. **文件：** 运输单据，以及必要时提供的《分析证书》（参见《供应商保证与 CoA SOP》），
   须与物料及批次相符。
3. **车辆/状况：** 运输车辆清洁、无虫害、无异味、无食品外污染物；
   冷藏/冷冻货物须达到所需温度（测量并记录）。
4. **完整性：** 包装完好——无破损、泄漏、虫害、锈蚀、玻璃、膨胀或
   篡改迹象。
5. **标识与过敏原：** 产品名称、规格和过敏原声明须与采购订单及企业的
   成分规格一致（参见使用该成分的各产品的配方数据）。
6. **编码：** 批号和保质期/有效期标识齐全，且在可接受的范围内。

## 监控
每次收货记录在接收日志/检查清单上，包括日期、供应商、批次、温度
（如适用）、检验员及接收/拒收决定。

## 纠正措施
任何一项检查未通过的物料均被拒收或扣留，并明确标识、隔离和处置
（退货、销毁，或在偏差解决后才可放行）。同一供应商反复出现不合格
时，触发《供应商与供货商资质审定程序》下的评审。

## 验证
${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 至少 [每周/每月] 审核
接收记录。

## 记录保存
接收日志、温度记录和拒收记录保存 [保存期限]。
`,
  },
  {
    key: "label_inspection",
    title: "标签检验 SOP",
    category: "food_safety",
    render: ({ facility: f, products }) => `# 标签检验 SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
确保 ${productListText(products, f)} 的每一件产品都贴上正确、准确的标签，
尤其关注过敏原声明和标签准确性，以防止未声明过敏原和错误标识——这是美国
和加拿大食品召回的首要原因。

## 范围
适用于每个生产批次以及任何标签换版时的所有消费包装标签和运输标签。

## 程序
1. **正确标签：** 批次开始前，核验所取用标签与计划生产的产品和配方相符
   （产品名称、净含量、规格）。
2. **过敏原准确性：** 确认标签上的过敏原声明与产品当前的过敏原声明一致
   （参见依据配方数据生成的各产品《过敏原控制计划》），并确认本批所销往
   市场适用的所有优先过敏原、麸质来源和添加亚硫酸盐均已声明。
3. **成分表：** 确认成分表与当前批准的配方一致，并按重量降序排列。
4. **双语及强制要素（销往加拿大产品）：** 确认产品销往加拿大时，
   所需的双语（英文/法文）内容和其他强制要素齐全且清晰可读。
5. **批次/日期编码：** 确认批号和保质期/有效期标注正确且清晰可读。
6. **首件检查：** 检查生产线下来的第一件贴标产品，此后按规定频率检查，
   并在每次换标签卷/换版时检查。

## 监控
标签检查（首件、定期及换版）须记录生产批次/批号、标签版本、检查员和结果。

## 纠正措施
出现任何不一致时，立即停机，受影响产品扣留，确认正确标签，错误标识的
产品重新贴标或销毁。如错误标识产品可能已发运，触发《客户投诉/召回》程序。

## 验证
${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 至少每月审核标签检验
记录，并将标签库存与生产核对。

## 记录保存
标签检验记录和留存标签样品保存 [保存期限]。
`,
  },
  {
    key: "vendor_guarantee_coa",
    title: "供应商保证与《分析证书》（CoA）SOP",
    category: "food_safety",
    render: ({ facility: f }) => `# 供应商保证与《分析证书》（CoA）SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
利用供应商保证（保证书/持续保证）和《分析证书》，提供书面保证，证明来料
无污染且符合规格——支持本企业依赖供应商控制的「供应链计划」危害，同时符合
美国 HARPC（21 CFR § 117.136）和 CFIA 的供应链要求。

## 范围
适用于以供应商保证和/或 CoA 作为验收批次依据的成分和物料
（如过敏原状况、病原体检测、真菌毒素/重金属限量、效价/标识）。

## 保证书
1. 向每家供应商索取其签署的（持续）保证书，声明所供物料符合其发运地
   适用的食品法律及企业规格，且供应商将把配方、过敏原状况或货源的任何
   变更通知企业。
2. 为每位合格供应商存档现行保证书；至少每年重新确认一次。

## 《分析证书》（CoA）
1. 明确哪些物料需要 CoA，以及须列出哪些参数（如病原体结果、过敏原声明、
   水分/Aw、效价、污染物限量）。
2. 收货时，将每份 CoA 与所收的具体批次对应，并核验每一项报告的
   结果符合规格后，批次方可放行投产。
3. 以 CoA 代替来料检测时，应定期核验供应商 CoA 的可靠性
   （如按规定频率进行独立验证检测）。

## 监控
在接收环节记录 CoA 审核情况（批次对应 + 结果符合规格）和保证书的有效性；
例外情况予以标记。

## 纠正措施
CoA 缺失、批次不符或结果超规格，均须将批次扣留待解决；无法解决的批次
予以拒收。CoA 问题反复出现的，触发供应商再评估。

## 验证
${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 至少 [每月/每季度]
审核 CoA 和保证书记录。

## 记录保存
保证书和 CoA 保存 [保存期限]，并与所涵盖的批次相关联。
`,
  },
  {
    key: "customer_complaints",
    title: "客户投诉处理 SOP",
    category: "food_safety",
    render: ({ facility: f }) => `# 客户投诉处理 SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
确保食品安全和质量投诉能够被及时记录、评估和处理——任何可能表明潜在健康
风险的投诉，均触发企业的《召回计划》。

## 范围
适用于消费者、客户、经销商、零售商或监管机构就 ${fallback(f.foodCategories, "[产品类别]")} 提出的所有投诉。

## 程序
1. **记录：** 每起投诉均记录收到日期、投诉人联系方式、产品、批次/日期编码、
   投诉性质以及任何样品/照片。
2. **分类：** 评估投诉属于：
   - **食品安全 / 健康风险**（如异物、疾病、未声明过敏原、腐败/病原体迹象），或
   - **仅质量问题**（如外观、口感、风味）。
3. **潜在健康风险的即时处理：** 立即通知
   ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}，扣留可能受影响的
   批次，并评估是否须启动《召回计划》（参见《召回计划》）。必要时通知 FDA、
   USDA FSIS 和/或 CFIA。
4. **调查：** 利用涉事批次的生产、监控和分销记录确定根本原因。
5. **回应：** 答复投诉人，并视情况提供解决方案。

## 监控
至少 [每月] 对投诉进行趋势分析（按类型、产品和批次），以发现可能表明
系统性问题的苗头或正在形成的召回情形。

## 纠正措施
经确认的食品安全投诉推动根本原因纠正措施；出现趋势或确认的健康风险时，
启动《召回计划》，并在需要时通知适用监管机构。

## 验证
${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 至少每月审核投诉日志
和趋势分析。

## 记录保存
投诉记录、调查以及由此产生的任何纠正措施或召回，保存 [保存期限]。
`,
  },
  {
    key: "receiving",
    title: "接收 SOP（含接收日志）",
    category: "food_safety",
    render: ({ facility: f }) => `# 接收 SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
规定来料原料、成分和包装如何接收、检验和记录——包括记录每种物料的
供应商批号并分配内部批号，使可追溯性自接收环节开始
（参见《可追溯性与批号编码 SOP》）。

## 程序
1. 确认物料来自合格供应商，且与采购订单一致。
2. 依据《原料检验 SOP》，检查状况、温度（冷藏/冷冻货物）、包装完整性和编码。
3. 如实记录物料上显示的**供应商批号**，并分配用于在
   生产中追踪该物料的**内部（厂内）批号**。
4. 作出接收、拒收或扣留决定并记录。
5. 归档接收日志条目，使其能与后续消耗该物料的批记录关联。

## 接收日志

| 接收日期 | 供应商 | 物料 / 成分 | 供应商批号 | 内部批号 | 数量 | 温度（如适用） | 状况 | 接收/拒收 | 接收人 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |  |  |

## 监控与纠正措施
每批货物在接收时记录。不合格物料予以拒收或扣留并处置；如不合格情况
反复出现，对供应商进行评审。

## 记录保存
接收日志保存 [保存期限]，是任何追溯或召回的起点。
`,
  },
  {
    key: "shipping",
    title: "发运 SOP（含发运日志）",
    category: "food_safety",
    render: ({ facility: f, products }) => `# 发运 SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
确保成品（${productListText(products, f)}）在食品安全条件下发运，并记录每批
发运的成品批号和客户——完善可追溯链条，使任何批次都能向前追溯到接收它的客户。

## 程序
1. 装货前核验成品标签正确且在保质期内（参见《标签检验 SOP》）。
2. 检查运输车辆的清洁度、虫害、异味，以及（温控货物）是否已预冷至
   所需温度。
3. 每批外发货物均记录**成品批号**、数量、客户/目的地、发运日期和承运方。
4. 适用时，在发运时记录装载温度。

## 发运日志

| 发运日期 | 客户 / 目的地 | 成品 | 成品批号 | 数量 | 承运方 | 装载温度（如适用） | 发运人 |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |

## 监控与纠正措施
每批货物在发运时记录。未通过检查的发运（车辆不洁、温度未达到）须扣留
至纠正为止。

## 记录保存
发运日志保存 [保存期限]，与接收日志和批记录一起，用于在召回期间
向前追踪产品。
`,
  },
  {
    key: "traceability",
    title: "可追溯性与批号编码 SOP（含批记录）",
    category: "food_safety",
    render: ({ facility: f, products }) => `# 可追溯性与批号编码 SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
确保 ${productListText(products, f)} 的上一级/下一级可追溯性：每个成品批次
都能**向前**追溯到生产它所使用的原料批次，并**向后**追溯到发运给它的客户。
这是同时符合 FDA/USDA FSIS 和 CFIA 要求（以及 FDA 监管的高风险食品在适用
时 21 CFR Part 1 Subpart S 的附加可追溯性记录要求）的有效召回的支柱。

## 可追溯链条
1. **接收：** 记录每批来料的供应商批号，并分配内部批号
   （接收 SOP / 接收日志）。
2. **生产：** 每个生产批次的**批记录**记录使用了哪些内部原料批号，
   生产出哪个**成品批号**。
3. **发运：** 每个成品批号对应记录发运给它的客户
   （发运 SOP / 发运日志）。

## 批号编码
- 为每个生产批次分配唯一的成品批号（如日期/线别/序列编码）。在此记录编码
  约定，以便任何人解读： [请描述您的批号格式]。
- 成品批号显示在产品标签上，并与批记录关联。

## 批记录

| 字段 | 内容 |
| --- | --- |
| 产品 | [产品名称] |
| 成品批号 | [已分配的批号] |
| 生产日期及线别 | [日期 / 线别] |
| 所用原料批次（内部批号） | [列出每种成分及其内部批号] |
| 生产数量 | [单位] |
| 关键工艺检查（如烹煮温度/时间、CCP 记录） | [引用或数值] |
| 标签版本 / 批次核验 | [姓名缩写] |
| 完成人 | [姓名 / 姓名缩写] |

该批次消耗的原料批次：

| 成分 / 物料 | 供应商批号 | 内部批号 | 使用数量 |
| --- | --- | --- | --- |
|  |  |  |  |
|  |  |  |  |

## 验证（模拟召回）
可追溯性至少每年通过一次模拟召回（参见《召回计划》）验证：选择一个成品
批次，确认其在合理时间内能追溯到原料批次并向前追溯到客户。

## 记录保存
批记录、接收日志和发运日志保存 [保存期限]，并按批号相互交叉关联。
`,
  },
  {
    key: "water_potability",
    title: "水质可饮用性与年度检测 SOP",
    category: "food_safety",
    render: ({ facility: f }) => `# 水质可饮用性与年度检测 SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
确保 ${fallback(f.facilityName, "[企业名称]")} 的水（以及接触食品或食品接触
表面的冰/蒸汽）可饮用，不会引入生物或化学危害，并至少每年通过检测验证
（美国：21 CFR § 117.37；加拿大：CFIA 依据 SFCR 及市政要求的水质可饮用性要求）。

## 范围
适用于产品用水、食品接触表面清洁用水、洗手用水以及制冰/产蒸汽用水。

## 要求
1. **水源：** 明确水源（市政 / 自备井）。自备井及任何非市政水源
   需要更频繁的检测。
2. **年度检测（最低要求）：** 使用经认可的实验室，至少每年对饮用水检测
   微生物参数（如总大肠菌群和大肠杆菌），并在适用时检测化学参数。
   井水或结果不满意时提高检测频率。
3. **防回流：** 维护防回流/防交叉连接措施，防止非饮用水管线污染饮用水。
4. **冰与蒸汽：** 接触食品的冰和烹饪用蒸汽须由饮用水制成。

## 检测日志

| 采样日期 | 采样地点 | 检测参数 | 结果 | 实验室 | 合格/不合格 | 审核人 |
| --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |

## 纠正措施
结果不满意时，立即采取行动（如停止使用受影响的用水，改用可饮用水源，
依据公共卫生指导进行煮沸/冲洗并复测）并在再次用水前开展调查。

## 记录保存
实验室《分析证书》和检测日志保存 [保存期限]，并由 ${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 审核。
`,
  },
  {
    key: "temperature_monitoring",
    title: "温度监控 SOP（含记录表）",
    category: "food_safety",
    render: ({ facility: f }) => `# 温度监控 SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
确保与本企业产品相关的温度依赖控制（冷藏、冷冻、热保温、烹煮、冷却）
保持在限值之内，以预防与温度相关的危害。

## 范围
适用于所有冷藏柜、冷冻柜、热保温设备，以及以温度作为控制手段的工艺步骤
（包括任何设有温度关键限值的 CCP）。

## 程序
1. 明确需要监控的每个设备/步骤及其目标温度范围。
2. 按规定频率（如每班开始时及每 [X] 小时）使用校准的温度计/数据记录仪
   检查并记录温度（校准参见《预防性维护 SOP》）。
3. 每次读数签字/签缩写。

## 温度记录表

| 日期 | 时间 | 设备 / 步骤 | 目标范围 | 实际温度 | 合格？ | 纠正措施（如超限） | 姓名缩写 |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |

## 纠正措施
读数超出范围时立即采取措施：评估受影响产品（扣留/评估）、纠正设备/工艺，
并记录所做处理。如为 CCP 偏差，遵循该 CCP 的纠正措施程序。

## 验证
${fallback(f.responsibleIndividual, "[姓名 / 职位]")} 至少 [每周] 审核温度
记录，并确认纠正措施已完成。

## 记录保存
温度记录保存 [保存期限]。
`,
  },
  {
    key: "supplier_verification",
    title: "供应链（供应商验证）方案",
    category: "food_safety",
    render: ({ facility: f, vendors }) => `# 供应链方案

**企业：** ${fallback(f.facilityName, "[企业名称]")}

## 法规依据
美国：21 CFR § 117.136（供应链方案，属 HARPC 的一部分）。加拿大：CFIA
依据 SFCR 的供应链/供应商验证要求。

## 目的
确保 ${fallback(
      f.facilityName,
      "[企业名称]"
    )} 接收的原料和成分，就本企业依赖供应商控制的危害（即本企业
未以其他方式控制的危害）得到充分控制。与《供应商与供货商资质审定程序》配合执行。

## 合格供应商名单
仅接受来自合格供应商的成分。供应商在以下条件满足后加入合格名单：
1. 审核供应商相关的食品安全文件（如 HACCP 计划摘要、GFSI 认证或同等文件）。
2. 确认供应商对本企业依赖其管理的危害具有控制能力。

当前合格供应商：

${approvedSupplierTable(vendors)}

## 验证活动
视危害严重程度和供应商风险，验证可能包括：
- 每年或更频繁的现场审核
- 逐批或定期审核《分析证书》（CoA）
- 来料批次抽样检测
- 审核供应商相关的食品安全认证

## 持续监控
供应商绩效（不符合项、投诉趋势、审核结果）至少每年评审一次，或出现
问题时更早评审，以确定是否应继续批准。

## 纠正措施
从存在未决不符合项的供应商收到的批次，须扣留等待调查。未能解决不符合项
的供应商，可将其从合格名单中除名。

## 记录保存
供应商批准文件、验证记录和 CoA 保存 [保存期限]，并由 ${fallback(
      f.responsibleIndividual,
      "[姓名 / 职位]"
    )} 审核。
`,
  },
  {
    key: "haccp_validation_reassessment",
    title: "HACCP 计划验证与年度再评估记录",
    category: "food_safety",
    render: ({ facility: f, haccpTeam, products }) => `# HACCP 计划验证与年度再评估记录

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**HACCP 团队组长：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
${REG_CITATION_NOTE}

两套制度均要求 HACCP/预防控制计划在首次使用前**经验证**（确认其确实能够
控制所识别的危害），并**至少每年再评估一次**，或在发生可能影响危害分析
的变更时更早进行。

## 在册 HACCP 团队
${haccpTeamTable(haccpTeam, f)}

## 初次验证
验证确认计划科学/技术依据——即每个 CCP 所选定的关键限值确实能够控制
其预期控制的危害（如依据公认工艺权威、指南或企业内部挑战试验验证的
烹煮时间/温度组合）。

| 产品 | CCP / 预防控制 | 验证依据（试验、已发表指南、工艺权威函） | 验证人 | 日期 |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
|  |  |  |  |  |

本计划当前覆盖的产品：${productListText(products, f)}

## 年度再评估日志
每个再评估周期填写一行；或出现以下任一触发因素时更早填写：新成分/供应商、
工艺或设备变更、新产品、召回或重大投诉趋势、CCP 偏差趋势，或新的监管指南。

| 日期 | 触发因素（年度 / 事件驱动——请注明） | 发现的变更 | 计划已更新？（是/否） | 审核人 |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
|  |  |  |  |  |

## 记录保存
验证研究/参考资料和再评估日志，保存至 HACCP 计划存续期结束再满
[保存期限]，并应 FDA、USDA FSIS 或 CFIA 要求提供。
`,
  },
  {
    key: "corrective_action_verification_records",
    title: "纠正措施与验证记录 SOP",
    category: "food_safety",
    render: ({ facility: f }) => `# 纠正措施与验证记录 SOP

**企业：** ${fallback(f.facilityName, "[企业名称]")}
**责任人：** ${fallback(f.responsibleIndividual, "[姓名 / 职位]")}

## 目的
将 HACCP 体系的第 5-7 项原则落实为独立的记录保存程序：关键限值未达到时
如何记录纠正措施，以及验证活动（确认整个计划按设计运行）如何安排、执行和记录。

## 纠正措施程序
1. 当监控显示关键限值未达到（「偏差」）时，责任人须立即：(a) 识别并隔离/
   扣留在失控期间生产的任何产品；(b) 纠正偏差原因；(c) 在放行、返工或销毁
   前评估受影响产品的安全性。
2. 每起偏差均记录：日期/时间、受影响的 CCP/步骤、关键限值、观察值、
   受影响产品（批号）、所采取的纠正措施、受影响产品的处置方式，以及
   执行/批准人。
3. 偏差趋势至少每月评审；同一 CCP 反复出现偏差时，触发评审关键限值、
   监控频率或工艺本身是否需要变更（纳入年度再评估——参见《HACCP 计划验证
   与年度再评估记录》）。

### 纠正措施日志

| 日期/时间 | CCP / 步骤 | 关键限值 | 观察值 | 受影响产品/批次 | 所采取的纠正措施 | 处置 | 执行人 |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |  |  |
|  |  |  |  |  |  |  |  |

## 验证活动
验证确认整个计划按预期运行——比各 CCP 的常规监控范围更广。

1. **记录审核：** 每个 CCP 的监控和纠正措施记录，由执行监控者以外的人员
   按规定频率审核（至少须在批次发运前完成）。
2. **校准验证：** 监控仪表依据《预防性维护 SOP》进行校准。
3. **直接观察：** 定期直接观察监控活动，确认其按书面要求执行。
4. **成品/环境检测**（作为验证工具而非唯一控制手段使用时）：将结果与
   预期对照审核。
5. **年度再评估：** 参见《HACCP 计划验证与年度再评估记录》。

### 验证日志

| 日期 | 验证活动 | 范围（CCP / 计划整体） | 结果 | 是否需要后续措施？ | 执行人 |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |
|  |  |  |  |  |  |

## 记录保存
纠正措施和验证记录保存 [保存期限]，是 FDA、USDA FSIS 或 CFIA 检查本
HACCP 计划期间审核的主要证据。
`,
  },
];

export const SOP_TEMPLATES: SopTemplateDef[] = [...GMP_TEMPLATES, ...FOOD_SAFETY_TEMPLATES];

export function getTemplate(key: string): SopTemplateDef | undefined {
  return SOP_TEMPLATES.find((t) => t.key === key);
}

export function getTemplatesByCategory(category: SopCategory): SopTemplateDef[] {
  return SOP_TEMPLATES.filter((t) => t.category === category);
}
