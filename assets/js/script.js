const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzGg8W7FfnM8H-G2lpdkMMhFKcZ3lEXkqygZxhqK2fZnhHv1wgvgW4I0Xw-7ga-jWem/exec";
const SESSION_KEY = "akunportal_active_user";
const HOME_PAGE = "pages/home.html";

// Jika sesi sudah aktif, langsung masuk ke pages/home.html
if (localStorage.getItem(SESSION_KEY)) {
  window.location.replace(HOME_PAGE);
}

const alertBox = document.getElementById("alert-box");
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function showAlert(message, type = "error") {
  alertBox.textContent = message;
  alertBox.className = `alert ${type}`;
}

function clearAlert() {
  alertBox.textContent = "";
  alertBox.className = "alert hidden";
}

function switchTab(mode) {
  clearAlert();
  const title = document.getElementById("form-title");
  const subtitle = document.getElementById("form-subtitle");

  if (mode === "login") {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    title.textContent = "Selamat Datang";
    subtitle.textContent = "Masuk ke akun Anda untuk melanjutkan";
  } else {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    tabLogin.classList.remove("active");
    tabRegister.classList.add("active");
    title.textContent = "Buat Akun Baru";
    subtitle.textContent = "Lengkapi data di bawah untuk mendaftar";
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

document.querySelectorAll(".toggle-pw").forEach((btn) => {
  btn.addEventListener("click", () => {
    const input = document.getElementById(btn.dataset.target);
    const isHidden = input.type === "password";
    input.type = isHidden ? "text" : "password";
    btn.textContent = isHidden ? "Sembunyi" : "Lihat";
  });
});

// Proses Daftar
registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert();

  const name = document.getElementById("reg-name").value.trim();
  const email = document.getElementById("reg-email").value.trim().toLowerCase();
  const password = document.getElementById("reg-password").value;
  const confirm = document.getElementById("reg-confirm").value;
  const btn = document.getElementById("btn-register");

  if (password !== confirm) {
    showAlert("Konfirmasi kata sandi tidak cocok.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Menyimpan ke Cloud...";

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
      switchTab("login");
      document.getElementById("login-email").value = email;
      showAlert(result.message, "success");
    } else {
      showAlert(result.message);
    }
  } catch (err) {
    showAlert(err.message || "Gagal terhubung ke server.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Buat Akun Baru";
  }
});

// Proses Masuk
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearAlert();

  const email = document.getElementById("login-email").value.trim().toLowerCase();
  const password = document.getElementById("login-password").value;
  const btn = document.getElementById("btn-login");

  btn.disabled = true;
  btn.textContent = "Memeriksa Akun...";

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
    btn.disabled = false;
    btn.textContent = "Masuk Sekarang";
  }
});
    
