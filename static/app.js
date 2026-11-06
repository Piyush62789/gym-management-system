// -------------------------------------------------------------
// Apex Fitness Gym Management - Client Controller
// -------------------------------------------------------------

const API_BASE = "";

// State
let membersCache = [];
let plansCache = [];
let trainersCache = [];
let currentUser = null;

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
  setupEventListeners();
  checkAuth();
  checkHealth();
  loadDashboard();
});

// Authentication System
function checkAuth() {
  const saved = localStorage.getItem("apex_user");
  if (saved) {
    try {
      currentUser = JSON.parse(saved);
      updateUserTopbar();
    } catch (e) {
      currentUser = null;
      openModal("modal-login-gate");
    }
  } else {
    openModal("modal-login-gate");
  }
}

function updateUserTopbar() {
  if (!currentUser) return;
  const nameEl = document.getElementById("user-display-name");
  const roleEl = document.getElementById("user-display-role");
  const avatarEl = document.getElementById("user-avatar");

  if (nameEl) nameEl.textContent = currentUser.name;
  if (roleEl) roleEl.textContent = currentUser.role.toUpperCase();
  if (avatarEl) avatarEl.textContent = currentUser.name[0].toUpperCase();
}

function switchLoginRole(role) {
  document.querySelectorAll(".role-pill").forEach(p => p.classList.remove("active"));
  document.querySelector(`.role-pill[data-role="${role}"]`)?.classList.add("active");
  
  const emailInput = document.getElementById("login-email");
  const passInput = document.getElementById("login-password");
  const roleText = document.getElementById("login-active-role-text");

  if (role === "admin") {
    if (emailInput) emailInput.value = "admin@apexfitness.com";
    if (passInput) passInput.value = "ApexAdmin2026!";
    if (roleText) roleText.textContent = "Administrator";
  } else if (role === "staff") {
    if (emailInput) emailInput.value = "staff@apexfitness.com";
    if (passInput) passInput.value = "StaffPass2026!";
    if (roleText) roleText.textContent = "Front Desk Staff";
  } else {
    if (emailInput) emailInput.value = "member@apexfitness.com";
    if (passInput) passInput.value = "Member2026!";
    if (roleText) roleText.textContent = "Gym Member";
  }
}

function handleLoginSubmit(e) {
  e.preventDefault();
  const activeRoleBtn = document.querySelector(".role-pill.active");
  const role = activeRoleBtn ? activeRoleBtn.getAttribute("data-role") : "admin";
  const email = document.getElementById("login-email")?.value || "admin@apexfitness.com";

  const names = {
    admin: "Admin Director",
    staff: "Coach Vance (Staff)",
    member: "Liam Smith (Member)",
  };

  currentUser = {
    email,
    name: names[role] || "User",
    role,
  };

  localStorage.setItem("apex_user", JSON.stringify(currentUser));
  updateUserTopbar();
  closeModal("modal-login-gate");
  showToast(`Welcome back, ${currentUser.name}!`, "success");
}

function handleSignOut() {
  localStorage.removeItem("apex_user");
  currentUser = null;
  openModal("modal-login-gate");
  showToast("You have been signed out.", "info");
}

function toggleGoal(btn) {
  const isCompleted = btn.classList.toggle("completed");
  const check = btn.querySelector(".goal-check");
  if (check) check.textContent = isCompleted ? "✓" : "○";
}

function addCustomGoal() {
  const title = prompt("Enter new daily fitness goal:");
  if (!title) return;
  const list = document.getElementById("activity-goals-list");
  if (!list) return;

  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "goal-item";
  btn.onclick = function() { toggleGoal(this); };
  btn.innerHTML = `<span class="goal-check">○</span><span class="goal-text">${title}</span>`;
  list.appendChild(btn);
  showToast(`Goal added: "${title}"`, "success");
}

// Toast Notifications
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  let icon = "ℹ️";
  if (type === "success") icon = "✅";
  if (type === "error") icon = "⚠️";

  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Navigation Handling
function setupNavigation() {
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((btn) => {
    btn.addEventListener("click", () => {
      navItems.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const tabId = btn.getAttribute("data-tab");
      document.querySelectorAll(".tab-content").forEach((t) => t.classList.remove("active"));
      const activeTab = document.getElementById(`tab-${tabId}`);
      if (activeTab) activeTab.classList.add("active");

      updateTopBar(tabId);
      loadTabContent(tabId);
    });
  });
}

function updateTopBar(tab) {
  const titles = {
    dashboard: { title: "Dashboard Overview", subtitle: "Real-time gym performance and member activity", actionText: "+ Add Member" },
    members: { title: "Member Directory", subtitle: "Manage member accounts, profiles, and attendance", actionText: "+ Add Member" },
    plans: { title: "Membership Plans", subtitle: "Configure subscription tiers and pricing", actionText: "+ New Plan" },
    subscriptions: { title: "Member Subscriptions", subtitle: "Active, pending, and past memberships", actionText: "+ Assign Sub" },
    trainers: { title: "Coaches & Trainers", subtitle: "Staff roster, specializations, and billing", actionText: "+ Add Trainer" },
    classes: { title: "Class Schedules & Bookings", subtitle: "Group sessions, capacity, and reservations", actionText: "+ Schedule Class" },
    attendance: { title: "Gym Check-in Terminal", subtitle: "Live attendance records and check-outs", actionText: "+ Record Check-in" },
  };

  const meta = titles[tab] || titles.dashboard;
  document.getElementById("page-title").textContent = meta.title;
  document.getElementById("page-subtitle").textContent = meta.subtitle;
  const headerBtn = document.getElementById("btn-header-action");
  headerBtn.textContent = meta.actionText;
}

function loadTabContent(tab) {
  if (tab === "dashboard") loadDashboard();
  if (tab === "members") loadMembers();
  if (tab === "plans") loadPlans();
  if (tab === "subscriptions") loadSubscriptions();
  if (tab === "trainers") loadTrainers();
  if (tab === "classes") loadClasses();
  if (tab === "attendance") loadAttendance();
}

// Setup Event Listeners
function setupEventListeners() {
  // Topbar quick buttons
  document.getElementById("btn-quick-checkin").addEventListener("click", () => {
    const navAtt = document.querySelector('[data-tab="attendance"]');
    if (navAtt) navAtt.click();
    document.getElementById("terminal-member-id")?.focus();
  });

  document.getElementById("btn-header-action").addEventListener("click", () => {
    const activeTab = document.querySelector(".nav-item.active")?.getAttribute("data-tab");
    if (activeTab === "plans") openModal("modal-add-plan");
    else if (activeTab === "subscriptions") openModal("modal-add-subscription");
    else if (activeTab === "trainers") openModal("modal-add-trainer");
    else if (activeTab === "classes") openModal("modal-add-class");
    else openModal("modal-add-member");
  });

  // Seed demo data
  document.getElementById("btn-seed-data").addEventListener("click", async () => {
    const btn = document.getElementById("btn-seed-data");
    btn.disabled = true;
    btn.textContent = "Seeding...";
    try {
      const res = await fetch(`${API_BASE}/api/v1/seed`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, "success");
        loadDashboard();
      } else {
        showToast(data.detail || "Seed failed", "error");
      }
    } catch (err) {
      showToast("Network error while seeding data", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "⚡ Seed Demo Data";
    }
  });

  // Forms
  document.getElementById("form-login-auth")?.addEventListener("submit", handleLoginSubmit);
  document.getElementById("btn-sign-out")?.addEventListener("click", handleSignOut);
  document.getElementById("form-add-member").addEventListener("submit", handleAddMember);
  document.getElementById("form-add-plan").addEventListener("submit", handleAddPlan);
  document.getElementById("form-add-subscription").addEventListener("submit", handleAddSubscription);
  document.getElementById("form-add-trainer").addEventListener("submit", handleAddTrainer);
  document.getElementById("form-add-class").addEventListener("submit", handleAddClass);
  document.getElementById("form-book-class").addEventListener("submit", handleBookClass);
  document.getElementById("form-terminal-checkin").addEventListener("submit", handleTerminalCheckin);

  // Filters & Search
  document.getElementById("member-search-input").addEventListener("input", debounce(loadMembers, 300));
  document.getElementById("member-status-filter").addEventListener("change", loadMembers);
  document.getElementById("sub-status-filter").addEventListener("change", loadSubscriptions);
  document.getElementById("trainer-search-input")?.addEventListener("input", debounce(loadTrainers, 300));
}

// Check Health
async function checkHealth() {
  const dot = document.getElementById("server-status-dot");
  const text = document.getElementById("server-status-text");
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    if (data.status === "healthy") {
      dot.className = "status-indicator online";
      text.textContent = "System Healthy (v" + data.version + ")";
    } else {
      dot.className = "status-indicator";
      text.textContent = "Degraded Connection";
    }
  } catch (err) {
    dot.className = "status-indicator";
    text.textContent = "Offline";
  }
}

// -------------------------------------------------------------
// Dashboard View
// -------------------------------------------------------------
async function loadDashboard() {
  try {
    const res = await fetch(`${API_BASE}/api/v1/dashboard`);
    if (!res.ok) return;
    const stats = await res.json();

    document.getElementById("kpi-total-members").textContent = stats.total_members;
    document.getElementById("kpi-active-members").textContent = stats.active_members;
    document.getElementById("kpi-active-subs").textContent = stats.active_subscriptions;
    document.getElementById("kpi-revenue").textContent = `$${stats.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    document.getElementById("kpi-checkins").textContent = stats.today_checkins;

    // Load mini tables
    loadDashboardAttendance();
    loadDashboardClasses();
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

async function loadDashboardAttendance() {
  const tbody = document.getElementById("dash-attendance-tbody");
  try {
    const res = await fetch(`${API_BASE}/api/v1/attendance?limit=5`);
    const logs = await res.json();
    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">No check-ins recorded yet today.</td></tr>`;
      return;
    }
    tbody.innerHTML = logs.map(l => `
      <tr>
        <td><strong>Member #${l.member_id}</strong></td>
        <td>${formatDateTime(l.check_in)}</td>
        <td>${l.check_out ? formatDateTime(l.check_out) : '<span class="badge badge-active">Inside Gym</span>'}</td>
        <td>
          ${!l.check_out ? `<button class="btn btn-sm btn-outline" onclick="checkOutMember(${l.id})">Check-out</button>` : '—'}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted">Failed to load attendance.</td></tr>`;
  }
}

async function loadDashboardClasses() {
  const container = document.getElementById("dash-classes-list");
  try {
    const res = await fetch(`${API_BASE}/api/v1/classes?limit=3`);
    const classes = await res.json();
    if (!classes.length) {
      container.innerHTML = `<div class="text-center text-muted">No classes scheduled.</div>`;
      return;
    }
    container.innerHTML = classes.map(c => `
      <div class="card p-3 mb-2" style="background: var(--bg-subtle);">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <strong>${c.title}</strong>
          <span class="badge badge-confirmed">${c.enrolled_count}/${c.capacity} spots</span>
        </div>
        <div class="text-muted" style="font-size:12px; margin-top:4px;">
          📅 ${formatDateTime(c.schedule_time)} • ${c.duration_minutes} mins
        </div>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = `<div class="text-center text-muted">Failed to load classes.</div>`;
  }
}

// -------------------------------------------------------------
// Members Management
// -------------------------------------------------------------
async function loadMembers() {
  const tbody = document.getElementById("members-tbody");
  tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Loading members...</td></tr>`;

  const search = document.getElementById("member-search-input")?.value.trim() || "";
  const isActive = document.getElementById("member-status-filter")?.value || "";

  let url = `${API_BASE}/api/v1/members?limit=100`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (isActive) url += `&is_active=${isActive}`;

  try {
    const res = await fetch(url);
    const members = await res.json();
    membersCache = members;

    if (!members.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No members match your criteria.</td></tr>`;
      return;
    }

    tbody.innerHTML = members.map(m => `
      <tr>
        <td><strong>#${m.id}</strong></td>
        <td>${m.first_name} ${m.last_name}</td>
        <td>${m.email}</td>
        <td>${m.phone}</td>
        <td>${m.gender || '—'}</td>
        <td>
          <span class="badge ${m.is_active ? 'badge-active' : 'badge-inactive'}">
            ${m.is_active ? 'Active' : 'Inactive'}
          </span>
        </td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm btn-outline" onclick="viewMemberDetail(${m.id})">Profile</button>
            <button class="btn btn-sm btn-danger" onclick="deleteMember(${m.id})">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">Failed to fetch members.</td></tr>`;
  }
}

async function handleAddMember(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const payload = Object.fromEntries(formData.entries());

  if (!payload.date_of_birth) delete payload.date_of_birth;

  try {
    const res = await fetch(`${API_BASE}/api/v1/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Member ${data.first_name} registered successfully!`, "success");
      closeModal("modal-add-member");
      form.reset();
      loadMembers();
      loadDashboard();
    } else {
      showToast(data.detail || "Failed to add member", "error");
    }
  } catch (err) {
    showToast("Network error adding member", "error");
  }
}

async function deleteMember(id) {
  if (!confirm(`Are you sure you want to delete member #${id}? This removes all related records.`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/v1/members/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast(`Member #${id} removed successfully`, "success");
      loadMembers();
      loadDashboard();
    } else {
      const data = await res.json();
      showToast(data.detail || "Delete failed", "error");
    }
  } catch (err) {
    showToast("Network error deleting member", "error");
  }
}

async function viewMemberDetail(id) {
  openModal("modal-member-detail");
  const body = document.getElementById("detail-member-body");
  const title = document.getElementById("detail-member-name");
  body.innerHTML = `<div class="text-center text-muted">Loading profile...</div>`;

  try {
    const res = await fetch(`${API_BASE}/api/v1/members/${id}`);
    if (!res.ok) throw new Error();
    const m = await res.json();

    title.textContent = `${m.first_name} ${m.last_name} (#${m.id})`;
    body.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
        <div><strong>Email:</strong> ${m.email}</div>
        <div><strong>Phone:</strong> ${m.phone}</div>
        <div><strong>Status:</strong> <span class="badge ${m.is_active ? 'badge-active' : 'badge-inactive'}">${m.is_active ? 'Active' : 'Inactive'}</span></div>
        <div><strong>Member Since:</strong> ${formatDateTime(m.created_at)}</div>
        <div><strong>Emergency Contact:</strong> ${m.emergency_contact || 'None'}</div>
        <div><strong>Date of Birth:</strong> ${m.date_of_birth || 'Not recorded'}</div>
      </div>

      <h4 style="margin: 18px 0 10px; border-bottom: 1px solid var(--border); padding-bottom: 6px;">Active & Past Subscriptions</h4>
      ${m.subscriptions && m.subscriptions.length ? `
        <table class="data-table mb-3">
          <thead>
            <tr><th>Plan</th><th>Valid From</th><th>Valid Until</th><th>Amount</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${m.subscriptions.map(s => `
              <tr>
                <td>Plan #${s.plan_id}</td>
                <td>${s.start_date}</td>
                <td>${s.end_date}</td>
                <td>$${s.amount_paid}</td>
                <td><span class="badge badge-${s.status}">${s.status}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p class="text-muted" style="font-size:13px;">No subscriptions found.</p>'}

      <h4 style="margin: 18px 0 10px; border-bottom: 1px solid var(--border); padding-bottom: 6px;">Recent Attendance History</h4>
      ${m.attendances && m.attendances.length ? `
        <table class="data-table">
          <thead>
            <tr><th>Check-in</th><th>Check-out</th></tr>
          </thead>
          <tbody>
            ${m.attendances.slice(0, 5).map(a => `
              <tr>
                <td>${formatDateTime(a.check_in)}</td>
                <td>${a.check_out ? formatDateTime(a.check_out) : '<span class="badge badge-active">Inside Gym</span>'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : '<p class="text-muted" style="font-size:13px;">No check-in history.</p>'}
    `;
  } catch (err) {
    body.innerHTML = `<div class="text-center text-muted">Failed to load member profile.</div>`;
  }
}

// -------------------------------------------------------------
// Membership Plans
// -------------------------------------------------------------
async function loadPlans() {
  const container = document.getElementById("plans-container");
  container.innerHTML = `<div class="text-center text-muted col-span-3">Loading membership plans...</div>`;

  try {
    const res = await fetch(`${API_BASE}/api/v1/plans`);
    const plans = await res.json();
    plansCache = plans;

    if (!plans.length) {
      container.innerHTML = `<div class="text-center text-muted col-span-3">No membership plans created yet.</div>`;
      return;
    }

    container.innerHTML = plans.map(p => `
      <div class="plan-card">
        <div>
          <div style="display:flex; justify-content:space-between; align-items:flex-start;">
            <h3>${p.name}</h3>
            <span class="badge ${p.is_active ? 'badge-active' : 'badge-inactive'}">${p.is_active ? 'Active' : 'Archived'}</span>
          </div>
          <div class="plan-price">$${p.price.toFixed(2)} <span>/ ${p.duration_days} days</span></div>
          <p class="text-muted" style="font-size:13px; min-height:40px;">${p.description || 'General gym access and facilities.'}</p>
        </div>
        <div style="margin-top:20px; display:flex; gap:8px;">
          <button class="btn btn-primary w-100 btn-sm" onclick="quickAssignPlan(${p.id})">Assign to Member</button>
          <button class="btn btn-danger btn-sm" onclick="deletePlan(${p.id})">Delete</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = `<div class="text-center text-muted col-span-3">Failed to load plans.</div>`;
  }
}

async function handleAddPlan(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const payload = {
    name: formData.get("name"),
    description: formData.get("description"),
    duration_days: parseInt(formData.get("duration_days")),
    price: parseFloat(formData.get("price")),
    is_active: true
  };

  try {
    const res = await fetch(`${API_BASE}/api/v1/plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Plan '${data.name}' created!`, "success");
      closeModal("modal-add-plan");
      form.reset();
      loadPlans();
    } else {
      showToast(data.detail || "Failed to create plan", "error");
    }
  } catch (err) {
    showToast("Network error creating plan", "error");
  }
}

async function deletePlan(id) {
  if (!confirm(`Are you sure you want to delete or deactivate plan #${id}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/v1/plans/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      showToast(data.message, "success");
      loadPlans();
    } else {
      showToast(data.detail || "Failed to delete plan", "error");
    }
  } catch (err) {
    showToast("Network error deleting plan", "error");
  }
}

function quickAssignPlan(planId) {
  openModal("modal-add-subscription");
  const planSelect = document.getElementById("sub-select-plan");
  if (planSelect) planSelect.value = planId;
}

// -------------------------------------------------------------
// Subscriptions
// -------------------------------------------------------------
async function loadSubscriptions() {
  const tbody = document.getElementById("subs-tbody");
  tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Loading subscriptions...</td></tr>`;

  const status = document.getElementById("sub-status-filter")?.value || "";
  let url = `${API_BASE}/api/v1/subscriptions?limit=100`;
  if (status) url += `&status=${status}`;

  try {
    const res = await fetch(url);
    const subs = await res.json();

    if (!subs.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">No subscriptions found.</td></tr>`;
      return;
    }

    tbody.innerHTML = subs.map(s => `
      <tr>
        <td><strong>#${s.id}</strong></td>
        <td>Member #${s.member_id}</td>
        <td>Plan #${s.plan_id}</td>
        <td>${s.start_date}</td>
        <td>${s.end_date}</td>
        <td><strong>$${s.amount_paid.toFixed(2)}</strong></td>
        <td><span class="badge badge-${s.status}">${s.status}</span></td>
        <td>
          ${s.status === 'active' ? `
            <button class="btn btn-sm btn-danger" onclick="cancelSubscription(${s.id})">Cancel</button>
          ` : '—'}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center text-muted">Failed to load subscriptions.</td></tr>`;
  }
}

async function handleAddSubscription(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const payload = {
    member_id: parseInt(formData.get("member_id")),
    plan_id: parseInt(formData.get("plan_id")),
    start_date: formData.get("start_date") || null,
    amount_paid: formData.get("amount_paid") ? parseFloat(formData.get("amount_paid")) : null,
  };

  try {
    const res = await fetch(`${API_BASE}/api/v1/subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      showToast("Subscription assigned successfully!", "success");
      closeModal("modal-add-subscription");
      form.reset();
      loadSubscriptions();
      loadDashboard();
    } else {
      showToast(data.detail || "Failed to create subscription", "error");
    }
  } catch (err) {
    showToast("Network error creating subscription", "error");
  }
}

async function cancelSubscription(id) {
  if (!confirm(`Cancel subscription #${id}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/v1/subscriptions/${id}/cancel`, { method: "PATCH" });
    if (res.ok) {
      showToast(`Subscription #${id} has been cancelled`, "success");
      loadSubscriptions();
      loadDashboard();
    } else {
      const data = await res.json();
      showToast(data.detail || "Cancellation failed", "error");
    }
  } catch (err) {
    showToast("Network error cancelling subscription", "error");
  }
}

// -------------------------------------------------------------
// Trainers
// -------------------------------------------------------------
async function loadTrainers() {
  const container = document.getElementById("trainers-container");
  container.innerHTML = `<div class="text-center text-muted col-span-3">Loading trainers...</div>`;

  const spec = document.getElementById("trainer-search-input")?.value.trim() || "";
  let url = `${API_BASE}/api/v1/trainers`;
  if (spec) url += `?specialization=${encodeURIComponent(spec)}`;

  try {
    const res = await fetch(url);
    const trainers = await res.json();
    trainersCache = trainers;

    if (!trainers.length) {
      container.innerHTML = `<div class="text-center text-muted col-span-3">No trainers found.</div>`;
      return;
    }

    container.innerHTML = trainers.map(t => `
      <div class="trainer-card">
        <div>
          <div class="trainer-avatar">${t.first_name[0]}${t.last_name[0]}</div>
          <h3>${t.first_name} ${t.last_name}</h3>
          <div class="badge badge-confirmed" style="margin: 6px 0 12px;">${t.specialization}</div>
          <div style="font-size: 13px; color: var(--text-secondary); display: flex; flex-direction: column; gap: 4px;">
            <span>📧 ${t.email}</span>
            <span>📞 ${t.phone}</span>
            <span>💵 $${t.hourly_rate.toFixed(2)} / hour</span>
          </div>
        </div>
        <div style="margin-top: 18px; display: flex; gap: 8px;">
          <button class="btn btn-danger btn-sm w-100" onclick="deleteTrainer(${t.id})">Remove</button>
        </div>
      </div>
    `).join("");
  } catch (err) {
    container.innerHTML = `<div class="text-center text-muted col-span-3">Failed to load trainers.</div>`;
  }
}

async function handleAddTrainer(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const payload = {
    first_name: formData.get("first_name"),
    last_name: formData.get("last_name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    specialization: formData.get("specialization"),
    hourly_rate: formData.get("hourly_rate") ? parseFloat(formData.get("hourly_rate")) : 0.0,
    is_active: true,
  };

  try {
    const res = await fetch(`${API_BASE}/api/v1/trainers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Coach ${data.first_name} added to staff!`, "success");
      closeModal("modal-add-trainer");
      form.reset();
      loadTrainers();
    } else {
      showToast(data.detail || "Failed to add trainer", "error");
    }
  } catch (err) {
    showToast("Network error registering trainer", "error");
  }
}

async function deleteTrainer(id) {
  if (!confirm(`Are you sure you want to remove trainer #${id}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/v1/trainers/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Trainer removed successfully", "success");
      loadTrainers();
    } else {
      const data = await res.json();
      showToast(data.detail || "Delete failed", "error");
    }
  } catch (err) {
    showToast("Network error deleting trainer", "error");
  }
}

// -------------------------------------------------------------
// Classes & Bookings
// -------------------------------------------------------------
async function loadClasses() {
  const container = document.getElementById("classes-container");
  container.innerHTML = `<div class="text-center text-muted col-span-3">Loading classes...</div>`;

  try {
    const res = await fetch(`${API_BASE}/api/v1/classes`);
    const classes = await res.json();

    if (!classes.length) {
      container.innerHTML = `<div class="text-center text-muted col-span-3">No classes scheduled. Click '+ Schedule Class' to create one.</div>`;
      return;
    }

    container.innerHTML = classes.map(c => {
      const percent = Math.min(100, Math.round((c.enrolled_count / c.capacity) * 100));
      const trainerName = c.trainer ? `${c.trainer.first_name} ${c.trainer.last_name}` : "Unassigned";

      return `
        <div class="class-card">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <h3>${c.title}</h3>
              <span class="badge ${c.available_spots > 0 ? 'badge-active' : 'badge-expired'}">
                ${c.available_spots > 0 ? `${c.available_spots} Spots Left` : 'Full'}
              </span>
            </div>
            <div style="font-size: 13px; color: var(--text-muted); margin-top: 4px;">
              Coach: <strong>${trainerName}</strong>
            </div>
            <p class="text-muted" style="font-size: 13px; margin: 10px 0;">${c.description || 'High energy session for all fitness levels.'}</p>
            <div style="font-size: 13px; margin-bottom: 8px;">
              🕒 <strong>${formatDateTime(c.schedule_time)}</strong> (${c.duration_minutes} mins)
            </div>
            <div class="class-capacity-bar">
              <div class="class-capacity-fill" style="width: ${percent}%;"></div>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); text-align: right;">
              ${c.enrolled_count} of ${c.capacity} spots reserved
            </div>
          </div>
          <div style="margin-top: 18px; display: flex; gap: 8px;">
            <button class="btn btn-primary btn-sm w-100" ${c.available_spots === 0 ? 'disabled' : ''} onclick="openBookModal(${c.id}, '${escapeHtml(c.title)}')">
              Reserve Spot
            </button>
            <button class="btn btn-danger btn-sm" onclick="deleteClass(${c.id})">Delete</button>
          </div>
        </div>
      `;
    }).join("");
  } catch (err) {
    container.innerHTML = `<div class="text-center text-muted col-span-3">Failed to load classes.</div>`;
  }
}

async function handleAddClass(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);

  const payload = {
    title: formData.get("title"),
    description: formData.get("description"),
    trainer_id: formData.get("trainer_id") ? parseInt(formData.get("trainer_id")) : null,
    schedule_time: new Date(formData.get("schedule_time")).toISOString(),
    duration_minutes: parseInt(formData.get("duration_minutes")),
    capacity: parseInt(formData.get("capacity")),
  };

  try {
    const res = await fetch(`${API_BASE}/api/v1/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Class '${data.title}' scheduled!`, "success");
      closeModal("modal-add-class");
      form.reset();
      loadClasses();
      loadDashboard();
    } else {
      showToast(data.detail || "Failed to schedule class", "error");
    }
  } catch (err) {
    showToast("Network error scheduling class", "error");
  }
}

function openBookModal(classId, classTitle) {
  document.getElementById("book-class-id").value = classId;
  document.getElementById("book-class-title").textContent = `Book Spot: ${classTitle}`;
  populateMemberDropdown("book-select-member");
  openModal("modal-book-class");
}

async function handleBookClass(e) {
  e.preventDefault();
  const classId = document.getElementById("book-class-id").value;
  const memberId = parseInt(document.getElementById("book-select-member").value);

  try {
    const res = await fetch(`${API_BASE}/api/v1/classes/${classId}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast("Spot reserved successfully!", "success");
      closeModal("modal-book-class");
      loadClasses();
    } else {
      showToast(data.detail || "Booking failed", "error");
    }
  } catch (err) {
    showToast("Network error booking class", "error");
  }
}

async function deleteClass(id) {
  if (!confirm(`Cancel and remove class #${id}?`)) return;

  try {
    const res = await fetch(`${API_BASE}/api/v1/classes/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast("Class cancelled successfully", "success");
      loadClasses();
      loadDashboard();
    } else {
      const data = await res.json();
      showToast(data.detail || "Delete failed", "error");
    }
  } catch (err) {
    showToast("Network error deleting class", "error");
  }
}

// -------------------------------------------------------------
// Attendance
// -------------------------------------------------------------
async function loadAttendance() {
  const tbody = document.getElementById("attendance-tbody");
  tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Loading attendance...</td></tr>`;

  try {
    const res = await fetch(`${API_BASE}/api/v1/attendance?limit=50`);
    const logs = await res.json();

    if (!logs.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No attendance logs found.</td></tr>`;
      return;
    }

    tbody.innerHTML = logs.map(l => `
      <tr>
        <td>#${l.id}</td>
        <td><strong>Member #${l.member_id}</strong></td>
        <td>${formatDateTime(l.check_in)}</td>
        <td>${l.check_out ? formatDateTime(l.check_out) : '<span class="text-muted">—</span>'}</td>
        <td>
          <span class="badge ${l.check_out ? 'badge-confirmed' : 'badge-active'}">
            ${l.check_out ? 'Completed' : 'Inside Facility'}
          </span>
        </td>
        <td>
          ${!l.check_out ? `
            <button class="btn btn-sm btn-primary" onclick="checkOutMember(${l.id})">Record Exit</button>
          ` : '—'}
        </td>
      </tr>
    `).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">Failed to load attendance logs.</td></tr>`;
  }
}

async function handleTerminalCheckin(e) {
  e.preventDefault();
  const memberIdInput = document.getElementById("terminal-member-id");
  const memberId = parseInt(memberIdInput.value);

  try {
    const res = await fetch(`${API_BASE}/api/v1/attendance/check-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ member_id: memberId }),
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Welcome! Member #${memberId} checked in at ${formatDateTime(data.check_in)}`, "success");
      memberIdInput.value = "";
      loadAttendance();
      loadDashboard();
    } else {
      showToast(data.detail || "Check-in failed", "error");
    }
  } catch (err) {
    showToast("Network error recording check-in", "error");
  }
}

async function checkOutMember(attendanceId) {
  try {
    const res = await fetch(`${API_BASE}/api/v1/attendance/check-out/${attendanceId}`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.ok) {
      showToast(`Check-out recorded at ${formatDateTime(data.check_out)}`, "success");
      loadAttendance();
      loadDashboard();
    } else {
      showToast(data.detail || "Check-out failed", "error");
    }
  } catch (err) {
    showToast("Network error recording check-out", "error");
  }
}

// -------------------------------------------------------------
// Modals and Helper Utilities
// -------------------------------------------------------------
function openModal(id) {
  const modal = document.getElementById(id);
  if (modal) {
    modal.classList.add("open");
    // Preload select dropdowns when needed
    if (id === "modal-add-subscription") {
      populateMemberDropdown("sub-select-member");
      populatePlanDropdown("sub-select-plan");
      const today = new Date().toISOString().split("T")[0];
      const startInput = document.getElementById("sub-start-date");
      if (startInput) startInput.value = today;
    }
    if (id === "modal-add-class") {
      populateTrainerDropdown("class-select-trainer");
    }
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("open");
}

// Close modals when clicking backdrop
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal-backdrop")) {
    e.target.classList.remove("open");
  }
});

async function populateMemberDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = `<option value="">Loading members...</option>`;

  try {
    const res = await fetch(`${API_BASE}/api/v1/members?is_active=true&limit=200`);
    const members = await res.json();
    select.innerHTML = `<option value="">Select a member...</option>` +
      members.map(m => `<option value="${m.id}">#${m.id} - ${m.first_name} ${m.last_name} (${m.email})</option>`).join("");
  } catch (err) {
    select.innerHTML = `<option value="">Failed to load members</option>`;
  }
}

async function populatePlanDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = `<option value="">Loading plans...</option>`;

  try {
    const res = await fetch(`${API_BASE}/api/v1/plans?active_only=true`);
    const plans = await res.json();
    select.innerHTML = `<option value="">Select a plan...</option>` +
      plans.map(p => `<option value="${p.id}">${p.name} ($${p.price} / ${p.duration_days} days)</option>`).join("");
  } catch (err) {
    select.innerHTML = `<option value="">Failed to load plans</option>`;
  }
}

async function populateTrainerDropdown(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;
  select.innerHTML = `<option value="">No trainer assigned</option>`;

  try {
    const res = await fetch(`${API_BASE}/api/v1/trainers`);
    const trainers = await res.json();
    select.innerHTML = `<option value="">No trainer assigned</option>` +
      trainers.map(t => `<option value="${t.id}">${t.first_name} ${t.last_name} (${t.specialization})</option>`).join("");
  } catch (err) {
    select.innerHTML = `<option value="">No trainer assigned</option>`;
  }
}

function formatDateTime(isoStr) {
  if (!isoStr) return "—";
  try {
    const d = new Date(isoStr);
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return isoStr;
  }
}

function escapeHtml(str) {
  return str.replace(/'/g, "\\'").replace(/"/g, "&quot;");
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

