// Global Variables with IE11 compatibility
var mainVideo = null; // Legacy support
var currentImages = []; // Array of {id, file, url}
var aiScores = null;
var scores = {
    consistency: {
        semantic_consistency: 0,
        factual_consistency: 0,
        spatial_temporal_consistency: 0,
        total: 0
    },
    aesthetic: {
        expressiveness: 0,
        artistic_quality: 0,
        authenticity: 0,
        total: 0
    },
    physicality: {
        basic_properties: 0,
        dynamics_interactivity: 0,
        physical_reliability: 0,
        total: 0
    }
};

// Weight configuration - Consistent with eval.py
var weights = {
    consistency: 0.4,
    physicality: 0.4,
    aesthetic: 0.2
};

var subWeights = {
    consistency: {
        semantic_consistency: 0.33,
        factual_consistency: 0.33,
        spatial_temporal_consistency: 0.34
    },
    aesthetic: {
        expressiveness: 0.33,
        artistic_quality: 0.33,
        authenticity: 0.34
    },
    physicality: {
        basic_properties: 0.33,
        dynamics_interactivity: 0.33,
        physical_reliability: 0.34
    }
};

// DOM Elements (Initialized in initDOMElements)
var scoreInputs = {};
var scoreDisplays = {};
var totalScoreDisplay = null;
var breakdownDisplays = {};
var resetBtn, saveBtn, aiScoreBtn, clearAllBtn, updateAIComparisonBtn, generateAnalysisBtn;
var uploadSection, sequenceContainer, sequenceGrid, scoringSection, historySection, historyList;
var aiComparisonSection, analysisResults;

// Performance optimization variables with IE11 compatibility
var isInitialized = false;
var animationFrameId = null;
var resizeTimeout = null;

// Initialize with error handling
document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeApp();
    } catch (error) {
        console.error('Initialization error:', error);
        showErrorScreen();
    }
});

// Main initialization function with enhanced error handling
function initializeApp() {
    // Show loading screen
    var loadingScreen = document.getElementById('loadingScreen');
    
    // Initialize DOM elements first to ensure references exist
    initDOMElements();
    
    // Setup fallbacks
    setupFallbacks();
    
    // Check browser compatibility
    if (!checkBrowserCompatibility()) {
        return;
    }
    
    // Setup global error handling
    setupGlobalErrorHandling();
    
    // Initialize with timeout protection
    var initTimeout = setTimeout(function() {
        if (!isInitialized) {
            showErrorScreen('application', 'Application initialization timed out. Please refresh the page.');
        }
    }, 10000); // 10 second timeout
    
    // Initialize components with performance optimization and accessibility
    initializeEventListeners();
    loadHistory();
    addSmoothAnimations();
    setupKeyboardNavigation();
    setupResizeHandler();
    setupScrollOptimization();
    setupAriaLiveRegions();
    setupFocusManagement();
    
    // Add start assessment button event
    const startScoringBtn = document.querySelector('.criteria-actions .btn');
    if (startScoringBtn) {
        startScoringBtn.addEventListener('click', function() {
            document.getElementById('criteriaSection').style.display = 'none';
            scoringSection.style.display = 'block';
            historySection.style.display = 'block';
            scoringSection.scrollIntoView({ behavior: 'smooth' });
        });
    }
    
    // Mark as initialized and hide loading screen
    isInitialized = true;
    clearTimeout(initTimeout);
    
    // Hide loading screen with animation
    if (loadingScreen) {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
        }, 300);
    }
}

// Initialize DOM Elements securely
function initDOMElements() {
    // Main Sections
    uploadSection = document.getElementById('uploadSection');
    sequenceContainer = document.getElementById('sequenceContainer');
    sequenceGrid = document.getElementById('sequenceGrid');
    scoringSection = document.getElementById('scoringSection');
    historySection = document.getElementById('historySection');
    historyList = document.getElementById('historyList');
    
    // Buttons
    resetBtn = document.getElementById('resetBtn');
    saveBtn = document.getElementById('saveBtn');
    aiScoreBtn = document.getElementById('aiScoreBtn');
    clearAllBtn = document.getElementById('clearAllBtn');
    updateAIComparisonBtn = document.getElementById('updateAIComparisonBtn');
    generateAnalysisBtn = document.getElementById('generateAnalysisBtn');
    
    // AI Comparison Sections
    aiComparisonSection = document.getElementById('aiComparisonSection');
    analysisResults = document.getElementById('analysisResults');
    
    // Scoring Inputs
    scoreInputs = {
        semantic_consistency: document.getElementById('semantic_consistency'),
        factual_consistency: document.getElementById('factual_consistency'),
        spatial_temporal_consistency: document.getElementById('spatial_temporal_consistency'),
        
        expressiveness: document.getElementById('expressiveness'),
        artistic_quality: document.getElementById('artistic_quality'),
        authenticity: document.getElementById('authenticity'),
        
        basic_properties: document.getElementById('basic_properties'),
        dynamics_interactivity: document.getElementById('dynamics_interactivity'),
        physical_reliability: document.getElementById('physical_reliability')
    };
    
    // Scoring Displays
    scoreDisplays = {
        consistency: document.getElementById('consistencyScore'),
        aesthetic: document.getElementById('aestheticScore'),
        physicality: document.getElementById('physicalityScore'),
        
        semantic_consistency: document.getElementById('semantic_consistencyValue'),
        factual_consistency: document.getElementById('factual_consistencyValue'),
        spatial_temporal_consistency: document.getElementById('spatial_temporal_consistencyValue'),
        
        expressiveness: document.getElementById('expressivenessValue'),
        artistic_quality: document.getElementById('artistic_qualityValue'),
        authenticity: document.getElementById('authenticityValue'),
        
        basic_properties: document.getElementById('basic_propertiesValue'),
        dynamics_interactivity: document.getElementById('dynamics_interactivityValue'),
        physical_reliability: document.getElementById('physical_reliabilityValue')
    };
    
    totalScoreDisplay = document.getElementById('totalScore');
    breakdownDisplays = {
        consistency: document.getElementById('consistencyBreakdown'),
        aesthetic: document.getElementById('aestheticBreakdown'),
        physicality: document.getElementById('physicalityBreakdown')
    };
}

