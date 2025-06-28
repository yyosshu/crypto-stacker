class PriceDisplay {
    constructor() {
        this.currentPriceElement = document.getElementById('currentPrice');
        this.priceChangeElement = document.getElementById('priceChange');
        this.connectionStatusElement = document.getElementById('connectionStatus');
        this.highPriceElement = document.getElementById('highPrice');
        this.lowPriceElement = document.getElementById('lowPrice');
        this.volumeElement = document.getElementById('volume');
        this.lastUpdateElement = document.getElementById('lastUpdate');
        
        this.previousPrice = null;
        this.dailyHigh = null;
        this.dailyLow = null;
        this.dailyVolume = 0;
        this.sessionStartPrice = null;
        
        // Flash animation timeout
        this.flashTimeout = null;
    }

    updatePrice(priceData) {
        console.log('PriceDisplay received data:', priceData); // Debug log
        
        if (!priceData || !priceData.price) {
            console.log('Invalid price data received'); // Debug log
            return;
        }

        const currentPrice = priceData.price;
        const formattedPrice = this.formatPrice(currentPrice);
        
        console.log('Updating price display to:', formattedPrice); // Debug log
        
        // Update main price display
        this.currentPriceElement.textContent = formattedPrice;
        
        // Update high/low tracking
        this.updateHighLow(currentPrice);
        
        // Calculate and display price change
        this.updatePriceChange(currentPrice);
        
        // Update timestamp
        this.updateTimestamp();
        
        // Flash effect for price changes
        this.flashPriceChange(currentPrice);
        
        // Store current price as previous
        this.previousPrice = currentPrice;
    }

    updatePriceChange(currentPrice) {
        if (this.sessionStartPrice === null) {
            this.sessionStartPrice = currentPrice;
            return;
        }

        const change = currentPrice - this.sessionStartPrice;
        const changePercent = (change / this.sessionStartPrice) * 100;
        
        const changeText = `${change >= 0 ? '↑' : '↓'} ${change >= 0 ? '+' : ''}${this.formatPrice(Math.abs(change))} (${changePercent >= 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
        
        this.priceChangeElement.textContent = changeText;
        
        // Update CSS classes
        this.priceChangeElement.className = 'price-change';
        if (change > 0) {
            this.priceChangeElement.classList.add('positive');
        } else if (change < 0) {
            this.priceChangeElement.classList.add('negative');
        } else {
            this.priceChangeElement.classList.add('neutral');
        }
    }

    updateHighLow(currentPrice) {
        // Initialize or update daily high
        if (this.dailyHigh === null || currentPrice > this.dailyHigh) {
            this.dailyHigh = currentPrice;
            this.highPriceElement.textContent = this.formatPrice(this.dailyHigh);
        }
        
        // Initialize or update daily low
        if (this.dailyLow === null || currentPrice < this.dailyLow) {
            this.dailyLow = currentPrice;
            this.lowPriceElement.textContent = this.formatPrice(this.dailyLow);
        }
    }

    updateTimestamp() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        this.lastUpdateElement.textContent = timeString;
    }

    flashPriceChange(currentPrice) {
        if (this.previousPrice === null) return;
        
        // Clear previous flash
        if (this.flashTimeout) {
            clearTimeout(this.flashTimeout);
        }
        
        // Remove any existing flash classes
        this.currentPriceElement.classList.remove('flash-up', 'flash-down');
        
        // Add flash class based on price direction
        if (currentPrice > this.previousPrice) {
            this.currentPriceElement.classList.add('flash-up');
        } else if (currentPrice < this.previousPrice) {
            this.currentPriceElement.classList.add('flash-down');
        }
        
        // Remove flash class after animation
        this.flashTimeout = setTimeout(() => {
            this.currentPriceElement.classList.remove('flash-up', 'flash-down');
        }, 500);
    }

    updateConnectionStatus(isConnected, message = '') {
        const statusText = isConnected ? '接続中' : '切断中';
        const statusMessage = message ? ` - ${message}` : '';
        
        this.connectionStatusElement.textContent = statusText + statusMessage;
        this.connectionStatusElement.className = `status-indicator ${isConnected ? 'connected' : 'disconnected'}`;
    }

    formatPrice(price) {
        if (typeof price !== 'number' || isNaN(price)) {
            return '--';
        }
        
        // Format with thousand separators
        return new Intl.NumberFormat('ja-JP', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.round(price));
    }

    // Reset daily stats (call at midnight or session start)
    resetDailyStats() {
        this.dailyHigh = null;
        this.dailyLow = null;
        this.dailyVolume = 0;
        this.sessionStartPrice = null;
        
        this.highPriceElement.textContent = '--';
        this.lowPriceElement.textContent = '--';
        this.volumeElement.textContent = '--';
    }

    // Set initial price (for calculating daily change)
    setSessionStartPrice(price) {
        this.sessionStartPrice = price;
    }
}

// Add CSS for flash animations
const flashStyles = `
.price-value.flash-up {
    animation: flashGreen 0.5s ease-out;
}

.price-value.flash-down {
    animation: flashRed 0.5s ease-out;
}

@keyframes flashGreen {
    0% { background-color: rgba(22, 163, 74, 0.2); }
    100% { background-color: transparent; }
}

@keyframes flashRed {
    0% { background-color: rgba(220, 38, 38, 0.2); }
    100% { background-color: transparent; }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = flashStyles;
document.head.appendChild(styleSheet);