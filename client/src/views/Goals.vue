<template>
  <div>
    <h2>Your Goals</h2>

    <!-- FILTER TABS -->
    <ul class="nav nav-pills mb-3">
      <li class="nav-item">
        <button class="nav-link" :class="{ active: filter === 'in_progress' }" @click="setFilter('in_progress')">
          Active <span class="badge bg-secondary ms-1">{{ counts.in_progress }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: filter === 'completed' }" @click="setFilter('completed')">
          Completed <span class="badge bg-secondary ms-1">{{ counts.completed }}</span>
        </button>
      </li>
      <li class="nav-item">
        <button class="nav-link" :class="{ active: filter === 'abandoned' }" @click="setFilter('abandoned')">
          Abandoned <span class="badge bg-secondary ms-1">{{ counts.abandoned }}</span>
        </button>
      </li>
      <li class="nav-item ms-auto">
        <button class="nav-link" :class="{ active: filter === 'all' }" @click="setFilter('all')">
          All <span class="badge bg-secondary ms-1">{{ goalStore.goals.length }}</span>
        </button>
      </li>
    </ul>

    <!-- CREATE / EDIT -->
    <form @submit.prevent="onSubmit" class="mb-4">
      <div class="row g-2 align-items-end">
        <div class="col-md-4">
          <label class="form-label">Title</label>
          <input v-model="title" placeholder="New goal title" type="text" class="form-control" required />
        </div>

        <div class="col-md-4">
          <label class="form-label">Description</label>
          <input v-model="description" placeholder="Optional description" type="text" class="form-control" />
        </div>

        <div class="col-md-2">
          <label class="form-label">Target date</label>
          <input v-model="targetDate" type="date" class="form-control" />
        </div>

        <div class="col-md-2 d-grid">
          <button type="submit" class="btn btn-primary">{{ editingId ? 'Save' : 'Add Goal' }}</button>
        </div>
      </div>

      <div v-if="editingId" class="mt-2">
        <button type="button" class="btn btn-secondary btn-sm" @click="cancelEdit">Cancel edit</button>
      </div>
    </form>

    <!-- LIST -->
    <ul class="list-group">
      <li v-for="goal in filteredGoals" :key="goal.id" class="list-group-item">
        <div class="d-flex justify-content-between align-items-start">
          <div>
            <h5 class="mb-1" :class="{ 'text-decoration-line-through': goal.status === 'completed' }">{{ goal.title }}</h5>
            <p v-if="goal.description" class="mb-1">{{ goal.description }}</p>
            <div class="text-muted">
              <small>Target: {{ goal.targetDate ? goal.targetDate.slice(0,10) : '—' }}</small>
              <small class="ms-2">Created at {{ formatDate(goal.createdAt) }}</small>
            </div>

            <div class="mt-1">
              <small class="text-muted">Status:</small>
              <select
                class="form-select form-select-sm d-inline-block w-auto ms-1"
                :value="goal.status"
                @change="onStatusChange($event, goal)"
              >
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="abandoned">Abandoned</option>
              </select>

              <button
                v-if="goal.status !== 'completed'"
                class="btn btn-sm btn-success ms-2"
                @click="markCompleted(goal)"
              >
                Complete
              </button>
              <button
                v-else
                class="btn btn-sm btn-outline-secondary ms-2"
                @click="reopen(goal)"
              >
                Reopen
              </button>
            </div>
          </div>

          <div class="ms-2 d-flex gap-2">
            <button class="btn btn-sm btn-outline-primary" @click="startEdit(goal)">Edit</button>
            <button class="btn btn-sm btn-outline-danger" @click="remove(goal.id)">Delete</button>
          </div>
        </div>
      </li>
    </ul>

    <div v-if="!filteredGoals.length" class="text-center text-muted mt-5">
      No goals in this list.
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'GoalsView' })

import { ref, onMounted, computed } from 'vue'
import { useGoalStore, type Goal, type Status } from '../stores/goal.store'

const goalStore = useGoalStore()

const title = ref('')
const description = ref('')
const targetDate = ref<string | null>(null)
const editingId = ref<number | null>(null)

type Filter = 'all' | 'in_progress' | 'completed' | 'abandoned'
const filter = ref<Filter>('in_progress')

const counts = computed(() => ({
  in_progress: goalStore.goals.filter((g) => g.status === 'in_progress').length,
  completed: goalStore.goals.filter((g) => g.status === 'completed').length,
  abandoned: goalStore.goals.filter((g) => g.status === 'abandoned').length,
}))

const filteredGoals = computed(() =>
  filter.value === 'all'
    ? goalStore.goals
    : goalStore.goals.filter((g) => g.status === filter.value)
)

function setFilter(f: Filter) {
  filter.value = f
}

onMounted(async () => {
  await goalStore.loadGoals()
})

async function onSubmit() {
  if (editingId.value) {
    await goalStore.updateGoal(editingId.value, {
      title: title.value,
      description: description.value || null,
      targetDate: targetDate.value ?? null,
    })
    resetForm()
    return
  }

  await goalStore.addGoal({
    title: title.value,
    description: description.value || undefined,
    targetDate: targetDate.value ?? null,
  })
  resetForm()
}

function startEdit(goal: Goal) {
  editingId.value = goal.id
  title.value = goal.title
  description.value = goal.description ?? ''
  targetDate.value = goal.targetDate ? goal.targetDate.slice(0, 10) : null
}

function cancelEdit() {
  resetForm()
}

async function remove(id: number) {
  if (!confirm('Delete this goal?')) return
  await goalStore.deleteGoal(id)
}

async function onStatusChange(e: Event, goal: Goal) {
  const value = (e.target as HTMLSelectElement).value as Status
  if (value === goal.status) return
  await goalStore.updateGoal(goal.id, { status: value })
}

async function markCompleted(goal: Goal) {
  await goalStore.updateGoal(goal.id, { status: 'completed' })
}

async function reopen(goal: Goal) {
  await goalStore.updateGoal(goal.id, { status: 'in_progress' })
}

function resetForm() {
  editingId.value = null
  title.value = ''
  description.value = ''
  targetDate.value = null
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleString()
}
</script>

<style scoped>
.text-decoration-line-through { text-decoration: line-through; }
.nav .nav-link { cursor: pointer; }
</style>
