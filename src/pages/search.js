// src/pages/search.js
import { loadAllVideos } from '../utils/data-loader.js';
import '../components/pagination.js';

let allVideos = [];
let filteredVideos = [];
let currentQuery = '';
let currentCategory = '';
let currentSort = 'relevance';
let currentPage = 1;
const itemsPerPage = 24;

document.addEventListener('DOMContentLoaded', async () => {
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    hamburger.addEventListener('click', () => {
        navDrawer.toggle();
    });

    // Load videos
    allVideos = await loadAllVideos();

    // Get URL params
    const urlParams = new URLSearchParams(window.location.search);
    currentQuery = urlParams.get('q') || '';
    currentCategory = urlParams.get('category') || '';
    const urlDuration = urlParams.get('duration') || '';

    // Set title
    const searchTitle = document.getElementById('search-title');
    if (currentCategory) {
        searchTitle.textContent = `Videos in "${currentCategory}"`;
    } else if (currentQuery) {
        searchTitle.textContent = `Search results for "${currentQuery}"`;
    }

    // Set filters from URL
    if (urlDuration) {
        document.getElementById('duration-filter').value = urlDuration;
    }
    if (currentCategory) {
        document.getElementById('category-filter').value = currentCategory;
    }

    // Sort
    const sortSelect = document.getElementById('sort-select');
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        currentPage = 1;
        applyFiltersAndDisplay();
    });

    // Advanced filters
    const advancedFiltersBtn = document.getElementById('advanced-filters-btn');
    const advancedFilters = document.getElementById('advanced-filters');
    advancedFiltersBtn.addEventListener('click', () => {
        advancedFilters.style.display = advancedFilters.style.display === 'none' ? 'block' : 'none';
    });

    const applyFiltersBtn = document.getElementById('apply-filters-btn');
    applyFiltersBtn.addEventListener('click', () => {
        currentPage = 1;
        applyFiltersAndDisplay();
    });

    // Initial display
    applyFiltersAndDisplay();
});

function applyFiltersAndDisplay() {
    // Filter videos
    filteredVideos = filterVideos(allVideos, currentQuery, currentCategory);

    // Apply advanced filters
    const durationFilter = document.getElementById('duration-filter').value;
    const categoryFilter = document.getElementById('category-filter').value.trim();

    if (durationFilter) {
        filteredVideos = filteredVideos.filter(video => {
            const duration = parseDuration(video.duration);
            if (durationFilter === 'short') return duration < 300;
            if (durationFilter === 'medium') return duration >= 300 && duration <= 1200;
            if (durationFilter === 'long') return duration > 1200;
            return true;
        });
    }

    if (categoryFilter) {
        filteredVideos = filteredVideos.filter(video =>
            video.categories.some(cat => cat.toLowerCase().includes(categoryFilter.toLowerCase()))
        );
    }

    // Sort
    sortVideos(filteredVideos, currentSort);

    // Display
    displayResults();
}

function filterVideos(videos, query, category) {
    if (category) {
        return videos.filter(video =>
            video.categories.some(cat => cat.toLowerCase() === category.toLowerCase())
        );
    }

    if (!query) return videos;

    const lowerQuery = query.toLowerCase();
    return videos.filter(video =>
        video.title.toLowerCase().includes(lowerQuery) ||
        video.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
        video.categories.some(cat => cat.toLowerCase().includes(lowerQuery)) ||
        (video.performer && video.performer.toLowerCase().includes(lowerQuery))
    );
}

function sortVideos(videos, sort) {
    videos.sort((a, b) => {
        if (sort === 'date') {
            // Assuming no date, sort by id or random
            return a.id.localeCompare(b.id);
        } else if (sort === 'views') {
            return parseInt(b.views || 0) - parseInt(a.views || 0);
        } else {
            // Relevance: for now, keep order
            return 0;
        }
    });
}

function parseDuration(duration) {
    // Parse duration like "10:30" to seconds
    const parts = duration.split(':');
    if (parts.length === 2) {
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    return 0;
}

function displayResults() {
    const resultsInfo = document.getElementById('results-info');
    const resultsGrid = document.getElementById('results-grid');
    const noResults = document.getElementById('no-results');
    const pagination = document.getElementById('pagination');

    if (filteredVideos.length === 0) {
        resultsInfo.textContent = '';
        resultsGrid.innerHTML = '';
        pagination.innerHTML = '';
        noResults.style.display = 'block';
        return;
    }

    noResults.style.display = 'none';
    resultsInfo.textContent = `Showing ${filteredVideos.length} results`;

    // Paginate
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const pageVideos = filteredVideos.slice(start, end);

    // Display
    resultsGrid.innerHTML = '';
    pageVideos.forEach(video => {
        const videoThumbnail = document.createElement('video-thumbnail');
        videoThumbnail.setAttribute('title', video.title);
        videoThumbnail.setAttribute('thumbnail', video.thumbnail);
        videoThumbnail.addEventListener('click', () => {
            window.location.href = `video.html?id=${video.id}`;
        });
        resultsGrid.appendChild(videoThumbnail);
    });

    // Pagination
    const paginationElement = document.getElementById('pagination');
    paginationElement.innerHTML = '';
    if (filteredVideos.length > itemsPerPage) {
        const pagination = document.createElement('blueberry-pagination');
        pagination.setAttribute('total-items', filteredVideos.length);
        pagination.setAttribute('items-per-page', itemsPerPage);
        pagination.setAttribute('current-page', currentPage);
        pagination.setAttribute('mode', 'numbered');
        pagination.addEventListener('page-change', (e) => {
            currentPage = e.detail.page;
            displayResults();
        });
        paginationElement.appendChild(pagination);
    }
}
