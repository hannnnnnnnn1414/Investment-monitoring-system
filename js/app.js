/* ============ Investment Monitoring System — PT Kayaba ============ */
/* Frontend terhubung database via api.php (PHP + MySQL) */

const ICONS = {
  executive: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  budget: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
  production: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  benefit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  action: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>'
};

const PAGES = [
  { id: 'executive', label: 'Executive Dashboard', icon: 'executive' },
  { id: 'progress',  label: 'Investment Progress', icon: 'progress' },
  { id: 'budget',    label: 'Budget Monitoring', icon: 'budget' },
  { id: 'production',label: 'Production Performance', icon: 'production' },
  { id: 'benefit',   label: 'Benefit Dashboard', icon: 'benefit' },
  { id: 'action',    label: 'Action Tracker', icon: 'action' },
  { id: 'review',    label: 'Review P&B', icon: 'action' }
];

const STAGES = ['Draft', 'Under Review', 'Ready for Approval', 'BOD', 'AOP Analyst', 'BOD AOP', 'Revision Needed', 'Approved', 'Rejected', 'Fabrication', 'Install & Trial', 'PCR', 'MassPro'];

const STAGE_COLOR = {
  'Draft':              { bg: '#EEF0F3', fg: '#6B7280' },
  'Under Review':       { bg: '#FDF1DF', fg: '#B57A12' },
  'Ready for Approval': { bg: '#E8EFFA', fg: '#2F6DB3' },
  'BOD':                { bg: '#EDE8FB', fg: '#6C4FD1' },
  'AOP Analyst':        { bg: '#E0F2F9', fg: '#0E7EA6' },
  'BOD AOP':            { bg: '#E3F5EC', fg: '#1FA463' },
  'Revision Needed':    { bg: '#FDEAEE', fg: '#CE3E6B' },
  'Approved':           { bg: '#E3F5EC', fg: '#1FA463' },
  'Rejected':           { bg: '#FBEAEB', fg: '#D2232A' },
  'Fabrication':        { bg: '#EDE8FB', fg: '#6C4FD1' },
  'Install & Trial':    { bg: '#FDEAEE', fg: '#CE3E6B' },
  'PCR':                { bg: '#FDF1DF', fg: '#B57A12' },
  'MassPro':            { bg: '#FBEAEB', fg: '#D2232A' }
};

const ACTION_STATUS = {
  'open':        { label: 'Open', color: '#D2232A' },
  'in-progress': { label: 'In Progress', color: '#F2A33C' },
  'done':        { label: 'Done', color: '#1FA463' }
};

const API = 'api.php';

/* Data global — diisi dari database via API */
let investments = [];
let actions = [];

/* ================= Helpers ================= */
const $ = (sel, root) => (root || document).querySelector(sel);

function rupiah(n) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function compact(n) {
  if (n >= 1e9) return 'Rp ' + (n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 2 }) + ' M';
  if (n >= 1e6) return 'Rp ' + (n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 }) + ' Jt';
  return rupiah(n);
}

function stageBadge(stage) {
  const c = STAGE_COLOR[stage] || { bg: '#EEF0F3', fg: '#6B7280' };
  return '<span class="badge" style="background:' + c.bg + ';color:' + c.fg + '">' + stage + '</span>';
}

function kpiOf(inv) {
  if (!inv.fs_target || inv.fs_target <= 0) return null;
  return Math.round((inv.fs_actual / inv.fs_target) * 100);
}

function sumPay(inv) {
  return Number(inv.pay_dp) + Number(inv.pay_1) + Number(inv.pay_2) + Number(inv.pay_3) + Number(inv.pay_retention);
}

function budgetStatusOf(inv) {
  var realized = sumPay(inv);
  if (realized > inv.budget) return { label: 'Over Budget', color: '#D2232A', bg: '#FBEAEB' };
  if (realized === inv.budget) return { label: 'On Budget', color: '#1FA463', bg: '#E3F5EC' };
  return { label: 'Under Budget', color: '#2F6DB3', bg: '#E8EFFA' };
}

function statusOf(inv) {
  const kpi = kpiOf(inv);
  if (kpi !== null && kpi < 100) return { label: 'Underperforming', color: '#D2232A', bg: '#FBEAEB' };
  if (kpi !== null && kpi >= 100) return { label: 'On Track', color: '#1FA463', bg: '#E3F5EC' };
  if (inv.stage === 'MassPro' || inv.stage === 'PCR') return { label: 'Belum Dinilai', color: '#F2A33C', bg: '#FDF1DF' };
  return { label: 'Berjalan', color: '#2F6DB3', bg: '#E8EFFA' };
}

function progressBar(pct, cls) {
  var p = Math.max(0, Math.min(100, pct));
  return '<div class="progress ' + (cls || '') + '"><i style="width:' + p + '%"></i></div>';
}

function stepper(id, field, value, max) {
  return '<div class="stepper">' +
    '<button data-dec data-id="' + id + '" data-field="' + field + '" data-max="' + max + '">−</button>' +
    '<span>' + value + '</span>' +
    '<button data-inc data-id="' + id + '" data-field="' + field + '" data-max="' + max + '">+</button></div>';
}

/* ================= API ================= */
function apiGet(r) {
  return fetch(API + '?r=' + r).then(function (res) { return res.json(); });
}

function apiPost(r, data) {
  return fetch(API + '?r=' + r, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  }).then(function (res) { return res.json(); });
}