// Enhanced error handling with better user experience
function showErrorScreen(errorType, errorMessage) {
    var loadingScreen = document.getElementById('loadingScreen');
    var errorContainer = document.getElementById('errorContainer');
    
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (errorContainer) {
        errorContainer.style.display = 'flex';
        
        // Update error message based on type
        var errorTitle = errorContainer.querySelector('h3');
        var errorText = errorContainer.querySelector('p');
        
        if (errorType === 'network') {
            errorTitle.textContent = 'Network Connection Error';
            errorText.textContent = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else if (errorType === 'browser') {
            errorTitle.textContent = 'Browser Compatibility Issue';
            errorText.textContent = 'Your browser version is not supported. Please update to a modern browser for the best experience.';
        } else if (errorType === 'video') {
            errorTitle.textContent = 'Video Loading Error';
            errorText.textContent = 'Unable to load the video file. Please try refreshing the page or contact support.';
        } else {
            errorTitle.textContent = 'Application Error';
            errorText.textContent = errorMessage || 'An unexpected error occurred. Please refresh the page and try again.';
        }
    }
}

// Check browser compatibility
function checkBrowserCompatibility() {
    var isCompatible = true;
    var issues = [];
    
    // Check for required features
    if (!window.requestAnimationFrame) {
        isCompatible = false;
        issues.push('requestAnimationFrame not supported');
    }
    
    if (!document.querySelector) {
        isCompatible = false;
        issues.push('querySelector not supported');
    }
    
    if (!window.localStorage) {
        isCompatible = false;
        issues.push('localStorage not supported');
    }
    
    if (!document.addEventListener) {
        isCompatible = false;
        issues.push('addEventListener not supported');
    }
    
    // Check for canvas support
    var canvas = document.createElement('canvas');
    if (!canvas.getContext) {
        isCompatible = false;
        issues.push('Canvas not supported');
    }
    
    if (!isCompatible) {
        console.warn('Browser compatibility issues detected:', issues);
        showErrorScreen('browser', 'Your browser does not support all required features. Please update to a modern browser.');
        return false;
    }
    
    return true;
}

// Global error handler
function setupGlobalErrorHandling() {
    window.addEventListener('error', function(event) {
        console.error('Global error:', event.error);
        
        // Don't show error screen for minor errors
        if (event.error && event.error.name === 'TypeError' && event.error.message.includes('Cannot read property')) {
            return;
        }
        
        showErrorScreen('application', event.error ? event.error.message : 'An unexpected error occurred');
    });
    
    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        showErrorScreen('application', 'An unexpected error occurred while processing your request');
    });
}

// Fallback for missing features
function setupFallbacks() {
    // Fallback for requestAnimationFrame
    if (!window.requestAnimationFrame) {
        window.requestAnimationFrame = function(callback) {
            return setTimeout(callback, 16);
        };
    }
    
    // Fallback for localStorage
    if (!window.localStorage) {
        window.localStorage = {
            getItem: function(key) { return null; },
            setItem: function(key, value) { /* no-op */ },
            removeItem: function(key) { /* no-op */ }
        };
    }
    
    // Fallback for Array.from
    if (!Array.from) {
        Array.from = function(arrayLike) {
            var result = [];
            for (var i = 0; i < arrayLike.length; i++) {
                result.push(arrayLike[i]);
            }
            return result;
        };
    }
}

// Event Listeners Initialization
function initializeEventListeners() {
    // Image Upload
    const dropZone = document.getElementById('dropZone');
    const imageInput = document.getElementById('imageInput');

    if (dropZone) {
        dropZone.addEventListener('click', () => imageInput.click());
        
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('dragover');
        });

        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('dragover');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('dragover');
            handleFileUpload(e.dataTransfer.files);
        });
    }

    if (imageInput) {
        imageInput.addEventListener('change', (e) => {
            handleFileUpload(e.target.files);
        });
    }

    // Scoring Sliders
    Object.keys(scoreInputs).forEach(key => {
        const input = scoreInputs[key];
        if (input) {
            // Remove existing listeners if any to prevent duplicates (though initializeEventListeners is called once)
            // Using a clean closure for event listener
            input.addEventListener('input', function(e) {
                var value = parseFloat(e.target.value);
                updateScore(key, value);
                addSliderFeedback(e.target);
            });
            
            // Initialize slider feedback immediately
            addSliderFeedback(input);
        } else {
            console.warn('Score input not found for key:', key);
        }
    });

    // Button Events
    if (resetBtn) resetBtn.addEventListener('click', resetScores);
    if (saveBtn) saveBtn.addEventListener('click', saveScores);
    if (aiScoreBtn) aiScoreBtn.addEventListener('click', showAIAnalysis);
    if (clearAllBtn) clearAllBtn.addEventListener('click', clearAllData);
    if (generateAnalysisBtn) generateAnalysisBtn.addEventListener('click', generateAnalysis);
}

// Handle File Upload
function handleFileUpload(files) {
    if (files.length === 0) return;

    // Validate file types and count
    if (currentImages.length + files.length > 4) {
        showNotification('You can only upload up to 4 images total.', 'error');
        return;
    }

    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    
    if (newFiles.length === 0) {
        showNotification('Please upload valid image files.', 'error');
        return;
    }

    // Read files
    newFiles.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            currentImages.push({
                id: Date.now() + Math.random(),
                file: file,
                url: e.target.result
            });
            renderSequence();
            
            if (currentImages.length === 4) {
                showNotification('4 images uploaded. You can now reorder them or start assessment.', 'success');
                document.getElementById('criteriaSection').style.display = 'block';
                document.getElementById('criteriaSection').scrollIntoView({ behavior: 'smooth' });
            }
        };
        reader.readAsDataURL(file);
    });
}

