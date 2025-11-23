class BlueberryPagination extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this.currentPage = 1;
        this.totalItems = 0;
        this.itemsPerPage = 24;
        this.mode = 'numbered'; // 'numbered' or 'infinite'
        this.maxVisiblePages = 5;
    }

    static get observedAttributes() {
        return ['total-items', 'items-per-page', 'current-page', 'mode'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            switch (name) {
                case 'total-items':
                    this.totalItems = parseInt(newValue) || 0;
                    break;
                case 'items-per-page':
                    this.itemsPerPage = parseInt(newValue) || 24;
                    break;
                case 'current-page':
                    this.currentPage = parseInt(newValue) || 1;
                    break;
                case 'mode':
                    this.mode = newValue || 'numbered';
                    break;
            }
            this.render();
        }
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);

        if (totalPages <= 1 && this.mode === 'numbered') {
            this.shadowRoot.innerHTML = '';
            return;
        }

        const style = `
            <style>
                :host {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    gap: 0.5rem;
                    flex-wrap: wrap;
                    margin: 1rem 0;
                }
                button {
                    background-color: #333;
                    color: #fff;
                    border: 1px solid #555;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.3s ease;
                    font-size: 0.9rem;
                }
                button:hover, button:focus {
                    background-color: #555;
                    outline: 2px solid #e50914;
                    outline-offset: 2px;
                }
                button.active {
                    background-color: #e50914;
                    border-color: #e50914;
                }
                button:disabled {
                    background-color: #222;
                    color: #666;
                    cursor: not-allowed;
                }
                .load-more {
                    background-color: #e50914;
                    border-color: #e50914;
                }
                .load-more:hover, .load-more:focus {
                    background-color: #b20710;
                }
                @media (max-width: 768px) {
                    :host {
                        gap: 0.25rem;
                    }
                    button {
                        padding: 0.4rem 0.8rem;
                        font-size: 0.8rem;
                    }
                    .page-number:not(.active) {
                        display: none;
                    }
                    .page-number.active,
                    .prev,
                    .next,
                    .load-more {
                        display: inline-block;
                    }
                }
            </style>
        `;

        let html = style;

        if (this.mode === 'infinite') {
            html += `<button class="load-more" aria-label="Load more items">Load More</button>`;
        } else {
            // Prev button
            const prevDisabled = this.currentPage <= 1;
            html += `<button class="prev" ${prevDisabled ? 'disabled' : ''} aria-label="Previous page">Prev</button>`;

            // Page numbers
            const startPage = Math.max(1, this.currentPage - Math.floor(this.maxVisiblePages / 2));
            const endPage = Math.min(totalPages, startPage + this.maxVisiblePages - 1);

            for (let i = startPage; i <= endPage; i++) {
                const active = i === this.currentPage ? 'active' : '';
                html += `<button class="page-number ${active}" data-page="${i}" aria-label="Go to page ${i}">${i}</button>`;
            }

        }

        this.shadowRoot.innerHTML = html;

        // Add event listeners
        this.shadowRoot.querySelectorAll('button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.disabled) return;

                if (this.mode === 'infinite') {
                    this.dispatchEvent(new CustomEvent('load-more', { bubbles: true, composed: true }));
                } else {
                    if (btn.classList.contains('prev')) {
                        this.setAttribute('current-page', this.currentPage - 1);
                    } else if (btn.classList.contains('next')) {
                        this.setAttribute('current-page', this.currentPage + 1);
                    } else if (btn.classList.contains('page-number')) {
                        const page = parseInt(btn.dataset.page);
                        this.setAttribute('current-page', page);
                    }
                    this.dispatchEvent(new CustomEvent('page-change', {
                        detail: { page: this.currentPage },
                        bubbles: true,
                        composed: true
                    }));
                }
            });
        });
    }
}

customElements.define('blueberry-pagination', BlueberryPagination);