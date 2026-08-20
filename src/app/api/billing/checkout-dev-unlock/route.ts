import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedPlan } from "@/lib/session";
import { db } from "@/lib/db";
import { STRIPE_ENABLED } from "@/lib/stripe";

/**
 * Convenience route that unlocks a plan for export without talking to
 * Stripe, so the full wizard → unlock → export flow works before real
 * billing is configured.
 *
 * Availability rules:
 *  - If Stripe IS configured (STRIPE_SECRET_KEY set), this route is always
 *    disabled — real checkout takes over and nobody gets a free unlock.
 *  - If Stripe is NOT configured, it's allowed automatically in local
 *    development, and allowed on a deployed server only when you explicitly
 *    set ALLOW_FREE_UNLOCK="true".
 */
export async function POST(req: Request) {
  const freeUnlockAllowed =
    !STRIPE_ENABLED &&
    (process.env.NODE_ENV !== "production" || process.env.ALLOW_FREE_UNLOCK === "true");

  if (!freeUnlockAllowed) {
    return NextResponse.json(
      { error: "免费解锁已禁用。请配置 Stripe 计费，或设置 ALLOW_FREE_UNLOCK=true 以启用。" },
      { status: 403 }
    );
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const plan = await getOwnedPlan(body.planId, user.id);
  if (!plan) return NextResponse.json({ error: "未找到计划" }, { status: 404 });

  const updated = await db.plan.update({
    where: { id: plan.id },
    data: { isPaid: true, paidAt: new Date() },
  });

  return NextResponse.json(updated);
}