// Render Sequence Grid
function renderSequence() {
    if (currentImages.length > 0) {
        sequenceContainer.style.display = 'block';
        uploadSection.style.display = (currentImages.length < 4) ? 'block' : 'none';
    } else {
        sequenceContainer.style.display = 'none';
        uploadSection.style.display = 'block';
    }

    sequenceGrid.innerHTML = '';
    
    currentImages.forEach((img, index) => {
        const item = document.createElement('div');
        item.className = 'sequence-item';
        item.draggable = true;
        item.dataset.index = index;
        
        item.innerHTML = `
            <div class="sequence-number">${index + 1}</div>
            <img src="${img.url}" alt="Step ${index + 1}">
            <div class="sequence-controls">
                <button class="btn-icon" onclick="removeImage(${index})"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        // Drag events
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragend', handleDragEnd);
        
        sequenceGrid.appendChild(item);
    });
}

// Remove Image
function removeImage(index) {
    currentImages.splice(index, 1);
    renderSequence();
}

// Drag and Drop Reordering
let draggedItem = null;

function handleDragStart(e) {
    draggedItem = this;
    e.dataTransfer.effectAllowed = 'move';
    this.classList.add('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    return false;
}

function handleDrop(e) {
    if (e.stopPropagation) e.stopPropagation();
    if (draggedItem !== this) {
        const fromIndex = parseInt(draggedItem.dataset.index);
        const toIndex = parseInt(this.dataset.index);
        
        // Swap items
        const temp = currentImages[fromIndex];
        currentImages[fromIndex] = currentImages[toIndex];
        currentImages[toIndex] = temp;
        
        renderSequence();
    }
    return false;
}

function handleDragEnd() {
    this.classList.remove('dragging');
}

// Start Assessment
function startAssessment() {
    if (currentImages.length !== 4) {
        showNotification('Please upload exactly 4 images to start assessment.', 'error');
        return;
    }
    
    document.getElementById('criteriaSection').style.display = 'none';
    scoringSection.style.display = 'block';
    historySection.style.display = 'block';
    scoringSection.scrollIntoView({ behavior: 'smooth' });
    showNotification('Assessment started. Please rate strictly.', 'info');
}

// Setup keyboard navigation with accessibility improvements
function setupKeyboardNavigation() {
    document.addEventListener('keydown', function(e) {
        // Handle Tab navigation for better accessibility
        if (e.key === 'Tab') {
            // Ensure focus is visible
            document.body.classList.add('keyboard-navigation');
        }
        
        // Handle Escape key to close modals
        if (e.key === 'Escape') {
            var criteriaSection = document.getElementById('criteriaSection');
            if (criteriaSection && criteriaSection.style.display === 'block') {
                criteriaSection.style.display = 'none';
                e.preventDefault();
            }
        }
        
        // Handle Space key on buttons
        if (e.key === ' ' && e.target.tagName === 'BUTTON') {
            e.preventDefault();
            e.target.click();
        }
    });
    
    // Remove keyboard navigation class on mouse use
    document.addEventListener('mousedown', function() {
        document.body.classList.remove('keyboard-navigation');
    });
}

// Setup ARIA live regions for dynamic content
function setupAriaLiveRegions() {
    // Create live region for score updates
    var liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'score-live-region';
    document.body.appendChild(liveRegion);
}

// Announce score changes to screen readers
function announceScoreChange(metric, value) {
    var liveRegion = document.getElementById('score-live-region');
    if (liveRegion) {
        liveRegion.textContent = metric + ' score updated to ' + value.toFixed(1);
    }
}

// Setup focus management
function setupFocusManagement() {
    // Focus management for modals
    var focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    
    function trapFocus(element) {
        var focusableContent = element.querySelectorAll(focusableElements);
        var firstFocusableElement = focusableContent[0];
        var lastFocusableElement = focusableContent[focusableContent.length - 1];
        
        element.addEventListener('keydown', function(e) {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusableElement) {
                        lastFocusableElement.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusableElement) {
                        firstFocusableElement.focus();
                        e.preventDefault();
                    }
                }
            }
        });
    }
    
    // Apply focus trapping to modals
    var modals = document.querySelectorAll('.criteria-section, .ai-comparison-section');
    for (var i = 0; i < modals.length; i++) {
        trapFocus(modals[i]);
    }
}

// Setup resize handler with debouncing and performance optimization
function setupResizeHandler() {
    var resizeTimeout;
    var isResizing = false;
    
    window.addEventListener('resize', function() {
        if (resizeTimeout) {
            clearTimeout(resizeTimeout);
        }
        
        if (!isResizing) {
            isResizing = true;
            requestAnimationFrame(function() {
                // Redraw charts on resize with performance optimization
                if (aiScores && analysisResults.style.display !== 'none') {
                    var humanScores = [scores.consistency.total, scores.aesthetic.total, scores.physicality.total];
                    var aiScoresArray = [aiScores.consistency, aiScores.aesthetic, aiScores.physicality.total];
                    
                    // Only redraw visible charts
                    if (document.getElementById('comparisonChart')) {
                        generateComparisonChart();
                    }
                    if (document.getElementById('correlationChart')) {
                        generateCorrelationChart();
                    }
                    if (document.getElementById('agreementChart')) {
                        generateAgreementChart();
                    }
                }
                isResizing = false;
            });
        }
        
        resizeTimeout = setTimeout(function() {
            isResizing = false;
        }, 250);
    });
}

// Add Smooth Animations with performance optimization
function addSmoothAnimations() {
    // Add staggered animation to score cards with performance optimization
    var scoreCards = document.querySelectorAll('.score-card');
    for (var i = 0; i < scoreCards.length; i++) {
        scoreCards[i].style.animationDelay = (i * 0.1) + 's';
        scoreCards[i].style.animationFillMode = 'both';
    }
    
    // Optimize animations for better performance
    var animatedElements = document.querySelectorAll('.video-option, .score-card, .btn, .metric-card');
    for (var j = 0; j < animatedElements.length; j++) {
        animatedElements[j].style.willChange = 'transform';
    }
}

// Throttle function for performance optimization
function throttle(func, limit) {
    var inThrottle;
    return function() {
        var args = arguments;
        var context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(function() {
                inThrottle = false;
            }, limit);
        }
    };
}

// Debounce function for performance optimization
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this;
        var args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

// Optimize scroll events
function setupScrollOptimization() {
    var scrollTimeout;
    var isScrolling = false;
    
    window.addEventListener('scroll', throttle(function() {
        if (!isScrolling) {
            isScrolling = true;
            requestAnimationFrame(function() {
                // Handle scroll-based animations here
                isScrolling = false;
            });
        }
    }, 16)); // 60fps
}

// Update Score Display
function updateScoreDisplay(key, value) {
    var display = scoreDisplays[key];
    if (display) {
        // Check if it's an input or text element
        if (display.tagName === 'INPUT') {
            display.value = value;
        } else {
            display.textContent = value.toFixed(1);
        }
    } else {
        console.warn('Display element not found for key:', key);
    }
    
    // Update breakdown displays
    if (key === 'consistency' && breakdownDisplays.consistency) {
        breakdownDisplays.consistency.textContent = value.toFixed(1);
    } else if (key === 'aesthetic' && breakdownDisplays.aesthetic) {
        breakdownDisplays.aesthetic.textContent = value.toFixed(1);
    } else if (key === 'physicality' && breakdownDisplays.physicality) {
        breakdownDisplays.physicality.textContent = value.toFixed(1);
    }
}

// Add visual feedback to sliders
function addSliderFeedback(slider) {
    var value = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = 'linear-gradient(to right, #3b82f6 0%, #3b82f6 ' + value + '%, #e5e7eb ' + value + '%, #e5e7eb 100%)';
}

// Update Score
function updateScore(key, value) {
    // Find which dimension this key belongs to
    let dimension = null;
    if (key in subWeights.consistency) dimension = 'consistency';
    else if (key in subWeights.aesthetic) dimension = 'aesthetic';
    else if (key in subWeights.physicality) dimension = 'physicality';
    
    if (dimension) {
        scores[dimension][key] = value;
        
        // Recalculate dimension total
        let dimTotal = 0;
        Object.keys(subWeights[dimension]).forEach(subKey => {
            dimTotal += scores[dimension][subKey] * subWeights[dimension][subKey];
        });
        
        // Round to 2 decimals
        scores[dimension].total = Math.round(dimTotal * 100) / 100;
        
        // Update display for the changed sub-score
        updateScoreDisplay(key, value);
        // Update display for the dimension total
        updateScoreDisplay(dimension, scores[dimension].total);
        
        updateTotalScore();
    } else {
        console.warn('Dimension not found for key:', key);
    }
}

// Update Total Score
function updateTotalScore() {
    const consistencyScore = scores.consistency.total;
    const aestheticScore = scores.aesthetic.total;
    const physicalityScore = scores.physicality.total;
    
    const totalScore = (
        consistencyScore * weights.consistency +
        physicalityScore * weights.physicality +
        aestheticScore * weights.aesthetic
    ); // Range 0-5
    
    // Convert to 0-100 scale for display
    const totalDisplay = totalScore * 20;
    
    if (totalScoreDisplay) {
        totalScoreDisplay.textContent = totalDisplay.toFixed(1);
        
        // Color coding
        const totalElement = totalScoreDisplay.parentElement;
        if (totalDisplay >= 90) {
            totalElement.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        } else if (totalDisplay >= 80) {
            totalElement.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
        } else if (totalDisplay >= 60) {
            totalElement.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        } else {
            totalElement.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        }
    }
}

// Reset Scores
function resetScores() {
    // Reset data structure
    scores = {
        consistency: { total: 0, semantic_consistency: 0, factual_consistency: 0, spatial_temporal_consistency: 0 },
        aesthetic: { total: 0, expressiveness: 0, artistic_quality: 0, authenticity: 0 },
        physicality: { total: 0, basic_properties: 0, dynamics_interactivity: 0, physical_reliability: 0 }
    };
    
    // Reset inputs
    Object.keys(scoreInputs).forEach(key => {
        const input = scoreInputs[key];
        if (input) {
            input.value = 0;
            // Update slider visual
            addSliderFeedback(input);
            // Update text display
            updateScoreDisplay(key, 0);
        }
    });
    
    // Reset displays
    ['consistency', 'aesthetic', 'physicality'].forEach(dim => {
        updateScoreDisplay(dim, 0);
    });
    
    updateTotalScore();
    showNotification('Scores have been reset!', 'info');
}

// Save Scores
function saveScores() {
    if (currentImages.length !== 4) {
        showNotification('Please upload 4 images first!', 'error');
        return;
    }
    
    const timestamp = new Date().toLocaleString('en-US');
    
    const scoreData = {
        id: Date.now(),
        videoName: `Sequence ${new Date().toLocaleTimeString()}`, // Placeholder name
        timestamp: timestamp,
        scores: JSON.parse(JSON.stringify(scores)), // Deep copy
        total: parseFloat(totalScoreDisplay.textContent)
    };
    
    // Save to local storage
    let history = JSON.parse(localStorage.getItem('videoScores') || '[]');
    history.unshift(scoreData);
    localStorage.setItem('videoScores', JSON.stringify(history));
    
    // Update history display
    loadHistory();
    
    showNotification('Assessment saved successfully!', 'success');
}

// Load History
function loadHistory() {
    try {
        const history = JSON.parse(localStorage.getItem('videoScores') || '[]');
        historyList.innerHTML = '';
        
        if (history.length === 0) {
            historyList.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 30px; font-style: italic;">No assessment records found</p>';
            return;
        }
        
        history.forEach((item, index) => {
            try {
                const historyItem = createHistoryItem(item, index);
                historyList.appendChild(historyItem);
            } catch (e) {
                console.warn('Skipping invalid history item', e);
            }
        });
    } catch (e) {
        console.error('Error loading history', e);
        localStorage.removeItem('videoScores'); // Clear corrupted history
    }
}

// Create History Item
function createHistoryItem(item, index) {
    const div = document.createElement('div');
    div.className = 'history-item';
    div.style.animationDelay = `${index * 0.1}s`;
    
    // Handle legacy data format safely
    const consistency = item.scores.consistency.total !== undefined ? item.scores.consistency.total : (item.scores.consistency || 0);
    const aesthetic = item.scores.aesthetic.total !== undefined ? item.scores.aesthetic.total : (item.scores.aesthetic || 0);
    const physicality = item.scores.physicality.total !== undefined ? item.scores.physicality.total : (item.scores.physicality.total || 0);
    
    div.innerHTML = `
        <div class="history-item-info">
            <div class="history-item-title">${item.videoName || 'Unknown Sequence'}</div>
            <div class="history-item-date">${item.timestamp || '-'}</div>
        </div>
        <div class="history-item-scores">
            <div class="history-score">Total: ${(item.total || 0).toFixed(1)}</div>
            <div class="history-score">Consistency: ${consistency}</div>
            <div class="history-score">Aesthetic: ${aesthetic}</div>
            <div class="history-score">Physicality: ${physicality}</div>
        </div>
    `;
    
    return div;
}

// Show Notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0,0,0,0.2);
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        border: 1px solid rgba(255,255,255,0.2);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Add CSS Animations with performance optimization
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    .score-card {
        transition: transform 0.3s ease, box-shadow 0.3s ease;
    }
    
    .score-value {
        transition: transform 0.3s ease;
    }
    
    .total-score-value {
        transition: transform 0.3s ease;
    }
    
    /* Optimize animations for better performance */
    .video-option,
    .btn,
    .score-card {
        will-change: transform;
    }
    
    /* Reduce motion for users who prefer it */
    @media (prefers-reduced-motion: reduce) {
        .score-card,
        .score-value,
        .total-score-value {
            transition: none;
        }
    }
`;
document.head.appendChild(style);

// Font loading optimization
function loadFonts() {
    if ('fonts' in document) {
        document.fonts.ready.then(() => {
            document.documentElement.classList.add('font-loaded');
        });
    } else {
        // Fallback for older browsers
        setTimeout(() => {
            document.documentElement.classList.add('font-loaded');
        }, 1000);
    }
}

// Initialize font loading
loadFonts();

// Service Worker registration for better performance
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}

// Performance monitoring
function measurePerformance() {
    if ('performance' in window) {
        window.addEventListener('load', function() {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                const loadTime = perfData.loadEventEnd - perfData.loadEventStart;
                console.log('Page load time:', loadTime + 'ms');
                
                // Send performance data to analytics if needed
                if (loadTime > 3000) {
                    console.warn('Slow page load detected:', loadTime + 'ms');
                }
            }, 0);
        });
    }
}

