import '../components/toast.js';

class CategoryGrid extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.categories = [];
        this.isLoading = true;

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                .category-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 1rem;
                    padding: 1rem;
                }

                @media (min-width: 768px) {
                    .category-grid {
                        grid-template-columns: repeat(3, 1fr);
                    }
                }

                .category-card {
                    position: relative;
                    overflow: hidden;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    cursor: pointer;
                    aspect-ratio: 1;
                }

                .category-card:hover {
                    transform: scale(1.05);
                    box-shadow: 0 8px 16px rgba(0,0,0,0.3);
                }

                .category-card picture, .category-card img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    display: block;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    background-color: #333; /* Placeholder background */
                }
                .category-card picture.loaded, .category-card img.loaded {
                    opacity: 1;
                }

                .category-overlay {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0.4));
                    color: white;
                    padding: 1rem;
                    text-align: center;
                }

                .category-name {
                    font-size: 1.1rem;
                    font-weight: bold;
                    margin: 0;
                    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                }

                .category-count {
                    font-size: 0.9rem;
                    margin: 0.25rem 0 0 0;
                    opacity: 0.9;
                }

                .loading {
                    text-align: center;
                    padding: 2rem;
                    color: #666;
                }
            </style>
            <div class="category-grid">
                <div class="loading">Loading categories...</div>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));
        this.gridElement = this.shadowRoot.querySelector('.category-grid');
        this.observer = null;
    }

    async connectedCallback() {
        await this.loadCategories();
        this.render();
    }

    async loadCategories() {
        try {
            // Import data-loader dynamically
            const { loadAllVideos } = await import('../utils/data-loader.js');
            const videos = await loadAllVideos();

            const categoryMap = new Map();

            videos.forEach(video => {
                video.categories.forEach(cat => {
                    if (cat && cat.trim()) {
                        if (!categoryMap.has(cat)) {
                            categoryMap.set(cat, {
                                name: cat,
                                count: 0,
                                thumbnail: video.thumbnail
                            });
                        }
                        categoryMap.get(cat).count++;
                    }
                });
            });

            this.categories = Array.from(categoryMap.values())
                .sort((a, b) => a.name.localeCompare(b.name));

            this.isLoading = false;
        } catch (error) {
            console.error('Error loading categories:', error);
            showToast('error', 'Failed to Load Categories', error.message);
            this.gridElement.innerHTML = `
                <div class="loading" style="color: #dc3545; cursor: pointer;" onclick="location.reload()">
                    Error loading categories. Click to retry.
                </div>
            `;
        }
    }

    render() {
        if (this.isLoading) return;

        this.gridElement.innerHTML = '';

        this.categories.forEach(category => {
            const card = document.createElement('div');
            card.className = 'category-card';
            card.tabIndex = 0; // Make focusable for keyboard navigation

            card.innerHTML = `
                <picture data-src="${category.thumbnail}" alt="${category.name}">
                    <source type="image/webp">
                    <img loading="lazy" alt="${category.name}">
                </picture>
                <div class="category-overlay">
                    <h3 class="category-name">${category.name}</h3>
                    <p class="category-count">${category.count} videos</p>
                </div>
            `;

            card.addEventListener('click', () => {
                // Navigate to search with category filter
                window.location.href = `search.html?category=${encodeURIComponent(category.name)}`;
            });

            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    card.click();
                }
            });

            this.gridElement.appendChild(card);
        });

        this.setupLazyLoading();
    }

    setupLazyLoading() {
        if (this.observer) {
            this.observer.disconnect();
        }

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const picture = entry.target;
                    if (picture.dataset.src && !picture.classList.contains('loaded')) {
                        const img = picture.querySelector('img');
                        const src = picture.dataset.src;

                        // Set WebP source
                        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                        picture.querySelector('source').srcset = webpSrc;

                        // Set fallback img src
                        img.src = src;
                        img.onload = () => {
                            picture.classList.add('loaded');
                        };
                        img.onerror = () => {
                            console.warn('Failed to load image:', src);
                        };
                        this.observer.unobserve(picture);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });

        const pictures = this.gridElement.querySelectorAll('picture[data-src]');
        pictures.forEach(picture => this.observer.observe(picture));
    }

    disconnectedCallback() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

customElements.define('category-grid', CategoryGrid);