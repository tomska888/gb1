<template>
  <div class="mt-2">
    <div class="d-flex gap-2 align-items-end">
      <select v-model="status" class="form-select form-select-sm" style="max-width: 160px">
        <option value="on_track">On track</option>
        <option value="blocked">Blocked</option>
        <option value="done">Done</option>
      </select>
      <input v-model.number="progress" type="number" min="0" max="100" class="form-control form-control-sm" style="max-width:100px" placeholder="%"/>
      <input v-model="note" class="form-control form-control-sm" placeholder="Quick check-in note" />
      <button class="btn btn-sm btn-outline-primary" @click="send">Send</button>
      <button class="btn btn-sm btn-outline-secondary" @click="reload">Refresh</button>
    </div>

    <ul class="list-group list-group-flush mt-2">
      <li v-for="c in list" :key="c.id" class="list-group-item px-0">
        <span class="badge bg-light text-dark border me-2">{{ c.status }}</span>
        <span v-if="c.progress != null" class="badge bg-info text-dark me-2">{{ c.progress }}%</span>
        <span>{{ c.note }}</span>
        <small class="text-muted ms-2">{{ new Date(c.created_at).toLocaleString() }}</small>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, ref } from 'vue'
import { useCollabStore, type CheckinStatus } from '../stores/collab.store'

export default defineComponent({
  name: 'CheckinsPanel',
  props: { goalId: { type: Number, required: true } },
  setup(props) {
    const collab = useCollabStore()
    const status = ref<CheckinStatus>('on_track')
    const progress = ref<number | null>(null)
    const note = ref('')
    const list = computed(() => collab.checkins[props.goalId] ?? [])
    async function reload() { await collab.listCheckins(props.goalId) }
    async function send() {
      await collab.addCheckin(props.goalId, { status: status.value, progress: progress.value, note: note.value })
      note.value = ''; progress.value = null; status.value = 'on_track'
    }
    onMounted(reload)
    return { status, progress, note, list, send, reload }
  }
})
</script>
