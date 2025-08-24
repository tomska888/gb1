import { defineStore } from 'pinia'

export type Status = 'in_progress' | 'completed' | 'abandoned'

export interface Goal {
  id: number
  title: string
  description: string | null
  targetDate: string | null
  status: Status
  createdAt: string
  updatedAt?: string | null
}

type CreateGoalInput = {
  title: string
  description?: string
  targetDate?: string | null
}

type UpdateGoalInput = Partial<{
  title: string
  description: string | null
  targetDate: string | null
  status: Status
}>

type ApiGoal = {
  id: number
  title: string
  description: string | null
  target_date: string | null
  status: Status
  created_at: string
  updated_at?: string | null
}

const makeHeaders = (): Record<string, string> => {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) h.Authorization = `Bearer ${token}`
  return h
}

const toClient = (row: ApiGoal): Goal => ({
  id: row.id,
  title: row.title,
  description: row.description ?? null,
  targetDate: row.target_date,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null,
})

export const useGoalStore = defineStore('goal', {
  state: () => ({
    goals: [] as Goal[],
    loading: false as boolean,
    error: null as string | null,
  }),

  actions: {
    async loadGoals(): Promise<void> {
      this.loading = true
      this.error = null
      try {
        const res = await fetch('/api/goals', { headers: makeHeaders() })
        if (!res.ok) throw new Error(await res.text())
        const data: ApiGoal[] = await res.json()
        this.goals = data.map(toClient)
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load goals'
      } finally {
        this.loading = false
      }
    },

    async addGoal(input: CreateGoalInput): Promise<void> {
      const body = {
        title: input.title,
        description: input.description ?? undefined,
        target_date: input.targetDate ?? undefined,
      }
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: makeHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const created: ApiGoal = await res.json()
      this.goals.unshift(toClient(created))
    },

    async updateGoal(id: number, patch: UpdateGoalInput): Promise<void> {
      const body: Record<string, unknown> = {}
      if (patch.title !== undefined) body.title = patch.title
      if (patch.description !== undefined) body.description = patch.description
      if (patch.targetDate !== undefined) body.target_date = patch.targetDate
      if (patch.status !== undefined) body.status = patch.status

      const res = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: makeHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated: ApiGoal = await res.json()
      const g = toClient(updated)
      const idx = this.goals.findIndex((x) => x.id === id)
      if (idx !== -1) this.goals[idx] = g
    },

    async deleteGoal(id: number): Promise<void> {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: makeHeaders(),
      })
      if (!res.ok) throw new Error(await res.text())
      this.goals = this.goals.filter((g) => g.id !== id)
    },
  },
})
