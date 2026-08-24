import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  TableLayoutType,
  TextRun,
  TableOfContents,
  Footer,
  PageNumber,
  AlignmentType,
  LevelFormat,
  BorderStyle,
} from "docx";
import type { ILevelsOptions } from "docx";
import type {
  Plan,
  Product,
  ProcessStep,
  Hazard,
  Sop,
  RecallContact,
  MockRecallRecord,
  Vendor,
  Ingredient,
  HaccpTeamMember,
} from "@prisma/client";
import type { FacilityProfile } from "@/types";
import { getTemplate } from "@/lib/sopTemplates";
import { evaluateDecisionTree } from "@/lib/ccpDecisionTree";

type PlanWithRelations = Plan & {
  products: (Product & {
    processSteps: (ProcessStep & { hazards: Hazard[] })[];
    ingredients: (Ingredient & { supplierVendor: Vendor | null })[];
  })[];
  vendors: Vendor[];
  sops: Sop[];
  recallContacts: RecallContact[];
  mockRecallRecords: MockRecallRecord[];
  haccpTeamMembers: HaccpTeamMember[];
};

const CONTENT_WIDTH_DXA = 9360;

function pctToDxa(pcts: number[]): number[] {
  return pcts.map((p) => Math.round((CONTENT_WIDTH_DXA * p) / 100));
}

function cell(text: string, opts: { bold?: boolean; widthDxa?: number } = {}) {
  return new TableCell({
    width: opts.widthDxa ? { size: opts.widthDxa, type: WidthType.DXA } : undefined,
    children: [new Paragraph({ children: inlineRuns(text, { bold: opts.bold }) })],
  });
}

function headerRow(labels: string[], widthsDxa: number[]) {
  return new TableRow({
    tableHeader: true,
    children: labels.map((l, i) => cell(l, { bold: true, widthDxa: widthsDxa[i] })),
  });
}

function dataRow(values: string[], widthsDxa: number[]) {
  return new TableRow({ children: values.map((v, i) => cell(v, { widthDxa: widthsDxa[i] })) });
}

function makeTable(widthsDxa: number[], rows: TableRow[]): Table {
  return new Table({
    rows,
    columnWidths: widthsDxa,
    layout: TableLayoutType.FIXED,
    width: { size: widthsDxa.reduce((a, b) => a + b, 0), type: WidthType.DXA },
  });
}

const HEADING_BY_LEVEL = [
  HeadingLevel.HEADING_1,
  HeadingLevel.HEADING_2,
  HeadingLevel.HEADING_3,
  HeadingLevel.HEADING_4,
  HeadingLevel.HEADING_5,
  HeadingLevel.HEADING_6,
];

function headingForLevel(level: number) {
  return HEADING_BY_LEVEL[Math.min(Math.max(level, 1), 6) - 1];
}

function sectionHeading(text: string): Paragraph {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, pageBreakBefore: true });
}

// --- Hazard analysis & CCP determination worksheets -------------------------
// Section 7 follows the Codex CXC 1-1969 worksheet layouts (Annex III Table 1
// hazard-analysis worksheet, Annex IV Table 1 CCP-determination worksheet):
// a 4-column document-control header, the filled main table, and the
// per-column guidance / footnotes.

function hazardTypeLetter(type: string): string {
  switch (type) {
    case "BIOLOGICAL":
      return "B";
    case "CHEMICAL":
      return "C";
    case "PHYSICAL":
      return "P";
    case "RADIOLOGICAL":
      return "R";
    default:
      return type || "?";
  }
}

function ynText(v: boolean | null): string {
  return v === null ? "—" : v ? "是" : "否";
}

/** A table cell whose lines are rendered as separate paragraphs (line breaks). */
function multiLineCell(lines: string[], opts: { bold?: boolean; widthDxa?: number } = {}) {
  return new TableCell({
    width: opts.widthDxa ? { size: opts.widthDxa, type: WidthType.DXA } : undefined,
    children: lines.map((l) => new Paragraph({ children: inlineRuns(l, { bold: opts.bold }) })),
  });
}

/** Document-control header shared by both worksheets (页码/产品/工厂/地址/签发日期/替代版本). */
function worksheetInfoTable(facility: Partial<FacilityProfile>, productName: string): Table {
  const widths = pctToDxa([20, 30, 20, 30]);
  const label = (t: string, i: number) => multiLineCell([t], { bold: true, widthDxa: widths[i] });
  const value = (t: string, i: number) => multiLineCell([t || "—"], { widthDxa: widths[i] });
  return makeTable(widths, [
    new TableRow({
      children: [label("页码", 0), value("_______", 1), label("产品", 2), value(productName, 3)],
    }),
    new TableRow({
      children: [label("工厂名称", 0), value(facility.facilityName ?? "", 1), label("地址", 2), value(facility.address ?? "", 3)],
    }),
    new TableRow({ children: [label("签发日期", 0), value("", 1), label("替代版本", 2), value("", 3)] }),
  ]);
}

// --- FAO GHP & HACCP toolbox forms (Preliminary Steps 2 & 3) -----------------
// Form 1 – Product Description and Form 2 – Product Ingredients and Incoming
// Material (FAO CC6256EN), rendered per product in Section 3.

function faoFormHeaderLine(facilityName: string, productName: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: "企业：", bold: true }),
      new TextRun({ text: facilityName || "—" }),
      new TextRun({ text: "　　" }),
      new TextRun({ text: "产品名称：", bold: true }),
      new TextRun({ text: productName }),
    ],
  });
}

function faoFormFooterLine(): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({ text: "日期：", bold: true }),
      new TextRun({ text: "________________" }),
      new TextRun({ text: "　　" }),
      new TextRun({ text: "批准人：", bold: true }),
      new TextRun({ text: "________________" }),
    ],
  });
}

