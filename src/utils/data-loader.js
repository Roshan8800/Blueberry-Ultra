// src/utils/data-loader.js
// Utility to load and search video data

let allVideos = null;

export async function loadAllVideos() {
    if (allVideos) return allVideos;

    allVideos = [];
    let loadedCount = 0;
    let failedCount = 0;

    for (let i = 0; i <= 46; i++) {
        try {
            const response = await fetch(`data/data_${i}.json`, {
                timeout: 10000 // 10 second timeout
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!Array.isArray(data)) {
                throw new Error('Invalid data format: expected array');
            }

            const videos = data.map((video, index) => {
                try {
                    const parts = video.embed.split('|');
                    return {
                        id: `${i}_${index}`, // Unique ID: file_index
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
                } catch (parseError) {
                    console.warn(`Error parsing video ${i}_${index}:`, parseError);
                    return null;
                }
            }).filter(video => video !== null);

            allVideos.push(...videos);
            loadedCount++;
        } catch (error) {
            console.error(`Error loading data_${i}.json:`, error);
            failedCount++;

            // If more than half the files fail, this might be a network issue
            if (failedCount > 23) { // More than half of 46 files
                throw new Error('Unable to load video data. Please check your internet connection and try again.');
            }
        }
    }

    if (allVideos.length === 0) {
        throw new Error('No video data could be loaded. Please try refreshing the page.');
    }

    console.log(`Loaded ${allVideos.length} videos from ${loadedCount} files (${failedCount} files failed)`);
    return allVideos;
}

export async function getVideoById(id) {
    const videos = await loadAllVideos();
    return videos.find(video => video.id === id);
}

export async function getVideosByIds(ids) {
    const videos = await loadAllVideos();
    return videos.filter(video => ids.includes(video.id));
}