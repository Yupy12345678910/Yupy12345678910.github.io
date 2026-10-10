// ==========================================
// STATE MANAGEMENT & MOCK DATA
// ==========================================
let currentUser = {
    username: "BuilderCharlie",
    robuxBalance: 25000.00,
    holdings: {} // ticker -> token amount
};

let coins = {
    "NOOB": {
        name: "Noob Coin",
        ticker: "NOOB",
        description: "The classic starting meme coin of Roblox.",
        imageUrl: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=150",
        creator: "Builderman",
        robuxReserve: 5500.00,
        tokenReserve: 1050000000,
        tokensAvailable: 750000000,
        k: 5500.00 * 1050000000,
        isGraduated: false,
        priceHistory: [0.000005, 0.0000052, 0.0000055],
        trades: [
            { type: 'BUY', amountR: 500, amountT: 95000000, time: '10:42 AM' }
        ]
    },
    "ROBUX": {
        name: "Infinite Robux",
        ticker: "ROBUX",
        description: "Definitely totally legitimate free robux generator coin.",
        imageUrl: "https://images.unsplash.com/photo-1622979135225-d2ba269bc1df?w=150",
        creator: "RobloxCorp",
        robuxReserve: 12000.00,
        tokenReserve: 950000000,
        tokensAvailable: 650000000,
        k: 12000.00 * 950000000,
        isGraduated: false,
        priceHistory: [0.000012, 0.000013, 0.0000126],
        trades: [
            { type: 'BUY', amountR: 1200, amountT: 80000000, time: '10:30 AM' }
        ]
    }
};

let currentTicker = null;
let currentTradeMode = 'buy';
let currentSort = 'marketCap';
let priceChartInstance = null;
const TOTAL_SUPPLY = 1000000000;
const GRADUATION_TARGET = 50000.00;

// Initialize App
window.onload = function() {
    updateBalanceDisplay();
    renderCoinGrid();
};

// ==========================================
// VIEW ROUTING
// ==========================================
function switchView(viewName, ticker = null) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    if (viewName === 'home') {
        document.getElementById('home-view').classList.add('active');
        renderCoinGrid();
    } else if (viewName === 'trade') {
        document.getElementById('trade-view').classList.add('active');
        currentTicker = ticker;
        loadCoinDetails(ticker);
    }
}

