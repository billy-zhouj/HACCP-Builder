import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";
import { apiHandler } from "@/lib/apiHandler";
import { parseFacilityProfile } from "@/lib/safeJsonParse";

export const GET = apiHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const plan = await db.plan.findFirst({
    where: { id: params.id, userId: user.id },
    include: {
      products: {
        include: {
          processSteps: { include: { hazards: true }, orderBy: { order: "asc" } },
          ingredients: { orderBy: { order: "asc" } },
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

  return NextResponse.json({
    ...plan,
    facilityProfile: parseFacilityProfile(plan.facilityProfile),
  });
});

export const PATCH = apiHandler(async (req: Request, { params }: { params: { id: string } }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const owned = await getOwnedPlan(params.id, user.id);
  if (!owned) return NextResponse.json({ error: "未找到" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.status === "string") data.status = body.status;
  if (body.facilityProfile && typeof body.facilityProfile === "object") {
    data.facilityProfile = JSON.stringify(body.facilityProfile);
  }

  const updated = await db.plan.update({ where: { id: owned.id }, data });
  return NextResponse.json({
    ...updated,
    facilityProfile: parseFacilityProfile(updated.facilityProfile),
  });
});

export const DELETE = apiHandler(async (_req: Request, { params }: { params: { id: string } }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const owned = await getOwnedPlan(params.id, user.id);
  if (!owned) return NextResponse.json({ error: "未找到" }, { status: 404 });

  await db.plan.delete({ where: { id: owned.id } });
  return NextResponse.json({ ok: true });
});