function loadData() {
  return Promise.all([apiGet('investments'), apiGet('actions')]).then(function (res) {
    investments = res[0];
    actions = res[1];
    renderAll();
  }).catch(function (err) {
    console.error(err);
    document.querySelectorAll('.page').forEach(function (p) {
      p.innerHTML = '<div class="card" style="text-align:center;padding:60px 22px;color:var(--red)">' +
        '<h3>Gagal terhubung ke database</h3>' +
        '<p style="color:var(--muted);font-size:13px">Pastikan MySQL berjalan & database sudah di-install. ' +
        '<a href="install.php" style="color:var(--red)">Jalankan installer</a> lalu buka <a href="index.html" style="color:var(--red)">lagi</a>.</p></div>';
    });
  });
}

/* ================= Modal ================= */
function openModal(title, bodyHtml) {
  $('#modalTitle').textContent = title;
  $('#modalBody').innerHTML = bodyHtml;
  $('#modal').classList.add('show');
}

function closeModal() {
  $('#modal').classList.remove('show');
}

/* ================= Navigation ================= */
function buildNav() {
  $('#nav').innerHTML = PAGES.map(function (p, i) {
    return '<button class="nav-item' + (i === 0 ? ' active' : '') + '" data-page="' + p.id + '">' +
      ICONS[p.icon] + '<span>' + p.label + '</span></button>';
  }).join('');

  document.querySelectorAll('.nav-item').forEach(function (btn) {
    btn.addEventListener('click', function () {
      go(btn.dataset.page);
      closeSidebar();
    });
  });

  $('#navToggle').addEventListener('click', function () {
    $('#sidebar').classList.toggle('open');
    $('#backdrop').classList.toggle('show');
  });

  $('#backdrop').addEventListener('click', closeSidebar);
  $('#modalClose').addEventListener('click', closeModal);
  $('#modal').addEventListener('click', function (e) {
    if (e.target === e.currentTarget) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
}

function closeSidebar() {
  $('#sidebar').classList.remove('open');
  $('#backdrop').classList.remove('show');
}

function go(pageId) {
  document.querySelectorAll('.nav-item').forEach(function (b) {
    b.classList.toggle('active', b.dataset.page === pageId);
  });
  document.querySelectorAll('.page').forEach(function (p) {
    p.classList.toggle('is-active', p.id === 'page-' + pageId);
  });
  var pg = PAGES.filter(function (p) { return p.id === pageId; })[0];
  $('#pageTitle').textContent = pg.label;
}

/* ================= Executive ================= */
function renderExecutive() {
  var total = investments.length;
  var active = investments.filter(function (i) {
    return ['Fabrication', 'Install & Trial', 'PCR', 'MassPro'].indexOf(i.stage) >= 0;
  }).length;
  var under = investments.filter(function (i) {
    var k = kpiOf(i); return k !== null && k < 100;
  });
  var rated = investments.filter(function (i) { return kpiOf(i) !== null; });
  var avgBenefit = rated.length
    ? Math.round(rated.reduce(function (s, i) { return s + kpiOf(i); }, 0) / rated.length)
    : 0;

  var kpis = [
    { icon: ICONS.executive, label: 'Total Investasi', value: total, note: 'Sepanjang tahun berjalan', c: '#FBEAEB', fg: '#D2232A' },
    { icon: ICONS.progress, label: 'Investasi Aktif', value: active, note: 'Sedang berjalan / produksi', c: '#EDE8FB', fg: '#6C4FD1' },
    { icon: ICONS.benefit, label: 'Underperforming', value: under.length, note: 'Perlu tindakan perbaikan', c: '#FDEAEE', fg: '#CE3E6B' },
    { icon: ICONS.benefit, label: 'Realisasi Benefit', value: avgBenefit + '%', note: 'Rata-rata FS vs Actual', c: '#E3F5EC', fg: '#1FA463' }
  ];

  var html = '<div class="kpi-grid">' + kpis.map(function (k) {
    return '<div class="card kpi">' +
      '<div class="kpi-icon" style="background:' + k.c + ';color:' + k.fg + '">' + k.icon + '</div>' +
      '<div><p class="kpi-label">' + k.label + '</p><h3 class="kpi-value">' + k.value + '</h3>' +
      '<p class="kpi-note">' + k.note + '</p></div></div>';
  }).join('') + '</div>';

  var counts = {};
  STAGES.forEach(function (s) { counts[s] = 0; });
  investments.forEach(function (i) { counts[i.stage] = (counts[i.stage] || 0) + 1; });
  var activeIdx = Math.max(0, STAGES.indexOf('Fabrication'));

  var pipe = '<div class="pipeline">' + STAGES.map(function (s, idx) {
    var c = STAGE_COLOR[s];
    return '<div class="pipe' + (idx >= activeIdx && counts[s] > 0 ? ' hl' : '') + '"' +
      ' style="background:' + c.bg + ';border-color:' + c.fg + '22">' +
      '<b style="color:' + c.fg + '">' + (counts[s] || 0) + '</b><span>' + s + '</span></div>';
  }).join('') + '</div>';

  var groups = [
    { label: 'Produksi (MassPro)', val: counts['MassPro'], color: '#D2232A' },
    { label: 'Dalam Proses', val: counts['Fabrication'] + counts['Install & Trial'] + counts['PCR'], color: '#17181C' },
    { label: 'Menunggu Persetujuan', val: counts['Draft'] + counts['Under Review'] + counts['Ready for Approval'] + counts['Approved'], color: '#C7CBD1' }
  ];
  var acc = 0;
  var stops = groups.map(function (g) {
    var start = acc; acc += g.val / total * 100;
    return g.color + ' ' + start + '% ' + acc + '%';
  });
  var donut = '<div class="donut" style="background:conic-gradient(' + stops.join(',') + ')">' +
    '<div class="donut-num"><b>' + total + '</b><span>Total Investasi</span></div></div>';
  var legend = '<div class="legend">' + groups.map(function (g) {
    return '<div class="legend-item"><span class="swatch" style="background:' + g.color + '"></span>' + g.label +
      '<b>' + g.val + '</b></div>';
  }).join('') + '</div>';

  var rows = investments.slice().reverse().map(function (i) {
    var st = statusOf(i);
    return '<tr><td><span class="cell-id">' + i.code + '</span></td>' +
      '<td><span class="cell-name">' + i.name + '</span><br><span class="cell-sub">PIC: ' + i.pic + '</span></td>' +
      '<td>' + stageBadge(i.stage) + '</td>' +
      '<td class="num">' + compact(i.budget) + '</td>' +
      '<td class="num">' + (kpiOf(i) !== null ? kpiOf(i) + '%' : '—') + '</td>' +
      '<td><span class="badge" style="background:' + st.bg + ';color:' + st.color + '">' + st.label + '</span></td></tr>';
  }).join('');

  $('#page-executive').innerHTML = html +
    '<div class="grid-2">' +
    '<div class="card"><h3><span class="accent"></span>Pipeline Tahapan Investasi</h3>' + pipe + '</div>' +
    '<div class="card"><h3><span class="accent"></span>Distribusi Status</h3><div class="donut-wrap">' + donut + legend + '</div></div>' +
    '</div>' +
    '<div class="card"><h3><span class="accent"></span>Daftar Investasi' +
    '<span class="right"><button class="btn" id="btnAddInv">' + ICONS.plus + 'Tambah Investasi</button></span></h3>' +
    '<div class="table-wrap"><table class="table"><thead><tr>' +
    '<th>ID</th><th>Investasi</th><th>Tahap</th><th class="num">Budget</th><th class="num">Capaian</th><th>Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';

  $('#btnAddInv').addEventListener('click', showAddInvestment);
}

function stageSelect(inv) {
  return '<select class="status-select stage-select" data-id="' + inv.id + '">' +
    STAGES.map(function (s) {
      return '<option value="' + s + '"' + (s === inv.stage ? ' selected' : '') + '>' + s + '</option>';
    }).join('') + '</select>';
}

/* ================= Investment Progress ================= */
var progressFilter = '';

function renderProgress() {
  var counts = {};
  investments.forEach(function (i) { counts[i.stage] = (counts[i.stage] || 0) + 1; });

  var chips = STAGES.map(function (s) {
    var c = STAGE_COLOR[s];
    return '<div class="chip"><span class="sw" style="background:' + c.fg + '"></span>' + s + ' <b>' + (counts[s] || 0) + '</b></div>';
  }).join('');

  var filterOpts = ['<option value="">Semua Status</option>'].concat(STAGES.map(function (s) {
    return '<option value="' + s + '"' + (s === progressFilter ? ' selected' : '') + '>' + s + '</option>';
  })).join('');

  var list = progressFilter
    ? investments.filter(function (i) { return i.stage === progressFilter; })
    : investments;

  var cards = list.map(function (i) {
    var pct = Math.round((i.used / i.budget) * 100);
    var st = statusOf(i);
    return '<div class="card inv-card">' +
      '<div class="inv-head">' + stageSelect(i) + '<span class="inv-id">' + i.code + '</span></div>' +
      '<h4>' + i.name + '</h4>' +
      '<p class="inv-meta">PIC: ' + i.pic + ' · ' + i.category + '</p>' +
      '<div class="progress-label"><span>Progres Investasi</span><b>' + i.invest_progress + '%</b></div>' +
      progressBar(i.invest_progress) +
      '<div class="inv-stepper"><span class="lbl">Atur progres</span>' +
      stepper(i.id, 'invest_progress', i.invest_progress + '%', 100) + '</div>' +
      '<div class="progress-label" style="margin-top:14px"><span>Penyerapan Budget</span><b>' + pct + '%</b></div>' +
      progressBar(pct) +
      '<div class="inv-stats">' +
      '<div class="inv-stat"><span>Total Budget</span><b>' + compact(i.budget) + '</b></div>' +
      '<div class="inv-stat"><span>Status</span><b style="color:' + st.color + '">' + st.label + '</b></div>' +
      '</div></div>';
  }).join('');

  $('#page-progress').innerHTML =
    '<div class="filter-bar"><span class="filter-lbl">Filter Status</span>' +
    '<select class="status-select" id="progressFilter">' + filterOpts + '</select></div>' +
    '<div class="chips">' + chips + '</div>' +
    '<div class="inv-grid">' + (cards || '<div class="card empty-card">Tidak ada investasi dengan status ini.</div>') + '</div>';

  $('#progressFilter').addEventListener('change', function (e) {
    progressFilter = e.target.value;
    renderProgress();
  });
}

/* ================= Budget Monitoring ================= */
function renderBudget() {
  var PAYS = [
    ['DP', 'pay_dp'],
    ['Payment 1', 'pay_1'],
    ['Payment 2', 'pay_2'],
    ['Payment 3', 'pay_3'],
    ['Retention', 'pay_retention']
  ];

  var totalBudget = investments.reduce(function (s, i) { return s + i.budget; }, 0);
  var totalRealized = investments.reduce(function (s, i) { return s + sumPay(i); }, 0);
  var totalOutstanding = Math.max(0, totalBudget - totalRealized);
  var overCount = investments.filter(function (i) { return sumPay(i) > i.budget; }).length;
  var pctRealized = totalBudget > 0 ? Math.round((totalRealized / totalBudget) * 100) : 0;

  var kpis = [
    { icon: ICONS.budget, label: 'Total Budget', value: compact(totalBudget), note: 'Seluruh investasi', c: '#FBEAEB', fg: '#D2232A' },
    { icon: ICONS.budget, label: 'Realized Payment', value: compact(totalRealized), note: pctRealized + '% dari total budget', c: '#E3F5EC', fg: '#1FA463' },
    { icon: ICONS.budget, label: 'Outstanding Payment', value: compact(totalOutstanding), note: 'Belum dibayar', c: '#E8EFFA', fg: '#2F6DB3' },
    { icon: ICONS.executive, label: 'Over Budget', value: overCount, note: 'Realisasi melebihi budget', c: '#FDEAEE', fg: '#CE3E6B' }
  ];

  var kpiHtml = '<div class="kpi-grid">' + kpis.map(function (k) {
    return '<div class="card kpi">' +
      '<div class="kpi-icon" style="background:' + k.c + ';color:' + k.fg + '">' + k.icon + '</div>' +
      '<div><p class="kpi-label">' + k.label + '</p><h3 class="kpi-value">' + k.value + '</h3>' +
      '<p class="kpi-note">' + k.note + '</p></div></div>';
  }).join('') + '</div>';

  var chart = investments.map(function (i) {
    var realized = sumPay(i);
    var maxV = Math.max(i.budget, realized, 1);
    var wB = Math.round((i.budget / maxV) * 100);
    var wR = Math.round((realized / maxV) * 100);
    return '<div class="chart-group"><h5>' + i.name + ' <small>· ' + i.code + '</small></h5>' +
      '<div class="bar-line target"><span class="lbl">Budget</span><div class="bar-track"><i style="width:' + wB + '%"></i></div><span class="val">' + compact(i.budget) + '</span></div>' +
      '<div class="bar-line actual"><span class="lbl">Realized</span><div class="bar-track"><i style="width:' + wR + '%"></i></div><span class="val">' + compact(realized) + '</span></div>' +
      '</div>';
  }).join('');

  var rows = investments.map(function (i) {
    var realized = sumPay(i);
    var outstanding = Math.max(0, i.budget - realized);
    var bs = budgetStatusOf(i);
    var payBadges = PAYS.map(function (p) {
      var paid = Number(i[p[1]]) > 0;
      return '<span class="pay-chip' + (paid ? ' paid' : '') + '" title="' + p[0] + ': ' + rupiah(Number(i[p[1]])) + '">' + p[0] + '</span>';
    }).join('');
    var payHtml = '<div class="pay-box">' +
      '<div class="pay-list">' + PAYS.map(function (p) {
        return '<div class="pay-row"><span>' + p[0] + '</span>' +
          '<div class="pay-input-wrap"><em>Rp</em><input class="pay-input" type="number" min="0" step="0.01" value="' +
          Number(i[p[1]]) + '" data-pay="' + i.id + '" data-col="' + p[1] + '"></div></div>';
      }).join('') + '<div class="pay-total"><span>Total</span><b class="pay-total-val">' + compact(realized) + '</b></div></div>' +
      '<button type="button" class="btn ghost pay-save" data-pay-save="' + i.id + '">' + ICONS.plus + 'Simpan</button>' +
      '</div>';
    return '<tr><td><span class="cell-id">' + i.code + '</span></td>' +
      '<td><span class="cell-name">' + i.name + '</span><br><span class="cell-sub">' + i.pic + '</span></td>' +
      '<td class="num">' + compact(i.budget) + '</td>' +
      '<td class="num">' + compact(realized) + '</td>' +
      '<td class="num">' + compact(outstanding) + '</td>' +
      '<td><div class="pay-chips">' + payBadges + '</div>' + payHtml + '</td>' +
      '<td><span class="badge" style="background:' + bs.bg + ';color:' + bs.color + '">' + bs.label + '</span></td>' +
      '<td>' + stageBadge(i.stage) + '</td>' +
      '<td><div class="close-cell">' +
      '<span class="badge" style="background:' + (i.budget_status === 'closed' ? '#E3F5EC' : '#FDF1DF') + ';color:' + (i.budget_status === 'closed' ? '#1FA463' : '#B57A12') + '">' +
      (i.budget_status === 'closed' ? 'Budget Tertutup' : 'Budget Terbuka') + '</span>' +
      (i.budget_status === 'closed'
        ? '<span class="cell-sub">Ditutup: ' + (i.closed_at ? i.closed_at.slice(0, 10) : '—') + '</span>'
        : '') +
      '<button type="button" class="btn small ' + (i.budget_status === 'closed' ? 'ghost' : 'danger') + '" data-close="' + i.id + '" data-action="' + (i.budget_status === 'closed' ? 'open' : 'close') + '">' +
      (i.budget_status === 'closed' ? 'Buka Kembali' : 'Tutup Budget') + '</button>' +
      '</div></td></tr>';
  }).join('');

  $('#page-budget').innerHTML = kpiHtml +
    '<div class="grid-2">' +
    '<div class="card"><h3><span class="accent"></span>Budget vs Realized' +
    '<span class="right">per investasi</span></h3><div class="chart">' + chart + '</div></div>' +
    '<div class="card"><h3><span class="accent"></span>Keterangan Status' +
    '<span class="right">Realisasi vs Budget</span></h3>' +
    '<div class="legend-col">' +
    '<div class="legend-item"><span class="swatch" style="background:#C7CBD1"></span>Budget (target)</div>' +
    '<div class="legend-item"><span class="swatch" style="background:linear-gradient(90deg,#E33D48,var(--red-dark))"></span>Realized (dibayar)</div>' +
    '<div class="legend-item"><span class="swatch" style="background:#FBEAEB"></span>Over Budget — realisasi &gt; budget</div>' +
    '<div class="legend-item"><span class="swatch" style="background:#E3F5EC"></span>On Budget — realisasi = budget</div>' +
    '<div class="legend-item"><span class="swatch" style="background:#E8EFFA"></span>Under Budget — realisasi &lt; budget</div>' +
    '</div></div></div>' +
    '<div class="card"><h3><span class="accent"></span>Rincian Budget &amp; Progress Pembayaran' +
    '<span class="right">5 milestone: DP · Payment 1–3 · Retention</span></h3>' +
    '<div class="table-wrap"><table class="table"><thead><tr>' +
    '<th>ID</th><th>Investasi</th><th class="num">Budget</th><th class="num">Realized</th><th class="num">Outstanding</th><th>Realisasi</th><th>Status</th><th>Tahap</th><th>Penutupan</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

/* ================= Production Performance ================= */
function renderProduction() {
  var under = investments
    .filter(function (i) { return kpiOf(i) !== null; })
    .sort(function (a, b) { return kpiOf(a) - kpiOf(b); });

  var list = under.map(function (i, idx) {
    var k = kpiOf(i);
    var hl = k < 100;
    return '<div class="rank-item">' +
      '<div class="rank-num"' + (hl ? '' : ' style="background:#EEF0F3;color:#8B8F99"') + '>' + (idx + 1) + '</div>' +
      '<div class="rank-info"><b>' + i.name + '</b>' +
      '<span>' + i.code + ' · ' + i.pic + ' · ' + stageBadge(i.stage) + '</span>' +
      '<div class="rank-bar"><i style="width:' + Math.max(4, Math.min(100, k)) + '%"></i></div></div>' +
      '<div class="rank-kpi"' + (hl ? '' : ' style="color:#1FA463"') + '>' + k + '%</div></div>';
  }).join('');

  var rows = investments.filter(function (i) { return i.stage === 'MassPro' || i.stage === 'PCR'; }).map(function (i) {
    var k = kpiOf(i);
    var st = statusOf(i);
    return '<tr><td><span class="cell-id">' + i.code + '</span></td>' +
      '<td><span class="cell-name">' + i.name + '</span><br><span class="cell-sub">' + i.pic + '</span></td>' +
      '<td>' + stageBadge(i.stage) + '</td>' +
      '<td class="num">' + (i.rate ? i.rate + '%' : '—') + '</td>' +
      '<td style="min-width:140px">' + (k !== null ? progressBar(k, k < 100 ? '' : 'green') + '<span class="cell-sub" style="display:block;margin-top:5px">' + k + '%</span>' : '—') + '</td>' +
      '<td><span class="badge" style="background:' + st.bg + ';color:' + st.color + '">' + st.label + '</span></td></tr>';
  }).join('');

  $('#page-production').innerHTML =
    '<div class="grid-2">' +
    '<div class="card"><h3><span class="accent"></span>Top Underperforming Investments' +
    '<span class="right">' + under.filter(function (i) { return kpiOf(i) < 100; }).length + ' perlu perbaikan</span></h3>' +
    '<div class="rank-list">' + list + '</div></div>' +
    '<div class="card"><h3><span class="accent"></span>Catatan</h3>' +
    '<p style="font-size:13px;color:var(--muted);line-height:1.7">' +
    'Data performa produksi &amp; realisasi benefit diambil otomatis dari ERP dan IoT saat tahap MassPro.<br><br>' +
    '<b style="color:var(--ink)">Variance</b> yang terdeteksi akan langsung memicu <b style="color:var(--ink)">Action Tracker</b> untuk tindakan perbaikan, bukan menunggu review 6 bulanan.' +
    '</p></div></div>' +
    '<div class="card"><h3><span class="accent"></span>Detail Produksi per Investasi</h3>' +
    '<div class="table-wrap"><table class="table"><thead><tr>' +
    '<th>ID</th><th>Investasi</th><th>Tahap</th><th class="num">Utilisasi</th><th>Realisasi Benefit</th><th>Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
}

/* ================= Benefit ================= */
function renderBenefit() {
  var rated = investments.filter(function (i) { return kpiOf(i) !== null; });
  var maxTarget = rated.length ? Math.max.apply(null, rated.map(function (i) { return i.fs_target; })) : 1;

  var chart = rated.map(function (i) {
    var wT = Math.round((i.fs_target / maxTarget) * 100);
    var wA = Math.round((i.fs_actual / maxTarget) * 100);
    return '<div class="chart-group"><h5>' + i.name +
      ' <small>· ' + i.code + '</small></h5>' +
      '<div class="bar-line target"><span class="lbl">FS Target</span><div class="bar-track"><i style="width:' + wT + '%"></i></div><span class="val">' + compact(i.fs_target) + '</span></div>' +
      '<div class="bar-line actual"><span class="lbl">Actual</span><div class="bar-track"><i style="width:' + wA + '%"></i></div><span class="val">' + compact(i.fs_actual) + '</span></div>' +
      '</div>';
  }).join('');

  var totalT = rated.reduce(function (s, i) { return s + i.fs_target; }, 0);
  var totalA = rated.reduce(function (s, i) { return s + i.fs_actual; }, 0);
  var cap = totalT > 0 ? Math.round((totalA / totalT) * 100) : 0;

  var rows = rated.map(function (i) {
    var k = kpiOf(i);
    var delta = i.fs_actual - i.fs_target;
    var ok = delta >= 0;
    return '<tr><td><span class="cell-id">' + i.code + '</span></td>' +
      '<td><span class="cell-name">' + i.name + '</span></td>' +
      '<td class="num">' + compact(i.fs_target) + '</td>' +
      '<td class="num">' + compact(i.fs_actual) + '</td>' +
      '<td class="num"><span style="color:' + (ok ? '#1FA463' : '#D2232A') + '">' + (ok ? '+' : '') + compact(delta) + '</span></td>' +
      '<td><span class="badge" style="background:' + (ok ? '#E3F5EC' : '#FBEAEB') + ';color:' + (ok ? '#1FA463' : '#D2232A') + '">' + k + '%</span></td></tr>';
  }).join('');

  var kpis = [
    { label: 'Target Benefit / Bulan', value: compact(totalT), c: '#E8EFFA', fg: '#2F6DB3', icon: ICONS.benefit },
    { label: 'Realisasi Benefit / Bulan', value: compact(totalA), c: '#E3F5EC', fg: '#1FA463', icon: ICONS.benefit },
    { label: 'Capaian FS vs Actual', value: cap + '%', c: '#FBEAEB', fg: '#D2232A', icon: ICONS.progress }
  ];

  $('#page-benefit').innerHTML =
    '<div class="kpi-grid">' + kpis.map(function (k) {
      return '<div class="card kpi">' +
        '<div class="kpi-icon" style="background:' + k.c + ';color:' + k.fg + '">' + k.icon + '</div>' +
        '<div><p class="kpi-label">' + k.label + '</p><h3 class="kpi-value">' + k.value + '</h3></div></div>';
    }).join('') + '</div>' +
    '<div class="grid-2">' +
    '<div class="card"><h3><span class="accent"></span>Perbandingan FS Target vs Actual' +
    '<span class="right">per bulan · rupiah</span></h3><div class="chart">' + chart + '</div></div>' +
    '<div class="card"><h3><span class="accent"></span>Rekap Realisasi</h3>' +
    '<div class="table-wrap"><table class="table"><thead><tr>' +
    '<th>ID</th><th>Investasi</th><th class="num">Target</th><th class="num">Actual</th><th class="num">Selisih</th><th>Capaian</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div></div></div>';
}

/* ================= Action Tracker ================= */
function renderAction() {
  var rows = actions.map(function (a) {
    var st = ACTION_STATUS[a.status] || ACTION_STATUS.open;
    var opts = Object.keys(ACTION_STATUS).map(function (k) {
      return '<option value="' + k + '"' + (k === a.status ? ' selected' : '') + '>' + ACTION_STATUS[k].label + '</option>';
    }).join('');
    return '<tr><td><span class="cell-id">' + a.code + '</span><br><span class="cell-sub">' + a.inv_name + '</span></td>' +
      '<td><span class="cell-name">' + a.action + '</span></td>' +
      '<td>' + a.owner + '</td>' +
      '<td class="num">' + a.due_date + '</td>' +
      '<td><select class="status-select" data-action-id="' + a.id + '" style="color:' + st.color + '">' + opts + '</select></td></tr>';
  }).join('');

  var open = actions.filter(function (a) { return a.status === 'open'; }).length;
  var done = actions.filter(function (a) { return a.status === 'done'; }).length;

  var kpis = [
    { label: 'Total Tindakan', value: actions.length, c: '#FBEAEB', fg: '#D2232A', icon: ICONS.action },
    { label: 'Masih Terbuka', value: open, c: '#FDF1DF', fg: '#B57A12', icon: ICONS.progress },
    { label: 'Selesai', value: done, c: '#E3F5EC', fg: '#1FA463', icon: ICONS.executive }
  ];

  $('#page-action').innerHTML =
    '<div class="kpi-grid">' + kpis.map(function (k) {
      return '<div class="card kpi">' +
        '<div class="kpi-icon" style="background:' + k.c + ';color:' + k.fg + '">' + k.icon + '</div>' +
        '<div><p class="kpi-label">' + k.label + '</p><h3 class="kpi-value">' + k.value + '</h3></div></div>';
    }).join('') + '</div>' +
    '<div class="card"><h3><span class="accent"></span>Daftar Tindakan Perbaikan' +
    '<span class="right"><button class="btn" id="btnAddAction">' + ICONS.plus + 'Tambah Tindakan</button></span></h3>' +
    '<div class="table-wrap"><table class="table"><thead><tr>' +
    '<th>Investasi</th><th>Tindakan</th><th>PIC</th><th class="num">Batas Waktu</th><th>Status</th>' +
    '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';

  $('#btnAddAction').addEventListener('click', showAddAction);
}

/* ================= Review P&B ================= */
function renderReview() {
  var drafts = investments.filter(function (i) { return i.stage === 'Draft'; });
  var others = investments.length - drafts.length;

  var rows = drafts.map(function (i) {
    var date = i.created_at ? i.created_at.slice(0, 10) : '—';
    return '<tr><td><span class="cell-id">' + i.code + '</span></td>' +
      '<td><span class="cell-name">' + i.name + '</span><br><span class="cell-sub">PIC: ' + i.pic + '</span></td>' +
      '<td>' + i.purpose + '</td>' +
      '<td>' + stageBadge(i.stage) + '</td>' +
      '<td class="num">' + compact(i.budget) + '</td>' +
      '<td class="num">' + date + '</td>' +
      '<td><button class="btn ghost" data-detail="' + i.id + '">' + ICONS.executive + 'Detail</button></td></tr>';
  }).join('');

  var kpis = [
    { label: 'Menunggu Review', value: drafts.length, note: 'Diisi oleh ENG · menunggu P&amp;B', c: '#FDF1DF', fg: '#B57A12', icon: ICONS.progress },
    { label: 'Sudah Direview', value: others, note: 'Melanjutkan ke tahap berikutnya', c: '#E3F5EC', fg: '#1FA463', icon: ICONS.executive }
  ];

  $('#page-review').innerHTML =
    '<div class="kpi-grid">' + kpis.map(function (k) {
      return '<div class="card kpi">' +
        '<div class="kpi-icon" style="background:' + k.c + ';color:' + k.fg + '">' + k.icon + '</div>' +
        '<div><p class="kpi-label">' + k.label + '</p><h3 class="kpi-value">' + k.value + '</h3>' +
        '<p class="kpi-note">' + k.note + '</p></div></div>';
    }).join('') + '</div>' +
    '<div class="card"><h3><span class="accent"></span>Daftar Pengajuan Perlu Review' +
    '<span class="right">Data diisi oleh Engineering Dept.</span></h3>' +
    '<div class="table-wrap"><table class="table"><thead><tr>' +
    '<th>ID</th><th>Investasi</th><th>Tujuan</th><th>Tahap</th><th class="num">Budget</th><th class="num">Tanggal</th><th></th>' +
    '</tr></thead><tbody>' + (rows || '<tr><td colspan="7" class="empty">Tidak ada pengajuan yang menunggu review.</td></tr>') +
    '</tbody></table></div></div>';
}

function showReviewDetail(id) {
  var i = investments.find(function (x) { return x.id == id; });
  if (!i) return;

  var date = i.created_at ? i.created_at.slice(0, 10) : '—';
  openModal('Detail Pengajuan · ' + i.code, '' +
    '<div class="hint">Pengajuan ini diisi oleh <b>Engineering Dept.</b> dan menunggu review <b>Planning &amp; Budgeting Dept.</b></div>' +
    '<div class="kv">' +
    '<div class="kv-row"><span>Nama Investasi</span><b>' + i.name + '</b></div>' +
    '<div class="kv-row"><span>Tujuan Investment</span><b>' + i.purpose + '</b></div>' +
    '<div class="kv-row"><span>Kategori</span><b>' + i.category + '</b></div>' +
    '<div class="kv-row"><span>PIC (Engineer)</span><b>' + i.pic + '</b></div>' +
    '<div class="kv-row"><span>Budget</span><b>' + rupiah(i.budget) + '</b></div>' +
    '<div class="kv-row"><span>Target Benefit / Bulan</span><b>' + rupiah(i.fs_target) + '</b></div>' +
    '<div class="kv-row"><span>Tahap Saat Ini</span><b>' + stageBadge(i.stage) + '</b></div>' +
    '<div class="kv-row"><span>Tanggal Pengajuan</span><b>' + date + '</b></div>' +
    '</div>' +
    '<div class="form-actions" style="margin-top:16px">' +
    '<button type="button" class="btn ghost danger" id="btnReviewReject">Disapprove</button>' +
    '<button type="button" class="btn" id="btnReviewApprove">Approve</button>' +
    '</div>');

  $('#btnReviewApprove').addEventListener('click', function () {
    apiPost('update', { id: i.id, stage: 'Approved' }).then(function (res) {
      if (res.error) return showMsg('modalBody', res.error, true);
      closeModal();
      loadData();
    });
  });

  $('#btnReviewReject').addEventListener('click', function () {
    apiPost('update', { id: i.id, stage: 'Rejected' }).then(function (res) {
      if (res.error) return showMsg('modalBody', res.error, true);
      closeModal();
      loadData();
    });
  });
}

/* ================= Forms ================= */
function showAddInvestment() {
  openModal('Tambah Investasi Baru', '' +
    '<form class="form" id="formInv">' +
    '<div class="hint">Investasi baru akan masuk dengan status <b>Draft</b> dan menunggu review PB Department.</div>' +
    '<div class="field"><label>Nama Investasi *</label><input name="name" required placeholder="cth: Modernisasi Mesin Press"></div>' +
    '<div class="field"><label>Tujuan Investment *</label><select name="purpose" required>' +
    '<option value="" disabled selected>Pilih tujuan</option>' +
    '<option>New Model</option>' +
    '<option>Quality Improvement</option>' +
    '<option>Automation</option>' +
    '<option>Replacement</option>' +
    '<option>Quality Machine</option>' +
    '</select></div>' +
    '<div class="field"><label>PIC (Engineer)</label><input name="pic" placeholder="Nama engineer"></div>' +
    '<div class="field"><label>Kategori</label><input name="category" placeholder="cth: Mesin &amp; Peralatan"></div>' +
    '<div class="field"><label>Budget (Rp)</label><input name="budget" type="number" min="0" placeholder="0"></div>' +
    '<div class="field"><label>Target Benefit / Bulan (Rp)</label><input name="fs_target" type="number" min="0" placeholder="0"></div>' +
    '<div id="msgInv"></div>' +
    '<div class="form-actions"><button type="button" class="btn ghost" data-cancel>Batal</button>' +
    '<button type="submit" class="btn">Simpan</button></div>' +
    '</form>');

  $('#formInv').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    var payload = {
      name: f.name.value.trim(),
      purpose: f.purpose.value,
      pic: f.pic.value.trim() || 'Belum ditentukan',
      category: f.category.value.trim() || 'Umum',
      budget: Number(f.budget.value) || 0,
      fs_target: Number(f.fs_target.value) || 0
    };
    apiPost('investments', payload).then(function (res) {
      if (res.error) return showMsg('msgInv', res.error, true);
      showMsg('msgInv', 'Berhasil! Kode ' + res.code + ' dibuat.', false);
      setTimeout(function () { closeModal(); loadData(); }, 700);
    });
  });
}

function showAddAction() {
  var opts = investments.map(function (i) {
    return '<option value="' + i.id + '">' + i.code + ' — ' + i.name + '</option>';
  }).join('') || '<option value="" disabled>Belum ada investasi</option>';

  openModal('Tambah Tindakan Perbaikan', '' +
    '<form class="form" id="formAction">' +
    '<div class="field"><label>Investasi *</label><select name="investment_id" required>' + opts + '</select></div>' +
    '<div class="field"><label>Tindakan *</label><textarea name="action" rows="3" required placeholder="Deskripsi tindakan perbaikan"></textarea></div>' +
    '<div class="field"><label>PIC</label><input name="owner" placeholder="Nama penanggung jawab"></div>' +
    '<div class="field"><label>Batas Waktu *</label><input name="due_date" type="date" required></div>' +
    '<div id="msgAction"></div>' +
    '<div class="form-actions"><button type="button" class="btn ghost" data-cancel>Batal</button>' +
    '<button type="submit" class="btn">Simpan</button></div>' +
    '</form>');

  $('#formAction').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target;
    apiPost('actions', {
      investment_id: Number(f.investment_id.value),
      action: f.action.value.trim(),
      owner: f.owner.value.trim() || 'Belum ditentukan',
      due_date: f.due_date.value
    }).then(function (res) {
      if (res.error) return showMsg('msgAction', res.error, true);
      showMsg('msgAction', 'Tindakan berhasil ditambahkan.', false);
      setTimeout(function () { closeModal(); loadData(); }, 700);
    });
  });
}

