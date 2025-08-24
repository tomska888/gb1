<template>
  <div>
    <h2>Shared with me</h2>

    <ul class="list-group">
      <li v-for="g in collab.shared" :key="g.id" class="list-group-item">
        <div class="d-flex justify-content-between">
          <div>
            <div class="d-flex align-items-center gap-2 mb-1">
              <h5 class="mb-0">{{ g.title }}</h5>
              <span v-if="g.status === 'completed'" class="badge bg-success">Completed</span>
            </div>
            <small class="text-muted">Owner goal · Target: {{ g.target_date ? g.target_date.slice(0,10) : '—' }}</small>

            <!-- Guard against missing id -->
            <div v-if="g.id" class="mt-2">
              <!-- lock inputs if owner marked the goal completed -->
              <CheckinsPanel :goalId="g.id" :readonly="g.status === 'completed'" />
            </div>
            <div v-else class="text-danger small mt-2">Error: goal id missing</div>
          </div>
        </div>
      </li>
    </ul>

    <div class="d-flex justify-content-between align-items-center mt-3">
      <div class="text-muted small">
        Page {{ collab.sharedPage }} / {{ collab.sharedPages }} · {{ collab.sharedTotal }} total
      </div>
      <div class="btn-group">
        <button class="btn btn-outline-secondary" :disabled="collab.sharedPage<=1" @click="prev">Prev</button>
        <button class="btn btn-outline-secondary" :disabled="collab.sharedPage>=collab.sharedPages" @click="next">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useCollabStore } from '../stores/collab.store'
import CheckinsPanel from '../components/CheckinsPanel.vue'

const collab = useCollabStore()

function next() {
  collab.listShared({ page: collab.sharedPage + 1 })
}
function prev() {
  collab.listShared({ page: collab.sharedPage - 1 })
}

onMounted(() => collab.listShared())
</script>