// ==========================================
// RENDER HOME COIN GRID
// ==========================================
function renderCoinGrid() {
    const grid = document.getElementById('coin-grid');
    const search = document.getElementById('search-input').value.toLowerCase();
    grid.innerHTML = '';

    let coinList = Object.values(coins);

    // Filter by search
    coinList = coinList.filter(c => c.name.toLowerCase().includes(search) || c.ticker.toLowerCase().includes(search));

    // Sort
    if (currentSort === 'marketCap') {
        coinList.sort((a, b) => (b.robuxReserve / b.tokenReserve) - (a.robuxReserve / a.tokenReserve));
    } else {
        coinList.reverse();
    }

    if (coinList.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-muted)">No coins found.</p>`;
        return;
    }

    coinList.forEach(coin => {
        const price = coin.robuxReserve / coin.tokenReserve;
        const marketCap = price * TOTAL_SUPPLY;
        const gradPercent = Math.min(100, ((coin.robuxReserve - 3000) / (GRADUATION_TARGET - 3000)) * 100).toFixed(0);

        const card = document.createElement('div');
        card.className = 'coin-card';
        card.onclick = () => switchView('trade', coin.ticker);
        card.innerHTML = `
            <div class="coin-card-header">
                <img src="${coin.imageUrl}" alt="${coin.ticker}">
                <div>
                    <h3>${coin.name}</h3>
                    <span>$${coin.ticker}</span>
                </div>
            </div>
            <div class="coin-stats">
                <div>Market Cap<br><strong>R$ ${marketCap.toLocaleString(undefined, {maximumFractionDigits:0})}</strong></div>
                <div>Graduation<br><strong>${gradPercent}%</strong></div>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar-fill" style="width: ${gradPercent}%"></div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setSort(type) {
    currentSort = type;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    event.target.classList.add('active');
    renderCoinGrid();
}

function filterCoins() {
    renderCoinGrid();
}

// ==========================================
// LOAD COIN DETAILS & CHART
// ==========================================
function loadCoinDetails(ticker) {
    const coin = coins[ticker];
    if (!coin) return;

    document.getElementById('detail-img').src = coin.imageUrl;
    document.getElementById('detail-title').innerText = `${coin.name} ($${coin.ticker})`;
    document.getElementById('detail-desc').innerText = coin.description;
    document.getElementById('detail-creator').innerText = `Created by ${coin.creator}`;

    updateGraduationUI(coin);
    renderTradeFeed(coin);
    calculateOutput();
    renderChart(coin);
}

function updateGraduationUI(coin) {
    const pooledRobux = Math.max(0, coin.robuxReserve - 3000);
    const percent = Math.min(100, (pooledRobux / (GRADUATION_TARGET - 3000)) * 100);
    document.getElementById('grad-percent').innerText = `${percent.toFixed(1)}%`;
    document.getElementById('grad-bar').style.width = `${percent}%`;
}

function renderChart(coin) {
    const ctx = document.getElementById('priceCanvas').getContext('2d');
    if (priceChartInstance) {
        priceChartInstance.destroy();
    }

    priceChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: coin.priceHistory.map((_, i) => `#${i + 1}`),
            datasets: [{
                data: coin.priceHistory,
                borderColor: '#22c55e',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.2,
                fill: true,
                backgroundColor: 'rgba(34, 197, 94, 0.05)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// ==========================================
// BUY / SELL TAB SWITCHING & MATH
// ==========================================
function switchTab(tab) {
    currentTradeMode = tab;
    document.getElementById('tab-buy').classList.toggle('active', tab === 'buy');
    document.getElementById('tab-sell').classList.toggle('active', tab === 'sell');

    const execBtn = document.getElementById('execute-btn');
    const label = document.getElementById('input-label');
    const currency = document.getElementById('input-currency');

    if (tab === 'buy') {
        execBtn.innerText = 'Buy Tokens';
        execBtn.classList.remove('sell-mode');
        label.innerText = 'Robux to Spend';
        currency.innerText = 'R$';
        document.getElementById('trade-amount').value = 500;
    } else {
        execBtn.innerText = 'Sell Tokens';
        execBtn.classList.add('sell-mode');
        label.innerText = 'Tokens to Sell';
        currency.innerText = `$${currentTicker}`;
        document.getElementById('trade-amount').value = 1000000;
    }
    calculateOutput();
}

function calculateOutput() {
    const coin = coins[currentTicker];
    const val = parseFloat(document.getElementById('trade-amount').value) || 0;
    const estEl = document.getElementById('est-tokens');

    if (currentTradeMode === 'buy') {
        if (val <= 0) { estEl.innerText = `0 $${currentTicker}`; return; }
        const newRobuxReserve = coin.robuxReserve + val;
        const newTokenReserve = coin.k / newRobuxReserve;
        let tokensOut = coin.tokenReserve - newTokenReserve;
        if (tokensOut > coin.tokensAvailable) tokensOut = coin.tokensAvailable;
        estEl.innerText = `${tokensOut.toLocaleString(undefined, {maximumFractionDigits:0})} $${currentTicker}`;
    } else {
        if (val <= 0) { estEl.innerText = `0.00 R$`; return; }
        const newTokenReserve = coin.tokenReserve + val;
        const newRobuxReserve = coin.k / newTokenReserve;
        const robuxOut = coin.robuxReserve - newRobuxReserve;
        estEl.innerText = `R$ ${robuxOut.toLocaleString(undefined, {maximumFractionDigits:2})}`;
    }
}

function executeTrade() {
    const coin = coins[currentTicker];
    const val = parseFloat(document.getElementById('trade-amount').value);
    if (!val || val <= 0) return alert("Please enter a valid amount.");

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (currentTradeMode === 'buy') {
        if (currentUser.robuxBalance < val) {
            alert("Insufficient Robux balance! Top up in the top right.");
            return;
        }

        const newRobuxReserve = coin.robuxReserve + val;
        const newTokenReserve = coin.k / newRobuxReserve;
        let tokensOut = coin.tokenReserve - newTokenReserve;
        if (tokensOut > coin.tokensAvailable) tokensOut = coin.tokensAvailable;

        currentUser.robuxBalance -= val;
        coin.robuxReserve = newRobuxReserve;
        coin.tokenReserve = newTokenReserve;
        coin.tokensAvailable -= tokensOut;

        // User holding update
        if (!currentUser.holdings[currentTicker]) currentUser.holdings[currentTicker] = 0;
        currentUser.holdings[currentTicker] += tokensOut;

        coin.trades.unshift({ type: 'BUY', amountR: val, amountT: tokensOut, time: now });
    } else {
        const userTokens = currentUser.holdings[currentTicker] || 0;
        if (userTokens < val) {
            alert("You don't own enough tokens to sell!");
            return;
        }

        const newTokenReserve = coin.tokenReserve + val;
        const newRobuxReserve = coin.k / newTokenReserve;
        const robuxOut = coin.robuxReserve - newRobuxReserve;

        currentUser.robuxBalance += robuxOut;
        coin.tokenReserve = newTokenReserve;
        coin.robuxReserve = newRobuxReserve;
        coin.tokensAvailable += val;

        currentUser.holdings[currentTicker] -= val;

        coin.trades.unshift({ type: 'SELL', amountR: robuxOut, amountT: val, time: now });
    }

    // Update price history & check graduation
    const currentPrice = coin.robuxReserve / coin.tokenReserve;
    coin.priceHistory.push(currentPrice);

    if (coin.robuxReserve - 3000 >= GRADUATION_TARGET) {
        coin.isGraduated = true;
    }

    updateBalanceDisplay();
    loadCoinDetails(currentTicker);
}

function renderTradeFeed(coin) {
    const feed = document.getElementById('trade-feed');
    feed.innerHTML = '';
    coin.trades.forEach(t => {
        const item = document.createElement('div');
        item.className = 'trade-feed-item';
        const typeClass = t.type === 'BUY' ? 'trade-buy' : 'trade-sell';
        item.innerHTML = `
            <span class="${typeClass}">${t.type} ${t.amountT.toLocaleString(undefined, {maximumFractionDigits:0})} $${coin.ticker}</span>
            <span>R$ ${t.amountR.toFixed(0)} (${t.time})</span>
        `;
        feed.appendChild(item);
    });
}

// ==========================================
// MODALS & USER BALANCE
// ==========================================
function updateBalanceDisplay() {
    document.getElementById('nav-balance').innerText = currentUser.robuxBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
}

function openDepositModal() { document.getElementById('deposit-modal').style.display = 'flex'; }
function closeDepositModal() { document.getElementById('deposit-modal').style.display = 'none'; }

function addSandboxRobux(amount) {
    currentUser.robuxBalance += amount;
    updateBalanceDisplay();
    closeDepositModal();
}

function openLaunchModal() { document.getElementById('launch-modal').style.display = 'flex'; }
function closeLaunchModal() { document.getElementById('launch-modal').style.display = 'none'; }

function handleLaunch(e) {
    e.preventDefault();
    const name = document.getElementById('launch-name').value;
    const ticker = document.getElementById('launch-ticker').value.toUpperCase();
    const description = document.getElementById('launch-desc').value;
    const imageUrl = document.getElementById('launch-img').value;

    if (coins[ticker]) {
        alert("Ticker already exists!");
        return;
    }

    coins[ticker] = {
        name,
        ticker,
        description,
        imageUrl,
        creator: currentUser.username,
        robuxReserve: 3000.00,
        tokenReserve: 1073000000,
        tokensAvailable: 800000000,
        k: 3000.00 * 1073000000,
        isGraduated: false,
        priceHistory: [0.0000028],
        trades: []
    };

    closeLaunchModal();
    document.getElementById('launch-form').reset();
    switchView('trade', ticker);
}
