const SCRIPT_URL = "PASTE_URL_WEB_APP_APPS_SCRIPT_DISINI";
const SESSION_KEY = "akunportal_active_user";
const HOME_PAGE = "pages/home.html";
const REQUEST_TIMEOUT_MS = 15000;

(function checkExistingSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) {
        window.location.replace(HOME_PAGE);
      }
    }
  } catch {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }
})();

const appWrapper = document.getElementById("app-wrapper");
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
const strengthLabel = document.getElementById("strength-label");
const rememberCheckbox = document.getElementById("remember-session");

const ICONS = {
  error: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  success: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isValidEmail(email) {
  return EMAIL_REGEX.test(email);
}

function triggerShake(element) {
  element.classList.remove("shake");
  void element.offsetWidth;
  element.classList.add("shake");
}

function showAlert(message, type = "error") {
  alertIcon.innerHTML = ICONS[type] || ICONS.error;
  alertText.textContent = message;
  alertBox.className = `alert ${type}`;
  if (type === "error") {
    triggerShake(alertBox);
  }
}

function clearAlert() {
  alertText.textContent = "";
  alertBox.className = "alert hidden";
}

function setFormDisabled(form, disabled) {
  form.querySelectorAll("input, button").forEach((el) => {
    el.disabled = disabled;
  });
}

function setLoading(form, btn, isLoading, loadingText, defaultText) {
  const textSpan = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner");
  setFormDisabled(form, isLoading);
  textSpan.textContent = isLoading ? loadingText : defaultText;
  spinner.classList.toggle("hidden", !isLoading);
}

function switchTab(mode) {
  clearAlert();
  const title = document.getElementById("form-title");
  const subtitle = document.getElementById("form-subtitle");

  if (mode === "login") {
    tabsContainer.classList.remove("register-mode");
    loginForm.classList.remove("hidden");
    loginForm.classList.add("tab-switched");
    registerForm.classList.add("hidden");
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    tabLogin.setAttribute("aria-selected", "true");
    tabRegister.setAttribute("aria-selected", "false");
    title.textContent = "Masuk ke Ruang Kelas";
    subtitle.textContent = "Masukkan email dan kata sandi akun siswa Anda.";
  } else {
    tabsContainer.classList.add("register-mode");
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    registerForm.classList.add("tab-switched");
    tabLogin.classList.remove("active");
    tabRegister.classList.add("active");
    tabLogin.setAttribute("aria-selected", "false");
    tabRegister.setAttribute("aria-selected", "true");
    title.textContent = "Aktivasi Akun Siswa";
    subtitle.textContent = "Daftarkan nama lengkap dan email Anda untuk masuk ke portal kelas.";
  }
}

function navigateTo(url) {
  appWrapper.classList.add("is-leaving");
  setTimeout(() => {
    window.location.replace(url);
  }, 220);
}

async function sendToSheets(payload) {
  if (!SCRIPT_URL || SCRIPT_URL.includes("PASTE_URL")) {
    throw new Error("URL Google Apps Script belum dipasang di assets/js/script.js.");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Server merespons dengan status HTTP ${response.status}.`);
    }

    const rawText = await response.text();
    try {
      return JSON.parse(rawText);
    } catch {
      throw new Error("Respons server tidak valid. Pastikan Web App Apps Script di-deploy untuk akses 'Anyone'.");
    }
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("Koneksi ke server melebihi batas waktu (timeout). Periksa jaringan Anda.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

tabLogin.addEventListener("click", () => switchTab("login"));
tabRegister.addEventListener("click", () => switchTab("register"));

tabsContainer.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") {
    switchTab("register");
    tabRegister.focus();
  } else if (e.key === "ArrowLeft") {
    switchTab("login");
    tabLogin.focus();
  }
});

document.querySelectorAll(".auth-form input").forEach((input) => {
  input.addEventListener("input", () => {
    if (!alertBox.classList.contains("hidden")) clearAlert();
  });
});

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

regPasswordInput.addEventListener("input", () => {
  const val = regPasswordInput.value;
  strengthMeter.classList.remove("weak", "medium", "strong");
  strengthLabel.classList.remove("weak", "medium", "strong");

  if (!val) {
    strengthLabel.textContent = "Min. 6 karakter";
    return;
  }

  let score = 0;
  if (val.length >= 6) score++;
  if (val.length >= 8 && /[0-9]/.test(val)) score++;
  if (/[A-Z]/.test(val) || /[^A-Za-z0-9]/.test(val)) score++;

  if (score <= 1) {
    strengthMeter.classList.add("weak");
    strengthLabel.classList.add("weak");
    strengthLabel.textContent = "Lemah";
  } else if (score === 2) {
    strengthMeter.classList.add("medium");
    strengthLabel.classList.add("medium");
    strengthLabel.textContent = "Sedang";
  } else {
    strengthMeter.classList.add("strong");
    strengthLabel.classList.add("strong");
    strengthLabel.textContent = "Kuat";
  }
});

// Submit Aktivasi / Daftar Akun Siswa
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert();

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = regPasswordInput.value;
  const confirm = document.getElementById("reg-confirm").value;
  const btn = document.getElementById("btn-register");

  if (!name || !email || !password) {
    showAlert("Lengkapi seluruh data pendaftaran siswa.");
    return;
  }

  if (name.length < 2) {
    showAlert("Nama lengkap siswa minimal 2 karakter.");
    return;
  }

  if (!isValidEmail(email)) {
    showAlert("Format email siswa tidak valid.");
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

  setLoading(registerForm, btn, true, "Mendaftarkan...", "Aktifkan Akun Siswa");

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
      strengthLabel.classList.remove("weak", "medium", "strong");
      strengthLabel.textContent = "Min. 6 karakter";
      switchTab("login");
      document.getElementById("login-email").value = email;
      document.getElementById("login-password").focus();
      showAlert(result.message || "Akun siswa berhasil didaftarkan! Silakan masuk.", "success");
    } else {
      showAlert(result.message || "Pendaftaran akun siswa gagal diproses.");
    }
  } catch (err) {
    showAlert(err.message || "Gagal terhubung ke server kelas.");
  } finally {
    setLoading(registerForm, btn, false, "Mendaftarkan...", "Aktifkan Akun Siswa");
  }
});

// Submit Masuk Siswa
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert();

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const btn = document.getElementById("btn-login");
  const remember = rememberCheckbox ? rememberCheckbox.checked : true;

  if (!email || !password) {
    showAlert("Masukkan email siswa dan kata sandi.");
    return;
  }

  if (!isValidEmail(email)) {
    showAlert("Format email siswa tidak valid.");
    return;
  }

  setLoading(loginForm, btn, true, "Memverifikasi...", "Masuk ke Ruang Kelas");

  try {
    const passwordHash = await hashPassword(password);
    const result = await sendToSheets({
      action: "login",
      email,
      passwordHash,
    });

    if (result.status === "success" && result.user) {
      const sessionPayload = {
        ...result.user,
        loginAt: new Date().toISOString(),
        storageType: remember ? "local" : "session"
      };

      localStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_KEY);

      const targetStorage = remember ? localStorage : sessionStorage;
      targetStorage.setItem(SESSION_KEY, JSON.stringify(sessionPayload));

      navigateTo(HOME_PAGE);
    } else {
      showAlert(result.message || "Email atau kata sandi siswa tidak sesuai.");
    }
  } catch (err) {
    showAlert(err.message || "Gagal terhubung ke server kelas.");
  } finally {
    setLoading(loginForm, btn, false, "Memverifikasi...", "Masuk ke Ruang Kelas");
  }
});
