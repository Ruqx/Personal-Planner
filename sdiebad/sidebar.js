// sidebar.js
document.addEventListener('DOMContentLoaded', () => {
  const sidePanel = document.getElementById("sidePanel");
  const toggleBtn = document.getElementById("toggleBtn");

  if (sidePanel && toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const opening = !sidePanel.classList.contains("open");
      sidePanel.classList.toggle("open", opening);
      toggleBtn.setAttribute("aria-expanded", String(opening));
      toggleBtn.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
    });

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && sidePanel.classList.contains("open")) {
        sidePanel.classList.remove("open");
        toggleBtn.setAttribute("aria-expanded", "false");
        toggleBtn.setAttribute("aria-label", "Open menu");
      }
    });
  }
});