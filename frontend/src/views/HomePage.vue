 <script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'

// Countdown logic
const eventDate = new Date('2026-09-25T08:00:00')
const countdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })

let timer = null

const updateCountdown = () => {
  const now = new Date()
  const diff = eventDate - now
  
  if (diff > 0) {
    countdown.value = {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000)
    }
  }
}

onMounted(() => {
  updateCountdown()
  timer = setInterval(updateCountdown, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

// Timeline data
const timeline = [
  { date: '1 Juli 2026', title: 'Pendaftaran Dibuka', status: 'upcoming' },
  { date: '18 Sep 2026', title: 'Batas Pendaftaran', status: 'upcoming' },
  { date: '20 Sep 2026', title: 'Technical Meeting', status: 'upcoming' },
  { date: '25-27 Sep 2026', title: 'Pelaksanaan UGMTC', status: 'upcoming' }
]

// Categories with SVG icon names
const categories = [
  { name: 'Kyorugi', desc: 'Pertandingan sparring', iconType: 'swords' },
  { name: 'Poomsae Individual', desc: 'Jurus perorangan', iconType: 'user' },
  { name: 'Poomsae Pair', desc: 'Jurus berpasangan', iconType: 'users' },
  { name: 'Poomsae Team', desc: 'Jurus beregu', iconType: 'team' }
]

// Age groups
const ageGroups = ['Pra-Cadet', 'Cadet', 'Junior', 'Senior']
</script>

<template>
  <div class="home">
    <!-- Navbar -->
    <nav class="navbar">
      <div class="container navbar-content">
        <div class="logo">
          <svg class="logo-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
          </svg>
          <span class="logo-text">UGMTC <span class="year">2026</span></span>
        </div>
        <div class="nav-links">
          <a href="#about">Tentang</a>
          <a href="#timeline">Timeline</a>
          <a href="#categories">Kategori</a>
          <a href="#pricing">Biaya</a>
          <RouterLink to="/register" class="btn btn-primary">Daftar</RouterLink>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="container hero-content">
        <div class="badge badge-gold">UGM TAEKWONDO CHAMPIONSHIP</div>
        <h1 class="hero-title">UGMTC <span class="gold">2026</span></h1>
        <p class="hero-subtitle">Kompetisi Taekwondo Terbesar di Yogyakarta</p>
        
        <div class="hero-info">
          <div class="info-item">
            <svg class="info-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>25-27 September 2026</span>
          </div>
          <div class="info-item">
            <svg class="info-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <span>GOR Pancasila UGM</span>
          </div>
        </div>

        <!-- Countdown -->
        <div class="countdown">
          <div class="countdown-item">
            <span class="countdown-value">{{ countdown.days }}</span>
            <span class="countdown-label">Hari</span>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-item">
            <span class="countdown-value">{{ countdown.hours }}</span>
            <span class="countdown-label">Jam</span>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-item">
            <span class="countdown-value">{{ countdown.minutes }}</span>
            <span class="countdown-label">Menit</span>
          </div>
          <div class="countdown-separator">:</div>
          <div class="countdown-item">
            <span class="countdown-value">{{ countdown.seconds }}</span>
            <span class="countdown-label">Detik</span>
          </div>
        </div>

        <div class="hero-actions">
          <RouterLink to="/register" class="btn btn-primary btn-lg">Daftar Sekarang</RouterLink>
          <a href="#about" class="btn btn-secondary btn-lg">Pelajari Lebih Lanjut</a>
        </div>
      </div>
    </section>

    <!-- About Section -->
    <section id="about" class="section about">
      <div class="container">
        <h2 class="section-title">Tentang <span class="gold">UGMTC</span></h2>
        <p class="section-desc">
          UGM Taekwondo Championship adalah kompetisi taekwondo tahunan yang diselenggarakan 
          oleh Unit Kegiatan Mahasiswa Taekwondo Universitas Gadjah Mada. Ajang ini mempertemukan 
          atlet-atlet terbaik dari berbagai dojang di seluruh Indonesia.
        </p>
        
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">500+</span>
            <span class="stat-label">Atlet</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">100+</span>
            <span class="stat-label">Tim</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">8</span>
            <span class="stat-label">Court</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">3</span>
            <span class="stat-label">Hari</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Timeline Section -->
    <section id="timeline" class="section timeline-section">
      <div class="container">
        <h2 class="section-title">Timeline <span class="gold">Event</span></h2>
        
        <div class="timeline">
          <div 
            v-for="(item, index) in timeline" 
            :key="index" 
            class="timeline-item"
          >
            <div class="timeline-marker"></div>
            <div class="timeline-content">
              <span class="timeline-date">{{ item.date }}</span>
              <h4 class="timeline-title">{{ item.title }}</h4>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Categories Section -->
    <section id="categories" class="section categories-section">
      <div class="container">
        <h2 class="section-title">Kategori <span class="gold">Pertandingan</span></h2>
        
        <div class="categories-grid">
          <div v-for="cat in categories" :key="cat.name" class="category-card card">
            <div class="category-icon">
              <!-- Swords icon -->
              <svg v-if="cat.iconType === 'swords'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14.5 17.5L3 6V3h3l11.5 11.5"/>
                <path d="M13 19l6-6"/>
                <path d="M16 16l4 4"/>
                <path d="M19 21l2-2"/>
                <path d="M9.5 6.5L21 18v3h-3L6.5 9.5"/>
                <path d="M11 5l-6 6"/>
                <path d="M8 8L4 4"/>
                <path d="M5 3L3 5"/>
              </svg>
              <!-- User icon -->
              <svg v-else-if="cat.iconType === 'user'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              <!-- Users icon -->
              <svg v-else-if="cat.iconType === 'users'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              <!-- Team icon -->
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                <circle cx="12" cy="12" r="2"/>
              </svg>
            </div>
            <h3 class="category-name">{{ cat.name }}</h3>
            <p class="category-desc">{{ cat.desc }}</p>
          </div>
        </div>

        <div class="age-groups">
          <h3 class="age-title">Kelompok Umur</h3>
          <div class="age-badges">
            <span v-for="age in ageGroups" :key="age" class="badge badge-gold">{{ age }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Pricing Section -->
    <section id="pricing" class="section pricing-section">
      <div class="container">
        <h2 class="section-title">Biaya <span class="gold">Pendaftaran</span></h2>
        
        <div class="pricing-grid">
          <div class="pricing-card card">
            <div class="pricing-header">
              <h3>Biaya Tim</h3>
              <div class="price">
                <span class="currency">Rp</span>
                <span class="amount">100.000</span>
              </div>
            </div>
            <ul class="pricing-features">
              <li>✓ Registrasi 1 Tim</li>
              <li>✓ Akses Dashboard</li>
              <li>✓ Kelola Data Atlet</li>
            </ul>
          </div>
          
          <div class="pricing-card card featured">
            <div class="pricing-header">
              <h3>Biaya Atlet</h3>
              <div class="price">
                <span class="currency">Rp</span>
                <span class="amount">500.000</span>
              </div>
              <span class="price-note">per atlet</span>
            </div>
            <ul class="pricing-features">
              <li>✓ Daftar 1 Kategori</li>
              <li>✓ Sertifikat Peserta</li>
              <li>✓ Medali & Piala</li>
              <li>✓ Dapat Ikut Multi Kategori</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="section cta-section">
      <div class="container text-center">
        <h2 class="cta-title">Siap Bertanding?</h2>
        <p class="cta-desc">Daftarkan tim dan atlet kamu sekarang!</p>
        <RouterLink to="/register" class="btn btn-primary btn-lg">Daftar Sekarang</RouterLink>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container">
        <div class="footer-content">
        <div class="footer-brand">
            <svg class="logo-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
            <span class="logo-text">UGMTC 2026</span>
          </div>
          <div class="footer-links">
            <RouterLink to="/data">Data Pendaftaran</RouterLink>
            <RouterLink to="/live">Live Match</RouterLink>
          </div>
          <div class="footer-contact">
            <p>© 2026 UGM Taekwondo Championship</p>
            <p>GOR Pancasila, Universitas Gadjah Mada</p>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* Navbar */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: var(--bg-card);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border-color);
  box-shadow: var(--shadow-sm);
}

.navbar-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-4) var(--space-4);
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.logo-icon {
  font-size: var(--text-2xl);
}

.logo-icon-svg {
  width: 28px;
  height: 28px;
  stroke: var(--primary);
  flex-shrink: 0;
}

.logo-text {
  font-size: var(--text-xl);
  font-weight: 700;
}

.logo-text .year {
  color: var(--primary);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-6);
}

