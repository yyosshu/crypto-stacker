// Mock WebSocket Manager for testing
class WebSocketManager {
    constructor(options = {}) {
        this.isConnected = false;
        this.lastPrice = null;
        this.callbacks = {
            onConnect: [],
            onDisconnect: [],
            onMessage: [],
            onError: []
        };
        
        // Mock price data for testing
        this.mockPrice = 896489;
        this.priceDirection = 1; // 1 for up, -1 for down
        this.mockInterval = null;
    }

    connect() {
        console.log('Mock WebSocket connecting...');
        
        // Simulate connection delay
        setTimeout(() => {
            this.isConnected = true;
            console.log('Mock WebSocket connected');
            
            this.callbacks.onConnect.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in connect callback:', error);
                }
            });
            
            // Start mock data generation
            this.startMockData();
        }, 1000);
    }

    disconnect() {
        this.isConnected = false;
        if (this.mockInterval) {
            clearInterval(this.mockInterval);
            this.mockInterval = null;
        }
    }

    startMockData() {
        // Generate mock price data every 2-5 seconds
        this.mockInterval = setInterval(() => {
            this.generateMockPrice();
        }, Math.random() * 3000 + 2000); // 2-5 seconds
    }

    generateMockPrice() {
        // Simulate realistic price movement
        const changePercent = (Math.random() - 0.5) * 0.002; // ±0.1% change
        this.mockPrice = Math.round(this.mockPrice * (1 + changePercent));
        
        // Ensure price stays in reasonable range
        this.mockPrice = Math.max(800000, Math.min(1000000, this.mockPrice));
        
        const mockData = {
            price: this.mockPrice,
            sell: this.mockPrice + Math.round(Math.random() * 10),
            buy: this.mockPrice - Math.round(Math.random() * 10),
            timestamp: Date.now()
        };
        
        this.lastPrice = mockData;
        
        console.log('Generated mock price:', mockData);
        
        this.callbacks.onMessage.forEach(callback => {
            try {
                callback(mockData);
            } catch (error) {
                console.error('Error in message callback:', error);
            }
        });
    }

    // Event listeners
    onConnect(callback) {
        this.callbacks.onConnect.push(callback);
    }

    onDisconnect(callback) {
        this.callbacks.onDisconnect.push(callback);
    }

    onMessage(callback) {
        this.callbacks.onMessage.push(callback);
    }

    onError(callback) {
        this.callbacks.onError.push(callback);
    }

    getStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: 0,
            lastPrice: this.lastPrice
        };
    }
}