/** FAO Form 1 — Product Description (preliminary steps 2 & 3). */
function productDescriptionForm(p: Product): Table {
  const widths = pctToDxa([26, 74]);
  const category = [p.foodCategory?.trim(), p.foodSubcategory?.trim()].filter(Boolean).join(" / ");
  const features = [p.productDescription?.trim() ?? "", category ? `食品分类：${category}` : ""].filter(Boolean);
  const intended = [
    p.intendedUse?.trim() ?? "",
    p.intendedConsumer?.trim() ? `预期消费群体：${p.intendedConsumer.trim()}` : "",
  ].filter(Boolean);
  const item = (label: string) => cell(label, { widthDxa: widths[0] });
  const content = (text: string) =>
    multiLineCell(text ? text.split("\n") : ["—"], { widthDxa: widths[1] });
  return makeTable(widths, [
    headerRow(["项目", "内容"], widths),
    new TableRow({ children: [item("1. 产品名称"), content(p.name)] }),
    new TableRow({ children: [item("2. 成品重要特性（如 Aw、pH 等）"), content(features.join("\n"))] }),
    new TableRow({ children: [item("3. 预期用途 / 食用方法"), content(intended.join("；"))] }),
    new TableRow({ children: [item("4. 包装"), content(p.packagingType?.trim() ?? "")] }),
    new TableRow({ children: [item("5. 保质期"), content(p.shelfLifeAndStorage?.trim() ?? "")] }),
    new TableRow({ children: [item("6. 销售地区 / 分销渠道"), content("")] }),
    new TableRow({ children: [item("7. 标签说明"), content("")] }),
    new TableRow({ children: [item("8. 特殊分销控制要求"), content("")] }),
  ]);
}

/** FAO Form 2 — Product Ingredients and Incoming Material (preliminary step 2).
 *  Rows come from the product formulation (配方); allergens are pre-marked as
 * C (chemical hazard) based on the formulation's allergen flags. */
function productIngredientsForm(
  p: Product & { ingredients: (Ingredient & { supplierVendor: Vendor | null })[] }
): Table {
  const widths = pctToDxa([42, 24, 34]);
  const head = headerRow(["物料名称", "类别（原料 / 干配料 / 其他）", "潜在危害类型"], widths);
  if (p.ingredients.length === 0) {
    return makeTable(widths, [
      head,
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 3,
            children: [new Paragraph({ children: [new TextRun({ text: "尚未录入配方物料。" })] })],
          }),
        ],
      }),
    ]);
  }
  const rows = p.ingredients.map((ing) => {
    const parts = [ing.percentageOfFormulation?.trim(), ing.functionalRole?.trim()].filter(Boolean);
    const nameLine = parts.length > 0 ? `${ing.name}（${parts.join("、")}）` : ing.name;
    const sourceParts = [
      ing.countryOfOrigin?.trim() ? `产地：${ing.countryOfOrigin.trim()}` : "",
      ing.supplierVendor
        ? `供应商：${ing.supplierVendor.name}${ing.supplierVendor.certification ? `（${ing.supplierVendor.certification}）` : ""}`
        : "",
    ].filter(Boolean);
    const lines = [nameLine, sourceParts.join("；"), ing.notes?.trim() ?? ""].filter(Boolean);
    const hazard = ing.isAllergen ? `C（过敏原：${ing.allergenType?.trim() || "—"}）` : "—";
    return new TableRow({
      children: [
        multiLineCell(lines, { widthDxa: widths[0] }),
        cell("—", { widthDxa: widths[1] }),
        cell(hazard, { widthDxa: widths[2] }),
      ],
    });
  });
  return makeTable(widths, [head, ...rows]);
}

const PRODUCT_DESCRIPTION_NOTES = `**填写说明**

- 第 2 项应列出对该产品食品安全有实际意义的关键特性（水分活度 Aw、pH、酸度、水分含量、盐度、添加剂等），这些特性是后续危害分析的基础。
- 第 3 项说明消费者如何使用产品（即食 / 需加热 / 需进一步加工），并指明预期消费群体（普通人群 / 易感人群）。
- 第 6、8 项涉及分销链控制（如冷链温度范围、储存条件），若存在对安全有影响的特殊分销控制，必须在此写明。`;

const PRODUCT_INGREDIENTS_NOTES = `**填写说明**

- 列出构成最终产品的**全部**原料、配料和包装材料（包括水、罐体/封口、包装材料等），不要遗漏任何进入生产流程的物料。
- 「潜在危害类型」按以下缩写标注该物料可能带入的危害：
  - **B** = 生物危害
  - **C** = 化学危害
  - **P** = 物理危害
- 本表与后续危害识别表（Form 5/6/7）和危害分析衔接：此处标注的每一种危害，都必须在危害识别表中逐一分析。
- 过敏原按 **C**（化学危害）标注；本导出已根据配方中的过敏原标记自动标注为「C（过敏原：…）」，其余物料请在危害分析后补全。`;

function controlMeasureText(h: Hazard): string {
  if (!h.requiresPreventiveControl) return "—";
  const mon = h.monitoringProcedure?.trim();
  const limit = h.criticalLimit?.trim();
  if (mon && limit) return `${mon}（关键限值：${limit}）`;
  if (mon) return mon;
  if (limit) return `待补充控制程序（关键限值：${limit}）`;
  return "待补充控制程序";
}

type StepWithHazards = ProcessStep & { hazards: Hazard[] };

/** Re-runs the 2022 decision tree from the stored answers (same engine as
 *  the API routes), so the exported worksheets always reflect the answers. */
