import '../components/toast.js';

class VideoThumbnail extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                .thumbnail-container {
                    position: relative;
                    overflow: hidden;
                    border-radius: 8px;
                    box-shadow: 0 10px 20px rgba(0,0,0,0.2), 0 6px 6px rgba(0,0,0,0.23);
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                    cursor: pointer;
                }
                .thumbnail-container:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
                }
                picture, img {
                    width: 100%;
                    height: auto;
                    display: block;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    background-color: #333; /* Placeholder background */
                }
                picture.loaded, img.loaded {
                    opacity: 1;
                }
                .title {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0));
                    color: #fff;
                    padding: 1rem;
                    font-weight: 500;
                    font-size: 1rem;
                    text-align: left;
                }
            </style>
            <div class="thumbnail-container">
                <picture data-src="" alt="">
                    <source type="image/webp">
                    <img loading="lazy" alt="">
                </picture>
                <div class="title"></div>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.container = this.shadowRoot.querySelector('.thumbnail-container');
        this.container.tabIndex = 0; // Make focusable for keyboard navigation
        this.picture = this.shadowRoot.querySelector('picture');
        this.img = this.shadowRoot.querySelector('img');

        this.container.addEventListener('click', () => this.handleClick());
        this.container.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.handleClick();
            }
        });

        this.observer = null;
        this.isLoaded = false;
        this.hasShownErrorToast = false;
    }

    connectedCallback() {
        this.setupLazyLoading();
    }

    disconnectedCallback() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }

    setupLazyLoading() {
        if (this.observer) return;

        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoaded) {
                    this.loadImage();
                }
            });
        }, {
            rootMargin: '50px' // Load 50px before entering viewport
        });

        this.observer.observe(this.picture);
    }

    loadImage() {
        const src = this.picture.dataset.src;
        if (!src) return;

        // Set WebP source
        const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        this.picture.querySelector('source').srcset = webpSrc;

        // Set fallback img src
        this.img.src = src;
        this.img.onload = () => {
            this.picture.classList.add('loaded');
            this.isLoaded = true;
            if (this.observer) {
                this.observer.disconnect();
            }
        };
        this.img.onerror = () => {
            // Handle error, set a fallback image
            console.warn('Failed to load image:', src);
            this.img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIyNSIgd