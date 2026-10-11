CREATE SCHEMA "relay";
--> statement-breakpoint
CREATE TABLE "relay"."workflows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"draft_graph" jsonb DEFAULT '{"nodes":[],"edges":[]}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "relay"."workflow_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"graph" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workflow_versions_workflow_id_version_unique" UNIQUE("workflow_id","version")
);
--> statement-breakpoint
CREATE TABLE "relay"."runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workflow_id" uuid NOT NULL,
	"version_id" uuid NOT NULL,
	"status" text DEFAULT 'running' NOT NULL,
	"trigger_payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "relay"."step_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"node_id" text NOT NULL,
	"status" text NOT NULL,
	"port" text,
	"attempt" integer DEFAULT 0 NOT NULL,
	"run_at" timestamp with time zone DEFAULT now() NOT NULL,
	"lease_until" timestamp with time zone,
	"input" jsonb,
	"output" jsonb,
	"error" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "step_runs_run_id_node_id_unique" UNIQUE("run_id","node_id")
);
--> statement-breakpoint
CREATE TABLE "relay"."step_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"step_run_id" uuid NOT NULL,
	"attempt" integer NOT NULL,
	"outcome" text NOT NULL,
	"error" jsonb,
	"started_at" timestamp with time zone NOT NULL,
	"finished_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "relay"."workflow_versions" ADD CONSTRAINT "workflow_versions_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "relay"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay"."runs" ADD CONSTRAINT "runs_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "relay"."workflows"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay"."runs" ADD CONSTRAINT "runs_version_id_workflow_versions_id_fk" FOREIGN KEY ("version_id") REFERENCES "relay"."workflow_versions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay"."step_runs" ADD CONSTRAINT "step_runs_run_id_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "relay"."runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relay"."step_attempts" ADD CONSTRAINT "step_attempts_step_run_id_step_runs_id_fk" FOREIGN KEY ("step_run_id") REFERENCES "relay"."step_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "runs_workflow_id_created_at_index" ON "relay"."runs" USING btree ("workflow_id","created_at");--> statement-breakpoint
CREATE INDEX "step_runs_status_run_at_index" ON "relay"."step_runs" USING btree ("status","run_at");