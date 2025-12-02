// student.js
import { db } from "./firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const rollInput = document.getElementById('roll-input');
const checkBtn = document.getElementById('check-btn');
const result = document.getElementById('result');

const fromDateInput = document.getElementById('from-date');
const toDateInput = document.getElementById('to-date');
const presetSelect = document.getElementById('preset');
const applyFilterBtn = document.getElementById('apply-filter');
const clearFilterBtn = document.getElementById('clear-filter');
const filterSummary = document.getElementById('filter-summary');
const sortSelect = document.getElementById('sort-select');

let allRecordsCache = []; // cached records for last fetched roll

checkBtn.addEventListener('click', fetchAttendance);
rollInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchAttendance(); });

applyFilterBtn.addEventListener('click', applyFilters);
clearFilterBtn.addEventListener('click', clearFilters);
presetSelect.addEventListener('change', applyPreset);
sortSelect.addEventListener('change', applyFilters); // re-apply when sort changes

/**
 * Fetch all attendance docs and compute records for the given roll.
 * Also fills allRecordsCache so subsequent filtering/sorting is client-side.
 */
async function fetchAttendance() {
  const raw = rollInput.value.trim();
  if (!raw) {
    showMessage('Please enter a roll number', 'error');
    return;
  }
  const roll = parseInt(raw, 10);
  if (isNaN(roll) || roll <= 0) {
    showMessage('Enter a valid positive roll number', 'error');
    return;
  }

  showMessage('Loading...', 'info');

  try {
    const snap = await getDocs(collection(db, "attendance"));

    const records = [];
    snap.forEach(doc => {
      const d = doc.data();
      const date = d.date || doc.id.split('_')[0];
      const time = d.time || (doc.id.split('_')[1] || '');
      const absentees = Array.isArray(d.absentees) ? d.absentees.map(x => parseInt(x, 10)) : [];
      const isAbsent = absentees.includes(roll);
      // normalized record with date string 'YYYY-MM-DD' and time string
      records.push({ date, time, isAbsent });
    });

    // normalize / cache
    // sort default by date desc for cache (so "All" view is newest-first)
    records.sort((a, b) => {
      const da = a.date || '';
      const dbd = b.date || '';
      if (da === dbd) return (b.time || '').localeCompare(a.time || '');
      return dbd.localeCompare(da);
    });

    allRecordsCache = records;
    applyFilters(); // apply filters + sorting (current UI state)

  } catch (err) {
    console.error(err);
    showMessage('Failed to load attendance. Check console for details.', 'error');
  }
}

/** Apply date filters (from UI) and then sorting, render results */
function applyFilters() {
  if (!Array.isArray(allRecordsCache)) {
    showMessage('No records loaded. Enter roll and click Check first.', 'error');
    return;
  }

  // determine date range
  const preset = presetSelect.value;
  let fromDate = fromDateInput.value ? parseDateISO(fromDateInput.value) : null;
  let toDate = toDateInput.value ? parseDateISO(toDateInput.value) : null;

  // If a preset selected, override from/to
  if (preset === '7' || preset === '30') {
    const days = parseInt(preset, 10);
    const today = startOfDay(new Date());
    toDate = today;
    fromDate = addDays(today, -days + 1); // inclusive last 'days' days
    // populate inputs visually
    fromDateInput.value = formatDateISO(fromDate);
    toDateInput.value = formatDateISO(toDate);
  } else if (preset === 'all') {
    fromDate = null;
    toDate = null;
    fromDateInput.value = '';
    toDateInput.value = '';
  }

  // validate range
  if (fromDate && toDate && fromDate > toDate) {
    showMessage('Invalid date range: From must be before or equal To', 'error');
    return;
  }

  // filter records by date
  const filtered = allRecordsCache.filter(r => {
    if (!r.date) return false;
    const d = parseDateISO(r.date);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    return true;
  });

  // apply sorting
  const sorted = sortRecords(filtered, sortSelect.value);

  // stats
  const totalSessions = sorted.length;
  const absentCount = sorted.reduce((acc, r) => acc + (r.isAbsent ? 1 : 0), 0);
  const presentCount = totalSessions - absentCount;
  const percentage = totalSessions === 0 ? 100 : ((presentCount / totalSessions) * 100);

  renderResult({
    roll: rollInput.value.trim(),
    totalSessions,
    absentCount,
    presentCount,
    percentage,
    records: sorted
  });

  // update filter summary
  if (fromDate || toDate) {
    const fromStr = fromDate ? formatDateISO(fromDate) : '—';
    const toStr = toDate ? formatDateISO(toDate) : '—';
    filterSummary.textContent = `Showing records from ${fromStr} to ${toStr} (${sorted.length} sessions)`;
  } else {
    filterSummary.textContent = `Showing all records (${sorted.length} sessions)`;
  }
}

