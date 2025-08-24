import { Generated, ColumnType } from 'kysely'

export interface UserTable {
  id: Generated<number>
  email: string
  password: string
  created_at: ColumnType<Date, string | undefined, never>
}

export type GoalStatus = 'in_progress' | 'completed' | 'abandoned'

export interface GoalTable {
  id: Generated<number>
  user_id: number
  title: string
  description: string | null
  target_date: Date | null
  status: GoalStatus
  created_at: ColumnType<Date, string | undefined, never>
  /* keep nullable to avoid forced migrations if you already have live data */
  category: string | null
  tags: string | null
  color: string | null
}

export interface GoalShareTable {
  id: Generated<number>
  goal_id: number
  owner_id: number
  buddy_id: number
  permissions: 'view' | 'checkin'
  created_at: ColumnType<Date, string | undefined, never>
}

export interface GoalCheckinTable {
  id: Generated<number>
  goal_id: number
  user_id: number
  status: 'on_track' | 'blocked' | 'done'
  progress: number | null
  note: string | null
  created_at: ColumnType<Date, string | undefined, never>
}

export interface GoalMessageTable {
  id: Generated<number>
  goal_id: number
  sender_id: number
  body: string
  created_at: ColumnType<Date, string | undefined, never>
}

export interface Database {
  users: UserTable
  goals: GoalTable
  goal_shares: GoalShareTable
  goal_checkins: GoalCheckinTable
  goal_messages: GoalMessageTable
}
