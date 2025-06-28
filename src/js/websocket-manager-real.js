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
            
            // Connect to bitbank using socket.io
            this.socket = io(this.url, {
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
            
            // Listen for all events to debug
            this.socket.onAny((eventName, ...args) => {
                console.log('Socket.IO event:', eventName, args);
            });
            
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
        
        // Subscribe to BTC/JPY ticker using bitbank's format
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

    handleMessage(...args) {
        try {
            console.log('Received raw message:', args);
            
            // bitbank sends messages in specific format
            // Look for ticker messages
            for (const arg of args) {
                if (this.parseTickerMessage(arg)) {
                    break;
                }
            }
            
        } catch (error) {
            console.error('Error handling message:', error);
        }
    }

    parseTickerMessage(data) {
        try {
            let tickerData = null;
            
            // Handle different possible message formats from bitbank
            if (Array.isArray(data) && data.length >= 2) {
                // Format: ["message", {room_name: "ticker_btc_jpy", message: {data: {...}}}]
                if (data[0] === 'message' && data[1] && data[1].room_name === 'ticker_btc_jpy') {
                    tickerData = data[1].message?.data;
                }
            } else if (data && typeof data === 'object') {
                // Check for direct ticker data
                if (data.room_name === 'ticker_btc_jpy' && data.message) {
                    tickerData = data.message.data || data.message;
                } else if (data.sell && data.buy && data.last) {
                    tickerData = data;
                }
            }

            if (tickerData && tickerData.last) {
                console.log('Processing ticker data:', tickerData);
                
                this.lastPrice = {
                    price: parseFloat(tickerData.last),
                    sell: parseFloat(tickerData.sell),
                    buy: parseFloat(tickerData.buy),
                    volume: parseFloat(tickerData.vol || 0),
                    timestamp: tickerData.timestamp || Date.now()
                };

                console.log('Updated price:', this.lastPrice);

                this.callbacks.onMessage.forEach(callback => {
                    try {
                        callback(this.lastPrice);
                    } catch (error) {
                        console.error('Error in message callback:', error);
                    }
                });
                
                return true;
            }
            
            return false;
            
        } catch (error) {
            console.error('Error parsing ticker message:', error);
            return false;
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
            // Use bitbank's subscription format
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