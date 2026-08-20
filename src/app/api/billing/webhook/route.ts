import { NextResponse } from "next/server";
import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";
import { stripe, STRIPE_ENABLED } from "@/lib/stripe";
import { computeRetentionExpiry } from "@/lib/entitlements";

// Stripe webhook: fulfills purchases. Must read the raw body for signature
// verification, so this route intentionally does not use req.json().
export async function POST(req: Request) {
  if (!STRIPE_ENABLED || !stripe) {
    return NextResponse.json({ error: "未配置计费功能" }, { status: 501 });
  }

  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    if (!sig || !webhookSecret) throw new Error("Missing signature or webhook secret");
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook 签名验证失败：${err}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as { metadata?: Record<string, string> };
    const meta = session.metadata ?? {};

    if (meta.kind === "plan_unlock" && meta.planId) {
      await db.plan.update({
        where: { id: meta.planId },
        data: { isPaid: true, paidAt: new Date() },
      });
    }

    if (meta.kind === "storage_subscription" && meta.userId) {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);
      const user = await db.user.update({
        where: { id: meta.userId },
        data: { storageSubscriptionEnd: oneYearFromNow, membershipTier: "UNLOCKED" },
      });
      const plans = await db.plan.findMany({ where: { userId: user.id } });
      await Promise.all(
        plans.map((p: Plan) =>
          db.plan.update({
            where: { id: p.id },
            data: { retentionExpiresAt: computeRetentionExpiry({ from: new Date(), user }) },
          })
        )
      );
    }
  }

  return NextResponse.json({ received: true });
}
