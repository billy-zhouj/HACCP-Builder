-- Add a processing status to WebhookEvent so webhook fulfillment can be
-- claimed before work begins, committed atomically with the fulfillment
-- (single transaction), and reprocessed after a stale window if the worker
-- crashed between claim and commit.
--
-- Existing rows were only recorded after successful fulfillment, so they
-- default to 'processed'.
ALTER TABLE "WebhookEvent" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'processed';
