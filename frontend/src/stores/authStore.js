import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, setToken, removeToken, getToken } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
    // State
    const currentUser = ref(null)
    const isLoading = ref(false)
    const error = ref(null)

    // Computed
    const isAuthenticated = computed(() => !!currentUser.value)
    const isAdmin = computed(() => currentUser.value?.role === 'admin')
    const isUser = computed(() => currentUser.value?.role === 'user')
    const isEmailVerified = computed(() => currentUser.value?.emailVerified === true)

    // Initialize from token
    const init = async () => {
        const token = getToken()
        if (token) {
            try {
                isLoading.value = true
                const response = await authApi.me()
                currentUser.value = response.user
            } catch (e) {
                // Token invalid, remove it
                removeToken()
                currentUser.value = null
            } finally {
                isLoading.value = false
            }
        }
    }

    // Register new user
    const register = async (userData) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await authApi.register(userData)
            setToken(response.token)
            currentUser.value = response.user
            return response
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Login
    const login = async (email, password) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await authApi.login(email, password)
            setToken(response.token)
            currentUser.value = response.user
            return response.user
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Logout
    const logout = async () => {
        try {
            await authApi.logout()
        } catch (e) {
            // Ignore logout errors
        } finally {
            removeToken()
            currentUser.value = null
        }
    }

    // Verify email
    const verifyEmail = async (token) => {
        isLoading.value = true
        error.value = null

        try {
            const response = await authApi.verifyEmail(token)
            // Refresh user data
            await init()
            return response
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Resend verification
    const resendVerification = async () => {
        isLoading.value = true
        error.value = null

        try {
            return await authApi.resendVerification()
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Forgot password
    const forgotPassword = async (email) => {
        isLoading.value = true
        error.value = null

        try {
            return await authApi.forgotPassword(email)
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Reset password
    const resetPassword = async (token, password) => {
        isLoading.value = true
        error.value = null

        try {
            return await authApi.resetPassword(token, password)
        } catch (e) {
            error.value = e.message
            throw e
        } finally {
            isLoading.value = false
        }
    }

    // Refresh user data
    const refreshUser = async () => {
        try {
            const response = await authApi.me()
            currentUser.value = response.user
        } catch (e) {
            // Ignore
        }
    }

    return {
        currentUser,
        isLoading,
        error,
        isAuthenticated,
        isAdmin,
        isUser,
        isEmailVerified,
        init,
        register,
        login,
        logout,
        verifyEmail,
        resendVerification,
        forgotPassword,
        resetPassword,
        refreshUser
    }
})
