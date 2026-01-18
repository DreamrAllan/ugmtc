<script setup>
import { ref, computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useEntryStore } from '../../stores/entryStore'
import { usersApi } from '../../services/api'

const entryStore = useEntryStore()

// State
const loading = ref(true)
const userCount = ref(0)

// Load data on mount
onMounted(async () => {
    try {
        loading.value = true
        // Load entries
        await entryStore.loadEntries()
        
        // Load user count (admin only)
        try {
            const usersData = await usersApi.getAll()
            userCount.value = usersData.users?.filter(u => u.role === 'user').length || 0
        } catch (e) {
            console.log('Could not load users')
        }
    } catch (e) {
        console.error('Failed to load data:', e)
    } finally {
        loading.value = false
    }
})

// All entries stats (across all statuses)
const allEntries = computed(() => entryStore.entries)
const allTeams = computed(() => new Set(allEntries.value.map(e => e.teamName)).size)

const overallStats = computed(() => ({
    totalEntries: allEntries.value.length,
    totalTeams: allTeams.value,
    prestasi: allEntries.value.filter(e => e.category === 'prestasi' || e.ageClass?.includes('Senior')).length,
    festival: allEntries.value.filter(e => e.category === 'festival' || e.ageClass?.includes('Cadet')).length,
    kyorugi: allEntries.value.filter(e => e.category?.toLowerCase().includes('kyorugi')).length,
    poomsae: allEntries.value.filter(e => e.category?.toLowerCase().includes('poomsae')).length,
    pending: entryStore.pendingEntries.length,
    approved: entryStore.approvedEntries.length,
    rejected: entryStore.rejectedEntries.length
}))

const recentPending = computed(() => 
    [...entryStore.pendingEntries]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
)

const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID')
}
</script>

<template>
    <div class="admin-home">
        <div class="page-header">
            <h1>Admin Dashboard</h1>
            <p class="page-subtitle">Kelola pendaftaran UGMTC 2026</p>
        </div>

        <!-- Main Stats -->
        <div class="main-stats">
            <div class="stat-card large">
                <span class="stat-value">{{ overallStats.totalEntries }}</span>
                <span class="stat-label">Total Atlet Terdaftar</span>
            </div>
            <div class="stat-card large">
                <span class="stat-value">{{ overallStats.totalTeams }}</span>
                <span class="stat-label">Tim Entry by Name</span>
            </div>
            <div class="stat-card">
                <span class="stat-value">{{ userCount }}</span>
                <span class="stat-label">User Terdaftar</span>
            </div>
        </div>

        <!-- Event Mode Stats -->
        <div class="mode-stats">
            <div class="mode-card prestasi">
                <div class="mode-header">Prestasi</div>
                <div class="mode-value">{{ overallStats.prestasi }}</div>
                <div class="mode-label">atlet</div>
            </div>
            <div class="mode-card festival">
                <div class="mode-header">Festival</div>
                <div class="mode-value">{{ overallStats.festival }}</div>
                <div class="mode-label">atlet</div>
            </div>
            <div class="mode-card">
                <div class="mode-header">Kyorugi</div>
                <div class="mode-value">{{ overallStats.kyorugi }}</div>
                <div class="mode-label">atlet</div>
            </div>
            <div class="mode-card">
                <div class="mode-header">Poomsae</div>
                <div class="mode-value">{{ overallStats.poomsae }}</div>
                <div class="mode-label">atlet</div>
            </div>
        </div>

        <!-- Status Stats -->
        <div class="status-stats">
            <div class="status-item pending">
                <span class="status-value">{{ overallStats.pending }}</span>
                <span class="status-label">Pending</span>
            </div>
            <div class="status-item approved">
                <span class="status-value">{{ overallStats.approved }}</span>
                <span class="status-label">Approved</span>
            </div>
            <div class="status-item rejected">
                <span class="status-value">{{ overallStats.rejected }}</span>
                <span class="status-label">Rejected</span>
            </div>
        </div>

        <!-- Quick Actions & Recent -->
        <div class="overview-grid">
            <!-- Quick Actions -->
            <div class="overview-card card">
                <h3 class="card-title">Quick Actions</h3>
                <div class="actions-list">
                    <RouterLink to="/admin/entries" class="action-item">
                        <span>Review Entries</span>
                        <span v-if="overallStats.pending" class="action-badge">
                            {{ overallStats.pending }}
                        </span>
                    </RouterLink>
                    <RouterLink to="/admin/users" class="action-item">
                        <span>Kelola Users</span>
                    </RouterLink>
                </div>
            </div>

            <!-- Recent Pending -->
            <div class="overview-card card">
                <div class="card-header">
                    <h3 class="card-title">Entry Pending Terbaru</h3>
                    <RouterLink to="/admin/entries" class="view-all">Lihat Semua →</RouterLink>
                </div>
                <div v-if="loading" class="empty-state">
                    <p>Loading data...</p>
                </div>
                <div v-else-if="recentPending.length === 0" class="empty-state">
                    <p>Tidak ada entry pending</p>
                </div>
                <div v-else class="pending-list">
                    <div v-for="entry in recentPending" :key="entry.id" class="pending-item">
                        <div class="pending-info">
                            <p class="pending-name">{{ entry.athlete?.fullName || 'Unknown' }}</p>
                            <p class="pending-meta">{{ entry.teamName }} • {{ entry.category }}</p>
                        </div>
                        <span class="badge badge-warning">Pending</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.admin-home {
    max-width: 1200px;
    margin: 0 auto;
}

