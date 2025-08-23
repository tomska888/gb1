import { createApp } from 'vue';
import App from './App.vue';
import router from './router';
import { createPinia } from 'pinia';
import { useAuthStore } from '@/stores/auth.store';

// Bootstrap global imports
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

// Bring in our auth util
import { setAuthHeader } from '@/services/auth.service';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

const auth = useAuthStore();
const token = localStorage.getItem('token');
const email = localStorage.getItem('userEmail');

if (token) {
  auth.token = token;
  setAuthHeader(token);
}
if (email) {
  auth.userEmail = email;
}

app.mount('#app');