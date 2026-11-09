# 🧊 CubeStudio 3×3 — Speedcubing Telemetry & Pro Timer

A modern, tournament-grade Speedcubing Telemetry & Training Studio built with **React 18 / TypeScript**, **Vite**, **Tailwind CSS**, **shadcn/ui-inspired primitives** (`lucide-react`), and **Docker**.

---

## ✨ Fitur Unggulan (Key Features)

- ⏱️ **Zero-Latency Decoupled Spacebar Timer**
  - Render 60 FPS menggunakan `requestAnimationFrame` terisolasi pada direct DOM ref.
  - Bebas re-render lag (*0% overhead* pada chart, tabel, dan HUD saat timer berjalan).
  - Status arming: Hold Spasi 0.3s (Merah) ➔ Siap / Ready (Hijau) ➔ Lepas untuk mulai ➔ Sentuh tombol apapun untuk stop.
  - Dukungan sentuhan / *touch gesture* untuk pengguna HP & Tablet.
- 🛑 **WCA 15-Second Inspection Compliance**
  - Hitung mundur 15 detik sesuai aturan turnamen World Cube Association (WCA).
  - Peringatan audio otomatis pada detik ke-8 dan detik ke-12.
  - Deteksi penalti: `+2 detik` jika mulai pada detik 15–17, dan `DNF` jika melebihi 17 detik.
- 📊 **Reactive Performance Telemetry Diagram (Chart.js)**
  - Sinkron serentak dengan filter: saat filter tanggal, nomor record, atau tag diubah, tabel **dan** diagram grafik keduanya langsung ter-update secara reaktif.
  - Menampilkan grafik single time, kurva rata-rata rolling Ao5, dan garis tren regresi linier (*linear progress trendline*).
- 🎲 **WCA Scramble Generator & 2D Canvas Net**
  - Generator acak 20-25 move tanpa gerakan bertabrakan pada sumbu yang sama.
  - Simulasi visual 6-sisi kubus (Putih, Kuning, Hijau, Biru, Oranye, Merah) dirender tajam dengan dukungan *HiDPI Retina canvas*.
- 📋 **Solve Ledger & Smart Filter System**
  - Filter rentang tanggal (*Date from/to*), rentang nomor solve (*Solve # from/to*), tag, status penalti (+2 / DNF / Clean), dan pencarian teks.
  - Pengurutan dinamis: Terbaru, Terlama, Tercepat, Terlambat.
  - Quick Tag & Catatan popover untuk setiap rekaman.
  - Smart time input: Mengetik "12862" otomatis di-parse menjadi `01:28.62` (88.62 detik).
- 💾 **Zero Data Loss & Backward Compatibility**
  - Otomatis memigrasi 16 data solve awal dan data `localStorage` lama (`cubestudio_app_state_v5`).
  - Fitur ekspor data cadangan **JSON** & **CSV** (standar csTimer/WCA) serta impor / restore data.

---

## 🐳 Cara Menjalankan dengan Docker (Full-Stack: DB + Backend + Frontend)

Proyek ini telah dikonfigurasi dengan multi-container orchestration menggunakan **PostgreSQL 16**, **Node.js Express + Prisma ORM**, dan **React Nginx SPA**:

### 1. Menjalankan Seluruh Sistem (Database + Backend API + Frontend)
```bash
docker compose up -d --build
```
- 🌐 **Frontend UI:** 👉 **http://localhost:3000**
- 📡 **Backend REST API:** 👉 **http://localhost:5000** (atau via proxy frontend **http://localhost:3000/api/health**)
- 🐘 **PostgreSQL 16:** `localhost:5435` (Database: `cubestudio_db`, User: `cubestudio`, Password: `cubepassword123`)

### 2. Akun Bawaan (Seeded Users):
- 👑 **Admin Account:** `admin@cubestudio.dev` (Password: `admin123`, Username: `admin`)
- 🧊 **Demo Speedcuber:** `user@cubestudio.dev` (Password: `cuber123`, Username: `micocuber`, Memiliki 16 solves baseline)

### 3. Menghentikan Container
```bash
docker compose down
```
*(Data PostgreSQL tetap aman tersimpan di volume `cubestudio_postgres_data`)*

---

## 💻 Cara Menjalankan Langsung (Local Node / Vite)

Jika ingin menjalankan tanpa Docker:

```bash
# 1. Install dependencies
npm install

# 2. Jalankan development server
npm run dev

# 3. Build untuk produksi
npm run build
```

---

## 🗂️ Struktur Direktori Proyek

```
rubic_3x3_record/
├── Dockerfile                  # Multi-stage production build (Node -> Nginx Alpine)
├── docker-compose.yml          # Konfigurasi dual-environment (Dev: 5173, Prod: 3000)
├── nginx.conf                  # Nginx SPA fallback routing, gzip compression & security headers
├── package.json
├── tailwind.config.js          # Obsidian dark studio theme & WCA 6-color cube palette
├── vite.config.ts
├── public/
│   ├── solves.json             # 16 Baseline record awal
│   └── solves.csv
└── src/
    ├── types/                  # Strong typing (Solve, Penalty, Stats, Filter, Timer)
    ├── lib/
    │   ├── timeUtils.ts        # Smart speedcuber time parser & formatter
    │   ├── statsEngine.ts      # Ao5, Ao12, StdDev, Linear Regression Trendline
    │   ├── rubikEngine.ts      # WCA scramble generator & 2D Canvas simulator
    │   ├── audioSynth.ts       # Web Audio API singleton (inspection alerts & chimes)
    │   └── storageMigration.ts # Backward compatibility loader
    ├── hooks/
    │   ├── useCubeStore.tsx    # Single Source of Truth central state & filtered solves
    │   └── useCubeTimer.ts     # Decoupled 60fps RAF timer & keyboard/touch bindings
    └── components/
        ├── ui/                 # shadcn/ui-inspired primitives (Button, Card, Badge, Dialog, Input)
        ├── layout/             # Header & Footer
        ├── scramble/           # ScrambleBanner & ScrambleNet2D (HiDPI)
        ├── timer/              # TimerDisplay & TimerSettings
        ├── telemetry/          # TelemetryHUD, MilestoneCard, PerformanceChart
        └── ledger/             # LedgerTable, LedgerFilterBar, QuickTagDialog, ManualSolveModal
```

---

## ⌨️ Pintasan Keyboard (Shortcuts)

| Tombol | Fungsi |
|---|---|
| `Space` (Tahan 0.3s) | Mengaktifkan mode siap (*Ready* / Hijau) |
| `Space` (Lepas) | Memulai timer |
| `Tombol Apapun` (Saat Berjalan) | Menghentikan timer dan mencatat waktu |
| `Esc` | Menutup jendela modal aktif |
