# Analisis Website Referensi (KSM / RGAS Solution)

Berdasarkan screenshot yang diberikan, berikut adalah analisis sistem "Sales Project" / "Cost Control" saat ini dan rekomendasi untuk desain ulang.

## 1. Analisis Dashboard
**Kondisi Saat Ini:**
- **Layout:** Sidebar admin standar + top bar.
- **Konten:**
  - Grafik "Project Growth 2026": Grafik batang dasar yang menunjukkan RAP vs Realisasi. Informatif tapi ukurannya terlalu kecil secara visual.
  - "Recent Lists" (Project, RAP, Realization): Daftar vertikal yang menghabiskan sebagian besar ruang layar.
- **Masalah:**
  - **Berantakan (Clutter):** Banyak daftar berdampingan menciptakan efek "dinding teks". Sulit mengidentifikasi item mana yang butuh perhatian.
  - **Keterbacaan:** Label yang berulang (contoh: pengulangan "035200.S/PR..." dan "HPP Material" di setiap baris) menambah noise.
  - **Kurang Insight:** Dashboard hanya menunjukkan *apa yang baru terjadi*, bukan *apa yang perlu perhatian* (misal: "Proyek Over Budget", "Approval Tertunda").

**Rekomendasi Desain Ulang:**
- **Kartu KPI:** Baris atas harus menampilkan statistik tingkat tinggi: "Total Proyek Aktif", "% Serapan Anggaran", "Invoice Tertunda", "Estimasi Margin".
- **Berorientasi Aksi:** Ganti "Recent Lists" dengan widget "Activity Feed" atau "Pending Actions" yang lebih padu.
- **Visual:** Gunakan progress bar untuk "RAP vs Realisasi" per proyek, daripada hanya angka mentah.

## 2. Administrasi (Users, Roles, Permissions)
**Kondisi Saat Ini:**
- **Tabel:** Tabel data standar dengan paginasi.
- **Tampilan Data:**
  - Roles ditampilkan sebagai slug database (misal: `marketing-role-2`, `admin-role`).
  - Permissions berupa string mentah (misal: `view dashboard management`).
- **Status:** Indikator "Active" berfungsi tapi secara visual membosankan.

**Rekomendasi Desain Ulang:**
- **Data yang Mudah Dibaca:** Ubah slug (`marketing-role`) menjadi Title Case (`Marketing Associate`).
- **Tabel yang Ditingkatkan:**
  - Tambahkan Avatar/Inisial User untuk pengenalan yang lebih baik.
  - Gunakan badge warna yang berbeda dan cerah untuk Role dan Status.
- **Penyederhanaan Permission:** Kelompokkan permission berdasarkan Modul (misal: "Modul Proyek: Lihat, Edit, Hapus") daripada daftar lepas berisi 56 entri.

## 3. Strategi UI/UX Umum
- **Estetika:** Tinggalkan tampilan "Template Admin" yang generik. Gunakan palet warna yang lebih bersih (Putih, Abu-abu lembut, Warna Brand Utama) dengan whitespace yang lebih baik.
- **Navigasi:** Kelompokkan "Transactions" secara logis. Jika "Cost Control" adalah fokusnya, jadikan "Projects", "Budgeting (RAP)", dan "Expenses" sebagai menu utama.
- **Responsivitas:** Pastikan tabel bisa mengecil menjadi kartu atau di-scroll dengan rapi di layar kecil.

## 4. Fitur Kunci untuk Diimplementasikan (Disimpulkan)
Berdasarkan daftar "Recent", sistem melacak:
1.  **Projects** (Klien, Tanggal, ID)
2.  **RAP (Rencana Anggaran Pelaksanaan)** - Anggaran internal.
3.  **Realization (Realisasi)** - Biaya aktual (Material, Instalasi, Transport, dll).
4.  **Invoices & Payment** - Pelacakan penagihan.
5.  **Cost To Go** - Estimasi sisa biaya (krusial untuk Cost Control).

## 5. Analisis Master Data
Berdasarkan screenshot tambahan:

### A. Project Group (List Project)
- **Kondisi Saat Ini:** Daftar unit bisnis atau kategori (misal: "Trading", "Jasa", "Inspeksi").
- **Observasi:** Ini bertindak sebagai kategori tingkat tinggi untuk proyek.
- **Desain Ulang:** Tetap sederhana, tapi pastikan "Projects" terhubung jelas ke grup ini.

### B. Client / Vendor
- **Kondisi Saat Ini:** Daftar gabungan Klien dan Vendor. Berisi field CRM generik (Contact Person, Title, Phone, Address).
- **Desain Ulang:**
  - **Sistem Tagging:** Tandai entitas secara eksplisit sebagai "Client", "Vendor", atau "Keduanya".
  - **Filter:** Tambahkan tab cepat untuk "Clients" vs "Vendors" agar tidak tercampur dalam satu daftar raksasa.

