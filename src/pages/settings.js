// src/pages/settings.js
import '../components/toast.js';

document.addEventListener('DOMContentLoaded', () => {
    // Create modal
    const modal = document.createElement('blueberry-modal');
    document.body.appendChild(modal);

    // Keyboard shortcuts help modal
    const shortcutsModal = document.createElement('blueberry-modal');
    document.body.appendChild(shortcutsModal);

    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    hamburger.addEventListener('click', () => {
        navDrawer.toggle();
    });

    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            window.location.href = `search.html?q=${encodeURIComponent(query)}`;
        }
    });
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchButton.click();
        }
    });

    // Tab switching
    const tabLinks = document.querySelectorAll('.settings-tab');
    const tabContents = document.querySelectorAll('.settings-tab-content');

    tabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const tab = e.target.dataset.tab;

            // Remove active class
            tabLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active class
            e.target.classList.add('active');
            document.getElementById(tab + '-tab').classList.add('active');
        });
    });

    // Load settings
    loadSettings();

    // Volume slider
    const volumeSlider = document.getElementById('volume');
    const volumeValue = document.getElementById('volume-value');
    volumeSlider.addEventListener('input', () => {
        volumeValue.textContent = volumeSlider.value;
    });

    // Form submissions
    document.getElementById('general-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings('general');
        showSuccessModal(modal, 'General settings saved!');
    });

    document.getElementById('playback-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings('playback');
        showSuccessModal(modal, 'Playback settings saved!');
    });

    document.getElementById('privacy-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings('privacy');
        showSuccessModal(modal, 'Privacy settings saved!');
    });

    document.getElementById('notifications-form').addEventListener('submit', (e) => {
        e.preventDefault();
        saveSettings('notifications');
        showSuccessModal(modal, 'Notification settings saved!');
    });

    document.getElementById('parental-controls-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveParentalControls();
    });
});

function showSuccessModal(modal, message) {
    modal.innerHTML = `
        <h2>Success</h2>
        <p>${message}</p>
        <button id="ok">OK</button>
    `;
    modal.setAttribute('open', '');
    modal.querySelector('#ok').addEventListener('click', () => {
        modal.removeAttribute('open');
    });
}

function loadSettings() {
    try {
        const settings = JSON.parse(localStorage.getItem('blueberry-settings')) || {};

        // General
        document.getElementById('theme').value = settings.theme || 'dark';
        document.getElementById('language').value = settings.language || 'en';

        // Playback
        document.getElementById('autoplay').checked = settings.autoplay || false;
        document.getElementById('quality').value = settings.quality || 'auto';
        document.getElementById('volume').value = settings.volume || 50;
        document.getElementById('volume-value').textContent = settings.volume || 50;

        // Privacy
        document.getElementById('analytics').checked = settings.analytics !== false; // Default true
        document.getElementById('data-sharing').checked = settings.dataSharing || false;

        // Notifications
        document.getElementById('browser-notifications').checked = settings.browserNotifications || false;
        document.getElementById('email-notifications').checked = settings.emailNotifications || false;
        document.getElementById('frequency').value = settings.frequency || 'weekly';

        // Parental Controls
        document.getElementById('parental-enabled').checked = settings.parentalEnabled || false;
    } catch (error) {
        console.error('Error loading settings:', error);
        showToast('error', 'Settings Load Failed', 'Unable to load your settings. Using defaults.');
    }
}

function saveSettings(section) {
    try {
        const settings = JSON.parse(localStorage.getItem('blueberry-settings')) || {};

        if (section === 'general') {
            settings.theme = document.getElementById('theme').value;
            settings.language = document.getElementById('language').value;
        } else if (section === 'playback') {
            settings.autoplay = document.getElementById('autoplay').checked;
            settings.quality = document.getElementById('quality').value;
            settings.volume = document.getElementById('volume').value;
        } else if (section === 'privacy') {
            settings.analytics = document.getElementById('analytics').checked;
            settings.dataSharing = document.getElementById('data-sharing').checked;
        } else if (section === 'notifications') {
            settings.browserNotifications = document.getElementById('browser-notifications').checked;
            settings.emailNotifications = document.getElementById('email-notifications').checked;
            settings.frequency = document.getElementById('frequency').value;
        }

        localStorage.setItem('blueberry-settings', JSON.stringify(settings));
    } catch (error) {
        console.error('Error saving settings:', error);
        showToast('error', 'Settings Save Failed', 'Unable to save your settings. Please try again.');
    }
}

async function hashPIN(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function saveParentalControls() {
    try {
        const settings = JSON.parse(localStorage.getItem('blueberry-settings')) || {};
        const enabled = document.getElementById('parental-enabled').checked;
        const currentPin = document.getElementById('current-pin').value;
        const newPin = document.getElementById('new-pin').value;
        const confirmPin = document.getElementById('confirm-pin').value;

        // If enabling or changing PIN, validate
        if (enabled || newPin) {
            if (newPin !== confirmPin) {
                showToast('error', 'PIN Mismatch', 'New PIN and confirmation do not match.');
                return;
            }
            if (!/^\d{4}$/.test(newPin)) {
                showToast('error', 'Invalid PIN', 'PIN must be exactly 4 digits.');
                return;
            }

            // If PIN already exists, verify current PIN
            if (settings.parentalPinHash) {
                if (!currentPin) {
                    showToast('error', 'Current PIN Required', 'Enter your current PIN to change it.');
                    return;
                }
                const currentHash = await hashPIN(currentPin);
                if (currentHash !== settings.parentalPinHash) {
                    showToast('error', 'Incorrect PIN', 'Current PIN is incorrect.');
                    return;
                }
            }

            // Hash and store new PIN
            settings.parentalPinHash = await hashPIN(newPin);
        }

 