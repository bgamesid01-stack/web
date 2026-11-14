const SESSION_KEY = "akunportal_active_user";
const LOGIN_PAGE = "../index.html";
window.activeUser = null;

(function enforceSessionGuard() {
  try {
    const localData = localStorage.getItem(SESSION_KEY);
    const sessionData = sessionStorage.getItem(SESSION_KEY);
    const savedData = localData || sessionData;

    if (!savedData) {
      throw new Error("Sesi siswa tidak ditemukan");
    }

    const parsedUser = JSON.parse(savedData);
    if (!parsedUser || typeof parsedUser !== "object" || !parsedUser.email) {
      throw new Error("Struktur sesi siswa tidak valid");
    }

    if (!parsedUser.loginAt) {
      parsedUser.loginAt = new Date().toISOString();
    }

    window.activeUser = parsedUser;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
    window.location.replace(LOGIN_PAGE);
  }
})();
