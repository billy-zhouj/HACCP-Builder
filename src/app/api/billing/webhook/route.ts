import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { stripe, STRIPE_ENABLED } from "@/lib/stripe";
import { computeRetentionExpiry } from "@/lib/entitlements";

// Stripe webhook: fulfills purchases. Must read the raw body for signature
// verification, so this route intentionally does not use req.json() and is
// NOT wrapped with apiHandler (which would interfere with raw body reading).
//
// Idempotency & consistency model:
//  - Each event is *claimed* first (insert WebhookEvent with status
//    "processing"); the unique constraint on stripeEventId guarantees only
//    one claim per event survives.
//  - Fulfillment and the "processed" confirmation run in a single
//    $transaction: either the whole effect applies atomically or nothing
//    does. On failure the claim stays "processing" and becomes stale, so a
//    later Stripe retry can take it over and reprocess (crash recovery).
//  - The one-time unlock only fires when the plan is not yet paid
//    (conditional updateMany), so even a genuinely new duplicate payment
//    event cannot re-set paidAt / retentionExpiresAt.

// A claim older than this is assumed to belong to a crashed attempt and can
// be taken over by a retry.
const CLAIM_STALE_MS = 10 * 60 * 1000;

function isUniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

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
    console.error("[Webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Webhook 签名验证失败" }, { status: 400 });
  }

  // --- Claim the event (outside the transaction: a single insert that the
  // unique constraint makes atomic) -------------------------------------
  try {
    await db.webhookEvent.create({
      data: { stripeEventId: event.id, eventType: event.type, status: "processing" },
    });
  } catch (error) {
    if (!isUniqueViolation(error)) throw error; // real DB error → 500 → Stripe retries

    // Already claimed — decide whether another attempt is live or stale.
    const existing = await db.webhookEvent.findUnique({
      where: { stripeEventId: event.id },
    });
    if (!existing || existing.status === "processed") {
      // Confirmed previously — acknowledge without re-fulfilling.
      return NextResponse.json({ received: true, duplicate: true });
    }
    const stale =
      existing.status === "processing" &&
      Date.now() - existing.createdAt.getTime() >= CLAIM_STALE_MS;
    if (!stale) {
      // Another worker is fulfilling this event right now. Return non-2xx so
      // Stripe retries later instead of acking a possibly-unfulfilled event.
      return NextResponse.json({ error: "事件正在处理中" }, { status: 500 });
    }
    // Stale claim (previous attempt crashed before committing): take over.
    await db.webhookEvent.update({
      where: { id: existing.id },
      data: { status: "processing", createdAt: new Date() },
    });
  }

  // --- Fulfill + confirm, atomically -------------------------------------
  try {
    await db.$transaction(async (tx) => {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as { metadata?: Record<string, string> };
        const meta = session.metadata ?? {};

        if (meta.kind === "plan_unlock" && meta.planId) {
          const plan = await tx.plan.findUnique({ where: { id: meta.planId } });
          const user = plan ? await tx.user.findUnique({ where: { id: plan.userId } }) : null;
          // Conditional update: only the first payment unlocks the plan, so a
          // duplicate payment event can never re-set paidAt / retention.
          await tx.plan.updateMany({
            where: { id: meta.planId, isPaid: false },
            data: {
              isPaid: true,
              paidAt: new Date(),
              retentionExpiresAt: user
                ? computeRetentionExpiry({ from: new Date(), user })
                : null,
            },
          });
        }

        if (meta.kind === "storage_subscription" && meta.userId) {
          const user = await tx.user.findUnique({ where: { id: meta.userId } });
          if (user) {
            const end = new Date();
            end.setFullYear(end.getFullYear() + 1);
            await tx.user.update({
              where: { id: meta.userId },
              data: { storageSubscriptionEnd: end, membershipTier: "UNLOCKED" },
            });
            // With an active subscription computeRetentionExpiry() is null, so
            // every plan is stored indefinitely — one statement, no N updates.
            await tx.plan.updateMany({
              where: { userId: meta.userId },
              data: { retentionExpiresAt: null },
            });
          }
          // If the user no longer exists, there is nothing left to fulfill;
          // still confirm the event below so Stripe stops retrying.
        }
      }

      // Confirm in the same commit as the fulfillment.
      await tx.webhookEvent.update({
        where: { stripeEventId: event.id },
        data: { status: "processed" },
      });
    });
  } catch (error) {
    // The transaction rolled back; the claim stays "processing" and becomes
    // stale, so a Stripe retry can take it over and reprocess.
    console.error("[Webhook] Fulfillment error:", error);
    return NextResponse.json({ error: "Webhook 处理失败" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
