# Kebun Piya

Mini-game web untuk Piya, dari Ale. Lima misi kecil tentang bunga; setiap misi
yang selesai menambah satu bunga ke vas di atas layar. Begitu kelima slotnya
penuh, buketnya dirangkai dan muncul kalimat terakhirnya:

> Ale akan memberikan Bunga Ke Piya

## Misinya

1. **Siram benihnya** — tahan tombol sampai air berhenti di garis hijau. Kelewatan, potnya banjir.
2. **Kuis kecil** — tiga pertanyaan, salah satunya soal cara bikin bunga di vas awet seminggu.
3. **Usir kumbang** — enam kumbang, 22 detik.
4. **Ingat urutan** — empat bunga menyala bergantian, ulangi urutannya.
5. **Susun kalimatnya** — sembilan kata yang berantakan kena angin.

Tidak ada game over. Setiap misi bisa diulang tanpa hukuman.

## Menjalankan

Satu berkas, tanpa dependensi. Buka `index.html` di browser mana pun, atau
sajikan foldernya:

```
python3 -m http.server 8000
```

lalu buka `http://localhost:8000`.

## Catatan teknis

- HTML/CSS/JS polos dalam satu berkas; bunga digambar sebagai SVG dari data
  (jumlah kelopak, lebar kelopak, warna inti), hujan kelopak pakai canvas.
- Mengikuti tema terang/gelap perangkat, dan menghormati `prefers-reduced-motion`.
- Dirancang untuk layar HP dulu (lebar maksimum 460px), bisa dimainkan dengan
  sentuh maupun keyboard.

---

# Catatan Uang

Pelacak keuangan harian di `keuangan.html`. Satu berkas, tanpa server: semua
catatan disimpan di `localStorage` peramban yang dipakai, tidak dikirim ke mana
pun.

## Isinya

- Catat pemasukan/pengeluaran: jumlah, kategori, tanggal, catatan. Ketuk satu
  baris riwayat untuk mengubahnya, tombol × untuk menghapus (ada "urungkan").
- Ringkasan per bulan — masuk, keluar, sisa — dengan navigasi bulan.
- Anggaran bulanan opsional: meter terpakai dan jatah harian untuk sisa bulan.
- **Irama belanja**: batang pengeluaran per tanggal sebulan penuh; akhir pekan
  dibedakan, titik hijau menandai hari ada pemasukan. Ketuk satu tanggal untuk
  menyaring riwayat hari itu.
- Rincian per kategori, pencarian riwayat, unduh CSV, cadangkan/pulihkan JSON.
- Belum punya data? Ada tombol pengisi data contoh di layar kosong.

## Menjalankan

Buka `keuangan.html` langsung di peramban, atau sajikan foldernya
(`python3 -m http.server 8000`).
