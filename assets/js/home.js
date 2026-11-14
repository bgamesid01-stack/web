document.addEventListener("DOMContentLoaded", () => {
  const user = window.activeUser;
  if (!user) return;

  document.body.classList.remove("auth-checking");

  const CLASS_INFO_KEY = "portalkelas_identity_v1";
  const CLASS_TASKS_KEY = `portalkelas_tasks_${user.email.toLowerCase()}`;
  const CLASS_ANNOUNCE_KEY = "portalkelas_announcements_v1";

  let toastTimeout = null;
  let currentTaskFilter = "all";

  // 1. Data Default Jadwal Pelajaran & Piket Kelas
  const WEEKLY_SCHEDULE = {
    Senin: [
      { time: "07:00 - 07:45", subject: "Upacara Bendera & Pembinaan Wali Kelas", teacher: "Wali Kelas", jp: "Jam ke-1" },
      { time: "07:45 - 09:15", subject: "Matematika Tingkat Lanjut", teacher: "Drs. Hendra Wijaya", jp: "Jam ke-2–3" },
      { time: "09:30 - 11:00", subject: "Fisika", teacher: "Siti Aminah, S.Pd., M.Si.", jp: "Jam ke-4–5" },
      { time: "11:00 - 12:30", subject: "Bahasa Indonesia", teacher: "Rina Marlina, S.Pd.", jp: "Jam ke-6–7" },
      { time: "13:15 - 14:45", subject: "Pendidikan Kewarganegaraan", teacher: "Bambang Sutrisno, S.Pd.", jp: "Jam ke-8–9" }
    ],
    Selasa: [
      { time: "07:00 - 08:30", subject: "Kimia", teacher: "Dra. Nurul Hidayah", jp: "Jam ke-1–2" },
      { time: "08:30 - 10:00", subject: "Bahasa Inggris", teacher: "Dian Kusuma, M.Pd.", jp: "Jam ke-3–4" },
      { time: "10:15 - 11:45", subject: "Biologi", teacher: "Arif Rahman, S.Pd.", jp: "Jam ke-5–6" },
      { time: "12:30 - 14:00", subject: "Sejarah Indonesia", teacher: "Eko Prasetyo, S.Pd.", jp: "Jam ke-7–8" }
    ],
    Rabu: [
      { time: "07:00 - 08:30", subject: "Informatika & Pemrograman", teacher: "Rizky Pratama, S.Kom.", jp: "Jam ke-1–2" },
      { time: "08:30 - 10:00", subject: "Matematika Umum", teacher: "Drs. Hendra Wijaya", jp: "Jam ke-3–4" },
      { time: "10:15 - 11:45", subject: "Pendidikan Jasmani & Kesehatan", teacher: "Fajar Nugroho, S.Or.", jp: "Jam ke-5–6" },
      { time: "12:30 - 14:00", subject: "Seni Budaya", teacher: "Maya Sari, S.Sn.", jp: "Jam ke-7–8" }
    ],
    Kamis: [
      { time: "07:00 - 08:30", subject: "Fisika", teacher: "Siti Aminah, S.Pd., M.Si.", jp: "Jam ke-1–2" },
      { time: "08:30 - 10:00", subject: "Kimia", teacher: "Dra. Nurul Hidayah", jp: "Jam ke-3–4" },
      { time: "10:15 - 11:45", subject: "Pendidikan Agama & Budi Pekerti", teacher: "H. Ahmad Syafi'i, S.Ag.", jp: "Jam ke-5–6" },
      { time: "12:30 - 14:00", subject: "Bahasa Indonesia", teacher: "Rina Marlina, S.Pd.", jp: "Jam ke-7–8" }
    ],
    Jumat: [
      { time: "07:00 - 07:45", subject: "Literasi Pagi & Kebersihan Kelas", teacher: "Tim Wali Kelas", jp: "Jam ke-1" },
      { time: "07:45 - 09:15", subject: "Biologi", teacher: "Arif Rahman, S.Pd.", jp: "Jam ke-2–3" },
      { time: "09:30 - 11:00", subject: "Bahasa Inggris", teacher: "Dian Kusuma, M.Pd.", jp: "Jam ke-4–5" }
    ],
    Sabtu: [
      { time: "07:30 - 09:00", subject: "Bimbingan Konseling & Pengembangan Diri", teacher: "Novianti, S.Psi.", jp: "Sesi 1" },
      { time: "09:15 - 11:30", subject: "Ekstrakurikuler & Projek Penguatan Profil", teacher: "Pembina Ekskul", jp: "Sesi 2" }
    ]
  };

  const PIKET_SCHEDULE = [
    { day: "Senin", group: "Regu 1", members: "Andi, Nabila, Raka, Sinta, Dimas" },
    { day: "Selasa", group: "Regu 2", members: "Bagas, Citra, Farhan, Putri, Yoga" },
    { day: "Rabu", group: "Regu 3", members: "Alif, Devi, Gilang, Nadia, Reza" },
    { day: "Kamis", group: "Regu 4", members: "Bayu, Elsa, Ilham, Rani, Taufik" },
    { day: "Jumat", group: "Regu 5", members: "Dika, Fitria, Kevin, Salma, Zaki" },
    { day: "Sabtu", group: "Regu 6", members: "Galih, Hana, Luthfi, Tari, Wahyu" }
  ];

  // 2. Identitas Kelas (Dapat Diubah & Tersimpan Lokal)
  const DEFAULT_CLASS_INFO = {
    className: "Kelas XII IPA 1",
    academicYear: "Tahun Ajaran 2026/2027",
    homeroom: "Ibu Ratna Sari, S.Pd.",
    room: "R. 204 (Gedung B)",
    leader: "Ahmad Fauzan"
  };

  function loadClassInfo() {
    try {
      const saved = JSON.parse(localStorage.getItem(CLASS_INFO_KEY));
      return saved && saved.className ? { ...DEFAULT_CLASS_INFO, ...saved } : DEFAULT_CLASS_INFO;
    } catch {
      return DEFAULT_CLASS_INFO;
    }
  }

  let classInfo = loadClassInfo();

  function renderClassInfo() {
    document.getElementById("nav-class-name").textContent = classInfo.className;
    document.getElementById("hero-academic-year").textContent = classInfo.academicYear;
    document.getElementById("hero-homeroom").textContent = classInfo.homeroom;
    document.getElementById("hero-room").textContent = classInfo.room;
    document.getElementById("hero-leader").textContent = classInfo.leader;
  }

  renderClassInfo();

  // 3. Helper Waktu & Profil Siswa
  const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const todayDayName = DAYS_ID[new Date().getDay()];
  let selectedScheduleDay = WEEKLY_SCHEDULE[todayDayName] ? todayDayName : "Senin";

  function getGreetingByHour() {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return "Selamat Pagi,";
    if (hour >= 11 && hour < 15) return "Selamat Siang,";
    if (hour >= 15 && hour < 18) return "Selamat Sore,";
    return "Selamat Malam,";
  }

  function formatDisplayDate(rawDate) {
    if (!rawDate || rawDate === "-") return "-";
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime()) && String(rawDate).includes("-")) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric"
      }).format(parsed);
    }
    return String(rawDate);
  }

  function generateMemberCode(email) {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = (hash << 5) - hash + email.charCodeAt(i);
      hash |= 0;
    }
    return `KLS-${Math.abs(hash).toString(16).toUpperCase().padStart(6, "0")}`;
  }

  function showToast(message) {
    const toastEl = document.getElementById("toast");
    toastEl.textContent = message;
    toastEl.classList.remove("hidden");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toastEl.classList.add("hidden");
    }, 2600);
  }

  const displayName = user.name || user.email.split("@")[0] || "Siswa";
  document.getElementById("greeting-eyebrow").textContent = getGreetingByHour();
  document.getElementById("nav-avatar").textContent = displayName.charAt(0).toUpperCase();
  document.getElementById("nav-username").textContent = displayName;
  document.getElementById("hero-name").textContent = displayName;
  document.getElementById("card-email").textContent = user.email;
  document.getElementById("card-date").textContent = formatDisplayDate(user.createdAt);

  document.getElementById("detail-name").textContent = displayName;
  document.getElementById("detail-storage").textContent =
    user.storageType === "session" ? "Sesi Sementara" : "Lokal Persisten";
  document.getElementById("detail-fingerprint").textContent = generateMemberCode(user.email);

  // KPI Hari Ini
  const todayFormatted = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  }).format(new Date());

  document.getElementById("kpi-today-date").textContent = todayFormatted;
  const todaySubjects = WEEKLY_SCHEDULE[todayDayName] || [];
  document.getElementById("kpi-day-label").textContent = `Jadwal (${todayDayName})`;
  document.getElementById("kpi-subject-count").textContent =
    todaySubjects.length > 0 ? `${todaySubjects.length} Mata Pelajaran` : "Hari Libur";

  const todayPiket = PIKET_SCHEDULE.find((p) => p.day === todayDayName);
  document.getElementById("kpi-piket-group").textContent = todayPiket
    ? `${todayPiket.group} (${todayDayName})`
    : "Tidak Ada Piket";
  document.getElementById("kpi-piket-members").textContent = todayPiket
    ? todayPiket.members
    : "Hari libur sekolah";

  // 4. Jam Real-Time & Timer Sesi
  const liveClockEl = document.getElementById("live-clock");
  const sessionTimerEl = document.getElementById("session-timer");
  const sessionStartMs = new Date(user.loginAt).getTime() || Date.now();

  function updateClocks() {
    const now = new Date();
    liveClockEl.textContent =
      new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit" }).format(now) + " WIB";

    const elapsedSec = Math.max(0, Math.floor((Date.now() - sessionStartMs) / 1000));
    const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, "0");
    const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, "0");
    const secs = String(elapsedSec % 60).padStart(2, "0");
    sessionTimerEl.textContent = `${hrs}:${mins}:${secs}`;
  }

  updateClocks();
  setInterval(updateClocks, 1000);

  // Salin Email
  document.getElementById("btn-copy-email").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(user.email);
      showToast("Email siswa disalin ke clipboard.");
    } catch {
      showToast("Gagal menyalin email.");
    }
  });

  // 5. Render Jadwal Pelajaran
  const scheduleListEl = document.getElementById("schedule-list");
  const scheduleDayBadgeEl = document.getElementById("schedule-day-badge");
  const dayChips = document.querySelectorAll(".day-chip");

  function renderSchedule(day) {
    selectedScheduleDay = day;
    scheduleDayBadgeEl.textContent = day === todayDayName ? `${day} (Hari Ini)` : day;

    dayChips.forEach((chip) => {
      chip.classList.toggle("active", chip.dataset.day === day);
    });

    const items = WEEKLY_SCHEDULE[day] || [];
    scheduleListEl.innerHTML = "";

    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "schedule-item";

      const timeEl = document.createElement("span");
      timeEl.className = "sched-time";
      timeEl.textContent = item.time;

      const infoEl = document.createElement("div");
      infoEl.className = "sched-info";

      const subjEl = document.createElement("strong");
      subjEl.textContent = item.subject;

      const teacherEl = document.createElement("span");
      teacherEl.textContent = `Pengampu: ${item.teacher}`;

      infoEl.appendChild(subjEl);
      infoEl.appendChild(teacherEl);

      const jpEl = document.createElement("span");
      jpEl.className = "sched-jp";
      jpEl.textContent = item.jp;

      card.appendChild(timeEl);
      card.appendChild(infoEl);
      card.appendChild(jpEl);
      scheduleListEl.appendChild(card);
    });
  }

  dayChips.forEach((chip) => {
    chip.addEventListener("click", () => renderSchedule(chip.dataset.day));
  });

  renderSchedule(selectedScheduleDay);

  // 6. Render Jadwal Piket Kelas
  const piketListEl = document.getElementById("piket-list");
  PIKET_SCHEDULE.forEach((item) => {
    const row = document.createElement("div");
    const isToday = item.day === todayDayName;
    row.className = `piket-row${isToday ? " today" : ""}`;

    const head = document.createElement("div");
    head.className = "piket-head";

    const dayTitle = document.createElement("span");
    dayTitle.textContent = `${item.day} — ${item.group}`;
    head.appendChild(dayTitle);

    if (isToday) {
      const badge = document.createElement("span");
      badge.className = "piket-today-tag";
      badge.textContent = "Hari Ini";
      head.appendChild(badge);
    }

    const members = document.createElement("p");
    members.className = "piket-members";
    members.textContent = item.members;

    row.appendChild(head);
    row.appendChild(members);
    piketListEl.appendChild(row);
  });

  // 7. Manajemen Tugas & PR Kelas
  const taskForm = document.getElementById("task-form");
  const taskTitleInput = document.getElementById("task-title-input");
  const taskSubjectInput = document.getElementById("task-subject-input");
  const taskDueInput = document.getElementById("task-due-input");
  const taskListEl = document.getElementById("task-list");
  const taskEmptyEl = document.getElementById("task-empty");
  const taskCounterEl = document.getElementById("task-counter");
  const filterChips = document.querySelectorAll(".filter-chip");

  // Default tanggal input = besok
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split("T")[0];
  taskDueInput.value = tomorrow;

  function loadTasks() {
    try {
      const raw = localStorage.getItem(CLASS_TASKS_KEY);
      if (!raw) {
        return [
          {
            id: "t-default-1",
            title: "Latihan Soal Turunan Fungsi Trigonometri (Hal. 84)",
            subject: "Matematika",
            dueDate: tomorrow,
            completed: false
          },
          {
            id: "t-default-2",
            title: "Laporan Praktikum Hukum Ohm Kelompok",
            subject: "Fisika",
            dueDate: tomorrow,
            completed: true
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
    localStorage.setItem(CLASS_TASKS_KEY, JSON.stringify(tasks));
  }

  function renderTasks() {
    const completedCount = tasks.filter((t) => t.completed).length;
    const pendingCount = tasks.length - completedCount;

    taskCounterEl.textContent = `${completedCount}/${tasks.length} Selesai`;
    document.getElementById("kpi-pending-tasks").textContent = `${pendingCount} Tugas Tersisa`;
    document.getElementById("kpi-task-progress").textContent = `${completedCount} dari ${tasks.length} selesai`;

    const filtered = tasks.filter((task) => {
      if (currentTaskFilter === "active") return !task.completed;
      if (currentTaskFilter === "completed") return task.completed;
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

      const content = document.createElement("div");
      content.className = "task-content";

      const titleSpan = document.createElement("span");
      titleSpan.className = "task-title";
      titleSpan.textContent = task.title;

      const metaDiv = document.createElement("div");
      metaDiv.className = "task-meta";

      const subjSpan = document.createElement("span");
      subjSpan.className = "subject-pill";
      subjSpan.textContent = task.subject;

      const dueSpan = document.createElement("span");
      dueSpan.textContent = `Tenggat: ${formatDisplayDate(task.dueDate)}`;

      metaDiv.appendChild(subjSpan);
      metaDiv.appendChild(dueSpan);

      content.appendChild(titleSpan);
      content.appendChild(metaDiv);

      left.appendChild(check);
      left.appendChild(content);

      const toggleTask = () => {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
      };

      left.addEventListener("click", toggleTask);
      left.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleTask();
        }
      });

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "btn-del-task";
      delBtn.setAttribute("aria-label", "Hapus tugas");
      delBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>`;
      delBtn.addEventListener("click", () => {
        tasks = tasks.filter((t) => t.id !== task.id);
        saveTasks();
        renderTasks();
        showToast("Tugas kelas dihapus.");
      });

      li.appendChild(left);
      li.appendChild(delBtn);
      taskListEl.appendChild(li);
    });
  }

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = taskTitleInput.value.trim();
    if (!title) return;

    tasks.unshift({
      id: `task-${Date.now()}`,
      title,
      subject: taskSubjectInput.value,
      dueDate: taskDueInput.value || tomorrow,
      completed: false
    });

    saveTasks();
    renderTasks();
    taskTitleInput.value = "";
    showToast("Tugas baru ditambahkan ke daftar kelas.");
  });

  filterChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      filterChips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      currentTaskFilter = chip.dataset.filter;
      renderTasks();
    });
  });

  renderTasks();

  // 8. Papan Pengumuman Kelas
  const announceListEl = document.getElementById("announcement-list");
  const btnToggleAnnounce = document.getElementById("btn-toggle-announce");
  const announceForm = document.getElementById("announce-form");

  function loadAnnouncements() {
    try {
      const raw = localStorage.getItem(CLASS_ANNOUNCE_KEY);
      if (!raw) {
        return [
          {
            id: "ann-1",
            category: "Akademik",
            title: "Persiapan Penilaian Tengah Semester",
            body: "Seluruh siswa diharapkan melengkapi catatan praktikum dan mengumpulkan tugas sebelum hari Jumat pukul 14.00 WIB.",
            date: "Info Terbaru"
          },
          {
            id: "ann-2",
            category: "Kas & Administrasi",
            title: "Iuran Kas Mingguan Kelas",
            body: "Pembayaran kas rutin sebesar Rp5.000/minggu dapat diserahkan kepada bendahara kelas setiap hari Rabu.",
            date: "Rutin Mingguan"
          }
        ];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  let announcements = loadAnnouncements();

  function renderAnnouncements() {
    announceListEl.innerHTML = "";
    announcements.forEach((item) => {
      const card = document.createElement("div");
      card.className = "announce-card";

      const top = document.createElement("div");
      top.className = "announce-top";

      const cat = document.createElement("span");
      cat.className = "announce-cat";
      cat.textContent = item.category;

      const date = document.createElement("span");
      date.className = "announce-date";
      date.textContent = item.date;

      top.appendChild(cat);
      top.appendChild(date);

      const title = document.createElement("h3");
      title.textContent = item.title;

      const body = document.createElement("p");
      body.textContent = item.body;

      card.appendChild(top);
      card.appendChild(title);
      card.appendChild(body);
      announceListEl.appendChild(card);
    });
  }

  btnToggleAnnounce.addEventListener("click", () => {
    announceForm.classList.toggle("hidden");
  });

  announceForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const title = document.getElementById("announce-title").value.trim();
    const body = document.getElementById("announce-body").value.trim();
    const category = document.getElementById("announce-category").value;

    if (!title || !body) return;

    const todayStr = new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short"
    }).format(new Date());

    announcements.unshift({
      id: `ann-${Date.now()}`,
      category,
      title,
      body,
      date: `${todayStr} • ${displayName}`
    });

    localStorage.setItem(CLASS_ANNOUNCE_KEY, JSON.stringify(announcements.slice(0, 8)));
    renderAnnouncements();
    announceForm.reset();
    announceForm.classList.add("hidden");
    showToast("Pengumuman kelas diterbitkan.");
  });

  renderAnnouncements();

  // 9. Modal Pengaturan Identitas Kelas
  const classModal = document.getElementById("class-modal");
  const btnEditClass = document.getElementById("btn-edit-class");
  const btnCancelClass = document.getElementById("btn-cancel-class");
  const classSettingsForm = document.getElementById("class-settings-form");

  btnEditClass.addEventListener("click", () => {
    document.getElementById("input-class-name").value = classInfo.className;
    document.getElementById("input-academic-year").value = classInfo.academicYear;
    document.getElementById("input-homeroom").value = classInfo.homeroom;
    document.getElementById("input-room").value = classInfo.room;
    document.getElementById("input-leader").value = classInfo.leader;
    classModal.classList.remove("hidden");
  });

  btnCancelClass.addEventListener("click", () => {
    classModal.classList.add("hidden");
  });

  classSettingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    classInfo = {
      className: document.getElementById("input-class-name").value.trim() || DEFAULT_CLASS_INFO.className,
      academicYear: document.getElementById("input-academic-year").value.trim() || DEFAULT_CLASS_INFO.academicYear,
      homeroom: document.getElementById("input-homeroom").value.trim() || DEFAULT_CLASS_INFO.homeroom,
      room: document.getElementById("input-room").value.trim() || DEFAULT_CLASS_INFO.room,
      leader: document.getElementById("input-leader").value.trim() || DEFAULT_CLASS_INFO.leader
    };
    localStorage.setItem(CLASS_INFO_KEY, JSON.stringify(classInfo));
    renderClassInfo();
    classModal.classList.add("hidden");
    showToast("Identitas kelas berhasil diperbarui.");
  });

  // 10. Ekspor Rekap Kelas (.json)
  document.getElementById("btn-export-session").addEventListener("click", () => {
    const exportData = {
      portal: "PortalKelas",
      exportedAt: new Date().toISOString(),
      classIdentity: classInfo,
      student: {
        name: displayName,
        email: user.email,
        memberCode: generateMemberCode(user.email)
      },
      tasks,
      announcements
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rekap-${classInfo.className.toLowerCase().replace(/\s+/g, "-")}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    showToast("File rekap kelas berhasil diunduh.");
  });

  // 11. Modal Konfirmasi Logout
  const logoutTrigger = document.getElementById("btn-logout-trigger");
  const logoutModal = document.getElementById("logout-modal");
  const btnCancelLogout = document.getElementById("btn-cancel-logout");
  const btnConfirmLogout = document.getElementById("btn-confirm-logout");

  logoutTrigger.addEventListener("click", () => {
    logoutModal.classList.remove("hidden");
    btnConfirmLogout.focus();
  });

  btnCancelLogout.addEventListener("click", () => {
    logoutModal.classList.add("hidden");
  });

  btnConfirmLogout.addEventListener("click", () => {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    logoutModal.classList.add("hidden");
    document.body.classList.add("is-leaving");
    setTimeout(() => {
      window.location.replace(LOGIN_PAGE);
    }, 200);
  });

  [logoutModal, classModal].forEach((modal) => {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) modal.classList.add("hidden");
    });
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      logoutModal.classList.add("hidden");
      classModal.classList.add("hidden");
    }
  });
});
