<script setup>
import { ref, computed } from 'vue'
import { useRouter, RouterView, RouterLink } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import { useThemeStore } from '../stores/themeStore'

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()

const sidebarCollapsed = ref(false)
const mobileMenuOpen = ref(false)

const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Profil Tim', path: '/dashboard/team' },
    { name: 'Entry Atlet', path: '/dashboard/entries' },
    { name: 'Pengaturan', path: '/dashboard/settings' }
]

const currentRoute = computed(() => router.currentRoute.value.path)

const handleLogout = () => {
    authStore.logout()
    router.push('/login')
}

const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleMobileMenu = () => {
    mobileMenuOpen.value = !mobileMenuOpen.value
}
</script>

<template>
    <div class="dashboard-layout" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
        <!-- Mobile Header -->
        <header class="mobile-header">
            <button class="mobile-menu-btn" @click="toggleMobileMenu">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <div class="mobile-logo">
                <span class="logo-text">UGMTC</span>
            </div>
            <button class="theme-toggle" @click="themeStore.toggleTheme">
                {{ themeStore.isDark ? '☀️' : '🌙' }}
            </button>
        </header>

        <!-- Sidebar -->
        <aside class="sidebar" :class="{ 'mobile-open': mobileMenuOpen }">
            <div class="sidebar-overlay" @click="mobileMenuOpen = false"></div>
            
            <div class="sidebar-content">
                <div class="sidebar-header">
                    <RouterLink to="/" class="logo">
                        <span class="logo-text">UGMTC</span>
                        <span class="logo-year" v-if="!sidebarCollapsed">2026</span>
                    </RouterLink>
                    <button class="theme-toggle" @click="themeStore.toggleTheme" v-if="!sidebarCollapsed">
                        {{ themeStore.isDark ? '☀️' : '🌙' }}
                    </button>
                </div>

                <nav class="sidebar-nav">
                    <RouterLink 
                        v-for="item in menuItems" 
                        :key="item.path"
                        :to="item.path"
                        class="nav-item"
                        :class="{ active: currentRoute === item.path }"
                        @click="mobileMenuOpen = false"
                    >
                        <span class="nav-text">{{ item.name }}</span>
                    </RouterLink>
                </nav>

                <div class="sidebar-footer">
                    <div class="user-info" v-if="!sidebarCollapsed">
                        <div class="user-avatar">
                            {{ authStore.currentUser?.name?.charAt(0) || 'U' }}
                        </div>
                        <div class="user-details">
                            <p class="user-name">{{ authStore.currentUser?.name || 'User' }}</p>
                            <p class="user-team">{{ authStore.currentUser?.teamName || 'Team' }}</p>
                        </div>
                    </div>
                    <button class="logout-btn" @click="handleLogout">
                        <span class="logout-text" v-if="!sidebarCollapsed">Keluar</span>
                        <span v-else>×</span>
                    </button>
                </div>
            </div>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <RouterView />
        </main>
    </div>
</template>

<style scoped>
.dashboard-layout {
    display: flex;
    min-height: 100vh;
    background: var(--bg-body);
}

/* Sidebar */
.sidebar {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 240px;
    background: var(--bg-sidebar);
    border-right: 1px solid var(--border-color);
    z-index: 100;
    transition: width var(--transition-normal);
}

.sidebar-collapsed .sidebar {
    width: 70px;
}

.sidebar-content {
    display: flex;
    flex-direction: column;
    height: 100%;
    padding: var(--space-4);
}

.sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: var(--space-6);
    border-bottom: 1px solid var(--border-color);
    margin-bottom: var(--space-4);
}

.logo {
    display: flex;
    align-items: baseline;
    gap: var(--space-1);
}

.logo-text {
    font-size: var(--text-xl);
    font-weight: 800;
    color: var(--primary);
}

.logo-year {
    font-size: var(--text-sm);
    color: var(--text-muted);
}

/* Navigation */
.sidebar-nav {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
}

.nav-item {
    display: flex;
    align-items: center;
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    transition: all var(--transition-fast);
    font-weight: 500;
}

.nav-item:hover {
    background: var(--bg-input);
    color: var(--text);
}

.nav-item.active {
    background: var(--primary);
    color: #FFFFFF;
}

.sidebar-collapsed .nav-item {
    justify-content: center;
    padding: var(--space-3);
}

/* Sidebar Footer */
.sidebar-footer {
    padding-top: var(--space-4);
    border-top: 1px solid var(--border-color);
}

.user-info {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    margin-bottom: var(--space-4);
}

.user-avatar {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    color: #FFFFFF;
    font-weight: 700;
    border-radius: var(--radius-md);
}

.user-details {
    flex: 1;
    min-width: 0;
}

.user-name {
    font-weight: 600;
    font-size: var(--text-sm);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.user-team {
    font-size: var(--text-xs);
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: var(--space-3);
    background: transparent;
    border: 1px solid var(--error);
    border-radius: var(--radius-md);
    color: var(--error);
    cursor: pointer;
    transition: all var(--transition-fast);
    font-weight: 500;
}

.logout-btn:hover {
    background: var(--error);
    color: #FFFFFF;
}

/* Main Content */
.main-content {
    flex: 1;
    margin-left: 240px;
    padding: var(--space-6);
    transition: margin-left var(--transition-normal);
}

.sidebar-collapsed .main-content {
    margin-left: 70px;
}

/* Mobile */
.mobile-header {
    display: none;
}

.sidebar-overlay {
    display: none;
}

@media (max-width: 768px) {
    .mobile-header {
        display: flex;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: var(--bg-sidebar);
        border-bottom: 1px solid var(--border-color);
        align-items: center;
        justify-content: space-between;
        padding: 0 var(--space-4);
        z-index: 90;
    }

    .mobile-menu-btn {
        display: flex;
        flex-direction: column;
        gap: 5px;
        background: none;
        border: none;
        padding: var(--space-2);
        cursor: pointer;
    }

    .mobile-menu-btn span {
        width: 24px;
        height: 2px;
        background: var(--text);
        border-radius: 2px;
    }

    .mobile-logo .logo-text {
        font-size: var(--text-lg);
        font-weight: 800;
        color: var(--primary);
    }

    .sidebar {
        transform: translateX(-100%);
        width: 280px;
        z-index: 100;
    }

    .sidebar.mobile-open {
        transform: translateX(0);
    }

    .sidebar-overlay {
        display: none;
    }

    .sidebar.mobile-open .sidebar-overlay {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.5);
        z-index: -1;
    }

    .sidebar-content {
        position: relative;
        z-index: 1;
        background: var(--bg-sidebar);
        height: 100%;
    }

    .main-content {
        margin-left: 0;
        margin-top: 60px;
        padding: var(--space-4);
    }

    .sidebar-collapsed .main-content {
        margin-left: 0;
    }
}
</style>
