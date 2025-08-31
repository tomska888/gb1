import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable("goal_shares")
    .addColumn("id", "serial", (c) => c.primaryKey())
    .addColumn("goal_id", "integer", (c) =>
      c.notNull().references("goals.id").onDelete("cascade"),
    )
    .addColumn("owner_id", "integer", (c) =>
      c.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("buddy_id", "integer", (c) =>
      c.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("permissions", "varchar(20)", (c) =>
      c.notNull().defaultTo("checkin"),
    )
    .addColumn("created_at", "timestamptz", (c) =>
      c.notNull().defaultTo(sql`now()`),
    )
    .addUniqueConstraint("uq_goal_shares_goal_buddy", ["goal_id", "buddy_id"])
    .execute();

  await db.schema
    .createTable("goal_checkins")
    .addColumn("id", "serial", (c) => c.primaryKey())
    .addColumn("goal_id", "integer", (c) =>
      c.notNull().references("goals.id").onDelete("cascade"),
    )
    .addColumn("user_id", "integer", (c) =>
      c.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("status", "varchar(20)", (c) =>
      c.notNull().defaultTo("on_track"),
    )
    .addColumn("progress", "integer")
    .addColumn("note", "text")
    .addColumn("created_at", "timestamptz", (c) =>
      c.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createTable("goal_messages")
    .addColumn("id", "serial", (c) => c.primaryKey())
    .addColumn("goal_id", "integer", (c) =>
      c.notNull().references("goals.id").onDelete("cascade"),
    )
    .addColumn("sender_id", "integer", (c) =>
      c.notNull().references("users.id").onDelete("cascade"),
    )
    .addColumn("body", "text", (c) => c.notNull())
    .addColumn("created_at", "timestamptz", (c) =>
      c.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable("goal_messages").execute();
  await db.schema.dropTable("goal_checkins").execute();
  await db.schema.dropTable("goal_shares").execute();
}
