import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import type { Database } from '../types/db.js';

// Explicitly pick the env file so tests never get the wrong URL.
dotenv.config({
  path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  override: false,
});

const connectionString =
  process.env.NODE_ENV === 'test'
    ? process.env.TEST_DATABASE_URL
    : process.env.DATABASE_URL;

const dialect = new PostgresDialect({
  pool: new Pool({ connectionString }),
});

export const db = new Kysely<Database>({ dialect });
