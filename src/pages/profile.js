// src/pages/profile.js
import { onAuthStateChange, logout, getCurrentUser } from '../services/auth-service.js';
import { getWatchHistory, getFavorites, getSettings, updateSettings, removeFromFavorites } from '../services/data-service.js';
import { getLocalHistoryVideoIds } from '../services/local-history-service.js';
import { getVideosByIds, getVideoById } from '../utils/data-loader.js';
import '../components/toast.js';
import '../components/loading-spinner.js';

// Assume video data is available, perhaps from a global or imported
// For now, placeholder functions

let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
    // Create modal
    const modal = document.createElement('blueberry-modal');
    document.body.appendChild(modal);

    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    hamburger.addEventListener('click', () => {
        navDrawer.toggle();
    });

    // Check authentication
    onAuthStateChange(user => {
        currentUser = user;
        loadProfile();
    });

    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab + '-tab').classList.add('active');
        });
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        modal.innerHTML = `
            <h2>Confirm Logout</h2>
            <p>Are you sure you want to log out?</p>
            <button id="confirm-logout">Yes, Logout</button>
            <button id="cancel-logout">Cancel</button>
        `;
        modal.setAttribute('open', '');
        modal.querySelector('#confirm-logout').addEventListener('click', async () => {
            modal.removeAttribute('open');
            try {
                await logout();
                showToast('success', 'Logged out successfully');
                window.location.href = 'login.html';
            } catch (error) {
                showToast('error', 'Logout failed: ' + error.message);
            }
        });
        modal.querySelector('#cancel-logout').addEventListener('click', () => {
            modal.removeAttribute('open');
        });
    });

    // Settings form
    document.getElementById('settings-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const theme = document.getElementById('theme').value;
        const autoplay = document.getElementById('autoplay').checked;
        const notifications = document.getElementById('notifications').checked;

        try {
            await updateSettings(currentUser.uid, { theme, autoplay, notifications });
            showToast('success', 'Settings saved!');
        } catch (error) {
            showToast('error', 'Failed to save settings: ' + error.message);
        }
    });
});


async function loadProfile() {
    if (currentUser) {
        // Logged in user
        document.getElementById('user-email').textContent = currentUser.email;
        document.getElementById('logout-btn').style.display = 'block';

        // Load watch history
        try {
            const history = await getWatchHistory(currentUser.uid);
            displayVideos('history-grid', history.map(h => h.videoId));
        } catch (error) {
            console.error('Failed to load watch history:', error);
        }

        // Load favorites
        try {
            const favorites = await getFavorites(currentUser.uid);
            displayVideos('favorites-grid', favorites, true);
        } catch (error) {
            console.error('Failed to load favorites:', error);
        }

        // Load settings
        try {
            const settings = await getSettings(currentUser.uid);
            document.getElementById('theme').value = settings.theme || 'dark';
            document.getElementById('autoplay').checked = settings.autoplay || false;
            document.getElementById('notifications').checked = settings.notifications || false;
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    } else {
        // Guest user
        document.getElementById('user-email').textContent = 'Guest User';
        document.getElementById('logout-btn').style.display = 'none';

        // Hide favorites and settings tabs
        document.querySelector('[data-tab="favorites"]').style.display = 'none';
        document.querySelector('[data-tab="settings"]').style.display = 'none';

        // Load local watch history
        const historyVideoIds = getLocalHistoryVideoIds();
        displayVideos('history-grid', historyVideoIds);
    }
}

async function displayVideos(gridId, videoIds, isFavorites = false) {
    const grid = document.getElementById(gridId);
    grid.innerHTML = '';

    if (videoIds.length === 0) {
        grid.innerHTML = '<p>No videos found.</p>';
        return;
    }

    // Show loading spinner
    grid.innerHTML = '<loading-spinner size="medium" style="circular"></loading-spinner>';

    try {
        const videos = await getVideosByIds(videoIds);
        grid.innerHTML = ''; // Clear spinner
        videos.forEach(video => {
            const videoCard = createVideoCard(video, isFavorites);
            grid.appendChild(videoCard);
        });
    } catch (error) {
        console.error('Error loading videos:', error);
        grid.innerHTML = '<p>Error loading videos.</p>';
    }
}

function createVideoCard(video, isFavorites) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.innerHTML = `
        <img src="${video.thumbnail}" alt="${video.title}">
        <h3>${video.title}</h3>
        <p>${video.duration}</p>
        ${isFavorites ? '<button class="remove-fav-btn" data-id="' + video.id + '">Remove</button>' : ''}
    `;

    if (isFavorites) {
        card.querySelector('.remove-fav-btn').addEventListener('click', () => {
            const modal = document.querySelector('blueberry-modal');
            modal.innerHTML = `
                <h2>Remove from Favorites</h2>
                <p>Are you sure you want to remove this video from favorites?</p>
                <button id="confirm-remove">Yes, Remove</button>
                <button id="cancel-remove">Cancel</button>
            `;
            modal.setAttribute('open', '');
            modal.querySelector('#confirm-remove').addEventListener('click', async () => {
                modal.removeAttribute('open');
                try {
                    await removeFromFavorites(currentUser.uid, video.id);
                    card.remove();
                    showToast('info', 'Removed from favorites');
                } catch (error) {
                    showToast('error', 'Failed to remove from favorites: ' + error.message);
                }
            });
            modal.querySelector('#cancel-remove').addEventListener('click', () => {
                modal.removeAttribute('open');
            });
        });
    }

    card.addEventListener('click', () => {
        window.location.href = `video.html?id=${video.id}`;
    });

    return card;
}
