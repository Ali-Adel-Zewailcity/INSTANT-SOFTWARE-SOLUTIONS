// DOM Elements
const sentimentText = document.getElementById('sentimentText');
const analyzeBtn = document.getElementById('analyzeBtn');
const sentimentResults = document.getElementById('sentimentResults');
const sentimentLoading = document.getElementById('sentimentLoading');
const algoButtons = document.querySelectorAll('.algo-btn');

// Sentiment Keywords
const SENTIMENT_KEYWORDS = {
    positive: [
        'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
        'happy', 'love', 'best', 'perfect', 'beautiful', 'brilliant', 'outstanding',
        'superb', 'magnificent', 'delightful', 'pleasant', 'enjoy', 'enjoyed',
        'impressive', 'exceptional', 'fabulous', 'marvelous', 'terrific'
    ],
    negative: [
        'bad', 'terrible', 'awful', 'horrible', 'worst', 'poor', 'disappointing',
        'hate', 'dislike', 'ugly', 'disgusting', 'annoying', 'frustrating',
        'useless', 'pathetic', 'dreadful', 'atrocious', 'abysmal', 'inferior',
        'unpleasant', 'mediocre', 'regret', 'waste', 'failure', 'boring'
    ],
    neutral: [
        'okay', 'fine', 'average', 'normal', 'standard', 'typical', 'ordinary',
        'adequate', 'acceptable', 'moderate', 'fair', 'reasonable'
    ]
};

// State
let selectedAlgorithm = 'naive';

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
    
    // Show loading
    sentimentLoading.style.display = 'block';
    sentimentResults.style.display = 'none';
    analyzeBtn.disabled = true;
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
        // Perform analysis
        const analysis = analyzeSentiment(text, selectedAlgorithm);
        
        // Display results
        displaySentimentResults(analysis);
    } catch (error) {
        showSentimentError('Error analyzing sentiment: ' + error.message);
    } finally {
        sentimentLoading.style.display = 'none';
        analyzeBtn.disabled = false;
    }
}

// Sentiment Analysis Function
function analyzeSentiment(text, algorithm) {
    const startTime = performance.now();
    
    // Convert text to lowercase for matching
    const lowerText = text.toLowerCase();
    
    // Results object
    const results = {
        positive: [],
        negative: [],
        neutral: []
    };
    
    // Search for keywords based on selected algorithm
    Object.keys(SENTIMENT_KEYWORDS).forEach(sentiment => {
        SENTIMENT_KEYWORDS[sentiment].forEach(keyword => {
            const matches = findMatches(lowerText, keyword, algorithm);
            if (matches.length > 0) {
                results[sentiment].push({
                    keyword: keyword,
                    count: matches.length,
                    positions: matches
                });
            }
        });
    });
    
    const endTime = performance.now();
    const processingTime = (endTime - startTime).toFixed(2);
    
    // Calculate scores
    const positiveScore = results.positive.reduce((sum, item) => sum + item.count, 0);
    const negativeScore = results.negative.reduce((sum, item) => sum + item.count, 0);
    const neutralScore = results.neutral.reduce((sum, item) => sum + item.count, 0);
    
    // Determine overall sentiment
    let overallSentiment = 'NEUTRAL';
    if (positiveScore > negativeScore && positiveScore > neutralScore) {
        overallSentiment = 'POSITIVE';
    } else if (negativeScore > positiveScore && negativeScore > neutralScore) {
        overallSentiment = 'NEGATIVE';
    }
    
    // Count words
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
    
    return {
        positive: results.positive,
        negative: results.negative,
        neutral: results.neutral,
        positiveScore,
        negativeScore,
        neutralScore,
        overallSentiment,
        processingTime,
        algorithm,
        wordCount
    };
}

// String Matching Algorithms
function findMatches(text, pattern, algorithm) {
    switch (algorithm) {
        case 'naive':
            return naiveSearch(text, pattern);
        case 'horspool':
            return horspoolSearch(text, pattern);
        case 'kmp':
            return kmpSearch(text, pattern);
        case 'hashing':
            return hashingSearch(text, pattern);
        default:
            return naiveSearch(text, pattern);
    }
}

// Naive Algorithm
function naiveSearch(text, pattern) {
    const matches = [];
    const n = text.length;
    const m = pattern.length;
    
    for (let i = 0; i <= n - m; i++) {
        let j;
        for (j = 0; j < m; j++) {
            if (text[i + j] !== pattern[j]) {
                break;
            }
        }
        if (j === m) {
            matches.push(i);
        }
    }
    
    return matches;
}

// Horspool Algorithm
function horspoolSearch(text, pattern) {
    const matches = [];
    const n = text.length;
    const m = pattern.length;
    
    // Build bad character table
    const badChar = {};
    for (let i = 0; i < m - 1; i++) {
        badChar[pattern[i]] = m - 1 - i;
    }
    
    let i = 0;
    while (i <= n - m) {
        let j = m - 1;
        while (j >= 0 && pattern[j] === text[i + j]) {
            j--;
        }
        if (j < 0) {
            matches.push(i);
            i++;
        } else {
            const shift = badChar[text[i + m - 1]] || m;
            i += shift;
        }
    }
    
    return matches;
}

