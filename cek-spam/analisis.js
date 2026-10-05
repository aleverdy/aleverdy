// Logika murni cek nomor: normalisasi, operator, sinyal risiko, tautan sumber.
// Dipakai halaman (window.CekNomor) dan bisa dites dengan Node (module.exports).
(function (root) {
  var OPERATOR = [
    ['Telkomsel', ['811', '812', '813', '821', '822', '823', '852', '853']],
    ['Telkomsel (by.U)', ['851']],
    ['Indosat Ooredoo (IM3)', ['814', '815', '816', '855', '856', '857', '858']],
    ['XL', ['817', '818', '819', '859', '877', '878']],
    ['Axis', ['831', '832', '833', '838']],
    ['Tri (3)', ['895', '896', '897', '898', '899']],
    ['Smartfren', ['881', '882', '883', '884', '885', '886', '887', '888', '889']]
  ];

  var KODE_AREA = {
    '21': 'Jakarta & sekitarnya', '22': 'Bandung', '24': 'Semarang', '31': 'Surabaya',
    '61': 'Medan', '274': 'Yogyakarta', '361': 'Denpasar', '411': 'Makassar',
    '711': 'Palembang', '751': 'Padang', '511': 'Banjarmasin', '341': 'Malang'
  };

  // Kode negara yang dikenal luas dipakai untuk "wangiri" (panggilan tak terjawab
  // sekali dering agar korban menelepon balik ke nomor bertarif mahal).
  var KODE_WANGIRI = {
    '222': 'Mauritania', '223': 'Mali', '224': 'Guinea', '225': 'Pantai Gading',
    '232': 'Sierra Leone', '216': 'Tunisia', '881': 'Satelit global',
    '882': 'Jaringan internasional', '883': 'Jaringan internasional'
  };

  function normalisasi(masukan) {
    var s = String(masukan || '').trim();
    var plus = s.charAt(0) === '+';
    var d = s.replace(/[^0-9]/g, '');
    if (!d) return { valid: false, alasan: 'Belum ada angka yang dimasukkan.' };
    if (!plus && d.indexOf('00') === 0) { d = d.slice(2); plus = true; }

    var negara;
    var nasional;
    if (plus || (d.indexOf('62') === 0 && d.length >= 10)) {
      if (d.indexOf('62') === 0) { negara = '62'; nasional = d.slice(2); }
      else return { valid: true, internasional: true, e164: '+' + d, digit: d };
    } else if (d.charAt(0) === '0') {
      negara = '62'; nasional = d.slice(1);
    } else if (d.charAt(0) === '8') {
      negara = '62'; nasional = d;
    } else {
      return { valid: false, alasan: 'Format tidak dikenali. Contoh: 0812 3456 7890 atau +62 812 3456 7890.' };
    }
    nasional = nasional.replace(/^0+/, '');
    return {
      valid: true, internasional: false, negara: negara, nasional: nasional,
      lokal: '0' + nasional, e164: '+62' + nasional, digit: '62' + nasional
    };
  }

  function cariOperator(nasional) {
    var p = nasional.slice(0, 3);
    for (var i = 0; i < OPERATOR.length; i++) {
      if (OPERATOR[i][1].indexOf(p) !== -1) return OPERATOR[i][0];
    }
    return null;
  }

  function analisis(masukan) {
    var n = normalisasi(masukan);
    if (!n.valid) return { nomor: n, sinyal: [], skor: null, jenis: 'tidak valid' };
    var sinyal = [];
    var skor = 0;
    function tambah(bobot, teks) { skor += bobot; sinyal.push({ bobot: bobot, teks: teks }); }

    if (n.internasional) {
      var k3 = n.digit.slice(0, 3);
      var jenis = 'internasional';
      if (KODE_WANGIRI[k3]) {
        tambah(50, 'Kode negara +' + k3 + ' (' + KODE_WANGIRI[k3] + ') dikenal luas untuk penipuan "wangiri". Jangan telepon balik.');
      } else {
        tambah(20, 'Nomor luar negeri. Telepon/WA tak dikenal dari luar negeri adalah pola umum penipuan lowongan kerja dan investasi.');
      }
      if (n.digit.length < 8 || n.digit.length > 15) tambah(15, 'Panjang nomor tidak wajar untuk standar internasional (8–15 digit).');
      return { nomor: n, jenis: jenis, operator: null, sinyal: sinyal, skor: Math.min(skor, 100) };
    }

    var nas = n.nasional;
    var hasil = { nomor: n, operator: null, sinyal: sinyal };

    if (nas.charAt(0) === '8' && nas.indexOf('800') !== 0 && nas.indexOf('809') !== 0) {
      hasil.jenis = 'seluler';
      hasil.operator = cariOperator(nas);
      if (!hasil.operator) tambah(25, 'Awalan 0' + nas.slice(0, 3) + ' bukan awalan operator seluler Indonesia yang aktif.');
      var panjang = nas.length + 1;
      if (panjang < 10 || panjang > 13) tambah(30, 'Panjang ' + panjang + ' digit; nomor seluler Indonesia umumnya 10–13 digit (diawali 08).');
    } else if (nas.indexOf('800') === 0) {
      hasil.jenis = 'bebas pulsa';
      tambah(0, 'Nomor bebas pulsa (0800). Biasanya milik perusahaan; tetap cocokkan dengan nomor resmi di situs perusahaannya.');
    } else if (nas.indexOf('809') === 0) {
      hasil.jenis = 'premium';
      tambah(40, 'Awalan 0809 adalah layanan bertarif premium. Menelepon balik bisa memotong pulsa besar.');
    } else {
      hasil.jenis = 'telepon rumah/kantor';
      var area = KODE_AREA[nas.slice(0, 2)] || KODE_AREA[nas.slice(0, 3)];
      hasil.area = area || null;
      tambah(5, 'Nomor PSTN (telepon kantor). Telemarketing kartu kredit/asuransi sering memakai nomor kantor seperti ini.');
      if (nas.length < 7 || nas.length > 11) tambah(25, 'Panjang nomor kantor tidak wajar.');
    }

    if (/(\d)\1{6,}/.test(nas)) tambah(10, 'Ada angka yang berulang 7 kali atau lebih; sering ditemukan pada nomor palsu/hasil ketik asal.');

    hasil.skor = Math.min(skor, 100);
    return hasil;
  }

  function sumber(n) {
    var e = encodeURIComponent;
    var q = n.internasional
      ? '"' + n.e164 + '" OR "' + n.digit + '"'
      : '"' + n.lokal + '" OR "' + n.e164 + '" OR "' + n.digit + '"';
    var daftar = [
      { nama: 'Google', ket: 'Cari laporan di forum, Kaskus, media sosial, situs ulasan.',
        url: 'https://www.google.com/search?q=' + e(q) },
      { nama: 'Google: kata kunci penipuan', ket: 'Sama, tapi disaring ke kata "penipuan", "spam", "pinjol".',
        url: 'https://www.google.com/search?q=' + e('(' + q + ') (penipuan OR spam OR pinjol OR penagih OR scam)') },
      { nama: 'Truecaller', ket: 'Nama & label spam dari komunitas. Perlu login.',
        url: n.internasional ? 'https://www.truecaller.com/search/global/' + n.digit
          : 'https://www.truecaller.com/search/id/' + n.nasional },
      { nama: 'Sync.ME', ket: 'Basis data nama penelepon.',
        url: 'https://sync.me/search/?number=' + e(n.e164) },
      { nama: 'Tellows', ket: 'Skor dan komentar pengguna internasional.',
        url: 'https://www.tellows.com/num/' + e('00' + n.digit) },
      { nama: 'WhatsApp', ket: 'Lihat apakah nomor punya akun WA (nama/foto bisnis).',
        url: 'https://wa.me/' + n.digit },
      { nama: 'X (Twitter)', ket: 'Orang sering mengeluhkan nomor spam di sini.',
        url: 'https://x.com/search?f=live&q=' + e(n.internasional ? n.e164 : n.lokal) },
      { nama: 'Facebook', ket: 'Postingan grup "awas penipuan".',
        url: 'https://www.facebook.com/search/posts/?q=' + e(n.internasional ? n.e164 : n.lokal) }
    ];
    return daftar;
  }

  var api = { normalisasi: normalisasi, analisis: analisis, sumber: sumber, cariOperator: cariOperator };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CekNomor = api;
})(this);
