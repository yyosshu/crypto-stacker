class WebSocketManager {
    constructor(options = {}) {
        this.url = 'wss://stream.bitbank.cc';
        this.socket = null;
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.lastPrice = null;
        this.callbacks = {
            onConnect: [],
            onDisconnect: [],
            onMessage: [],
            onError: []
        };
        
        // Bind methods
        this.connect = this.connect.bind(this);
        this.disconnect = this.disconnect.bind(this);
        this.handleConnect = this.handleConnect.bind(this);
        this.handleDisconnect = this.handleDisconnect.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.handleError = this.handleError.bind(this);
    }

    connect() {
        try {
            console.log('Connecting to bitbank WebSocket...');
            
            // Use socket.io client - bitbank uses Socket.IO v4
            this.socket = io('wss://stream.bitbank.cc', {
                transports: ['websocket'],
                timeout: 10000,
                forceNew: true,
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5
            });

            this.socket.on('connect', this.handleConnect);
            this.socket.on('disconnect', this.handleDisconnect);
            this.socket.on('message', this.handleMessage);
            this.socket.on('error', this.handleError);
            
            // Listen for specific bitbank events
            this.socket.on('ticker', this.handleMessage);
            this.socket.on('room-stream', this.handleMessage);
            
        } catch (error) {
            console.error('WebSocket connection error:', error);
            this.handleError(error);
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.isConnected = false;
    }

    handleConnect() {
        console.log('Connected to bitbank WebSocket');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to BTC/JPY ticker
        this.subscribe('ticker_btc_jpy');
        
        this.callbacks.onConnect.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Error in connect callback:', error);
            }
        });
    }

    handleDisconnect(reason) {
        console.log('Disconnected from bitbank WebSocket:', reason);
        this.isConnected = false;
        
        this.callbacks.onDisconnect.forEach(callback => {
            try {
                callback(reason);
            } catch (error) {
                console.error('Error in disconnect callback:', error);
            }
        });

        // Auto-reconnect
        this.scheduleReconnect();
    }

    handleMessage(data) {
        try {
            console.log('Received message:', data); // Debug log
            
            // Handle different message formats
            let tickerData = null;
            
            if (data && typeof data === 'object') {
                // Check for various bitbank message formats
                if (data.room_name === 'ticker_btc_jpy' && data.message) {
                    tickerData = data.message;
                } else if (data.type === 'ticker') {
                    tickerData = data.message || data;
                } else if (data.sell && data.buy && data.last) {
                    tickerData = data;
                } else if (Array.isArray(data) && data.length > 0) {
                    // Sometimes data comes as array
                    tickerData = data[0];
                }
            }

            if (tickerData && tickerData.last) {
                console.log('Processing ticker data:', tickerData); // Debug log
                
                this.lastPrice = {
                    price: parseFloat(tickerData.last),
                    sell: parseFloat(tickerData.sell),
                    buy: parseFloat(tickerData.buy),
                    timestamp: tickerData.timestamp || Date.now()
                };

                console.log('Updated price:', this.lastPrice); // Debug log

                this.callbacks.onMessage.forEach(callback => {
                    try {
                        callback(this.lastPrice);
                    } catch (error) {
                        console.error('Error in message callback:', error);
                    }
                });
            } else {
                console.log('No valid ticker data found in message'); // Debug log
            }
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    handleError(error) {
        console.error('WebSocket error:', error);
        
        this.callbacks.onError.forEach(callback => {
            try {
                callback(error);
            } catch (error) {
                console.error('Error in error callback:', error);
            }
        });
    }

    subscribe(channel) {
        if (this.socket && this.isConnected) {
            console.log(`Subscribing to channel: ${channel}`);
            this.socket.emit('join-room', channel);
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms`);
            
            setTimeout(() => {
                if (!this.isConnected) {
                    this.connect();
                }
            }, delay);
        } else {
            console.error('Max reconnect attempts reached');
        }
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

    // Get current connection status
    getStatus() {
        return {
            connected: this.isConnected,
            reconnectAttempts: this.reconnectAttempts,
            lastPrice: this.lastPrice
        };
    }
}