import { db, auth, adminLogin, adminLogout, onAuth } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js";

// DOM references
const loginBtn = document.getElementById("admin-login-btn");
const logoutBtn = document.getElementById("admin-logout-btn");
const attendanceTab = document.getElementById("attendance-tab");
const manageTab = document.getElementById("manage-tab");
const rollInputEl = document.getElementById("roll-input");
const addBtnEl = document.getElementById("add-btn");

// Hide panel until login
attendanceTab.style.display = "none";
manageTab.style.display = "none";

loginBtn.onclick = adminLogin;
logoutBtn.onclick = adminLogout;

let students = {};
let absentees = [];
let selectedTime = "";

// ------------------------------------
// AUTH STATE HANDLING
// ------------------------------------
onAuth(user => {
  if (!user) {
    showLogin();
    return;
  }

  const allowedAdmins = [
    "fahadsheza0@gmail.com",
    "admin2@gmail.com",
    "teacher@school.com"
  ];

  if (!allowedAdmins.includes(user.email)) {
    alert("You are NOT allowed to access this admin panel.");
    adminLogout();
    return;
  }

  showAdminPanel();
});


// ------------------------------------
// LOAD STUDENTS FROM FIRESTORE
// ------------------------------------
async function loadStudents() {
  students = {};
  const snap = await getDocs(collection(db, "students"));
  snap.forEach(doc => {
    students[doc.id] = doc.data().name;
  });

  renderStudents();
  updateStats();
}
window.loadStudents = loadStudents;

// ------------------------------------
// ADD STUDENT
// ------------------------------------
const addStudentBtn = document.getElementById("add-student-btn");
addStudentBtn.onclick = async () => {
  const roll = document.getElementById("new-roll").value.trim();
  const name = document.getElementById("new-name").value.trim();

  if (!roll || !name) {
    alert("Enter roll + name");
    return;
  }

  await setDoc(doc(db, "students", roll), {
    roll: parseInt(roll),
    name: name
  });

  await loadStudents();
  alert("Student added");
};

// ------------------------------------
// REMOVE STUDENT
// ------------------------------------
window.removeStudent = async function (roll) {
  if (!confirm("Delete student?")) return;

  await deleteDoc(doc(db, "students", roll));
  await loadStudents();
};

// ------------------------------------
// ADD / MARK ABSENT (centralized)
// ------------------------------------
function addRoll() {
  const raw = rollInputEl.value;
  // support empty or whitespace
  if (!raw && raw !== 0) {
    alert("Please enter a roll number");
    rollInputEl.focus();
    return;
  }

  const val = parseInt(String(raw).trim(), 10);

  if (isNaN(val)) {
    alert("Please enter a valid roll number");
    rollInputEl.value = "";
    rollInputEl.focus();
    return;
  }

  // check existence
  if (!students[String(val)]) {
    alert("Roll not found");
    rollInputEl.value = "";
    rollInputEl.focus();
    return;
  }

  if (!absentees.includes(val)) {
    absentees.push(val);
    renderAbsentees();
    // optional: feedback
    // you can replace alert with your notification UI
    alert(`${students[String(val)]} marked as absent`);
  } else {
    // already marked
    alert("Student already marked as absent");
  }

  // Clear and focus for next entry
  rollInputEl.value = "";
  rollInputEl.focus();
}

// wire the button to addRoll
addBtnEl.onclick = addRoll;

// wire Enter key to addRoll and clear input
rollInputEl.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    // prevent form submits or default behaviour
    e.preventDefault();
    addRoll();
  }
});

// ------------------------------------
// REMOVE ABSENTEE
// ------------------------------------
window.removeAbsentee = function (roll) {
  absentees = absentees.filter(x => x !== roll);
  renderAbsentees();
};

// ------------------------------------
// SELECT TIME
// ------------------------------------
document.getElementById("afternoon").onchange = (e) => selectedTime = "AFTERNOON";
document.getElementById("forenoon").onchange = (e) => selectedTime = "FORENOON";

// ------------------------------------
// SAVE ATTENDANCE TO FIRESTORE
// ------------------------------------
async function saveAttendance() {
  if (absentees.length === 0) {
    alert("No absentees");
    return;
  }
  if (!selectedTime) {
    alert("Select Forenoon / Afternoon");
    return;
  }

  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  await setDoc(doc(db, "attendance", `${dateStr}_${selectedTime}`), {
    date: dateStr,
    time: selectedTime,
    absentees: absentees
  });

  alert("Saved to Firestore");
}
document.getElementById("send-btn").onclick = saveAttendance;

// ------------------------------------
// RENDER FUNCTIONS (same as before)
// ------------------------------------
function renderStudents() {
  const container = document.getElementById("students-list");
  container.innerHTML = "";

  Object.entries(students)
    .sort(([a], [b]) => a - b)
    .forEach(([roll, name]) => {
      const div = document.createElement("div");
      div.className = "student-card";
      div.innerHTML = `
        <div class="student-info">
          <div class="roll-number">${roll}</div>
          <div class="student-name">${name}</div>
        </div>
        <button onclick="removeStudent('${roll}')" class="remove-btn">X</button>
      `;
      container.appendChild(div);
    });

  document.getElementById("students-count").textContent =
    `All Students (${Object.keys(students).length})`;
}

function renderAbsentees() {
  const container = document.getElementById("absentees-list");
  container.innerHTML = "";

  absentees.sort((a, b) => a - b).forEach(roll => {
    const div = document.createElement("div");
    div.className = "absentee-card";
    div.innerHTML = `
      <div class="absentee-info">
        <div class="roll-number">${roll}</div>
        <div class="student-name">${students[roll]}</div>
      </div>
      <button onclick="removeAbsentee(${roll})" class="remove-btn">X</button>
    `;
    container.appendChild(div);
  });

  updateStats();
}

function updateStats() {
  document.getElementById("absentees-count").textContent = absentees.length;
  document.getElementById("total-students").textContent = Object.keys(students).length;
  document.getElementById("present-count").textContent =
    Object.keys(students).length - absentees.length;
}

function showLogin() {
  // hide admin UI
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
  
  attendanceTab.style.display = "none";
  manageTab.style.display = "none";
}

function showAdminPanel() {
  // show admin UI
  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";

  attendanceTab.style.display = "block";
  manageTab.style.display = "block";

  // load data for admin
  loadStudents();
}
