import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedProcessStep } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(
  _req: Request,
  { params }: { params: { id: string; productId: string; stepId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const owned = await getOwnedProcessStep(params.id, params.productId, params.stepId, user.id);
  if (!owned) return NextResponse.json({ error: "未找到" }, { status: 404 });

  // Reset every hazard in this step back to the unevaluated state so the
  // decision tree has to be re-run from scratch (Principle 2).
  const updated = await db.hazard.updateMany({
    where: { processStepId: owned.id },
    data: {
      ccpQ1DoControlMeasuresExist: null,
      ccpQ2IsStepSpecificallyToControl: null,
      ccpQ3CouldContaminationExceedLimit: null,
      ccpQ4WillLaterStepEliminate: null,
      ccpStatus: "NOT_EVALUATED",
    },
  });

  return NextResponse.json({ ok: true, resetCount: updated.count });
}
