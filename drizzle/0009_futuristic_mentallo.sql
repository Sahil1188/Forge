ALTER TABLE "goals" ADD COLUMN "mode" text DEFAULT 'plan' NOT NULL;--> statement-breakpoint
ALTER TABLE "goals" ADD COLUMN "acceptance_json" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "work_items" ADD COLUMN "acceptance_json" jsonb DEFAULT '[]'::jsonb NOT NULL;