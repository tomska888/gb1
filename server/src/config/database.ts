import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { UserTable, GoalTable } from '../types/db.js';

dotenv.config();

const connectionString =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

interface Database {
  users: UserTable;
  goals: GoalTable;
}

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: connectionString,
  }),
});

export const db = new Kysely<Database>({
  dialect,
});