.nav-links a {
  color: var(--text-muted);
  font-weight: 500;
  transition: color var(--transition-fast);
}

.nav-links a:hover {
  color: var(--text);
}

/* Hero */
.hero {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  padding-top: 80px;
  overflow: hidden;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at top, rgba(212, 175, 55, 0.1) 0%, transparent 50%);
}

.hero-content {
  text-align: center;
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: var(--text-6xl);
  font-weight: 800;
  margin: var(--space-4) 0;
  letter-spacing: -0.02em;
}

.gold {
  color: var(--primary);
}

.hero-subtitle {
  font-size: var(--text-xl);
  color: var(--text-muted);
  margin-bottom: var(--space-6);
}

.hero-info {
  display: flex;
  justify-content: center;
  gap: var(--space-8);
  margin-bottom: var(--space-8);
}

.info-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
}

.info-icon {
  font-size: var(--text-xl);
}

.info-icon-svg {
  width: 22px;
  height: 22px;
  stroke: var(--primary);
  flex-shrink: 0;
}

/* Countdown */
.countdown {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: var(--bg-card);
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
  min-width: 80px;
}

.countdown-value {
  font-size: var(--text-3xl);
  font-weight: 700;
  color: var(--primary);
}

.countdown-label {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.countdown-separator {
  font-size: var(--text-2xl);
  color: var(--text-muted);
}

.hero-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
}

/* Section styling */
.section-title {
  font-size: var(--text-3xl);
  font-weight: 700;
  text-align: center;
  margin-bottom: var(--space-8);
}

.section-desc {
  text-align: center;
  color: var(--text-muted);
  max-width: 700px;
  margin: 0 auto var(--space-8);
  line-height: 1.8;
}

/* Stats */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
}

.stat-card {
  background: var(--bg-card);
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  text-align: center;
}

.stat-value {
  display: block;
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  color: var(--text-muted);
}

/* Timeline */
.timeline-section {
  background: var(--bg-card);
}

.timeline {
  max-width: 600px;
  margin: 0 auto;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 15px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: var(--primary);
  opacity: 0.3;
}

.timeline-item {
  display: flex;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
  position: relative;
}

.timeline-marker {
  width: 32px;
  height: 32px;
  background: var(--primary);
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.timeline-content {
  background: var(--bg-body);
  border: 1px solid var(--border-color);
  padding: var(--space-4) var(--space-6);
  border-radius: var(--radius-lg);
  flex: 1;
}

.timeline-date {
  font-size: var(--text-sm);
  color: var(--primary);
  font-weight: 600;
}

.timeline-title {
  margin-top: var(--space-1);
}

/* Categories */
.categories-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.category-card {
  text-align: center;
}

.category-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  margin: 0 auto var(--space-4);
  background: linear-gradient(135deg, var(--primary-light) 0%, var(--primary) 100%);
  border-radius: var(--radius-lg);
  transition: all 0.3s ease;
}

.category-icon svg {
  width: 32px;
  height: 32px;
  stroke: #FFFFFF;
  stroke-width: 1.5;
}

.category-card:hover .category-icon {
  transform: scale(1.1) rotate(5deg);
  box-shadow: 0 8px 20px rgba(45, 106, 122, 0.3);
}

.category-name {
  font-size: var(--text-lg);
  margin-bottom: var(--space-2);
}

.category-desc {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.age-groups {
  text-align: center;
}

.age-title {
  margin-bottom: var(--space-4);
  color: var(--text-muted);
}

.age-badges {
  display: flex;
  justify-content: center;
  gap: var(--space-3);
  flex-wrap: wrap;
}

/* Pricing */
.pricing-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-6);
  max-width: 800px;
  margin: 0 auto;
}

.pricing-card {
  text-align: center;
}

.pricing-card.featured {
  border: 2px solid var(--primary);
  box-shadow: var(--shadow-glow);
}

.pricing-header h3 {
  font-size: var(--text-lg);
  color: var(--text-muted);
  margin-bottom: var(--space-4);
}

.price {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: var(--space-1);
}

.currency {
  font-size: var(--text-xl);
  color: var(--text-muted);
}

.amount {
  font-size: var(--text-4xl);
  font-weight: 700;
  color: var(--primary);
}

.price-note {
  font-size: var(--text-sm);
  color: var(--text-muted);
}

.pricing-features {
  list-style: none;
  margin-top: var(--space-6);
  text-align: left;
}

.pricing-features li {
  padding: var(--space-2) 0;
  color: var(--text-muted);
  border-bottom: 1px solid var(--border-color);
}

/* CTA */
.cta-section {
  background: linear-gradient(135deg, rgba(212, 175, 55, 0.1) 0%, transparent 100%);
}

.cta-title {
  font-size: var(--text-4xl);
  margin-bottom: var(--space-4);
}

.cta-desc {
  color: var(--text-muted);
  margin-bottom: var(--space-6);
}

/* Footer */
.footer {
  background: var(--bg-card);
  padding: var(--space-8) 0;
  border-top: 1px solid var(--border-color);
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.footer-links {
  display: flex;
  gap: var(--space-6);
}

.footer-links a {
  color: var(--text-muted);
}

.footer-contact {
  text-align: right;
  color: var(--text-muted);
  font-size: var(--text-sm);
}

/* Responsive */
@media (max-width: 768px) {
  .nav-links {
    display: none;
  }
  
  .hero-title {
    font-size: var(--text-4xl);
  }
  
  .hero-info {
    flex-direction: column;
    gap: var(--space-4);
  }
  
  .countdown {
    flex-wrap: wrap;
  }
  
  .countdown-item {
    min-width: 60px;
    padding: var(--space-3) var(--space-4);
  }
  
  .hero-actions {
    flex-direction: column;
  }
  
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .categories-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .pricing-grid {
    grid-template-columns: 1fr;
  }
  
  .footer-content {
    flex-direction: column;
    gap: var(--space-6);
    text-align: center;
  }
  
  .footer-contact {
    text-align: center;
  }
}
</style>