### C. Cost Items (List Item) - **KRUSIAL**
- **Kondisi Saat Ini:** Daftar "HPP Material", "HPP Turbine Meter", dll dengan kolom "Parent".
- **Masalah:** Ini jelas adalah **Data Hierarkis** (Cost Structure/COA), tapi ditampilkan sebagai **Tabel Datar**. Sangat sulit memvisualisasikan hubungan induk-anak (misal: *HPP Material -> PO Kantor -> Ultra Sonic Gas Meter*).
- **Desain Ulang:** **Tree-Table View**. Gunakan tabel menjorok atau tampilan pohon yang bisa dibuka-tutup (collapsible) agar user bisa expand/collapse kategori. Ini esensial bagi sistem "Cost Control" untuk melihat subtotal.

### D. Units (List Unit)
- **Kondisi Saat Ini:** Daftar standar (m3, pcs, orang, dll).
- **Desain Ulang:** Tabel fungsional standar. Tidak ada perubahan besar yang diperlukan.

## 6. Analisis Menu Transaksi
Ini adalah modul operasional inti.

### A. Project Order (List Project)
- **Kondisi Saat Ini:** Daftar proyek aktif dengan "Kode Project", "No Kontrak", "Addendum".
- **Kritik:**
  - **Status Hilang:** Mustahil mengetahui apakah proyek Aktif, Selesai, atau Ditahan hanya dengan melihat daftar.
  - **Tanpa Data Keuangan:** Tidak menampilkan Nilai Proyek (Nilai Kontrak) di daftar utama.
- **Desain Ulang:**
  - Tambahkan "Status Badge" (Persiapan, Berjalan, Tutup).
  - Tampilkan kolom "Nilai Kontrak".
  - Tambahkan progress bar untuk penyelesaian.

### B. RAP (Budget) & Realisasi
- **Kondisi Saat Ini (RAP):** Daftar datar masif dari SETIAP item anggaran untuk SETIAP proyek yang dicampur jadi satu.
  - Kolom: No. Kontrak, Date, Item Code, Unit, Qty, Price, Total Price.
- **Kondisi Saat Ini (Realisasi):** Daftar datar serupa untuk pengeluaran aktual.
- **KEKURANGAN FATAL:** User harus mencari/filter untuk menemukan item bagi *satu* proyek spesifik. UX ini sangat buruk.
- **Desain Ulang:** **Project-Centric View**.
  - User TIDAK BOLEH masuk ke "List RAP" global.
  - Melainkan: Masuk ke **Detail Proyek** -> Klik **Tab Budget/RAP**.
  - Context-switching ini kuncinya. List global hanya berguna untuk Finance/Accounting, bukan Project Manager.

### C. Cost To Go (List Cost)
- **Kondisi Saat Ini:** Daftar datar lain yang menunjukkan "sisa anggaran" atau "proyeksi biaya".
- **Desain Ulang:** Ini harusnya berupa **Laporan** atau **Widget Dashboard**, bukan daftar transaksi. Ini adalah metrik kalkulasi (Budget - Realisasi = Cost To Go).

### D. Payment
- **Kondisi Saat Ini:** Melacak pembayaran/penagihan.
- **Desain Ulang:** Pindahkan ke **Detail Proyek -> Tab Invoicing**.

## 7. Analisis Laporan (Project Analysis)
**Kondisi Saat Ini:**
- Tampilan "Detail Proyek" yang komprehensif.
- **Header:** Grid padat berisi metadata proyek (Nama, No PO, Nilai, Tanggal).
- **Tabel:** "Detail RAP - Realization - Cost To Go".
  - Ini adalah data terpenting dalam sistem.
  - **Masalah:**
    - **Tabel Melebar:** 12+ kolom membuat sulit melacak baris.
    - **Nama Item:** Kolom "Item" menggunakan string gabungan yang panjang (misal: "HPP Material - HPP Bahan..."), membuang ruang horizontal yang besar.
    - **Visual:** Tidak ada perbedaan visual antara "Rencana" (RAP) dan "Aktual" (Realisasi).

**Strategi Desain Ulang (Tampilan "Holy Grail"):**
1.  **Header Proyek:** Desain ulang sebagai "Kartu Proyek" dengan indikator status kunci (On Budget, On Time) dan progress bar melingkar untuk penyelesaian.
2.  **Tree-Table:**
    - Daripada nama panjang, gunakan struktur Pohon (Tree) yang bisa dibuka-tutup.
    - **Pengelompokan Kolom:**
      - **Budget (RAP):** Header latar biru.
      - **Aktual (Realisasi):** Header latar hijau.
      - **Forecast (Cost To Go):** Header latar oranye.
      - **Varian:** Teks Merah/Hijau yang mengindikasikan Over/Under budget.

---

# Keputusan Tech Stack
**Pendekatan Frontend First**
- **Framework:** Next.js (App Router)
- **Package Manager:** pnpm
- **Styling:** Tailwind CSS + Shadcn/UI (untuk nuansa "Premium" yang diminta).
- **Data:** Data Dummy JSON Hardcoded (meniru respon API).

# Peta Jalan Implementasi
1.  **Setup:** Inisialisasi proyek Next.js dengan `pnpm`.
2.  **Komponen:** Bangun "App Shell" (Sidebar, Navbar).
3.  **Halaman:**
    - **Dashboard:** Statistik perusahaan tingkat tinggi.
    - **Project List:** Tampilan kartu/tabel yang bisa difilter.
    - **Project Detail (Inti):** Satu Halaman Terpadu yang menggabungkan "Analisis", "RAP", dan "Realisasi" menggunakan tab dan Tree-Table.
