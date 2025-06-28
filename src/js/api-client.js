class ApiClient {
    constructor() {
        this.baseUrl = 'https://public.bitbank.cc';
        this.symbol = 'btc_jpy';
    }

    async fetchCandlesticks(timeframe, count = 100) {
        try {
            console.log(`Fetching ${count} ${timeframe} candlesticks from multiple days...`);
            
            // Calculate how many days we need based on timeframe
            const daysNeeded = this.calculateDaysNeeded(timeframe, count);
            
            let dates = [];
            
            if (daysNeeded === 0) {
                // Long-term timeframes: use year-based fetching
                console.log(`Fetching year data for ${timeframe} to get ${count} candles`);
                dates = this.getYearStrings();
            } else {
                // Short-term timeframes: use day-based fetching
                console.log(`Need data from ${daysNeeded} days for ${count} ${timeframe} candles`);
                dates = this.getDateStrings(daysNeeded);
            }
            
            let allCandles = [];
            
            // Fetch data from multiple days
            for (const dateString of dates) {
                try {
                    // Use different date format based on timeframe
                    const dateFormat = this.getDateFormat(timeframe, dateString);
                    const url = `${this.baseUrl}/${this.symbol}/candlestick/${timeframe}/${dateFormat}`;
                    console.log('Fetching from:', url);
                    
                    const response = await fetch(url);
                    
                    if (!response.ok) {
                        console.warn(`Failed to fetch data for ${dateString}: ${response.status}`);
                        continue;
                    }
                    
                    const data = await response.json();
                    
                    if (!data.success || !data.data.candlestick[0]) {
                        console.warn(`No candlestick data for ${dateString}`);
                        continue;
                    }
                    
                    // Extract candlestick data for this day
                    const candlesticks = data.data.candlestick[0].ohlcv;
                    
                    // Convert to our format
                    const formattedCandles = candlesticks.map(candle => ({
                        timestamp: parseInt(candle[5]), // timestamp
                        open: parseFloat(candle[0]),    // open
                        high: parseFloat(candle[1]),    // high
                        low: parseFloat(candle[2]),     // low
                        close: parseFloat(candle[3]),   // close
                        volume: parseFloat(candle[4])   // volume
                    }));
                    
                    allCandles = allCandles.concat(formattedCandles);
                    console.log(`Added ${formattedCandles.length} candles from ${dateString}`);
                    
                } catch (dayError) {
                    console.warn(`Error fetching data for ${dateString}:`, dayError);
                    continue;
                }
            }
            
            // Sort by timestamp to ensure correct order
            allCandles.sort((a, b) => a.timestamp - b.timestamp);
            
            // Get the most recent 'count' candles
            const recentCandles = allCandles.slice(-count);
            
            console.log(`Total collected: ${allCandles.length} candles, returning ${recentCandles.length} most recent`);
            console.log('Data range:', {
                first: recentCandles[0] ? new Date(recentCandles[0].timestamp).toLocaleString() : 'none',
                last: recentCandles[recentCandles.length - 1] ? new Date(recentCandles[recentCandles.length - 1].timestamp).toLocaleString() : 'none'
            });
            
            return recentCandles;
            
        } catch (error) {
            console.error('Error fetching candlesticks:', error);
            
            // Return mock data as fallback
            return this.generateMockCandlesticks(timeframe, count);
        }
    }

    calculateDaysNeeded(timeframe, count) {
        // Different logic for short-term vs long-term timeframes
        const shortTermFrames = ['1min', '5min', '15min', '30min', '1hour'];
        const longTermFrames = ['4hour', '8hour', '12hour', '1day', '1week', '1month'];
        
        if (longTermFrames.includes(timeframe)) {
            // For long-term timeframes, we need to fetch full year data
            // Return 0 to indicate we need year-based fetching
            return 0;
        }
        
        // For short-term timeframes, calculate days needed
        const candlesPerDay = {
            '1min': 1440,   // 24 * 60
            '5min': 288,    // 24 * 12
            '15min': 96,    // 24 * 4
            '30min': 48,    // 24 * 2
            '1hour': 24,    // 24 * 1
        };
        
        const dailyCandles = candlesPerDay[timeframe] || 288;
        const daysNeeded = Math.ceil(count / dailyCandles) + 1; // +1 for safety margin
        
        // Minimum 2 days, maximum 10 days to avoid too many API calls
        return Math.max(2, Math.min(10, daysNeeded));
    }

    getDateStrings(days) {
        const dates = [];
        const now = new Date();
        
        // Get dates from 'days' ago to today
        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            dates.push(`${year}${month}${day}`);
        }
        
        console.log('Fetching data from dates:', dates);
        return dates;
    }

    getYearStrings() {
        // For long-term timeframes, get current and previous year
        const currentYear = new Date().getFullYear();
        const years = [
            String(currentYear - 1), // Previous year  
            String(currentYear)       // Current year
        ];
        
        console.log('Fetching data from years:', years);
        return years;
    }

    getDateFormat(timeframe, dateString) {
        // Different date formats for different timeframes
        const shortTermFrames = ['1min', '5min', '15min', '30min', '1hour'];
        const longTermFrames = ['4hour', '8hour', '12hour', '1day', '1week', '1month'];
        
        if (shortTermFrames.includes(timeframe)) {
            // Use YYYYMMDD format
            return dateString;
        } else if (longTermFrames.includes(timeframe)) {
            // Use YYYY format (year only)
            return dateString.substring(0, 4);
        }
        
        // Default to YYYYMMDD
        return dateString;
    }

    getCurrentDateString() {
        // bitbank API expects date in YYYYMMDD format
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    getTimeframeMilliseconds(timeframe) {
        const timeframes = {
            '1min': 60 * 1000,
            '5min': 5 * 60 * 1000,
            '15min': 15 * 60 * 1000,
            '30min': 30 * 60 * 1000,
            '1hour': 60 * 60 * 1000,
            '4hour': 4 * 60 * 60 * 1000,
            '1day': 24 * 60 * 60 * 1000
        };
        return timeframes[timeframe] || timeframes['5min'];
    }

    // Fallback mock data generator
    generateMockCandlesticks(timeframe, count) {
        console.log('Generating mock candlestick data...');
        
        const interval = this.getTimeframeMilliseconds(timeframe);
        const now = Date.now();
        let basePrice = 15500000; // Starting around current BTC price
        
        const candles = [];
        
        for (let i = count - 1; i >= 0; i--) {
            const timestamp = now - (i * interval);
            
            // Generate realistic OHLCV data
            const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
            const open = Math.round(basePrice * (1 + variation));
            
            const highVariation = Math.random() * 0.005; // +0.5% max
            const lowVariation = -Math.random() * 0.005; // -0.5% max
            
            const high = Math.round(open * (1 + highVariation));
            const low = Math.round(open * (1 + lowVariation));
            
            const closeVariation = (Math.random() - 0.5) * 0.01; // ±0.5%
            const close = Math.round(open * (1 + closeVariation));
            
            const volume = Math.random() * 100 + 10; // 10-110 BTC
            
            candles.push({
                timestamp: timestamp,
                open: open,
                high: Math.max(open, high, close),
                low: Math.min(open, low, close),
                close: close,
                volume: volume
            });
            
            // Update base price for next candle
            basePrice = close;
        }
        
        console.log(`Generated ${candles.length} mock candles`);
        return candles;
    }

    // Convert candles to chart data (close prices only)
    candlesToChartData(candles) {
        return candles.map(candle => ({
            x: new Date(candle.timestamp),
            y: candle.close
        }));
    }

    // Get timeframe display info
    getTimeframeInfo(timeframe) {
        const info = {
            '1min': { label: '1分足', interval: '1分', period: '1時間40分' },
            '5min': { label: '5分足', interval: '5分', period: '8時間20分' },
            '15min': { label: '15分足', interval: '15分', period: '1日1時間' },
            '30min': { label: '30分足', interval: '30分', period: '2日2時間' },
            '1hour': { label: '1時間足', interval: '1時間', period: '4日4時間' },
            '4hour': { label: '4時間足', interval: '4時間', period: '16日16時間' },
            '1day': { label: '1日足', interval: '1日', period: '約3ヶ月' }
        };
        
        return info[timeframe] || info['5min'];
    }
}