import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/apiHandler";

async function getOwnedSop(planId: string, sopId: string, userId: string) {
  const plan = await getOwnedPlan(planId, userId);
  if (!plan) return null;
  return db.sop.findFirst({ where: { id: sopId, planId: plan.id } });
}

export const PATCH = apiHandler(async (req: Request, { params }: { params: { id: string; sopId: string } }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const owned = await getOwnedSop(params.id, params.sopId, user.id);
  if (!owned) return NextResponse.json({ error: "未找到" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = { isCustom: true };
  if (typeof body.content === "string") data.content = body.content;
  if (typeof body.title === "string") data.title = body.title;

  const updated = await db.sop.update({ where: { id: owned.id }, data });
  return NextResponse.json(updated);
});

export const DELETE = apiHandler(async (_req: Request, { params }: { params: { id: string; sopId: string } }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const owned = await getOwnedSop(params.id, params.sopId, user.id);
  if (!owned) return NextResponse.json({ error: "未找到" }, { status: 404 });

  await db.sop.delete({ where: { id: owned.id } });
  return NextResponse.json({ ok: true });
});
