# Product Requirements Document (PRD) - Versi 1.0
**Nama Proyek:** Aplikasi Pencatatan Bisnis Internet (ISP Billing Simple)  
**Versi Dokumen:** 1.0 (Final MVP Specification)  
**Fokus Utama:** Simpel Inputan & Visibilitas Laporan Bisnis Menyeluruh  

---

## 1. Tujuan & Latar Belakang Produk
Pengelola bisnis internet skala kecil hingga menengah (RT/RW Net dan ISP Lokal) membutuhkan sistem pencatatan pelanggan dan penagihan yang cepat tanpa harus melewati alur menu yang berbelit-belit. 

**PRD v1.0** ini menetapkan standar pengembangan produk tahap pertama (MVP) yang menggabungkan:
1. **Kecepatan Operasional (Simpel Inputan):** Memangkas waktu administrasi kasir/operator hingga di bawah 10 detik per transaksi.
2. **Keputusan Berbasis Data (Laporan Menyeluruh):** Menyajikan *ringkasan kesehatan bisnis* (finansial dan beban infrastruktur dasar) dalam satu layar antarmuka bergaya *Admin Dashboard* modern (referensi visual: Mikhmon v4 / AdminLTE).

---

## 2. Target Pengguna (User Persona)
1. **Pemilik Usaha (Owner):** Fokus memantau grafik pemasukan bulanan, rasio pelanggan aktif vs menunggak, proyeksi *cashflow*, dan beban *server/router* secara sekilas dari *smartphone* atau laptop.
2. **Admin / Kasir Operasional:** Fokus pada input pendaftaran pelanggan baru dan pencatatan pembayaran tagihan (kasir) dengan *zero-friction* (minim pengetikan manual).

---

## 3. Spesifikasi Fitur Utama (Functional Requirements)

### 3.1. Modul Dashboard & Laporan Keseluruhan Bisnis (Main View)
Halaman pertama yang dilihat pengguna saat masuk aplikasi, dirancang untuk menjawab kondisi bisnis saat ini secara instan:
* **Top KPI Highlight Cards (3 Kartu Utama):**
  * **Pelanggan Aktif (Warna Merah/Kontras):** Jumlah pelanggan yang berstatus aktif vs total pelanggan terdaftar (contoh: `142 / 150 User`).
  * **Tagihan Tertunda / Jatuh Tempo (Warna Kuning):** Jumlah pelanggan yang belum membayar di bulan berjalan beserta nominal potensinya (contoh: `8 Pelanggan - Rp 1.200.000`).
  * **Pendapatan Bulan Ini (Warna Hijau Tosca):** Total uang masuk bersih pada bulan berjalan dibandingkan dengan target/estimasi maksimal (contoh: `Rp 21.500.000`).
* **Grafik & Monitoring Visual (Tengah):**
  * **Grafik Pendapatan & Pertumbuhan (Chart.js):** Pilihan tab *view* antara grafik tren pendapatan 6 bulan terakhir atau *real-time traffic monitor* (Tx/Rx) antarmuka utama.
  * **Status Resource Sistem:** *Progress bar* ringkas untuk memantau kesehatan server lokal/router (CPU, RAM, Storage, dan Uptime).
* **Tabel Aktivitas & Log Pembayaran Terbaru (Bawah):**
  * Menampilkan 10 transaksi atau kejadian terakhir secara *real-time* (Waktu, Nama/IP Pelanggan, Keterangan Paket, dan *Badge* Status Lunas/Menunggu).

### 3.2. Modul Manajemen Pelanggan (Simpel Input)
Formulir tambah/edit pelanggan yang muncul sebagai *Modal Pop-up* (tanpa pindah halaman) dengan maksimal **5 kolom inputan**:
1. **Nama Lengkap Pelanggan** *(Teks - Wajib)*
2. **Nomor WhatsApp** *(Angka - Wajib, otomatis diformat ke `628xxx` untuk integrasi klik-kirim struk)*
3. **Pilihan Paket & Harga** *(Dropdown - Wajib, misal: "Paket 10 Mbps - Rp 150.000", "Paket 20 Mbps - Rp 250.000", ditambah opsi centang Add-on jika ada)*
4. **IP Address / ID PPPoE / Lokasi** *(Teks - Opsional, untuk identifikasi teknis)*
5. **Tanggal Jatuh Tempo** *(Angka 1 s/d 28 - Default terisi otomatis sesuai tanggal hari pendaftaran)*

