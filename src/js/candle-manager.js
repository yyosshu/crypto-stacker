class CandleManager {
    constructor(timeframe) {
        this.timeframe = timeframe;
        this.interval = this.getIntervalMilliseconds(timeframe);
        this.currentCandle = null;
        this.completedCandles = [];
        this.callbacks = {
            onCandleUpdate: [],
            onCandleComplete: []
        };
    }

    getIntervalMilliseconds(timeframe) {
        const intervals = {
            '1min': 60 * 1000,
            '5min': 5 * 60 * 1000,
            '15min': 15 * 60 * 1000,
            '30min': 30 * 60 * 1000,
            '1hour': 60 * 60 * 1000,
            '4hour': 4 * 60 * 60 * 1000,
            '1day': 24 * 60 * 60 * 1000
        };
        return intervals[timeframe] || intervals['5min'];
    }

    addTick(priceData) {
        const timestamp = priceData.timestamp || Date.now();
        const price = priceData.price;
        
        // Calculate candle start time (aligned to timeframe interval)
        const candleStartTime = this.getCandleStartTime(timestamp);
        
        // Check if we need to start a new candle
        if (!this.currentCandle || this.currentCandle.startTime !== candleStartTime) {
            // Complete the previous candle if it exists
            if (this.currentCandle) {
                this.completeCurrentCandle();
            }
            
            // Start new candle
            this.currentCandle = {
                startTime: candleStartTime,
                endTime: candleStartTime + this.interval,
                open: price,
                high: price,
                low: price,
                close: price,
                volume: priceData.volume || 0,
                tickCount: 1
            };
            
            console.log(`Started new ${this.timeframe} candle at ${new Date(candleStartTime).toLocaleTimeString()}`);
        } else {
            // Update current candle
            this.currentCandle.high = Math.max(this.currentCandle.high, price);
            this.currentCandle.low = Math.min(this.currentCandle.low, price);
            this.currentCandle.close = price; // Always update close to latest price
            this.currentCandle.volume = priceData.volume || this.currentCandle.volume;
            this.currentCandle.tickCount++;
        }
        
        // Notify about current candle update
        this.callbacks.onCandleUpdate.forEach(callback => {
            try {
                callback(this.getCurrentCandleForChart());
            } catch (error) {
                console.error('Error in candle update callback:', error);
            }
        });
    }

    getCandleStartTime(timestamp) {
        // Align timestamp to timeframe interval
        return Math.floor(timestamp / this.interval) * this.interval;
    }

    completeCurrentCandle() {
        if (!this.currentCandle) return;
        
        console.log(`Completed ${this.timeframe} candle:`, {
            time: new Date(this.currentCandle.startTime).toLocaleTimeString(),
            close: this.currentCandle.close,
            ticks: this.currentCandle.tickCount
        });
        
        // Add to completed candles
        this.completedCandles.push({ ...this.currentCandle });
        
        // Keep only recent candles (limit to 200)
        if (this.completedCandles.length > 200) {
            this.completedCandles.shift();
        }
        
        // Notify about candle completion
        this.callbacks.onCandleComplete.forEach(callback => {
            try {
                callback(this.getCompletedCandleForChart(this.currentCandle));
            } catch (error) {
                console.error('Error in candle complete callback:', error);
            }
        });
    }

    getCurrentCandleForChart() {
        if (!this.currentCandle) return null;
        
        return {
            x: new Date(this.currentCandle.startTime),
            y: this.currentCandle.close,
            isCurrentCandle: true
        };
    }

    getCompletedCandleForChart(candle) {
        return {
            x: new Date(candle.startTime),
            y: candle.close,
            isCurrentCandle: false
        };
    }

    // Initialize with historical data
    loadHistoricalCandles(historicalData) {
        console.log(`Loading ${historicalData.length} historical candles for ${this.timeframe}`);
        
        // Convert historical data to chart format
        const chartData = historicalData.map(candle => ({
            x: new Date(candle.timestamp),
            y: candle.close,
            isCurrentCandle: false
        }));
        
        // Clear current state
        this.currentCandle = null;
        this.completedCandles = historicalData.slice(); // Copy array
        
        return chartData;
    }

    // Get all candles for chart (historical + current)
    getAllCandlesForChart() {
        const historicalChartData = this.completedCandles.map(candle => ({
            x: new Date(candle.timestamp || candle.startTime),
            y: candle.close,
            isCurrentCandle: false
        }));
        
        const currentChartData = this.getCurrentCandleForChart();
        
        if (currentChartData) {
            return [...historicalChartData, currentChartData];
        }
        
        return historicalChartData;
    }

    // Change timeframe
    changeTimeframe(newTimeframe) {
        console.log(`Changing timeframe from ${this.timeframe} to ${newTimeframe}`);
        
        this.timeframe = newTimeframe;
        this.interval = this.getIntervalMilliseconds(newTimeframe);
        
        // Reset current candle (will be recreated on next tick)
        this.currentCandle = null;
        this.completedCandles = [];
    }

    // Event listeners
    onCandleUpdate(callback) {
        this.callbacks.onCandleUpdate.push(callback);
    }

    onCandleComplete(callback) {
        this.callbacks.onCandleComplete.push(callback);
    }

    // Get timeframe info for display
    getTimeframeInfo() {
        const info = {
            '1min': { label: '1分足', interval: '1分' },
            '5min': { label: '5分足', interval: '5分' },
            '15min': { label: '15分足', interval: '15分' },
            '30min': { label: '30分足', interval: '30分' },
            '1hour': { label: '1時間足', interval: '1時間' },
            '4hour': { label: '4時間足', interval: '4時間' },
            '1day': { label: '1日足', interval: '1日' }
        };
        
        return info[this.timeframe] || { label: this.timeframe, interval: this.timeframe };
    }
}