.page-header {
    margin-bottom: var(--space-6);
}

.page-header h1 {
    font-size: var(--text-2xl);
    margin-bottom: var(--space-1);
}

.page-subtitle {
    color: var(--text-muted);
}

/* Main Stats */
.main-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: var(--space-4);
    margin-bottom: var(--space-6);
}

.stat-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--space-6);
    text-align: center;
}

.stat-card.large {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    border: none;
}

.stat-card.large .stat-value {
    color: #FFFFFF;
    font-size: var(--text-4xl);
}

.stat-card.large .stat-label {
    color: rgba(255, 255, 255, 0.8);
}

.stat-value {
    display: block;
    font-size: var(--text-3xl);
    font-weight: 700;
    color: var(--primary);
}

.stat-label {
    font-size: var(--text-sm);
    color: var(--text-muted);
    margin-top: var(--space-1);
}

/* Mode Stats */
.mode-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-3);
    margin-bottom: var(--space-6);
}

.mode-card {
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    padding: var(--space-4);
    text-align: center;
}

.mode-card.prestasi {
    background: rgba(59, 130, 246, 0.1);
    border-color: #3B82F6;
}

.mode-card.prestasi .mode-value {
    color: #3B82F6;
}

.mode-card.festival {
    background: rgba(230, 126, 34, 0.1);
    border-color: var(--accent);
}

.mode-card.festival .mode-value {
    color: var(--accent);
}

.mode-header {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-muted);
    text-transform: uppercase;
    margin-bottom: var(--space-2);
}

.mode-value {
    font-size: var(--text-2xl);
    font-weight: 700;
    color: var(--primary);
}

.mode-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
}

/* Status Stats */
.status-stats {
    display: flex;
    gap: var(--space-4);
    padding: var(--space-4);
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    margin-bottom: var(--space-6);
}

.status-item {
    flex: 1;
    text-align: center;
    padding: var(--space-3);
    border-radius: var(--radius-md);
}

.status-item.pending {
    background: rgba(245, 158, 11, 0.1);
}

.status-item.pending .status-value {
    color: var(--warning);
}

.status-item.approved {
    background: rgba(16, 185, 129, 0.1);
}

.status-item.approved .status-value {
    color: var(--success);
}

.status-item.rejected {
    background: rgba(239, 68, 68, 0.1);
}

.status-item.rejected .status-value {
    color: var(--error);
}

.status-value {
    display: block;
    font-size: var(--text-xl);
    font-weight: 700;
}

.status-label {
    font-size: var(--text-xs);
    color: var(--text-muted);
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
    color: var(--accent);
}

/* Actions List */
.actions-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.action-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-4);
    background: var(--bg-input);
    border-radius: var(--radius-md);
    color: var(--text);
    transition: all var(--transition-fast);
    font-weight: 500;
}

.action-item:hover {
    background: var(--accent);
    color: #FFFFFF;
}

.action-badge {
    background: var(--accent);
    color: #FFFFFF;
    padding: var(--space-1) var(--space-2);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 700;
}

.action-item:hover .action-badge {
    background: #FFFFFF;
    color: var(--accent);
}

/* Pending List */
.pending-list {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
}

.pending-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-3);
    background: var(--bg-input);
    border-radius: var(--radius-md);
}

.pending-name {
    font-weight: 500;
    font-size: var(--text-sm);
}

.pending-meta {
    font-size: var(--text-xs);
    color: var(--text-muted);
}

.empty-state {
    text-align: center;
    color: var(--text-muted);
    padding: var(--space-8);
    background: var(--bg-input);
    border-radius: var(--radius-md);
}

@media (max-width: 768px) {
    .main-stats {
        grid-template-columns: 1fr;
    }
    
    .mode-stats {
        grid-template-columns: repeat(2, 1fr);
    }
    
    .status-stats {
        flex-direction: column;
    }
    
    .overview-grid {
        grid-template-columns: 1fr;
    }
}
</style>
