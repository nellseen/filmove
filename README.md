# Filmove — Katalog Tautan Postingan Telegram

> **Katalog tautan publik Telegram berbasis web yang bersih, minimalis, dan content-first.**  
> Pengunjung dapat menemukan arsip cuplikan dan film Telegram publik serta membuka langsung postingan aslinya dengan tombol **"Tonton Sekarang"**.  
> **Aplikasi ini tidak mengunduh, menyimpan, mem-proxy, atau me-rehost berkas video.**

---

## 🌟 Fitur Utama

- **Katalog Responsif & Minimalis**: Tata letak grid responsif (1 kolom mobile, 2 kolom tablet, 3 kolom desktop) dengan rasio thumbnail standar 16:9 dan fallback neutral SVG.
- **Tautan Langsung Asli (Watch Now)**: Membuka URL postingan Telegram publik yang valid (`https://t.me/<channel>/<id>`) di tab baru dengan proteksi `target="_blank" rel="noopener noreferrer"`.
- **Ekstraksi Metadata Otomatis**: Backend parser mengekstrak judul, deskripsi, thumbnail, saluran, dan tanggal postingan dari preview embed publik Telegram (`?embed=1`).
- **Cloud Firestore Real-time Sync**: Sinkronisasi data postingan secara instan menggunakan Google Cloud Firestore (`onSnapshot`).
- **Autentikasi Google Admin Terbatas**:
  - Wajib login menggunakan akun Google via Firebase Authentication popup.
  - **Otorisasi Khusus**: Hanya email pemilik terdaftar (`cristiandwihariantoro@gmail.com`) yang memiliki izin sebagai Administrator.
- **Impor Massal (Dual Fallback Engine)**:
  - Mendukung input banyak tautan sekaligus (*Multi-URL Paste*) maupun impor otomatis berdasarkan rentang ID saluran (*Channel ID Range*).
  - Dilengkapi sistem **Dual Fallback**: jika link tertentu timeout atau tidak memiliki thumbnail, sistem otomatis melakukan fallback data dasar tanpa menghentikan proses impor massal, serta menyinkronkan data langsung ke Cloud Firestore.
- **Keamanan Zero-Trust ABAC**: `firestore.rules` memblokir mutasi (create/update/delete) bagi siapa pun selain email admin terverifikasi.

---

## 🚀 Panduan Deploy ke Vercel (Langkah demi Langkah)

Proyek ini telah dikonfigurasi penuh untuk deploy ke **Vercel** sebagai aplikasi Vite SPA dengan serverless API function (`api/index.ts` & `vercel.json`).

### Langkah 1: Push Kode ke Repositori GitHub
Pastikan seluruh perubahan terbaru telah di-push ke repositori GitHub Anda:
```bash
git add .
git commit -m "feat: setup vercel deployment and strict google admin auth"
git push origin main
```

