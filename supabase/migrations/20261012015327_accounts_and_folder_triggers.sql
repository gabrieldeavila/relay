CREATE TABLE "relay"."seen_files" (
	"workflow_id" uuid NOT NULL,
	"name" text NOT NULL,
	"modified_ms" bigint NOT NULL,
	CONSTRAINT "seen_files_workflow_id_name_pk" PRIMARY KEY("workflow_id","name")
);
--> statement-breakpoint
CREATE TABLE "relay"."accounts" (
	"owner_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"settings" jsonb NOT NULL,
	"secret" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "accounts_owner_id_kind_pk" PRIMARY KEY("owner_id","kind")
);
--> statement-breakpoint
ALTER TABLE "relay"."triggers" ADD COLUMN "watch" jsonb;--> statement-breakpoint
ALTER TABLE "relay"."seen_files" ADD CONSTRAINT "seen_files_workflow_id_workflows_id_fk" FOREIGN KEY ("workflow_id") REFERENCES "relay"."workflows"("id") ON DELETE cascade ON UPDATE no action;