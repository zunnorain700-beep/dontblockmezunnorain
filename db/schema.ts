import { pgTable, serial, text, integer, smallint, timestamp, index } from "drizzle-orm/pg-core";

export const quizzes = pgTable("quizzes", {
  id: text().primaryKey(),
  name: text().notNull(),
  character: smallint().notNull(),
  answers: integer().array().notNull(),
  tokenHash: text("token_hash").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const responses = pgTable(
  "responses",
  {
    id: serial().primaryKey(),
    quizId: text("quiz_id").notNull().references(() => quizzes.id, { onDelete: "cascade" }),
    friendName: text("friend_name").notNull(),
    character: smallint().notNull(),
    guesses: integer().array().notNull(),
    score: smallint().notNull(),
    total: smallint().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [index("responses_quiz_id_idx").on(t.quizId)],
);
