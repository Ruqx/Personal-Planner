document.addEventListener("DOMContentLoaded", () => {
  const navbar = document.getElementById('navbar');
  const items = navbar.querySelectorAll('.nav-item');
  const indicator = document.getElementById('indicator');
  const cut = document.getElementById('cut');

  function moveTo(el) {
    const navRect = navbar.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();

    const indH = indicator.offsetHeight;
    const cutH = cut.offsetHeight;

    const targetTop = (elRect.top - navRect.top) + (elRect.height / 2) - (indH / 2);
    const cutOffset = (cutH - indH) / 2;

    indicator.style.transform = `translate(-50%, ${targetTop}px)`;
    cut.style.transform = `translate(-50%, ${targetTop - cutOffset}px)`;

    const icon = el.getAttribute('data-icon');
    indicator.textContent = icon;

    const color = el.getAttribute('data-color');
    navbar.style.backgroundColor = color;
    indicator.style.backgroundColor = color;

    items.forEach(i => i.classList.remove('active'));
    el.classList.add('active');
  }

  function initializeActiveState() {
    // Get the current filename (e.g., "notes.html")
    const currentPath = window.location.pathname;
    const currentFile = currentPath.substring(currentPath.lastIndexOf('/') + 1);
    
    let activeItem = null;

    items.forEach(item => {
      const itemLink = item.getAttribute('data-link');
      // Extract the filename from the data-link (e.g., from "../notes/notes.html" get "notes.html")
      const linkFile = itemLink.substring(itemLink.lastIndexOf('/') + 1);

      // Special case for index/root
      if (currentFile === "" || currentFile === "index.html") {
        if (linkFile === "index.html") activeItem = item;
      } else if (linkFile === currentFile) {
        activeItem = item;
      }
    });

    // Move to the detected item, or default to Home (items[0])
    if (activeItem) {
        moveTo(activeItem);
    } else {
        moveTo(items[0]);
    }
  }

  // Set the initial position
  initializeActiveState();

  items.forEach(it => {
    it.addEventListener('click', (e) => {
      // Don't prevent default if we want to navigate immediately, 
      // but since you have a timeout, we keep it.
      e.preventDefault();
      moveTo(it);
      const link = it.getAttribute('data-link');
      if (link) {
        setTimeout(() => {
          window.location.href = link;
        }, 150);
      }
    });
  });

  window.addEventListener('resize', () => {
    const active = navbar.querySelector('.nav-item.active') || items[0];
    moveTo(active);
  });
});