# Cari Sapi Gemesnya

Mini-game web untuk Piyaa, dari Ale. Lima ronde, tiap ronde satu sapi harus
ketemu di antara kawanan yang mirip-mirip. Sapi yang ketemu masuk kandang di
atas layar. Begitu kelimanya pulang, muncul kalimat terakhirnya:

> Tapi yang paling gemes tetap Piyaa

## Rondenya

1. **Kenalan dulu** — enam sapi, satu ciri. Cocokkan sama kartu "Yang dicari".
2. **Padangnya mulai ramai** — dua belas sapi, dua ciri, dua-duanya harus cocok.
3. **Sapinya jalan-jalan** — sapinya bergerak pelan sambil dicari.
4. **Bobo di rumput tinggi** — cuma tanduknya yang nongol; ketuk buat ngintip.
5. **Sapi kembar** — enam belas sapi sama persis, cuma satu yang lagi kedip.

Tidak ada kalah. Salah ketuk cuma dibalas "muu", dan tiap ronde punya tombol
**Kasih petunjuk** yang menyingkirkan separuh sapi yang jelas tidak cocok.

## Menjalankan

Satu berkas, tanpa dependensi. Buka `index.html` di browser mana pun, atau
sajikan foldernya:

```
python3 -m http.server 8000
```

lalu buka `http://localhost:8000`.

## Catatan teknis

- HTML/CSS/JS polos dalam satu berkas. Sapi digambar sebagai SVG dari data
  (warna badan, bentuk bercak, aksesori, ekspresi), jadi tiap sapi berbeda dan
  pengecoh dibuat dengan menjamin minimal satu ciri kunci tidak cocok.
- Hujan hati di layar penutup pakai canvas.
- Mengikuti tema terang/gelap perangkat, menghormati `prefers-reduced-motion`.
- Dirancang untuk layar HP dulu (lebar maksimum 460px), bisa dimainkan dengan
  sentuh maupun keyboard; tiap sapi punya `aria-label` yang menyebutkan ciri-cirinya.
