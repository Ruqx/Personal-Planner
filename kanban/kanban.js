/**
 * =================================================================
 * DYNAMIC DASHBOARD & PAGE CUSTOMIZER SCRIPT
 * =================================================================
 *
 * Features:
 * - Draggable & Resizable Cards (Notes, To-Do Lists, Images)
 * - Customizable Page Banner (Text, Font, Background Image)
 * - Customizable Page Background Color
 * - Collapsible Side Panel & Settings Panel
 * - All state (cards & settings) saved to localStorage
 *
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const canvas = document.getElementById('dashboard-canvas');
    const fabContainer = document.getElementById('fabContainer');
    const imageUploader = document.getElementById('imageUploader');
    const sidePanel = document.getElementById("sidePanel");
    const toggleBtn = document.getElementById("toggleBtn");
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const settingsPanel = document.getElementById('settings-panel');
    const mainBanner = document.getElementById('main-banner');
    const bannerText = document.getElementById('banner-text');
    const bannerImageInput = document.getElementById('banner-image-input');
    const bannerFontSelect = document.getElementById('banner-font-select');
    const bgColorInput = document.getElementById('bg-color-input');
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    const body = document.body;

    // --- State Variables ---
    let cards = [];
    let activeCard = null;
    let action = null; // 'drag' or 'resize'
    let initialX, initialY, initialWidth, initialHeight;

    // --- Draggable & Resizable Logic ---
    function onPointerDown(e) {
        // Bring card to front
        document.querySelectorAll('.card').forEach(c => c.style.zIndex = 1);
        this.style.zIndex = 100;

        if (e.target.closest('.card-header')) {
            action = 'drag';
            activeCard = this;
            const rect = activeCard.getBoundingClientRect();
            initialX = e.clientX - rect.left;
            initialY = e.clientY - rect.top;
        } else if (e.target.matches('.card-resize-handle')) {
            action = 'resize';
            activeCard = this;
            e.preventDefault(); // Prevent text selection during resize
            initialWidth = activeCard.offsetWidth;
            initialHeight = activeCard.offsetHeight;
            initialX = e.clientX;
            initialY = e.clientY;
        }

        if (action) {
            document.addEventListener('mousemove', onPointerMove);
            document.addEventListener('mouseup', onPointerUp, { once: true });
        }
    }

    function onPointerMove(e) {
        if (!activeCard) return;

        if (action === 'drag') {
            const newX = e.clientX - initialX;
            const newY = e.clientY - initialY;
            activeCard.style.left = `${newX}px`;
            activeCard.style.top = `${newY}px`;
        } else if (action === 'resize') {
            const dx = e.clientX - initialX;
            const dy = e.clientY - initialY;
            activeCard.style.width = `${initialWidth + dx}px`;
            activeCard.style.height = `${initialHeight + dy}px`;
        }
    }

    function onPointerUp() {
        if (activeCard) {
            if (action === 'drag') {
                updateCardState(activeCard.dataset.id, { left: activeCard.style.left, top: activeCard.style.top });
            } else if (action === 'resize') {
                updateCardState(activeCard.dataset.id, { width: activeCard.style.width, height: activeCard.style.height });
            }
            // No need to reset zIndex here, it's handled on next mousedown
        }
        activeCard = null;
        action = null;
        document.removeEventListener('mousemove', onPointerMove);
    }

    // --- Card Creation & Core Logic ---
    function createCard(cardState) {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = cardState.id;
        card.style.left = cardState.left;
        card.style.top = cardState.top;
        card.style.width = cardState.width;
        card.style.height = cardState.height;
        card.style.backgroundColor = cardState.color;

        card.innerHTML = `
            <div class="card-header">
                <button class="card-color-btn" title="Change color">🎨</button>
                <input type="text" class="card-title" value="${cardState.title}" placeholder="Card Title">
                <button class="card-delete-btn" title="Delete card">&times;</button>
            </div>
            <div class="card-content"></div>
            <div class="card-resize-handle"></div>
        `;

        const contentEl = card.querySelector('.card-content');
        switch (cardState.type) {
            case 'note':
                contentEl.innerHTML = `<textarea class="note-textarea" placeholder="Write something...">${cardState.content}</textarea>`;
                break;
            case 'todo':
                contentEl.innerHTML = `<ul class="todo-list"></ul><input type="text" class="add-todo-item-input" placeholder="New item...">`;
                const listEl = contentEl.querySelector('.todo-list');
                if (cardState.items) cardState.items.forEach(item => listEl.appendChild(createTodoItem(item)));
                break;
            case 'image':
                contentEl.classList.add('image-card-content');
                contentEl.innerHTML = cardState.src
                    ? `<img src="${cardState.src}" alt="User uploaded image">`
                    : `<div class="image-placeholder">Click to upload image</div>`;
                break;
        }

        canvas.appendChild(card);
        card.addEventListener('mousedown', onPointerDown);
    }

    function createTodoItem({ text, completed }) {
        const itemEl = document.createElement('li');
        itemEl.className = 'todo-item';
        itemEl.innerHTML = `
            <input type="checkbox" ${completed ? 'checked' : ''}>
            <input type="text" class="todo-item-text ${completed ? 'completed' : ''}" value="${text}">
            <button class="delete-todo-item-btn">&times;</button>
        `;
        return itemEl;
    }

    // --- Canvas-Wide Event Delegation ---
    canvas.addEventListener('click', (e) => {
        const card = e.target.closest('.card');
        if (!card) return;

        if (e.target.matches('.card-delete-btn')) {
            card.remove();
            cards = cards.filter(c => c.id !== card.dataset.id);
            saveState();
        } else if (e.target.matches('.delete-todo-item-btn')) {
            e.target.parentElement.remove();
            saveTodoItems(card);
        } else if (e.target.matches('.image-placeholder')) {
            imageUploader.dataset.cardId = card.dataset.id;
            imageUploader.click();
        } else if (e.target.matches('.card-color-btn')) {
            document.querySelector('.color-palette-popup')?.remove();
            showColorPalette(card, e.target);
        }
    });

    canvas.addEventListener('input', (e) => {
        const card = e.target.closest('.card');
        if (!card) return;
        const cardId = card.dataset.id;
        if (e.target.matches('.card-title')) updateCardState(cardId, { title: e.target.value });
        else if (e.target.matches('.note-textarea')) updateCardState(cardId, { content: e.target.value });
        else if (e.target.matches('.todo-item-text')) saveTodoItems(card);
    });

    canvas.addEventListener('change', (e) => {
        const card = e.target.closest('.card');
        if (card && e.target.matches('input[type="checkbox"]')) {
            e.target.nextElementSibling.classList.toggle('completed', e.target.checked);
            saveTodoItems(card);
        }
    });

    canvas.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.matches('.add-todo-item-input')) {
            e.preventDefault();
            const text = e.target.value.trim();
            if (text) {
                e.target.previousElementSibling.appendChild(createTodoItem({ text, completed: false }));
                saveTodoItems(e.target.closest('.card'));
                e.target.value = '';
            }
        }
    });

    imageUploader.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const src = event.target.result;
            const cardId = imageUploader.dataset.cardId;
            const cardElement = document.querySelector(`.card[data-id="${cardId}"]`);
            if (cardElement) {
                 cardElement.querySelector('.card-content').innerHTML = `<img src="${src}" alt="User uploaded image">`;
            }
            updateCardState(cardId, { src });
        };
        reader.readAsDataURL(file);
    });

    // --- Color Palette Logic ---
    function rgbToHex(rgb) {
        if (!rgb || rgb.startsWith('#')) return rgb || '#ffffff';
        const result = rgb.match(/\d+/g);
        if (!result) return '#ffffff';
        const [r, g, b] = result.map(Number);
        const toHex = (c) => ('0' + c.toString(16)).slice(-2);
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    function showColorPalette(card, button) {
        const palette = document.createElement('div');
        palette.className = 'color-palette-popup';
        const colors = ['#ffffff', '#fff0f0', '#e6f7ff', '#f6ffed', '#fffbe6', '#f9f0ff'];

        colors.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'color-swatch';
            swatch.style.backgroundColor = color;
            swatch.addEventListener('click', () => {
                card.style.backgroundColor = color;
                updateCardState(card.dataset.id, { color });
                palette.remove();
            });
            palette.appendChild(swatch);
        });

        const addColorLabel = document.createElement('label');
        addColorLabel.className = 'color-swatch add-color-swatch';
        addColorLabel.title = 'Choose a custom color';

        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = rgbToHex(card.style.backgroundColor);
        colorInput.addEventListener('change', (e) => {
            const newColor = e.target.value;
            card.style.backgroundColor = newColor;
            updateCardState(card.dataset.id, { color: newColor });
            palette.remove();
        });

        addColorLabel.appendChild(colorInput);
        palette.appendChild(addColorLabel);

        document.body.appendChild(palette);
        const rect = button.getBoundingClientRect();
        palette.style.left = `${rect.left}px`;
        palette.style.top = `${rect.bottom + 5 + window.scrollY}px`;
    }

    // --- FAB & Smart Card Placement Logic ---
    function findOpenPosition() {
        let top = 50, left = 50;
        const cardWidth = 300, cardHeight = 220, gap = 20;
        let collision = true;

        while (collision) {
            collision = false;
            for (const card of cards) {
                const cLeft = parseInt(card.left), cTop = parseInt(card.top);
                const cWidth = parseInt(card.width), cHeight = parseInt(card.height);
                if (left < cLeft + cWidth + gap && left + cardWidth + gap > cLeft &&
                    top < cTop + cHeight + gap && top + cardHeight + gap > cTop) {
                    collision = true;
                    left += cardWidth + gap;
                    if (left + cardWidth > canvas.clientWidth) {
                        left = 50;
                        top += cardHeight + gap;
                    }
                    break;
                }
            }
        }
        return { left: `${left}px`, top: `${top}px` };
    }

    fabContainer.addEventListener('click', (e) => {
        if (e.target.matches('.fab-main')) {
            fabContainer.classList.toggle('open');
        } else if (e.target.matches('.fab-option')) {
            const cardType = e.target.dataset.type;
            const openPos = findOpenPosition();
            const newCard = {
                id: 'card-' + Date.now(),
                type: cardType,
                title: `New ${cardType.charAt(0).toUpperCase() + cardType.slice(1)}`,
                left: openPos.left, top: openPos.top,
                width: '300px',
                height: cardType === 'image' ? '250px' : '220px',
                color: '#ffffff',
                content: '',
                items: [],
                src: null,
            };
            cards.push(newCard);
            createCard(newCard);
            saveState();
            fabContainer.classList.remove('open');
        }
    });

    // --- Side Panel Logic ---
    if (sidePanel && toggleBtn) {
        toggleBtn.addEventListener("click", () => {
            sidePanel.classList.toggle("open");
            body.classList.toggle("side-panel-open");
        });
    }

    // --- Page Settings & Banner Logic ---
    if (settingsToggleBtn && settingsPanel) {
        settingsToggleBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('open');
        });

        bannerText.addEventListener('input', saveSettings);
        bannerFontSelect.addEventListener('change', (e) => {
            bannerText.style.fontFamily = e.target.value;
            saveSettings();
        });

        bgColorInput.addEventListener('input', (e) => {
            document.body.style.backgroundColor = e.target.value;
            saveSettings();
        });

        bannerImageInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const imageUrl = event.target.result;
                mainBanner.style.backgroundImage = `url(${imageUrl})`;
                localStorage.setItem('dashboard-banner-image', imageUrl);
            };
            reader.readAsDataURL(file);
        });

        resetSettingsBtn.addEventListener('click', () => {
            localStorage.removeItem('dashboard-settings');
            localStorage.removeItem('dashboard-banner-image');
            window.location.reload();
        });
    }

    // Global listener to close popups/panels
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            if (body.classList.contains("side-panel-open")) {
                sidePanel.classList.remove("open");
                body.classList.remove("side-panel-open");
            }
            if (settingsPanel.classList.contains("open")) {
                settingsPanel.classList.remove("open");
            }
        }
    });

    // --- State Management (Persistence) ---
    function saveTodoItems(card) {
        const items = Array.from(card.querySelectorAll('.todo-item')).map(itemEl => ({
            text: itemEl.querySelector('.todo-item-text').value,
            completed: itemEl.querySelector('input[type="checkbox"]').checked
        }));
        updateCardState(card.dataset.id, { items });
    }

    function updateCardState(id, newState) {
        const cardIndex = cards.findIndex(c => c.id === id);
        if (cardIndex > -1) {
            cards[cardIndex] = { ...cards[cardIndex], ...newState };
            saveState();
        }
    }

    function saveState() {
        localStorage.setItem('dashboard-cards', JSON.stringify(cards));
    }

    function loadState() {
        const savedCards = localStorage.getItem('dashboard-cards');
        if (savedCards) {
            cards = JSON.parse(savedCards);
            cards.forEach(card => createCard(card));
        }
    }

    function saveSettings() {
        const settings = {
            bannerText: bannerText.textContent,
            bannerFont: bannerFontSelect.value,
            bgColor: bgColorInput.value,
        };
        localStorage.setItem('dashboard-settings', JSON.stringify(settings));
    }

    function loadSettings() {
        const settings = JSON.parse(localStorage.getItem('dashboard-settings'));
        const bannerImageUrl = localStorage.getItem('dashboard-banner-image');

        if (bannerImageUrl) {
            mainBanner.style.backgroundImage = `url(${bannerImageUrl})`;
        }

        if (settings) {
            bannerText.textContent = settings.bannerText;
            bannerText.style.fontFamily = settings.bannerFont;
            document.body.style.backgroundColor = settings.bgColor;

            // Update controls to reflect saved settings
            bannerFontSelect.value = settings.bannerFont;
            bgColorInput.value = settings.bgColor;
        }
    }

    // --- Initial Load ---
    loadState();
    loadSettings();
});