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
                }, {
                    label: 'Positions',
                    type: 'scatter',
                    data: [],
                    pointRadius: 8,
                    pointHoverRadius: 12,
                    pointBackgroundColor: function(context) {
                        const data = context.raw;
                        if (!data || !data.position || !data.currentPrice) return '#9CA3AF';
                        const profitLoss = (data.currentPrice - data.position.purchasePrice) * data.position.quantity;
                        return profitLoss >= 0 ? '#16a34a' : '#dc2626';
                    },
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    showLine: false
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
                        enabled: false
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
        this.setupCustomTooltip();
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

    setupCustomTooltip() {
        this.setupCrosshair();
        
        // Add mouse event listeners to canvas
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseleave', this.hideCrosshair.bind(this));
    }

    setupCrosshair() {
        // Create crosshair elements
        const chartContainer = this.canvas.parentElement;
        
        // Create crosshair lines container
        this.crosshairContainer = document.createElement('div');
        this.crosshairContainer.className = 'crosshair-container';
        this.crosshairContainer.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10;
        `;
        
        // Vertical line
        this.verticalLine = document.createElement('div');
        this.verticalLine.className = 'crosshair-vertical';
        this.verticalLine.style.cssText = `
            position: absolute;
            width: 0;
            height: 100%;
            border-left: 2px dashed #C8A882;
            opacity: 0;
            transition: opacity 0.1s ease;
        `;
        
        // Horizontal line
        this.horizontalLine = document.createElement('div');
        this.horizontalLine.className = 'crosshair-horizontal';
        this.horizontalLine.style.cssText = `
            position: absolute;
            width: 100%;
            height: 0;
            border-top: 2px dashed #C8A882;
            opacity: 0;
            transition: opacity 0.1s ease;
        `;
        
        // X-axis label (time)
        this.xAxisLabel = document.createElement('div');
        this.xAxisLabel.className = 'crosshair-x-label';
        this.xAxisLabel.style.cssText = `
            position: absolute;
            background: #C8A882;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.1s ease;
            transform: translateX(-50%);
        `;
        
        // Y-axis label (price)
        this.yAxisLabel = document.createElement('div');
        this.yAxisLabel.className = 'crosshair-y-label';
        this.yAxisLabel.style.cssText = `
            position: absolute;
            background: #C8A882;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 500;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.1s ease;
            transform: translateY(-50%);
        `;
        
        // Add elements to container
        this.crosshairContainer.appendChild(this.verticalLine);
        this.crosshairContainer.appendChild(this.horizontalLine);
        this.crosshairContainer.appendChild(this.xAxisLabel);
        this.crosshairContainer.appendChild(this.yAxisLabel);
        
        // Add container to chart container
        chartContainer.appendChild(this.crosshairContainer);
    }

    handleMouseMove(event) {
        if (!this.chart || this.dataPoints.length === 0) return;

        const rect = this.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Use Chart.js built-in method to get elements at mouse position
        const points = this.chart.getElementsAtEventForMode(event, 'index', { intersect: false }, false);
        
        if (points.length > 0) {
            // Get the first (nearest) point that Chart.js found
            const point = points[0];
            const datasetIndex = point.datasetIndex;
            const dataIndex = point.index;
            
            // Get the actual data point
            const dataPoint = this.dataPoints[dataIndex];
            
            if (dataPoint) {
                // Use Chart.js's own calculated position
                const pointElement = this.chart.getDatasetMeta(datasetIndex).data[dataIndex];
                
                // Chart.js's calculated position is now used directly"
                
                this.showCrosshair(dataPoint, pointElement.x, pointElement.y);
            }
        } else {
            this.hideCrosshair();
        }
    }

    findNearestDataPoint(mouseX, mouseY) {
        const chartArea = this.chart.chartArea;
        
        // Convert mouse position to chart data coordinates
        const xScale = this.chart.scales.x;
        const yScale = this.chart.scales.y;
        
        if (mouseX < chartArea.left || mouseX > chartArea.right ||
            mouseY < chartArea.top || mouseY > chartArea.bottom) {
            return null;
        }

        // Find closest data point by X coordinate
        const mouseTime = xScale.getValueForPixel(mouseX);
        let closestPoint = null;
        let minDistance = Infinity;

        this.dataPoints.forEach((point, index) => {
            const pointTime = new Date(point.x).getTime();
            const distance = Math.abs(pointTime - mouseTime);
            
            if (distance < minDistance) {
                minDistance = distance;
                closestPoint = { ...point, index };
            }
        });

        return closestPoint;
    }

    showCrosshair(dataPoint, pointX, pointY) {
        if (!dataPoint) return;

        const chartArea = this.chart.chartArea;
        
        // Convert Chart.js canvas coordinates to container coordinates
        // Chart.js provides canvas-relative coordinates, need to adjust for container offset
        const canvasRect = this.canvas.getBoundingClientRect();
        const containerRect = this.crosshairContainer.getBoundingClientRect();
        
        // Calculate offset between canvas and container
        const offsetX = canvasRect.left - containerRect.left;
        const offsetY = canvasRect.top - containerRect.top;
        
        // Adjust coordinates
        const dataX = pointX + offsetX;
        const dataY = pointY + offsetY;
        
        // Show crosshair lines positioned at exact Chart.js point position
        this.verticalLine.style.left = dataX + 'px';
        this.verticalLine.style.top = chartArea.top + 'px';
        this.verticalLine.style.height = (chartArea.bottom - chartArea.top) + 'px';
        this.verticalLine.style.opacity = '0.8';
        
        this.horizontalLine.style.left = chartArea.left + 'px';
        this.horizontalLine.style.top = dataY + 'px';
        this.horizontalLine.style.width = (chartArea.right - chartArea.left) + 'px';
        this.horizontalLine.style.opacity = '0.8';
        
        // Format and show labels
        const price = dataPoint.y;
        const time = new Date(dataPoint.x);
        
        // Format price
        const formattedPrice = new Intl.NumberFormat('ja-JP').format(Math.round(price));
        
        // Format time based on timeframe
        let formattedTime;
        if (this.currentTimeframe === '1day') {
            formattedTime = time.toLocaleDateString('ja-JP', {
                month: '2-digit',
                day: '2-digit'
            });
        } else {
            formattedTime = time.toLocaleTimeString('ja-JP', {
                hour: '2-digit',
                minute: '2-digit'
            });
        }
        
        // Position X-axis label outside chart area (below the chart)
        this.xAxisLabel.textContent = formattedTime;
        this.xAxisLabel.style.left = dataX + 'px';
        this.xAxisLabel.style.top = (chartArea.bottom + 15) + 'px';
        this.xAxisLabel.style.opacity = '1';
        
        // Position Y-axis label outside chart area (right of the chart)
        this.yAxisLabel.textContent = '¥' + formattedPrice;
        this.yAxisLabel.style.left = (chartArea.right + 15) + 'px';
        this.yAxisLabel.style.top = dataY + 'px';
        this.yAxisLabel.style.opacity = '1';
    }

    hideCrosshair() {
        if (this.verticalLine) this.verticalLine.style.opacity = '0';
        if (this.horizontalLine) this.horizontalLine.style.opacity = '0';
        if (this.xAxisLabel) this.xAxisLabel.style.opacity = '0';
        if (this.yAxisLabel) this.yAxisLabel.style.opacity = '0';
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

    // Update positions data
    updatePositions(positions, currentPrice) {
        if (!this.chart || !positions) return;
        
        // Filter positions within chart time range
        const chartTimeRange = this.getChartTimeRange();
        const chartPriceRange = this.getChartPriceRange();
        
        const displayablePositions = positions.filter(position => {
            return this.isPositionDisplayable(position, chartTimeRange, chartPriceRange);
        });
        
        // Convert positions to chart data format
        const positionData = displayablePositions.map(position => ({
            x: new Date(position.timestamp).toISOString(),
            y: position.purchasePrice,
            position: position,
            currentPrice: currentPrice
        }));
        
        // Update positions dataset
        this.chart.data.datasets[1].data = positionData;
        this.chart.update('none');
    }

    // Get chart time range for position filtering
    getChartTimeRange() {
        if (this.dataPoints.length === 0) return { min: 0, max: 0 };
        
        const timestamps = this.dataPoints.map(point => new Date(point.x).getTime());
        return {
            min: Math.min(...timestamps),
            max: Math.max(...timestamps)
        };
    }

    // Get chart price range for position filtering
    getChartPriceRange() {
        if (this.dataPoints.length === 0) return { min: 0, max: 0 };
        
        const prices = this.dataPoints.map(point => point.y);
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const padding = (maxPrice - minPrice) * 0.05;
        
        return {
            min: minPrice - padding,
            max: maxPrice + padding
        };
    }

    // Check if position should be displayed on chart
    isPositionDisplayable(position, chartTimeRange, chartPriceRange) {
        const inTimeRange = position.timestamp >= chartTimeRange.min && 
                           position.timestamp <= chartTimeRange.max;
        const inPriceRange = position.purchasePrice >= chartPriceRange.min && 
                            position.purchasePrice <= chartPriceRange.max;
        return inTimeRange && inPriceRange;
    }
}