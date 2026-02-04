// ============================================================
// MOVIE SEARCH ENGINE WITH KMP STRING MATCHING
// ============================================================

// DOM Elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const searchStats = document.getElementById('searchStats');
const loadingIndicator = document.getElementById('loadingIndicator');

// Data Storage
let moviesData = [];
let ratingsData = {};
let genresData = {};
let sequelsData = {};
let actorsData = {};
let dataLoaded = false;

// ============================================================
// KMP STRING MATCHING ALGORITHM
// ============================================================

/**
 * Compute LPS (Longest Proper Prefix which is also Suffix) array
 * Time Complexity: O(m) where m = pattern length
 */
function computeLPS(pattern) {
    const m = pattern.length;
    const lps = new Array(m).fill(0);
    let len = 0;
    let i = 1;

    while (i < m) {
        if (pattern[i] === pattern[len]) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len !== 0) {
                len = lps[len - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
    return lps;
}

/**
 * KMP (Knuth-Morris-Pratt) String Matching Algorithm
 * Time Complexity: O(n + m)
 * @param {string} text - The text to search in
 * @param {string} pattern - The pattern to search for
 * @returns {number[]} Array of starting indices where pattern was found
 */
function kmpStringMatching(text, pattern) {
    const matches = [];
    if (!pattern || !text) return matches;

    // Convert to lowercase for case-insensitive search
    const lowerText = text.toLowerCase();
    const lowerPattern = pattern.toLowerCase();

    const n = lowerText.length;
    const m = lowerPattern.length;
    if (m === 0 || m > n) return matches;

    const lps = computeLPS(lowerPattern);
    let i = 0; // index for text
    let j = 0; // index for pattern

    while (i < n) {
        if (lowerText[i] === lowerPattern[j]) {
            i++;
            j++;
        }

        if (j === m) {
            matches.push(i - j);
            j = lps[j - 1];
        } else if (i < n && lowerText[i] !== lowerPattern[j]) {
            if (j !== 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }
    }
    return matches;
}

// ============================================================
// CSV PARSING UTILITIES
// ============================================================

/**
 * Parse CSV content into array of objects
 */
function parseCSV(csvContent) {
    const lines = csvContent.split('\n');
    if (lines.length < 2) return [];

    const headers = parseCSVLine(lines[0]);
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const values = parseCSVLine(line);
        const obj = {};

        headers.forEach((header, idx) => {
            obj[header.trim()] = values[idx] ? values[idx].trim() : '';
        });

        data.push(obj);
    }

    return data;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current);

    return result.map(val => val.replace(/^"|"$/g, '').trim());
}

// ============================================================
// DATA LOADING (From Embedded Data)
// ============================================================

/**
 * Load all data from embedded CSV strings
 */
function loadAllData() {
    if (dataLoaded) return true;

    try {
        showLoading(true);

        // Check if embedded data exists
        if (typeof MOVIES_CSV === 'undefined') {
            throw new Error('Movie data not loaded. Make sure movie_data.js is included.');
        }

        // Parse movies
        moviesData = parseCSV(MOVIES_CSV);
        console.log(`Loaded ${moviesData.length} movies`);

        // Parse ratings into lookup object by id
        if (typeof RATINGS_CSV !== 'undefined') {
            const ratingsArray = parseCSV(RATINGS_CSV);
            ratingsArray.forEach(r => {
                ratingsData[r.id] = {
                    vote_average: parseFloat(r.vote_average) || 0,
                    vote_count: parseInt(r.vote_count) || 0
                };
            });
            console.log(`Loaded ${ratingsArray.length} ratings`);
        }

        // Parse genres into lookup object by movie_id (array of genres)
        if (typeof GENRES_CSV !== 'undefined') {
            const genresArray = parseCSV(GENRES_CSV);
            genresArray.forEach(g => {
                if (!genresData[g.movie_id]) {
                    genresData[g.movie_id] = [];
                }
                genresData[g.movie_id].push(g.genre);
            });
            console.log(`Loaded ${genresArray.length} genre mappings`);
        }

        // Parse sequels into lookup object by id
        if (typeof SEQUELS_CSV !== 'undefined') {
            const sequelsArray = parseCSV(SEQUELS_CSV);
            sequelsArray.forEach(s => {
                sequelsData[s.id] = {
                    title: s.title,
                    sequel: s.sequel || null
                };
            });
            console.log(`Loaded ${sequelsArray.length} sequel entries`);
        }

        // Parse actors into lookup object by title
        if (typeof ACTORS_CSV !== 'undefined') {
            const actorsArray = parseCSV(ACTORS_CSV);
            actorsArray.forEach(a => {
                // Parse the actor array string
                let actors = a.Actor || '';
                // Remove brackets and split by comma
                actors = actors.replace(/^\[|\]$/g, '').split(',').map(actor => actor.trim()).filter(act => act);
                actorsData[a.Title] = actors;
            });
            console.log(`Loaded actor data for ${actorsArray.length} movies`);
        }

        dataLoaded = true;
        showLoading(false);
        console.log('All movie data loaded successfully!');
        return true;

    } catch (error) {
        console.error('Error loading data:', error);
        showError('Failed to load movie database: ' + error.message);
        showLoading(false);
        return false;
    }
}

// ============================================================
// SEARCH FUNCTIONALITY
// ============================================================

/**
 * Search movies using KMP algorithm
 */
function searchMovies(query) {
    if (!query.trim()) {
        showError('Please enter a movie name to search');
        return;
    }

    // Ensure data is loaded
    if (!dataLoaded) {
        const loaded = loadAllData();
        if (!loaded) return;
    }

    showLoading(true);
    resultsSection.style.display = 'none';

    // Use setTimeout to allow UI to update
    setTimeout(() => {
        const startTime = performance.now();
        const matches = [];

        // Search through all movie titles using KMP
        moviesData.forEach(movie => {
            const title = movie.title || '';
            const matchIndices = kmpStringMatching(title, query);

            if (matchIndices.length > 0) {
                // Get all related data for this movie
                const movieId = movie.id;

                const movieInfo = {
                    id: movieId,
                    title: title,
                    popularity: parseFloat(movie.popularity) || 0,
                    release_date: movie.release_date || 'Unknown',
                    rating: ratingsData[movieId] || { vote_average: 0, vote_count: 0 },
                    genres: genresData[movieId] || [],
                    sequel: sequelsData[movieId] || null,
                    actors: actorsData[title] || []
                };

                // Find sequel title if exists
                if (movieInfo.sequel && movieInfo.sequel.sequel) {
                    const sequelId = movieInfo.sequel.sequel;
                    const sequelEntry = sequelsData[sequelId];
                    if (sequelEntry) {
                        movieInfo.sequelTitle = sequelEntry.title;
                    }
                }

                matches.push(movieInfo);
            }
        });

        // Sort by popularity (descending)
        matches.sort((a, b) => b.popularity - a.popularity);

        const endTime = performance.now();
        const searchTime = (endTime - startTime).toFixed(2);

        showLoading(false);
        displayResults(matches, query, searchTime);

    }, 10);
}

// ============================================================
// DISPLAY FUNCTIONS
// ============================================================

/**
 * Display search results
 */
function displayResults(movies, query, searchTime) {
    resultsSection.style.display = 'block';

    // Update stats
    searchStats.innerHTML = `
        <div class="stat-item">
            <i class="fas fa-film"></i>
            <span>Found:</span>
            <span class="stat-value">${movies.length} movies</span>
        </div>
        <div class="stat-item">
            <i class="fas fa-clock"></i>
            <span>Time:</span>
            <span class="stat-value">${searchTime}ms</span>
        </div>
        <div class="stat-item">
            <i class="fas fa-code"></i>
            <span>Algorithm:</span>
            <span class="stat-value">KMP</span>
        </div>
    `;

    if (movies.length === 0) {
        resultsContent.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search no-results-icon"></i>
                <p class="no-results-text">No movies found for "${escapeHtml(query)}"</p>
                <p class="no-results-hint">Try a different search term or check your spelling</p>
            </div>
        `;
        return;
    }

    // Generate movie cards
    let html = '<div class="movies-grid">';

    movies.forEach(movie => {
        html += generateMovieCard(movie);
    });

    html += '</div>';
    resultsContent.innerHTML = html;
}

/**
 * Generate HTML for a movie card
 */
function generateMovieCard(movie) {
    const rating = movie.rating.vote_average;
    const starsHtml = generateStars(rating);
    const releaseYear = movie.release_date ? movie.release_date.split('-')[0] : 'N/A';

    let html = `
        <div class="movie-card">
            ${movie.popularity > 50 ? '<span class="popularity-badge">Popular</span>' : ''}
            <h3 class="movie-title">${escapeHtml(movie.title)}</h3>
            <div class="movie-meta">
                <span class="meta-item">
                    <i class="fas fa-calendar"></i>
                    ${releaseYear}
                </span>
                <span class="meta-item">
                    <i class="fas fa-fire"></i>
                    Popularity: ${movie.popularity.toFixed(1)}
                </span>
            </div>
    `;

    // Ratings section
    if (movie.rating.vote_count > 0) {
        html += `
            <div class="movie-info-section">
                <div class="info-label">Rating</div>
                <div class="rating-container">
                    <div class="rating-score">
                        <span class="rating-value">${rating.toFixed(1)}</span>
                        <span class="rating-max">/10</span>
                    </div>
                    <div class="rating-stars">${starsHtml}</div>
                    <span class="vote-count">(${movie.rating.vote_count.toLocaleString()} votes)</span>
                </div>
            </div>
        `;
    }

    // Genres section
    if (movie.genres.length > 0) {
        html += `
            <div class="movie-info-section">
                <div class="info-label">Genres</div>
                <div class="genres-container">
                    ${movie.genres.map(g => `<span class="genre-tag">${escapeHtml(g)}</span>`).join('')}
                </div>
            </div>
        `;
    }

    // Sequel section
    if (movie.sequelTitle) {
        html += `
            <div class="movie-info-section">
                <div class="info-label">Sequel</div>
                <div class="sequel-info">
                    <i class="fas fa-arrow-right"></i>
                    <span class="sequel-title">${escapeHtml(movie.sequelTitle)}</span>
                </div>
            </div>
        `;
    }

    // Actors section
    if (movie.actors.length > 0) {
        html += `
            <div class="movie-info-section">
                <div class="info-label">Cast</div>
                <div class="actors-container">
                    ${movie.actors.slice(0, 5).map(a => `<span class="actor-tag">${escapeHtml(a)}</span>`).join('')}
                    ${movie.actors.length > 5 ? `<span class="actor-tag">+${movie.actors.length - 5} more</span>` : ''}
                </div>
            </div>
        `;
    }

    html += '</div>';
    return html;
}

/**
 * Generate star rating HTML
 */
function generateStars(rating) {
    const fullStars = Math.floor(rating / 2);
    const halfStar = rating % 2 >= 1;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

    let html = '';
    for (let i = 0; i < fullStars; i++) {
        html += '<i class="fas fa-star"></i>';
    }
    if (halfStar) {
        html += '<i class="fas fa-star-half-alt"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
        html += '<i class="fas fa-star empty"></i>';
    }
    return html;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Show/hide loading indicator
 */
function showLoading(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
}

/**
 * Show error message
 */
function showError(message) {
    resultsSection.style.display = 'block';
    resultsContent.innerHTML = `
        <div class="no-results">
            <i class="fas fa-exclamation-circle no-results-icon" style="color: #F44336;"></i>
            <p class="no-results-text">${escapeHtml(message)}</p>
        </div>
    `;
    searchStats.innerHTML = '';
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// EVENT LISTENERS
// ============================================================

// Search button click
searchBtn.addEventListener('click', () => {
    searchMovies(searchInput.value);
});

// Enter key in search input
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchMovies(searchInput.value);
    }
});

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    console.log('Movie Search Engine Initialized');
    console.log('Using KMP (Knuth-Morris-Pratt) String Matching Algorithm');

    // Load data on page load
    loadAllData();
});
