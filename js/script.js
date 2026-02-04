// DOM Elements
const fileInput = document.getElementById("fileInput");
const dropZone = document.getElementById("dropZone");
const dropOverlay = document.getElementById("dropOverlay");
const fileName = document.getElementById("fileName");
const algorithmSelect = document.getElementById("algorithmSelect");
const patternInput = document.getElementById("patternInput");
const searchBtn = document.getElementById("searchBtn");
const resultsSection = document.getElementById("resultsSection");
const resultsContent = document.getElementById("resultsContent");
const loadingIndicator = document.getElementById("loadingIndicator");

// State
let currentFileContent = "";
let currentFileName = "";

// ============================================================
// STRING MATCHING ALGORITHMS (Ported from C++)
// ============================================================

/**
 * Naive String Matching Algorithm
 * Time Complexity: O(n*m) where n = text length, m = pattern length
 */
function naiveStringMatching(text, pattern) {
    const matches = [];
    if (!pattern || !text || pattern.length > text.length) return matches;

    const n = text.length;
    const m = pattern.length;

    for (let i = 0; i <= n - m; i++) {
        let match = true;
        for (let j = 0; j < m; j++) {
            if (text[i + j] !== pattern[j]) {
                match = false;
                break;
            }
        }
        if (match) {
            matches.push(i);
        }
    }
    return matches;
}

/**
 * KMP (Knuth-Morris-Pratt) Algorithm
 * Time Complexity: O(n + m)
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

function kmpStringMatching(text, pattern) {
    const matches = [];
    if (!pattern || !text) return matches;

    const n = text.length;
    const m = pattern.length;
    if (m === 0) return matches;

    const lps = computeLPS(pattern);
    let i = 0; // index for text
    let j = 0; // index for pattern

    while (i < n) {
        if (text[i] === pattern[j]) {
            i++;
            j++;
        }

        if (j === m) {
            matches.push(i - j);
            j = lps[j - 1];
        } else if (i < n && text[i] !== pattern[j]) {
            if (j !== 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }
    }
    return matches;
}

/**
 * Rabin-Karp (Hashing) Algorithm
 * Time Complexity: O(n + m) average, O(n*m) worst case
 */
