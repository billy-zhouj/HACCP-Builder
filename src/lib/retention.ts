import { db } from "@/lib/db";
import { DEFAULT_RETENTION_DAYS } from "@/lib/entitlements";

export interface PurgedPlanRef {
  id: string;
  name: string;
  userId: string;
}

export interface PurgeResult {
  /** Number of plans whose data was deleted this run. */
  purged: number;
  /** Number of lapsed-subscriber plans re-anchored to a future expiry. */
  reanchored: number;
  /** The plans that were deleted (for logging / audit). */
  purgedPlans: PurgedPlanRef[];
}

// Cap each run so a large backlog can't stall a single invocation. The job is
// meant to run daily; this only bounds worst-case work per call.
const PURGE_BATCH_LIMIT = Math.max(10, Number(process.env.RETENTION_PURGE_BATCH ?? 500));

const DAY_MS = 86_400_000;

/**
 * Enforce the data-retention policy. Two steps, both idempotent and safe to
 * re-run; a crash resumes cleanly on the next scheduled run.
 *
 *  1. Re-anchor plans whose `retentionExpiresAt` is null because the owner
 *     *was* an active subscriber when the plan was written but whose
 *     subscription has since lapsed (storageSubscriptionEnd is null or past).
 *     Give them a fresh `DEFAULT_RETENTION_DAYS` window from now so their data
 *     is neither held forever nor destroyed immediately.
 *
 *  2. Delete plans whose `retentionExpiresAt` is in the past.
 *
 * Safety: a plan with a non-null past expiry never belongs to a *currently*
 * active subscriber — subscribing nulls `retentionExpiresAt` for all of a
 * user's plans via the webhook (see src/app/api/billing/webhook/route.ts) —
 * so step 2 can never purge a paying user's data. Re-anchored plans get a
 * future expiry, so they always survive the same run's step 2.
 *
 * All Plan child rows (products, process steps, hazards, ingredients, vendors,
 * sops, recall contacts, mock recalls, team members, orders, exports) cascade
 * on delete in the schema, so deleteMany leaves no orphans.
 */
export async function purgeExpiredPlans(): Promise<PurgeResult> {
  const now = new Date();

  // 1. Re-anchor lapsed subscribers' plans.
  const lapsedUserIds = (
    await db.user.findMany({
      where: {
        OR: [{ storageSubscriptionEnd: null }, { storageSubscriptionEnd: { lt: now } }],
      },
      select: { id: true },
    })
  ).map((u) => u.id);

  let reanchored = 0;
  if (lapsedUserIds.length > 0) {
    const r = await db.plan.updateMany({
      where: { retentionExpiresAt: null, userId: { in: lapsedUserIds } },
      data: { retentionExpiresAt: new Date(now.getTime() + DEFAULT_RETENTION_DAYS * DAY_MS) },
    });
    reanchored = r.count;
  }

  // 2. Purge plans past their retention window (capped per run).
  const expired = await db.plan.findMany({
    where: { retentionExpiresAt: { lt: now } },
    select: { id: true, name: true, userId: true },
    take: PURGE_BATCH_LIMIT,
  });

  let purged = 0;
  if (expired.length > 0) {
    const d = await db.plan.deleteMany({
      where: { id: { in: expired.map((p) => p.id) } },
    });
    purged = d.count;
  }

  return { purged, reanchored, purgedPlans: expired };
}