### Langkah 2: Import Proyek di Vercel
1. Buka dashboard [Vercel](https://vercel.com/) dan klik **"Add New..."** → **"Project"**.
2. Pilih repositori **`nellseen/filmove`** dari akun GitHub Anda.
3. Vercel akan otomatis mendeteksi:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Langkah 3: Konfigurasi Environment Variables di Vercel (Opsional)
Jika berkas `firebase-applet-config.json` disertakan dalam repositori, aplikasi akan langsung berjalan. Namun, jika Anda ingin menyetelnya melalui Dashboard Vercel (**Project Settings** → **Environment Variables**), tambahkan variabel berikut:

| Nama Variabel | Nilai Contoh |
|---|---|
| `VITE_FIREBASE_PROJECT_ID` | `starlit-perception-qsjh2` |
| `VITE_FIREBASE_APP_ID` | `1:495988525205:web:180643f22824572978339c` |
| `VITE_FIREBASE_API_KEY` | `AIzaSyAPGJfijykVR0Nd0iKVOin5bt6353deMcI` |
| `VITE_FIREBASE_AUTH_DOMAIN` | `starlit-perception-qsjh2.firebaseapp.com` |
| `VITE_FIREBASE_DATABASE_ID` | `ai-studio-filmove-1df3a1c1-0391-4219-808b-5e15d744b9fa` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `starlit-perception-qsjh2.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `495988525205` |

### Langkah 4: Tambahkan Domain Vercel ke Firebase Console (PENTING!)
Agar popup **Masuk dengan Google** berfungsi tanpa kendala di Vercel:
1. Buka [Firebase Console](https://console.firebase.google.com/).
2. Pilih proyek Anda: `starlit-perception-qsjh2`.
3. Buka menu **Build** → **Authentication** → tab **Settings**.
4. Klik **Authorized domains** → **Add domain**.
5. Masukkan domain Vercel Anda (misalnya: `filmove.vercel.app` atau `*.vercel.app`).
6. Klik **Save**.

### Langkah 5: Selesai!
Klik tombol **"Deploy"** di Vercel. Aplikasi Anda akan langsung aktif dengan frontend Vite berkecepatan tinggi dan API serverless Telegram preview yang siap pakai.

---

## 💻 Menjalankan Secara Lokal

### Prasyarat
- Node.js versi 20 atau 22
- NPM

### Instalasi & Menjalankan Dev Server
```bash
# 1. Pasang dependensi
npm install

# 2. Jalankan server lokal (Express + Vite pada port 3000)
npm run dev
```

Buka peramban Anda di `http://localhost:3000`.

### Type Check & Build Produksi
```bash
# Validasi tipe TypeScript
npm run lint

# Build aset frontend ke folder dist/
npm run build
```

---

## 📁 Struktur Berkas Proyek

```text
filmove/
├── api/
│   └── index.ts                 # Serverless function entry point untuk Vercel
├── src/
│   ├── components/
│   │   ├── layout/              # AppHeader & AdminSidebar
│   │   ├── posts/               # PostCard, PostGrid, MetadataPreview, PostDetailModal
│   │   └── ui/                  # Button, Input, Dialog, ConfirmDialog, Toast, dll.
│   ├── lib/
│   │   ├── firebase.ts          # Inisialisasi Firebase Auth & Firestore
│   │   └── firestoreErrors.ts   # Handler error berstandar Zero-Trust
│   ├── services/
│   │   └── postService.ts       # Service CRUD Firestore & Google Auth
│   ├── types/
│   │   └── post.ts              # Interface TypeScript untuk Postingan & Metadata
│   ├── apiApp.ts                # Router Express REST API (/api/v1/...)
│   ├── App.tsx                  # Komponen utama katalog & panel admin
│   ├── main.tsx                 # Entrypoint React 18
│   └── index.css                # Tailwind CSS v4 & custom tokens
├── firebase-applet-config.json  # Kredensial Firebase client
├── firebase-blueprint.json      # Definisi intermediate representation schema
├── firestore.rules              # Aturan keamanan database Cloud Firestore
├── vercel.json                  # Konfigurasi routing & rewrites Vercel
├── server.ts                    # Server Node.js untuk development lokal
├── package.json
└── README.md
```

---

## 🛡️ Kebijakan Keamanan (Security Rules)

Aturan database Firestore telah dikunci secara default:
- **Pengunjung Publik**: Hanya diizinkan membaca (`get` dan `list`) dokumen dengan status `status == 'published'`.
- **Administrator**: Hanya akun Google yang terverifikasi dengan email **`cristiandwihariantoro@gmail.com`** yang dapat membuat, mengubah status, mengedit, atau menghapus postingan.
- **Payload Validation**: Panjang judul dibatasi maks 200 karakter, URL harus berupa tautan publik Telegram yang valid (`t.me/<channel>/<id>`).

---

## 📄 Lisensi
Dilisensikan di bawah [MIT License](LICENSE).
