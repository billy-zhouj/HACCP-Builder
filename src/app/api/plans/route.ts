import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { computeRetentionExpiry } from "@/lib/entitlements";
import { apiHandler } from "@/lib/apiHandler";

export const GET = apiHandler(async () => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const plans = await db.plan.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return NextResponse.json(plans);
});

export const POST = apiHandler(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim() : "未命名 HACCP 计划";

  const plan = await db.plan.create({
    data: {
      userId: user.id,
      name,
      retentionExpiresAt: computeRetentionExpiry({ from: new Date(), user }),
    },
  });

  return NextResponse.json(plan, { status: 201 });
});
