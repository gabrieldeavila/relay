CREATE TABLE "relay"."tool_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"base_url" text NOT NULL,
	"tools" jsonb NOT NULL,
	"refreshed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_providers_owner_id_base_url_unique" UNIQUE("owner_id","base_url")
);
--> statement-breakpoint
CREATE INDEX "tool_providers_owner_id_index" ON "relay"."tool_providers" USING btree ("owner_id");