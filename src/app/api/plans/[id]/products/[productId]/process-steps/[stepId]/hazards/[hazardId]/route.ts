import { NextResponse } from "next/server";
import { getCurrentUser, getOwnedProcessStep } from "@/lib/session";
import { db } from "@/lib/db";
import { evaluateDecisionTree, type DecisionTreeAnswers } from "@/lib/ccpDecisionTree";

async function getOwnedHazard(
  planId: string,
  productId: string,
  stepId: string,
  hazardId: string,
  userId: string
) {
  const step = await getOwnedProcessStep(planId, productId, stepId, userId);
  if (!step) return null;
  return db.hazard.findFirst({ where: { id: hazardId, processStepId: step.id } });
}

const STRING_FIELDS = [
  "type",
  "description",
  "severity",
  "likelihood",
  "justification",
  "criticalLimit",
  "monitoringProcedure",
  "monitoringFrequency",
  "correctionAction",
  "verificationProcedure",
  "recordkeepingProcedure",
  "responsibleParty",
] as const;

// Codex 2022 revision (Annex IV, Figure 1) decision-tree answers.
const CCP_ANSWER_FIELDS = [
  "ccpQ1CanBeControlledByPrp",
  "ccpQ2HasSpecificControlMeasures",
  "ccpQ3WillLaterStepPreventOrEliminate",
  "ccpQ4CanStepPreventOrEliminate",
] as const;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string; productId: string; stepId: string; hazardId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const owned = await getOwnedHazard(params.id, params.productId, params.stepId, params.hazardId, user.id);
  if (!owned) return NextResponse.json({ error: "未找到" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const data: Record<string, unknown> = {};

  for (const f of STRING_FIELDS) {
    if (typeof body[f] === "string") data[f] = body[f];
  }
  if (typeof body.isLikelyToOccur === "boolean") data.isLikelyToOccur = body.isLikelyToOccur;
  if (typeof body.requiresPreventiveControl === "boolean") data.requiresPreventiveControl = body.requiresPreventiveControl;

  let touchedAnswers = false;
  for (const f of CCP_ANSWER_FIELDS) {
    if (typeof body[f] === "boolean" || body[f] === null) {
      data[f] = body[f];
      touchedAnswers = true;
    }
  }

  // Re-run the CCP decision tree server-side on every answer update, so
  // ccpStatus is never trusted from the client (Principle 2).
  if (touchedAnswers) {
    const merged: DecisionTreeAnswers = {
      q1CanBeControlledByPrp:
        "ccpQ1CanBeControlledByPrp" in data
          ? (data.ccpQ1CanBeControlledByPrp as boolean | null)
          : owned.ccpQ1CanBeControlledByPrp,
      q2HasSpecificControlMeasures:
        "ccpQ2HasSpecificControlMeasures" in data
          ? (data.ccpQ2HasSpecificControlMeasures as boolean | null)
          : owned.ccpQ2HasSpecificControlMeasures,
      q3WillLaterStepPreventOrEliminate:
        "ccpQ3WillLaterStepPreventOrEliminate" in data
          ? (data.ccpQ3WillLaterStepPreventOrEliminate as boolean | null)
          : owned.ccpQ3WillLaterStepPreventOrEliminate,
      q4CanStepPreventOrEliminate:
        "ccpQ4CanStepPreventOrEliminate" in data
          ? (data.ccpQ4CanStepPreventOrEliminate as boolean | null)
          : owned.ccpQ4CanStepPreventOrEliminate,
    };
    const result = evaluateDecisionTree(merged);
    data.ccpStatus = result.status;
  }

  const updated = await db.hazard.update({ where: { id: owned.id }, data });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; productId: string; stepId: string; hazardId: string } }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "未授权" }, { status: 401 });
  const owned = await getOwnedHazard(params.id, params.productId, params.stepId, params.hazardId, user.id);
  if (!owned) return NextResponse.json({ error: "未找到" }, { status: 404 });

  await db.hazard.delete({ where: { id: owned.id } });
  return NextResponse.json({ ok: true });
}
