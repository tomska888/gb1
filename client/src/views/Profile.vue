<template>
  <div class="container">
    <h1>Your Profile</h1>

    <div class="card p-4 mb-4">
      <p><strong>Email:</strong> {{ userEmail || '—' }}</p>
    </div>

    <div class="card">
      <div class="card-header d-flex align-items-center justify-content-between">
        <span>People who share goals with you</span>
        <button class="btn btn-sm btn-outline-secondary" @click="reloadOwners">Refresh</button>
      </div>

      <div class="card-body p-0">
        <ul class="list-group list-group-flush" v-if="owners.length">
          <li
            v-for="o in owners"
            :key="o.owner_id"
            class="list-group-item d-flex justify-content-between align-items-center"
          >
            <router-link
              class="text-decoration-none"
              :to="{ name: 'Shared', query: { owner: o.owner_id } }"
            >
              {{ o.email }}
            </router-link>
            <span class="badge bg-secondary">{{ o.goal_count }} goals</span>
          </li>
        </ul>
        <div v-else class="p-3 text-muted">No one is sharing with you yet.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useAuthStore } from '../stores/auth.store';
import { useCollabStore } from '../stores/collab.store';

const auth = useAuthStore();
const collab = useCollabStore();

const userEmail = computed(() => auth.userEmail);
const owners = computed(() => collab.owners);

async function reloadOwners() {
  await collab.listOwners();
}

onMounted(async () => {
  if (!collab.ownersLoaded) await collab.listOwners();
});
</script>
