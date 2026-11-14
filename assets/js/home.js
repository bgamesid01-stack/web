document.addEventListener("DOMContentLoaded", () => {
  const user = window.activeUser;
  if (!user) return;

  document.body.classList.remove("auth-checking");

  const TASK_STORAGE_KEY = `akunportal_tasks_${user.email.toLowerCase()}`;
  let currentFilter = "all";
  let toastTimeout = null;

  // 1. Sapaan Waktu Dinamis & Data Profil
  function getGreetingByHour() {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat Pagi";
    if (hour >= 11 && hour < 15) return "Selamat Siang";
    if (hour >= 15 && hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }

  function formatDisplayDate(rawDate) {
    if (!rawDate || rawDate === "-") return "-";
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime()) && String(rawDate).includes("-")) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      }).format(parsed);
    }
    return String(rawDate);
  }

  function formatTimeOnly(isoString) {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    }).format(d);
  }

  function generateFingerprint(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = (hash << 5) - hash + email.charCodeAt(i);
      hash |= 0;
    }
    return `SKR-${Math.abs(hash).toString(16).toUpperCase().padStart(6, "0")}`;
  }

  const displayName = user.name || user.email.split("@")[0] || "Pengguna";
  const initial = displayName.charAt(0).toUpperCase();

  document.getElementById("greeting-eyebrow").textContent = `${getGreetingByHour()},`;
  document.getElementById("nav-avatar").textContent = initial;
  document.getElementById("nav-username").textContent = displayName;
  document.getElementById("hero-name").textContent = displayName;
  document.getElementById("card-email").textContent = user.email;
  document.getElementById("card-date").textContent = formatDisplayDate(user.createdAt);

  document.getElementById("detail-name").textContent = displayName;
  document.getElementById("detail-storage").textContent =
    user.storageType === "session" ? "Sesi Browser Sementara" : "Lokal Persisten";
  document.getElementById("detail-login-time").textContent = formatTimeOnly(user.loginAt);
  document.getElementById("detail-fingerprint").textContent = generateFingerprint(user.email);

  // 2. Toast & Activity Log Helpers
  const toastEl = document.getElementById("toast");
  const activityListEl = document.getElementById("activity-list");

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.add("hidden");
    }, 2600);
  }

  function logActivity(text) {
    const li = document.createElement("li");
    li.className = "activity-item";

    const dot = document.createElement("span");
    dot.className = "activity-dot";

    const content = document.createElement("div");
    content.className = "activity-content";

    const p = document.createElement("p");
    p.textContent = text;

    const time = document.createElement("time");
    time.textContent = formatTimeOnly(new Date().toISOString());

    content.appendChild(p);
    content.appendChild(time);
    li.appendChild(dot);
    li.appendChild(content);

    activityListEl.prepend(li);
    while (activityListEl.children.length > 12) {
      activityListEl.removeChild(activityListEl.lastChild);
    }
  }

  logActivity("Sesi terverifikasi dan workspace dimuat.");

  // 3. Jam Real-Time & Timer Durasi Sesi
  const liveClockEl = document.getElementById("live-clock");
  const sessionTimerEl = document.getElementById("session-timer");
  const sessionStartMs = new Date(user.loginAt).getTime() || Date.now();

  function updateClocks() {
    const now = new Date();
    liveClockEl.textContent = new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(now) + " WIB";

    const elapsedSec = Math.max(0, Math.floor((Date.now() - sessionStartMs) / 1000));
    const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, "0");
    const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, "0");
    const secs = String(elapsedSec % 60).padStart(2, "0");
    sessionTimerEl.textContent = `${hrs}:${mins}:${secs}`;
  }

  updateClocks();
  setInterval(updateClocks, 1000);

  // 4. Salin Email Cepat
  const btnCopyEmail = document.getElementById("btn-copy-email");
  btnCopyEmail.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(user.email);
      showToast("Alamat email disalin ke clipboard.");
      logActivity("Menyalin alamat email akun.");
    } catch {
      showToast("Gagal menyalin email secara otomatis.");
    }
  });

  // 5. Manajemen Tugas & Catatan Workspace (Per-Akun)
  const taskForm = document.getElementById("task-form");
  const taskInput = document.getElementById("task-input");
  const taskTagSelect = document.getElementById("task-tag");
  const taskListEl = document.getElementById("task-list");
  const taskEmptyEl = document.getElementById("task-empty");
  const taskCounterEl = document.getElementById("task-counter");
  const filterChips = document.querySelectorAll(".filter-chip");

  function loadTasks() {
    try {
      const raw = localStorage.getItem(TASK_STORAGE_KEY);
      if (!raw) {
        return [
          {
            id: "welcome-1",
            title: "Verifikasi koneksi sinkronisasi Google Sheets",
            tag: "Kerja",
            completed: true
          },
          {
            id: "welcome-2",
            title: "Lengkapi catatan kerja prioritas hari ini",
            tag: "Penting",
            completed: false
          }
        ];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  let tasks = loadTasks();

  function saveTasks() {
    localStorage.setItem(TASK_STORAGE_KEY, JSON.stringify(tasks));
  }

  function renderTasks() {
    const completedCount = tasks.filter((t) => t.completed).length;
    taskCounterEl.textContent = `${completedCount}/${tasks.length} Selesai`;

    const filtered = tasks.filter((task) => {
      if (currentFilter === "active") return !task.completed;
      if (currentFilter === "completed") return task.completed;
      return true;
    });

    taskListEl.innerHTML = "";
    taskEmptyEl.classList.toggle("hidden", filtered.length > 0);

    filtered.forEach((task) => {
      const li = document.createElement("li");
      li.className = `task-item${task.completed ? " completed" : ""}`;

      const left = document.createElement("div");
      left.className = "task-left";
      left.setAttribute("role", "button");
      left.setAttribute("tabindex", "0");

      const check = document.createElement("span");
      check.className = "task-check";
      check.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;

      const titleSpan = document.createElement("span");
      titleSpan.className = "task-title";
      titleSpan.textContent = task.title;

      left.appendChild(check);
      left.appendChild(titleSpan);

      const toggleTask = () => {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        logActivity(`${task.completed ? "Menyelesaikan" : "Membuka kembali"} tugas: "${task.title}"`);
      };

      left.addEventListener("click", toggleTask);
      left.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleTask();
        }
      });

      const right = document.createElement("div");
      right.className = "task-right";

      const tagBadge = document.createElement("span");
      tagBadge.className = "tag-pill";
      tagBadge.dataset.tag = task.tag;
      tagBadge.textContent = task.tag;

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-del-task";
      delBtn.setAttribute("aria-label", "Hapus catatan");
      delBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`;
      delBtn.addEventListener("click", () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderTasks();
        showToast("Catatan dihapus.");
        logActivity(`Menghapus catatan: "${task.title}"`);
      });

      right.appendChild(tagBadge);
      right.appendChild(delBtn);

      li.appendChild(left);
      li.appendChild(right);
      taskListEl.appendChild(li);
    });
  }

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    if (!title) return;

    tasks.unshift({
      id: `task-${Date.now()}`,
      title,
      tag: taskTagSelect.value,
      completed: false
    });

    saveTasks();
    renderTasks();
    taskInput.value = "";
    showToast("Catatan baru ditambahkan.");
    logActivity(`Menambahkan catatan baru (${taskTagSelect.value}).`);
  });

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filterChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentFilter = chip.dataset.filter;
      renderTasks();
    });
  });

  renderTasks();

  // 6. Ekspor Ringkasan Sesi (.json)
  const btnExportSession = document.getElementById("btn-export-session");
  btnExportSession.addEventListener("click", () => {
    const exportData = {
      portal: "SakuraPortal",
      exportedAt: new Date().toISOString(),
      account: {
        name: displayName,
        email: user.email,
        createdAt: user.createdAt || null,
        fingerprint: generateFingerprint(user.email)
      },
      workspaceSummary: {
        totalTasks: tasks.length,
        completedTasks: tasks.filter((t) => t.completed).length
      }
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sakura-session-${user.email.split("@")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast("Ringkasan sesi berhasil diunduh.");
    logActivity("Mengekspor ringkasan sesi ke file JSON.");
  });

  // 7. Modal Konfirmasi Logout
  const logoutTrigger = document.getElementById("btn-logout-trigger");
  const logoutModal = document.getElementById("logout-modal");
  const btnCancelLogout = document.getElementById("btn-cancel-logout");
  const btnConfirmLogout = document.getElementById("btn-confirm-logout");

  function openLogoutModal() {
    logoutModal.classList.remove("hidden");
    btnConfirmLogout.focus();
  }

  function closeLogoutModal() {
    logoutModal.classList.add("hidden");
  }

  function performLogout() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    closeLogoutModal();
    document.body.classList.add("is-leaving");
    setTimeout(() => {
      window.location.replace(LOGIN_PAGE);
    }, 200);
  }

  logoutTrigger.addEventListener("click", openLogoutModal);
  btnCancelLogout.addEventListener("click", closeLogoutModal);
  btnConfirmLogout.addEventListener("click", performLogout);

  logoutModal.addEventListener("click", (e) => {
    if (e.target === logoutModal) closeLogoutModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !logoutModal.classList.contains("hidden")) {
      closeLogoutModal();
    }
  });
});