function evaluateCcpStatus(h: Hazard): "NOT_EVALUATED" | "NOT_A_CCP" | "CCP" | "PRW" {
  return evaluateDecisionTree({
    q1CanBeControlledByPrp: h.ccpQ1CanBeControlledByPrp,
    q2HasSpecificControlMeasures: h.ccpQ2HasSpecificControlMeasures,
    q3WillLaterStepPreventOrEliminate: h.ccpQ3WillLaterStepPreventOrEliminate,
    q4CanStepPreventOrEliminate: h.ccpQ4CanStepPreventOrEliminate,
  }).status;
}

/** CCP numbering per product (step order): CCP-1, CCP-2, … / PRW-1, …
 *  Shared by the CCP-determination worksheet and the HACCP worksheet so the
 *  numbers agree across the document. */
function assignCcpNumbers(steps: StepWithHazards[]): Map<string, string> {
  const map = new Map<string, string>();
  let ccpSeq = 0;
  let prwSeq = 0;
  for (const s of steps) {
    for (const h of s.hazards) {
      const status = evaluateCcpStatus(h);
      if (status === "CCP") {
        ccpSeq++;
        map.set(h.id, `CCP-${ccpSeq}`);
      } else if (status === "PRW") {
        prwSeq++;
        map.set(h.id, `PRW-${prwSeq}`);
      }
    }
  }
  return map;
}

function hazardAnalysisTable(steps: StepWithHazards[]): Table {
  const widths = pctToDxa([14, 26, 14, 20, 26]);
  const rows = [
    headerRow(
      [
        "(1) 步骤 *",
        "(2) 识别本步骤引入、受控或加剧的潜在危害（B/C/P）",
        "(3) 该潜在危害是否需要在 HACCP 计划中处理？（是/否，B/C/P）",
        "(4) 对第 (3) 栏判定的依据说明",
        "(5) 可施加何种措施以预防、消除或将该危害降至可接受水平？（B/C/P）",
      ],
      widths
    ),
    ...steps.map(
      (s): TableRow =>
        new TableRow({
          children: [
            multiLineCell([`${s.order}. ${s.name}`], { widthDxa: widths[0] }),
            multiLineCell(
              s.hazards.length
                ? s.hazards.map((h) => `${hazardTypeLetter(h.type)}：${h.description}`)
                : ["未识别到危害"],
              { widthDxa: widths[1] }
            ),
            multiLineCell(
              s.hazards.length
                ? s.hazards.map((h) => `${hazardTypeLetter(h.type)}：${h.requiresPreventiveControl ? "是" : "否"}`)
                : ["—"],
              { widthDxa: widths[2] }
            ),
            multiLineCell(
              s.hazards.length
                ? s.hazards.map((h) => `${hazardTypeLetter(h.type)}：${h.justification?.trim() ? h.justification : "—"}`)
                : ["—"],
              { widthDxa: widths[3] }
            ),
            multiLineCell(
              s.hazards.length
                ? s.hazards.map((h) => `${hazardTypeLetter(h.type)}：${controlMeasureText(h)}`)
                : ["—"],
              { widthDxa: widths[4] }
            ),
          ],
        })
    ),
  ];
  return makeTable(widths, rows);
}

function ccpDeterminationTable(steps: StepWithHazards[]): Table {
  const widths = pctToDxa([12, 20, 14, 16, 16, 14, 8]);
  const ccpNumbers = assignCcpNumbers(steps);
  const dataRows = steps.flatMap(
    (s): TableRow[] =>
      s.hazards
        .filter(
          (h) =>
            h.requiresPreventiveControl ||
            h.ccpQ1CanBeControlledByPrp !== null ||
            h.ccpQ2HasSpecificControlMeasures !== null ||
            h.ccpQ3WillLaterStepPreventOrEliminate !== null ||
            h.ccpQ4CanStepPreventOrEliminate !== null
        )
        .map(
          (h): TableRow => {
            const status = evaluateCcpStatus(h);
            let ccpNo: string;
            if (ccpNumbers.has(h.id)) {
              ccpNo = ccpNumbers.get(h.id)!;
            } else if (status === "NOT_A_CCP") {
              ccpNo = "非 CCP";
            } else {
              ccpNo = "待判定";
            }
            return new TableRow({
              children: [
                cell(`${s.order}. ${s.name}`, { widthDxa: widths[0] }),
                cell(`${hazardTypeLetter(h.type)} — ${h.description}`, { widthDxa: widths[1] }),
                cell(ynText(h.ccpQ1CanBeControlledByPrp), { widthDxa: widths[2] }),
                cell(ynText(h.ccpQ2HasSpecificControlMeasures), { widthDxa: widths[3] }),
                cell(ynText(h.ccpQ3WillLaterStepPreventOrEliminate), { widthDxa: widths[4] }),
                cell(ynText(h.ccpQ4CanStepPreventOrEliminate), { widthDxa: widths[5] }),
                cell(ccpNo, { bold: status === "CCP", widthDxa: widths[6] }),
              ],
            });
          }
        )
  );
  if (dataRows.length === 0) {
    dataRows.push(
      new TableRow({
        children: [
          new TableCell({
            columnSpan: 7,
            children: [new Paragraph({ text: "该产品尚未识别或判定任何危害。" })],
          }),
        ],
      })
    );
  }
  const rows = [
    headerRow(
      [
        "流程步骤",
        "显著危害",
        "Q1. 该显著危害能否通过前提方案（如 GHP）在本步骤被控制在可接受水平？a",
        "Q2. 本步骤是否存在针对该已识别显著危害的特定控制措施？",
        "Q3. 后续步骤是否将预防或消除该已识别显著危害，或将其降至可接受水平？",
        "Q4. 本步骤是否可针对该已识别显著危害加以预防或消除，或将其降至可接受水平？c",
        "CCP 编号",
      ],
      widths
    ),
    ...dataRows,
  ];
  return makeTable(widths, rows);
}

