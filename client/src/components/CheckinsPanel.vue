<template>
  <div class="mt-2">
    <div class="d-flex gap-2 align-items-end">
      <!-- hide/show per props -->
      <select
        v-if="showStatus"
        v-model="status"
        class="form-select form-select-sm"
        style="max-width: 160px"
      >
        <option value="on_track">On track</option>
        <option value="blocked">Blocked</option>
        <option value="done">Done</option>
      </select>

      <input
        v-if="showProgress"
        v-model.number="progress"
        type="number"
        min="0" max="100"
        class="form-control form-control-sm"
        style="max-width:100px"
        placeholder="%"
      />

      <input
        v-model="note"
        class="form-control form-control-sm"
        placeholder="Quick check-in note"
      />

      <button class="btn btn-sm btn-outline-primary" @click="send">Send</button>
      <button class="btn btn-sm btn-outline-secondary" @click="reload">Refresh</button>
    </div>

    <ul class="list-group list-group-flush mt-2">
      <li v-for="c in list" :key="c.id" class="list-group-item px-0 d-flex align-items-center">
        <span
          class="badge me-2"
          :class="{
            'bg-success': c.status === 'done',
            'bg-danger':  c.status === 'blocked',
            'bg-light text-dark border': c.status === 'on_track'
          }"
        >
          {{ c.status }}
        </span>

        <span v-if="c.progress != null" class="badge bg-info text-dark me-2">{{ c.progress }}%</span>
        <span class="me-2">{{ c.note }}</span>
        <small class="text-muted me-auto">{{ new Date(c.created_at).toLocaleString() }}</small>

        <!-- who wrote it -->
        <span class="badge" :class="c.senderIsOwner ? 'bg-primary' : 'bg-secondary'">
          {{ c.senderIsOwner ? 'Owner' : 'Buddy' }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, ref, watch } from 'vue';
import { useCollabStore, type CheckinStatus } from '../stores/collab.store';

export default defineComponent({
  name: 'CheckinsPanel',
  props: {
    goalId: { type: Number, required: true },
    showStatus: { type: Boolean, default: true },
    showProgress: { type: Boolean, default: true },
  },
  setup(props) {
    const collab = useCollabStore();

    const status = ref<CheckinStatus>('on_track');
    const progress = ref<number | null>(null);
    const note = ref('');

    const list = computed(() => {
      const rows = collab.checkins[props.goalId] ?? [];
      const myId = Number(localStorage.getItem('userId') || '0');
      return rows.map(r => ({ ...r, senderIsOwner: r.user_id === myId }));
    });

    async function reload() {
      if (props.goalId) await collab.listCheckins(props.goalId);
    }
    async function send() {
      await collab.addCheckin(props.goalId, {
        status: status.value,          // defaults to 'on_track' if hidden
        progress: progress.value,      // remains null if hidden
        note: note.value,
      });
      note.value = '';
      progress.value = null;
      status.value = 'on_track';
    }

    onMounted(reload);
    watch(() => props.goalId, reload);

    return { status, progress, note, list, send, reload };
  },
});
</script>
