const SESSION_KEY = "akunportal_active_user";
const LOGIN_PAGE = "../index.html";
window.activeUser = null;

try {
  const savedData = localStorage.getItem(SESSION_KEY);
  if (!savedData) throw new Error("Belum login");

  const parsedUser = JSON.parse(savedData);
  if (!parsedUser || !parsedUser.email) throw new Error("Sesi tidak valid");

  window.activeUser = parsedUser;
} catch {
  window.location.replace(LOGIN_PAGE);
}
