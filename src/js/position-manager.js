class PositionManager {
    constructor() {
        this.positions = [];
        this.currentPrice = 0;
        this.chartDisplay = null; // Will be set from app.js
        this.loadPositions();
    }

    addPosition(purchasePrice, quantity, purchaseDate) {
        if (!this.validateInput(purchasePrice, quantity)) {
            throw new Error('Invalid input: price and quantity must be positive numbers');
        }

        const timestamp = purchaseDate ? new Date(purchaseDate).getTime() : Date.now();

        const position = {
            id: this.generateId(),
            purchasePrice: parseFloat(purchasePrice),
            quantity: parseFloat(quantity),
            purchaseDate: purchaseDate || new Date().toISOString().slice(0, 16),
            timestamp: timestamp
        };

        this.positions.push(position);
        this.savePositions();
        this.updateChart();
        return position;
    }

    removePosition(id) {
        const index = this.positions.findIndex(pos => pos.id === id);
        if (index !== -1) {
            this.positions.splice(index, 1);
            this.savePositions();
            this.updateChart();
            return true;
        }
        return false;
    }

    updateCurrentPrice(price) {
        this.currentPrice = parseFloat(price);
        this.updateChart();
    }

    calculateProfitLoss(position) {
        const profitLoss = (this.currentPrice - position.purchasePrice) * position.quantity;
        return {
            profitLoss: profitLoss,
            profitLossFormatted: this.formatCurrency(profitLoss),
            isProfit: profitLoss >= 0
        };
    }

    getTotalProfitLoss() {
        const total = this.positions.reduce((sum, position) => {
            return sum + this.calculateProfitLoss(position).profitLoss;
        }, 0);

        const totalInvestment = this.positions.reduce((sum, position) => {
            return sum + (position.purchasePrice * position.quantity);
        }, 0);

        const profitLossRate = totalInvestment > 0 ? (total / totalInvestment) * 100 : 0;

        return {
            total: total,
            totalFormatted: this.formatCurrency(total),
            totalInvestment: totalInvestment,
            profitLossRate: profitLossRate,
            profitLossRateFormatted: `${profitLossRate >= 0 ? '+' : ''}${profitLossRate.toFixed(2)}%`,
            isProfit: total >= 0
        };
    }

    getAllPositions() {
        return this.positions.map(position => ({
            ...position,
            ...this.calculateProfitLoss(position)
        }));
    }

    validateInput(price, quantity) {
        return !isNaN(price) && !isNaN(quantity) && 
               parseFloat(price) > 0 && parseFloat(quantity) > 0;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    formatCurrency(amount) {
        const absAmount = Math.abs(amount);
        const sign = amount >= 0 ? '+' : '-';
        return `${sign}¥${absAmount.toLocaleString('ja-JP', { maximumFractionDigits: 0 })}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    savePositions() {
        try {
            localStorage.setItem('crypto-stacker-positions', JSON.stringify(this.positions));
        } catch (error) {
            console.warn('Failed to save positions to localStorage:', error);
        }
    }

    loadPositions() {
        try {
            const saved = localStorage.getItem('crypto-stacker-positions');
            if (saved) {
                this.positions = JSON.parse(saved);
            }
        } catch (error) {
            console.warn('Failed to load positions from localStorage:', error);
            this.positions = [];
        }
    }

    // Set chart display instance for updates
    setChartDisplay(chartDisplay) {
        this.chartDisplay = chartDisplay;
        // Only update if we have current price data
        if (this.currentPrice > 0) {
            this.updateChart();
        }
    }

    // Update chart with current positions
    updateChart() {
        if (this.chartDisplay) {
            console.log('PositionManager.updateChart - currentPrice:', this.currentPrice);
            this.chartDisplay.updatePositions(this.positions, this.currentPrice);
        }
    }

}