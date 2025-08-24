import { defineStore } from 'pinia'

export type Status = 'in_progress' | 'completed' | 'abandoned'

export interface Goal {
  id: number
  title: string
  description: string | null
  targetDate: string | null
  status: Status
  category: string | null
  tags: string | null
  color: string | null
  createdAt: string
  updatedAt?: string | null
}

type ApiGoal = {
  id: number
  title: string
  description: string | null
  target_date: string | null
  status: Status
  category: string | null
  tags: string | null
  color: string | null
  created_at: string
  updated_at?: string | null
}

export type SortKey =
  | 'created_desc' | 'created_asc'
  | 'target_asc'  | 'target_desc'
  | 'title_asc'   | 'title_desc'

export interface ListResponse {
  data: ApiGoal[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}

type CreateGoalInput = {
  title: string
  description?: string
  targetDate?: string | null
  category?: string
  tags?: string
  color?: string
}

type UpdateGoalInput = Partial<{
  title: string
  description: string | null
  targetDate: string | null
  status: Status
  category: string | null
  tags: string | null
  color: string | null
}>

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
  category: row.category ?? null,
  tags: row.tags ?? null,
  color: row.color ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at ?? null,
})

export const useGoalStore = defineStore('goal', {
  state: () => ({
    goals: [] as Goal[],
    loading: false as boolean,
    error: null as string | null,

    // pagination
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 1,

    categories: [] as string[],
  }),

  actions: {
    async loadGoals(opts?: {
      page?: number
      pageSize?: number
      status?: 'all' | Status
      q?: string
      sort?: SortKey
      category?: string
    }): Promise<void> {
      this.loading = true
      this.error = null
      try {
        const params = new URLSearchParams()
        params.set('page', String(opts?.page ?? this.page))
        params.set('pageSize', String(opts?.pageSize ?? this.pageSize))
        params.set('status', String(opts?.status ?? 'in_progress'))
        params.set('q', opts?.q ?? '')
        params.set('sort', String(opts?.sort ?? 'created_desc'))
        if (opts?.category) params.set('category', opts.category)

        const res = await fetch(`/api/goals?${params.toString()}`, {
          headers: makeHeaders(),
        })
        if (!res.ok) throw new Error(await res.text())
        const data: ListResponse = await res.json()
        this.goals = data.data.map(toClient)
        this.page = data.page
        this.pageSize = data.pageSize
        this.total = data.total
        this.totalPages = data.totalPages
      } catch (e) {
        this.error = e instanceof Error ? e.message : 'Failed to load goals'
      } finally {
        this.loading = false
      }
    },

    async loadCategories(): Promise<void> {
      try {
        const res = await fetch('/api/goals/categories', { headers: makeHeaders() })
        if (!res.ok) throw new Error(await res.text())
        const data: string[] = await res.json()
        this.categories = data
      } catch {
        /* non-fatal */
      }
    },

    async addGoal(input: CreateGoalInput): Promise<void> {
      const body = {
        title: input.title,
        description: input.description ?? undefined,
        target_date: input.targetDate ?? undefined,
        category: input.category ?? undefined,
        tags: input.tags ?? undefined,
        color: input.color ?? undefined,
      }
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: makeHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      // not inserting locally to keep server-side paging consistent; trigger reload from UI
    },

    async updateGoal(id: number, patch: UpdateGoalInput): Promise<Goal> {
      const body: Record<string, unknown> = {}
      if (patch.title !== undefined) body.title = patch.title
      if (patch.description !== undefined) body.description = patch.description
      if (patch.targetDate !== undefined) body.target_date = patch.targetDate
      if (patch.status !== undefined) body.status = patch.status
      if (patch.category !== undefined) body.category = patch.category
      if (patch.tags !== undefined) body.tags = patch.tags
      if (patch.color !== undefined) body.color = patch.color

      const res = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: makeHeaders(),
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(await res.text())
      const updated = toClient(await res.json())
      const idx = this.goals.findIndex((x) => x.id === id)
      if (idx !== -1) this.goals[idx] = updated
      return updated
    },

    async deleteGoal(id: number): Promise<void> {
      const res = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
        headers: makeHeaders(),
      })
      if (!res.ok) throw new Error(await res.text())
      // remove locally to be snappy
      this.goals = this.goals.filter((g) => g.id !== id)
      // total might have changed; page reload can be triggered by UI as needed
    },
  },
})
