import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'

// Views
import HomePage from '../views/HomePage.vue'

// Layouts
import DashboardLayout from '../layouts/DashboardLayout.vue'
import AdminLayout from '../layouts/AdminLayout.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomePage
    },
    {
        path: '/register',
        name: 'Register',
        component: () => import('../views/RegisterPage.vue')
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/LoginPage.vue')
    },
    {
        path: '/verify-email',
        name: 'VerifyEmail',
        component: () => import('../views/VerifyEmailPage.vue')
    },
    {
        path: '/forgot-password',
        name: 'ForgotPassword',
        component: () => import('../views/ForgotPasswordPage.vue')
    },
    {
        path: '/reset-password',
        name: 'ResetPassword',
        component: () => import('../views/ResetPasswordPage.vue')
    },
    {
        path: '/data',
        name: 'Data',
        component: () => import('../views/DataPage.vue')
    },
    {
        path: '/live',
        name: 'LiveMatch',
        component: () => import('../views/LiveMatchPage.vue')
    },
    // User Dashboard routes (protected)
    {
        path: '/dashboard',
        component: DashboardLayout,
        meta: { requiresAuth: true, role: 'user' },
        children: [
            {
                path: '',
                name: 'DashboardHome',
                component: () => import('../views/dashboard/DashboardHome.vue')
            },
            {
                path: 'team',
                name: 'TeamProfile',
                component: () => import('../views/dashboard/TeamProfilePage.vue')
            },
            {
                path: 'entries',
                name: 'DashboardEntries',
                component: () => import('../views/dashboard/DashboardEntries.vue')
            },
            {
                path: 'import-athletes',
                name: 'ImportAthletes',
                component: () => import('../views/dashboard/ImportAthletesPage.vue')
            },
            {
                path: 'settings',
                name: 'DashboardSettings',
                component: () => import('../views/dashboard/DashboardSettings.vue')
            }
        ]
    },
    // Admin routes (protected, admin only)
    {
        path: '/admin',
        component: AdminLayout,
        meta: { requiresAuth: true, role: 'admin' },
        children: [
            {
                path: '',
                name: 'AdminHome',
                component: () => import('../views/admin/AdminHome.vue')
            },
            {
                path: 'entries',
                name: 'AdminEntries',
                component: () => import('../views/admin/AdminEntries.vue')
            },
            {
                path: 'users',
                name: 'AdminUsers',
                component: () => import('../views/admin/AdminUsers.vue')
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
        } else {
            return { top: 0 }
        }
    }
})

// Navigation guard for protected routes
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()

    // Wait for auth initialization if it's still loading
    if (authStore.isLoading) {
        // Wait a bit for init to complete
        await new Promise(resolve => {
            const checkLoading = () => {
                if (!authStore.isLoading) {
                    resolve()
                } else {
                    setTimeout(checkLoading, 50)
                }
            }
            checkLoading()
        })
    }

    // If no user but we have a token, try to init again
    if (!authStore.currentUser && localStorage.getItem('ugmtc_token')) {
        try {
            await authStore.init()
        } catch (e) {
            // Ignore init errors
        }
    }

    // Check if route requires auth
    if (to.meta.requiresAuth && !authStore.isAuthenticated) {
        next({ name: 'Login', query: { redirect: to.fullPath } })
        return
    }

    // Check role-based access
    if (to.meta.role === 'admin' && !authStore.isAdmin) {
        // Non-admin trying to access admin routes
        next({ name: 'DashboardHome' })
        return
    }

    // Redirect logged-in users away from login/register
    if ((to.name === 'Login' || to.name === 'Register') && authStore.isAuthenticated) {
        if (authStore.isAdmin) {
            next({ name: 'AdminHome' })
        } else {
            next({ name: 'DashboardHome' })
        }
        return
    }

    next()
})

export default router