function showMsg(id, text, isErr) {
  var el = $('#' + id);
  el.innerHTML = '<p class="form-msg ' + (isErr ? 'err' : 'ok') + '">' + text + '</p>';
}

/* ================= Search ================= */
function initSearch() {
  $('#searchInput').addEventListener('input', function (e) {
    var q = e.target.value.trim().toLowerCase();
    ['page-executive', 'page-progress', 'page-budget'].forEach(function (pid) {
      var page = $('#' + pid);
      if (!page) return;
      page.querySelectorAll('tr, .inv-card').forEach(function (node) {
        var text = node.textContent.toLowerCase();
        node.style.display = (!q || text.indexOf(q) >= 0) ? '' : 'none';
      });
    });
  });
}

/* ================= Events (delegated) ================= */
function initEvents() {
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-inc],[data-dec]');
    if (btn) {
      var inv = investments.find(function (i) { return i.id == btn.dataset.id; });
      if (!inv) return;
      var field = btn.dataset.field;
      var max = Number(btn.dataset.max);
      var v = Number(inv[field]);
      v = btn.hasAttribute('data-inc') ? v + 1 : v - 1;
      v = Math.max(0, Math.min(max, v));
      if (v === Number(inv[field])) return;
      var payload = { id: inv.id };
      payload[field] = v;
      apiPost('update', payload).then(loadData);
      return;
    }

    var cancel = e.target.closest('[data-cancel]');
    if (cancel) closeModal();

    var detail = e.target.closest('[data-detail]');
    if (detail) showReviewDetail(detail.dataset.detail);

    var savePay = e.target.closest('[data-pay-save]');
    if (savePay) {
      var id = savePay.dataset.paySave;
      var box = savePay.closest('.pay-box');
      var payload = { id: id };
      box.querySelectorAll('[data-pay]').forEach(function (inp) {
        payload[inp.dataset.col] = Math.max(0, Number(inp.value) || 0);
      });
      apiPost('update', payload).then(loadData);
    }

    var closeBtn = e.target.closest('[data-close]');
    if (closeBtn) {
      var action = closeBtn.dataset.action === 'close' ? 'closed' : 'open';
      apiPost('update', { id: closeBtn.dataset.close, budget_status: action }).then(loadData);
    }
  });

  document.addEventListener('input', function (e) {
    var inp = e.target.closest('[data-pay]');
    if (!inp) return;
    var box = inp.closest('.pay-box');
    var total = 0;
    box.querySelectorAll('[data-pay]').forEach(function (el) {
      total += Number(el.value) || 0;
    });
    var val = box.querySelector('.pay-total-val');
    if (val) val.textContent = compact(total);
  });

  document.addEventListener('change', function (e) {
    var sel = e.target.closest('.status-select');
    if (sel) {
      if (sel.classList.contains('stage-select')) {
        apiPost('update', { id: sel.dataset.id, stage: sel.value }).then(loadData);
      } else {
        apiPost('action-status', { id: sel.dataset.actionId, status: sel.value }).then(loadData);
      }
    }
  });
}

/* ================= Init ================= */
function renderAll() {
  renderExecutive();
  renderProgress();
  renderBudget();
  renderProduction();
  renderBenefit();
  renderAction();
  renderReview();
  applySearch();
}

function applySearch() {
  var q = $('#searchInput').value.trim().toLowerCase();
  if (!q) return;
  ['page-executive', 'page-progress', 'page-budget'].forEach(function (pid) {
    var page = $('#' + pid);
    if (!page) return;
    page.querySelectorAll('tr, .inv-card').forEach(function (node) {
      if (node.textContent.toLowerCase().indexOf(q) < 0) node.style.display = 'none';
    });
  });
}

function init() {
  buildNav();
  initEvents();
  initSearch();
  loadData();
}

document.addEventListener('DOMContentLoaded', init);
