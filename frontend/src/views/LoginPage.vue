<script setup>
import { ref } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const form = ref({
    email: '',
    password: ''
})

const showPassword = ref(false)
const errorMessage = ref('')

const handleSubmit = async () => {
    errorMessage.value = ''
    
    try {
        await authStore.login(form.value.email, form.value.password)
        
        if (authStore.isAdmin) {
            router.push('/admin')
        } else {
            router.push('/dashboard')
        }
    } catch (error) {
        errorMessage.value = error.message
    }
}
</script>

<template>
    <div class="auth-page">
        <div class="auth-container">
            <div class="auth-header">
                <div class="header-row">
                    <RouterLink to="/" class="logo">
                        <span class="logo-text">UGMTC</span>
                        <span class="logo-year">2026</span>
                    </RouterLink>
                    <button class="theme-toggle" @click="themeStore.toggleTheme">
                        {{ themeStore.isDark ? '☀️' : '🌙' }}
                    </button>
                </div>
                <h1>Masuk</h1>
                <p class="subtitle">Akses dashboard pendaftaran tim Anda</p>
            </div>

            <form @submit.prevent="handleSubmit" class="auth-form">
                <div v-if="errorMessage" class="error-alert">
                    {{ errorMessage }}
                </div>

                <div class="form-group">
                    <label class="form-label">Email</label>
                    <input 
                        v-model="form.email" 
                        type="email" 
                        class="form-input" 
                        placeholder="email@example.com"
                        required
                    >
                </div>

                <div class="form-group">
                    <label class="form-label">Password</label>
                    <div class="password-input">
                        <input 
                            v-model="form.password" 
                            :type="showPassword ? 'text' : 'password'" 
                            class="form-input" 
                            placeholder="Masukkan password"
                            required
                        >
                        <button 
                            type="button" 
                            class="toggle-password" 
                            @click="showPassword = !showPassword"
                        >
                            {{ showPassword ? '🙈' : '👁️' }}
                        </button>
                    </div>
                </div>

                <button 
                    type="submit" 
                    class="btn btn-primary btn-lg full-width"
                    :disabled="authStore.isLoading"
                >
                    {{ authStore.isLoading ? 'Memproses...' : 'Masuk' }}
                </button>
            </form>

            <div class="auth-footer">
                <p>Belum punya akun? <RouterLink to="/register">Daftar Sekarang</RouterLink></p>
            </div>

            <div class="admin-hint">
                <p><strong>Admin:</strong> admin@ugmtc.com / admin123</p>
            </div>
        </div>
    </div>
</template>

<style scoped>
.auth-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-body);
    padding: var(--space-4);
}

.auth-container {
    width: 100%;
    max-width: 420px;
}

.auth-header {
    text-align: center;
    margin-bottom: var(--space-8);
}

.header-row {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-6);
}

.logo {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
}

.logo-text {
    font-size: var(--text-3xl);
    font-weight: 800;
    color: var(--primary);
}

.logo-year {
    font-size: var(--text-lg);
    font-weight: 600;
    color: var(--text-muted);
}

.auth-header h1 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-2);
}

.subtitle {
    color: var(--text-muted);
}

.auth-form {
    background: var(--bg-card);
    padding: var(--space-6);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-color);
}

.error-alert {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--error);
    color: var(--error);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
    font-size: var(--text-sm);
}

.password-input {
    position: relative;
}

.toggle-password {
    position: absolute;
    right: var(--space-3);
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    font-size: var(--text-lg);
    cursor: pointer;
    padding: var(--space-2);
}

.full-width {
    width: 100%;
}

.auth-footer {
    text-align: center;
    margin-top: var(--space-6);
    color: var(--text-muted);
}

.auth-footer a {
    color: var(--primary);
    font-weight: 500;
}

.admin-hint {
    text-align: center;
    margin-top: var(--space-4);
    padding: var(--space-3);
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
    color: var(--text-muted);
}
</style>
