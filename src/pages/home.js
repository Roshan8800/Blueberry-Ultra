import '../components/loading-spinner.js';
import '../components/toast.js';

document.addEventListener('DOMContentLoaded', async () => {
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-menu');
    const navDrawer = document.getElementById('nav-drawer');
    hamburger.addEventListener('click', () => {
        navDrawer.toggle();
    });

    // Show loading spinners in grids
    const trendingGrid = document.getElementById('trending-grid');
    const newReleasesGrid = document.getElementById('new-releases-grid');
    const featuredCategoriesGrid = document.getElementById('featured-categories-grid');

    const showLoadingSpinners = () => {
        trendingGrid.innerHTML = '<loading-spinner size="medium" style="circular"></loading-spinner>';
        newReleasesGrid.innerHTML = '<loading-spinner size="medium" style="circular"></loading-spinner>';
        featuredCategoriesGrid.innerHTML = '<loading-spinner size="medium" style="circular"></loading-spinner>';
    };

    const hideLoadingSpinners = () => {
        // Spinners will be replaced by content
    };

    showLoadingSpinners();

    // Load video data using dynamic import for code splitting
    let videos = [];
    try {
        const { loadAllVideos } = await import('../utils/data-loader.js');
        videos = await loadAllVideos();
        // For home page, limit to first 100 for performance
        videos = videos.slice(0, 100);
    } catch (error) {
        console.error('Error loading video data:', error);
        showToast('error', 'Failed to Load Videos', error.message);

        // Fallback to placeholder videos
        videos = [
            { title: 'Video 1', thumbnail: 'https://source.unsplash.com/random/400x225/?girl' },
            { title: 'Video 2', thumbnail: 'https://source.unsplash.com/random/400x225/?woman' },
        ];

        // Show error message in UI
        const errorMsg = document.createElement('div');
        errorMsg.style.cssText = 'grid-column: 1 / -1; text-align: center; color: #dc3545; padding: 1rem;';
        errorMsg.textContent = 'Unable to load video content. Showing sample videos instead.';
        trendingGrid.parentNode.insertBefore(errorMsg, trendingGrid);
    }

    // Render featured video
    const featuredContainer = document.getElementById('featured-video');
    if (videos.length > 0) {
        const featured = videos[0];
        featuredContainer.innerHTML = `
            <img src="${featured.thumbnail}" alt="${featured.title}">
            <button class="play-button">▶</button>
            <div class="title">${featured.title}</div>
        `;
    }

    // Render grids (variables already declared above)

    const populateGrid = (container, items) => {
        container.innerHTML = '';
        items.forEach(item => {
            const videoThumbnail = document.createElement('video-thumbnail');
            videoThumbnail.setAttribute('title', item.title);
            videoThumbnail.setAttribute('thumbnail', item.thumbnail);
            container.appendChild(videoThumbnail);
        });
    };

    // Trending: first 12
    populateGrid(trendingGrid, videos.slice(0, 12));

    // New Releases: next 12
    populateGrid(newReleasesGrid, videos.slice(12, 24));

    // Featured Categories: for simplicity, another 12, or filter by category
    // Since categories are in tags, perhaps videos with 'Brunette' or something
    // For now, just next 12
    populateGrid(featuredCategoriesGrid, videos.slice(24, 36));
});