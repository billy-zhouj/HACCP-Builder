-- Add the CCP decision-tree answers of the Codex 2022 revision
-- (CXC 1-1969, Annex IV, Figure 1). The legacy classic-tree answer columns
-- are kept (superseded; the app no longer reads them).

-- AlterTable
ALTER TABLE "Hazard" ADD COLUMN "ccpQ1CanBeControlledByPrp" BOOLEAN;
ALTER TABLE "Hazard" ADD COLUMN "ccpQ2HasSpecificControlMeasures" BOOLEAN;
ALTER TABLE "Hazard" ADD COLUMN "ccpQ3WillLaterStepPreventOrEliminate" BOOLEAN;
ALTER TABLE "Hazard" ADD COLUMN "ccpQ4CanStepPreventOrEliminate" BOOLEAN;
