import axios from 'axios'

export interface Goal {
  id: number
  title: string
  description?: string
  createdAt: string
}

export interface NewGoal {
  title: string
  description?: string
}

interface RawGoal {
  id: number
  title: string
  description?: string
  created_at: string
}

export function getGoals() {
  return axios.get<RawGoal[]>(`/api/goals`).then((res) =>
    res.data.map(
      (g): Goal => ({
        id: g.id,
        title: g.title,
        description: g.description,
        createdAt: g.created_at,
      }),
    ),
  )
}

export function createGoal(goal: NewGoal) {
  return axios.post<RawGoal>(`/api/goals`, goal).then((res) => {
    const g = res.data
    return {
      id: g.id,
      title: g.title,
      description: g.description,
      createdAt: g.created_at,
    } as Goal
  })
}
