<template>
  <div class="modal fade" id="shareModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Share goal</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
        </div>

        <div class="modal-body">
          <!-- Error / success banners -->
          <div v-if="errorMsg" class="alert alert-danger d-flex justify-content-between align-items-center py-2">
            <span>{{ errorMsg }}</span>
            <button type="button" class="btn-close" aria-label="Close" @click="errorMsg = ''"></button>
          </div>
          <div v-if="successMsg" class="alert alert-success d-flex justify-content-between align-items-center py-2">
            <span>{{ successMsg }}</span>
            <button type="button" class="btn-close" aria-label="Close" @click="successMsg = ''"></button>
          </div>

          <!-- Single-buddy note -->
          <div v-if="singleMode" class="alert alert-info py-2">
            This goal is already shared with one buddy. Revoke the current share first to share with someone else.
          </div>

          <!-- Input row -->
          <div class="input-group mb-3">
            <input
              v-model="email"
              type="email"
              class="form-control"
              placeholder="buddy@email.com"
              :disabled="singleMode"
              @input="clearBanner"
            />
            <select v-model="perm" class="form-select" style="max-width: 140px" :disabled="singleMode">
              <option value="checkin">Check-in</option>
              <option value="view">View only</option>
            </select>
            <button class="btn btn-primary" :disabled="!email || singleMode" @click="doShare">Share</button>
          </div>

          <!-- Current share (0 or 1 in single-mode) -->
          <div v-if="shares.length">
            <div class="fw-semibold mb-2">Shared with</div>
            <ul class="list-group">
              <li
                v-for="s in shares"
                :key="s.id"
                class="list-group-item d-flex justify-content-between align-items-center"
              >
                <span>{{ s.email }} <small class="text-muted">({{ s.permissions }})</small></span>
                <button class="btn btn-sm btn-outline-danger" @click="revoke(s.buddy_id)">Revoke</button>
              </li>
            </ul>
          </div>
          <div v-else class="text-muted">Not shared yet.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch } from 'vue'
import { useCollabStore } from '../stores/collab.store'

export default defineComponent({
  name: 'ShareDialog',
  props: { goalId: { type: Number, required: false } },
  setup (props) {
    const collab = useCollabStore()
    const email = ref('')
    const perm = ref<'view'|'checkin'>('checkin')
    const shares = computed(() => (props.goalId ? collab.shares[props.goalId] ?? [] : []))
    const singleMode = computed(() => shares.value.length >= 1)

    // Inline banners
    const errorMsg = ref('')
    const successMsg = ref('')

    function clearBanner () {
      errorMsg.value = ''
      successMsg.value = ''
    }

    // Load on open / goal change
    watch(
      () => props.goalId,
      async (id) => {
        clearBanner()
        if (id) await collab.getShares(id)
      },
      { immediate: true }
    )

    async function doShare () {
      if (!props.goalId) return
      clearBanner()
      try {
        await collab.share(props.goalId, email.value, perm.value)
        successMsg.value = `Shared with ${email.value}.`
        email.value = ''
      } catch (e: any) {
        errorMsg.value = e?.message || 'Share failed.'
      }
    }

    async function revoke (buddyId: number) {
      if (!props.goalId) return
      clearBanner()
      await collab.revokeShare(props.goalId, buddyId)
      successMsg.value = 'Share revoked.'
    }

    return { email, perm, shares, singleMode, doShare, revoke, errorMsg, successMsg, clearBanner }
  }
})
</script>