// Initialize performance monitoring
measurePerformance();

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 's':
                e.preventDefault();
                saveScores();
                break;
            case 'r':
                e.preventDefault();
                resetScores();
                break;
        }
    }
    
    // Number keys for quick scoring
    if (e.key >= '0' && e.key <= '5' && !e.ctrlKey && !e.metaKey) {
        const activeElement = document.activeElement;
        if (activeElement && activeElement.type === 'range') {
            e.preventDefault();
            activeElement.value = e.key;
            activeElement.dispatchEvent(new Event('input'));
        }
    }
    
    // ESC key to close criteria section
    if (e.key === 'Escape') {
        const criteriaSection = document.getElementById('criteriaSection');
        if (criteriaSection.style.display === 'block') {
            criteriaSection.style.display = 'none';
        }
    }
});

// Export Function
function exportScores() {
    const history = JSON.parse(localStorage.getItem('videoScores') || '[]');
    const csvContent = generateCSV(history);
    downloadCSV(csvContent, 'video_assessments.csv');
}

function generateCSV(data) {
    const headers = ['Video', 'Timestamp', 'Consistency', 'Aesthetic', 'Physicality', 'Total Score'];
    const rows = data.map(item => [
        item.videoName,
        item.timestamp,
        item.scores.consistency.total,
        item.scores.aesthetic.total,
        item.scores.physicality.total,
        item.total
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Add Export Button
document.addEventListener('DOMContentLoaded', function() {
    const actionButtons = document.querySelector('.action-buttons');
    if (actionButtons) {
        const exportBtn = document.createElement('button');
        exportBtn.className = 'btn btn-secondary';
        exportBtn.innerHTML = '<i class="fas fa-download"></i> Export Data';
        exportBtn.addEventListener('click', exportScores);
        actionButtons.appendChild(exportBtn);
    }
});

// Add Progress Indicator
function addProgressIndicator() {
    const progressBar = document.createElement('div');
    progressBar.id = 'progressBar';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        z-index: 9999;
        transition: width 0.3s ease;
    `;
    document.body.appendChild(progressBar);
}

// Update Progress
function updateProgress(percentage) {
    const progressBar = document.getElementById('progressBar');
    if (progressBar) {
        progressBar.style.width = percentage + '%';
    }
}

// Initialize Progress Bar
document.addEventListener('DOMContentLoaded', function() {
    addProgressIndicator();
    updateProgress(100);
});

// Add Video Loading States
function addVideoLoadingStates() {
    const videos = document.querySelectorAll('video');
    videos.forEach(video => {
        video.addEventListener('loadstart', function() {
            this.style.opacity = '0.7';
        });
        
        video.addEventListener('canplay', function() {
            this.style.opacity = '1';
        });
    });
}

// Initialize Video Loading States
document.addEventListener('DOMContentLoaded', function() {
    addVideoLoadingStates();
});

// Add Tooltip Functionality
function addTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.dataset.tooltip;
            tooltip.style.cssText = `
                position: absolute;
                background: #1f2937;
                color: white;
                padding: 8px 12px;
                border-radius: 6px;
                font-size: 0.8rem;
                z-index: 1000;
                pointer-events: none;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.top - 40) + 'px';
            
            setTimeout(() => {
                tooltip.style.opacity = '1';
            }, 10);
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });
}

