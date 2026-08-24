import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { computeRetentionExpiry } from "@/lib/entitlements";

/**
 * 激活订单并解锁对应计划。
 *
 * 该路由模拟「到账审核」：将订单标记为 paid + activated，并把对应计划
 * 的 isPaid 置为 true（解锁 Word 导出）。仅订单所属用户可操作。
 *
 * 真实部署时，此路由应替换为支付宝 / 微信商户平台回调（或后台管理员审核）。
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const order = await db.order.findFirst({ where: { id: params.id, userId: user.id } });
  if (!order) return NextResponse.json({ error: "未找到订单" }, { status: 404 });

  if (order.status === "activated") {
    return NextResponse.json({ message: "订单已激活" });
  }
  if (order.status === "expired" || order.status === "cancelled") {
    return NextResponse.json({ error: "订单已失效，无法激活" }, { status: 400 });
  }

  const plan = await db.plan.findFirst({ where: { id: order.planId, userId: user.id } });
  if (!plan) return NextResponse.json({ error: "未找到关联计划" }, { status: 404 });

  const now = new Date();

  await db.$transaction([
    db.order.update({
      where: { id: order.id },
      data: { status: "activated", paidAt: order.paidAt ?? now, activatedAt: now },
    }),
    db.plan.update({
      where: { id: plan.id },
      data: {
        isPaid: true,
        paidAt: now,
        retentionExpiresAt: computeRetentionExpiry({ from: now, user }),
      },
    }),
  ]);

  return NextResponse.json({ success: true });
}