// KMP Algorithm
function kmpSearch(text, pattern) {
    const matches = [];
    const n = text.length;
    const m = pattern.length;
    
    // Build failure function
    const failure = [0];
    let j = 0;
    
    for (let i = 1; i < m; i++) {
        while (j > 0 && pattern[i] !== pattern[j]) {
            j = failure[j - 1];
        }
        if (pattern[i] === pattern[j]) {
            j++;
        }
        failure[i] = j;
    }
    
    // Search
    j = 0;
    for (let i = 0; i < n; i++) {
        while (j > 0 && text[i] !== pattern[j]) {
            j = failure[j - 1];
        }
        if (text[i] === pattern[j]) {
            j++;
        }
        if (j === m) {
            matches.push(i - m + 1);
            j = failure[j - 1];
        }
    }
    
    return matches;
}

// Hashing Algorithm (Rabin-Karp)
function hashingSearch(text, pattern) {
    const matches = [];
    const n = text.length;
    const m = pattern.length;
    const prime = 101;
    const base = 256;
    
    if (m > n) return matches;
    
    // Calculate hash for pattern and first window
    let patternHash = 0;
    let textHash = 0;
    let h = 1;
    
    // h = base^(m-1) % prime
    for (let i = 0; i < m - 1; i++) {
        h = (h * base) % prime;
    }
    
    // Calculate initial hashes
    for (let i = 0; i < m; i++) {
        patternHash = (base * patternHash + pattern.charCodeAt(i)) % prime;
        textHash = (base * textHash + text.charCodeAt(i)) % prime;
    }
    
    // Slide the pattern
    for (let i = 0; i <= n - m; i++) {
        if (patternHash === textHash) {
            // Verify match
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
        
        // Calculate hash for next window
        if (i < n - m) {
            textHash = (base * (textHash - text.charCodeAt(i) * h) + text.charCodeAt(i + m)) % prime;
            if (textHash < 0) {
                textHash += prime;
            }
        }
    }
    
    return matches;
}

// Display Sentiment Results
function displaySentimentResults(analysis) {
    sentimentResults.style.display = 'block';
    
    // Update scores
    document.getElementById('positiveScore').textContent = analysis.positiveScore;
    document.getElementById('negativeScore').textContent = analysis.negativeScore;
    document.getElementById('neutralScore').textContent = analysis.neutralScore;
    
    // Update overall sentiment
    const overallBadge = document.getElementById('overallSentiment');
    overallBadge.textContent = analysis.overallSentiment;
    overallBadge.style.background = getSentimentColor(analysis.overallSentiment);
    
    // Update keywords list
    const keywordsList = document.getElementById('keywordsList');
    const allKeywords = [
        ...analysis.positive.map(k => ({...k, type: 'positive'})),
        ...analysis.negative.map(k => ({...k, type: 'negative'})),
        ...analysis.neutral.map(k => ({...k, type: 'neutral'}))
    ];
    
    if (allKeywords.length > 0) {
        keywordsList.innerHTML = allKeywords
            .sort((a, b) => b.count - a.count)
            .slice(0, 15)
            .map(item => `
                <span class="keyword-tag" style="background: ${getKeywordColor(item.type)}">
                    ${item.keyword} (${item.count})
                </span>
            `).join('');
    } else {
        keywordsList.innerHTML = '<p style="color: var(--accent-gold);">No sentiment keywords detected</p>';
    }
    
    // Update performance metrics
    document.getElementById('processingTime').textContent = analysis.processingTime + 'ms';
    document.getElementById('algorithmUsed').textContent = analysis.algorithm.toUpperCase();
    document.getElementById('totalWords').textContent = analysis.wordCount;
    
    // Scroll to results
    sentimentResults.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Helper Functions
function getSentimentColor(sentiment) {
    switch (sentiment) {
        case 'POSITIVE':
            return 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)';
        case 'NEGATIVE':
            return 'linear-gradient(135deg, #F44336 0%, #E57373 100%)';
        default:
            return 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)';
    }
}

function getKeywordColor(type) {
    switch (type) {
        case 'positive':
            return 'linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%)';
        case 'negative':
            return 'linear-gradient(135deg, #F44336 0%, #E57373 100%)';
        default:
            return 'linear-gradient(135deg, #FFC107 0%, #FFD54F 100%)';
    }
}

function showSentimentError(message) {
    sentimentResults.style.display = 'block';
    sentimentResults.innerHTML = `
        <div class="error-message" style="text-align: center; padding: 2rem;">
            <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #F44336; margin-bottom: 1rem;"></i>
            <p style="color: var(--text-cream); font-size: 1.2rem;">${message}</p>
        </div>
    `;
    
    setTimeout(() => {
        location.reload();
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    console.log('Sentiment Analysis Page Initialized');
    console.log('Selected Algorithm:', selectedAlgorithm);
});