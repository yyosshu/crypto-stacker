class ChartDisplay {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.chart = null;
        this.dataPoints = [];
        this.maxDataPoints = 100; // Fixed count for all timeframes
        this.currentTimeframe = '5min';
        
        // Chart configuration
        this.chartConfig = {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'BTC/JPY',
                    data: [],
                    borderColor: '#C8A882',
                    backgroundColor: 'transparent',
                    borderWidth: 2.5,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#C8A882',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: false,
                        external: this.customTooltip.bind(this)
                    }
                },
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            displayFormats: {
                                minute: 'HH:mm',
                                hour: 'HH:mm',
                                day: 'MM/dd'
                            },
                            unit: 'minute'
                        },
                        grid: {
                            display: true,
                            color: '#E5E7EB',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#9CA3AF',
                            font: {
                                size: 11
                            },
                            maxTicksLimit: 8
                        }
                    },
                    y: {
                        position: 'right',
                        grid: {
                            display: true,
                            color: '#E5E7EB',
                            lineWidth: 1
                        },
                        ticks: {
                            color: '#9CA3AF',
                            font: {
                                size: 11
                            },
                            callback: function(value) {
                                return new Intl.NumberFormat('ja-JP').format(value);
                            }
                        }
                    }
                },
                animation: {
                    duration: 750,
                    easing: 'easeInOutQuart'
                }
            }
        };
        
        this.initChart();
        this.setupTooltip();
    }

    initChart() {
        // Initialize Chart.js (no gradient needed for line chart)
        this.chart = new Chart(this.ctx, this.chartConfig);
    }

    updateTimeUnit(timeframe) {
        // Update time unit based on timeframe
        const timeUnits = {
            '1min': 'minute',
            '5min': 'minute',
            '15min': 'minute',
            '30min': 'minute',
            '1hour': 'hour',
            '4hour': 'hour',
            '1day': 'day'
        };
        
        this.chart.options.scales.x.time.unit = timeUnits[timeframe] || 'minute';
        this.chart.update('none');
    }

    // Update current candle (real-time updates)
    updateCurrentCandle(candleData) {
        if (!candleData) return;
        
        if (this.dataPoints.length === 0) {
            // First candle
            this.dataPoints.push(candleData);
        } else {
            // Update the last (current) candle
            this.dataPoints[this.dataPoints.length - 1] = candleData;
        }
        
        // Update chart data
        this.updateChartData();
        
        // Update chart without animation for smooth real-time updates
        this.chart.update('none');
    }

    // Add new completed candle
    addCompletedCandle(candleData) {
        if (!candleData) return;
        
        console.log('Adding completed candle to chart:', candleData);
        
        // Add new candle
        this.dataPoints.push(candleData);
        
        // Remove old data points if exceeded limit
        if (this.dataPoints.length > this.maxDataPoints) {
            this.dataPoints.shift();
        }
        
        // Update chart data
        this.updateChartData();
        
        // Update chart with smooth animation
        this.chart.update('resize');
    }

    updateChartData() {
        if (!this.chart) return;
        
        // Update chart datasets
        this.chart.data.labels = this.dataPoints.map(point => point.x);
        this.chart.data.datasets[0].data = this.dataPoints;
        
        // Update Y-axis range for better visualization
        this.updateYAxisRange();
    }

    updateYAxisRange() {
        if (this.dataPoints.length === 0) return;
        
        const prices = this.dataPoints.map(point => point.y);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const padding = (maxPrice - minPrice) * 0.05; // 5% padding
        
        this.chart.options.scales.y.min = Math.floor(minPrice - padding);
        this.chart.options.scales.y.max = Math.ceil(maxPrice + padding);
    }

    changeTimeframe(timeframe) {
        this.currentTimeframe = timeframe;
        this.maxDataPoints = 100; // Fixed count for all timeframes
        
        // Update time unit and display format
        this.updateTimeUnit(timeframe);
        
        // Clear current data
        this.dataPoints = [];
        this.updateChartData();
        this.chart.update();
        
        console.log(`Changed to ${timeframe} timeframe`);
    }

    updateTimeFormat(period) {
        let displayFormat;
        
        switch (period) {
            case '15m':
            case '30m':
            case '1h':
                displayFormat = { minute: 'HH:mm' };
                break;
            case '3h':
            case '6h':
            case '12h':
                displayFormat = { hour: 'HH:mm' };
                break;
            case '1d':
                displayFormat = { hour: 'MM/DD HH:mm' };
                break;
            case '1w':
            case '1m':
                displayFormat = { day: 'MM/DD' };
                break;
            case '1y':
                displayFormat = { month: 'YYYY/MM' };
                break;
            default:
                displayFormat = { minute: 'HH:mm' };
        }
        
        this.chart.options.scales.x.time.displayFormats = displayFormat;
    }

    setupTooltip() {
        this.tooltipEl = document.getElementById('chartTooltip');
    }

    customTooltip(context) {
        const tooltip = context.tooltip;
        
        if (!this.tooltipEl) return;
        
        // Hide tooltip if no data
        if (tooltip.opacity === 0) {
            this.tooltipEl.style.opacity = 0;
            return;
        }
        
        // Get tooltip data
        const dataPoint = tooltip.dataPoints[0];
        if (!dataPoint) return;
        
        const price = dataPoint.parsed.y;
        const time = new Date(dataPoint.parsed.x);
        
        // Format price
        const formattedPrice = new Intl.NumberFormat('ja-JP').format(Math.round(price));
        
        // Format time
        const formattedTime = time.toLocaleTimeString('ja-JP', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Update tooltip content
        this.tooltipEl.querySelector('.tooltip-price').textContent = `¥${formattedPrice}`;
        this.tooltipEl.querySelector('.tooltip-time').textContent = formattedTime;
        
        // Position tooltip
        const canvas = this.chart.canvas;
        const rect = canvas.getBoundingClientRect();
        
        this.tooltipEl.style.opacity = 1;
        this.tooltipEl.style.left = rect.left + tooltip.caretX - this.tooltipEl.offsetWidth / 2 + 'px';
        this.tooltipEl.style.top = rect.top + tooltip.caretY - this.tooltipEl.offsetHeight - 10 + 'px';
    }

    // Add real-time pulsing dot at the latest price
    addRealTimeDot() {
        if (this.dataPoints.length === 0) return;
        
        const lastPoint = this.dataPoints[this.dataPoints.length - 1];
        
        // Update the chart to show the latest point with special styling
        this.chart.data.datasets[0].pointRadius = this.dataPoints.map((_, index) => 
            index === this.dataPoints.length - 1 ? 4 : 0
        );
        
        this.chart.update('none');
    }

    // Load candlestick data and convert to chart data
    async loadCandlestickData(apiClient, timeframe, candleManager) {
        try {
            console.log(`Loading candlestick data for ${timeframe}...`);
            
            // Fetch candlestick data
            const candles = await apiClient.fetchCandlesticks(timeframe, this.maxDataPoints);
            
            // Load into candle manager and get chart data
            const chartData = candleManager.loadHistoricalCandles(candles);
            
            // Replace current data
            this.dataPoints = chartData;
            this.updateChartData();
            this.chart.update();
            
            console.log(`Loaded ${chartData.length} data points for ${timeframe}`);
            
        } catch (error) {
            console.error('Error loading candlestick data:', error);
        }
    }

    // Get current chart data for analysis
    getCurrentData() {
        return {
            points: this.dataPoints,
            timeframe: this.currentTimeframe,
            latest: this.dataPoints[this.dataPoints.length - 1]
        };
    }

    // Clear all data
    clearData() {
        this.dataPoints = [];
        this.updateChartData();
        this.chart.update();
    }
}