# Kamen Rider Chibi Fight

Game fighting 2D bergaya chibi dengan 24 Kamen Rider dari tiga era — Showa,
Heisei, dan Reiwa — plus rider terbaru, **Kamen Rider Myth**. Setiap
pertandingan selalu dibuka dengan adegan **henshin**: rider masih wujud manusia
biasa, sabuk muncul di pinggang, teriak "HENSHIN!", energi menyelimuti badan,
baru berubah jadi rider dan bertarung.

Satu berkas HTML, tanpa dependensi, tanpa aset gambar — semua rider digambar
prosedural di canvas (helm, mata majemuk, crest, driver, syal).

## Daftar rider

| Era | Rider |
| --- | --- |
| Showa | Ichigo, Nigo, V3, Rider X, Amazon, Stronger, BLACK, BLACK RX |
| Heisei | Kuuga, Ryuki, Faiz, Den-O, Double, OOO, Fourze, Build, Zi-O |
| Reiwa | Zero-One, Saber, Revi, Geats, Gotchard, Gavv, **Myth** (baru) |

Tiap rider punya statistik (PWR/SPD/DEF), warna, bentuk helm, suara driver saat
henshin, dan jurus pamungkas sendiri — misalnya Rider Kick (Ichigo), Joker
Extreme (Double), Mythos Genesis Kick (Myth).

## Cara main

- **Keyboard:** `A`/`D` jalan · `W` lompat · `S` tangkis · `J` pukul · `K` tendang ·
  `L` jurus pamungkas (kalau meter penuh) · `Spasi` lewati henshin.
- **HP:** pakai tombol di layar; posisi mendatar (landscape) paling enak.
- Menang 2 ronde dulu. Tiap ronde 99 detik; kalau waktu habis, HP terbanyak yang
  menang. Meter jurus terisi saat memukul maupun terkena pukulan.
- Lawan dikendalikan komputer; latar arena mengikuti era si lawan (tebing senja
  untuk Showa, kota malam untuk Heisei, plaza neon untuk Reiwa).

## Menjalankan

Buka `index.html` langsung di browser, atau sajikan foldernya:

```
python3 -m http.server 8000
```

lalu buka `http://localhost:8000/kamen-rider-chibi/`.

## Catatan teknis

- HTML/CSS/JS polos dalam satu berkas (`index.html`), tanpa build step.
- Rendering canvas 1280×720 yang diskalakan CSS; menu memakai DOM biasa.
- Efek suara dibangkitkan lewat WebAudio (tanpa berkas audio), bisa dimatikan
  dari tombol "Suara".
- Menghormati `prefers-reduced-motion`: getaran layar dan kilatan dimatikan.
- Nama dan karakter Kamen Rider milik Toei/Ishimori Productions; ini karya
  penggemar non-komersial, semua visual digambar ulang dengan kode.
