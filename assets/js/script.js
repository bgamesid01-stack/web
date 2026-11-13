const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzGg8W7FfnM8H-G2lpdkMMhFKcZ3lEXkqygZxhqK2fZnhHv1wgvgW4I0Xw-7ga-jWem/exec";
const SESSION_KEY = "akunportal_active_user";
const HOME_PAGE = "pages/home.html";

if (localStorage.getItem(SESSION_KEY)) {
  window.location.replace(HOME_PAGE);
}

const alertBox = document.getElementById("alert-box");
const alertIcon = alertBox.querySelector(".alert-icon");
const alertText = document.getElementById("alert-text");
const tabsContainer = document.getElementById("tabs-container");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");
const regPasswordInput = document.getElementById("reg-password");
const strengthMeter = document.getElementById("strength-meter");

const ICONS = {
  error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
};

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function showAlert(message, type = "error") {
  alertIcon.innerHTML = ICONS[type] || ICONS.error;
  alertText.textContent = message;
  alertBox.className = `alert ${type}`;
}

function clearAlert() {
  alertText.textContent = "";
  alertBox.className = "alert hidden";
}

function setLoading(btn, isLoading, loadingText, defaultText) {
  const textSpan = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner");
  btn.disabled = isLoading;
  textSpan.textContent = isLoading ? loadingText : defaultText;
  spinner.classList.toggle("hidden", !isLoading);
}

function switchTab(mode) {
  clearAlert();
  const title = document.getElementById("form-title");

  if (mode === "login") {
    tabsContainer.classList.remove("register-mode");
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    tabLogin.setAttribute("aria-selected", "true");
    tabRegister.setAttribute("aria-selected", "false");
    title.textContent = "Masuk ke Akun";
  } else {
    tabsContainer.classList.add("register-mode");
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    tabLogin.classList.remove("active");
    tabRegister.classList.add("active");
    tabLogin.setAttribute("aria-selected", "false");
    tabRegister.setAttribute("aria-selected", "true");
    title.textContent = "Buat Akun Baru";
  }
}

async function sendToSheets(payload) {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_URL")) {
    throw new Error("URL Google Apps Script belum dipasang di assets/js/script.js.");
  }

  const response = await fetch(SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return await response.json();
}

tabLogin.addEventListener("click", () => switchTab("login"));
tabRegister.addEventListener("click", () => switchTab("register"));

// Bersihkan pesan error otomatis saat pengguna mulai mengetik ulang
document.querySelectorAll(".auth-form input").forEach((input) => {
  input.addEventListener("input", () => {
    if (!alertBox.classList.contains("hidden")) clearAlert();
  });
});

// Toggle Lihat / Sembunyikan Kata Sandi
document.querySelectorAll(".toggle-pw").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    const eyeOpen = btn.querySelector(".eye-open");
    const eyeClosed = btn.querySelector(".eye-closed");
    const show = input.type === "password";

    input.type = show ? "text" : "password";
    eyeOpen.classList.toggle("hidden", show);
    eyeClosed.classList.toggle("hidden", !show);
  });
});

// Indikator Kekuatan Kata Sandi
regPasswordInput.addEventListener("input", () => {
  const val = regPasswordInput.value;
  strengthMeter.classList.remove("weak", "medium", "strong");
  if (!val) return;

  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 8 && /[0-9]/.test(val)) score++;
  if (/[A-Z]/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

  if (score <= 1) strengthMeter.classList.add("weak");
  else if (score === 2) strengthMeter.classList.add("medium");
  else strengthMeter.classList.add("strong");
});

// Submit Daftar
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert();

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = regPasswordInput.value;
  const confirm = document.getElementById("reg-confirm").value;
  const btn = document.getElementById("btn-register");

  if (!name || !email || !password) {
    showAlert("Lengkapi seluruh kolom pendaftaran.");
    return;
  }

  if (password.length < 6) {
    showAlert("Kata sandi minimal 6 karakter.");
    return;
  }

  if (password !== confirm) {
    showAlert("Konfirmasi kata sandi tidak cocok.");
    return;
  }

  setLoading(btn, true, "Memproses...", "Buat Akun");

  try {
    const passwordHash = await hashPassword(password);
    const result = await sendToSheets({
      action: "register",
      name,
      email,
      passwordHash,
    });

    if (result.status === "success") {
      registerForm.reset();
      strengthMeter.classList.remove("weak", "medium", "strong");
      switchTab("login");
      document.getElementById("login-email").value = email;
      showAlert(result.message, "success");
    } else {
      showAlert(result.message);
    }
  } catch (err) {
    showAlert(err.message || "Gagal terhubung ke server.");
  } finally {
    setLoading(btn, false, "Memproses...", "Buat Akun");
  }
});

// Submit Masuk
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert();

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const btn = document.getElementById("btn-login");

  if (!email || !password) {
    showAlert("Masukkan email dan kata sandi.");
    return;
  }

  setLoading(btn, true, "Memverifikasi...", "Masuk");

  try {
    const passwordHash = await hashPassword(password);
    const result = await sendToSheets({
      action: "login",
      email,
      passwordHash,
    });

    if (result.status === "success") {
      localStorage.setItem(SESSION_KEY, JSON.stringify(result.user));
      window.location.replace(HOME_PAGE);
    } else {
      showAlert(result.message);
    }
  } catch (err) {
    showAlert(err.message || "Gagal terhubung ke server.");
  } finally {
    setLoading(btn, false, "Memverifikasi...", "Masuk");
  }
});
