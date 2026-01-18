<script setup>
import { ref, computed, onMounted } from 'vue'
import { usersApi } from '../../services/api'

// State
const loading = ref(true)
const error = ref('')
const users = ref([])
const searchQuery = ref('')

// Load users on mount
onMounted(async () => {
    try {
        loading.value = true
        const response = await usersApi.getAll()
        users.value = response.users || []
    } catch (e) {
        error.value = e.message
    } finally {
        loading.value = false
    }
})

const filteredUsers = computed(() => {
    if (!searchQuery.value) return users.value
    const query = searchQuery.value.toLowerCase()
    return users.value.filter(u => 
        u.name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.teamName?.toLowerCase().includes(query)
    )
})

const promoteUser = async (userId) => {
    if (confirm('Promosikan user ini ke admin?')) {
        try {
            await usersApi.updateRole(userId, 'admin')
            const index = users.value.findIndex(u => u.id === userId)
            if (index !== -1) {
                users.value[index].role = 'admin'
            }
        } catch (e) {
            error.value = e.message
        }
    }
}

const demoteUser = async (userId) => {
    if (confirm('Turunkan admin ini ke user biasa?')) {
        try {
            await usersApi.updateRole(userId, 'user')
            const index = users.value.findIndex(u => u.id === userId)
            if (index !== -1) {
                users.value[index].role = 'user'
            }
        } catch (e) {
            error.value = e.message
        }
    }
}

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID')
}
</script>

<template>
    <div class="admin-users">
        <div class="page-header">
            <div>
                <h1>Kelola Users</h1>
                <p class="page-subtitle">Manage user accounts dan admin privileges</p>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="loading-state">
            <p>Loading users...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="alert alert-error">
            {{ error }}
        </div>

        <template v-else>
            <!-- Search -->
            <div class="search-box">
                <input 
                    v-model="searchQuery" 
                    type="text" 
                    class="form-input" 
                    placeholder="Cari user..."
                >
            </div>

        <!-- Users List -->
        <div class="users-list">
            <div v-for="user in filteredUsers" :key="user.id" class="user-card card">
                <div class="user-header">
                    <div class="user-avatar" :class="{ admin: user.role === 'admin' }">
                        {{ user.name?.charAt(0) || 'U' }}
                    </div>
                    <div class="user-info">
                        <h4>{{ user.name }}</h4>
                        <p class="user-email">{{ user.email }}</p>
                    </div>
                    <span class="badge" :class="user.role === 'admin' ? 'badge-accent' : 'badge-primary'">
                        {{ user.role === 'admin' ? 'Admin' : 'User' }}
                    </span>
                </div>

                <div class="user-details">
                    <div class="detail-item">
                        <span class="label">Tim</span>
                        <span class="value">{{ user.teamName || '-' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Phone</span>
                        <span class="value">{{ user.phone || '-' }}</span>
                    </div>
                    <div class="detail-item">
                        <span class="label">Terdaftar</span>
                        <span class="value">{{ formatDate(user.createdAt) }}</span>
                </div>
            </div>

                <div class="user-actions" v-if="user.email !== 'admin@ugmtc.com'">
                    <button 
                        v-if="user.role === 'user'"
                        @click="promoteUser(user.id)" 
                        class="btn btn-accent btn-sm"
                    >
                        Promote to Admin
                    </button>
                    <button 
                        v-else-if="user.role === 'admin'"
                        @click="demoteUser(user.id)" 
                        class="btn btn-secondary btn-sm"
                    >
                        Demote to User
                    </button>
                </div>
                <div v-else class="default-admin-note">
                    <span>Default Admin (tidak bisa diubah)</span>
                </div>
            </div>
        </div>
        </template>
    </div>
</template>

<style scoped>
.admin-users {
    max-width: 1200px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: var(--space-6);
}

.page-header h1 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-2);
}

.page-subtitle {
    color: var(--text-muted);
}

.search-box {
    margin-bottom: var(--space-6);
}

.search-box .form-input {
    max-width: 400px;
}

.users-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: var(--space-4);
}

.user-card {
    padding: var(--space-6);
}

.user-header {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    margin-bottom: var(--space-4);
}

.user-avatar {
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: var(--text);
    font-weight: 700;
    font-size: var(--text-xl);
    border-radius: var(--radius-lg);
}

.user-avatar.admin {
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%);
    color: var(--bg-dark);
}

.user-info {
    flex: 1;
}

.user-info h4 {
    margin-bottom: var(--space-1);
}

.user-email {
    font-size: var(--text-sm);
    color: var(--text-muted);
}

.user-details {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--bg-input);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-4);
}

.detail-item {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
}

.detail-item .label {
    font-size: var(--text-xs);
    color: var(--text-muted);
}

.detail-item .value {
    font-weight: 500;
    font-size: var(--text-sm);
}

.user-actions {
    padding-top: var(--space-4);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.default-admin-note {
    padding-top: var(--space-4);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
    text-align: center;
    color: var(--text-muted);
    font-size: var(--text-sm);
}

@media (max-width: 600px) {
    .users-list {
        grid-template-columns: 1fr;
    }
    
    .user-details {
        grid-template-columns: 1fr;
    }
}
</style>