### 3.3. Modul Kasir / Pencatatan Tagihan (1-Click Billing)
Dirancang agar operator tidak perlu mengetik nominal uang atau mencari di tabel yang panjang:
* **Fitur Live Search:** Ketik minimal 3 huruf nama pelanggan atau nomor IP di kolom pencarian atas, langsung memunculkan kartu tagihan pelanggan tersebut.
* **Aksi Cepat (Single Action Button):** Setiap baris pelanggan yang jatuh tempo memiliki tombol **[ Bayar Lunas ]**.
* **Otomatisasi Pasca-Bayar:** Saat tombol **[ Bayar Lunas ]** diklik:
  1. Status tagihan bulan tersebut berubah menjadi **LUNAS (Hijau)**.
  2. Saldo **Pendapatan Bulan Ini** di Dashboard otomatis bertambah.
  3. Muncul opsi *pop-up* ringan: **[ Kirim Struk via WhatsApp ]** (membuka API `wa.me` berisi teks bukti pembayaran otomatis).

### 3.4. Modul Laporan Keuangan Bulanan (Rekapitulasi)
Halaman khusus untuk melihat performa bisnis secara historis:
* **Filter Cepat:** Pilih Bulan & Tahun, serta filter berdasarkan Status (Semua / Lunas / Belum Bayar).
* **Ringkasan Rasio Kolektibilitas:** Persentase keberhasilan penagihan bulan tersebut (misal: $94\%$ tagihan telah terbayar).
* **Tombol Ekspor:** Unduh laporan tabel ke dalam format **CSV / Excel** atau **Cetak PDF** untuk pembukuan bulanan.

---

## 4. Desain Antarmuka & Pengalaman Pengguna (UI/UX Guidelines)
* **Arsitektur Layout:** *Fixed Vertical Sidebar* di sebelah kiri dengan ikon minimalis (FontAwesome) dan area konten utama (*Main Content*) berbasis kartu (*Card-Based Layout*).
* **Estetika & Warna (Flat Design):**
  * Latar belakang halaman utama: Abu-abu sangat terang (`#f4f6f9`).
  * Latar belakang kartu (*Card*): Putih bersih (`#ffffff`) dengan *border* tipis dan *drop-shadow* halus.
  * Warna Aksen Utama: *Light Blue / Primary Blue* (`#0d6efd`).
* **Tipografi:** Menggunakan *font* Sans-Serif modern (**Inter**, **Roboto**, atau **Segoe UI**) yang menjamin keterbacaan angka dan tabel log pada ukuran teks kecil.
* **Responsivitas:** Menggunakan sistem *grid* **Bootstrap 5** sehingga tampilan otomatis menyesuaikan saat dibuka melalui layar *smartphone* oleh pemilik bisnis.

---

## 5. Arsitektur Teknis & Skema Database Dasar (Data Model)
Untuk menjaga aplikasi tetap ringan saat dijalankan di *Home Server / Lab Dev* maupun hosting standar, struktur database cukup menggunakan **3 tabel inti**:

### A. Tabel `packages` (Master Paket Internet)
| Nama Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | ID unik paket |
| `package_name` | VARCHAR(50) | Nama paket (misal: "Home 10 Mbps") |
| `bandwidth` | VARCHAR(20) | Kecepatan (misal: "10M/10M") |
| `price` | DECIMAL(10,2) | Harga bulanan (misal: `150000`) |

### B. Tabel `customers` (Data Pelanggan)
| Nama Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | ID unik pelanggan |
| `name` | VARCHAR(100) | Nama pelanggan |
| `whatsapp` | VARCHAR(20) | Nomor WA aktif (`628...`) |
| `ip_address` | VARCHAR(50) | IP statis / Username PPPoE (Opsional) |
| `package_id` | INT (FK) | Relasi ke tabel `packages` |
| `due_date_day` | TINYINT | Tanggal jatuh tempo bulanan (1-28) |
| `status` | ENUM | `'active'`, `'isolated'`, `'inactive'` |

### C. Tabel `invoices` (Pencatatan Tagihan & Transaksi)
| Nama Kolom | Tipe Data | Keterangan |
| :--- | :--- | :--- |
| `id` | INT (PK) | Nomor transaksi / struk |
| `customer_id` | INT (FK) | Relasi ke tabel `customers` |
| `billing_period` | VARCHAR(7) | Periode bulan tagihan (format: `YYYY-MM`) |
| `amount` | DECIMAL(10,2) | Nominal yang ditagihkan/dibayar |
| `status` | ENUM | `'unpaid'`, `'paid'` |
| `paid_at` | DATETIME | Waktu pembayaran ditekan oleh kasir |

---

## 6. Batasan Ruang Lingkup (Out of Scope - v1.0)
Agar pengembangan versi 1.0 dapat selesai dengan cepat dan stabil:
* Penagihan dan pengiriman struk WhatsApp menggunakan metode *semi-otomatis* (klik tombol langsung membuka aplikasi WA dengan teks terformat, tanpa berlangganan API WhatsApp berbayar).
* Isolir pelanggan di router dilakukan terpisah atau menjadi fitur pengembangan di **Versi 1.1** (melalui integrasi API RouterOS Mikrotik).
* Pembayaran *online* otomatis (*Payment Gateway* seperti QRIS dinamis/Virtual Account) disimpan untuk **Versi 2.0**.