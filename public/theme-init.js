try {
  var preference = localStorage.getItem("themePreference");
  var isDark =
    preference === "dark" ||
    (preference !== "light" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
} catch (error) {
  // Leave the default light theme in place if browser storage is unavailable.
}
