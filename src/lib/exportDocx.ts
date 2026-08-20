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
} from "docx";
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
import { REGULATORY_SCOPE_OPTIONS } from "@/types";

type PlanWithRelations = Plan & {
  products: (Product & {
    processSteps: (ProcessStep & { hazards: Hazard[] })[];
    ingredients: Ingredient[];
  })[];
  vendors: Vendor[];
  sops: Sop[];
  recallContacts: RecallContact[];
  mockRecallRecords: MockRecallRecord[];
  haccpTeamMembers: HaccpTeamMember[];
};

function regulatoryScopeLabel(value: string): string {
  return REGULATORY_SCOPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

const CONTENT_WIDTH_DXA = 9360;

function pctToDxa(pcts: number[]): number[] {
  return pcts.map((p) => Math.round((CONTENT_WIDTH_DXA * p) / 100));
}

function cell(text: string, opts: { bold?: boolean; widthDxa?: number } = {}) {
  return new TableCell({
    width: opts.widthDxa ? { size: opts.widthDxa, type: WidthType.DXA } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: opts.bold })] })],
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

function markdownToBlocks(md: string, demote = 0): (Paragraph | Table)[] {
  const lines = md.split("\n");
  const blocks: (Paragraph | Table)[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (isTableRow(line) && i + 1 < lines.length && isSeparatorRow(lines[i + 1])) {
      const header = parseCells(line);
      const bodyLines: string[] = [];
      let j = i + 2;
      while (j < lines.length && isTableRow(lines[j]) && !isSeparatorRow(lines[j])) {
        bodyLines.push(lines[j]);
        j++;
      }
      const ncols = header.length;
      const widths = pctToDxa(Array.from({ length: ncols }, () => 100 / ncols));
      const rows = [
        headerRow(header, widths),
        ...bodyLines.map((bl) => {
          const cells = parseCells(bl);
          while (cells.length < ncols) cells.push("");
          return dataRow(cells.slice(0, ncols), widths);
        }),
      ];
      blocks.push(makeTable(widths, rows));
      i = j;
      continue;
    }

    if (line.startsWith("# ")) {
      blocks.push(new Paragraph({ text: line.replace("# ", ""), heading: headingForLevel(1 + demote) }));
    } else if (line.startsWith("## ")) {
      blocks.push(new Paragraph({ text: line.replace("## ", ""), heading: headingForLevel(2 + demote) }));
    } else if (line.startsWith("### ")) {
      blocks.push(new Paragraph({ text: line.replace("### ", ""), heading: headingForLevel(3 + demote) }));
    } else if (line.trim().length === 0) {
      blocks.push(new Paragraph({ text: "" }));
    } else {
      blocks.push(new Paragraph({ text: line }));
    }
    i++;
  }

  return blocks;
}