/** The HACCP worksheet (CXC 1-1969 Annex IV, Table 2): one row per
 *  CCP/PRW with its critical limit, monitoring (what/how/when/who),
 *  corrective action, verification and records. */
function haccpWorksheetTable(steps: StepWithHazards[]): Table {
  const ccpNumbers = assignCcpNumbers(steps);
  const widths = pctToDxa([7, 15, 12, 13, 12, 8, 8, 10, 8, 7]);
  const dataRows = steps.flatMap(
    (s): TableRow[] =>
      s.hazards
        .filter((h) => ccpNumbers.has(h.id))
        .map(
          (h): TableRow =>
            new TableRow({
              children: [
                cell(ccpNumbers.get(h.id)!, { bold: true, widthDxa: widths[0] }),
                cell(`${hazardTypeLetter(h.type)} — ${h.description}`, { widthDxa: widths[1] }),
                cell(h.criticalLimit?.trim() || "—", { widthDxa: widths[2] }),
                cell(h.monitoringProcedure?.trim() || "—", { widthDxa: widths[3] }),
                cell("—", { widthDxa: widths[4] }),
                cell(h.monitoringFrequency?.trim() || "—", { widthDxa: widths[5] }),
                cell(h.responsibleParty?.trim() || "—", { widthDxa: widths[6] }),
                cell(h.correctionAction?.trim() || "—", { widthDxa: widths[7] }),
                cell(h.verificationProcedure?.trim() || "—", { widthDxa: widths[8] }),
                cell(h.recordkeepingProcedure?.trim() || "—", { widthDxa: widths[9] }),
              ],
            })
        )
  );
  const rows = [
    headerRow(
      [
        "关键控制点（CCP）",
        "显著危害",
        "关键限值",
        "监控：监控什么",
        "监控：如何监控",
        "监控：何时（频率）",
        "监控：谁",
        "纠正措施",
        "验证活动",
        "记录",
      ],
      widths
    ),
    ...dataRows,
  ];
  return makeTable(widths, rows);
}

const HACCP_WORKSHEET_NOTES = `**各栏填写说明**

- **关键控制点（CCP）**：沿用 Annex IV 表 1 判定出的 CCP 编号。
- **显著危害**：该 CCP 所控制的显著危害（注明 B/C/P）。
- **关键限值**：可测量（时间、温度、pH、Aw 等）或可观察的判据。
- **监控**：四要素——**什么**（what）/ **如何**（how）/ **频率**（when）/ **谁**（who，职位）。
- **纠正措施**：偏离发生时对**产品**与**过程**的预先确定措施，确保 CCP 恢复受控、潜在不安全食品不到达消费者。
- **验证活动**：计划性验证（记录审查、抽样检测、校准、内审等）。
- **记录**：监控、纠正措施与验证所产生的记录名称。`;

const HAZARD_WORKSHEET_NOTES = `**栏位说明**

- **(1) 步骤**：*危害分析应对食品所用的每种原料开展，这通常在该原料的「接收」步骤完成；另一种做法是对原料与加工步骤分别做危害分析。*
- **(2) 潜在危害**：按 **B**（生物）/ **C**（化学）/ **P**（物理）标注；R 为放射性（如适用）。
- **(3) 是否需入 HACCP 计划**：是/否，并按 B/C/P 标注。
- **(4) 判定依据**：说明第 (3) 栏「是/否」的理由（如危害显著性、是否可被前提方案充分控制等）。
- **(5) 控制措施**：可施加的预防/消除/降低措施，按 B/C/P 标注。`;

const CCP_WORKSHEET_NOTES = `**各栏作答规则**

| 栏 | 填写指引 |
| --- | --- |
| 流程步骤 | 指明流程步骤 |
| 显著危害 | 描述危害及其成因 |
| Q1 | **是** → 本步骤不是 CCP（转向下一个危害/步骤）；**否** → 进入 Q2 |
| Q2 | **是** → 进入 Q3；**否** → 本步骤不是 CCP，后续步骤应被评估是否为 CCP b |
| Q3 | **是** → 该后续步骤应是 CCP；**否** → 进入 Q4 |
| Q4 | **是** → 本步骤是 CCP；**否** → 修改步骤、工艺或产品以实施控制措施 d |
| CCP 编号 | 为 CCP 编号，并纳入 HACCP 工作表 |

**脚注**

- **a** 考虑危害的显著性（无控制时的发生可能性与影响严重度），以及该危害是否可被良好卫生规范（GHP）等前提方案充分控制。GHP 可以是常规 GHP，也可以是控制该危害需要更多关注的 GHP（如监控与记录）。
- **b** 若在问题 2–4 未识别出 CCP，应修改工艺或产品以实施控制措施，并开展新的危害分析。
- **c** 考虑本步骤的控制措施是否与其他步骤的控制措施协同控制同一危害；若是，两个步骤都应被视为 CCP。
- **d** 在（新）危害分析之后，回到决策树起点。`;

// --- Markdown rendering ------------------------------------------------------
// SOP documents (sopTemplates.ts) are authored in markdown: #/##/### headings,
// **bold**, - and 1. lists (sometimes nested), --- rules, and pipe tables.
// Render them into real Word constructs (styled headings, bold runs, Word list
// numbering, a bordered rule, tables) so no raw markdown symbols survive in
// the exported document.