// Initialize Tooltips
document.addEventListener('DOMContentLoaded', function() {
    addTooltips();
});

// AI Analysis Functions
function showAIAnalysis() {
    if (currentImages.length !== 4) {
        showNotification('Please upload 4 images first!', 'error');
        return;
    }
    
    aiComparisonSection.style.display = 'block';
    aiComparisonSection.scrollIntoView({ behavior: 'smooth' });
    showNotification('Enter AI scores and click "Generate Analysis" to see detailed comparison.', 'info');
}

function generateAnalysis() {
    // Get AI input values
    var aiConsistency = parseFloat(document.getElementById('aiConsistencyInput').value) || 0;
    var aiAesthetic = parseFloat(document.getElementById('aiAestheticInput').value) || 0;
    var aiPhysicality = parseFloat(document.getElementById('aiPhysicalityInput').value) || 0;
    
    // Validate inputs
    if (aiConsistency < 0 || aiConsistency > 5 || 
        aiAesthetic < 0 || aiAesthetic > 5 || aiPhysicality < 0 || aiPhysicality > 5) {
        showNotification('Please enter valid scores between 0 and 5.', 'error');
        return;
    }
    
    // Create AI scores object
    aiScores = {
        consistency: aiConsistency,
        aesthetic: aiAesthetic,
        physicality: {
            total: aiPhysicality
        }
    };
    
    // Show analysis results
    analysisResults.style.display = 'block';
    
    // Generate all visualizations
    generateComparisonChart();
    generateCorrelationChart();
    generateAgreementChart();
    updateMetricsTable();
    updateCorrelationMetrics();
    
    // Scroll to results
    analysisResults.scrollIntoView({ behavior: 'smooth' });
    
    showNotification('Analysis generated successfully!', 'success');
}

