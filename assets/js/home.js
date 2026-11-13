document.addEventListener("DOMContentLoaded", () => {
  const user = window.activeUser;
  if (!user) return;

  document.body.classList.remove("auth-checking");

  const initial = (user.name || user.email || "U").charAt(0).toUpperCase();
  document.getElementById("nav-avatar").textContent = initial;
  document.getElementById("nav-username").textContent = user.name;
  document.getElementById("hero-name").textContent = user.name;
  document.getElementById("card-email").textContent = user.email;
  document.getElementById("card-date").textContent = user.createdAt || "-";

  const logoutBtn = document.getElementById("btn-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem(SESSION_KEY);
      document.body.classList.add("is-leaving");
      setTimeout(() => {
        window.location.replace(LOGIN_PAGE);
      }, 200);
    });
  }
});
