// DOM Elements
const sentimentText = document.getElementById('sentimentText');
const analyzeBtn = document.getElementById('analyzeBtn');
const sentimentResults = document.getElementById('sentimentResults');
const sentimentLoading = document.getElementById('sentimentLoading');
const algoButtons = document.querySelectorAll('.algo-btn');
const highlightOverlay = document.getElementById('highlightOverlay');
const highlightLegend = document.getElementById('highlightLegend');

// Sentiment Data (loaded from data.json)
let SENTIMENT_DATA = null;

// State
let selectedAlgorithm = 'naive';

// ============================================================
// STRING MATCHING ALGORITHMS
// ============================================================

/**
 * Naive String Matching Algorithm
 * Time Complexity: O(n*m)
 */
function naiveSearch(text, pattern) {
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
function kmpSearch(text, pattern) {
    const matches = [];
    if (!pattern || !text) return matches;

    const n = text.length;
    const m = pattern.length;
    if (m === 0) return matches;

    // Build LPS array
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

    // Search
    i = 0;
    let j = 0;
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
 * Time Complexity: O(n + m) average
 */
function hashingSearch(text, pattern) {
    const matches = [];
    if (!pattern || !text || pattern.length > text.length) return matches;

    const n = text.length;
    const m = pattern.length;
    const prime = 101;
    const base = 256;

    let patternHash = 0;
    let textHash = 0;
    let h = 1;

    for (let i = 0; i < m - 1; i++) {
        h = (h * base) % prime;
    }

    for (let i = 0; i < m; i++) {
        patternHash = (base * patternHash + pattern.charCodeAt(i)) % prime;
        textHash = (base * textHash + text.charCodeAt(i)) % prime;
    }

    for (let i = 0; i <= n - m; i++) {
        if (patternHash === textHash) {
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

        if (i < n - m) {
            textHash = (base * (textHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % prime;
            if (textHash < 0) {
                textHash += prime;
            }
        }
    }
    return matches;
}

/**
 * Horspool (Boyer-Moore-Horspool) Algorithm
 * Time Complexity: O(n*m) worst, O(n/m) best
 */
function horspoolSearch(text, pattern) {
    const matches = [];
    if (!pattern || !text || pattern.length > text.length) return matches;

    const n = text.length;
    const m = pattern.length;

    // Build bad character shift table
    const shiftTable = {};
    for (let i = 0; i < m - 1; i++) {
        shiftTable[pattern[i]] = m - 1 - i;
    }

    let i = 0;
    while (i <= n - m) {
        let j = m - 1;

        while (j >= 0 && text[i + j] === pattern[j]) {
            j--;
        }

        if (j < 0) {
            matches.push(i);
            i++;
        } else {
            const shift = shiftTable[text[i + m - 1]];
            i += (shift !== undefined) ? shift : m;
        }
    }
    return matches;
}

/**
 * Find matches using selected algorithm with word boundary checking
 */
function findMatches(text, pattern, algorithm) {
    let rawMatches;
    switch (algorithm) {
        case 'naive':
            rawMatches = naiveSearch(text, pattern);
            break;
        case 'horspool':
            rawMatches = horspoolSearch(text, pattern);
            break;
        case 'kmp':
            rawMatches = kmpSearch(text, pattern);
            break;
        case 'hashing':
            rawMatches = hashingSearch(text, pattern);
            break;
        default:
            rawMatches = naiveSearch(text, pattern);
    }
    
    // Filter matches to only include word boundaries
    return rawMatches.filter(pos => {
        const charBefore = pos > 0 ? text[pos - 1] : ' ';
        const charAfter = pos + pattern.length < text.length ? text[pos + pattern.length] : ' ';
        const isWordBoundary = /[\s.,!?;:'"()\[\]{}\-]/.test(charBefore) && /[\s.,!?;:'"()\[\]{}\-]/.test(charAfter);
        return isWordBoundary;
    });
}

// ============================================================
// LOAD SENTIMENT DATA
// ============================================================

async function loadSentimentData() {
    try {
        const response = await fetch('js/data.json');
        if (!response.ok) {
            throw new Error('Failed to load sentiment data');
        }
        SENTIMENT_DATA = await response.json();
        console.log('Sentiment data loaded successfully:', Object.keys(SENTIMENT_DATA));
    } catch (error) {
        console.error('Error loading sentiment data:', error);
        // Fallback to basic keywords if data.json fails to load
        SENTIMENT_DATA = {
            anger: [
                {word: 'hate', weight: 8}, {word: 'furious', weight: 9}, {word: 'angry', weight: 7}
            ],
            sadness: [
                {word: 'sad', weight: 7}, {word: 'depressed', weight: 9}, {word: 'hopeless', weight: 10}
            ],
            anxiety: [
                {word: 'anxious', weight: 8}, {word: 'worried', weight: 7}, {word: 'nervous', weight: 6}
            ],
            stress: [
                {word: 'stressed', weight: 8}, {word: 'overwhelmed', weight: 9}, {word: 'exhausted', weight: 8}
            ],
            grief: [
                {word: 'grief', weight: 9}, {word: 'mourning', weight: 8}, {word: 'loss', weight: 7}
            ]
        };
    }
}

// ============================================================
// SENTIMENT ANALYSIS
// ============================================================

/**
 * Analyze sentiment of text using string matching algorithms
 */
function analyzeSentiment(text, algorithm) {
    const startTime = performance.now();
    
    // Convert text to lowercase for matching
    const lowerText = text.toLowerCase();
    
    // Results by category
    const categoryResults = {};
    let totalNegativeScore = 0;
    let totalMatches = 0;
    const detectedWords = [];
    
    // Process each emotional category
    Object.keys(SENTIMENT_DATA).forEach(category => {
        categoryResults[category] = {
            matches: [],
            totalWeight: 0,
            count: 0
        };
        
        // Search for each word in the category
        SENTIMENT_DATA[category].forEach(item => {
            const word = item.word.toLowerCase();
            const weight = item.weight || 5;
            const suggestion = item.suggestion || '';
            
            // Use string matching algorithm to find occurrences
            const matches = findMatches(lowerText, word, algorithm);
            
            if (matches.length > 0) {
                const wordScore = matches.length * weight;
                
                categoryResults[category].matches.push({
                    word: item.word,
                    count: matches.length,
                    weight: weight,
                    score: wordScore,
                    suggestion: suggestion,
                    positions: matches
                });
                
                categoryResults[category].totalWeight += wordScore;
                categoryResults[category].count += matches.length;
                
                totalNegativeScore += wordScore;
                totalMatches += matches.length;
                
                detectedWords.push({
                    word: item.word,
                    category: category,
                    count: matches.length,
                    weight: weight,
                    score: wordScore,
                    suggestion: suggestion
                });
            }
        });
    });
    
    const endTime = performance.now();
    const processingTime = (endTime - startTime).toFixed(2);
    
    // Determine dominant emotions
    const sortedCategories = Object.entries(categoryResults)
        .filter(([_, data]) => data.count > 0)
        .sort((a, b) => b[1].totalWeight - a[1].totalWeight);
    
    const dominantEmotion = sortedCategories.length > 0 ? sortedCategories[0][0] : 'neutral';
    
    // Calculate sentiment scores properly
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const sentimentDensity = wordCount > 0 ? (totalMatches / wordCount) * 100 : 0;
    
    // Improved scoring system
    // Calculate concern score based on weighted matches
    const maxPossibleScore = wordCount * 10; // Assuming max weight is 10
    let concernScore = 0;
    
    if (maxPossibleScore > 0) {
        // Normalize the score to 0-100 range
        concernScore = Math.min(100, (totalNegativeScore / maxPossibleScore) * 100 * 3);
    }
    
    // Calculate positive, negative, and neutral scores
    let positiveScore, negativeScore, neutralScore;
    
    if (totalMatches === 0) {
        // No negative words detected - text is positive/neutral
        positiveScore = 85;
        negativeScore = 0;
        neutralScore = 15;
    } else {
        // Calculate based on concern score and density
        negativeScore = Math.round(Math.min(100, concernScore));
        
        // High density of negative words means less positive sentiment
        const densityFactor = Math.min(1, sentimentDensity / 20);
        positiveScore = Math.round(Math.max(0, (100 - negativeScore) * (1 - densityFactor)));
        neutralScore = Math.round(100 - positiveScore - negativeScore);
    }
    
    // Determine severity level
    let severityLevel = 'LOW';
    let severityColor = '#4CAF50'; // Green
    
    if (negativeScore > 60 || sentimentDensity > 15) {
        severityLevel = 'HIGH';
        severityColor = '#F44336'; // Red
    } else if (negativeScore > 30 || sentimentDensity > 8) {
        severityLevel = 'MODERATE';
        severityColor = '#FF9800'; // Orange
    }
    
    return {
        categoryResults,
        sortedCategories,
        dominantEmotion,
        totalScore: totalNegativeScore,
        totalMatches,
        detectedWords: detectedWords.sort((a, b) => b.score - a.score),
        processingTime,
        algorithm,
        wordCount,
        sentimentDensity: sentimentDensity.toFixed(2),
        severityLevel,
        severityColor,
        concernScore: Math.round(concernScore),
        positiveScore,
        negativeScore,
        neutralScore
    };
}

// ============================================================
// EVENT HANDLERS
// ============================================================

// Algorithm Button Handler
algoButtons.forEach(btn => {
    btn.addEventListener('click', function() {
        algoButtons.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        selectedAlgorithm = this.dataset.algo;
    });
});

// Analyze Button Handler
analyzeBtn.addEventListener('click', performSentimentAnalysis);

async function performSentimentAnalysis() {
    const text = sentimentText.value.trim();
    
    if (!text) {
        showSentimentError('Please enter some text to analyze');
        return;
    }
    
    // Ensure data is loaded
    if (!SENTIMENT_DATA) {
        await loadSentimentData();
    }
    
    // Show loading
    sentimentLoading.style.display = 'block';
    sentimentResults.style.display = 'none';
    analyzeBtn.disabled = true;
    
    // Small delay to allow UI to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
        // Perform analysis
        const analysis = analyzeSentiment(text, selectedAlgorithm);
        
        // Display results
        displaySentimentResults(analysis);
        
        // Highlight detected words in the text input
        highlightDetectedWords(text, analysis);
    } catch (error) {
        showSentimentError('Error analyzing sentiment: ' + error.message);
    } finally {
        sentimentLoading.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

// ============================================================
// DISPLAY RESULTS
// ============================================================

function displaySentimentResults(analysis) {
    sentimentResults.style.display = 'block';
    
    // Format category name for display
    const formatCategory = (cat) => cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    // Update scores with proper values
    document.getElementById('positiveScore').textContent = analysis.positiveScore;
    document.getElementById('negativeScore').textContent = analysis.negativeScore;
    document.getElementById('neutralScore').textContent = analysis.neutralScore;
    
    // Update overall sentiment badge
    const overallBadge = document.getElementById('overallSentiment');
    if (analysis.dominantEmotion === 'neutral') {
        overallBadge.textContent = 'NEUTRAL';
        overallBadge.style.background = 'linear-gradient(135deg, #9E9E9E 0%, #BDBDBD 100%)';
    } else {
        overallBadge.textContent = formatCategory(analysis.dominantEmotion);
        overallBadge.style.background = getCategoryGradient(analysis.dominantEmotion);
    }
    
    // Build keywords list with suggestions
    const keywordsList = document.getElementById('keywordsList');
    if (analysis.detectedWords.length > 0) {
        keywordsList.innerHTML = analysis.detectedWords
            .slice(0, 15)
            .map(item => `
                <div class="keyword-tag-wrapper" title="Category: ${formatCategory(item.category)}&#10;Weight: ${item.weight}&#10;Occurrences: ${item.count}&#10;Suggestion: ${item.suggestion}">
                    <span class="keyword-tag" style="background: ${getCategoryGradient(item.category)}">
                        ${escapeHtml(item.word)} 
                        <span class="keyword-count">(${item.count}×${item.weight}=${item.score})</span>
                    </span>
                </div>
            `).join('');
    } else {
        keywordsList.innerHTML = '<p style="color: var(--accent-gold);">No concerning keywords detected ✓</p>';
    }
    
    // Update performance metrics
    document.getElementById('processingTime').textContent = analysis.processingTime + 'ms';
    document.getElementById('algorithmUsed').textContent = analysis.algorithm.toUpperCase();
    document.getElementById('totalWords').textContent = analysis.wordCount;
    
    // Add detailed category breakdown after the keywords
    addCategoryBreakdown(analysis);
    
    // Scroll to results
    sentimentResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Add detailed category breakdown section
 */
function addCategoryBreakdown(analysis) {
    // Check if breakdown section already exists
    let breakdownSection = document.getElementById('categoryBreakdown');
    if (!breakdownSection) {
        breakdownSection = document.createElement('div');
        breakdownSection.id = 'categoryBreakdown';
        breakdownSection.className = 'category-breakdown';
        sentimentResults.appendChild(breakdownSection);
    }
    
    if (analysis.sortedCategories.length === 0) {
        breakdownSection.innerHTML = `
            <div class="breakdown-header">
                <h4><i class="fas fa-chart-pie"></i> Emotional Analysis</h4>
            </div>
            <div class="no-emotions">
                <i class="fas fa-smile" style="font-size: 2rem; color: #4CAF50;"></i>
                <p>No concerning emotional patterns detected in your text.</p>
            </div>
        `;
        return;
    }
    
    const formatCategory = (cat) => cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    
    breakdownSection.innerHTML = `
        <div class="breakdown-header">
            <h4><i class="fas fa-chart-pie"></i> Emotional Category Breakdown</h4>
            <div class="severity-badge" style="background: ${analysis.severityColor}">
                ${analysis.severityLevel} CONCERN
            </div>
        </div>
        <div class="category-bars">
            ${analysis.sortedCategories.slice(0, 6).map(([category, data]) => {
                const maxScore = analysis.totalScore;
                const percentage = maxScore > 0 ? (data.totalWeight / maxScore) * 100 : 0;
                return `
                    <div class="category-bar-item">
                        <div class="category-bar-label">
                            <span class="category-icon">${getCategoryIcon(category)}</span>
                            <span class="category-name">${formatCategory(category)}</span>
                            <span class="category-score">${data.totalWeight} pts (${percentage.toFixed(1)}%)</span>
                        </div>
                        <div class="category-bar-track">
                            <div class="category-bar-fill" style="width: ${percentage}%; background: ${getCategoryGradient(category)}"></div>
                        </div>
                        <div class="category-words">
                            ${data.matches.slice(0, 3).map(m => 
                                `<span class="mini-tag" title="Count: ${m.count}x | Weight: ${m.weight} | Suggestion: ${m.suggestion}">${escapeHtml(m.word)}</span>`
                            ).join('')}
                            ${data.matches.length > 3 ? `<span class="mini-tag more">+${data.matches.length - 3} more</span>` : ''}
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="analysis-summary">
            <div class="summary-stat">
                <span class="summary-label">Total Matches</span>
                <span class="summary-value">${analysis.totalMatches}</span>
            </div>
            <div class="summary-stat">
                <span class="summary-label">Weighted Score</span>
                <span class="summary-value">${analysis.totalScore}</span>
            </div>
            <div class="summary-stat">
                <span class="summary-label">Sentiment Density</span>
                <span class="summary-value">${analysis.sentimentDensity}%</span>
            </div>
        </div>
    `;
    
    // Add styles for the breakdown
    addBreakdownStyles();
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function getCategoryGradient(category) {
    const gradients = {
        anger: 'linear-gradient(135deg, #D32F2F 0%, #F44336 100%)',
        sadness: 'linear-gradient(135deg, #1976D2 0%, #42A5F5 100%)',
        stress: 'linear-gradient(135deg, #E64A19 0%, #FF7043 100%)',
        anxiety: 'linear-gradient(135deg, #7B1FA2 0%, #AB47BC 100%)',
        loneliness: 'linear-gradient(135deg, #455A64 0%, #78909C 100%)',
        cyberbullying: 'linear-gradient(135deg, #C62828 0%, #EF5350 100%)',
        trauma: 'linear-gradient(135deg, #4A148C 0%, #7C43BD 100%)',
        self_harm: 'linear-gradient(135deg, #B71C1C 0%, #E53935 100%)',
        eating_disorders: 'linear-gradient(135deg, #00695C 0%, #26A69A 100%)',
        fear: 'linear-gradient(135deg, #37474F 0%, #607D8B 100%)',
        grief: 'linear-gradient(135deg, #303F9F 0%, #5C6BC0 100%)',
        low_self_esteem: 'linear-gradient(135deg, #5D4037 0%, #8D6E63 100%)',
        addiction: 'linear-gradient(135deg, #880E4F 0%, #C2185B 100%)',
        betrayal: 'linear-gradient(135deg, #BF360C 0%, #FF5722 100%)',
        workplace_toxicity: 'linear-gradient(135deg, #33691E 0%, #7CB342 100%)'
    };
    return gradients[category] || 'linear-gradient(135deg, #757575 0%, #9E9E9E 100%)';
}

function getCategoryIcon(category) {
    const icons = {
        anger: '😠',
        sadness: '😢',
        stress: '😰',
        anxiety: '😟',
        loneliness: '😔',
        cyberbullying: '🚫',
        trauma: '💔',
        self_harm: '⚠️',
        eating_disorders: '🍽️',
        fear: '😨',
        grief: '🕯️',
        low_self_esteem: '😞',
        addiction: '🔗',
        betrayal: '🗡️',
        workplace_toxicity: '💼'
    };
    return icons[category] || '📊';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showSentimentError(message) {
    sentimentResults.style.display = 'block';
    sentimentResults.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 2rem;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #F44336; margin-bottom: 1rem;"></i>
            <p style="color: var(--text-cream); font-size: 1.2rem;">${escapeHtml(message)}</p>
        </div>
    `;
    
    setTimeout(() => {
        sentimentResults.style.display = 'none';
    }, 5000);
}

function addBreakdownStyles() {
    if (!document.getElementById('breakdown-styles')) {
        const style = document.createElement('style');
        style.id = 'breakdown-styles';
        style.textContent = `
            .category-breakdown {
                margin-top: 2rem;
                padding: 1.5rem;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 15px;
                border: 1px solid rgba(219, 101, 33, 0.3);
            }
            .breakdown-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
            }
            .breakdown-header h4 {
                color: var(--accent-gold);
                margin: 0;
                font-size: 1.2rem;
            }
            .breakdown-header i {
                margin-right: 0.5rem;
            }
            .severity-badge {
                padding: 0.5rem 1rem;
                border-radius: 20px;
                color: white;
                font-weight: 700;
                font-size: 0.85rem;
                text-transform: uppercase;
            }
            .category-bars {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            .category-bar-item {
                background: rgba(255, 255, 255, 0.05);
                padding: 1rem;
                border-radius: 10px;
            }
            .category-bar-label {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.5rem;
            }
            .category-icon {
                font-size: 1.2rem;
            }
            .category-name {
                color: var(--text-cream);
                font-weight: 600;
                flex: 1;
            }
            .category-score {
                color: var(--accent-gold);
                font-weight: 700;
            }
            .category-bar-track {
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }
            .category-bar-fill {
                height: 100%;
                border-radius: 4px;
                transition: width 0.5s ease;
            }
            .category-words {
                display: flex;
                flex-wrap: wrap;
                gap: 0.3rem;
            }
            .mini-tag {
                background: rgba(255, 255, 255, 0.1);
                color: var(--text-cream);
                padding: 0.2rem 0.5rem;
                border-radius: 4px;
                font-size: 0.75rem;
                cursor: help;
            }
            .mini-tag.more {
                background: rgba(219, 101, 33, 0.3);
                color: var(--accent-gold);
            }
            .analysis-summary {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                margin-top: 1.5rem;
                padding-top: 1.5rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            .summary-stat {
                text-align: center;
            }
            .summary-label {
                display: block;
                color: var(--accent-gold);
                font-size: 0.75rem;
                text-transform: uppercase;
                margin-bottom: 0.3rem;
            }
            .summary-value {
                color: var(--text-cream);
                font-size: 1.5rem;
                font-weight: 700;
            }
            .no-emotions {
                text-align: center;
                padding: 2rem;
                color: var(--text-cream);
            }
            .no-emotions p {
                margin-top: 1rem;
                color: var(--accent-gold);
            }
            .keyword-tag-wrapper {
                display: inline-block;
                margin: 0.25rem;
            }
            .keyword-tag {
                display: inline-flex;
                align-items: center;
                gap: 0.3rem;
                padding: 0.4rem 0.8rem;
                border-radius: 20px;
                color: white;
                font-weight: 500;
                font-size: 0.9rem;
                cursor: help;
            }
            .keyword-count {
                opacity: 0.8;
                font-size: 0.75rem;
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================
// WORD HIGHLIGHTING
// ============================================================

/**
 * Highlight detected sentiment words in the text input
 */
function highlightDetectedWords(text, analysis) {
    if (!highlightOverlay) {
        console.warn('Highlight overlay element not found');
        return;
    }
    
    // Clear previous highlights
    highlightOverlay.innerHTML = '';
    
    if (analysis.detectedWords.length === 0) {
        highlightOverlay.style.display = 'none';
        if (highlightLegend) highlightLegend.style.display = 'none';
        return;
    }
    
    highlightOverlay.style.display = 'block';
    
    // Create a map of positions to highlight
    const highlightMap = new Map();
    
    // Collect all word positions
    analysis.detectedWords.forEach(wordInfo => {
        const category = wordInfo.category;
        const word = wordInfo.word.toLowerCase();
        const lowerText = text.toLowerCase();
        
        // Find all positions of this word
        const matches = findMatches(lowerText, word, analysis.algorithm);
        
        matches.forEach(pos => {
            highlightMap.set(pos, {
                length: word.length,
                category: category,
                word: wordInfo.word
            });
        });
    });
    
    // Sort positions for sequential highlighting
    const sortedPositions = Array.from(highlightMap.keys()).sort((a, b) => a - b);
    
    // Build highlighted HTML
    let highlightedText = '';
    let lastPos = 0;
    
    sortedPositions.forEach(pos => {
        const info = highlightMap.get(pos);
        
        // Add text before highlight
        highlightedText += escapeHtml(text.substring(lastPos, pos));
        
        // Add highlighted word
        const word = text.substring(pos, pos + info.length);
        highlightedText += `<span class="sentiment-highlight ${getCategoryColorClass(info.category)}" title="${formatCategoryName(info.category)}: ${info.word}">${escapeHtml(word)}</span>`;
        
        lastPos = pos + info.length;
    });
    
    // Add remaining text
    highlightedText += escapeHtml(text.substring(lastPos));
    
    highlightOverlay.innerHTML = highlightedText;
    
    // Update legend
    updateHighlightLegend(analysis);
    
    // Add highlight styles if not already added
    addHighlightStyles();
    
    // Sync scroll position
    syncScrollPosition();
}

/**
 * Update the highlight legend
 */
function updateHighlightLegend(analysis) {
    if (!highlightLegend) return;
    
    const uniqueCategories = [...new Set(analysis.detectedWords.map(w => w.category))];
    
    if (uniqueCategories.length === 0) {
        highlightLegend.style.display = 'none';
        return;
    }
    
    highlightLegend.style.display = 'flex';
    highlightLegend.innerHTML = `
        <span class="legend-title">Detected:</span>
        ${uniqueCategories.slice(0, 5).map(category => 
            `<span class="legend-item ${category}" title="${formatCategoryName(category)}">
                ${getCategoryIcon(category)} ${formatCategoryName(category)}
            </span>`
        ).join('')}
        ${uniqueCategories.length > 5 ? `<span class="legend-item other">+${uniqueCategories.length - 5} more</span>` : ''}
    `;
}

/**
 * Get CSS class for category color
 */
function getCategoryColorClass(category) {
    const categoryClasses = {
        anger: 'highlight-anger',
        sadness: 'highlight-sadness',
        stress: 'highlight-stress',
        anxiety: 'highlight-anxiety',
        loneliness: 'highlight-loneliness',
        cyberbullying: 'highlight-cyberbullying',
        trauma: 'highlight-trauma',
        self_harm: 'highlight-selfharm',
        eating_disorders: 'highlight-eating',
        fear: 'highlight-fear',
        grief: 'highlight-grief',
        low_self_esteem: 'highlight-selfesteem',
        addiction: 'highlight-addiction',
        betrayal: 'highlight-betrayal',
        workplace_toxicity: 'highlight-workplace'
    };
    return categoryClasses[category] || 'highlight-other';
}

/**
 * Format category name for display
 */
function formatCategoryName(category) {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Sync scroll position between textarea and overlay
 */
function syncScrollPosition() {
    if (sentimentText && highlightOverlay) {
        sentimentText.addEventListener('scroll', function() {
            highlightOverlay.scrollTop = this.scrollTop;
            highlightOverlay.scrollLeft = this.scrollLeft;
        });
    }
}

/**
 * Add highlight-related styles
 */
function addHighlightStyles() {
    if (!document.getElementById('highlight-styles')) {
        const style = document.createElement('style');
        style.id = 'highlight-styles';
        style.textContent = `
            .text-highlight-container {
                position: relative;
                width: 100%;
            }
            
            .highlight-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                padding: 1rem 1.2rem;
                font-family: 'Work Sans', sans-serif;
                font-size: 1rem;
                line-height: 1.6;
                color: transparent;
                background: transparent;
                pointer-events: none;
                white-space: pre-wrap;
                word-wrap: break-word;
                overflow: hidden;
                border: 2px solid transparent;
                border-radius: 10px;
            }
            
            .custom-textarea {
                background: rgba(0, 0, 0, 0.3) !important;
                position: relative;
                z-index: 1;
            }
            
            .sentiment-highlight {
                padding: 2px 4px;
                border-radius: 4px;
                font-weight: 600;
                color: transparent;
                position: relative;
            }
            
            /* Category-specific highlight colors */
            .highlight-anger {
                background: linear-gradient(135deg, rgba(211, 47, 47, 0.6) 0%, rgba(244, 67, 54, 0.6) 100%);
                box-shadow: 0 0 8px rgba(244, 67, 54, 0.5);
            }
            
            .highlight-sadness {
                background: linear-gradient(135deg, rgba(25, 118, 210, 0.6) 0%, rgba(66, 165, 245, 0.6) 100%);
                box-shadow: 0 0 8px rgba(66, 165, 245, 0.5);
            }
            
            .highlight-stress {
                background: linear-gradient(135deg, rgba(230, 74, 25, 0.6) 0%, rgba(255, 112, 67, 0.6) 100%);
                box-shadow: 0 0 8px rgba(255, 112, 67, 0.5);
            }
            
            .highlight-anxiety {
                background: linear-gradient(135deg, rgba(123, 31, 162, 0.6) 0%, rgba(171, 71, 188, 0.6) 100%);
                box-shadow: 0 0 8px rgba(171, 71, 188, 0.5);
            }
            
            .highlight-loneliness {
                background: linear-gradient(135deg, rgba(69, 90, 100, 0.6) 0%, rgba(120, 144, 156, 0.6) 100%);
                box-shadow: 0 0 8px rgba(120, 144, 156, 0.5);
            }
            
            .highlight-cyberbullying {
                background: linear-gradient(135deg, rgba(198, 40, 40, 0.6) 0%, rgba(239, 83, 80, 0.6) 100%);
                box-shadow: 0 0 8px rgba(239, 83, 80, 0.5);
            }
            
            .highlight-trauma {
                background: linear-gradient(135deg, rgba(74, 20, 140, 0.6) 0%, rgba(124, 67, 189, 0.6) 100%);
                box-shadow: 0 0 8px rgba(124, 67, 189, 0.5);
            }
            
            .highlight-selfharm {
                background: linear-gradient(135deg, rgba(183, 28, 28, 0.6) 0%, rgba(229, 57, 53, 0.6) 100%);
                box-shadow: 0 0 8px rgba(229, 57, 53, 0.5);
            }
            
            .highlight-eating {
                background: linear-gradient(135deg, rgba(0, 105, 92, 0.6) 0%, rgba(38, 166, 154, 0.6) 100%);
                box-shadow: 0 0 8px rgba(38, 166, 154, 0.5);
            }
            
            .highlight-fear {
                background: linear-gradient(135deg, rgba(55, 71, 79, 0.6) 0%, rgba(96, 125, 139, 0.6) 100%);
                box-shadow: 0 0 8px rgba(96, 125, 139, 0.5);
            }
            
            .highlight-grief {
                background: linear-gradient(135deg, rgba(48, 63, 159, 0.6) 0%, rgba(92, 107, 192, 0.6) 100%);
                box-shadow: 0 0 8px rgba(92, 107, 192, 0.5);
            }
            
            .highlight-selfesteem {
                background: linear-gradient(135deg, rgba(93, 64, 55, 0.6) 0%, rgba(141, 110, 99, 0.6) 100%);
                box-shadow: 0 0 8px rgba(141, 110, 99, 0.5);
            }
            
            .highlight-addiction {
                background: linear-gradient(135deg, rgba(136, 14, 79, 0.6) 0%, rgba(194, 24, 91, 0.6) 100%);
                box-shadow: 0 0 8px rgba(194, 24, 91, 0.5);
            }
            
            .highlight-betrayal {
                background: linear-gradient(135deg, rgba(191, 54, 12, 0.6) 0%, rgba(255, 87, 34, 0.6) 100%);
                box-shadow: 0 0 8px rgba(255, 87, 34, 0.5);
            }
            
            .highlight-workplace {
                background: linear-gradient(135deg, rgba(51, 105, 30, 0.6) 0%, rgba(124, 179, 66, 0.6) 100%);
                box-shadow: 0 0 8px rgba(124, 179, 66, 0.5);
            }
            
            .highlight-other {
                background: linear-gradient(135deg, rgba(117, 117, 117, 0.6) 0%, rgba(158, 158, 158, 0.6) 100%);
                box-shadow: 0 0 8px rgba(158, 158, 158, 0.5);
            }
            
            /* Legend styles */
            .highlight-legend {
                display: flex;
                flex-wrap: wrap;
                gap: 0.5rem;
                margin-top: 0.75rem;
                padding: 0.75rem 1rem;
                background: rgba(0, 0, 0, 0.2);
                border-radius: 8px;
                align-items: center;
            }
            
            .legend-title {
                color: var(--accent-gold);
                font-weight: 600;
                font-size: 0.85rem;
                margin-right: 0.5rem;
            }
            
            .legend-item {
                padding: 0.2rem 0.6rem;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 500;
                color: white;
            }
            
            .legend-item.anger {
                background: linear-gradient(135deg, rgba(211, 47, 47, 0.8) 0%, rgba(244, 67, 54, 0.8) 100%);
            }
            
            .legend-item.sadness {
                background: linear-gradient(135deg, rgba(25, 118, 210, 0.8) 0%, rgba(66, 165, 245, 0.8) 100%);
            }
            
            .legend-item.anxiety {
                background: linear-gradient(135deg, rgba(123, 31, 162, 0.8) 0%, rgba(171, 71, 188, 0.8) 100%);
            }
            
            .legend-item.stress {
                background: linear-gradient(135deg, rgba(230, 74, 25, 0.8) 0%, rgba(255, 112, 67, 0.8) 100%);
            }
            
            .legend-item.grief {
                background: linear-gradient(135deg, rgba(48, 63, 159, 0.8) 0%, rgba(92, 107, 192, 0.8) 100%);
            }
            
            .legend-item.other {
                background: linear-gradient(135deg, rgba(117, 117, 117, 0.8) 0%, rgba(158, 158, 158, 0.8) 100%);
            }
        `;
        document.head.appendChild(style);
    }
}

// ============================================================
// INITIALIZATION
// ============================================================

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Sentiment Analysis Page Initialized');
    console.log('Loading sentiment data...');
    
    // Pre-load sentiment data
    await loadSentimentData();
    
    console.log('Selected Algorithm:', selectedAlgorithm);
    console.log('Available categories:', SENTIMENT_DATA ? Object.keys(SENTIMENT_DATA) : 'None');
});