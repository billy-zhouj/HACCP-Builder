import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { db } from "@/lib/db";
import { computeRetentionExpiry } from "@/lib/entitlements";
import { apiHandler } from "@/lib/apiHandler";

/**
 * 激活订单并解锁对应计划。
 *
 * 该路由模拟「到账审核」：将订单标记为 paid + activated，并把对应计划
 * 的 isPaid 置为 true（解锁 Word 导出）。仅订单所属用户可操作。
 *
 * 真实部署时，此路由应替换为支付宝 / 微信商户平台回调（或后台管理员审核）。
 *
 * 竞态条件修复：事务中使用条件更新 `where: { id, status: "pending_payment" }`，
 * 确保并发激活请求中只有一个能成功。
 */
export const POST = apiHandler(async (req: Request, { params }: { params: { orderId: string } }) => {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const order = await db.order.findFirst({ where: { id: params.orderId, userId: user.id } });
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

  // Conditional transaction: only update if status is still "pending_payment".
  // This prevents race conditions when two concurrent activation requests
  // both pass the pre-check above. The `updateMany` returns { count } — if
  // count is 0, another request already activated the order.
  const result = await db.$transaction(async (tx) => {
    const updated = await tx.order.updateMany({
      where: { id: order.id, status: "pending_payment" },
      data: { status: "activated", paidAt: order.paidAt ?? now, activatedAt: now },
    });

    if (updated.count === 0) {
      // Already activated by a concurrent request — return null to signal "no-op".
      return null;
    }

    const updatedPlan = await tx.plan.update({
      where: { id: plan.id },
      data: {
        isPaid: true,
        paidAt: now,
        retentionExpiresAt: computeRetentionExpiry({ from: now, user }),
      },
    });

    return updatedPlan;
  });

  if (!result) {
    return NextResponse.json({ message: "订单已激活（并发请求已被阻止）" });
  }

  return NextResponse.json({ success: true });
});
