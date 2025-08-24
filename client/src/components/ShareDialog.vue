<template>
  <div class="modal fade" id="shareModal" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Share goal</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"/>
        </div>
        <div class="modal-body">
          <div class="input-group mb-3">
            <input v-model="email" type="email" class="form-control" placeholder="buddy@email.com" />
            <select v-model="perm" class="form-select" style="max-width: 140px">
              <option value="checkin">Check-in</option>
              <option value="view">View only</option>
            </select>
            <button class="btn btn-primary" :disabled="!email" @click="doShare">Share</button>
          </div>

          <div v-if="shares.length">
            <div class="fw-semibold mb-2">Shared with</div>
            <ul class="list-group">
              <li v-for="s in shares" :key="s.id" class="list-group-item d-flex justify-content-between align-items-center">
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
import { defineComponent, computed, ref, watch } from 'vue';
import { useCollabStore } from '../stores/collab.store';

export default defineComponent({
  name: 'ShareDialog',
  props: { goalId: { type: Number, required: false } },
  setup(props) {
    const collab = useCollabStore();
    const email = ref('');
    const perm = ref<'view'|'checkin'>('checkin');
    const shares = computed(() => (props.goalId ? collab.shares[props.goalId] ?? [] : []));
    watch(() => props.goalId, async (id) => { if (id) await collab.getShares(id); });
    async function doShare() { if (!props.goalId) return; await collab.share(props.goalId, email.value, perm.value); email.value = ''; }
    async function revoke(buddyId: number) { if (!props.goalId) return; await collab.revokeShare(props.goalId, buddyId); }
    return { email, perm, shares, doShare, revoke };
  }
});
</script>