type MdBlock =
  | { kind: "heading"; level: number; text: string }
  | { kind: "para"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "bullet"; level: number; text: string }
  | { kind: "ordered"; level: number; listId: number; text: string }
  | { kind: "table"; header: string[]; rows: string[][] }
  | { kind: "hr" }
  | { kind: "blank" };

interface MdNumberingConfig {
  levels: ILevelsOptions[];
  reference: string;
}

interface MarkdownBlocks {
  blocks: (Paragraph | Table)[];
  numbering: MdNumberingConfig[];
}

const BULLET_REF = "haccp-bullets";
const orderedRef = (id: number) => `haccp-ordered-${id}`;

// Module-level counter: every ordered list in the exported document gets its
// own numbering reference, so numbering restarts at each list's start number
// (uniqueness also holds across multiple markdown sources / concurrent builds).
let nextOrderedListId = 1;

const CJK_CHAR = /[\u3000-\u303f\u4e00-\u9fff\u3040-\u30ff\uff00-\uffef]/;

function indentLevel(line: string): number {
  return Math.min(Math.floor((line.match(/^\s*/)?.[0].length ?? 0) / 2), 8);
}

/** Joins two wrapped lines of one paragraph without inserting a space around CJK text. */
function joinLines(a: string, b: string): string {
  if (CJK_CHAR.test(a.slice(-1)) || CJK_CHAR.test(b.charAt(0))) return a + b;
  return `${a} ${b}`;
}

/** Splits inline markdown (**bold**, *italic*, `code`) into styled TextRuns. */
function inlineRuns(text: string, base: { bold?: boolean; italics?: boolean } = {}): TextRun[] {
  const runs: TextRun[] = [];
  const re = /\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) runs.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    if (m[1] !== undefined) runs.push(new TextRun({ text: m[1], ...base, bold: true }));
    else if (m[2] !== undefined) runs.push(new TextRun({ text: m[2], ...base, italics: true }));
    else runs.push(new TextRun({ text: m[3] ?? "", ...base }));
    last = m.index + m[0].length;
  }
  if (last < text.length) runs.push(new TextRun({ text: text.slice(last), ...base }));
  if (runs.length === 0) runs.push(new TextRun({ text: "" }));
  return runs;
}

function isTableRow(line: string): boolean {
  return line.trim().startsWith("|");
}

function isSeparatorRow(line: string): boolean {
  const t = line.trim();
  return /^\|?[\s:|-]*-[\s:|-]*$/.test(t) && t.includes("-");
}

function parseCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());
}

function parseMarkdown(md: string): {
  blocks: MdBlock[];
  orderedLists: { id: number; start: number }[];
  usesBullets: boolean;
} {
  const lines = md.replace(/\r\n?/g, "\n").split("\n");
  const blocks: MdBlock[] = [];
  const orderedLists: { id: number; start: number }[] = [];
  let usesBullets = false;
  let activeOrderedId: number | null = null;
  let lastOrderedNumber = 0;
  let i = 0;

  const resetOrderedState = () => {
    activeOrderedId = null;
    lastOrderedNumber = 0;
  };

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    const prev = blocks[blocks.length - 1];

    if (trimmed.length === 0) {
      resetOrderedState();
      if (prev?.kind !== "blank") blocks.push({ kind: "blank" });
      i++;
      continue;
    }

    if (isTableRow(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      resetOrderedState();
      const header = parseCells(line);
      const rows: string[][] = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j]) && !isSeparatorRow(lines[j])) {
        rows.push(parseCells(lines[j]));
        j++;
      }
      blocks.push({ kind: "table", header, rows });
      i = j;
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      resetOrderedState();
      blocks.push({ kind: "heading", level: heading[1].length, text: heading[2].trim() });
      i++;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      resetOrderedState();
      blocks.push({ kind: "hr" });
      i++;
      continue;
    }

    const bullet = trimmed.match(/^[-*+]\s+(.*)$/);
    if (bullet) {
      usesBullets = true;
      blocks.push({ kind: "bullet", level: indentLevel(line), text: bullet[1] });
      i++;
      continue;
    }

    const ordered = trimmed.match(/^(\d+)[.)]\s+(.*)$/);
    if (ordered) {
      const n = parseInt(ordered[1], 10);
      // Continue the active list for consecutive items, and for an item that
      // follows its own nested bullets (e.g. "2. …\n   - …\n3. …"). Any other
      // context starts a fresh list at its own start number.
      const continues =
        activeOrderedId !== null &&
        (prev?.kind === "ordered" || (prev?.kind === "bullet" && n === lastOrderedNumber + 1));
      if (!continues) {
        const id = nextOrderedListId++;
        orderedLists.push({ id, start: n });
        activeOrderedId = id;
      }
      lastOrderedNumber = n;
      blocks.push({ kind: "ordered", level: indentLevel(line), listId: activeOrderedId!, text: ordered[2] });
      i++;
      continue;
    }

    const quote = trimmed.match(/^>\s?(.*)$/);
    if (quote) {
      if (prev?.kind === "quote") prev.text = joinLines(prev.text, quote[1]);
      else {
        resetOrderedState();
        blocks.push({ kind: "quote", text: quote[1] });
      }
      i++;
      continue;
    }

    // Plain text. An indented line continues the immediately preceding
    // paragraph or list item (the templates wrap long items across lines).
    if (
      line.length > trimmed.length &&
      (prev?.kind === "para" || prev?.kind === "bullet" || prev?.kind === "ordered")
    ) {
      prev.text = joinLines(prev.text, trimmed);
    } else {
      resetOrderedState();
      blocks.push({ kind: "para", text: trimmed });
    }
    i++;
  }

  return { blocks, orderedLists, usesBullets };
}

