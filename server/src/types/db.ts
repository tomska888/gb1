import { Generated, ColumnType } from 'kysely';

export interface UserTable {
  id: Generated<number>;
  email: string;
  password: string;
  created_at: ColumnType<Date, string | undefined, never>;
}

export interface GoalTable {
  id: Generated<number>;
  user_id: number;
  title: string;
  description: string | null;
  target_date: Date | null;
  status: 'in_progress' | 'completed' | 'abandoned';
  created_at: ColumnType<Date, string | undefined, never>;
}