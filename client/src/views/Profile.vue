<template>
  <div class="container">
    <h1>Your Profile</h1>
    <div class="card p-4">
      <p><strong>Email:</strong> {{ userEmail || '—' }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth.store';

const auth = useAuthStore();
const userEmail = computed(() => auth.userEmail);
</script>
