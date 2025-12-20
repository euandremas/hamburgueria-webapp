const Auth = (() => {
  const AUTH_KEY = "auth";

  function isLoggedIn() {
    return localStorage.getItem(AUTH_KEY) === "true";
  }

  // Login liberado (qualquer user/senha) como o mockup sugere
  function login() {
    localStorage.setItem(AUTH_KEY, "true");
    return true;
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY);
    window.location.replace("index.html");
  }

  function requireAuth() {
    if (!isLoggedIn()) window.location.replace("index.html");
  }

  function redirectIfLoggedIn() {
    if (isLoggedIn()) window.location.replace("admin.html");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    if (!form) return;

    // garante que não vai “duplicar” handler se algo reinjetar scripts
    form.addEventListener(
      "submit",
      (e) => {
        e.preventDefault();
        login();
        window.location.replace("admin.html");
      },
      { once: true }
    );
  });

  return { isLoggedIn, login, logout, requireAuth, redirectIfLoggedIn };
})();