/** Sort helper */
function sortRecords(records, mode = 'date_desc') {
  // Work on a shallow copy
  const arr = records.slice();

  if (mode === 'date_desc') {
    arr.sort((a, b) => {
      if (a.date === b.date) return (b.time || '').localeCompare(a.time || '');
      return (b.date || '').localeCompare(a.date || '');
    });
  } else if (mode === 'date_asc') {
    arr.sort((a, b) => {
      if (a.date === b.date) return (a.time || '').localeCompare(b.time || '');
      return (a.date || '').localeCompare(b.date || '');
    });
  } else if (mode === 'absent_first') {
    // Absent first, then newest date first
    arr.sort((a, b) => {
      if (a.isAbsent === b.isAbsent) {
        // both absent or both present -> newest first
        if (a.date === b.date) return (b.time || '').localeCompare(a.time || '');
        return (b.date || '').localeCompare(a.date || '');
      }
      return (a.isAbsent ? -1 : 1); // absent true -> comes before
    });
  } else if (mode === 'present_first') {
    // Present first, then newest date first
    arr.sort((a, b) => {
      if (a.isAbsent === b.isAbsent) {
        if (a.date === b.date) return (b.time || '').localeCompare(a.time || '');
        return (b.date || '').localeCompare(a.date || '');
      }
      return (a.isAbsent ? 1 : -1); // present (isAbsent false) -> comes before
    });
  } else {
    // default to date_desc
    return sortRecords(arr, 'date_desc');
  }

  return arr;
}

/** Clear filters UI and show all cached records */
function clearFilters() {
  fromDateInput.value = '';
  toDateInput.value = '';
  presetSelect.value = 'all';
  filterSummary.textContent = '';
  applyFilters();
}

/** When user chooses a preset, apply it immediately */
function applyPreset() {
  applyFilters();
}

/** Helpers - date parsing/formatting */
function parseDateISO(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateISO(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function addDays(date, days) {
  const d = new Date(date.getTime());
  d.setDate(d.getDate() + days);
  return startOfDay(d);
}

/* Rendering adapted for filtered+sorted data */
function renderResult({ roll, totalSessions, absentCount, presentCount, percentage, records }) {
  if (totalSessions === 0) {
    result.innerHTML = `
      <div class="empty">
        No attendance sessions found for the selected range.<br>
        Ask admin to mark attendance for the class.
      </div>
    `;
    return;
  }

  const percentStr = percentage.toFixed(2);
  let html = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
      <div>
        <div class="muted">Roll</div>
        <div class="stat">${String(roll).padStart(2, '0')}</div>
      </div>
      <div>
        <div class="muted">Attendance %</div>
        <div class="stat">${percentStr}%</div>
      </div>
      <div>
        <div class="muted">Present</div>
        <div class="stat">${presentCount}</div>
      </div>
      <div>
        <div class="muted">Absent</div>
        <div class="stat">${absentCount}</div>
      </div>
    </div>

    <h4 style="margin-top:16px;">Daily Records</h4>
    <table>
      <thead>
        <tr><th>Date</th><th>Session</th><th>Status</th></tr>
      </thead>
      <tbody>
  `;

  records.forEach(r => {
    html += `
      <tr>
        <td>${escapeHtml(r.date || '')}</td>
        <td>${escapeHtml(r.time || '')}</td>
        <td class="${r.isAbsent ? 'absent' : 'present'}">${r.isAbsent ? 'Absent' : 'Present'}</td>
      </tr>
    `;
  });

  html += `</tbody></table>`;

  result.innerHTML = html;
}

function showMessage(msg, type = 'info') {
  if (type === 'error') {
    result.innerHTML = `<div class="empty">${escapeHtml(msg)}</div>`;
  } else {
    result.innerHTML = `<div class="muted">${escapeHtml(msg)}</div>`;
  }
}

function escapeHtml(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
