document.addEventListener('DOMContentLoaded', () => {
    // === DOM Element Declarations ===
    const notesContainer = document.getElementById('notes-container');
    const addNoteBtn = document.getElementById('add-note-btn');
    const bannerText = document.getElementById('banner-text');
    const settingsPanel = document.getElementById('settingsPanel');
    const toggleSettingsBtn = document.getElementById('toggleSettingsBtn');
    const bgColorInput = document.getElementById('bgColor');
    const bannerColorInput = document.getElementById('bannerColor');
    const bannerTextColorInput = document.getElementById('bannerTextColor');
    const noteColorInput = document.getElementById('noteColor');
    const fontFamilySelect = document.getElementById('fontFamily');
    const resetSettingsBtn = document.getElementById('resetSettings');

    let draggedItem = null;

    // === Initial Load ===
    loadSettings();
    loadNotes();
    loadBannerText();

    // === Event Listeners ===
    addNoteBtn.addEventListener('click', () => {
        createNoteCard({ id: Date.now(), title: '', content: '', files: [] }, true);
        saveNotes();
    });

    toggleSettingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('open');
    });

    bannerText.addEventListener('input', saveBannerText);

    bgColorInput.addEventListener('input', (e) => {
        document.body.style.backgroundColor = e.target.value;
        saveSettings();
    });

    bannerColorInput.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--banner-color', e.target.value);
        saveSettings();
    });

    bannerTextColorInput.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--banner-text-color', e.target.value);
        saveSettings();
    });

    noteColorInput.addEventListener('input', (e) => {
        document.documentElement.style.setProperty('--note-color', e.target.value);
        saveSettings();
    });

    fontFamilySelect.addEventListener('change', (e) => {
        document.body.style.fontFamily = e.target.value;
        saveSettings();
    });

    resetSettingsBtn.addEventListener('click', () => {
        bgColorInput.value = '#fce4ec';
        bannerColorInput.value = '#F4A6B8';
        bannerTextColorInput.value = '#4B2E2E';
        noteColorInput.value = '#fff8e1';
        fontFamilySelect.value = 'Arial, sans-serif';
        
        bgColorInput.dispatchEvent(new Event('input'));
        bannerColorInput.dispatchEvent(new Event('input'));
        bannerTextColorInput.dispatchEvent(new Event('input'));
        noteColorInput.dispatchEvent(new Event('input'));
        fontFamilySelect.dispatchEvent(new Event('change'));
    });

    notesContainer.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('note-card')) {
            draggedItem = e.target;
            setTimeout(() => e.target.classList.add('dragging'), 0);
        }
    });

    notesContainer.addEventListener('dragend', (e) => {
        e.target.classList.remove('dragging');
        draggedItem = null;
        saveNotes();
    });

    notesContainer.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(notesContainer, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            notesContainer.appendChild(draggable);
        } else {
            notesContainer.insertBefore(draggable, afterElement);
        }
    });

    // === Helper Functions ===
    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.note-card:not(.dragging)')];
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    function createNoteCard(note, isNew = false) {
        const card = document.createElement('div');
        card.className = 'note-card';
        card.draggable = true;
        card.dataset.id = note.id;

        card.innerHTML = `
            <div class="note-header">
                <input type="text" class="note-title" value="${note.title}" placeholder="Note Title" />
                <button class="delete-btn">❌</button>
            </div>
            <textarea class="note-content" placeholder="Write your note here...">${note.content}</textarea>
            <div class="note-files">
                <h5>Files:</h5>
                <ul class="file-list"></ul>
                <label class="file-input-label">
                    Attach File
                    <input type="file" class="file-input" multiple />
                </label>
            </div>
        `;

        const fileInput = card.querySelector('.file-input');
        const fileList = card.querySelector('.file-list');
        const titleInput = card.querySelector('.note-title');
        const contentTextarea = card.querySelector('.note-content');
        const deleteBtn = card.querySelector('.delete-btn');

        note.files.forEach(file => {
            addFileElement(fileList, file);
        });

        titleInput.addEventListener('input', saveNotes);
        contentTextarea.addEventListener('input', saveNotes);

        deleteBtn.addEventListener('click', () => {
            card.remove();
            saveNotes();
        });

        fileInput.addEventListener('change', (e) => {
            const files = e.target.files;
            Array.from(files).forEach(file => {
                const reader = new FileReader();
                reader.onload = (event) => {
                    const fileData = {
                        name: file.name,
                        type: file.type,
                        dataURL: event.target.result
                    };
                    addFileElement(fileList, fileData);
                    saveNotes();
                };
                reader.readAsDataURL(file);
            });
        });

        notesContainer.appendChild(card);
        if (isNew) {
            titleInput.focus();
        }
    }
    
    // Updated function to show file previews
    function addFileElement(fileList, file) {
        const fileItem = document.createElement('li');
        fileItem.className = 'file-item';

        let previewHTML = '';
        if (file.type.startsWith('image/')) {
            previewHTML = `<img src="${file.dataURL}" alt="${file.name}" style="max-width: 100px; max-height: 100px; margin-right: 10px; border-radius: 4px;">`;
        } else if (file.type.startsWith('audio/')) {
            previewHTML = `<audio controls src="${file.dataURL}"></audio>`;
        } else if (file.type.startsWith('video/')) {
            previewHTML = `<video controls src="${file.dataURL}" style="max-width: 150px; max-height: 150px; margin-right: 10px; border-radius: 4px;"></video>`;
        } else {
            // Default icon for other file types
            previewHTML = `<span>📁</span>`; 
        }

        fileItem.innerHTML = `
            ${previewHTML}
            <a href="${file.dataURL}" download="${file.name}">${file.name}</a>
            <button class="remove-file-btn">🗑️</button>
        `;

        fileItem.querySelector('.remove-file-btn').addEventListener('click', () => {
            fileItem.remove();
            saveNotes();
        });

        fileList.appendChild(fileItem);
    }
    
    // === Save and Load Functions ===
    function saveNotes() {
        const notes = [];
        notesContainer.querySelectorAll('.note-card').forEach(card => {
            const title = card.querySelector('.note-title').value;
            const content = card.querySelector('.note-content').value;
            const files = [];
            card.querySelectorAll('.file-list a').forEach(link => {
                // Ensure we get the dataURL from the download attribute for consistency
                files.push({
                    name: link.textContent,
                    dataURL: link.getAttribute('href'),
                    type: link.getAttribute('href').split(';')[0].split(':')[1] || '' // Reconstruct file type from data URL
                });
            });
            notes.push({
                id: card.dataset.id,
                title,
                content,
                files
            });
        });
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    function loadNotes() {
        try {
            const notes = JSON.parse(localStorage.getItem('notes')) || [];
            notes.forEach(note => createNoteCard(note));
        } catch (e) {
            console.error("Error loading notes from localStorage", e);
        }
    }

    function loadBannerText() {
        const savedText = localStorage.getItem('bannerText');
        if (savedText) {
            bannerText.textContent = savedText;
        }
    }

    function saveBannerText() {
        localStorage.setItem('bannerText', bannerText.textContent);
    }

    function saveSettings() {
        const settings = {
            bgColor: bgColorInput.value,
            bannerColor: bannerColorInput.value,
            bannerTextColor: bannerTextColorInput.value,
            noteColor: noteColorInput.value,
            fontFamily: fontFamilySelect.value
        };
        localStorage.setItem('pageSettings', JSON.stringify(settings));
    }

    function loadSettings() {
        try {
            const savedSettings = JSON.parse(localStorage.getItem('pageSettings'));
            if (savedSettings) {
                bgColorInput.value = savedSettings.bgColor;
                document.body.style.backgroundColor = savedSettings.bgColor;
                
                bannerColorInput.value = savedSettings.bannerColor;
                document.documentElement.style.setProperty('--banner-color', savedSettings.bannerColor);
                
                bannerTextColorInput.value = savedSettings.bannerTextColor;
                document.documentElement.style.setProperty('--banner-text-color', savedSettings.bannerTextColor);
                
                noteColorInput.value = savedSettings.noteColor;
                document.documentElement.style.setProperty('--note-color', savedSettings.noteColor);
                
                fontFamilySelect.value = savedSettings.fontFamily;
                document.body.style.fontFamily = savedSettings.fontFamily;
            }
        } catch (e) {
            console.error("Error loading settings:", e);
        }
    }
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
