import { keyboardShortcuts } from '../utils/keyboard-shortcuts.js';
import { getCurrentUser } from '../services/auth-service.js';
import { addToWatchHistory, addToFavorites, removeFromFavorites, getFavorites } from '../services/data-service.js';
import { addToLocalHistory } from '../services/local-history-service.js';
import { getRecommendations } from '../services/recommendation-service.js';

// Simple toast function
function showToast(type, message) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
        color: white;
        padding: 1rem;
        border-radius: 4px;
        z-index: 1000;
        max-width: 300px;
        word-wrap: break-word;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
        document.body.removeChild(toast);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', async () => {
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    hamburger.addEventListener('click', () => {
        navDrawer.toggle();
    });

    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const file = urlParams.get('file') || 'data_0';
    const index = parseInt(urlParams.get('index')) || 0;

    // Load video data from current file for basic info
    let videos = [];
    try {
        const response = await fetch(`data/${file}.json`);
        const data = await response.json();
        videos = data.map(video => {
            const parts = video.embed.split('|');
            return {
                title: parts[3] || 'Untitled',
                thumbnail: parts[1] || '',
                embed: parts[0] || '',
                tags: parts[4] ? parts[4].split(';') : [],
                categories: parts[5] ? parts[5].split(';') : [],
                performer: parts[6] || '',
                duration: parts[7] || '',
                views: parts[8] || '',
                likes: parts[9] || '',
                dislikes: parts[10] || ''
            };
        });
    } catch (error) {
        console.error('Error loading video data:', error);
        // Fallback
        videos = [
            { title: 'Video not found', thumbnail: '', embed: '', tags: [], categories: [], performer: '', duration: '', views: '', likes: '', dislikes: '' }
        ];
    }

    // Get current video
    const currentVideo = videos[index] || videos[0];
    // Add id for recommendations
    const videoId = `${file}_${index}`;
    currentVideo.id = videoId;

    // Populate video player
    const videoPlayer = document.querySelector('video-player');
    videoPlayer.setAttribute('embed', currentVideo.embed);

    // Add to watch history
    let user = getCurrentUser();
    if (user) {
        addToWatchHistory(user.uid, videoId);
    } else {
        addToLocalHistory(videoId);
    }

    // Populate header title
    const titleHeader = document.querySelector('.video-title-header');
    titleHeader.textContent = currentVideo.title;

    // Populate metadata
    const title = document.querySelector('.video-title');
    title.textContent = currentVideo.title;

    const views = document.querySelector('.views');
    views.textContent = currentVideo.views ? `${currentVideo.views} views` : '';

    const likes = document.querySelector('.likes');
    likes.textContent = currentVideo.likes ? `${currentVideo.likes} likes` : '';

    const tagsContainer = document.querySelector('.video-tags');
    tagsContainer.innerHTML = currentVideo.tags.map(tag => `<span>${tag}</span>`).join('');

    const description = document.querySelector('.video-description');
    description.textContent = currentVideo.performer ? `Performer: ${currentVideo.performer}` : '';

    /