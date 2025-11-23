import { keyboardShortcuts } from './src/utils/keyboard-shortcuts.js';

// Animation utilities
const animationUtils = {
    // Check if user prefers reduced motion
    prefersReducedMotion: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,

    // Intersection Observer for scroll-triggered animations
    createScrollObserver: (callback, options = {}) => {
        if (animationUtils.prefersReducedMotion()) return;

        const defaultOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    callback(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { ...defaultOptions, ...options });

        return observer;
    },

    // Staggered animation for grid items
    animateStaggeredItems: (container) => {
        if (animationUtils.prefersReducedMotion()) return;

        const items = container.querySelectorAll('.staggered-item');
        const observer = animationUtils.createScrollObserver((item) => {
            item.classList.add('animate');
        });

        items.forEach((item, index) => {
            item.style.transitionDelay = `${index * 0.1}s`;
            observer.observe(item);
        });
    },

    // Parallax effect for hero sections
    initParallax: () => {
        if (animationUtils.prefersReducedMotion()) return;

        const parallaxElements = document.querySelectorAll('.parallax-bg');

        const handleScroll = () => {
            const scrollY = window.scrollY;

            parallaxElements.forEach(element => {
                const speed = 0.5; // Adjust speed as needed
                element.style.transform = `translateY(${scrollY * speed}px)`;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // Initialize scroll-triggered animations
    animationUtils.initParallax();

    const trendingContainer = document.querySelector('.video-grid:nth-of-type(1) .grid-container');
    const newReleasesContainer = document.querySelector('.video-grid:nth-of-type(2) .grid-container');
    const featuredCategoriesContainer = document.querySelector('.video-grid:nth-of-type(3) .grid-container');

    // Placeholder data
    const videos = [
        { title: 'Video 1', thumbnail: 'https://source.unsplash.com/random/400x225/?girl,beach' },
        { title: 'Video 2', thumbnail: 'https://source.unsplash.com/random/400x225/?woman,sensual' },
        { title: 'Video 3', thumbnail: 'https://source.unsplash.com/random/400x225/?couple,love' },
        { title: 'Video 4', thumbnail: 'https://source.unsplash.com/random/400x225/?boudoir,woman' },
        { title: 'Video 5', thumbnail: 'https://source.unsplash.com/random/400x225/?glamour,model' },
        { title: 'Video 6', thumbnail: 'https://source.unsplash.com/random/400x225/?sexy,lingerie' },
    ];

    const categories = [
        { name: 'Category 1', thumbnail: 'https://source.unsplash.com/random/400x225/?abstract,red' },
        { name: 'Category 2', thumbnail: 'https://source.unsplash.com/random/400x225/?abstract,blue' },
        { name: 'Category 3', thumbnail: 'https://source.unsplash.com/random/400x225/?abstract,green' },
        { name: 'Category 4', thumbnail: 'https://source.unsplash.com/random/400x225/?abstract,yellow' },
    ];

    const populateGrid = (container, items, isCategory = false) => {
        container.innerHTML = '';
        items.forEach((item, index) => {
            const videoThumbnail = document.createElement('video-thumbnail');
            videoThumbnail.setAttribute('title', isCategory ? item.name : item.title);
            videoThumbnail.setAttribute('thumbnail', item.thumbnail);
            videoThumbnail.classList.add('staggered-item');
            container.appendChild(videoThumbnail);
        });

        // Apply staggered 