<template>
  <div class="text-center">
    <h1 class="display-4">Welcome to GoalBuddy</h1>
    <p class="lead">
      Track your personal goals, stay motivated, and share progress with friends.
    </p>
    <router-link v-if="!isAuthenticated" class="btn btn-primary me-2" to="/signup">
      Get Started
    </router-link>
    <router-link v-if="isAuthenticated" class="btn btn-success me-2" to="/goals">
      View Your Goals
    </router-link>
    <router-link class="btn btn-outline-secondary" to="/about">
      Learn More
    </router-link>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAuthStore } from '../stores/auth.store';

const auth = useAuthStore();
const isAuthenticated = computed(() => !!auth.token);
</script>

<style scoped>
/* Center vertically on larger screens */
.text-center {
  margin-top: 4rem;
}
</style>
