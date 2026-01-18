import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Initialize auth store (check for existing token) BEFORE mounting
import { useAuthStore } from './stores/authStore'

async function bootstrap() {
    const authStore = useAuthStore()
    await authStore.init() // Wait for auth to be ready
    app.mount('#app')
}

bootstrap()

