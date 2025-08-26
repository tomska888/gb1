<template>
  <div class="mt-2">
    <!-- Single composer row -->
    <div v-if="canPost" class="d-flex gap-2 align-items-center mb-2">
      <!-- Owner-only status + % -->
      <template v-if="isOwner">
        <select v-model="status" class="form-select form-select-sm" style="max-width: 160px">
          <option value="on_track">On track</option>
          <option value="blocked">Blocked</option>
          <option value="done">Done</option>
        </select>

        <input
          v-model.number="progress"
          type="number"
          min="0"
          max="100"
          class="form-control form-control-sm"
          style="max-width:100px"
          placeholder="%"
        />
      </template>

      <!-- One large input for both cases -->
      <input
        v-model="text"
        class="form-control form-control-sm"
        :placeholder="isOwner ? 'Quick check-in note or message…' : 'Quick message…'"
        @keyup.enter="send"
      />

      <button
        class="btn btn-sm btn-outline-primary"
        :disabled="sendDisabled"
        @click="send"
      >
        Send
      </button>

      <button class="btn btn-sm btn-outline-secondary" @click="reload">Refresh</button>
    </div>

    <!-- Messages (newest first). Collapsible to last few. -->
    <ul class="list-group list-group-flush">
      <li
        v-for="m in visibleMsgs"
        :key="m.id"
        class="list-group-item px-0 d-flex align-items-start justify-content-between"
      >
        <div class="me-2">
          <span class="badge" :class="isMe(m) ? 'bg-primary' : 'bg-secondary'">
            {{ isMe(m) ? 'Me' : 'Buddy' }}
          </span>

          <!-- When owner sent a check-in, we echoed a chat line too; show status/% as badges on that line if present -->
          <span v-if="m._status" class="badge bg-light text-dark border ms-2">{{ m._status }}</span>
          <span v-if="m._progress != null" class="badge bg-info text-dark ms-1">{{ m._progress }}%</span>

          <span class="ms-2">{{ m.body }}</span>
          <small class="text-muted ms-2">{{ new Date(m.created_at).toLocaleString() }}</small>
        </div>
      </li>
    </ul>

    <div v-if="msgs.length > MAX_VISIBLE" class="mt-2">
      <button class="btn btn-link p-0" @click="toggleShowAll">
        {{ showAll ? 'Show less' : `Show more (${msgs.length - MAX_VISIBLE} older…)` }}
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, onMounted, ref, watch } from 'vue'
import { useCollabStore, type CheckinStatus } from '../stores/collab.store'
import { useAuthStore } from '../stores/auth.store'

/**
 * This component renders ONE feed (messages) to avoid duplicates.
 * Owner: must provide %; we send check-in (to keep history) + echo a single chat message.
 * Buddy: sends only a chat message.
 */
export default defineComponent({
  name: 'CheckinsPanel',
  props: {
    goalId: { type: Number, required: true },
    /** compact=true is what you use on “Shared with me”. We still derive posting rights from `permissions`. */
    compact: { type: Boolean, default: false },
    /** Buddy permissions when rendered in the shared list. Omitted for owner’s own goals. */
    permissions: { type: String as () => 'view' | 'checkin' | undefined, default: undefined },
  },
  setup (props) {
    const collab = useCollabStore()
    const auth = useAuthStore()

    // ---- form state
    const status   = ref<CheckinStatus>('on_track')   // owner only
    const progress = ref<number | null>(null)         // owner only
    const text     = ref('')                          // big input (both roles)

    // ---- who am I in this context?
    const isOwner  = computed(() => !props.permissions) // owner rendering doesn't pass permissions
    const canPost  = computed(() => {
      if (props.permissions === 'view') return false     // buddy is view-only
      return true                                        // owner OR buddy with 'checkin'
    })

    // ---- feed (messages only; newest first from API)
    const msgs = computed(() => collab.messages[props.goalId] ?? [])

    // Optional collapse to last few messages
    const MAX_VISIBLE = 4
    const showAll = ref(false)
    const visibleMsgs = computed(() => showAll.value ? msgs.value : msgs.value.slice(0, MAX_VISIBLE))
    function toggleShowAll () { showAll.value = !showAll.value }

    // ---- me/buddy badge
    function isMe (m: { sender_id?: number; email?: string }) {
      if (typeof (auth as any).userId === 'number' && typeof m.sender_id === 'number') {
        return m.sender_id === (auth as any).userId
      }
      return !!(m.email && auth.userEmail && m.email.toLowerCase() === auth.userEmail.toLowerCase())
    }

    // ---- load just messages (we no longer render the raw check-in list)
    async function reload () {
      await collab.listMessages(props.goalId)
    }

    // ---- sending
    const sendDisabled = computed(() => {
      if (!canPost.value) return true
      if (isOwner.value) {
        // owner must choose a %; text can be empty
        return progress.value == null || Number.isNaN(progress.value)
      } else {
        // buddy must write something
        return !text.value.trim()
      }
    })

    async function send () {
      if (sendDisabled.value) return

      if (isOwner.value) {
        // 1) store the check-in (history)
        await collab.addCheckin(props.goalId, {
          status: status.value,
          progress: progress.value,
          note: text.value.trim() || null,
        })

        // 2) echo a single chat line that includes the note;
        //    we don’t want a second visual line for the raw check-in record.
        //    To help the UI show status/% badges on this chat line, we include
        //    lightweight hints (not persisted – added client-side after post).
        await collab.addMessage(props.goalId, text.value.trim())

        // reload messages and decorate the newest one with the badges
        await reload()
        const latest = (collab.messages[props.goalId] ?? [])[0]
        if (latest) {
          // decorate in-memory; harmless if structure changes
          (latest as any)._status = status.value
          ;(latest as any)._progress = progress.value
        }

        // reset owner form
        text.value = ''
        progress.value = null
        status.value = 'on_track'
      } else {
        // buddy: only a chat message
        await collab.addMessage(props.goalId, text.value.trim())
        await reload()
        text.value = ''
      }
    }

    onMounted(reload)
    watch(() => props.goalId, reload)

    return {
      // state
      status, progress, text,
      // roles
      isOwner, canPost,
      // feed
      msgs, MAX_VISIBLE, visibleMsgs, showAll, toggleShowAll,
      // helpers
      isMe, reload,
      // send
      send, sendDisabled,
    }
  }
})
</script>
