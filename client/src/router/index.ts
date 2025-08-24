import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router';
import Home    from '@/views/Home.vue';
import About   from '@/views/About.vue';
import Login   from '@/views/Login.vue';
import Signup  from '@/views/Signup.vue';
import Goals   from '@/views/Goals.vue';
import Profile from '@/views/Profile.vue';
import { useAuthStore } from '@/stores/auth.store';

const routes: RouteRecordRaw[] = [
  { path: '/',       name: 'Home',   component: Home,    meta: { requiresAuth: false } },
  { path: '/about',  name: 'About',  component: About,   meta: { requiresAuth: false } },
  { path: '/login',  name: 'Login',  component: Login,   meta: { requiresAuth: false } },
  { path: '/signup', name: 'Signup', component: Signup,  meta: { requiresAuth: false } },
  { path: '/goals',  name: 'Goals',  component: Goals,   meta: { requiresAuth: true  } },
  { path: '/profile', name: 'Profile', component: Profile, meta: { requiresAuth: true } },
  { path: '/shared', name: 'Shared', component: () => import('@/views/Shared.vue'), meta: { requiresAuth: true } },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach((to, from, next) => {
  const auth = useAuthStore();
  if (to.meta.requiresAuth && !auth.token) {
    return next({ name: 'Login' });
  }
  next();
});

export default router;
