<template>
  <div>
    <h2>Your Goals</h2>
    <form @submit.prevent="onSubmit" class="mb-4">
      <div class="input-group">
        <input
          v-model="title"
          placeholder="New goal title"
          type="text"
          class="form-control"
          required
        />
        <button type="submit" class="btn btn-primary">Add Goal</button>
      </div>
    </form>

    <ul class="list-group">
      <li v-for="goal in goalStore.goals" :key="goal.id" class="list-group-item">
        <h5>{{ goal.title }}</h5>
        <p v-if="goal.description" class="mb-0">{{ goal.description }}</p>
        <small class="text-muted">Created at {{ formatDate(goal.createdAt) }}</small>
      </li>
    </ul>

    <div v-if="!goalStore.goals.length" class="text-center text-muted mt-5">
      No goals yet. Start by adding one above!
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGoalStore } from '../stores/goal.store';

const goalStore = useGoalStore();
const title = ref('');
const description = ref('');

onMounted(async () => {
  await goalStore.loadGoals();
});

async function onSubmit() {
  await goalStore.addGoal({ title: title.value, description: description.value || undefined });
  title.value = '';
  description.value = '';
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString();
}
</script>

<style scoped>
/* any page-specific styling */
</style>