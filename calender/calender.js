
        document.addEventListener('DOMContentLoaded', function() {
            // --- Element References ---
            const monthYearEl = document.getElementById('monthYear');
            const calendarGridEl = document.getElementById('calendarGrid');
            const detailModal = document.getElementById('detailModal');
            const closeDetailModalBtn = detailModal.querySelector('.close-btn');
            const detailForm = document.getElementById('detailForm');
            const modalTitleEl = document.getElementById('modalTitle');
            const dateIdentifierInput = document.getElementById('dateIdentifier');
            const detailIdInput = document.getElementById('detailId');
            const settingsModal = document.getElementById('settingsModal');
            const customizeBtn = document.getElementById('customizeBtn');
            const closeSettingsModalBtn = settingsModal.querySelector('.close-btn');
            const settingsForm = document.getElementById('settingsForm');
            const prevMonthBtn = document.getElementById('prevMonth');
            const nextMonthBtn = document.getElementById('nextMonth');
            const panelImageUpload = document.getElementById('panelImageUpload');
            const removePanelImageBtn = document.getElementById('removePanelImageBtn');

            // --- State ---
            let currentDate = new Date();
            // Data Structure: { "YYYY-M-D": { color: "#...", details: [{...}] } }
            let calendarData = {};

            // --- DATA PERSISTENCE ---
            const saveData = () => localStorage.setItem('calendarData', JSON.stringify(calendarData));
            const loadData = () => {
                const savedData = localStorage.getItem('calendarData');
                if (savedData) calendarData = JSON.parse(savedData);
            };

            // --- SETTINGS & CUSTOMIZATION (No changes) ---
            const applySettings = (settings) => {
                document.body.dataset.theme = settings.theme || 'default';
                document.body.dataset.font = settings.font || 'quicksand';
                document.querySelector('.top-panel h1').textContent = settings.panelTitle || 'My Awesome Month';
                document.querySelector('.top-panel p').textContent = settings.panelDescription || 'A personal planner & journal';
                if (settings.panelImage) {
                    document.querySelector('.top-panel').style.backgroundImage = `url('${settings.panelImage}')`;
                } else {
                    document.querySelector('.top-panel').style.backgroundImage = `url('https://images.unsplash.com/photo-1534353436294-0dbd4bdac845?q=85')`;
                }
            };
            const saveSettings = () => {
                const settings = JSON.parse(localStorage.getItem('calendarSettings')) || {};
                settings.theme = settingsForm.querySelector('input[name="theme"]:checked').value;
                settings.font = document.getElementById('fontSelector').value;
                settings.panelTitle = document.getElementById('panelTitle').value;
                settings.panelDescription = document.getElementById('panelDescription').value;
                localStorage.setItem('calendarSettings', JSON.stringify(settings));
                applySettings(settings);
                closeSettingsModal();
            };
            const loadSettings = () => {
                const savedSettings = localStorage.getItem('calendarSettings');
                if (savedSettings) {
                    const settings = JSON.parse(savedSettings);
                    applySettings(settings);
                    const themeRadio = settingsForm.querySelector(`input[name="theme"][value="${settings.theme}"]`);
                    if (themeRadio) themeRadio.checked = true;
                    document.getElementById('fontSelector').value = settings.font || 'quicksand';
                    document.getElementById('panelTitle').value = settings.panelTitle || '';
                    document.getElementById('panelDescription').value = settings.panelDescription || '';
                }
            };
            const openSettingsModal = () => settingsModal.style.display = 'block';
            const closeSettingsModal = () => settingsModal.style.display = 'none';

            // --- CALENDAR DETAIL FUNCTIONS ---
            const openModalForNew = (date) => {
                modalTitleEl.textContent = `Add Detail for ${new Date(date.replace(/-/g, '/')).toDateString()}`;
                dateIdentifierInput.value = date;
                detailIdInput.value = '';
                detailForm.reset();
                detailModal.style.display = 'block';
            };
            const openModalForEdit = (detailItem) => {
                modalTitleEl.textContent = `Edit Detail`;
                const dateId = detailItem.closest('.day-card').id;
                const detailId = detailItem.dataset.id;
                // FIX: Check for data existence before finding detail
                const detail = calendarData[dateId]?.details?.find(d => d.id == detailId);
                if (!detail) return; // Failsafe
                document.getElementById('detailTitle').value = detail.title;
                document.getElementById('detailDescription').value = detail.description;
                document.getElementById('detailImage').value = detail.image;
                dateIdentifierInput.value = dateId;
                detailIdInput.value = detailId;
                detailModal.style.display = 'block';
            };
            const closeDetailModal = () => detailModal.style.display = 'none';

            // --- RENDER FUNCTIONS ---
            const createDetailElement = (detail) => {
                const detailItem = document.createElement('div');
                detailItem.className = 'detail-item';
                detailItem.dataset.id = detail.id;
                const sanitizedTitle = detail.title.replace(/</g, "&lt;").replace(/>/g, "&gt;");
                const sanitizedDesc = detail.description ? detail.description.replace(/</g, "&lt;").replace(/>/g, "&gt;") : '';
                detailItem.innerHTML = `
                    <h4>${sanitizedTitle}</h4>
                    ${sanitizedDesc ? `<p>${sanitizedDesc}</p>` : ''}
                    ${detail.image ? `<img src="${detail.image}" alt="${sanitizedTitle}">` : ''}
                    <div class="detail-actions">
                        <button class="action-btn edit-btn">✏️</button>
                        <button class="action-btn delete-btn">🗑️</button>
                    </div>`;
                return detailItem;
            };
            const renderDetails = () => {
                Object.keys(calendarData).forEach(dateId => {
                    const cardContent = document.querySelector(`#${CSS.escape(dateId)} .card-content`);
                    // FIX: Check for details array
                    if (cardContent && calendarData[dateId]?.details?.length > 0) {
                        cardContent.innerHTML = '';
                        calendarData[dateId].details.forEach(detail => {
                            cardContent.appendChild(createDetailElement(detail));
                        });
                    }
                });
            };
            const renderCalendar = () => {
                currentDate.setDate(1);
                const month = currentDate.getMonth(); const year = currentDate.getFullYear();
                const firstDayIndex = currentDate.getDay();
                const lastDay = new Date(year, month + 1, 0).getDate();
                const prevLastDay = new Date(year, month, 0).getDate();
                const lastDayIndex = new Date(year, month + 1, 0).getDay();
                const nextDays = 7 - lastDayIndex - 1;

                const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                monthYearEl.innerHTML = `${months[month]} ${year}`;

                let daysHtml = "";
                for (let x = firstDayIndex; x > 0; x--) { daysHtml += `<div class="day-card other-month"><div class="date-header"><span class="date-number">${prevLastDay - x + 1}</span></div></div>`; } // FIX: No buttons
                for (let i = 1; i <= lastDay; i++) {
                    const dateId = `${year}-${month + 1}-${i}`;
                    daysHtml += `
                        <div class="day-card" id="${dateId}">
                            <div class="date-header">
                                <span class="date-number">${i}</span>
                                <button class="color-picker-btn">🎨</button>
                            </div>
                            <div class="card-content"></div>
                            <button class="add-detail-btn" data-date="${dateId}">+</button>
                        </div>`;
                }
                for (let j = 1; j <= nextDays; j++) { daysHtml += `<div class="day-card other-month"><div class="date-header"><span class="date-number">${j}</span></div></div>`; } // FIX: No buttons
                calendarGridEl.innerHTML = daysHtml;

                // Apply saved colors
                Object.keys(calendarData).forEach(dateId => {
                    if (calendarData[dateId]?.color) {
                        const card = document.getElementById(dateId);
                        if (card) card.style.backgroundColor = calendarData[dateId].color;
                    }
                });
                renderDetails();
            };
            
            // --- EVENT LISTENERS ---
            prevMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
            nextMonthBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
            closeDetailModalBtn.addEventListener('click', closeDetailModal);
            customizeBtn.addEventListener('click', openSettingsModal);
            closeSettingsModalBtn.addEventListener('click', closeSettingsModal);
            settingsForm.addEventListener('submit', (e) => { e.preventDefault(); saveSettings(); });
            panelImageUpload.addEventListener('change', (event) => {
                const file = event.target.files[0]; if (!file) return;
                const reader = new FileReader();
                reader.onload = (e) => {
                    const settings = JSON.parse(localStorage.getItem('calendarSettings')) || {};
                    settings.panelImage = e.target.result;
                    localStorage.setItem('calendarSettings', JSON.stringify(settings));
                    applySettings(settings);
                };
                reader.readAsDataURL(file);
            });
            removePanelImageBtn.addEventListener('click', () => {
                const settings = JSON.parse(localStorage.getItem('calendarSettings')) || {};
                delete settings.panelImage;
                localStorage.setItem('calendarSettings', JSON.stringify(settings));
                applySettings(settings);
                panelImageUpload.value = '';
            });
            window.addEventListener('click', (event) => {
                if (event.target == detailModal) closeDetailModal();
                if (event.target == settingsModal) closeSettingsModal();
                if (!event.target.closest('.color-palette-popup') && !event.target.matches('.color-picker-btn')) {
                    document.querySelector('.color-palette-popup')?.remove();
                }
            });

            // MAIN EVENT DELEGATION
            calendarGridEl.addEventListener('click', (event) => {
                const target = event.target;
                
                if (target.matches('.add-detail-btn')) { openModalForNew(target.getAttribute('data-date')); } 
                else if (target.matches('.delete-btn')) {
                    if (confirm('Are you sure you want to delete this item?')) {
                        const detailItem = target.closest('.detail-item');
                        const dateId = detailItem.closest('.day-card').id;
                        const detailId = detailItem.dataset.id;
                        
                        // FIX: Ensure data exists before filtering
                        if (calendarData[dateId]?.details) {
                            calendarData[dateId].details = calendarData[dateId].details.filter(d => d.id != detailId);
                            // Cleanup: if no details and no color, remove the whole entry
                            if (calendarData[dateId].details.length === 0 && !calendarData[dateId].color) {
                                delete calendarData[dateId];
                            }
                            saveData();
                            renderCalendar();
                        }
                    }
                } 
                else if (target.matches('.edit-btn')) { openModalForEdit(target.closest('.detail-item')); } 
                else if (target.matches('.detail-item h4')) { target.closest('.detail-item').classList.toggle('is-expanded'); }
                else if (target.matches('.color-picker-btn')) {
                    document.querySelector('.color-palette-popup')?.remove();
                    const card = target.closest('.day-card');
                    const palette = document.createElement('div');
                    palette.className = 'color-palette-popup';
                    
                    const colors = ['#fff0f0', '#e6f7ff', '#f6ffed', '#fffbe6', '#f9f0ff', 'default'];
                    colors.forEach(color => {
                        const swatch = document.createElement('div');
                        swatch.className = 'color-swatch';
                        swatch.dataset.color = color;
                        if (color !== 'default') swatch.style.backgroundColor = color;
                        
                        swatch.addEventListener('click', () => {
                            const dateId = card.id;
                            if (!calendarData[dateId]) calendarData[dateId] = {}; // FIX: Ensure object exists

                            if (color === 'default') {
                                card.style.backgroundColor = '';
                                delete calendarData[dateId].color;
                                // Cleanup: if no details left, remove entry
                                if (calendarData[dateId]?.details?.length === 0) {
                                    delete calendarData[dateId];
                                }
                            } else {
                                card.style.backgroundColor = color;
                                calendarData[dateId].color = color;
                            }
                            saveData();
                            palette.remove();
                        });
                        palette.appendChild(swatch);
                    });
                    document.body.appendChild(palette);
                    const rect = target.getBoundingClientRect();
                    palette.style.left = `${rect.left - palette.offsetWidth / 2 + rect.width / 2}px`;
                    palette.style.top = `${rect.bottom + 5 + window.scrollY}px`;
                }
            });

            detailForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const dateId = dateIdentifierInput.value;
                const detailId = detailIdInput.value;
                const detailData = {
                    title: document.getElementById('detailTitle').value,
                    description: document.getElementById('detailDescription').value,
                    image: document.getElementById('detailImage').value,
                };

                // FIX: Robustly create data structure
                if (!calendarData[dateId]) calendarData[dateId] = {};
                if (!calendarData[dateId].details) calendarData[dateId].details = [];

                if (detailId) { // Edit mode
                    const index = calendarData[dateId].details.findIndex(d => d.id == detailId);
                    if (index > -1) {
                       calendarData[dateId].details[index] = { ...calendarData[dateId].details[index], ...detailData };
                    }
                } else { // Add mode
                    detailData.id = Date.now();
                    calendarData[dateId].details.push(detailData);
                }
                saveData();
                renderCalendar();
                closeDetailModal();
            });

            // --- INITIAL LOAD ---
            loadSettings();
            loadData();
            renderCalendar();
        });

// ===== Side Panel Toggle Functionality =====

document.addEventListener('DOMContentLoaded', () => {
    const sidePanel = document.getElementById("sidePanel");
    const toggleBtn = document.getElementById("toggleBtn");
    const mainContent = document.querySelector(".main-content"); // Assuming you have this wrapper

    if (sidePanel && toggleBtn) {
        const togglePanel = (opening) => {
            sidePanel.classList.toggle("open", opening);
            // This class pushes the main content
            document.body.classList.toggle("side-panel-open", opening);

            // Accessibility updates
            toggleBtn.setAttribute("aria-expanded", String(opening));
            toggleBtn.setAttribute("aria-label", opening ? "Close menu" : "Open menu");
        };

        toggleBtn.addEventListener("click", () => {
            const isOpening = !sidePanel.classList.contains("open");
            togglePanel(isOpening);
        });

        // Close panel on ESC key press
        window.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && sidePanel.classList.contains("open")) {
                togglePanel(false);
            }
        });
    }
});