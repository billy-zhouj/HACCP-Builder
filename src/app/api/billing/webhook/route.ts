import { NextResponse } from "next/server";
import type { Plan } from "@prisma/client";
import { db } from "@/lib/db";
import { stripe, STRIPE_ENABLED } from "@/lib/stripe";
import { computeRetentionExpiry } from "@/lib/entitlements";

// Stripe webhook: fulfills purchases. Must read the raw body for signature
// verification, so this route intentionally does not use req.json() and is
// NOT wrapped with apiHandler (which would interfere with raw body reading).
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

  // Idempotency: check if this Stripe event has already been processed.
  // Stripe retries webhooks on non-2xx responses; without deduplication,
  // a retried event would double-fulfill (re-set paidAt, re-compute retention).
  // The unique constraint on stripeEventId ensures only the first insert succeeds.
  const existing = await db.webhookEvent.findUnique({
    where: { stripeEventId: event.id },
  }).catch(() => null);

  if (existing) {
    // Already processed — acknowledge without re-fulfilling.
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
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

    // Record the processed event for idempotency.
    await db.webhookEvent.create({
      data: { stripeEventId: event.id, eventType: event.type },
    });
  } catch (error) {
    // If the create fails due to a unique constraint violation (race condition
    // with a concurrent webhook processing the same event), that's fine —
    // another instance already fulfilled it. Any other error is real and
    // should return non-200 so Stripe retries.
    const isUniqueConstraint =
      error instanceof Error &&
      (error.message.includes("Unique constraint") || error.message.includes("already exists"));
    if (isUniqueConstraint) {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[Webhook] Fulfillment error:", error);
    return NextResponse.json({ error: "Webhook 处理失败" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