// Generate Comparison Chart
function generateComparisonChart() {
    var canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    var humanScores = [scores.consistency.total, scores.aesthetic.total, scores.physicality.total];
    var aiScoresArray = [aiScores.consistency, aiScores.aesthetic, aiScores.physicality.total];
    var metrics = ['Consistency', 'Aesthetic', 'Physicality'];
    
    var margin = 60;
    var chartWidth = canvas.width - 2 * margin;
    var chartHeight = canvas.height - 2 * margin;
    var barWidth = chartWidth / (metrics.length * 3);
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.stroke();
    
    // Draw bars
    for (var i = 0; i < metrics.length; i++) {
        var x = margin + i * (chartWidth / metrics.length) + (chartWidth / metrics.length - barWidth * 2) / 2;
        
        // Human score bar
        var humanHeight = (humanScores[i] / 5) * chartHeight;
        ctx.fillStyle = '#3b82f6';
        ctx.fillRect(x, canvas.height - margin - humanHeight, barWidth, humanHeight);
        
        // AI score bar
        var aiHeight = (aiScoresArray[i] / 5) * chartHeight;
        ctx.fillStyle = '#10b981';
        ctx.fillRect(x + barWidth + 5, canvas.height - margin - aiHeight, barWidth, aiHeight);
        
        // Labels
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(metrics[i], x + barWidth, canvas.height - margin + 20);
    }
    
    // Legend
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(canvas.width - 150, 20, 15, 15);
    ctx.fillStyle = '#1f2937';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Human Scores', canvas.width - 130, 32);
    
    ctx.fillStyle = '#10b981';
    ctx.fillRect(canvas.width - 150, 45, 15, 15);
    ctx.fillStyle = '#1f2937';
    ctx.fillText('AI Scores', canvas.width - 130, 57);
}

// Generate Correlation Chart
function generateCorrelationChart() {
    var canvas = document.getElementById('correlationChart');
    if (!canvas) return;
    
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    var humanScores = [scores.consistency.total, scores.aesthetic.total, scores.physicality.total];
    var aiScoresArray = [aiScores.consistency, aiScores.aesthetic, aiScores.physicality.total];
    
    var margin = 40;
    var chartWidth = canvas.width - 2 * margin;
    var chartHeight = canvas.height - 2 * margin;
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.stroke();
    
    // Draw grid
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 0.5;
    for (var i = 0; i <= 5; i++) {
        var x = margin + (i / 5) * chartWidth;
        var y = margin + (i / 5) * chartHeight;
        
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, canvas.height - margin);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(canvas.width - margin, y);
        ctx.stroke();
    }
    
    // Draw data points
    for (var i = 0; i < humanScores.length; i++) {
        var x = margin + (humanScores[i] / 5) * chartWidth;
        var y = canvas.height - margin - (aiScoresArray[i] / 5) * chartHeight;
        
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
    }
    
    // Trend line (simplified)
    if (humanScores.length > 1) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(margin, canvas.height - margin);
        ctx.lineTo(canvas.width - margin, margin); // Just a dummy diagonal for visual
        // Real regression would be better but keeping it simple
        ctx.stroke();
    }
    
    // Labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Human Scores', canvas.width / 2, canvas.height - 10);
    
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('AI Scores', 0, 0);
    ctx.restore();
}

// Generate Agreement Chart
function generateAgreementChart() {
    var canvas = document.getElementById('agreementChart');
    if (!canvas) return;
    
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    var humanScores = [scores.consistency.total, scores.aesthetic.total, scores.physicality.total];
    var aiScoresArray = [aiScores.consistency, aiScores.aesthetic, aiScores.physicality.total];
    var differences = humanScores.map(function(human, i) { return Math.abs(human - aiScoresArray[i]); });
    var metrics = ['Consistency', 'Aesthetic', 'Physicality'];
    
    var margin = 40;
    var chartWidth = canvas.width - 2 * margin;
    var chartHeight = canvas.height - 2 * margin;
    var barWidth = chartWidth / differences.length * 0.6;
    var barSpacing = chartWidth / differences.length;
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.stroke();
    
    // Draw bars
    for (var i = 0; i < differences.length; i++) {
        var x = margin + i * barSpacing + (barSpacing - barWidth) / 2;
        var barHeight = (differences[i] / 5) * chartHeight;
        var y = canvas.height - margin - barHeight;
        
        // Color based on difference level
        if (differences[i] <= 0.5) {
            ctx.fillStyle = '#10b981'; // Green for good agreement
        } else if (differences[i] <= 1.0) {
            ctx.fillStyle = '#f59e0b'; // Yellow for moderate agreement
        } else {
            ctx.fillStyle = '#ef4444'; // Red for poor agreement
        }
        
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Labels
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(metrics[i], x + barWidth / 2, canvas.height - margin + 20);
        ctx.fillText(differences[i].toFixed(1), x + barWidth / 2, y - 5);
    }
}

// Update Metrics Table
function updateMetricsTable() {
    var humanScores = [scores.consistency.total, scores.aesthetic.total, scores.physicality.total];
    var aiScoresArray = [aiScores.consistency, aiScores.aesthetic, aiScores.physicality.total];
    var metrics = ['Consistency', 'Aesthetic', 'Physicality'];
    
    for (var i = 0; i < metrics.length; i++) {
        var humanScore = humanScores[i].toFixed(1);
        var aiScore = aiScoresArray[i].toFixed(1);
        var difference = (humanScores[i] - aiScoresArray[i]).toFixed(1);
        var agreement = Math.abs(humanScores[i] - aiScoresArray[i]) <= 0.5 ? 'Good' : 
                       Math.abs(humanScores[i] - aiScoresArray[i]) <= 1.0 ? 'Moderate' : 'Poor';
        
        document.getElementById('human' + metrics[i]).textContent = humanScore;
        document.getElementById('ai' + metrics[i]).textContent = aiScore;
        document.getElementById('diff' + metrics[i]).textContent = difference;
        document.getElementById('agree' + metrics[i]).textContent = agreement;
    }
}

