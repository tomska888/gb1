<template>
  <div>
    <h2>Shared with me</h2>

    <ul class="list-group">
      <li v-for="g in collab.shared" :key="g.id" class="list-group-item">
        <div class="d-flex justify-content-between">
          <div class="w-100">
            <div class="d-flex align-items-center justify-content-between">
              <h5 class="mb-1">
                {{ g.title }}
                <span v-if="g.status==='completed'" class="badge bg-success ms-2">Completed</span>
              </h5>
            </div>

            <small class="text-muted d-block mb-2">
              Owner goal · Target: {{ g.target_date ? g.target_date.slice(0, 10) : '—' }}
            </small>

            <!-- Compact panel (no status/% inputs). Respect permissions if present -->
            <CheckinsPanel :goalId="g.id" :compact="true" :permissions="(g as any).permissions" />
          </div>
        </div>
      </li>
    </ul>

    <div class="d-flex justify-content-between align-items-center mt-3">
      <div class="text-muted small">Page {{ collab.sharedPage }} / {{ collab.sharedPages }} · {{ collab.sharedTotal }} total</div>
      <div class="btn-group">
        <button class="btn btn-outline-secondary" :disabled="collab.sharedPage<=1" @click="prev">Prev</button>
        <button class="btn btn-outline-secondary" :disabled="collab.sharedPage>=collab.sharedPages" @click="next">Next</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCollabStore } from '../stores/collab.store'
import CheckinsPanel from '../components/CheckinsPanel.vue'

const route = useRoute()
const collab = useCollabStore()

function load() {
  const ownerId = route.query.ownerId ? Number(route.query.ownerId) : undefined
  collab.listShared({ page: 1, ownerId })
}
function next(){ collab.listShared({ page: collab.sharedPage + 1 }) }
function prev(){ collab.listShared({ page: collab.sharedPage - 1 }) }

onMounted(load)
watch(() => route.query.ownerId, load)
</script>
