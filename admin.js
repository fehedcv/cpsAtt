import { db, auth, adminLogin, adminLogout, onAuth } from "./firebase.js";
import {
  collection,
  doc,
  getDocs,
  getDoc,
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
const dateInputEl = document.getElementById("attendance-date"); // NEW REF

// Hide panel until login
attendanceTab.style.display = "none";
manageTab.style.display = "none";

loginBtn.onclick = adminLogin;
logoutBtn.onclick = adminLogout;

let students = {};
let absentees = [];
let selectedTime = "";
let hourSelections = {}; 
// Example: { "7": [1,2], "12":[4] }


// ------------------------------------
// SET DEFAULT DATE TO TODAY (NEW)
// ------------------------------------
const today = new Date();
const yyyy = today.getFullYear();
const mm = String(today.getMonth() + 1).padStart(2, '0');
const dd = String(today.getDate()).padStart(2, '0');
dateInputEl.value = `${yyyy}-${mm}-${dd}`; // Sets input value


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
    "rafipoly@gmail.com",
    "teacher@school.com"
  ];

  if (!allowedAdmins.includes(user.email)) {
    alert("You are NOT allowed to access this admin panel.");
    adminLogout();
    // redirect to student page
    window.location.href = "/";
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


// --- ENABLE ADD BUTTON & ENTER KEY ---
addBtnEl.addEventListener("click", (e) => {
  e.preventDefault();
  addRoll();
});

rollInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addRoll();
  }
});


// --- FUNCTION TO ADD ROLL ---
function addRoll() {
  const raw = rollInputEl.value;

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

  if (!students[String(val)]) {
    alert("Roll not found");
    rollInputEl.value = "";
    rollInputEl.focus();
    return;
  }

  // Add if new
  if (!absentees.includes(val)) {
    absentees.push(val);
  }

  // Auto-select hours ONLY when FN/AN already chosen
  if (selectedTime) {
    hourSelections[val] =
      selectedTime === "FORENOON" ? [1, 2, 3] : [4, 5, 6];
  }

  renderAbsentees();
  alert(`${students[String(val)]} marked as absent`);

  rollInputEl.value = "";
  rollInputEl.focus();
}



// ------------------------------------
// REMOVE ABSENTEE
// ------------------------------------
window.removeAbsentee = function (roll) {
  absentees = absentees.filter(x => x !== roll);
  delete hourSelections[roll];
  renderAbsentees();
};

// ------------------------------------
// SELECT TIME
// ------------------------------------
document.getElementById("afternoon").onchange = () => {
  selectedTime = "AFTERNOON";
  renderAbsentees();
};
document.getElementById("forenoon").onchange = () => {
  selectedTime = "FORENOON";
  renderAbsentees();
};


// ------------------------------------
// HOUR BUTTON CLICK HANDLER
// ------------------------------------
function enableHourSelectors() {
  document.querySelectorAll(".hour-btn").forEach(btn => {
    btn.onclick = () => {
      const roll = btn.dataset.roll;
      const hour = parseInt(btn.dataset.hour);

      if (!hourSelections[roll]) hourSelections[roll] = [];

      if (hourSelections[roll].includes(hour)) {
        hourSelections[roll] = hourSelections[roll].filter(h => h !== hour);
        btn.classList.remove("active");
      } else {
        hourSelections[roll].push(hour);
        btn.classList.add("active");
      }
    };
  });
}


// ------------------------------------
// RENDER ABSENTEES WITH HOUR BUTTONS
// ------------------------------------
function renderAbsentees() {
  const container = document.getElementById("absentees-list");
  container.innerHTML = "";

  if (absentees.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>All present so far!</p>
        <span>Add roll numbers to mark absentees</span>
      </div>`;
    return;
  }

  if (!selectedTime) {
    container.innerHTML = `
      <div class="empty-state">
        <p>Rolls added. Now select Forenoon or Afternoon.</p>
      </div>`;
    return;
}


  const hours = selectedTime === "FORENOON" ? [1,2,3] : [4,5,6];

  absentees.sort((a, b) => a - b).forEach(roll => {
    const div = document.createElement("div");
    div.className = "absentee-card";

    let hourButtons = hours.map(h =>
      `<button class="hour-btn ${hourSelections[roll]?.includes(h) ? "active" : ""}" 
               data-roll="${roll}" data-hour="${h}">
          H${h}
       </button>`
    ).join("");

    div.innerHTML = `
      <div class="absentee-info">
        <div class="roll-number">${roll}</div>
        <div class="student-name">${students[roll]}</div>
      </div>
      <div class="hour-row">${hourButtons}</div>
      <button onclick="removeAbsentee(${roll})" class="remove-btn">X</button>
    `;

    container.appendChild(div);
  });

  enableHourSelectors();
  updateStats();
}


// ------------------------------------
// SAVE + SEND WHATSAPP (UPDATED)
// ------------------------------------
async function saveAndSendWhatsApp() {
  if (!selectedTime) return alert("Select FN/AN");
  if (absentees.length === 0) return alert("No absentees");

  // Get date from input (Format is YYYY-MM-DD from the HTML input)
  const rawDate = dateInputEl.value; 
  if (!rawDate) return alert("Please select a date");

  // Create formatted string for WhatsApp (DD:MM:YYYY)
  const [year, month, day] = rawDate.split("-");
  const formattedDate = `${day}:${month}:${year}`;

  // Get Day Name (e.g., Monday)
  const dateObj = new Date(rawDate);
  const dayStr = dateObj.toLocaleDateString("en-GB", { weekday: "long" });

  // Use rawDate (YYYY-MM-DD) for Firestore ID to keep sorting correct
  const ref = doc(db, "attendance", rawDate);

  let record = {
    hours: {1:[],2:[],3:[],4:[],5:[],6:[]}
  };

  const snap = await getDoc(ref);
  if (snap.exists()) record = snap.data();

  Object.keys(hourSelections).forEach(roll => {
    hourSelections[roll].forEach(h => {
      if (!record.hours[h].includes(parseInt(roll))) {
        record.hours[h].push(parseInt(roll));
      }
    });
  });

  await setDoc(ref, record);
  alert("Saved to database");

  // Use formattedDate (DD:MM:YYYY) for the message
  let msg = `Attendance ${formattedDate} (${dayStr})\n------------------\n`;

  absentees.forEach(roll => {
    const hours = hourSelections[roll] || [];
    msg += `${roll} - ${students[roll]} → Hours: H${hours.join(", H") || "None"}\n`;
  });

  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
}

document.getElementById("send-btn").onclick = saveAndSendWhatsApp;


// ------------------------------------
// OTHER RENDER FUNCTIONS
// ------------------------------------
function renderStudents() {
  const container = document.getElementById("students-list");
  container.innerHTML = "";

  Object.entries(students)
    .sort(([a],[b]) => a - b)
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

function updateStats() {
  document.getElementById("absentees-count").textContent = absentees.length;
  document.getElementById("total-students").textContent = Object.keys(students).length;
  document.getElementById("present-count").textContent =
    Object.keys(students).length - absentees.length;
}


// ------------------------------------
function showLogin() {
  loginBtn.style.display = "inline-block";
  logoutBtn.style.display = "none";
  attendanceTab.style.display = "none";
  manageTab.style.display = "none";
}

function showAdminPanel() {
  loginBtn.style.display = "none";
  logoutBtn.style.display = "inline-block";
  attendanceTab.style.display = "block";
  manageTab.style.display = "block";
  loadStudents();
}