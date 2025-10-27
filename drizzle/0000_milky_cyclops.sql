CREATE TYPE "public"."redemption_status" AS ENUM('pending', 'fulfilled', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."reward_type" AS ENUM('unspecified');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "course" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_code" varchar(6) NOT NULL,
	"title" varchar(63) NOT NULL,
	"description" text,
	"instructor_email" varchar NOT NULL,
	CONSTRAINT "course_course_code_unique" UNIQUE("course_code")
);
--> statement-breakpoint
CREATE TABLE "instructor" (
	"email" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"last_signin" timestamp
);
--> statement-breakpoint
CREATE TABLE "quest" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"created_by" varchar NOT NULL,
	"title" varchar(63) NOT NULL,
	"points" integer NOT NULL,
	"created_date" timestamp NOT NULL,
	"expiration_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "redemption" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar NOT NULL,
	"reward_id" integer NOT NULL,
	"redemption_date" timestamp NOT NULL,
	"status" "redemption_status" DEFAULT 'pending' NOT NULL,
	"fulfillment_date" timestamp,
	"instructor_notes" text,
	"student_notes" text,
	CONSTRAINT "redemption_id_unique" UNIQUE("id")
);
--> statement-breakpoint
CREATE TABLE "registration" (
	"student_id" varchar NOT NULL,
	"course_id" integer NOT NULL,
	CONSTRAINT "registration_student_id_course_id_pk" PRIMARY KEY("student_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "reward" (
	"id" serial PRIMARY KEY NOT NULL,
	"course_id" integer NOT NULL,
	"created_date" timestamp NOT NULL,
	"name" varchar(63) NOT NULL,
	"description" text,
	"cost" integer NOT NULL,
	"quantity_limit" integer,
	"reward_type" "reward_type" DEFAULT 'unspecified' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "cost_not_negative" CHECK ("reward"."cost" >= 0),
	CONSTRAINT "quantity_limit_positive" CHECK ("reward"."quantity_limit" IS NULL OR "reward"."quantity_limit" > 0)
);
--> statement-breakpoint
CREATE TABLE "student" (
	"email" varchar PRIMARY KEY NOT NULL,
	"name" varchar NOT NULL,
	"last_signin" timestamp
);
--> statement-breakpoint
CREATE TABLE "submission" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar NOT NULL,
	"quest_id" integer NOT NULL,
	"submission_date" timestamp NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"verified_by" varchar,
	"verified_date" timestamp
);
--> statement-breakpoint
CREATE TABLE "transaction" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" varchar NOT NULL,
	"points" integer NOT NULL,
	"transaction_date" timestamp NOT NULL,
	"submission_id" integer,
	"redemption_id" integer,
	CONSTRAINT "transaction_source_not_null" CHECK (("transaction"."submission_id" IS NOT NULL AND "transaction"."redemption_id" IS NULL) OR
              ("transaction"."submission_id" IS NULL AND "transaction"."redemption_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "course" ADD CONSTRAINT "course_instructor_email_instructor_email_fk" FOREIGN KEY ("instructor_email") REFERENCES "public"."instructor"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest" ADD CONSTRAINT "quest_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quest" ADD CONSTRAINT "quest_created_by_instructor_email_fk" FOREIGN KEY ("created_by") REFERENCES "public"."instructor"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption" ADD CONSTRAINT "redemption_student_id_student_email_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redemption" ADD CONSTRAINT "redemption_reward_id_reward_id_fk" FOREIGN KEY ("reward_id") REFERENCES "public"."reward"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_student_id_student_email_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration" ADD CONSTRAINT "registration_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reward" ADD CONSTRAINT "reward_course_id_course_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."course"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_student_id_student_email_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_quest_id_quest_id_fk" FOREIGN KEY ("quest_id") REFERENCES "public"."quest"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission" ADD CONSTRAINT "submission_verified_by_instructor_email_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."instructor"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_student_id_student_email_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student"("email") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_submission_id_submission_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."submission"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_redemption_id_redemption_id_fk" FOREIGN KEY ("redemption_id") REFERENCES "public"."redemption"("id") ON DELETE no action ON UPDATE no action;