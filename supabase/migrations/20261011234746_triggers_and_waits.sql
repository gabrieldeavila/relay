CREATE TABLE "relay"."triggers" (
	"workflow_id" uuid PRIMARY KEY NOT NULL,
	"kind" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"token" text NOT NULL,
	"schedule" jsonb,
	"next_fire_at" timestamp with time zone,
	"last_fired_at" timestamp with time zone,
	CONSTRAINT "triggers_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "relay"."event_inbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"node_id" text NOT NULL,
	"action" text,
	"payload" jsonb,
	"dedupe_key" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"consumed_at" timestamp with time zone,
	CONSTRAINT "event_inbox_run_id_node_id_dedupe_key_unique" UNIQUE("run_id","node_id","dedupe_key")
);
--> statement-breakpoint
ALTER TABLE "relay"."runs" ADD COLUMN "resume_token" text;--> statement-breakpoint
-- Runs created before this migration get a token too (hand-edited).
UPDATE "relay"."runs" SET "resume_token" = replace(gen_random_uuid()::text, '-', '') WHERE "resume_token" IS NULL;--> statement-breakpoint
ALTER TABLE "relay"."runs" ALTER COLUMN "resume_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "relay"."step_runs" ADD COLUMN "waiting_for" text;--> statement-breakpoint
-- Steps waiting before this migration were all delays (hand-edited).
UPDATE "relay"."step_runs" SET "waiting_for" = 'time' WHERE "status" = 'waiting';--> statement-breakpoint
ALTER TABLE "relay"."step_runs" ADD COLUMN "deadline_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "relay"."triggers" ADD CONSTRAINT "triggers_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "relay"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay"."event_inbox" ADD CONSTRAINT "event_inbox_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "relay"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "triggers_kind_next_fire_at_index" ON "relay"."triggers" USING btree ("kind","next_fire_at");--> statement-breakpoint
CREATE INDEX "event_inbox_run_id_node_id_consumed_at_index" ON "relay"."event_inbox" USING btree ("run_id","node_id","consumed_at");--> statement-breakpoint
CREATE INDEX "step_runs_status_deadline_at_index" ON "relay"."step_runs" USING btree ("status","deadline_at");--> statement-breakpoint
ALTER TABLE "relay"."runs" ADD CONSTRAINT "runs_resume_token_unique" UNIQUE("resume_token");