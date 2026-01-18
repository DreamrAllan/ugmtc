<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '../../stores/authStore'
import { useEntryStore } from '../../stores/entryStore'

const authStore = useAuthStore()
const entryStore = useEntryStore()

const user = computed(() => authStore.currentUser)

const myEntries = computed(() => 
    entryStore.getEntriesByUser(user.value?.id)
)

const pendingCount = computed(() => 
    myEntries.value.filter(e => e.status === 'pending').length
)

const approvedCount = computed(() => 
    myEntries.value.filter(e => e.status === 'approved').length
)

const stats = computed(() => [
    { label: 'Total Entry', value: myEntries.value.length },
    { label: 'Menunggu Approval', value: pendingCount.value, status: 'pending' },
    { label: 'Approved', value: approvedCount.value, status: 'approved' }
])

const recentEntries = computed(() => 
    [...myEntries.value].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
    ).slice(0, 5)
)

const getStatusBadge = (status) => {
    switch (status) {
        case 'pending': return { class: 'badge-warning', text: 'Pending' }
        case 'approved': return { class: 'badge-success', text: 'Approved' }
        case 'rejected': return { class: 'badge-error', text: 'Rejected' }
        default: return { class: 'badge-primary', text: status }
    }
}
</script>

<template>
    <div class="dashboard-home">
        <!-- Welcome Section -->
        <div class="welcome-section">
            <h1>Selamat Datang, {{ user?.name }}</h1>
            <p class="welcome-subtitle">Tim <strong>{{ user?.teamName }}</strong> • UGMTC 2026</p>
        </div>

        <!-- Info Banner -->
        <div class="info-banner">
            <div class="banner-content">
                <h3>Entry by Name Dibuka!</h3>
                <p>Daftarkan atlet Anda untuk mendapatkan slot pertandingan.</p>
            </div>
            <RouterLink to="/dashboard/entries" class="btn btn-accent">Entry Atlet</RouterLink>
        </div>

        <!-- Stats Cards -->
        <div class="stats-grid">
            <div 
                v-for="stat in stats" 
                :key="stat.label" 
                class="stat-card card"
                :class="{ 
                    'status-pending': stat.status === 'pending', 
                    'status-approved': stat.status === 'approved' 
                }"
            >
                <p class="stat-value">{{ stat.value }}</p>
                <p class="stat-label">{{ stat.label }}</p>
            </div>
        </div>

        <!-- Team Info & Recent Entries -->
        <div class="overview-grid">
            <!-- Team Info Card -->
            <div class="overview-card card">
                <h3 class="card-title">Informasi Tim</h3>
                <div class="team-info-list">
                    <div class="info-item">
                        <span class="info-label">Nama Tim</span>
                        <span class="info-value">{{ user?.teamName }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Pelatih</span>
                        <span class="info-value">{{ user?.name }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email</span>
                        <span class="info-value">{{ user?.email }}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">No. HP</span>
                        <span class="info-value">{{ user?.phone || '-' }}</span>
                    </div>
                </div>
            </div>

            <!-- Recent Entries -->
            <div class="overview-card card">
                <div class="card-header">
                    <h3 class="card-title">Entry Terbaru</h3>
                    <RouterLink to="/dashboard/entries" class="view-all">Lihat Semua →</RouterLink>
                </div>
                <div v-if="recentEntries.length === 0" class="empty-state">
                    <p>Belum ada entry atlet</p>
                    <RouterLink to="/dashboard/entries" class="btn btn-primary btn-sm">+ Entry Atlet</RouterLink>
                </div>
                <div v-else class="entries-list">
                    <div v-for="entry in recentEntries" :key="entry.id" class="entry-item">
                        <div class="entry-avatar">{{ entry.athlete.fullName?.charAt(0) || 'A' }}</div>
                        <div class="entry-info">
                            <p class="entry-name">{{ entry.athlete.fullName }}</p>
                            <p class="entry-meta">{{ entry.athlete.eventType }} • {{ entry.athlete.category }}</p>
                        </div>
                        <span class="badge" :class="getStatusBadge(entry.status).class">
                            {{ getStatusBadge(entry.status).text }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.dashboard-home {
    max-width: 1200px;
    margin: 0 auto;
}

/* Welcome Section */
.welcome-section {
    margin-bottom: var(--space-6);
}

.welcome-section h1 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-2);
}

.welcome-subtitle {
    color: var(--text-muted);
}

.welcome-subtitle strong {
    color: var(--primary);
}

/* Info Banner */
.info-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-6);
    background: var(--bg-card);
    border: 1px solid var(--primary);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-8);
}

.banner-content h3 {
    margin-bottom: var(--space-1);
    color: var(--primary);
}

.banner-content p {
    color: var(--text-muted);
    font-size: var(--text-sm);
}

/* Stats Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-4);
    margin-bottom: var(--space-8);
}

.stat-card {
    text-align: center;
    padding: var(--space-6);
}

.stat-card.status-pending {
    border-color: var(--warning);
}

.stat-card.status-approved {
    border-color: var(--success);
}

.stat-value {
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--primary);
}

.stat-label {
    font-size: var(--text-sm);
    color: var(--text-muted);
    margin-top: var(--space-1);
}

/* Overview Grid */
.overview-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: var(--space-6);
}

.overview-card {
    padding: var(--space-6);
}

.card-title {
    font-size: var(--text-lg);
    margin-bottom: var(--space-4);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
}

.card-header .card-title {
    margin-bottom: 0;
}

.view-all {
    font-size: var(--text-sm);
    color: var(--primary);
}

/* Team Info */
.team-info-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.info-item {
    display: flex;
    justify-content: space-between;
    padding: var(--space-3);
    background: var(--bg-input);
    border-radius: var(--radius-md);
}

.info-label {
    font-size: var(--text-sm);
    color: var(--text-muted);
}

.info-value {
    font-weight: 500;
    word-break: break-word;
    text-align: right;
}

/* Entries List */
.entries-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.entry-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
    background: var(--bg-input);
    border-radius: var(--radius-md);
}

.entry-avatar {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--primary);
    color: #FFFFFF;
    font-weight: 700;
    border-radius: var(--radius-md);
    font-size: var(--text-sm);
}

.entry-info {
    flex: 1;
}

.entry-name {
    font-weight: 500;
    font-size: var(--text-sm);
}

.entry-meta {
    font-size: var(--text-xs);
    color: var(--text-muted);
}

/* Empty State */
.empty-state {
    text-align: center;
    color: var(--text-muted);
    padding: var(--space-8);
    background: var(--bg-input);
    border-radius: var(--radius-md);
}

.empty-state p {
    margin-bottom: var(--space-4);
}

@media (max-width: 768px) {
    .info-banner {
        flex-direction: column;
        text-align: center;
    }

    .overview-grid {
        grid-template-columns: 1fr;
    }
}
</style>
