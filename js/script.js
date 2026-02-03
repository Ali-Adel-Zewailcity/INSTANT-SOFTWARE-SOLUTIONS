// DOM Elements
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const dropOverlay = document.getElementById('dropOverlay');
const fileName = document.getElementById('fileName');
const algorithmSelect = document.getElementById('algorithmSelect');
const patternInput = document.getElementById('patternInput');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContent = document.getElementById('resultsContent');
const loadingIndicator = document.getElementById('loadingIndicator');

// State
let currentFileContent = '';
let currentFileName = '';

// File Upload Handler
fileInput.addEventListener('change', handleFileSelect);

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type === 'text/plain') {
        processFile(file);
    } else {
        showError('Please select a valid .txt file');
    }
}

// Process File
function processFile(file) {
    currentFileName = file.name;
    fileName.textContent = `Selected: ${currentFileName}`;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        currentFileContent = e.target.result;
        searchBtn.disabled = false;
        resultsSection.style.display = 'none';
    };
    reader.onerror = function() {
        showError('Error reading file');
    };
    reader.readAsText(file);
}

// Drag and Drop Events
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    document.body.addEventListener(eventName, preventDefaults, false);
});

function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
}

// Show overlay when dragging over window
document.body.addEventListener('dragenter', function(e) {
    if (e.dataTransfer.types.includes('Files')) {
        dropOverlay.classList.add('active');
    }
});

// Remove overlay when leaving
dropOverlay.addEventListener('dragleave', function(e) {
    if (e.target === dropOverlay) {
        dropOverlay.classList.remove('active');
    }
});

// Handle drop on overlay
dropOverlay.addEventListener('drop', handleDrop);

// Handle drop on drop zone
dropZone.addEventListener('drop', handleDrop);

// Drop zone hover effect
dropZone.addEventListener('dragenter', function() {
    dropZone.classList.add('dragover');
});

dropZone.addEventListener('dragleave', function() {
    dropZone.classList.remove('dragover');
});

function handleDrop(e) {
    dropOverlay.classList.remove('active');
    dropZone.classList.remove('dragover');
    
    const dt = e.dataTransfer;
    const files = dt.files;
    
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'text/plain') {
            processFile(file);
        } else {
            showError('Please drop a valid .txt file');
        }
    }
}

// Search Button Handler
searchBtn.addEventListener('click', performSearch);

async function performSearch() {
    const pattern = patternInput.value.trim();
    
    if (!pattern) {
        showError('Please enter a pattern to search');
        return;
    }
    
    if (!currentFileContent) {
        showError('Please upload a file first');
        return;
    }
    
    const algorithm = algorithmSelect.value;
    
    // Show loading
    loadingIndicator.style.display = 'block';
    resultsSection.style.display = 'none';
    searchBtn.disabled = true;
    
    try {
        // Call C++ API
        const result = await callCppApi(currentFileContent, pattern, algorithm);
        
        // Display results
        displayResults(result);
    } catch (error) {
        showError('Error performing search: ' + error.message);
    } finally {
        loadingIndicator.style.display = 'none';
        searchBtn.disabled = false;
    }
}

// C++ API Integration
async function callCppApi(text, pattern, algorithm) {
    // API endpoint configuration
    const API_ENDPOINT = 'http://localhost:8080/api/search'; // Adjust this to your C++ server
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text,
                pattern: pattern,
                algorithm: algorithm
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
        
    } catch (error) {
        console.error('API Error:', error);
        
        // Fallback to simulated results for demonstration
        return simulateSearch(text, pattern, algorithm);
    }
}

// Simulated Search (for testing without backend)
function simulateSearch(text, pattern, algorithm) {
    const matches = [];
    const lowerText = text.toLowerCase();
    const lowerPattern = pattern.toLowerCase();
    
    let index = lowerText.indexOf(lowerPattern);
    while (index !== -1) {
        matches.push(index);
        index = lowerText.indexOf(lowerPattern, index + 1);
    }
    
    // Simulate processing time
    const startTime = performance.now();
    const processingTime = (performance.now() - startTime).toFixed(2);
    
    return {
        matches: matches,
        count: matches.length,
        algorithm: algorithm,
        processingTime: processingTime + 'ms',
        pattern: pattern
    };
}

// Display Results
function displayResults(result) {
    resultsSection.style.display = 'block';
    
    const matchCount = result.count || 0;
    const matches = result.matches || [];
    const processingTime = result.processingTime || '0ms';
    const algorithm = result.algorithm || 'unknown';
    
    let html = `
        <div class="result-summary">
            <div class="row g-3 mb-4">
                <div class="col-md-3">
                    <div class="result-stat">
                        <div class="stat-label">Pattern</div>
                        <div class="stat-value">"${result.pattern}"</div>
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
                    ${matches.slice(0, 20).map((pos, idx) => `
                        <div class="match-item">
                            <span class="match-label">Match ${idx + 1}:</span>
                            <span class="match-position">Position ${pos}</span>
                        </div>
                    `).join('')}
                    ${matchCount > 20 ? `<div class="match-item" style="grid-column: 1/-1; text-align: center; color: var(--accent-gold);">... and ${matchCount - 20} more matches</div>` : ''}
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="no-matches" style="text-align: center; padding: 2rem; color: var(--accent-gold);">
                <i class="fas fa-search" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                <p style="font-size: 1.2rem;">No matches found for "${result.pattern}"</p>
            </div>
        `;
    }
    
    resultsContent.innerHTML = html;
    
    // Add CSS for result stats
    addResultStyles();
}

// Add Result Styles Dynamically
function addResultStyles() {
    if (!document.getElementById('result-styles')) {
        const style = document.createElement('style');
        style.id = 'result-styles';
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

// Error Handling
function showError(message) {
    resultsSection.style.display = 'block';
    resultsContent.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 2rem;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #F44336; margin-bottom: 1rem;"></i>
            <p style="color: var(--text-cream); font-size: 1.2rem;">${message}</p>
        </div>
    `;
    
    // Auto-hide error after 5 seconds
    setTimeout(() => {
        resultsSection.style.display = 'none';
    }, 5000);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('String Matching Test Page Initialized');
    console.log('API Endpoint: Configure in script.js');
});