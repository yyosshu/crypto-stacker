class ProfitLossDisplay {
    constructor(positionManager) {
        this.positionManager = positionManager;
        this.initializeElements();
        this.setupEventListeners();
        this.setInitialFocus();
    }

    initializeElements() {
        this.formSection = document.getElementById('positionForm');
        this.priceInput = document.getElementById('purchasePrice');
        this.quantityInput = document.getElementById('purchaseQuantity');
        this.dateInput = document.getElementById('purchaseDate');
        this.addButton = document.getElementById('addPositionBtn');
        this.tableBody = document.getElementById('positionsTableBody');
        this.totalProfitLoss = document.getElementById('totalProfitLoss');
        this.totalProfitLossRate = document.getElementById('totalProfitLossRate');
        this.noPositionsMessage = document.getElementById('noPositionsMessage');
        this.positionsTable = document.getElementById('positionsTable');
        this.errorMessage = document.getElementById('errorMessage');
    }

    setupEventListeners() {
        this.addButton.addEventListener('click', () => this.handleAddPosition());
        
        this.priceInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddPosition();
        });
        
        this.quantityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddPosition();
        });
        
        this.dateInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddPosition();
        });

        this.priceInput.addEventListener('input', () => this.clearError());
        this.quantityInput.addEventListener('input', () => this.clearError());
        this.dateInput.addEventListener('input', () => this.clearError());
    }

    handleAddPosition() {
        const price = this.priceInput.value.trim();
        const quantity = this.quantityInput.value.trim();
        const date = this.dateInput.value.trim();

        if (!price || !quantity) {
            this.showError('価格と数量を入力してください');
            return;
        }

        try {
            const position = this.positionManager.addPosition(price, quantity, date);
            this.priceInput.value = '';
            this.quantityInput.value = '';
            this.dateInput.value = '';
            this.clearError();
            this.render();
            this.dateInput.focus();
        } catch (error) {
            this.showError(error.message);
        }
    }

    handleRemovePosition(id) {
        if (confirm('このポジションを削除しますか？')) {
            this.positionManager.removePosition(id);
            this.render();
        }
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
    }

    clearError() {
        this.errorMessage.style.display = 'none';
    }

    updateCurrentPrice(price) {
        this.positionManager.updateCurrentPrice(price);
        this.render();
    }

    render() {
        const positions = this.positionManager.getAllPositions();
        const totalData = this.positionManager.getTotalProfitLoss();

        this.renderPositionsTable(positions);
        this.renderTotalProfitLoss(totalData);
        this.toggleNoPositionsMessage(positions.length === 0);
    }

    renderPositionsTable(positions) {
        if (positions.length === 0) {
            this.tableBody.innerHTML = '';
            return;
        }

        this.tableBody.innerHTML = positions.map(position => `
            <tr>
                <td class="purchase-date">${this.positionManager.formatDate(position.purchaseDate)}</td>
                <td>¥${position.purchasePrice.toLocaleString('ja-JP')}</td>
                <td>${position.quantity.toFixed(8)} BTC</td>
                <td class="profit-loss ${position.isProfit ? 'profit' : 'loss'}">
                    ${position.profitLossFormatted}
                </td>
                <td>
                    <button class="remove-btn" onclick="profitLossDisplay.handleRemovePosition('${position.id}')">
                        削除
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderTotalProfitLoss(totalData) {
        this.totalProfitLoss.textContent = totalData.totalFormatted;
        this.totalProfitLoss.className = `total-value ${totalData.isProfit ? 'profit' : 'loss'}`;
        
        this.totalProfitLossRate.textContent = totalData.profitLossRateFormatted;
        this.totalProfitLossRate.className = `total-rate ${totalData.isProfit ? 'profit' : 'loss'}`;
    }

    toggleNoPositionsMessage(show) {
        this.noPositionsMessage.style.display = show ? 'block' : 'none';
        this.positionsTable.style.display = show ? 'none' : 'table';
    }

    setInitialFocus() {
        setTimeout(() => {
            if (this.dateInput) {
                this.dateInput.focus();
            }
        }, 100);
    }
}