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

# Rutin: habit tracker

Ada di folder [`habit/`](habit/). Bisa dibuka lewat githack (selalu sertakan
`index.html`, karena githack tidak menyajikan folder):

- Versi tetap per commit: `https://raw.githack.com/aleverdy/aleverdy/<hash-commit>/habit/index.html`
- Setelah digabung ke branch utama repo ini, selalu versi terbaru:
  `https://raw.githack.com/aleverdy/aleverdy/claude/flower-game-couple-u3b6cd/habit/index.html`

Data tersimpan per domain, jadi pakai domain yang sama terus
(`raw.githack.com`, bukan bergantian dengan `rawcdn.githack.com`) supaya
catatanmu tidak terpisah. Pindah dari satu hash commit ke hash lain di domain
yang sama tetap membawa datanya.

## Isinya

- **Jam hari ini.** Satu putaran 24 jam: tengah malam di bawah, tengah hari di
  atas. Setiap kebiasaan duduk di jam pengingatnya dan terisi warna saat
  selesai; titik kuning adalah posisi matahari sekarang.
- **Centang cepat.** Ketuk ikon untuk menandai selesai. Kebiasaan bertarget
  (mis. 8 gelas air) bertambah satu per ketukan, dengan tombol −1.
  Tujuh hari terakhir bisa diubah langsung dari baris kebiasaan.
- **Streak & statistik.** Hari beruntun, rekor terbaik, persentase 7 dan 30
  hari, dan peta 20 minggu yang bisa difilter per kebiasaan.
- **Bisa disesuaikan.** Nama, ikon, warna, hari, target, satuan, dan catatan
  tiap kebiasaan; nama panggilan; lima tema warna (Fajar, Daun, Laut, Senja,
  Grafit); mode terang/gelap/ikuti HP; minggu mulai Senin atau Minggu; urutan
  kebiasaan.

## Pengingat & alarm

1. **Notifikasi browser.** Izinkan di tab *Atur*. Muncul tepat di jam
   pengingat (terlambat sampai 15 menit masih dibunyikan), lengkap dengan
   bunyi, getar, dan tombol *Tandai selesai* langsung dari notifikasi.
   Berjalan selama Rutin terbuka atau terpasang ke layar utama. Di iPhone,
   notifikasi web hanya jalan setelah Rutin ditambahkan ke Layar Utama.
2. **Kalender HP (paling andal).** *Unduh semua pengingat (.ics)* membuat
   acara berulang sesuai hari yang dipilih, masing-masing dengan alarm tepat
   waktu. Buka berkasnya di HP: iPhone menawarkan *Tambah ke Kalender*,
   Android membukanya lewat Google Calendar. Alarm ini tetap bunyi walau
   browser ditutup.
3. **Tautan Google Calendar** per jam pengingat, untuk menambahkan satu per
   satu.

Browser tidak diizinkan menyetel aplikasi Jam/Alarm bawaan HP secara
langsung, jadi jalur kalender di atas adalah cara yang tetap bunyi tanpa
aplikasi terbuka.

## Data

Semua tersimpan di `localStorage` browser, tidak dikirim ke mana pun. Tab
*Atur* punya *Simpan cadangan* (JSON) dan *Pulihkan dari cadangan* untuk
pindah HP.

## Menjalankan

HTML/CSS/JS polos tanpa build. Service worker butuh `http://localhost` atau
HTTPS:

```
python3 -m http.server 8000
```

lalu buka `http://localhost:8000/habit/`.
