// Hexagonal Architecture: Ports
class VideoControlsPort {
    play() { throw new Error('Not implemented'); }
    pause() { throw new Error('Not implemented'); }
    setVolume(volume) { throw new Error('Not implemented'); }
    toggleMute() { throw new Error('Not implemented'); }
    seek(time) { throw new Error('Not implemented'); }
    enterFullscreen() { throw new Error('Not implemented'); }
    exitFullscreen() { throw new Error('Not implemented'); }
    getCurrentTime() { throw new Error('Not implemented'); }
    getDuration() { throw new Error('Not implemented'); }
}

// Hexagonal Architecture: Adapters
class IframeVideoAdapter extends VideoControlsPort {
    constructor(iframe) {
        super();
        this.iframe = iframe;
        this.isPlaying = false;
        this.volume = 1;
        this.muted = false;
        this.currentTime = 0;
        this.duration = 0;
    }

    play() {
        // Pornhub iframes do not support programmatic play/pause via postMessage
        // This is a simulation; in reality, controls are handled by iframe
        this.isPlaying = true;
        console.log('Play requested - iframe controls playback');
    }

    pause() {
        this.isPlaying = false;
        console.log('Pause requested - iframe controls playback');
    }

    setVolume(volume) {
        this.volume = volume;
        // Volume control not possible with iframe
        console.log('Volume set to', volume, '- not supported by iframe');
    }

    toggleMute() {
        this.muted = !this.muted;
        console.log('Mute toggled to', this.muted, '- not supported by iframe');
    }

    seek(time) {
        this.currentTime = time;
        console.log('Seek to', time, '- not supported by iframe');
    }

    enterFullscreen() {
        if (this.iframe.requestFullscreen) {
            this.iframe.requestFullscreen();
        }
    }

    exitFullscreen() {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }

    getCurrentTime() {
        return this.currentTime;
    }

    getDuration() {
        return this.duration;
    }
}

// Core Domain
class VideoPlayerDomain {
    constructor(adapter) {
        this.adapter = adapter;
    }

    play() {
        this.adapter.play();
    }

    pause() {
        this.adapter.pause();
    }

    togglePlayPause() {
        if (this.adapter.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    setVolume(volume) {
        this.adapter.setVolume(volume);
    }

    toggleMute() {
        this.adapter.toggleMute();
    }

    seek(time) {
        this.adapter.seek(time);
    }

    toggleFullscreen() {
        if (document.fullscreenElement) {
            this.adapter.exitFullscreen();
        } else {
            this.adapter.enterFullscreen();
        }
    }
}

class VideoPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });

        const template = document.createElement('template');
        template.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: relative;
                    background-color: #000;
                    aspect-ratio: 16 / 9;
                }
                iframe {
                    width: 100%;
                    height: 100%;
                    border: none;
                }
                .controls {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), rgba(0,0,0,0));
                    padding: 1rem;
                    display: flex;
                    gap: 1rem;
                    align-items: center;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    z-index: 10;
                }
                :host(:hover) .controls {
                    opacity: 1;
                }
                .controls button {
                    background: none;
                    border: none;
                    color: #fff;
                    font-size: 1.5rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 4px;
                    transition: background 0.2s;
                }
                .controls button:hover {
                    background: rgba(255,255,255,0.1);
                }
                input[type="range"] {
                    flex-grow: 1;
                    height: 4px;
                    background: #555;
                    border-radius: 2px;
                }
                input[type="range"]::-webkit-slider-thumb {
                    appearance: none;
                    width: 12px;
                    height: 12px;
                    background: #fff;
                    border-radius: 50%;
                    cursor: pointer;
                }
            </style>
            <iframe></iframe>
            <div class="controls">
                <button class="play-pause">▶️</button>
                <input type="range" class="progress-bar" value="0" min="0" max="100" step="0.1">
                <button class="volume">🔊</button>
                <input type="range" class="volume-slider" min="0" max="1" step="0.1" value="1">
                <button class="fullscreen">⛶</button>
            </div>
        `;

        this.shadowRoot.appendChild(template.content.cloneNode(true));

        this.iframe = this.shadowRoot.querySelector('iframe');
        this.playPauseBtn = this.shadowRoot.querySelector('.play-pause');
        this.progressBar = this.shadowRoot.querySelector('.progress-bar');
        this.volumeBtn = this.shadowRoot.querySelector('.volume');
        this.volumeSlider = this.shadowRoot.querySelector('.volume-slider');
        this.fullscreenBtn = this.shadowRoot.querySelector('.fullscreen');

        // Initialize Hexagonal Architecture
        this.adapter = new IframeVideoAdapter(this.iframe);
        this.domain = new VideoPlayerDomain(this.adapter);

        // Store event handlers for cleanup
        this.playPauseHandler = () => this.domain.togglePlayPause();
        this.progressHandler = (e) => this.domain.seek(e.target.value);
        this.volumeBtnHandler = () => this.domain.toggleMute();
        this.volumeSliderHandler = (e) => this.domain.setVolume(e.target.value);
        this.fullscreenHandler = () => this.domain.toggleFullscreen();

        this.addEventListeners();
    }

    static get observedAttributes() {
        return ['embed'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'embed') {
            this.iframe.src = newValue;
        }
    }

    addEventListeners() {
        this.playPauseBtn.addEventListener('click', this.playPauseHandler);
        this.progressBar.addEventListener('input', this.progressHandler);
        this.volumeBtn.addEventListener('click', this.volumeBtnHandler);
        this.volumeSlider.addEventListener('input', this.volumeSliderHandler);
        this.fullscreenBtn.addEventListener('click', this.fullscreenHandler);
    }

    disconnectedCallback() {
        // Remove event listeners
        this.playPauseBtn.removeEventListener('click', this.playPauseHandler);
        this.progressBar.removeEventListener('input', this.progressHandler);
        this.volumeBtn.removeEventListener('click', this.volumeBtnHandler);
        this.volumeSlider.removeEventListener('input', this.volumeSliderHandler);
        this.fullscreenBtn.removeEventListener('click', this.fullscreenHandler);
    }
}

customElements.define('video-player', VideoPlayer);
