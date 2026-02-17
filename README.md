# UGMTC - Universitas Gadjah Mada Taekwondo Championship System

Sistem manajemen kejuaraan Taekwondo berbasis web untuk mengelola pendaftaran atlet, drawing, dan penilaian pertandingan.

## 🚀 Tech Stack

### Frontend
- **Framework:** Vue 3 (Vite)
- **State Management:** Pinia
- **Styling:** CSS / Tailwind (jika digunakan)
- **HTTP Client:** Axios / Fetch

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (JSON Web Token)

### DevOps & Tools
- **Containerization:** Docker & Docker Compose
- **Version Control:** Git

## 📋 Prasyarat (Prerequisites)

Pastikan Anda telah menginstal tools berikut di komputer Anda:
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [Docker & Docker Compose](https://www.docker.com/) (Optional, tapi disarankan)
- [PostgreSQL](https://www.postgresql.org/) (Jika menjalankan tanpa Docker)
- [Git](https://git-scm.com/)

## 🛠️ Instalasi & Menjalankan Project

### Opsi 1: Menggunakan Docker (Direkomendasikan)

Cara termudah untuk menjalankan aplikasi adalah menggunakan Docker Compose. Pastikan Docker Desktop sudah berjalan.

1. **Clone repository ini**
   ```bash
   git clone https://github.com/DreamrAllan/ugmtc.git
   cd ugmtc
   ```

2. **Jalankan Docker Compose**
   ```bash
   docker-compose up --build
   ```
   Perintah ini akan membangun image untuk backend dan frontend, serta menjalankan container PostgreSQL.

3. **Akses Aplikasi**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`
   - PostgreSQL: `localhost:5432`

---

### Opsi 2: Menjalankan Secara Manual

Jika Anda ingin menjalankan frontend dan backend secara terpisah tanpa Docker.

#### 1. Setup Backend

1. Masuk ke folder backend:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Konfigurasi Environment Variables:
   - Copy file `.env.example` ke `.env`
   - Sesuaikan konfigurasi database dan lainnya di file `.env`.

4. Setup Database (Prisma):
   ```bash
   npx prisma generate
   npx prisma db push
   # Atau jika menggunakan migration
   # npx prisma migrate dev
   ```

5. Jalankan Backend:
   ```bash
   npm run dev
   ```
   Backend akan berjalan di port `3001` (atau sesuai .env).

#### 2. Setup Frontend

1. Buka terminal baru dan masuk ke folder frontend:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Jalankan Frontend:
   ```bash
   npm run dev
   ```
   Frontend akan berjalan di `http://localhost:5173`.

## 🗂️ Struktur Folder

- `backend/`: Kode sumber API server (Node.js/Express)
  - `src/`: Source code utama (controllers, routes, middlewares)
  - `prisma/`: Schema database dan seeders
- `frontend/`: Kode sumber antarmuka pengguna (Vue.js)
  - `src/`: Components, views, stores
- `docker-compose.yml`: Konfigurasi orkestrasi Docker

## 🔑 Akun Default (Jika ada seeder)

Jika Anda menjalankan `npm run db:seed` di backend, akun default mungkin tersedia (cek `prisma/seed.js`).

## 📝 Catatan Tambahan

- Pastikan port 5432, 3001, dan 5173 tidak digunakan oleh aplikasi lain.
- Untuk deployment, sesuaikan `Dockerfile` dan konfigurasi environment production.