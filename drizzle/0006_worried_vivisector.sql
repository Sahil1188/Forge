CREATE TABLE "performance_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"work_item_id" uuid,
	"task_type" text NOT NULL,
	"quality_score" integer,
	"correctness_score" integer,
	"reliability_score" integer,
	"tests_score" integer,
	"security_score" integer,
	"evaluation_score" integer,
	"cost_usd" double precision,
	"duration_ms" integer,
	"human_approval" boolean DEFAULT false NOT NULL,
	"retries" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "performance_records" ADD CONSTRAINT "performance_records_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "performance_records" ADD CONSTRAINT "performance_records_work_item_id_work_items_id_fk" FOREIGN KEY ("work_item_id") REFERENCES "public"."work_items"("id") ON DELETE no action ON UPDATE no action;