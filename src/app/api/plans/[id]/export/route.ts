import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { canExportPlan } from "@/lib/entitlements";
import { buildPlanDocx } from "@/lib/exportDocx";
import { apiHandler } from "@/lib/apiHandler";

// Size guard for DOCX export. buildPlanDocx holds the entire document tree
// (one Paragraph/TableCell object per hazard, rendered across three worksheet
// tables) in memory and blocks the event loop while serializing. A plan with
// many hazards can exhaust a 512MB serverless instance or stall the event
// loop for seconds. Measured: ~1800 hazards ≈ ~2s and high peak heap. Reject
// pathological sizes before generation instead of crashing mid-export.
// Tunable via env (lower it on small instances).
const MAX_EXPORT_HAZARDS = Math.max(50, Number(process.env.MAX_EXPORT_HAZARDS ?? 1500));

export const GET = apiHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const plan = await db.plan.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      products: {
        include: {
          processSteps: { include: { hazards: true }, orderBy: { order: "asc" } },
          ingredients: { include: { supplierVendor: true }, orderBy: { order: "asc" } },
        },
        orderBy: { order: "asc" },
      },
      vendors: { orderBy: { order: "asc" } },
      sops: true,
      recallContacts: { orderBy: { order: "asc" } },
      mockRecallRecords: true,
      haccpTeamMembers: { orderBy: { order: "asc" } },
    },
  });
  if (!plan) return NextResponse.json({ error: "未找到" }, { status: 404 });

  if (!canExportPlan(plan)) {
    return NextResponse.json({ error: "请先解锁此计划，再进行导出。" }, { status: 402 });
  }

  // Scale guard: count hazards (the dominant driver of docx object churn) and
  // refuse to generate for plans that would likely OOM / stall the event loop.
  const totalHazards = plan.products.reduce(
    (n, p) => n + p.processSteps.reduce((m, s) => m + s.hazards.length, 0),
    0
  );
  if (totalHazards > MAX_EXPORT_HAZARDS) {
    return NextResponse.json(
      {
        error: `该计划包含 ${totalHazards} 条危害记录，超过单次导出上限 ${MAX_EXPORT_HAZARDS} 条。为避免导出超时或内存溢出，请将计划按产品拆分为多个较小的计划后再导出，或联系客服协助。`,
        totalHazards,
        limit: MAX_EXPORT_HAZARDS,
      },
      { status: 413 }
    );
  }

  const buffer = await buildPlanDocx(plan);
  await db.planExport.create({ data: { planId: plan.id, format: "docx" } });

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${plan.name.replace(/[^a-z0-9-_ ]/gi, "").trim() || "haccp-plan"}.docx"`,
    },
  });
});