function renderMdBlocks(blocks: MdBlock[], demote: number): (Paragraph | Table)[] {
  return blocks.map((b): Paragraph | Table => {
    switch (b.kind) {
      case "heading":
        return new Paragraph({ children: inlineRuns(b.text), heading: headingForLevel(b.level + demote) });
      case "para":
        return new Paragraph({ children: inlineRuns(b.text) });
      case "quote":
        return new Paragraph({ children: inlineRuns(b.text, { italics: true }), indent: { left: 360 } });
      case "bullet":
        return new Paragraph({
          children: inlineRuns(b.text),
          numbering: { reference: BULLET_REF, level: b.level },
        });
      case "ordered":
        return new Paragraph({
          children: inlineRuns(b.text),
          numbering: { reference: orderedRef(b.listId), level: b.level },
        });
      case "table": {
        const ncols = Math.max(b.header.length, ...b.rows.map((r) => r.length), 1);
        const widths = pctToDxa(Array.from({ length: ncols }, () => 100 / ncols));
        const rows = [
          headerRow(b.header, widths),
          ...b.rows.map((r) => {
            const cells = r.slice(0, ncols);
            while (cells.length < ncols) cells.push("");
            return dataRow(cells, widths);
          }),
        ];
        return makeTable(widths, rows);
      }
      case "hr":
        return new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, space: 1, color: "999999" } },
        });
      case "blank":
        return new Paragraph({ text: "" });
      default:
        return new Paragraph({ text: "" });
    }
  });
}

function mdNumberingConfig(
  orderedLists: { id: number; start: number }[],
  usesBullets: boolean
): MdNumberingConfig[] {
  const config: MdNumberingConfig[] = [];
  if (usesBullets) {
    config.push({
      reference: BULLET_REF,
      levels: Array.from({ length: 9 }, (_, level): ILevelsOptions => ({
        level,
        format: LevelFormat.BULLET,
        text: level === 0 ? "\u2022" : level === 1 ? "\u25CB" : "\u25AA",
        alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720 + level * 360, hanging: 360 } } },
      })),
    });
  }
  for (const { id, start } of orderedLists) {
    config.push({
      reference: orderedRef(id),
      levels: [
        {
          level: 0,
          format: LevelFormat.DECIMAL,
          text: "%1.",
          start,
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
        {
          level: 1,
          format: LevelFormat.LOWER_LETTER,
          text: "%2.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
        },
        {
          level: 2,
          format: LevelFormat.LOWER_ROMAN,
          text: "%3.",
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } },
        },
      ],
    });
  }
  return config;
}

function markdownToBlocks(md: string, demote = 0): MarkdownBlocks {
  const parsed = parseMarkdown(md);
  return {
    blocks: renderMdBlocks(parsed.blocks, demote),
    numbering: mdNumberingConfig(parsed.orderedLists, parsed.usesBullets),
  };
}

export async function buildPlanDocx(plan: PlanWithRelations): Promise<Buffer> {
  const facility: Partial<FacilityProfile> = plan.facilityProfile ? JSON.parse(plan.facilityProfile) : {};
  const products = [...plan.products].sort((a, b) => a.order - b.order);
  const team = [...plan.haccpTeamMembers].sort((a, b) => a.order - b.order);

  const children: (Paragraph | Table | TableOfContents)[] = [];
  const numbering: MdNumberingConfig[] = [];
  const seenNumberingRefs = new Set<string>();

  const addMarkdown = (md: string, demote: number) => {
    const { blocks, numbering: n } = markdownToBlocks(md, demote);
    children.push(...blocks);
    for (const item of n) {
      if (!seenNumberingRefs.has(item.reference)) {
        seenNumberingRefs.add(item.reference);
        numbering.push(item);
      }
    }
  };

  // --- Title page + index --------------------------------------------------
  children.push(
    new Paragraph({ text: "HACCP 计划", heading: HeadingLevel.TITLE }),
    new Paragraph({ text: plan.name, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            "本计划依据 Codex Alimentarius（国际食品法典）/ NACMCF 的 HACCP 结构编制（5 个预备步骤、7 项原则）。",
          italics: true,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({ children: [new TextRun({ text: "目录", bold: true, size: 28 })] }),
    new TableOfContents("目录", { hyperlink: true, headingStyleRange: "1-2" })
  );

  // --- 1. Facility Profile -------------------------------------------------
  children.push(
    sectionHeading("1. 企业概况"),
    new Paragraph({ text: `企业名称：${facility.facilityName ?? ""}` }),
    new Paragraph({ text: `地址：${facility.address ?? ""}` }),
    new Paragraph({ text: `食品类别：${facility.foodCategories ?? ""}` }),
    new Paragraph({
      text: `负责人 / HACCP 团队组长：${facility.responsibleIndividual ?? ""} (${
        facility.responsibleIndividualContact ?? ""
      })`,
    }),
    new Paragraph({ text: "" })
  );

  // --- 2. Preliminary Step 1: HACCP Team -----------------------------------
  children.push(sectionHeading("2. HACCP 团队（预备步骤 1）"));
  if (team.length === 0) {
    children.push(new Paragraph({ text: "尚未添加 HACCP 团队成员。" }));
  } else {
    const teamWidths = pctToDxa([20, 20, 25, 35]);
    const rows = [
      headerRow(["姓名", "角色", "专业领域", "职责"], teamWidths),
      ...team.map((m) =>
        dataRow([m.name, m.role ?? "—", m.expertise ?? "—", m.responsibilities ?? "—"], teamWidths)
      ),
    ];
    children.push(makeTable(teamWidths, rows));
  }
  children.push(new Paragraph({ text: "" }));

  // --- 3. Products (Preliminary Steps 2 & 3) -------------------------------
  // FAO GHP & HACCP toolbox per product: Form 1 (product description,
  // preliminary steps 2 & 3) and Form 2 (ingredients & incoming material,
  // from the formulation).
  children.push(sectionHeading("3. 产品（预备步骤 2 和 3）"));
  if (products.length === 0) {
    children.push(new Paragraph({ text: "尚未向此计划添加产品。" }));
  } else {
    for (const p of products) {
      children.push(new Paragraph({ text: p.name, heading: HeadingLevel.HEADING_2 }));

      children.push(new Paragraph({ text: "产品描述表", heading: HeadingLevel.HEADING_3 }));
      children.push(faoFormHeaderLine(facility.facilityName ?? "", p.name));
      children.push(productDescriptionForm(p));
      children.push(faoFormFooterLine());
      addMarkdown(PRODUCT_DESCRIPTION_NOTES, 0);

      children.push(new Paragraph({ text: "产品成分与来料表", heading: HeadingLevel.HEADING_3 }));
      children.push(faoFormHeaderLine(facility.facilityName ?? "", p.name));
      children.push(productIngredientsForm(p));
      children.push(faoFormFooterLine());
      addMarkdown(PRODUCT_INGREDIENTS_NOTES, 0);

      children.push(new Paragraph({ text: "" }));
    }
  }

  // --- 4. Approved Suppliers ------------------------------------------------
  children.push(sectionHeading("4. 合格供应商"));
  const vendors = [...plan.vendors].sort((a, b) => a.order - b.order);
  if (vendors.length === 0) {
    children.push(new Paragraph({ text: "尚未向此计划添加供应商。" }));
  } else {
    const vendorWidths = pctToDxa([20, 26, 12, 14, 14, 14]);
    const rows = [
      headerRow(["供应商", "供应物料", "状态", "认证", "保证书", "联系人"], vendorWidths),
      ...vendors.map((v) =>
        dataRow(
          [
            v.name,
            v.materialsSupplied ?? "—",
            v.status,
            v.certification ?? "—",
            v.guaranteeOnFile ? `有${v.guaranteeExpiry ? `（有效期至 ${v.guaranteeExpiry}）` : ""}` : "无",
            [v.contactName, v.phone, v.email].filter(Boolean).join(", ") || "—",
          ],
          vendorWidths
        )
      ),
    ];
    children.push(makeTable(vendorWidths, rows));
  }
  children.push(new Paragraph({ text: "" }));

  // --- 5. GMPs & Prerequisite Programs --------------------------------------
  children.push(sectionHeading("5. GMP 与前提方案"));
  const gmpSops = plan.sops.filter((s) => getTemplate(s.templateKey)?.category === "gmp");
  if (gmpSops.length === 0) {
    children.push(new Paragraph({ text: "尚未生成 GMP / 前提方案文档。" }));
  } else {
    for (const sop of gmpSops) {
      addMarkdown(sop.content, 1);
      children.push(new Paragraph({ text: "" }));
    }
  }

  // --- 6. Process Flow & Formulations (Preliminary Steps 4 & 5) -----------
  children.push(sectionHeading("6. 工艺流程与配方（预备步骤 4 和 5）"));

  for (const product of products) {
    children.push(new Paragraph({ text: product.name, heading: HeadingLevel.HEADING_2 }));

    const steps = [...product.processSteps].sort((a, b) => a.order - b.order);
    if (steps.length === 0) {
      children.push(new Paragraph({ text: "未记录此产品的工艺步骤。" }));
    } else {
      const stepWidths = pctToDxa([12, 30, 58]);
      const rows = [
        headerRow(["步骤 #", "名称", "描述"], stepWidths),
        ...steps.map((s) => dataRow([String(s.order), s.name, s.description ?? "—"], stepWidths)),
      ];
      children.push(makeTable(stepWidths, rows));
    }
    children.push(new Paragraph({ text: "" }));

    children.push(new Paragraph({ text: "预备步骤 5——流程图现场确认：" }));
    children.push(
      new Paragraph({
        text: product.flowConfirmedAt
          ? `由 ${product.flowConfirmedBy ?? "—"} 于 ${product.flowConfirmedAt.toLocaleDateString(
              "en-US"
            )} 确认。${product.flowConfirmationNotes ?? ""}`.trim()
          : "尚未现场确认——定稿前，请到实际生产现场走查并确认以上流程图与实际情况一致。",
      })
    );
    children.push(new Paragraph({ text: "" }));

    const ingredients = [...product.ingredients].sort((a, b) => a.order - b.order);
    children.push(new Paragraph({ text: "配方", heading: HeadingLevel.HEADING_3 }));
    if (ingredients.length === 0) {
      children.push(new Paragraph({ text: "未记录此产品的原料。" }));
    } else {
      const ingWidths = pctToDxa([22, 12, 18, 14, 10, 24]);
      const rows = [
        headerRow(
          ["原料", "配方占比 %", "功能作用", "原产国", "是否过敏原", "过敏原类型"],
          ingWidths
        ),
        ...ingredients.map((i) =>
          dataRow(
            [
              i.name,
              i.percentageOfFormulation ?? "—",
              i.functionalRole ?? "—",
              i.countryOfOrigin ?? "—",
              i.isAllergen ? "是" : "否",
              i.allergenType ?? "—",
            ],
            ingWidths
          )
        ),
      ];
      children.push(makeTable(ingWidths, rows));
    }
    children.push(new Paragraph({ text: "" }));
  }

  // --- 7. Hazard Analysis & CCP Determination (Principles 1 & 2) ----------
  // Two Codex worksheets per product: the hazard-analysis worksheet
  // (Annex III, Table 1) and the CCP-determination worksheet
  // (Annex IV, Table 1).
  children.push(sectionHeading("7. 危害分析与 CCP 判定（原则 1 和 2）"));

  for (const product of products) {
    const steps = [...product.processSteps].sort((a, b) => a.order - b.order);
    if (steps.length === 0) continue;
    children.push(new Paragraph({ text: product.name, heading: HeadingLevel.HEADING_2 }));

    children.push(new Paragraph({ text: "危害分析工作表", heading: HeadingLevel.HEADING_3 }));
    children.push(worksheetInfoTable(facility, product.name));
    children.push(new Paragraph({ text: "" }));
    children.push(hazardAnalysisTable(steps));
    addMarkdown(HAZARD_WORKSHEET_NOTES, 0);
    children.push(new Paragraph({ text: "" }));

    children.push(new Paragraph({ text: "CCP 判定工作表", heading: HeadingLevel.HEADING_3 }));
    children.push(worksheetInfoTable(facility, product.name));
    children.push(new Paragraph({ text: "" }));
    children.push(ccpDeterminationTable(steps));
    addMarkdown(CCP_WORKSHEET_NOTES, 0);
    children.push(new Paragraph({ text: "" }));
  }

  // --- 8. Preventive Controls Detail (Principles 3-7) ----------------------
  // The HACCP worksheet (Annex IV, Table 2): one row per CCP/PRW with its
  // critical limit, monitoring (what/how/when/who), corrective action,
  // verification and records. CCP numbers match the determination worksheet.
  children.push(sectionHeading("8. 预防控制措施详情（原则 3-7）"));
  const hasCcp = (h: Hazard) => {
    const st = evaluateCcpStatus(h);
    return st === "CCP" || st === "PRW";
  };
  const anyCcps = products.some((p) => p.processSteps.some((s) => s.hazards.some(hasCcp)));
  if (!anyCcps) {
    children.push(
      new Paragraph({
        text: "尚未指定任何关键控制点或工艺预防控制。在「CCP 判定工作表」中判定各重大危害后，此表将自动汇总。",
      })
    );
  } else {
    for (const product of products) {
      const steps = [...product.processSteps].sort((a, b) => a.order - b.order);
      if (!steps.some((s) => s.hazards.some(hasCcp))) continue;

      children.push(new Paragraph({ text: product.name, heading: HeadingLevel.HEADING_2 }));
      children.push(new Paragraph({ text: "HACCP 工作表", heading: HeadingLevel.HEADING_3 }));
      children.push(worksheetInfoTable(facility, product.name));
      children.push(new Paragraph({ text: "" }));
      children.push(haccpWorksheetTable(steps));
      addMarkdown(HACCP_WORKSHEET_NOTES, 0);
      children.push(new Paragraph({ text: "" }));
    }
  }

  // --- 9. Recall Plan --------------------------------------------------------
  children.push(sectionHeading("9. 召回计划"));

  children.push(new Paragraph({ text: "召回团队", heading: HeadingLevel.HEADING_2 }));
  if (plan.recallContacts.length === 0) {
    children.push(new Paragraph({ text: "尚未指定召回团队成员。" }));
  } else {
    const contactWidths = pctToDxa([25, 25, 20, 30]);
    const rows = [
      headerRow(["角色", "姓名", "电话", "邮箱"], contactWidths),
      ...plan.recallContacts.map((c) => dataRow([c.role, c.name, c.phone ?? "—", c.email ?? "—"], contactWidths)),
    ];
    children.push(makeTable(contactWidths, rows));
  }
  children.push(new Paragraph({ text: "" }));

  children.push(new Paragraph({ text: "模拟召回记录（年度）", heading: HeadingLevel.HEADING_2 }));
  if (plan.mockRecallRecords.length === 0) {
    children.push(
      new Paragraph({
        text: "尚无模拟召回记录。建议每年至少进行一次并记录模拟召回。",
      })
    );
  } else {
    const mockWidths = pctToDxa([15, 20, 15, 50]);
    const rows = [
      headerRow(["日期", "执行人", "追溯率 %", "结果摘要"], mockWidths),
      ...[...plan.mockRecallRecords]
        .sort((a, b) => b.performedAt.getTime() - a.performedAt.getTime())
        .map((r) =>
          dataRow(
            [r.performedAt.toLocaleDateString("en-US"), r.performedBy ?? "—", r.percentTraced ?? "—", r.resultsSummary ?? "—"],
            mockWidths
          )
        ),
    ];
    children.push(makeTable(mockWidths, rows));
  }
  children.push(new Paragraph({ text: "" }));

  const recallSop = plan.sops.find((s) => s.templateKey === "recall");
  if (recallSop) {
    addMarkdown(recallSop.content, 1);
    children.push(new Paragraph({ text: "" }));
  }

  // --- 10. Food Safety SOPs --------------------------------------------------
  children.push(sectionHeading("10. 食品安全 SOP"));
  const foodSafetySops = plan.sops.filter((s) => getTemplate(s.templateKey)?.category === "food_safety");
  if (foodSafetySops.length === 0) {
    children.push(new Paragraph({ text: "尚未生成其他食品安全 SOP。" }));
  } else {
    for (const sop of foodSafetySops) {
      addMarkdown(sop.content, 1);
      children.push(new Paragraph({ text: "" }));
    }
  }

  children.push(
    new Paragraph({ text: "" }),
    new Paragraph({
      text:
        "本文件由 HACCP 计划生成器协助起草，使用前应经贵企业负责食品安全的人员（如适用，还应包括合格的 HACCP 顾问）审阅并签字确认。",
    })
  );

  const doc = new Document({
    features: { updateFields: true },
    ...(numbering.length > 0 ? { numbering: { config: numbering } } : {}),
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun("第 "),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                  new TextRun(" 页，共 "),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
