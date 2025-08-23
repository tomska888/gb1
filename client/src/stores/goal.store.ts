import { defineStore } from 'pinia';
import type { Goal, NewGoal } from '@/services/goal.service';
import { getGoals, createGoal } from '@/services/goal.service';

interface GoalState {
  goals: Goal[];
}

export const useGoalStore = defineStore('goal', {
  state: (): GoalState => ({
    goals: [],
  }),
  actions: {
    async loadGoals() {
      // getGoals() now returns Promise<Goal[]>
      const goals = await getGoals();
      this.goals = goals;
    },
    async addGoal(newGoal: NewGoal) {
      // createGoal() now returns Promise<Goal>
      const goal = await createGoal(newGoal);
      this.goals.unshift(goal);
    },
  },
});
