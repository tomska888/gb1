import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { db } from './config/database.js';
import { sql } from 'kysely';
import { authRouter } from './api/auth/auth.router.js';
import { goalsRouter } from './api/goals/goals.router.js';

dotenv.config();

export const app = express();

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(cors());
app.use(express.json());


app.use('/api/auth', authRouter);
app.use('/api/goals', goalsRouter);

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Welcome to the GoalBuddy API! The current time in Vilnius is ' + new Date().toLocaleString('en-US', { timeZone: 'Europe/Vilnius' }),
  });
});

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/api/health', async (req: Request, res: Response) => {
  try {
    const result = await sql`SELECT datname FROM pg_database`.execute(db);

    res.status(200).json({
      status: 'ok',
      message: 'Database connection is healthy.',
      databases: (result.rows as { datname: string }[]).map(db => db.datname),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to connect to the database.',
    });
  }
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 Server is running at http://0.0.0.0:${port}`);
    });
}
