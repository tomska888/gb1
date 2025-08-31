import { beforeAll, beforeEach, afterAll } from 'vitest';
import { db } from '../config/database.js';
import { sql } from 'kysely';

beforeAll(async () => {
  try { await sql`select 1`.execute(db); } catch {}
  const missing = [];
  for (const t of ['users', 'goals']) {
    const r = await sql`
      select to_regclass('public.${sql.raw(t)}') as exists
    `.execute(db);
    const exists = (r.rows as any[])[0]?.exists;
    if (!exists) missing.push(t);
  }
  if (missing.length) {
    throw new Error(`Migrations did not create tables: ${missing.join(', ')}. Check dist/migrations & migrator path.`);
  }
});

beforeEach(async () => {
  await sql`
    TRUNCATE TABLE
      goal_messages,
      goal_checkins,
      goal_shares,
      goals,
      users
    RESTART IDENTITY CASCADE
  `.execute(db);
});

afterAll(async () => {
  await db.destroy();
});
