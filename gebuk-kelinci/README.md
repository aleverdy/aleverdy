# Gebuk Kelinci

Game pukul-lubang (whack-a-mole) 60 detik untuk HP. Kelinci bertopeng burung
hantu keluar-masuk sembilan lubang sambil ngunyah pisang; ketuk sebelum dia
kabur.

## Aturan

| Yang nongol | Kalau dipukul |
|---|---|
| Kelinci | +10 poin |
| Kelinci emas | +50 poin, tapi cuma nongol sekejap |
| Pisang | +3 detik |
| Om kamera | nyawa berkurang, skor dipotong 20 |

Pukul beruntun menaikkan pengali sampai ×5; kelinci yang lolos memutus kombo.
Kesulitan naik lima tingkat sepanjang ronde: munculnya makin cepat, makin
banyak yang barengan, dan om kamera makin sering ikut nongol.

Selesai kalau waktu habis atau tiga nyawa ludes. Rekor tertinggi disimpan di
peramban.

## Menjalankan

Satu berkas tanpa dependensi. Buka `index.html`, atau sajikan foldernya:

```
python3 -m http.server 8000
```

## Catatan teknis

- HTML/CSS/JS polos; semua karakter digambar sebagai SVG dari data, tanpa
  berkas gambar.
- Efek suara disintesis lewat Web Audio API, jadi tidak ada berkas audio.
- Getaran pakai `navigator.vibrate` kalau perangkatnya mendukung.
- Bisa dimainkan dengan sentuh maupun keyboard (tombol 1–9, `Esc` untuk jeda).
- Menghormati `prefers-reduced-motion`; target sentuh mengisi penuh sel lubang.
