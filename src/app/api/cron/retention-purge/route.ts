import { NextResponse } from "next/server";
import { purgeExpiredPlans } from "@/lib/retention";

// Scheduled retention-purge endpoint. Not session-authenticated (no human user
// invokes it) — protected by a shared secret so only the configured scheduler
// (Render cron job, an external monitor like cron-job.org, or a GitHub Action)
// can trigger it.
//
// Call:  POST /api/cron/retention-purge
//        Authorization: Bearer $CRON_SECRET
//
// Schedule daily (e.g. 03:00 UTC) via your scheduler of choice. See
// DEPLOYMENT.md §"Retention purge".
export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Refuse to run if the operator forgot to set the secret — otherwise the
    // endpoint would be either unprotectable (501) or silently open.
    return NextResponse.json({ error: "未配置 CRON_SECRET，无法启用定时清理" }, { status: 501 });
  }
  const provided = req.headers.get("authorization");
  if (provided !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "未授权" }, { status: 401 });
  }

  try {
    const result = await purgeExpiredPlans();
    console.log(
      `[cron] retention purge: ${result.purged} purged, ${result.reanchored} re-anchored`
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("[cron] retention purge error:", error);
    return NextResponse.json({ error: "服务器内部错误" }, { status: 500 });
  }
}