function rabinKarpStringMatching(text, pattern) {
    const matches = [];
    if (!pattern || !text || pattern.length > text.length) return matches;

    const n = text.length;
    const m = pattern.length;
    const prime = 101; // A prime number for hashing
    const base = 256; // Number of characters in the alphabet

    let patternHash = 0;
    let textHash = 0;
    let h = 1; // base^(m-1) % prime

    // Calculate h = base^(m-1) % prime
    for (let i = 0; i < m - 1; i++) {
        h = (h * base) % prime;
    }

    // Calculate initial hash values for pattern and first window of text
    for (let i = 0; i < m; i++) {
        patternHash = (base * patternHash + pattern.charCodeAt(i)) % prime;
        textHash = (base * textHash + text.charCodeAt(i)) % prime;
    }

    // Slide the pattern over text one by one
    for (let i = 0; i <= n - m; i++) {
        // Check if hash values match
        if (patternHash === textHash) {
            // Verify character by character (to handle hash collisions)
            let match = true;
            for (let j = 0; j < m; j++) {
                if (text[i + j] !== pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                matches.push(i);
            }
        }

        // Calculate hash value for next window
        if (i < n - m) {
            textHash = (base * (textHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % prime;
            // Handle negative hash
            if (textHash < 0) {
                textHash += prime;
            }
        }
    }
    return matches;
}

/**
 * Horspool (Boyer-Moore-Horspool) Algorithm
 * Time Complexity: O(n*m) worst case, O(n/m) best case
 */
function horspoolStringMatching(text, pattern) {
    const matches = [];
    if (!pattern || !text || pattern.length > text.length) return matches;

    const n = text.length;
    const m = pattern.length;

    // Build bad character shift table
    const shiftTable = {};
    
    // Default shift is pattern length
    for (let i = 0; i < m - 1; i++) {
        shiftTable[pattern[i]] = m - 1 - i;
    }

    let i = 0;
    while (i <= n - m) {
        let j = m - 1;
        
        // Compare from right to left
        while (j >= 0 && text[i + j] === pattern[j]) {
            j--;
        }

        if (j < 0) {
            // Match found
            matches.push(i);
            i++; // Move by 1 to find overlapping matches
        } else {
            // Shift based on bad character rule
            const shift = shiftTable[text[i + m - 1]];
            i += (shift !== undefined) ? shift : m;
        }
    }
    return matches;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Convert character index to row/column position
 */
function computeRowCol(text, index) {
    let row = 1;
    let col = 1;
    for (let i = 0; i < index; i++) {
        if (text[i] === "\n") {
            row++;
            col = 1;
        } else {
            col++;
        }
    }
    return { row, col };
}

/**
 * Perform string matching using the selected algorithm
 */
function performStringMatching(text, pattern, algorithm) {
    const startTime = performance.now();
    let indices = [];

    switch (algorithm) {
        case "naive":
            indices = naiveStringMatching(text, pattern);
            break;
        case "kmp":
            indices = kmpStringMatching(text, pattern);
            break;
        case "hashing":
            indices = rabinKarpStringMatching(text, pattern);
            break;
        case "horspool":
            indices = horspoolStringMatching(text, pattern);
            break;
        default:
            indices = naiveStringMatching(text, pattern);
    }

    const endTime = performance.now();
    const processingTime = (endTime - startTime).toFixed(2);

    // Convert indices to match objects with row/col
    const matches = indices.map(pos => {
        const rc = computeRowCol(text, pos);
        return { pos, row: rc.row, col: rc.col };
    });

    return {
        matches: matches,
        count: matches.length,
        algorithm: algorithm,
        processingTime: processingTime + "ms",
        pattern: pattern
    };
}

// ============================================================
// FILE HANDLING
// ============================================================

// File Upload Handler
fileInput.addEventListener("change", handleFileSelect);

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === "text/plain") {
        processFile(file);
    } else {
        showError("Please select a valid .txt file");
    }
}

// Process File
function processFile(file) {
    currentFileName = file.name;
    fileName.textContent = `Selected: ${currentFileName}`;

    const reader = new FileReader();
    reader.onload = function (e) {
        currentFileContent = e.target.result;
        searchBtn.disabled = false;
        resultsSection.style.display = "none";
    };
    reader.onerror = function () {
        showError("Error reading file");
    };
    reader.readAsText(file);
}

// ============================================================
// DRAG AND DROP
// ============================================================

["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Show overlay when dragging over window
document.body.addEventListener("dragenter", function (e) {
    if (e.dataTransfer.types.includes("Files")) {
        dropOverlay.classList.add("active");
    }
});

// Remove overlay when leaving
dropOverlay.addEventListener("dragleave", function (e) {
    if (e.target === dropOverlay) {
        dropOverlay.classList.remove("active");
    }
});

// Handle drop on overlay
dropOverlay.addEventListener("drop", handleDrop);

// Handle drop on drop zone
dropZone.addEventListener("drop", handleDrop);

// Drop zone hover effect
dropZone.addEventListener("dragenter", function () {
    dropZone.classList.add("dragover");
});

dropZone.addEventListener("dragleave", function () {
    dropZone.classList.remove("dragover");
});

function handleDrop(e) {
    dropOverlay.classList.remove("active");
    dropZone.classList.remove("dragover");

    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
        const file = files[0];
        if (file.type === "text/plain") {
            processFile(file);
        } else {
            showError("Please drop a valid .txt file");
        }
    }
}

// ============================================================
// SEARCH FUNCTIONALITY
// ============================================================

searchBtn.addEventListener("click", performSearch);

function performSearch() {
    const pattern = patternInput.value.trim();

    if (!pattern) {
        showError("Please enter a pattern to search");
        return;
    }

    if (!currentFileContent) {
        showError("Please upload a file first");
        return;
    }

    const algorithm = algorithmSelect.value;

    // Show loading
    loadingIndicator.style.display = "block";
    resultsSection.style.display = "none";
    searchBtn.disabled = true;

    // Use setTimeout to allow UI to update before processing
    setTimeout(() => {
        try {
            const result = performStringMatching(currentFileContent, pattern, algorithm);
            displayResults(result);
        } catch (error) {
            showError("Error performing search: " + error.message);
        } finally {
            loadingIndicator.style.display = "none";
            searchBtn.disabled = false;
        }
    }, 10);
}

// ============================================================
// DISPLAY RESULTS
// ============================================================

function displayResults(result) {
    resultsSection.style.display = "block";

    const matchCount = result.count || 0;
    const matches = result.matches || [];
    const processingTime = result.processingTime || "0ms";
    const algorithm = result.algorithm || "unknown";

    let html = `
        <div class="result-summary">
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="result-stat">
                        <div class="stat-label">Pattern</div>
                        <div class="stat-value">"${escapeHtml(result.pattern)}"</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="result-stat">
                        <div class="stat-label">Matches Found</div>
                        <div class="stat-value">${matchCount}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="result-stat">
                        <div class="stat-label">Algorithm</div>
                        <div class="stat-value">${algorithm.toUpperCase()}</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="result-stat">
                        <div class="stat-label">Time</div>
                        <div class="stat-value">${processingTime}</div>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (matchCount > 0) {
        html += `
            <div class="matches-section">
                <h4 style="color: var(--accent-gold); margin-bottom: 1rem;">Match Positions:</h4>
                <div class="matches-grid">
                    ${matches
                        .slice(0, 20)
                        .map(
                            (match, idx) => `
                        <div class="match-item">
                            <span class="match-label">Match ${idx + 1}:</span>
                            <span class="match-position">Line ${match.row}, Col ${match.col}</span>
                            <small style="color: gray;">(Index: ${match.pos})</small>
                        </div>
                    `
                        )
                        .join("")}
                    ${matchCount > 20 ? `<div class="match-item" style="grid-column: 1/-1; text-align: center; color: var(--accent-gold);">... and ${matchCount - 20} more matches</div>` : ""}
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="no-matches" style="text-align: center; padding: 2rem; color: var(--accent-gold);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="font-size: 1.2rem;">No matches found for "${escapeHtml(result.pattern)}"</p>
            </div>
        `;
    }

    resultsContent.innerHTML = html;
    addResultStyles();
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// STYLES
// ============================================================

function addResultStyles() {
    if (!document.getElementById("result-styles")) {
        const style = document.createElement("style");
        style.id = "result-styles";
        style.textContent = `
            .result-stat {
                background: rgba(219, 101, 33, 0.15);
                padding: 1.5rem;
                border-radius: 15px;
                text-align: center;
                border: 2px solid var(--primary-orange);
            }
            .stat-label {
                color: var(--accent-gold);
                font-size: 0.85rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 0.5rem;
            }
            .stat-value {
                color: var(--text-cream);
                font-size: 1.5rem;
                font-weight: 700;
            }
            .matches-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 1rem;
            }
            .match-item {
                background: rgba(134, 12, 22, 0.2);
                padding: 0.8rem 1rem;
                border-radius: 10px;
                border-left: 3px solid var(--accent-gold);
            }
            .match-label {
                color: var(--accent-gold);
                font-size: 0.85rem;
                display: block;
                margin-bottom: 0.3rem;
            }
            .match-position {
                color: var(--text-cream);
                font-size: 1.1rem;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================
// ERROR HANDLING
// ============================================================

function showError(message) {
    resultsSection.style.display = "block";
    resultsContent.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 2rem;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #F44336; margin-bottom: 1rem;"></i>
            <p style="color: var(--text-cream); font-size: 1.2rem;">${escapeHtml(message)}</p>
        </div>
    `;

    // Auto-hide error after 5 seconds
    setTimeout(() => {
        resultsSection.style.display = "none";
    }, 5000);
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener("DOMContentLoaded", function () {
    console.log("String Matching Test Page Initialized");
    console.log("Available algorithms: Naive, KMP, Rabin-Karp (Hashing), Horspool");
});