// Update Correlation Metrics
function updateCorrelationMetrics() {
    var humanScores = [scores.consistency.total, scores.aesthetic.total, scores.physicality.total];
    var aiScoresArray = [aiScores.consistency, aiScores.aesthetic, aiScores.physicality.total];
    
    var pearson = calculateCorrelation(humanScores, aiScoresArray);
    var spearman = calculateSpearmanCorrelation(humanScores, aiScoresArray);
    var mae = calculateMAE(humanScores, aiScoresArray);
    var rmse = calculateRMSE(humanScores, aiScoresArray);
    var agreementLevel = getAgreementLevel(pearson);
    var consistencyIndex = calculateConsistencyIndex(humanScores, aiScoresArray);
    
    document.getElementById('pearsonValue').textContent = pearson.toFixed(3);
    document.getElementById('spearmanValue').textContent = spearman.toFixed(3);
    document.getElementById('maeValue').textContent = mae.toFixed(3);
    document.getElementById('rmseValue').textContent = rmse.toFixed(3);
    document.getElementById('agreementValue').textContent = agreementLevel;
    document.getElementById('agreementDescription').textContent = getAgreementDescription(pearson);
    document.getElementById('consistencyValue').textContent = consistencyIndex.toFixed(3);
}

// Get Agreement Description
function getAgreementDescription(correlation) {
    if (correlation >= 0.8) return 'Excellent agreement between human and AI assessments';
    if (correlation >= 0.6) return 'Good agreement with minor variations';
    if (correlation >= 0.4) return 'Moderate agreement with some differences';
    if (correlation >= 0.2) return 'Weak agreement with notable differences';
    return 'Poor agreement with significant differences';
}

// Clear All Data Function
function clearAllData() {
    if (confirm('Are you sure you want to clear all assessment data? This action cannot be undone.')) {
        // Clear localStorage
        localStorage.removeItem('videoScores');
        
        // Reset current scores
        resetScores();
        
        // Clear AI scores
        aiScores = null;
        
        // Reset AI inputs
        const aiInputs = ['aiConsistencyInput', 'aiAestheticInput', 'aiPhysicalityInput'];
        aiInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.value = '0';
                const displayId = inputId.replace('Input', 'Display');
                const display = document.getElementById(displayId);
                if (display) {
                    display.textContent = '0.0';
                }
            }
        });
        
        // Hide AI comparison section
        analysisResults.style.display = 'none';
        aiComparisonSection.style.display = 'none';
        
        // Reload history
        loadHistory();
        
        showNotification('All data has been cleared successfully!', 'success');
    }
}

function updateAIScoresDisplay() {
    if (!aiScores) return;
    
    // Update AI score values
    document.getElementById('aiConsistencyValue').textContent = aiScores.consistency;
    document.getElementById('aiAestheticValue').textContent = aiScores.aesthetic;
    document.getElementById('aiPhysicalityValue').textContent = aiScores.physicality.total;
    
    // Update human score values
    document.getElementById('humanConsistencyValue').textContent = scores.consistency.total.toFixed(1);
    document.getElementById('humanAestheticValue').textContent = scores.aesthetic.total.toFixed(1);
    document.getElementById('humanPhysicalityValue').textContent = scores.physicality.total.toFixed(1);
    
    // Update score bars with animation
    updateScoreBars();
    
    // Show AI scores section
    const aiStatus = document.querySelector('.ai-status');
    const aiScoresDiv = document.querySelector('.ai-scores');
    if (aiStatus) aiStatus.style.display = 'none';
    if (aiScoresDiv) aiScoresDiv.style.display = 'block';
}

function updateScoreBars() {
    const metrics = ['consistency', 'aesthetic', 'physicality'];
    
    metrics.forEach(metric => {
        const humanValue = metric === 'physicality' ? scores.physicality.total : scores[metric].total;
        const aiValue = metric === 'physicality' ? aiScores.physicality.total : aiScores[metric];
        
        // Update human score bar
        const humanBar = document.getElementById(`human${metric.charAt(0).toUpperCase() + metric.slice(1)}Bar`);
        if (humanBar) {
            const humanPercentage = (humanValue / 5) * 100;
            humanBar.style.width = `${humanPercentage}%`;
        }
        
        // Update AI score bar
        const aiBar = document.getElementById(`ai${metric.charAt(0).toUpperCase() + metric.slice(1)}Bar`);
        if (aiBar) {
            const aiPercentage = (aiValue / 5) * 100;
            aiBar.style.width = `${aiPercentage}%`;
        }
    });
}

function showCorrelationAnalysis() {
    if (!aiScores) return;
    
    // Calculate correlation coefficient
    const humanScores = [scores.consistency.total, scores.aesthetic.total, scores.physicality.total];
    const aiScoresArray = [aiScores.consistency, aiScores.aesthetic, aiScores.physicality.total];
    
    // Calculate various correlation metrics
    const pearsonCorrelation = calculateCorrelation(humanScores, aiScoresArray);
    const spearmanCorrelation = calculateSpearmanCorrelation(humanScores, aiScoresArray);
    const mae = calculateMAE(humanScores, aiScoresArray);
    const rmse = calculateRMSE(humanScores, aiScoresArray);
    const agreementLevel = getAgreementLevel(pearsonCorrelation);
    const consistencyIndex = calculateConsistencyIndex(humanScores, aiScoresArray);
    
    // Update correlation display
    document.getElementById('correlationCoefficient').textContent = pearsonCorrelation.toFixed(3);
    document.getElementById('spearmanCorrelation').textContent = spearmanCorrelation.toFixed(3);
    document.getElementById('meanAbsoluteError').textContent = mae.toFixed(3);
    document.getElementById('rootMeanSquareError').textContent = rmse.toFixed(3);
    document.getElementById('agreementLevel').textContent = agreementLevel;
    document.getElementById('consistencyIndex').textContent = consistencyIndex.toFixed(3);
    
    // Draw correlation charts
    drawCorrelationChart(humanScores, aiScoresArray);
    drawDifferenceChart(humanScores, aiScoresArray);
}

