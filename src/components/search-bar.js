// src/components/search-bar.js
import { loadAllVideos } from '../utils/data-loader.js';

class SearchBar extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.allTags = new Set();
        this.allCategories = new Set();
        this.allPerformers = new Set();
        this.isLoadingSuggestions = false;
        this.filtersOpen = false;
        this.selectedIndex = -1;
        this.currentSuggestions = [];
    }

    async connectedCallback() {
        this.render();
        this.loadSuggestions();
        this.setupEventListeners();
    }

    render() {
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: flex;
                    align-items: center;
                    position: relative;
                    width: 100%;
                    max-width: 500px;
                }

                .search-container {
                    display: flex;
                    align-items: center;
                    width: 100%;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 25px;
                    padding: 8px 16px;
                    transition: all 0.3s ease;
                }

                .search-container:focus-within {
                    background: rgba(255, 255, 255, 0.15);
                    border-color: rgba(255, 255, 255, 0.4);
                    box-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
                }

                .search-input {
                    flex: 1;
                    background: transparent;
                    border: none;
                    outline: none;
                    color: white;
                    font-size: 16px;
                    padding: 0;
                }

                .search-input::placeholder {
                    color: rgba(255, 255, 255, 0.7);
                }

                .search-button {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 50%;
                    transition: background-color 0.2s;
                }

                .search-button:hover {
                    background: rgba(255, 255, 255, 0.1);
                }

                .filters-button {
                    background: none;
                    border: none;
                    color: rgba(255, 255, 255, 0.7);
                    cursor: pointer;
                    padding: 4px 8px;
                    margin-left: 8px;
                    border-radius: 4px;
                    font-size: 14px;
                    transition: all 0.2s;
                }

                .filters-button:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                }

                .autocomplete-dropdown {
                    position: absolute;
                    top: 100%;
                    left: 0;
                    right: 0;
                    background: rgba(0, 0, 0, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    max-height: 200px;
                    overflow-y: auto;
                    z-index: 1000;
                    display: none;
                    role: "listbox";
                    aria-label: "Search suggestions";
                }

                .autocomplete-item {
                    padding: 12px 16px;
                    color: white;
                    cursor: pointer;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    transition: background-color 0.2s;
                    role: "option";
                }

                .autocomplete-item:hover,
                .autocomplete-item.selected {
                    background: rgba(255, 255, 255, 0.1);
                }

                .autocomplete-item:last-child {
                    border-bottom: none;
                }

                .filters-dropdown {
                    position: absolute;
                    top: 100%;
                    right: 0;
                    background: rgba(0, 0, 0, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 8px;
                    padding: 16px;
                    min-width: 250px;
                    z-index: 1000;
                    display: none;
                }

                .filter-group {
                    margin-bottom: 12px;
                }

                .filter-group label {
                    display: block;
                    color: white;
                    font-size: 14px;
                    margin-bottom: 4px;
                }

                .filter-group select,
                .filter-group input {
                    width: 100%;
                    padding: 8px;
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    border-radius: 4px;
                    color: white;
                    font-size: 14px;
                }

                .filter-group select option {
                    background: #000;
                    color: white;
                }

                .apply-filters {
                    width: 100%;
                    padding: 8px;
                    background: #1a73e8;
                    border: none;
                    border-radius: 4px;
                    color: white;
                    cursor: pointer;
                    font-size: 14px;
                    margin-top: 8px;
                }

                .apply-filters:hover {
                    background: #1557b0;
                }

                @media (max-width: 768px) {
                    :host {
                        max-width: 100%;
                    }

                    .autocomplete-dropdown,
                    .filters-dropdown {
                        left: 0;
                        right: 0;
                    }
                }
            </style>

            <div class="search-container">
                <input type="text" class="search-input" placeholder="Search videos..." autocomplete="off" aria-label="Search videos" aria-expanded="false" aria-haspopup="listbox">
                <button class="search-button" title="Search" aria-label="Search">🔍</button>
                <button class="filters-button" title="Filters" aria-label="Open filters">⚙️</button>
            </div>

            <ul class="autocomplete-dropdown" role="listbox"></ul>

            <div class="filters-dropdown">
                <div class="filter-group">
                    <label for="duration-filter">Duration:</label>
                    <select id="duration-filter">
                        <option value="">Any</option>
                        <option value="short">Short (< 5 min)</option>
                        <option value="medium">Medium (5-20 min)</option>
                        <option value="long">Long (> 20 min)</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label for="category-filter">Category:</label>
                    <input type="text" id="category-filter" placeholder="Filter by category">
                </div>
                <button class="apply-filters">Apply Filters</button>
            </div>
        `;
    }

    async loadSuggestions() {
        if (this.isLoadingSuggestions || this.allTags.size > 0) return;

        this.isLoadingSuggestions = true;
        try {
            const videos = await loadAllVideos();
            videos.forEach(video => {
                // Load tags
                video.tags.forEach(tag => {
                    if (tag.trim()) {
                        this.allTags.add(tag.trim());
                    }
                });
                // Load categories
                video.categories.forEach(category => {
                    if (category.trim()) {
                        this.allCategories.add(category.trim());
                    }
                });
                // Load performers
                if (video.performer && video.performer.trim()) {
                    this.allPerformers.add(video.performer.trim());
                }
            });
        } catch (error) {
            console.error('Error loading suggestions:', error);
        } finally {
            this.isLoadingSuggestions = false;
        }
    }

    setupEventListeners() {
        const input = this.shadowRoot.querySelector('.search-input');
        const searchButton = this.shadowRoot.querySelector('.search-button');
        const filtersButton = this.shadowRoot.querySelector('.filters-button');
        const autocompleteDropdown = this.shadowRoot.querySelector('.autocomplete-dropdown');
        const filtersDropdown = this.shadowRoot.querySelector('.filters-dropdown');
        const applyFiltersButton = this.shadowRoot.querySelector('.apply-filters');

        // Search on button click or Enter
        const performSearch = () => {
            const query = input.value.trim();
            if (query) {
                this.navigateToSearch(query);
            }
        };

        searchButton.addEventListener('click', performSearch);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Autocomplete
        input.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            input.setAttribute('aria-expanded', query.length >= 2 ? 'true' : 'false');
            if (query.length < 2) {
                autocompleteDropdown.style.display = 'none';
                this.selectedIndex = -1;
                return;
            }

            const tagSuggestions = Array.from(this.allTags)
                .filter(tag => this.fuzzyMatch(tag, query))
                .map(tag => ({ type: 'tag', value: tag }));

            const categorySuggestions = Array.from(this.allCategories)
                .filter(category => this.fuzzyMatch(category, query))
                .map(category => ({ type: 'category', value: category }));

            const performerSuggestions = Array.from(this.allPerformers)
                .filter(performer => this.fuzzyMatch(performer, query))
                .map(performer => ({ type: 'performer', value: performer }));

            this.currentSuggestions = [
                ...tagSuggestions.slice(0, 4),
                ...categorySuggestions.slice(0, 3),
                ...performerSuggestions.slice(0, 3)
            ].slice(0, 10);

            if (this.currentSuggestions.length > 0) {
                autocompleteDropdown.innerHTML = this.currentSuggestions
                    .map((suggestion, index) => {
                        const typeLabel = suggestion.type.charAt(0).toUpperCase() + suggestion.type.slice(1);
                        return `<li class="autocomplete-item ${index === this.selectedIndex ? 'selected' : ''}" data-type="${suggestion.type}" data-value="${suggestion.value}" role="option" aria-selected="${index === this.selectedIndex}"><strong>${typeLabel}:</strong> ${suggestion.value}</li>`;
                    })
                    .join('');
                autocompleteDropdown.style.display = 'block';
            } else {
                autocompleteDropdown.style.display = 'none';
                this.selectedIndex = -1;
            }
        });

        // Autocomplete item click
        autocompleteDropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('autocomplete-item')) {
                const value = e.target.dataset.value;
                input.value = value;
                autocompleteDropdown.style.display = 'none';
                this.selectedIndex = -1;
                input.setAttribute('aria-expanded', 'false');
                this.navigateToSearch(value);
            }
        });

        // Hide dro