export async function buildPlanDocx(plan: PlanWithRelations): Promise<Buffer> {
  const facility: Partial<FacilityProfile> = plan.facilityProfile ? JSON.parse(plan.facilityProfile) : {};
  const products = [...plan.products].sort((a, b) => a.order - b.order);
  const team = [...plan.haccpTeamMembers].sort((a, b) => a.order - b.order);

  const children: (Paragraph | Table | TableOfContents)[] = [];

  // --- Title page + index --------------------------------------------------
  children.push(
    new Paragraph({ text: "HACCP 计划", heading: HeadingLevel.TITLE }),
    new Paragraph({ text: plan.name, heading: HeadingLevel.HEADING_2 }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            "本计划依据 Codex Alimentarius（国际食品法典）/ NACMCF 的 HACCP 结构编制（5 个预备步骤、7 项原则）。请参阅各章节中的法规依据说明，了解适用于本企业范围的美国（FDA/USDA FSIS）和加拿大（CFIA）具体条款。",
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
      text: `法规范围：${
        (facility.regulatoryScopes ?? []).map(regulatoryScopeLabel).join("; ") || ""
      }`,
    }),
    new Paragraph({ text: `CFIA 许可证号：${facility.cfiaLicenseNumber ?? ""}` }),
    new Paragraph({ text: `FDA 注册号：${facility.fdaRegistrationNumber ?? ""}` }),
    new Paragraph({
      text: `负责人 / HACCP 团队组长：${facility.responsibleIndividual ?? ""} (${
        facility.responsibleIndividualContact ?? ""
      })`,
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            "如本企业加工海产品、果汁或肉类/禽肉产品，除本文件采用的一般 HACCP 结构外，本计划还必须满足该行业的具体法规要求（分别对应 21 CFR 123、21 CFR 120 或 9 CFR 417）。",
          italics: true,
        }),
      ],
    })
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
  children.push(sectionHeading("3. 产品（预备步骤 2 和 3）"));
  if (products.length === 0) {
    children.push(new Paragraph({ text: "尚未向此计划添加产品。" }));
  } else {
    for (const p of products) {
      children.push(new Paragraph({ text: p.name, heading: HeadingLevel.HEADING_2 }));
      children.push(new Paragraph({ text: `产品描述与分销：${p.productDescription ?? ""}` }));
      children.push(new Paragraph({ text: `预期用途：${p.intendedUse ?? ""}` }));
      children.push(new Paragraph({ text: `预期消费者：${p.intendedConsumer ?? ""}` }));
      children.push(new Paragraph({ text: `包装类型：${p.packagingType ?? ""}` }));
      children.push(new Paragraph({ text: `保质期与储存：${p.shelfLifeAndStorage ?? ""}` }));
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
      children.push(...markdownToBlocks(sop.content, 1));
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
  children.push(sectionHeading("7. 危害分析与 CCP 判定（原则 1 和 2）"));

  for (const product of products) {
    const steps = [...product.processSteps].sort((a, b) => a.order - b.order);
    if (steps.length === 0) continue;
    children.push(new Paragraph({ text: product.name, heading: HeadingLevel.HEADING_2 }));

    for (const step of steps) {
      children.push(new Paragraph({ text: `步骤 ${step.order}：${step.name}` }));
      if (step.hazards.length === 0) {
        children.push(new Paragraph({ text: "未记录此步骤的危害。" }));
        continue;
      }
      const hazardWidths = pctToDxa([12, 26, 8, 12, 20, 22]);
      const rows = [
        headerRow(["危害类型", "描述", "重大?", "CCP 状态", "关键限值", "监控"], hazardWidths),
        ...step.hazards.map((h) =>
          dataRow(
            [
              h.type,
              h.description,
              h.requiresPreventiveControl ? "是" : "否",
              h.ccpStatus,
              h.criticalLimit ?? "—",
              h.monitoringProcedure ?? "—",
            ],
            hazardWidths
          )
        ),
      ];
      children.push(makeTable(hazardWidths, rows));
      children.push(new Paragraph({ text: "" }));
    }
  }

  // --- 8. Preventive Controls Detail (Principles 3-7) ----------------------
  children.push(sectionHeading("8. 预防控制措施详情（原则 3-7）"));
  const anyCcps = products.some((p) =>
    p.processSteps.some((s) => s.hazards.some((h) => h.ccpStatus === "CCP" || h.ccpStatus === "PRW"))
  );
  if (!anyCcps) {
    children.push(new Paragraph({ text: "尚未指定任何关键控制点或工艺预防控制。" }));
  } else {
    for (const product of products) {
      const ccpHazards = product.processSteps.flatMap((s) =>
        s.hazards.filter((h) => h.ccpStatus === "CCP" || h.ccpStatus === "PRW")
      );
      if (ccpHazards.length === 0) continue;

      children.push(new Paragraph({ text: product.name, heading: HeadingLevel.HEADING_2 }));
      for (const h of ccpHazards) {
        children.push(new Paragraph({ text: h.description, heading: HeadingLevel.HEADING_3 }));
        children.push(new Paragraph({ text: `状态：${h.ccpStatus}` }));
        children.push(new Paragraph({ text: `关键限值（原则 3）：${h.criticalLimit ?? "—"}` }));
        children.push(new Paragraph({ text: `监控程序（原则 4）：${h.monitoringProcedure ?? "—"}` }));
        children.push(new Paragraph({ text: `监控频率：${h.monitoringFrequency ?? "—"}` }));
        children.push(new Paragraph({ text: `纠正措施（原则 5）：${h.correctionAction ?? "—"}` }));
        children.push(new Paragraph({ text: `验证程序（原则 6）：${h.verificationProcedure ?? "—"}` }));
        children.push(new Paragraph({ text: `记录保存（原则 7）：${h.recordkeepingProcedure ?? "—"}` }));
        children.push(new Paragraph({ text: `责任人：${h.responsibleParty ?? "—"}` }));
        children.push(new Paragraph({ text: "" }));
      }
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
        text: "尚无模拟召回记录。FDA/USDA FSIS 和 CFIA 都期望每年至少进行一次并记录模拟召回。",
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
    children.push(...markdownToBlocks(recallSop.content, 1));
    children.push(new Paragraph({ text: "" }));
  }

  // --- 10. Food Safety SOPs --------------------------------------------------
  children.push(sectionHeading("10. 食品安全 SOP"));
  const foodSafetySops = plan.sops.filter((s) => getTemplate(s.templateKey)?.category === "food_safety");
  if (foodSafetySops.length === 0) {
    children.push(new Paragraph({ text: "尚未生成其他食品安全 SOP。" }));
  } else {
    for (const sop of foodSafetySops) {
      children.push(...markdownToBlocks(sop.content, 1));
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
