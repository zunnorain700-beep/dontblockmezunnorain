CREATE TABLE "quizzes" (
	"id" text PRIMARY KEY,
	"name" text NOT NULL,
	"character" smallint NOT NULL,
	"answers" integer[] NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" serial PRIMARY KEY,
	"quiz_id" text NOT NULL,
	"friend_name" text NOT NULL,
	"character" smallint NOT NULL,
	"guesses" integer[] NOT NULL,
	"score" smallint NOT NULL,
	"total" smallint NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "responses_quiz_id_idx" ON "responses" ("quiz_id");--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_quiz_id_quizzes_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE;