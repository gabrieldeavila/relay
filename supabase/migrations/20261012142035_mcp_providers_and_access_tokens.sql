CREATE TABLE "relay"."access_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"token_hash" text NOT NULL,
	"hint" text NOT NULL,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_tokens_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "relay"."tool_providers" ALTER COLUMN "base_url" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "relay"."tool_providers" ADD COLUMN "kind" text DEFAULT 'tools_api' NOT NULL;--> statement-breakpoint
ALTER TABLE "relay"."tool_providers" ADD COLUMN "command" jsonb;--> statement-breakpoint
CREATE INDEX "access_tokens_owner_id_index" ON "relay"."access_tokens" USING btree ("owner_id");