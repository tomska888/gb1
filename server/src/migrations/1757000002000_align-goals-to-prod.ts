import type { Kysely } from "kysely";
import { sql } from "kysely";

export async function up(db: Kysely<any>): Promise<void> {
  await sql`
    ALTER TABLE goals
      ADD COLUMN IF NOT EXISTS category TEXT NULL,
      ADD COLUMN IF NOT EXISTS tags TEXT NULL,
      ADD COLUMN IF NOT EXISTS color TEXT NULL;
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_goals_user_status_created
      ON goals (user_id, status, created_at DESC);
  `.execute(db);

  await sql`
    CREATE INDEX IF NOT EXISTS idx_goals_search
      ON goals USING GIN (
        to_tsvector(
          'simple',
          coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(tags,'')
        )
      );
  `.execute(db);
}

export async function down(db: Kysely<any>): Promise<void> {
  await sql`DROP INDEX IF EXISTS idx_goals_search;`.execute(db);
  await sql`DROP INDEX IF EXISTS idx_goals_user_status_created;`.execute(db);
  await sql`
    ALTER TABLE goals
      DROP COLUMN IF EXISTS color,
      DROP COLUMN IF EXISTS tags,
      DROP COLUMN IF EXISTS category;
  `.execute(db);
}
