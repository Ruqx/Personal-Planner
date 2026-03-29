document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('mindmapCanvas');
    const ctx = canvas.getContext('2d');
    const detailsPanel = document.getElementById('node-details');
    const nodeTitle = document.getElementById('node-title');
    const nodeType = document.getElementById('node-type');
    const nodeLink = document.getElementById('node-link');

    let nodes = [];
    let hidePanelTimeout = null;
    
    const centralNode = {
        label: 'My Workspace',
        x: 0,
        y: 0,
        radius: 30,
        color: '#4B2E2E',
        fontColor: 'white',
        link: '../notes/notes.html' // Corrected path
    };

    // Responsive canvas
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        centralNode.x = canvas.width / 2;
        centralNode.y = canvas.height / 2;
        draw();
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // Load data from localStorage
    function loadData() {
        try {
            const notes = JSON.parse(localStorage.getItem('notes')) || [];
            const goals = JSON.parse(localStorage.getItem('goals')) || [];

            nodes = [];

            notes.forEach(note => {
                if (note.title.trim() !== '') {
                    nodes.push({
                        label: note.title,
                        type: 'Note',
                        radius: 20,
                        color: '#fff8e1',
                        link: `../notes/notes.html#${note.id}` // Corrected path
                    });
                }
            });

            goals.forEach(goal => {
                if (goal.title.trim() !== '') {
                    nodes.push({
                        label: goal.title,
                        type: 'Goal',
                        radius: 20,
                        color: '#F4A6B8',
                        link: `../goals/goals.html#${goal.id}` // Corrected path
                    });
                }
            });

            positionNodes();
        } catch (e) {
            console.error("Failed to load data from localStorage", e);
        }
    }

    // Position nodes radially around the central node
    function positionNodes() {
        const totalNodes = nodes.length;
        if (totalNodes === 0) return;

        const maxRadius = Math.min(canvas.width, canvas.height) * 0.4;
        const angleStep = (2 * Math.PI) / totalNodes;

        nodes.forEach((node, index) => {
            const angle = angleStep * index;
            node.x = centralNode.x + maxRadius * Math.cos(angle);
            node.y = centralNode.y + maxRadius * Math.sin(angle);
        });
        draw();
    }

    // Main drawing function
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        nodes.forEach(node => {
            ctx.beginPath();
            ctx.moveTo(centralNode.x, centralNode.y);
            ctx.lineTo(node.x, node.y);
            ctx.strokeStyle = '#4B2E2E';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });

        nodes.forEach(node => {
            drawNode(node);
        });
        
        drawNode(centralNode);
    }
    
    // Draw a single node
    function drawNode(node) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius, 0, 2 * Math.PI);
        ctx.fillStyle = node.color;
        ctx.fill();
        ctx.strokeStyle = '#4B2E2E';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = node.fontColor || '#4B2E2E';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(node.label, node.x, node.y);
    }

    // Handle mouse events
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const hoveredNode = nodes.find(node => {
            const dist = Math.sqrt((mouseX - node.x)**2 + (mouseY - node.y)**2);
            return dist < node.radius;
        });

        const centralDist = Math.sqrt((mouseX - centralNode.x)**2 + (mouseY - centralNode.y)**2);
        const hoveredCentral = centralDist < centralNode.radius;

        if (hoveredNode) {
            canvas.style.cursor = 'pointer';
            clearTimeout(hidePanelTimeout);
            detailsPanel.classList.remove('hidden');
            nodeTitle.textContent = hoveredNode.label;
            nodeType.textContent = hoveredNode.type;
            nodeLink.href = hoveredNode.link;
        } else if (hoveredCentral) {
            canvas.style.cursor = 'pointer';
            clearTimeout(hidePanelTimeout);
            detailsPanel.classList.remove('hidden');
            nodeTitle.textContent = centralNode.label;
            nodeType.textContent = 'Central Node';
            nodeLink.href = centralNode.link;
        } else {
            canvas.style.cursor = 'default';
            clearTimeout(hidePanelTimeout);
            hidePanelTimeout = setTimeout(() => {
                detailsPanel.classList.add('hidden');
            }, 50);
        }
    });

    detailsPanel.addEventListener('mouseenter', () => {
        clearTimeout(hidePanelTimeout);
    });

    detailsPanel.addEventListener('mouseleave', () => {
        detailsPanel.classList.add('hidden');
    });

    nodeLink.addEventListener('click', (e) => {
        if (nodeLink.href && nodeLink.href !== '#') {
            window.open(nodeLink.href, '_blank');
        }
    });

    // Start everything
    loadData();
});

// ===== Side Panel Toggle =====
const sidePanel = document.getElementById("sidePanel");
const toggleBtn = document.getElementById("toggleBtn");

if (sidePanel && toggleBtn) {
  toggleBtn.addEventListener("click", () => {
    const opening = !sidePanel.classList.contains("open");
    sidePanel.classList.toggle("open", opening);

    // accessibility
    toggleBtn.setAttribute("aria-expanded", String(opening));
    toggleBtn.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
  });

  // close on ESC
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && sidePanel.classList.contains("open")) {
      sidePanel.classList.remove("open");
      toggleBtn.setAttribute("aria-expanded", "false");
      toggleBtn.setAttribute("aria-label", "Open menu");
    }
  });
}
