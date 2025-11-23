import { getCurrentUser, onAuthStateChange, logout } from '../services/auth-service.js';

class NavigationDrawer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 1000;
                    pointer-events: none;
                }

                .backdrop {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.5);
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                }

                .drawer {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 280px;
                    height: 100%;
                    background-color: #1a1a1a;
                    transform: translateX(-100%);
                    transition: transform 0.3s ease;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 2px 0 5px rgba(0, 0, 0, 0.5);
                    pointer-events: auto;
                }

                :host(.open) .backdrop {
                    opacity: 1;
                    pointer-events: auto;
                }

                :host(.open) .drawer {
                    transform: translateX(0);
                }

                .header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 1rem;
                    border-bottom: 1px solid #333;
                }

                .close-btn {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 4px;
                    transition: background 0.2s;
                }

                .close-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .user-section {
                    padding: 1rem;
                    border-bottom: 1px solid #333;
                }

                .user-info {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background-color: #333;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    font-weight: bold;
                }

                .user-details {
                    flex: 1;
                }

                .user-name {
                    font-weight: bold;
                    color: #fff;
                }

                .user-email {
                    color: #aaa;
                    font-size: 0.9rem;
                }

                .login-link {
                    color: #fff;
                    text-decoration: none;
                    font-weight: bold;
                }

                .nav-links {
                    flex: 1;
                    padding: 1rem 0;
                }

                .nav-links ul {
                    list-style: none;
                    margin: 0;
                    padding: 0;
                }

                .nav-links li {
                    margin: 0;
                }

                .nav-links a {
                    display: block;
                    padding: 1rem;
                    color: #aaa;
                    text-decoration: none;
                    transition: background 0.2s, color 0.2s;
                    border-radius: 4px;
                    margin: 0 0.5rem;
                }

                .nav-links a:hover,
                .nav-links a:focus {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }

                .logout-btn {
                    background: none;
                    border: none;
                    color: #aaa;
                    text-decoration: none;
                    display: block;
                    padding: 1rem;
                    width: 100%;
                    text-align: left;
                    cursor: pointer;
                    transition: background 0.2s, color 0.2s;
                    border-radius: 4px;
                    margin: 0 0.5rem;
                }

                .logout-btn:hover,
                .logout-btn:focus {
                    background: rgba(255, 255, 255, 0.1);
                    color: #fff;
                }

                @media (max-width: 480px) {
                    .drawer {
                        width: 100%;
                    }
                }
            </style>

            <div class="backdrop" id="backdrop"></div>
            <div class="drawer" role="dialog" aria-labelledby="drawer-title" aria-modal="true">
                <div class="header">
                    <h2 id="drawer-title">Navigation</h2>
                    <button class="close-btn" id="close-btn" aria-label="Close navigation drawer">×</button>
                </div>
                <div class="user-section" id="user-section">
                    <!-- User info or login link will be inserted here -->
                </div>
                <nav class="nav-links" aria-label="Main navigation">
                    <ul>
                        <li><a href="/" id="home-link">Home</a></li>
                        <li><a href="/categories.html" id="categories-link">Categories</a></li>
                        <li><a href="/search.html" id="search-link">Search</a></li>
                        <li id="profile-link"><a href="/profile.html">Profile</a></li>
                        <li id="settings-link"><a href="/settings.html">Settings</a></li>
                        <li><a href="/about.html" id="about-link">About</a></li>
                    </ul>
                </nav>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.backdrop = this.shadowRoot.getElementById('backdrop');
        this.closeBtn = this.shadowRoot.getElementById('close-btn');
        this.userSection = this.shadowRoot.getElementById('user-section');
        this.profileLink = this.shadowRoot.getElementById('profile-link');
        this.settingsLink = this.shadowRoot.getElementById('settings-link');

        this.isOpen = false;
        this.currentUser = null;

        // Store event handlers for cleanup
        this.backdropClickHandler = () => this.close();
        this.closeBtnClickHandler = () => this.close();
        this.keydownHandler = (e) => {
            if (e.key === 'Escape') {
                this.close();
            }
            this.trapFocus(e);
        };
        this.transitionEndHandler = () => {
            if (this.isOpen) {
                this.focusFirstElement();
            }
        };

        this.init();
    }

    init() {
        // Listen for auth state changes
        onAuthStateChange((user) => {
            this.currentUser = user;
            this.updateUserSection();
            this.updateNavLinks();
        });

        // Event listeners
        this.backdrop.addEventListener('click', this.backdropClickHandler);
        this.closeBtn.addEventListener('click', this.closeBtnClickHandler);

        // Keyboard navigation
        this.addEventListener('keydown', this.keydownHandler);

        // Focus management
        this.addEventListener('transitionend', this.transitionEndHandler);
    }

    open() {
        this.classList.add('open');
        this.isOpen = true;
        this.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        this.updateHamburgerAria();
    }

    close() {
        this.classList.remove('open');
        this.isOpen = false;
        this.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        this.updateHamburgerAria();
    }

    updateHamburgerAria() {
        const hamburger = document.getElementById('hamburger-menu');
        if (hamburger) {
            hamburger.setAttribute('aria-expanded', this.isOpen.toString());
        }
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    updateUserSection() {
        if (this.currentUser) {
            const displayName = this.currentUser.displayName || 'User';
            const email = this.currentUser.email;
            const initial = displayName.charAt(0).toUpperCase();

            this.userSection.innerHTML = `
                <div class="user-info">
                    <div class="avatar">${initial}</div>
                    <div class="user-details">
                        <div class="user-name">${displayName}</div>
                        <div class="user-email">${email}</div>
                    </div>
                </div>
            `;
        } else {
            this.userSection.innerHTML = `
                <a href="/login.html" class="login-link">Login / Register</a>
            `;
        }
    }

    updateNavLinks() {
        if (this.currentUser) {
            this.profileLink.style.display = 'block';
            this.settingsLink.style.display = 'block';
            // Add logout button
            const logoutBtn = document.createElement('button');
            logoutBtn.className = 'logout-btn';
            logoutBtn.textContent = 'Logout';
            this.logoutClickHandler = async () => {
                try {
                    await logout();
                    this.close();
                    // Redirect to home or login
                    window.location.href = '/';
                } catch (error) {
                    console.error('Logout failed:', error);
                }
            };
            logoutBtn.addEventListener('click', this.logoutClickHandler);
            this.shadowRoot.querySelector('.nav-links ul').appendChild(logoutBtn);
        } else {
            this.profileLink.style.display = 'none';
            this.settingsLink.style.display = 'none';
            // Remove logout if exists
            const logoutBtn = this.shadowRoot.querySelector('.logout-btn');
            if (logoutBtn) {
                logoutBtn.remove();
            }
        }
    }

    focusFirstElement() {
        const firstLink = this.shadowRoot.querySelector('.nav-links a');
        if (firstLink) {
            firstLink.focus();
        }
    }

    trapFocus(e) {
        if (!this.isOpen) return;

        const focusableElements = this.shadowRoot.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    }

    connectedCallback() {
        this.setAttribute('aria-hidden', 'true');
    }

    disconnectedCallback() {
        // Remove event listeners
        this.backdrop.removeEventListener('click', this.backdropClickHandler);
        this.closeBtn.removeEventListener('click', this.closeBtnClickHandler);
      