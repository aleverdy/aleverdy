'use strict';

/* =========================================================
   Rutin — habit tracker
   Data tersimpan di localStorage. Pengingat lewat notifikasi
   (service worker) dan ekspor kalender (.ics / Google Calendar).
   ========================================================= */

const STORE_KEY = 'rutin.v1';
const FIRED_KEY = 'rutin.fired';

const DAY_SHORT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const DAY_LONG = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const DAY_ICAL = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli',
  'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const COLORS = [
  { hex: '#6741D9', name: 'Ungu' },
  { hex: '#1C7ED6', name: 'Biru' },
  { hex: '#0C8599', name: 'Toska' },
  { hex: '#2B8A3E', name: 'Hijau' },
  { hex: '#B35F00', name: 'Jingga' },
  { hex: '#E03131', name: 'Merah' },
  { hex: '#D6336C', name: 'Merah muda' },
  { hex: '#AE3EC9', name: 'Anggur' },
];
const ICONS = ['💧', '🏃', '📖', '🧘', '💤', '🥗', '🦷', '💊', '✍️', '🙏', '🚶', '💪',
  '🍎', '📵', '🧹', '🌱', '☀️', '🎸', '💻', '🧠', '💰', '🎯', '🫁', '❤️'];
const THEMES = [
  { id: 'fajar', name: 'Fajar', accent: '#3F3DBC', sun: '#F2A30F' },
  { id: 'daun', name: 'Daun', accent: '#2F7A3E', sun: '#E3A805' },
  { id: 'laut', name: 'Laut', accent: '#0B7285', sun: '#FF922B' },
  { id: 'senja', name: 'Senja', accent: '#C2255C', sun: '#F59F00' },
  { id: 'grafit', name: 'Grafit', accent: '#343A40', sun: '#F2A30F' },
];
const SUGGESTIONS = [
  { name: 'Minum air', icon: '💧', color: '#1C7ED6', target: 8, unit: 'gelas', reminders: ['09:00', '13:00', '16:00'], days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Olahraga', icon: '🏃', color: '#E03131', target: 1, unit: '', reminders: ['06:00'], days: [1, 3, 5] },
  { name: 'Baca buku', icon: '📖', color: '#6741D9', target: 10, unit: 'halaman', reminders: ['21:00'], days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Tidur sebelum jam 11', icon: '💤', color: '#0C8599', target: 1, unit: '', reminders: ['22:30'], days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Minum vitamin', icon: '💊', color: '#B35F00', target: 1, unit: '', reminders: ['07:30'], days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Jurnal syukur', icon: '✍️', color: '#AE3EC9', target: 1, unit: '', reminders: ['21:30'], days: [0, 1, 2, 3, 4, 5, 6] },
  { name: 'Jalan kaki', icon: '🚶', color: '#2B8A3E', target: 5000, unit: 'langkah', reminders: ['17:00'], days: [1, 2, 3, 4, 5] },
];

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fmtTime = t => t.replace(':', '.');
const nowMin = () => { const n = new Date(); return n.getHours() * 60 + n.getMinutes(); };
const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- State ---------- */

function defaults() {
  return {
    v: 1,
    settings: { name: '', theme: 'fajar', mode: 'auto', weekStart: 1, sound: true },
    habits: [],
    log: {},
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return defaults();
    return normalize(JSON.parse(raw));
  } catch { return defaults(); }
}

function normalize(data) {
  const base = defaults();
  if (!data || typeof data !== 'object') return base;
  const s = { ...base.settings, ...(data.settings || {}) };
  const habits = Array.isArray(data.habits) ? data.habits.filter(h => h && h.id && h.name).map(h => ({
    id: String(h.id),
    name: String(h.name).slice(0, 40),
    icon: h.icon || '🎯',
    color: /^#[0-9a-f]{6}$/i.test(h.color) ? h.color : COLORS[0].hex,
    days: Array.isArray(h.days) && h.days.length ? h.days.map(Number).filter(d => d >= 0 && d <= 6) : [0, 1, 2, 3, 4, 5, 6],
    target: Math.max(1, Math.min(99999, parseInt(h.target, 10) || 1)),
    unit: String(h.unit || '').slice(0, 16),
    reminders: Array.isArray(h.reminders) ? h.reminders.filter(t => /^\d\d:\d\d$/.test(t)).sort() : [],
    note: String(h.note || '').slice(0, 140),
    created: /^\d{4}-\d\d-\d\d$/.test(h.created) ? h.created : dkey(new Date()),
  })) : [];
  const log = data.log && typeof data.log === 'object' ? data.log : {};
  return { v: 1, settings: s, habits, log };
}

let state = load();

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch { toast('Gagal menyimpan. Penyimpanan browser mungkin penuh.'); }
}

/* ---------- Logika kebiasaan ---------- */

const scheduledOn = (h, d) => h.days.includes(d.getDay()) && dkey(d) >= h.created;
const countOf = (h, k) => (state.log[k] && state.log[k][h.id]) || 0;
const isDone = (h, k) => countOf(h, k) >= h.target;

function setCount(h, k, n) {
  n = Math.max(0, Math.min(h.target, n));
  const day = state.log[k] || (state.log[k] = {});
  if (n === 0) delete day[h.id]; else day[h.id] = n;
  if (!Object.keys(day).length) delete state.log[k];
  // kebiasaan boleh dicatat mundur sebelum tanggal dibuat
  if (n > 0 && k < h.created) h.created = k;
  save();
}

function currentStreak(h) {
  const today = new Date();
  let d = today, streak = 0;
  if (scheduledOn(h, d) && !isDone(h, dkey(d))) d = addDays(d, -1);
  for (let i = 0; i < 3660; i++) {
    const k = dkey(d);
    if (k < h.created) break;
    if (scheduledOn(h, d)) {
      if (isDone(h, k)) streak++; else break;
    }
    d = addDays(d, -1);
  }
  return streak;
}

function bestStreak(h) {
  let d = fromKey(h.created), best = 0, run = 0;
  const end = dkey(new Date());
  for (let i = 0; i < 3660 && dkey(d) <= end; i++) {
    const k = dkey(d);
    if (scheduledOn(h, d)) {
      if (isDone(h, k)) { run++; best = Math.max(best, run); }
      else if (k !== end) run = 0;
    }
    d = addDays(d, 1);
  }
  return best;
}

function rate(habits, days) {
  let need = 0, got = 0;
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = addDays(today, -i), k = dkey(d);
    for (const h of habits) {
      if (!scheduledOn(h, d)) continue;
      if (i === 0 && !isDone(h, k)) continue; // hari ini belum selesai tidak dihitung gagal
      need++; if (isDone(h, k)) got++;
    }
  }
  return { need, got, pct: need ? Math.round(got / need * 100) : null };
}

/* ---------- Tema ---------- */

function applyTheme() {
  const root = document.documentElement;
  root.dataset.accent = state.settings.theme;
  if (state.settings.mode === 'auto') delete root.dataset.theme;
  else root.dataset.theme = state.settings.mode;
  requestAnimationFrame(() => {
    const bg = getComputedStyle(document.body).backgroundColor;
    $('meta[name="theme-color"]').setAttribute('content', bg);
  });
}
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

/* ---------- Navigasi ---------- */

const TABS = ['hari-ini', 'statistik', 'atur'];
function route() {
  const id = location.hash.slice(1);
  const tab = TABS.includes(id) ? id : (id === 'pengingat' ? 'atur' : 'hari-ini');
  for (const t of TABS) $('#view-' + t).hidden = t !== tab;
  $$('.tabs a').forEach(a => {
    if (a.dataset.tab === tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  if (tab === 'statistik') renderStats();
  if (tab === 'atur') renderSettings();
  if (id === 'pengingat') $('#pengingat').scrollIntoView();
  else window.scrollTo(0, 0);
}
addEventListener('hashchange', route);

/* ---------- Render: Hari ini ---------- */

const ICON_BELL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5h4"/></svg>';
const ICON_EDIT = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4"/></svg>';
const ICON_CHECK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

function greeting() {
  const h = new Date().getHours();
  const part = h < 4 ? 'Selamat malam' : h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
  const n = state.settings.name.trim();
  return n ? `${part}, ${n}` : part;
}

function renderToday() {
  const today = new Date(), k = dkey(today);
  $('#greet').textContent = greeting();
  $('#today-date').textContent = `${DAY_LONG[today.getDay()]}, ${today.getDate()} ${MONTHS[today.getMonth()]} ${today.getFullYear()}`;

  const todays = state.habits.filter(h => scheduledOn(h, today));
  const others = state.habits.filter(h => !scheduledOn(h, today));

  $('#list-today').innerHTML = todays.map(h => habitRow(h, k)).join('');
  $('#list-others').innerHTML = others.map(h => habitRow(h, k)).join('');
  $('#others-wrap').hidden = !others.length;
  $('#others-count').textContent = `(${others.length})`;

  const empty = $('#empty-today');
  if (!state.habits.length) {
    empty.hidden = false;
    empty.innerHTML = `<h3>Kebiasaan apa yang mau kamu jaga?</h3>
      <p>Pilih satu untuk mulai. Semuanya bisa diubah nanti, termasuk jam pengingatnya.</p>
      <div class="chips">${SUGGESTIONS.map((s, i) => `<button type="button" class="chip" data-suggest="${i}"><span aria-hidden="true">${s.icon}</span>${esc(s.name)}</button>`).join('')}</div>`;
  } else if (!todays.length) {
    empty.hidden = false;
    empty.innerHTML = `<h3>Hari bebas</h3><p>Tidak ada kebiasaan yang dijadwalkan untuk ${DAY_LONG[today.getDay()]}. Yang lain tetap bisa dicentang di bawah.</p>`;
  } else empty.hidden = true;

  renderDial();
  renderNotifyHint();
  updateBadge(todays.filter(h => !isDone(h, k)).length);
}

function habitRow(h, k) {
  const c = countOf(h, k), done = c >= h.target;
  const circ = 2 * Math.PI * 26;
  const frac = h.target ? c / h.target : 0;
  const streak = currentStreak(h);
  const multi = h.target > 1;
  const label = multi
    ? `${h.name}: ${c} dari ${h.target}${h.unit ? ' ' + h.unit : ''}. Tambah satu.`
    : `${h.name}: ${done ? 'sudah selesai, ketuk untuk membatalkan' : 'tandai selesai'}`;

  const meta = [];
  if (multi) meta.push(`<span class="m"><b>${c}</b> dari ${h.target}${h.unit ? ' ' + esc(h.unit) : ''}</span>${c > 0 ? `<button type="button" class="minus" data-minus="${h.id}" aria-label="Kurangi satu ${esc(h.name)}">&minus;1</button>` : ''}`);
  else if (h.unit) meta.push(`<span class="m">${esc(h.unit)}</span>`);
  if (streak > 0) meta.push(`<span class="m streak">🔥 ${streak} hari beruntun</span>`);
  if (h.reminders.length) meta.push(`<span class="m">${ICON_BELL}${h.reminders.map(fmtTime).join(', ')}</span>`);

  // 7 hari terakhir
  const strip = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = addDays(today, -i), dk = dkey(d);
    const cc = countOf(h, dk);
    const sched = h.days.includes(d.getDay());
    const cls = cc >= h.target ? 'full' : cc > 0 ? 'part' : sched ? '' : 'off';
    const state_ = cc >= h.target ? 'selesai' : cc > 0 ? `${cc} dari ${h.target}` : sched ? 'belum' : 'tidak dijadwalkan';
    strip.push(`<button type="button" class="${cls}${i === 0 ? ' is-today' : ''}" data-day="${dk}" data-hid="${h.id}"
      aria-label="${DAY_LONG[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}: ${state_}"><i></i><span>${DAY_SHORT[d.getDay()]}</span></button>`);
  }

  return `<li class="habit" style="--h:${h.color}">
    <button type="button" class="check${done ? ' done' : ''}" data-check="${h.id}" aria-label="${esc(label)}" ${multi ? '' : `aria-pressed="${done}"`}>
      <svg class="ring" viewBox="0 0 56 56" aria-hidden="true"><circle class="r-track" cx="28" cy="28" r="26"/><circle class="r-fill" cx="28" cy="28" r="26" stroke-dasharray="${(frac * circ).toFixed(1)} ${circ.toFixed(1)}"/></svg>
      <span class="emo" aria-hidden="true">${h.icon}</span>
      <span class="tick" aria-hidden="true">${ICON_CHECK}</span>
    </button>
    <div class="info">
      <p class="h-name">${esc(h.name)}</p>
      ${meta.length ? `<div class="h-meta">${meta.join('')}</div>` : ''}
    </div>
    <div class="strip" role="group" aria-label="7 hari terakhir ${esc(h.name)}">${strip.join('')}</div>
    <button type="button" class="icon-btn edit" data-edit="${h.id}" aria-label="Ubah ${esc(h.name)}">${ICON_EDIT}</button>
  </li>`;
}

/* ---------- Jam hari ini (dial 24 jam) ---------- */

const CX = 160, CY = 160, R_OUT = 138, R_MARK = 138, R_PROG = 92;
// Tengah malam di bawah, tengah hari di atas: matahari terbit di kiri, terbenam di kanan.
const angOf = m => ((m / 1440) * 360 + 180) % 360;
const pt = (r, a) => {
  const rad = a * Math.PI / 180;
  return [CX + r * Math.sin(rad), CY - r * Math.cos(rad)];
};
function arcPath(r, a0, a1) {
  const [x0, y0] = pt(r, a0), [x1, y1] = pt(r, a1);
  let sweep = (a1 - a0 + 360) % 360;
  const large = sweep > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}
function sector(r, a0, a1) {
  return `M${CX} ${CY} L${pt(r, a0).map(v => v.toFixed(2)).join(' ')} ${arcPath(r, a0, a1).replace(/^M[^A]+/, '')} Z`;
}

let sunMin = null; // posisi matahari saat animasi pembuka

function renderDial() {
  const svg = $('#dial');
  const today = new Date(), k = dkey(today);
  const nm = sunMin ?? nowMin();
  const todays = state.habits.filter(h => scheduledOn(h, today));
  const done = todays.filter(h => isDone(h, k)).length;

  let s = '';
  // latar siang/malam
  s += `<circle class="d-night" cx="${CX}" cy="${CY}" r="${R_OUT + 14}"/>`;
  s += `<path class="d-day" d="${sector(R_OUT + 14, angOf(360), angOf(1080))}"/>`;
  s += `<circle class="d-ring" cx="${CX}" cy="${CY}" r="${R_OUT}"/>`;
  // garis jam
  for (let hr = 0; hr < 24; hr++) {
    const a = angOf(hr * 60), major = hr % 6 === 0;
    const [x0, y0] = pt(R_OUT - (major ? 12 : 6), a), [x1, y1] = pt(R_OUT, a);
    s += `<line class="d-tick${major ? ' major' : ''}" x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}"/>`;
    if (major) {
      const [lx, ly] = pt(R_OUT - 26, a);
      s += `<text class="d-hour" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}">${pad(hr)}</text>`;
    }
  }
  // lintasan matahari sejak tengah malam
  if (nm > 2) s += `<path class="d-sunpath" d="${arcPath(R_OUT, angOf(0), angOf(nm))}"/>`;
  // cincin progres
  const circ = 2 * Math.PI * R_PROG;
  const frac = todays.length ? done / todays.length : 0;
  s += `<circle class="d-track" cx="${CX}" cy="${CY}" r="${R_PROG}"/>`;
  s += `<circle class="d-prog" cx="${CX}" cy="${CY}" r="${R_PROG}" transform="rotate(-90 ${CX} ${CY})" stroke-dasharray="${(frac * circ).toFixed(1)} ${circ.toFixed(1)}"${frac === 0 ? ' stroke-opacity="0"' : ''}/>`;
  // angka tengah
  if (todays.length) {
    s += `<text class="d-count" x="${CX}" y="${CY - 8}">${done}/${todays.length}</text>`;
    s += `<text class="d-label" x="${CX}" y="${CY + 34}">${done === todays.length ? 'semua beres 🎉' : 'selesai hari ini'}</text>`;
  } else {
    s += `<text class="d-label" x="${CX}" y="${CY + 5}">${state.habits.length ? 'hari bebas' : 'belum ada kebiasaan'}</text>`;
  }
  // matahari
  const [sx, sy] = pt(R_OUT, angOf(nm));
  s += `<circle class="d-sunglow" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="16"/>`;
  s += `<circle class="d-sun" cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}" r="9"><title>Sekarang</title></circle>`;
  // penanda kebiasaan di jam pengingatnya
  const slots = {};
  for (const h of todays) {
    const hd = isDone(h, k);
    for (const t of h.reminders) {
      const m = toMin(t), bucket = Math.round(m / 20);
      const idx = slots[bucket] = (slots[bucket] ?? -1) + 1;
      const r = R_MARK - Math.min(idx, 2) * 22; // jam yang berdekatan ditumpuk ke dalam
      const [x, y] = pt(r, angOf(m));
      s += `<g data-edit="${h.id}"><circle class="d-mark ${hd ? 'done' : 'todo'}" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="10" stroke="${h.color}"${hd ? ` fill="${h.color}"` : ''}><title>${esc(h.name)}, ${fmtTime(t)}${hd ? ' (selesai)' : ''}</title></circle>`;
      if (hd) s += `<path class="d-markdone" d="M${(x - 4).toFixed(1)} ${y.toFixed(1)} l3 3 l5 -6"/>`;
      s += `</g>`;
    }
  }
  svg.innerHTML = s;
  svg.setAttribute('aria-label', todays.length
    ? `Jam hari ini: ${done} dari ${todays.length} kebiasaan selesai. Sekarang pukul ${pad(Math.floor(nowMin() / 60))}.${pad(nowMin() % 60)}.`
    : 'Jam hari ini: tidak ada kebiasaan terjadwal.');

  // teks pengingat berikutnya
  const cap = $('#dial-caption');
  const nx = nextReminder();
  if (!state.habits.length) cap.textContent = 'Kebiasaanmu akan muncul di jam pengingatnya.';
  else if (nx) cap.innerHTML = `Pengingat berikutnya jam <b>${fmtTime(nx.t)}</b>: ${esc(nx.h.icon)} ${esc(nx.h.name)}`;
  else if (todays.length && done === todays.length) cap.textContent = 'Tidak ada lagi yang perlu diingatkan hari ini.';
  else cap.textContent = 'Tidak ada pengingat tersisa hari ini.';
}

function nextReminder() {
  const today = new Date(), k = dkey(today), m = nowMin();
  let best = null;
  for (const h of state.habits) {
    if (!scheduledOn(h, today) || isDone(h, k)) continue;
    for (const t of h.reminders) {
      const tm = toMin(t);
      if (tm > m && (!best || tm < toMin(best.t))) best = { h, t };
    }
  }
  return best;
}

function introSun() {
  if (reduceMotion()) return;
  const target = nowMin(), t0 = performance.now(), dur = 1400;
  const step = now => {
    const p = Math.min(1, (now - t0) / dur);
    const e = 1 - Math.pow(1 - p, 3);
    sunMin = target * e;
    renderDial();
    if (p < 1) requestAnimationFrame(step); else { sunMin = null; renderDial(); }
  };
  requestAnimationFrame(step);
}

/* ---------- Render: Statistik ---------- */

function renderStats() {
  const hs = state.habits;
  const w = rate(hs, 7), m = rate(hs, 30);
  let top = null;
  for (const h of hs) { const s = currentStreak(h); if (!top || s > top.s) top = { h, s }; }
  $('#stat-sum').innerHTML = hs.length ? `
    <div><b>${w.pct == null ? '–' : w.pct + '%'}</b><span>7 hari terakhir</span>${w.need ? `<small>${w.got} dari ${w.need}</small>` : ''}</div>
    <div><b>${m.pct == null ? '–' : m.pct + '%'}</b><span>30 hari terakhir</span>${m.need ? `<small>${m.got} dari ${m.need}</small>` : ''}</div>
    <div><b>${top ? top.s : 0}</b><span>hari beruntun</span>${top && top.s ? `<small>${esc(top.h.icon)} ${esc(top.h.name)}</small>` : ''}</div>`
    : `<div><b>–</b><span>Belum ada kebiasaan. Tambahkan dari halaman Hari ini.</span></div>`;

  const sel = $('#heat-filter');
  const cur = sel.value || 'all';
  sel.innerHTML = `<option value="all">Semua kebiasaan</option>` + hs.map(h => `<option value="${h.id}">${h.icon} ${esc(h.name)}</option>`).join('');
  sel.value = hs.some(h => h.id === cur) ? cur : 'all';
  renderHeat();

  const today = new Date();
  $('#stat-list').innerHTML = hs.map(h => {
    const r30 = rate([h], 30);
    const bars = [];
    for (let i = 29; i >= 0; i--) {
      const d = addDays(today, -i), k = dkey(d), c = countOf(h, k);
      const sched = scheduledOn(h, d);
      bars.push(`<i class="${c >= h.target ? 'on' : c > 0 ? 'part' : sched ? '' : 'off'}"></i>`);
    }
    return `<li style="--h:${h.color}">
      <div class="st-top"><span class="n">${h.icon} ${esc(h.name)}</span></div>
      <div class="st-nums">
        <span>Beruntun <b>${currentStreak(h)}</b></span>
        <span>Terbaik <b>${bestStreak(h)}</b></span>
        <span>30 hari <b>${r30.pct == null ? '–' : r30.pct + '%'}</b></span>
      </div>
      <div class="bars" aria-hidden="true">${bars.join('')}</div>
    </li>`;
  }).join('');
}

function renderHeat() {
  const id = $('#heat-filter').value;
  const hs = id === 'all' ? state.habits : state.habits.filter(h => h.id === id);
  const ws = Number(state.settings.weekStart);
  const today = new Date(), tk = dkey(today);
  const offset = (today.getDay() - ws + 7) % 7;
  const start = addDays(today, -offset - 19 * 7);

  let html = '<span class="dl"></span>';
  for (let r = 0; r < 7; r++) {
    const dow = (ws + r) % 7;
    html += `<span class="dl">${r % 2 === 0 ? DAY_SHORT[dow] : ''}</span>`;
  }
  let lastMonth = -1, filled = 0, total = 0;
  for (let w = 0; w < 20; w++) {
    const wd = addDays(start, w * 7);
    const mo = wd.getMonth();
    html += `<span class="lbl">${mo !== lastMonth ? MONTHS_SHORT[mo] : ''}</span>`;
    lastMonth = mo;
    for (let r = 0; r < 7; r++) {
      const d = addDays(wd, r), k = dkey(d);
      if (k > tk) { html += '<span class="c future"></span>'; continue; }
      const sched = hs.filter(h => scheduledOn(h, d));
      if (!sched.length) { html += `<span class="c none" title="${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}: tidak ada jadwal"></span>`; continue; }
      const got = sched.reduce((a, h) => a + Math.min(1, countOf(h, k) / h.target), 0);
      const p = got / sched.length;
      const l = p === 0 ? 0 : p < .34 ? 1 : p < .67 ? 2 : p < 1 ? 3 : 4;
      total++; if (p >= 1) filled++;
      html += `<span class="c${k === tk ? ' today' : ''}" data-l="${l}" title="${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}: ${Math.round(p * 100)}%"></span>`;
    }
  }
  const heat = $('#heat');
  heat.innerHTML = html;
  heat.setAttribute('aria-label', `Peta 20 minggu: ${filled} dari ${total} hari terjadwal tuntas.`);
  const sc = heat.parentElement; sc.scrollLeft = sc.scrollWidth; // minggu terbaru di kanan
}

/* ---------- Render: Atur ---------- */

function renderSettings() {
  const s = state.settings;
  $('#set-name').value = s.name;
  $('#theme-picker').innerHTML = THEMES.map(t => `<label class="theme-opt">
    <input type="radio" name="theme" value="${t.id}" ${s.theme === t.id ? 'checked' : ''}>
    <span><i style="background:${t.accent};--sw-sun:${t.sun}"></i>${t.name}</span></label>`).join('');
  $$('#mode-picker input').forEach(i => { i.checked = i.value === s.mode; });
  $$('#week-picker input').forEach(i => { i.checked = Number(i.value) === Number(s.weekStart); });
  $('#set-sound').checked = !!s.sound;

  $('#manage-list').innerHTML = state.habits.length ? state.habits.map((h, i) => `<li style="--h:${h.color}">
      <span class="dot" aria-hidden="true"></span>
      <span class="n">${h.icon} ${esc(h.name)}<small>${daysText(h.days)}${h.reminders.length ? ', jam ' + h.reminders.map(fmtTime).join(', ') : ''}</small></span>
      <button type="button" class="icon-btn" data-move="${h.id}" data-dir="-1" ${i === 0 ? 'disabled' : ''} aria-label="Naikkan ${esc(h.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 14l6-6 6 6"/></svg></button>
      <button type="button" class="icon-btn" data-move="${h.id}" data-dir="1" ${i === state.habits.length - 1 ? 'disabled' : ''} aria-label="Turunkan ${esc(h.name)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 10l6 6 6-6"/></svg></button>
      <button type="button" class="icon-btn" data-edit="${h.id}" aria-label="Ubah ${esc(h.name)}">${ICON_EDIT}</button>
    </li>`).join('') : '<li class="empty-note">Belum ada kebiasaan.</li>';

  renderPerm();
  renderCalList();
}

function daysText(days) {
  const set = [...days].sort();
  if (set.length === 7) return 'Setiap hari';
  if (set.join() === '1,2,3,4,5') return 'Senin sampai Jumat';
  if (set.join() === '0,6') return 'Akhir pekan';
  const ws = Number(state.settings.weekStart);
  return set.sort((a, b) => ((a - ws + 7) % 7) - ((b - ws + 7) % 7)).map(d => DAY_SHORT[d]).join(', ');
}

function renderCalList() {
  const withRem = state.habits.filter(h => h.reminders.length);
  $('#btn-ics-all').disabled = !withRem.length;
  $('#cal-list').innerHTML = withRem.length ? withRem.map(h => `<li style="--h:${h.color}">
      <span class="n">${h.icon} ${esc(h.name)}<small>${daysText(h.days)}, jam ${h.reminders.map(fmtTime).join(', ')}</small></span>
      <span class="acts">
        <button type="button" class="btn ghost small" data-ics="${h.id}">Unduh .ics</button>
        ${h.reminders.map(t => `<a class="btn ghost small" href="${gcalUrl(h, t)}" target="_blank" rel="noopener">Google Calendar ${fmtTime(t)}</a>`).join('')}
      </span>
    </li>`).join('') : '<li class="none">Belum ada kebiasaan dengan jam pengingat. Tambahkan jam di pengaturan kebiasaan.</li>';
}

/* ---------- Editor ---------- */

const dlg = $('#editor');
let editingId = null;
let draftTimes = [];

function openEditor(id = null, preset = null) {
  editingId = id;
  const h = id ? state.habits.find(x => x.id === id) : null;
  const src = h || preset || { name: '', icon: ICONS[0], color: COLORS[state.habits.length % COLORS.length].hex, days: [0, 1, 2, 3, 4, 5, 6], target: 1, unit: '', reminders: [], note: '' };

  $('#ed-title').textContent = h ? 'Ubah kebiasaan' : 'Kebiasaan baru';
  $('#ed-delete').hidden = !h;
  $('#suggest').hidden = !!h;
  $('#suggest-chips').innerHTML = SUGGESTIONS.map((s, i) => `<button type="button" class="chip" data-fill="${i}"><span aria-hidden="true">${s.icon}</span>${esc(s.name)}</button>`).join('');

  fillForm(src);
  $$('.err', dlg).forEach(e => { e.hidden = true; });
  $('#ed-name').removeAttribute('aria-invalid');
  dlg.showModal();
  if (!h && matchMedia('(pointer:fine)').matches) $('#ed-name').focus();
}

function fillForm(src) {
  $('#ed-name').value = src.name;
  const icons = ICONS.includes(src.icon) ? ICONS : [src.icon, ...ICONS];
  $('#ed-icons').innerHTML = icons.map(ic => `<label><input type="radio" name="icon" value="${ic}" ${ic === src.icon ? 'checked' : ''} aria-label="Ikon ${ic}"><span aria-hidden="true">${ic}</span></label>`).join('');
  $('#ed-colors').innerHTML = COLORS.map(c => `<label><input type="radio" name="color" value="${c.hex}" ${c.hex.toLowerCase() === src.color.toLowerCase() ? 'checked' : ''} aria-label="${c.name}"><span style="--c:${c.hex}">${ICON_CHECK}</span></label>`).join('');
  const ws = Number(state.settings.weekStart);
  $('#ed-days').innerHTML = [0, 1, 2, 3, 4, 5, 6].map(i => (ws + i) % 7).map(d => `<label><input type="checkbox" name="days" value="${d}" ${src.days.includes(d) ? 'checked' : ''} aria-label="${DAY_LONG[d]}"><span aria-hidden="true">${DAY_SHORT[d]}</span></label>`).join('');
  $('#ed-target').value = src.target;
  $('#ed-unit').value = src.unit || '';
  $('#ed-note').value = src.note || '';
  draftTimes = [...src.reminders];
  renderTimes();
}

function renderTimes() {
  $('#ed-times').innerHTML = draftTimes.length ? draftTimes.map((t, i) => `<li>
      <input type="time" value="${t}" data-time="${i}" aria-label="Jam pengingat ${i + 1}" required>
      <button type="button" class="icon-btn" data-deltime="${i}" aria-label="Hapus jam ${fmtTime(t)}"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
    </li>`).join('') : '<li class="none">Tanpa pengingat. Kebiasaan tetap muncul di daftar harian.</li>';
}

function submitEditor(e) {
  e.preventDefault();
  const name = $('#ed-name').value.trim();
  const days = $$('#ed-days input:checked').map(i => Number(i.value));
  let ok = true;
  $('#err-name').hidden = !!name;
  $('#ed-name').toggleAttribute('aria-invalid', !name);
  if (!name) { ok = false; $('#ed-name').focus(); }
  $('#err-days').hidden = days.length > 0;
  if (!days.length) ok = false;
  if (!ok) return;

  const data = {
    name,
    icon: ($('#ed-icons input:checked') || {}).value || '🎯',
    color: ($('#ed-colors input:checked') || {}).value || COLORS[0].hex,
    days: days.sort(),
    target: Math.max(1, Math.min(99999, parseInt($('#ed-target').value, 10) || 1)),
    unit: $('#ed-unit').value.trim(),
    reminders: [...new Set(draftTimes.filter(t => /^\d\d:\d\d$/.test(t)))].sort(),
    note: $('#ed-note').value.trim(),
  };

  if (editingId) {
    const h = state.habits.find(x => x.id === editingId);
    Object.assign(h, data);
    toast(`<b>${esc(data.name)}</b> diperbarui.`);
  } else {
    state.habits.push({ id: uid(), created: dkey(new Date()), ...data });
    toast(`<b>${esc(data.name)}</b> ditambahkan.`);
    if (data.reminders.length && 'Notification' in window && Notification.permission === 'default') {
      setTimeout(() => toast('Mau diingatkan lewat notifikasi?', { label: 'Izinkan', run: askPermission }), 700);
    }
  }
  save();
  dlg.close();
  renderAll();
}

dlg.addEventListener('click', e => {
  if (e.target === dlg) { dlg.close(); return; } // klik di luar kotak
  const t = e.target.closest('button');
  if (!t) return;
  if (t.hasAttribute('data-close')) dlg.close();
  else if (t.dataset.fill != null) {
    const s = SUGGESTIONS[Number(t.dataset.fill)];
    fillForm(s);
  } else if (t.dataset.days) {
    const set = { all: [0, 1, 2, 3, 4, 5, 6], work: [1, 2, 3, 4, 5], end: [0, 6] }[t.dataset.days];
    $$('#ed-days input').forEach(i => { i.checked = set.includes(Number(i.value)); });
    $('#err-days').hidden = true;
  } else if (t.id === 'ed-add-time') {
    const last = draftTimes[draftTimes.length - 1];
    let next = '08:00';
    if (last) { const m = Math.min(toMin(last) + 180, 23 * 60 + 30); next = `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }
    draftTimes.push(next);
    renderTimes();
    $(`[data-time="${draftTimes.length - 1}"]`).focus();
  } else if (t.dataset.deltime != null) {
    draftTimes.splice(Number(t.dataset.deltime), 1);
    renderTimes();
  } else if (t.id === 'ed-delete') {
    const h = state.habits.find(x => x.id === editingId);
    if (!h || !confirm(`Hapus "${h.name}" beserta seluruh catatannya?`)) return;
    state.habits = state.habits.filter(x => x.id !== h.id);
    for (const k of Object.keys(state.log)) { delete state.log[k][h.id]; if (!Object.keys(state.log[k]).length) delete state.log[k]; }
    save(); dlg.close(); renderAll();
    toast(`<b>${esc(h.name)}</b> dihapus.`);
  }
});
dlg.addEventListener('input', e => {
  if (e.target.dataset.time != null) draftTimes[Number(e.target.dataset.time)] = e.target.value;
  if (e.target.id === 'ed-name' && e.target.value.trim()) { $('#err-name').hidden = true; e.target.removeAttribute('aria-invalid'); }
  if (e.target.name === 'days') $('#err-days').hidden = true;
});
$('#ed-form').addEventListener('submit', submitEditor);

/* ---------- Interaksi daftar ---------- */

document.addEventListener('click', e => {
  if (e.target.closest('dialog')) return;
  const b = e.target.closest('button, g[data-edit]');
  if (!b) return;
  unlockAudio();
  const k = dkey(new Date());

  if (b.dataset.action === 'new') return openEditor();
  if (b.dataset.suggest != null) return openEditor(null, SUGGESTIONS[Number(b.dataset.suggest)]);
  if (b.dataset.edit) return openEditor(b.dataset.edit);

  if (b.dataset.check) {
    const h = state.habits.find(x => x.id === b.dataset.check);
    const c = countOf(h, k);
    const wasDone = c >= h.target;
    setCount(h, k, h.target > 1 ? (wasDone ? 0 : c + 1) : (wasDone ? 0 : 1));
    renderToday();
    const nowDone = isDone(h, k);
    if (!wasDone && nowDone) {
      celebrate(h);
      const s = currentStreak(h);
      toast(s > 1 ? `${h.icon} <b>${esc(h.name)}</b> selesai. ${s} hari beruntun!` : `${h.icon} <b>${esc(h.name)}</b> selesai.`,
        { label: 'Batalkan', run: () => { setCount(h, k, c); renderToday(); } });
    }
    $(`[data-check="${h.id}"]`)?.focus();
    return;
  }
  if (b.dataset.minus) {
    const h = state.habits.find(x => x.id === b.dataset.minus);
    setCount(h, k, countOf(h, k) - 1);
    renderToday();
    $(`[data-check="${h.id}"]`)?.focus();
    return;
  }
  if (b.dataset.day) {
    const h = state.habits.find(x => x.id === b.dataset.hid);
    const dk = b.dataset.day;
    setCount(h, dk, isDone(h, dk) ? 0 : h.target);
    renderToday();
    $(`[data-day="${dk}"][data-hid="${h.id}"]`)?.focus();
    return;
  }
  if (b.dataset.move) {
    const i = state.habits.findIndex(x => x.id === b.dataset.move), j = i + Number(b.dataset.dir);
    if (j < 0 || j >= state.habits.length) return;
    [state.habits[i], state.habits[j]] = [state.habits[j], state.habits[i]];
    save(); renderSettings(); renderToday();
    const again = $(`[data-move="${b.dataset.move}"][data-dir="${b.dataset.dir}"]`);
    (again && !again.disabled ? again : $(`[data-move="${b.dataset.move}"]:not([disabled])`))?.focus();
    return;
  }
  if (b.dataset.ics) {
    const h = state.habits.find(x => x.id === b.dataset.ics);
    download(`rutin-${slug(h.name)}.ics`, buildIcs([h]), 'text/calendar');
  }
});

function celebrate(h) {
  if (reduceMotion()) return;
  const el = $(`[data-check="${h.id}"]`);
  el?.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.15)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.3,1.6,.5,1)' });
}

/* ---------- Pengaturan ---------- */

$('#set-name').addEventListener('input', e => { state.settings.name = e.target.value; save(); $('#greet').textContent = greeting(); });
$('#theme-picker').addEventListener('change', e => { state.settings.theme = e.target.value; save(); applyTheme(); renderToday(); });
$('#mode-picker').addEventListener('change', e => { state.settings.mode = e.target.value; save(); applyTheme(); });
$('#week-picker').addEventListener('change', e => { state.settings.weekStart = Number(e.target.value); save(); renderSettings(); });
$('#set-sound').addEventListener('change', e => { state.settings.sound = e.target.checked; save(); if (e.target.checked) chime(); });
$('#heat-filter').addEventListener('change', renderHeat);

$('#btn-export').addEventListener('click', () => {
  download(`rutin-cadangan-${dkey(new Date())}.json`, JSON.stringify(state, null, 2), 'application/json');
  toast('Cadangan tersimpan di folder unduhan.');
});
$('#file-import').addEventListener('change', async e => {
  const f = e.target.files[0];
  e.target.value = '';
  if (!f) return;
  try {
    const data = JSON.parse(await f.text());
    if (!Array.isArray(data.habits)) throw new Error('format');
    if (!confirm(`Ganti data sekarang dengan cadangan berisi ${data.habits.length} kebiasaan?`)) return;
    state = normalize(data);
    save(); applyTheme(); renderAll();
    toast('Cadangan dipulihkan.');
  } catch {
    toast('Berkas itu bukan cadangan Rutin. Pilih berkas .json yang dibuat lewat "Simpan cadangan".');
  }
});
$('#btn-reset').addEventListener('click', () => {
  if (!confirm('Hapus semua kebiasaan dan catatan? Tindakan ini tidak bisa dibatalkan.')) return;
  state = defaults();
  save(); applyTheme(); renderAll();
  toast('Semua data dihapus.');
});

/* ---------- Notifikasi ---------- */

let swReg = null;
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').then(r => { swReg = r; }).catch(() => {});
  navigator.serviceWorker.addEventListener('message', e => {
    if (e.data && e.data.type === 'done') markFromNotification(e.data.id, e.data.date);
  });
}

function permState() {
  if (!('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

function renderPerm() {
  const p = permState(), el = $('#perm-status'), btn = $('#btn-perm');
  el.className = 'perm';
  if (p === 'granted') { el.textContent = 'Notifikasi aktif.'; el.classList.add('ok'); btn.hidden = true; }
  else if (p === 'denied') { el.textContent = 'Notifikasi diblokir. Buka pengaturan situs di browser (ikon gembok di bilah alamat), izinkan notifikasi, lalu muat ulang halaman ini.'; btn.hidden = true; }
  else if (p === 'unsupported') { el.textContent = 'Browser ini tidak mendukung notifikasi. Di iPhone, pasang Rutin ke layar utama dulu (Bagikan, lalu Tambah ke Layar Utama), atau pakai kalender di bawah.'; btn.hidden = true; }
  else { el.textContent = 'Notifikasi belum diizinkan.'; btn.hidden = false; }
}

function renderNotifyHint() {
  const el = $('#notify-hint');
  const hasRem = state.habits.some(h => h.reminders.length);
  const p = permState();
  if (!hasRem || p === 'granted' || sessionStorage.getItem('rutin.hint.off')) { el.hidden = true; return; }
  el.hidden = false;
  const msg = p === 'denied' ? 'Notifikasi diblokir di browser ini.' : 'Browser ini belum bisa menampilkan notifikasi.';
  el.innerHTML = p === 'default'
    ? `<p>Izinkan notifikasi supaya pengingat muncul tepat di jamnya.</p><span><button type="button" class="btn primary small" id="hint-perm">Izinkan</button> <button type="button" class="link" id="hint-off">Nanti</button></span>`
    : `<p>${msg} Sambungkan pengingat ke kalender HP supaya alarmnya tetap bunyi.</p><span><a class="btn ghost small" href="#pengingat">Sambungkan ke kalender</a> <button type="button" class="link" id="hint-off">Tutup</button></span>`;
  $('#hint-perm')?.addEventListener('click', askPermission);
  $('#hint-off')?.addEventListener('click', () => { sessionStorage.setItem('rutin.hint.off', '1'); el.hidden = true; });
}

async function askPermission() {
  if (!('Notification' in window)) return;
  try {
    const r = await Notification.requestPermission();
    if (r === 'granted') { toast('Notifikasi aktif. Coba ketuk "Coba bunyikan" di Atur.'); }
    else toast('Notifikasi tidak diizinkan. Pengingat tetap tampil di dalam Rutin saat terbuka.');
  } catch {}
  renderPerm(); renderNotifyHint();
}
$('#btn-perm').addEventListener('click', askPermission);
$('#btn-test').addEventListener('click', () => {
  unlockAudio();
  const h = state.habits[0] || { id: 'contoh', name: 'Contoh pengingat', icon: '⏰', color: '#3F3DBC', target: 1, unit: '' };
  fireReminder(h, fmtTime(`${pad(new Date().getHours())}:${pad(new Date().getMinutes())}`), true);
});

const iconCache = {};
function notifIcon(h) {
  const key = h.icon + h.color;
  if (iconCache[key]) return iconCache[key];
  try {
    const c = document.createElement('canvas'); c.width = c.height = 192;
    const x = c.getContext('2d');
    x.fillStyle = h.color; x.beginPath(); x.arc(96, 96, 96, 0, Math.PI * 2); x.fill();
    x.font = '104px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(h.icon, 96, 104);
    return (iconCache[key] = c.toDataURL('image/png'));
  } catch { return 'icon-192.png'; }
}

function reminderBody(h, time) {
  const c = countOf(h, dkey(new Date()));
  if (h.target > 1) return `Jam ${time}. Baru ${c} dari ${h.target}${h.unit ? ' ' + h.unit : ''}, ayo lanjut.`;
  return h.note ? `Jam ${time}. ${h.note}` : `Jam ${time}. Waktunya ${h.name.charAt(0).toLowerCase() + h.name.slice(1)}.`;
}

async function fireReminder(h, time, test = false) {
  const date = dkey(new Date());
  const title = `${h.icon} ${h.name}`;
  const body = reminderBody(h, time);
  let shown = false;
  if (permState() === 'granted') {
    const opts = {
      body, tag: 'rutin-' + h.id, renotify: true, icon: notifIcon(h), badge: 'icon-192.png',
      data: { id: h.id, date }, vibrate: [200, 100, 200],
      actions: test ? [] : [{ action: 'done', title: h.target > 1 ? 'Tambah 1' : 'Tandai selesai' }],
    };
    try {
      const reg = swReg || (navigator.serviceWorker && await navigator.serviceWorker.getRegistration());
      if (reg) { await reg.showNotification(title, opts); shown = true; }
      else { new Notification(title, opts); shown = true; }
    } catch {}
  }
  if (state.settings.sound) { chime(); navigator.vibrate?.([200, 100, 200]); }
  if (document.visibilityState === 'visible' || !shown) {
    toast(`<b>${esc(title)}</b><br>${esc(body)}`, test || !state.habits.some(x => x.id === h.id) ? null : {
      label: h.target > 1 ? 'Tambah 1' : 'Selesai', run: () => markFromNotification(h.id, date),
    }, 12000);
  }
}

function markFromNotification(id, date) {
  const h = state.habits.find(x => x.id === id);
  if (!h) return;
  const k = date || dkey(new Date());
  setCount(h, k, h.target > 1 ? countOf(h, k) + 1 : h.target);
  renderAll();
  toast(`${h.icon} <b>${esc(h.name)}</b> ${isDone(h, k) ? 'selesai' : `jadi ${countOf(h, k)} dari ${h.target}`}.`);
}

function loadFired(k) {
  try { const f = JSON.parse(localStorage.getItem(FIRED_KEY)); return f && f.date === k ? f.list : []; }
  catch { return []; }
}

function checkReminders() {
  const now = new Date(), k = dkey(now), m = nowMin();
  const fired = loadFired(k);
  let changed = false;
  for (const h of state.habits) {
    if (!scheduledOn(h, now) || isDone(h, k)) continue;
    for (const t of h.reminders) {
      const tm = toMin(t), tag = h.id + '@' + t;
      // terlambat sampai 15 menit masih dibunyikan (mis. HP baru dibuka)
      if (m >= tm && m - tm <= 15 && !fired.includes(tag)) {
        fired.push(tag); changed = true;
        fireReminder(h, fmtTime(t));
      }
    }
  }
  if (changed) try { localStorage.setItem(FIRED_KEY, JSON.stringify({ date: k, list: fired })); } catch {}
}

function updateBadge(n) {
  try { if (n > 0) navigator.setAppBadge?.(n); else navigator.clearAppBadge?.(); } catch {}
}

/* ---------- Bunyi ---------- */

let audio = null;
function unlockAudio() {
  if (audio) return;
  try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
}
function chime() {
  if (!audio) unlockAudio();
  if (!audio) return;
  if (audio.state === 'suspended') audio.resume();
  const t = audio.currentTime;
  [[784, 0], [1047, .18], [1319, .36]].forEach(([f, d]) => {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t + d);
    g.gain.linearRampToValueAtTime(.22, t + d + .02);
    g.gain.exponentialRampToValueAtTime(.001, t + d + .9);
    o.connect(g).connect(audio.destination);
    o.start(t + d); o.stop(t + d + 1);
  });
}

/* ---------- Kalender (.ics & Google Calendar) ---------- */

function nextDateFor(h) {
  let d = new Date();
  for (let i = 0; i < 7; i++) { if (h.days.includes(d.getDay())) return d; d = addDays(d, 1); }
  return new Date();
}
const icsDate = (d, t) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${t.replace(':', '')}00`;
const icsEsc = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
function endTime(t) { const m = Math.min(toMin(t) + 10, 23 * 60 + 59); return `${pad(Math.floor(m / 60))}:${pad(m % 60)}`; }
function rrule(h) { return `RRULE:FREQ=${h.days.length === 7 ? 'DAILY' : 'WEEKLY;BYDAY=' + [...h.days].sort().map(d => DAY_ICAL[d]).join(',')}`; }

function fold(line) {
  // baris iCalendar maksimal 75 oktet
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out = []; let cur = '';
  for (const ch of line) {
    if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ''; }
    cur += ch;
  }
  out.push(cur);
  return out.join('\r\n ');
}

function buildIcs(habits) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Rutin//Habit Tracker//ID', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Rutin'];
  for (const h of habits) {
    const d = nextDateFor(h);
    for (const t of h.reminders) {
      const body = h.target > 1 ? `Target ${h.target}${h.unit ? ' ' + h.unit : ''} hari ini.` : (h.note || 'Pengingat dari Rutin.');
      L.push('BEGIN:VEVENT',
        `UID:rutin-${h.id}-${t.replace(':', '')}@rutin`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${icsDate(d, t)}`,
        `DTEND:${icsDate(d, endTime(t))}`,
        rrule(h),
        `SUMMARY:${icsEsc(`${h.icon} ${h.name}`)}`,
        `DESCRIPTION:${icsEsc(body + ' Centang di Rutin setelah selesai.')}`,
        'TRANSP:TRANSPARENT',
        'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(h.name)}`, 'TRIGGER:PT0M', 'END:VALARM',
        'END:VEVENT');
    }
  }
  L.push('END:VCALENDAR');
  return L.map(fold).join('\r\n') + '\r\n';
}

function gcalUrl(h, t) {
  const d = nextDateFor(h);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${h.icon} ${h.name}`,
    dates: `${icsDate(d, t)}/${icsDate(d, endTime(t))}`,
    details: (h.target > 1 ? `Target ${h.target}${h.unit ? ' ' + h.unit : ''} hari ini. ` : '') + 'Pengingat dari Rutin.',
    recur: rrule(h),
  });
  return 'https://calendar.google.com/calendar/render?' + p.toString();
}

$('#btn-ics-all').addEventListener('click', () => {
  const hs = state.habits.filter(h => h.reminders.length);
  if (!hs.length) return;
  download('rutin-pengingat.ics', buildIcs(hs), 'text/calendar');
  toast('Berkas kalender terunduh. Buka berkasnya untuk menambahkan alarm.');
});

const slug = s => s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'kebiasaan';
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type: type + ';charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ---------- Toast ---------- */

function toast(html, action = null, ms = 5000) {
  const box = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<p>${html}</p>${action ? `<button type="button">${esc(action.label)}</button>` : ''}<button type="button" class="x" aria-label="Tutup">✕</button>`;
  const close = () => el.remove();
  if (action) el.querySelector('button').addEventListener('click', () => { action.run(); close(); });
  el.querySelector('.x').addEventListener('click', close);
  box.appendChild(el);
  while (box.children.length > 3) box.firstChild.remove();
  setTimeout(close, ms);
}

/* ---------- Mulai ---------- */

function renderAll() {
  renderToday();
  if (!$('#view-statistik').hidden) renderStats();
  if (!$('#view-atur').hidden) renderSettings();
}

function handleUrlAction() {
  const q = new URLSearchParams(location.search);
  if (q.get('done')) markFromNotification(q.get('done'), q.get('date'));
  if (q.has('done') || q.has('new')) {
    if (q.has('new')) openEditor();
    history.replaceState(null, '', location.pathname + location.hash);
  }
}

let lastDay = dkey(new Date());
function tick() {
  const k = dkey(new Date());
  if (k !== lastDay) { lastDay = k; renderAll(); }
  else if (sunMin == null) renderDial();
  checkReminders();
}

applyTheme();
route();
renderToday();
introSun();
handleUrlAction();
checkReminders();
setInterval(tick, 20000);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') tick(); });
