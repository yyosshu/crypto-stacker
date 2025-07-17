class CryptoStackerApp {
    constructor() {
        this.wsManager = null;
        this.priceDisplay = null;
        this.chartDisplay = null;
        this.apiClient = null;
        this.positionManager = null;
        this.profitLossDisplay = null;
        this.updateInterval = null;
        this.isInitialized = false;
        
        // Bind methods
        this.init = this.init.bind(this);
        this.handlePriceUpdate = this.handlePriceUpdate.bind(this);
        this.handleConnectionChange = this.handleConnectionChange.bind(this);
        this.handleTimeframeChange = this.handleTimeframeChange.bind(this);
        this.loadInitialData = this.loadInitialData.bind(this);
    }

    async init() {
        console.log('Initializing Crypto Stacker App...');
        
        try {
            // Initialize components
            this.priceDisplay = new PriceDisplay();
            this.chartDisplay = new ChartDisplay('priceChart');
            this.wsManager = new WebSocketManager();
            this.apiClient = new ApiClient();
            this.candleManager = new CandleManager('5min'); // Default 5min
            this.positionManager = new PositionManager();
            this.profitLossDisplay = new ProfitLossDisplay(this.positionManager);
            
            // Connect position manager to chart display
            this.positionManager.setChartDisplay(this.chartDisplay);
            
            // Initial render of profit/loss display
            this.profitLossDisplay.render();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup WebSocket callbacks
            this.setupWebSocketCallbacks();
            
            // Setup candle manager callbacks
            this.setupCandleManagerCallbacks();
            
            // Setup timeframe controls
            this.setupTimeframeControls();
            
            // Load initial candlestick data (5min default)
            await this.loadInitialData('5min');
            
            // Connect to WebSocket for real-time updates
            this.wsManager.connect();
            
            // Start real-time update loop
            this.startUpdateLoop();
            
            this.isInitialized = true;
            console.log('App initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.priceDisplay?.updateConnectionStatus(false, 'Initialization failed');
        }
    }

    setupEventListeners() {
        // Window events
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        // Visibility change (pause updates when tab is hidden)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        });
        
        // Error handling
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
    }

    setupWebSocketCallbacks() {
        // Connection events
        this.wsManager.onConnect(() => {
            console.log('WebSocket connected');
            this.priceDisplay.updateConnectionStatus(true);
        });

        this.wsManager.onDisconnect((reason) => {
            console.log('WebSocket disconnected:', reason);
            this.priceDisplay.updateConnectionStatus(false, reason);
        });

        this.wsManager.onError((error) => {
            console.error('WebSocket error:', error);
            this.priceDisplay.updateConnectionStatus(false, 'Connection error');
        });

        // Price data events
        this.wsManager.onMessage((priceData) => {
            this.handlePriceUpdate(priceData);
        });
    }

    handlePriceUpdate(priceData) {
        if (!priceData || !this.isInitialized) return;
        
        try {
            // Update price display
            this.priceDisplay.updatePrice(priceData);
            
            // Update profit/loss display with new price
            this.profitLossDisplay.updateCurrentPrice(priceData.price);
            
            // Add tick to candle manager (handles timeframe logic)
            this.candleManager.addTick(priceData);
            
        } catch (error) {
            console.error('Error handling price update:', error);
        }
    }

    setupCandleManagerCallbacks() {
        // Handle current candle updates (real-time)
        this.candleManager.onCandleUpdate((candleData) => {
            this.chartDisplay.updateCurrentCandle(candleData);
        });

        // Handle completed candles (timeframe completion)
        this.candleManager.onCandleComplete((candleData) => {
            this.chartDisplay.addCompletedCandle(candleData);
        });
    }

    handleConnectionChange(isConnected, message) {
        this.priceDisplay.updateConnectionStatus(isConnected, message);
    }

    setupTimeframeControls() {
        const timeBtns = document.querySelectorAll('.time-btn');
        
        timeBtns.forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const timeframe = e.target.dataset.timeframe;
                await this.handleTimeframeChange(timeframe, e.target);
            });
        });
    }

    async handleTimeframeChange(timeframe, buttonElement) {
        try {
            // Update active button
            document.querySelectorAll('.time-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            buttonElement.classList.add('active');
            
            // Show loading state
            this.priceDisplay.updateConnectionStatus(true, 'Loading...');
            
            // Update candle manager timeframe
            this.candleManager.changeTimeframe(timeframe);
            
            // Update chart timeframe
            this.chartDisplay.changeTimeframe(timeframe);
            
            // Load new candlestick data
            await this.chartDisplay.loadCandlestickData(this.apiClient, timeframe, this.candleManager);
            
            // Update connection status
            this.priceDisplay.updateConnectionStatus(this.wsManager.isConnected);
            
            console.log(`Changed timeframe to: ${timeframe}`);
            
        } catch (error) {
            console.error('Error changing timeframe:', error);
            this.priceDisplay.updateConnectionStatus(false, 'Error loading data');
        }
    }

    async loadInitialData(timeframe) {
        try {
            console.log(`Loading initial data for ${timeframe}...`);
            await this.chartDisplay.loadCandlestickData(this.apiClient, timeframe, this.candleManager);
        } catch (error) {
            console.error('Error loading initial data:', error);
        }
    }

    startUpdateLoop() {
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Start 1-second update loop
        this.updateInterval = setInterval(() => {
            this.performPeriodicUpdate();
        }, 1000);
        
        console.log('Started 1-second update loop');
    }

    performPeriodicUpdate() {
        // This runs every second to ensure smooth real-time updates
        try {
            // Check connection status
            const status = this.wsManager.getStatus();
            
            // If we have data but haven't updated in a while, 
            // ensure the chart shows the latest point
            if (status.lastPrice) {
                // The chart will handle timing internally
                // This just ensures we don't miss any updates
            }
            
            // Update connection status if needed
            if (!status.connected && this.wsManager.reconnectAttempts > 0) {
                this.priceDisplay.updateConnectionStatus(
                    false, 
                    `Reconnecting... (${this.wsManager.reconnectAttempts}/5)`
                );
            }
            
        } catch (error) {
            console.error('Error in periodic update:', error);
        }
    }

    pauseUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        console.log('Updates paused (tab hidden)');
    }

    resumeUpdates() {
        if (!this.updateInterval) {
            this.startUpdateLoop();
            console.log('Updates resumed (tab visible)');
        }
    }

    cleanup() {
        console.log('Cleaning up app...');
        
        // Clear update interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        
        // Disconnect WebSocket
        if (this.wsManager) {
            this.wsManager.disconnect();
        }
        
        // Clear chart
        if (this.chartDisplay && this.chartDisplay.chart) {
            this.chartDisplay.chart.destroy();
        }
    }

    // Manual reconnect function
    reconnect() {
        console.log('Manual reconnect triggered');
        this.wsManager.disconnect();
        setTimeout(() => {
            this.wsManager.connect();
        }, 1000);
    }

    // Get app status for debugging
    getStatus() {
        return {
            initialized: this.isInitialized,
            websocket: this.wsManager?.getStatus(),
            chart: this.chartDisplay?.getCurrentData(),
            updateInterval: !!this.updateInterval
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    
    // Create global app instance
    window.cryptoApp = new CryptoStackerApp();
    
    // Initialize the app
    window.cryptoApp.init().then(() => {
        // Make profitLossDisplay globally accessible for HTML event handlers
        window.profitLossDisplay = window.cryptoApp.profitLossDisplay;
    }).catch(error => {
        console.error('Failed to start app:', error);
    });
});

// Add some global debugging helpers
window.debugApp = () => {
    if (window.cryptoApp) {
        console.log('App Status:', window.cryptoApp.getStatus());
    }
};

window.reconnectApp = () => {
    if (window.cryptoApp) {
        window.cryptoApp.reconnect();
    }
};