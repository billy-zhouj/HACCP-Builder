import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";
import { PLAN_UNLOCK_PRICE_CNY, toFen, toYuan } from "@/lib/orderPricing";
import { apiHandler } from "@/lib/apiHandler";

/**
 * 国内人工订单提交接口（支付宝 / 微信扫码支付）。
 *
 * 流程：用户提交 → 生成订单号存库 → 返回付款信息（收款账户/二维码）→
 * 到账后由人工审核（或开发模式旁路）激活 → 解锁该计划的 Word 导出。
 */
export const POST = apiHandler(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const requiredFields = ["planId", "paymentMethod"];
  for (const field of requiredFields) {
    if (!body[field]) {
      return NextResponse.json({ error: `缺少必填字段：${field}` }, { status: 400 });
    }
  }

  const validPaymentMethods = ["alipay", "wechat"];
  if (!validPaymentMethods.includes(body.paymentMethod)) {
    return NextResponse.json({ error: "无效的支付方式" }, { status: 400 });
  }

  // 金额校验：以服务端价格表为准，客户端传入金额与价格表不一致则拒绝。
  const amountFen = toFen(PLAN_UNLOCK_PRICE_CNY);

  // Verify plan belongs to user.
  const plan = await getOwnedPlan(body.planId, user.id);
  if (!plan) return NextResponse.json({ error: "未找到计划" }, { status: 404 });
  if (plan.isPaid) {
    return NextResponse.json({ error: "该计划已解锁，无需重复支付" }, { status: 400 });
  }

  // Generate human-readable order number: ORD-YYYYMMDD-XXXXX
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).substring(2, 7).toUpperCase();
  const orderNumber = `ORD-${dateStr}-${suffix}`;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const order = await db.order.create({
    data: {
      userId: user.id,
      planId: plan.id,
      orderNumber,
      amountCNY: amountFen,
      paymentMethod: body.paymentMethod,
      companyName: typeof body.companyName === "string" ? body.companyName : null,
      contactEmail: typeof body.contactEmail === "string" ? body.contactEmail : null,
      taxNumber: typeof body.taxNumber === "string" && body.taxNumber ? body.taxNumber : null,
      note: typeof body.note === "string" ? body.note : null,
      status: "pending_payment",
      expiresAt,
    },
  });

  const paymentInstructions = getPaymentInstructions(order.paymentMethod, order.amountCNY, order.orderNumber);

  return NextResponse.json({
    success: true,
    orderId: order.id,
    orderNumber: order.orderNumber,
    amountCNY: toYuan(order.amountCNY),
    expiresAt: order.expiresAt.toISOString(),
    paymentInstructions,
    nextSteps: [
      "使用支付宝 / 微信扫描二维码完成付款",
      "付款到账后，管理员将审核并开通导出权限",
      "开通后即可在「审核与导出」页下载 Word 文档",
    ],
  });
});

/**
 * GET /api/orders/manual?orderId=xxx or ?orderNumber=xxx
 * 查询订单状态（仅本人订单）。
 */
export const GET = apiHandler(async (req: Request) => {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  const orderNumber = searchParams.get("orderNumber");

  if (!orderId && !orderNumber) {
    return NextResponse.json({ error: "请提供订单号" }, { status: 400 });
  }

  const where = orderId
    ? { id: orderId, userId: user.id }
    : { orderNumber: orderNumber!, userId: user.id };

  const order = await db.order.findFirst({ where });
  if (!order) {
    return NextResponse.json({ error: "订单不存在" }, { status: 404 });
  }

  return NextResponse.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    amountCNY: toYuan(order.amountCNY),
    paymentMethod: order.paymentMethod,
    companyName: order.companyName,
    contactEmail: order.contactEmail,
    status: order.status,
    createdAt: order.createdAt.toISOString(),
    expiresAt: order.expiresAt.toISOString(),
    paidAt: order.paidAt?.toISOString() ?? null,
    activatedAt: order.activatedAt?.toISOString() ?? null,
  });
});

function getPaymentInstructions(method: string, amountFen: number, orderNumber: string) {
  const amountYuan = (amountFen / 100).toFixed(2);

  if (method === "alipay") {
    return {
      method: "支付宝",
      accountName: process.env.ALIPAY_ACCOUNT_NAME || "请联系客服获取",
      account: process.env.ALIPAY_ACCOUNT || "请联系客服获取",
      qrCodeUrl: process.env.ALIPAY_QR_CODE_URL || null,
      amount: `¥${amountYuan}`,
      remark: orderNumber,
    };
  }

  // wechat
  return {
    method: "微信支付",
    merchantId: process.env.WECHAT_MERCHANT_ID || "请联系客服获取",
    qrCodeUrl: process.env.WECHAT_QR_CODE_URL || null,
    amount: `¥${amountYuan}`,
    remark: orderNumber,
  };
}
