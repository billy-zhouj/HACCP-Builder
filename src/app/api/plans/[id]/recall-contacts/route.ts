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
  const count = await db.recallContact.count({ where: { planId: plan.id } });
  const contact = await db.recallContact.create({
    data: {
      planId: plan.id,
      role: body.role || "团队成员",
      name: body.name || "新联系人",
      phone: body.phone ?? null,
      email: body.email ?? null,
      order: count,
    },
  });
  return NextResponse.json(contact, { status: 201 });
});
