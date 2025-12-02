import { db } from "./firebase.js";
import {
    collection,
    getDocs,
    getDoc,
    doc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

const rollInput = document.getElementById("roll-input");
const checkBtn = document.getElementById("check-btn");
const resultBox = document.getElementById("result");

const fromDateInput = document.getElementById("from-date");
const toDateInput = document.getElementById("to-date");
const presetSelect = document.getElementById("preset");
const applyFilterBtn = document.getElementById("apply-filter");
const clearFilterBtn = document.getElementById("clear-filter");
const filterSummary = document.getElementById("filter-summary");

let cachedRecords = [];   // stores all fetched days for the roll number
let currentRoll = null;

// -----------------------------
// Fetch attendance for roll
// -----------------------------
checkBtn.onclick = loadAttendance;
rollInput.onkeypress = e => { if (e.key === "Enter") loadAttendance(); };

async function loadAttendance() {
    const roll = rollInput.value.trim();
    if (!roll) return show("Enter roll number", true);

    currentRoll = parseInt(roll);
    show("Loading...");

    // Fetch student name
    const studentSnap = await getDoc(doc(db, "students", roll));
    window.currentStudentName = studentSnap.exists() ? studentSnap.data().name : "Unknown";
    const snap = await getDocs(collection(db, "attendance"));

    cachedRecords = [];

    snap.forEach(docSnap => {
        const data = docSnap.data();
        if (!data.hours) return;

        const day = docSnap.id; // YYYY-MM-DD

        const hoursAbsent = [];

        // hours 1 to 6
        for (let h = 1; h <= 6; h++) {
            const arr = data.hours[h] || [];
            if (arr.includes(currentRoll)) hoursAbsent.push(h);
        }

        cachedRecords.push({
            date: day,
            absentHours: hoursAbsent
        });
    });

    cachedRecords.sort((a, b) => b.date.localeCompare(a.date));

    applyFilters();
}

// -----------------------------
// Filtering logic
// -----------------------------
applyFilterBtn.onclick = applyFilters;
clearFilterBtn.onclick = () => {
    presetSelect.value = "all";
    fromDateInput.value = "";
    toDateInput.value = "";
    applyFilters();
};

presetSelect.onchange = applyFilters;

function applyFilters() {
    if (!cachedRecords.length) {
        resultBox.innerHTML = `<div class='empty'>No records found.</div>`;
        return;
    }

    let records = [...cachedRecords];

    // Date filter
    let from = fromDateInput.value ? new Date(fromDateInput.value) : null;
    let to = toDateInput.value ? new Date(toDateInput.value) : null;

    if (presetSelect.value === "7") {
        to = new Date();
        from = new Date();
        from.setDate(from.getDate() - 6);
    }

    if (presetSelect.value === "30") {
        to = new Date();
        from = new Date();
        from.setDate(from.getDate() - 29);
    }

    if (from && to) {
        records = records.filter(r => {
            const d = new Date(r.date);
            return d >= from && d <= to;
        });
    }

    render(records);
}

// -----------------------------
// Render attendance records
// -----------------------------
function render(records) {
    if (!records.length) {
        resultBox.innerHTML = `<div class="empty">No records in this range</div>`;
        return;
    }

    let totalAbsentHours = 0;
    let totalHours = records.length * 6;

    records.forEach(r => totalAbsentHours += r.absentHours.length);

    let presentHours = totalHours - totalAbsentHours;
    let percentage = ((presentHours / totalHours) * 100).toFixed(2);

    let html = `
    <div class="stat-header">
    <h3>${currentStudentName} (Roll: ${String(currentRoll).padStart(2, "0")})</h3>

      <p>Total Hours: ${totalHours}</p>
      <p>Present Hours: ${presentHours}</p>
      <p>Absent Hours: ${totalAbsentHours}</p>
      <h2>${percentage}% Attendance</h2>
    </div>

    <h3>Daily Breakdown</h3>
    <table class="att-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>H1</th>
          <th>H2</th>
          <th>H3</th>
          <th>H4</th>
          <th>H5</th>
          <th>H6</th>
        </tr>
      </thead>
      <tbody>
  `;

    records.forEach(r => {
        html += `
      <tr>
        <td>${r.date}</td>
        ${[1, 2, 3, 4, 5, 6].map(h => `
          <td class="${r.absentHours.includes(h) ? "absent" : "present"}">
            ${r.absentHours.includes(h) ? "A" : "P"}
          </td>
        `).join("")}
      </tr>
    `;
    });

    html += `</tbody></table>`;

    resultBox.innerHTML = html;
}

// -----------------------------
// Helper
// -----------------------------
function show(msg, error = false) {
    resultBox.innerHTML = `<div class='${error ? "error" : "info"}'>${msg}</div>`;
}