function calculateCorrelation(x, y) {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * y[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = y.reduce((acc, yi) => acc + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
}

function calculateSpearmanCorrelation(x, y) {
    // Create ranked arrays
    const rankedX = rankArray(x);
    const rankedY = rankArray(y);
    
    // Calculate correlation on ranks
    return calculateCorrelation(rankedX, rankedY);
}

function rankArray(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    return arr.map(val => sorted.indexOf(val) + 1);
}

function calculateMAE(x, y) {
    const n = x.length;
    const sum = x.reduce((acc, xi, i) => acc + Math.abs(xi - y[i]), 0);
    return sum / n;
}

function calculateRMSE(x, y) {
    const n = x.length;
    const sum = x.reduce((acc, xi, i) => acc + Math.pow(xi - y[i], 2), 0);
    return Math.sqrt(sum / n);
}

function calculateConsistencyIndex(x, y) {
    const n = x.length;
    const differences = x.map((xi, i) => Math.abs(xi - y[i]));
    const maxDifference = Math.max(...differences);
    const avgDifference = differences.reduce((sum, diff) => sum + diff, 0) / n;
    
    // Consistency index: 1 - (average difference / max possible difference)
    return 1 - (avgDifference / 5);
}

function getAgreementLevel(correlation) {
    if (correlation >= 0.8) return 'Excellent';
    if (correlation >= 0.6) return 'Good';
    if (correlation >= 0.4) return 'Moderate';
    if (correlation >= 0.2) return 'Weak';
    return 'Poor';
}

function drawCorrelationChart(humanScores, aiScores) {
    const canvas = document.getElementById('correlationCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up chart dimensions
    const margin = 40;
    const chartWidth = canvas.width - 2 * margin;
    const chartHeight = canvas.height - 2 * margin;
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.stroke();
    
    // Draw grid lines
    ctx.strokeStyle = '#f3f4f6';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
        const x = margin + (i / 5) * chartWidth;
        const y = margin + (i / 5) * chartHeight;
        
        // Vertical grid lines
        ctx.beginPath();
        ctx.moveTo(x, margin);
        ctx.lineTo(x, canvas.height - margin);
        ctx.stroke();
        
        // Horizontal grid lines
        ctx.beginPath();
        ctx.moveTo(margin, y);
        ctx.lineTo(canvas.width - margin, y);
        ctx.stroke();
    }
    
    // Draw data points
    const metrics = ['Consistency', 'Aesthetic', 'Physicality'];
    
    humanScores.forEach((humanScore, index) => {
        const aiScore = aiScores[index];
        const x = margin + (humanScore / 5) * chartWidth;
        const y = canvas.height - margin - (aiScore / 5) * chartHeight;
        
        // Draw point
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // Draw label
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(metrics[index], x, y - 10);
    });
    
    // Draw trend line
    const correlation = calculateCorrelation(humanScores, aiScores);
    if (Math.abs(correlation) > 0.1) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        const startX = margin;
        const endX = canvas.width - margin;
        const startY = canvas.height - margin - (aiScores[0] / 5) * chartHeight;
        const endY = canvas.height - margin - (aiScores[aiScores.length - 1] / 5) * chartHeight;
        
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
    }
    
    // Draw labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '14px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Human Scores', canvas.width / 2, canvas.height - 10);
    
    ctx.save();
    ctx.translate(15, canvas.height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('AI Scores', 0, 0);
    ctx.restore();
}

function drawDifferenceChart(humanScores, aiScores) {
    const canvas = document.getElementById('differenceCanvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Set up chart dimensions
    const margin = 40;
    const chartWidth = canvas.width - 2 * margin;
    const chartHeight = canvas.height - 2 * margin;
    
    // Calculate differences
    const differences = humanScores.map((human, i) => human - aiScores[i]);
    const metrics = ['Consistency', 'Aesthetic', 'Physicality'];
    
    // Find max absolute difference for scaling
    const maxDiff = Math.max(...differences.map(d => Math.abs(d)));
    const scale = chartHeight / (2 * maxDiff);
    
    // Draw axes
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin, margin);
    ctx.lineTo(margin, canvas.height - margin);
    ctx.lineTo(canvas.width - margin, canvas.height - margin);
    ctx.stroke();
    
    // Draw zero line
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(margin, margin + chartHeight / 2);
    ctx.lineTo(canvas.width - margin, margin + chartHeight / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // Draw bars for differences
    const barWidth = chartWidth / differences.length * 0.6;
    const barSpacing = chartWidth / differences.length;
    
    differences.forEach((diff, index) => {
        const x = margin + index * barSpacing + (barSpacing - barWidth) / 2;
        const barHeight = Math.abs(diff) * scale;
        const y = diff >= 0 ? 
            margin + chartHeight / 2 - barHeight : 
            margin + chartHeight / 2;
        
        // Color based on difference direction
        ctx.fillStyle = diff >= 0 ? '#ef4444' : '#10b981';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // Draw value labels
        ctx.fillStyle = '#1f2937';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(diff.toFixed(1), x + barWidth / 2, y - 5);
        
        // Draw metric labels
        ctx.fillText(metrics[index], x + barWidth / 2, canvas.height - margin + 20);
    });
    
    // Draw title
    ctx.fillStyle = '#1f2937';
    ctx.font = '16px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Score Differences (Human - AI)', canvas.width / 2, 25);
    
    // Draw legend
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(canvas.width - 120, 15, 15, 15);
    ctx.fillStyle = '#1f2937';
    ctx.font = '12px Inter';
    ctx.textAlign = 'left';
    ctx.fillText('Human > AI', canvas.width - 100, 25);
    
    ctx.fillStyle = '#10b981';
    ctx.fillRect(canvas.width - 120, 35, 15, 15);
    ctx.fillStyle = '#1f2937';
    ctx.fillText('AI > Human', canvas.width - 100, 45);
}
