import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/apiHandler";

export const POST = apiHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const plan = await getOwnedPlan(params.id, user.id);
  if (!plan) return NextResponse.json({ error: "未找到" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const count = await db.haccpTeamMember.count({ where: { planId: plan.id } });
  const member = await db.haccpTeamMember.create({
    data: {
      planId: plan.id,
      name: body.name || "新团队成员",
      role: body.role ?? null,
      expertise: body.expertise ?? null,
      responsibilities: body.responsibilities ?? null,
      order: count,
    },
  });
  return NextResponse.json(member, { status: 201 });
});
