CREATE TABLE "internship_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"internship_id" uuid NOT NULL,
	"skill_id" uuid NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"importance" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "internships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"company" varchar(255) NOT NULL,
	"location" varchar(150) NOT NULL,
	"work_mode" varchar(50) DEFAULT 'hybrid' NOT NULL,
	"description" text NOT NULL,
	"source_url" varchar(500),
	"source_name" varchar(100) DEFAULT 'Curated / Direct' NOT NULL,
	"verified_at" timestamp with time zone DEFAULT now() NOT NULL,
	"min_gpa" varchar(10),
	"eligible_graduation_years" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requires_work_auth" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "saved_internships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"internship_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_result_id" uuid NOT NULL,
	"skill_name" varchar(100) NOT NULL,
	"match_status" varchar(50) NOT NULL,
	"is_required" boolean NOT NULL,
	"evidence_id" uuid,
	"evidence_snippet" text,
	"confidence_score" real DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"internship_id" uuid NOT NULL,
	"engine_version" varchar(50) DEFAULT 'v1.0.0' NOT NULL,
	"weights_config" jsonb NOT NULL,
	"overall_score" real NOT NULL,
	"deterministic_score" real NOT NULL,
	"semantic_score" real NOT NULL,
	"eligibility_status" varchar(50) DEFAULT 'eligible' NOT NULL,
	"eligibility_warnings" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"score_breakdown" jsonb NOT NULL,
	"summary_explanation" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matching_config_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"version" varchar(50) NOT NULL,
	"weights" jsonb NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "matching_config_versions_version_unique" UNIQUE("version")
);
--> statement-breakpoint
CREATE TABLE "skill_gaps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"match_result_id" uuid NOT NULL,
	"skill_name" varchar(100) NOT NULL,
	"importance" varchar(50) DEFAULT 'critical' NOT NULL,
	"recommended_action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "internship_skills" ADD CONSTRAINT "internship_skills_internship_id_internships_id_fk" FOREIGN KEY ("internship_id") REFERENCES "public"."internships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "internship_skills" ADD CONSTRAINT "internship_skills_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_internships" ADD CONSTRAINT "saved_internships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "saved_internships" ADD CONSTRAINT "saved_internships_internship_id_internships_id_fk" FOREIGN KEY ("internship_id") REFERENCES "public"."internships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_evidence" ADD CONSTRAINT "match_evidence_match_result_id_match_results_id_fk" FOREIGN KEY ("match_result_id") REFERENCES "public"."match_results"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_evidence" ADD CONSTRAINT "match_evidence_evidence_id_candidate_evidence_id_fk" FOREIGN KEY ("evidence_id") REFERENCES "public"."candidate_evidence"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_results" ADD CONSTRAINT "match_results_internship_id_internships_id_fk" FOREIGN KEY ("internship_id") REFERENCES "public"."internships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_gaps" ADD CONSTRAINT "skill_gaps_match_result_id_match_results_id_fk" FOREIGN KEY ("match_result_id") REFERENCES "public"."match_results"("id") ON DELETE cascade ON UPDATE no action;