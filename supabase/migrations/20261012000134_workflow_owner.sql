-- Workflows from before login have no owner; they were local test data (hand-edited).
DELETE FROM "relay"."workflows";--> statement-breakpoint
ALTER TABLE "relay"."workflows" ADD COLUMN "owner_id" uuid NOT NULL;--> statement-breakpoint
CREATE INDEX "workflows_owner_id_updated_at_index" ON "relay"."workflows" USING btree ("owner_id","updated_at");