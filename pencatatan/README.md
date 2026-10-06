# Agenda Surat

Pencatatan nomor surat keluar, memo internal, dan surat masuk dari OJK, APPI,
dan umum, dalam satu halaman HTML. Bisa disinkronkan dari file Excel.

Buka lewat githack:

```
https://raw.githack.com/aleverdy/aleverdy/<cabang>/pencatatan/index.html
```

## Tampilan

- **Beranda**: karcis nomor berikutnya untuk tiap jenis surat keluar, ringkasan
  bulan ini, grafik volume surat per bulan per kategori, daftar surat masuk yang
  perlu ditindaklanjuti (urut dari tenggat paling mendesak), dan catatan terbaru.
- Setiap kategori punya warna tetap yang dipakai sama di menu, tabel, dan grafik.
- Tema terang/gelap mengikuti perangkat, bisa diganti dari tombol di menu.
- Di HP, menu samping menjadi laci dan tabel berubah menjadi daftar kartu.
- Tekan `/` untuk langsung mencari.

## Yang bisa dilakukan

- **Ambil nomor surat keluar/memo**: nomor urut berikutnya dibuat otomatis dari
  format kategori, misalnya `{urut}/SK/{pt}/{romawi}/{tahun}` → `004/SK/CF/X/2026`.
  Nomor urut mulai lagi dari 1 setiap tahun. Nomor ganda ditolak.
- **Catat surat masuk** (OJK, APPI, umum): nomor dari pengirim, nomor agenda
  otomatis, tenggat tindak lanjut, dan tanda selesai. Tenggat yang lewat atau
  tinggal ≤ 7 hari ditandai.
- **Sinkronkan dari Excel**: kolom dikenali dari judulnya (Nomor Surat, Tanggal,
  Perihal, Tujuan/Pengirim, PIC, Tenggat, Status, Keterangan, Tautan, No Agenda,
  Kategori). Kategori diambil dari kolom Kategori, nama sheet, atau pilihan
  bawaan. Data dicocokkan per kategori + nomor surat; ada pratinjau sebelum
  diterapkan. Opsional: hapus catatan yang sudah tidak ada di Excel.
  Di Chrome/Edge file Excel bisa *dihubungkan* sekali, lalu cukup tekan
  **Sinkronkan** setiap kali file disimpan.
- **Unduh Excel**: satu sheet per kategori, tanggal sebagai tanggal Excel asli.
  File hasil unduhan bisa disinkronkan balik tanpa diubah.
- Kategori, kode, jenis (keluar/masuk), dan format nomor bisa diubah di
  Pengaturan.

## Batasan yang perlu diketahui

- Data disimpan di **localStorage browser**. Tidak ikut ke perangkat/browser
  lain, dan hilang kalau data situs dibersihkan. Unduh Excel sebagai cadangan.
- Tidak ada server, jadi dua orang di dua komputer bisa mengambil nomor yang
  sama. Kalau dipakai bersama, jadikan satu file Excel sebagai sumber utama dan
  sinkronkan sebelum mengambil nomor.
- Sinkronisasi satu arah (Excel → aplikasi). Aplikasi tidak menulis balik ke
  file Excel Anda; "Unduh Excel" membuat file baru.
- Butuh internet untuk memuat pustaka Excel (SheetJS dari cdnjs).
