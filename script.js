// ==========================================
// STATE MANAGEMENT & PERSISTENCE (localStorage)
// ==========================================
let currentUser = {
    username: "BuilderCharlie",
    robuxBalance: 25000.00,
    holdings: {} // ticker -> token amount
};

let coins = {}; // Dynamic store for user-launched coins

let currentTicker = null;
let currentTradeMode = 'buy';
let currentFilter = 'all';
let currentSort = 'marketCap';
let axiomChartInstance = null;

const TOTAL_SUPPLY = 1000000000;
const CURVE_SUPPLY = 800000000;
const GRADUATION_TARGET_RESERVE = 50000.00; // 50,000 Robux pooled target

window.onload = function() {
    loadState(); // Load saved data from browser storage on start
    updateBalanceDisplay();
    renderCoinExplorer();
};

// Save state helper
function saveState() {
    localStorage.setItem('blox_fun_user', JSON.stringify(currentUser));
    localStorage.setItem('blox_fun_coins', JSON.stringify(coins));
}

// Load state helper
function loadState() {
    const savedUser = localStorage.getItem('blox_fun_user');
    const savedCoins = localStorage.getItem('blox_fun_coins');
    
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
    if (savedCoins) {
        coins = JSON.parse(savedCoins);
    }
}

// ==========================================
// VIEW ROUTING
// ==========================================
function switchView(viewName, ticker = null) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    if (viewName === 'home') {
        document.getElementById('home-view').classList.add('active');
        renderCoinExplorer();
    } else if (viewName === 'trade') {
        document.getElementById('trade-view').classList.add('active');
        currentTicker = ticker;
        loadTerminal(ticker);
    }
}

// ==========================================
// EXPLORER / HOME GRID
// ==========================================
function renderCoinExplorer() {
    const grid = document.getElementById('coin-grid');
    const search = document.getElementById('global-search').value.toLowerCase();
    grid.innerHTML = '';

    let list = Object.values(coins);

    // Filter
    if (currentFilter === 'graduated') {
        list = list.filter(c => c.isGraduated);
    } else if (currentFilter === 'mine') {
        list = list.filter(c => c.creator === currentUser.username);
    }

    // Search query
    list = list.filter(c => c.name.toLowerCase().includes(search) || c.ticker.toLowerCase().includes(search));

    // Sort
    if (currentSort === 'marketCap') {
        list.sort((a, b) => (b.robuxReserve / b.tokenReserve) - (a.robuxReserve / a.tokenReserve));
    } else if (currentSort === 'newest') {
        list.reverse();
    }

    document.getElementById('stat-count').innerText = Object.keys(coins).length;

    if (list.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; color: var(--text-muted);">
                <h3>No tokens found on the bonding curve.</h3>
                <p style="margin-top: 0.5rem;">Click "Start a New Coin" to deploy the first one!</p>
            </div>`;
        return;
    }

    list.forEach(coin => {
        const price = coin.robuxReserve / coin.tokenReserve;
        const mcap = price * TOTAL_SUPPLY;
        const pooled = Math.max(0, coin.robuxReserve - 3000);
        const gradPct = Math.min(100, (pooled / (GRADUATION_TARGET_RESERVE - 3000)) * 100).toFixed(0);

        const card = document.createElement('div');
        card.className = 'coin-card';
        card.onclick = () => switchView('trade', coin.ticker);
        card.innerHTML = `
            <div class="coin-card-top">
                <img src="${coin.imageUrl}" alt="${coin.ticker}">
                <div>
                    <h3>${coin.name}</h3>
                    <span>$${coin.ticker}</span>
                </div>
            </div>
            <div class="coin-card-metrics">
                <div>Market Cap<br><strong>R$ ${mcap.toLocaleString(undefined, {maximumFractionDigits:0})}</strong></div>
                <div>Graduation<br><strong>${gradPct}%</strong></div>
            </div>
            <div class="progress-track">
                <div class="progress-fill" style="width: ${gradPct}%"></div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function setFilter(filter) {
    currentFilter = filter;
    document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    renderCoinExplorer();
}

function changeSort(sortVal) {
    currentSort = sortVal;
    renderCoinExplorer();
}

function filterCoins() {
    renderCoinExplorer();
}

// ==========================================
// AXIOM / PUMP.FUN TERMINAL VIEW
// ==========================================
function loadTerminal(ticker) {
    const coin = coins[ticker];
    if (!coin) return;

    const price = coin.robuxReserve / coin.tokenReserve;
    const mcap = price * TOTAL_SUPPLY;

    document.getElementById('term-title').innerText = `${coin.name} ($${coin.ticker})`;
    document.getElementById('term-marketcap').innerText = `MCap: R$ ${mcap.toLocaleString(undefined, {maximumFractionDigits:0})}`;
    document.getElementById('term-liq').innerText = `Liq: R$ ${coin.robuxReserve.toLocaleString(undefined, {maximumFractionDigits:0})}`;
    document.getElementById('term-creator').innerText = `Created by: ${coin.creator}`;

    document.getElementById('metric-robux-pool').innerText = `R$ ${coin.robuxReserve.toLocaleString(undefined, {maximumFractionDigits:0})}`;
    document.getElementById('metric-holders').innerText = Object.keys(coin.holders || {}).length || 1;

    updateGraduationMetrics(coin);
    renderLiveTradesFeed(coin);
    renderChatBox(coin);
    renderAxiomChart(coin);
    updatePresetLabels(); // Update preset buttons based on Buy/Sell mode
    updateTradePreview();
}

function updateGraduationMetrics(coin) {
    const pooled = Math.max(0, coin.robuxReserve - 3000);
    const pct = Math.min(100, (pooled / (GRADUATION_TARGET_RESERVE - 3000)) * 100);
    document.getElementById('grad-pct-text').innerText = `${pct.toFixed(1)}%`;
    document.getElementById('grad-bar-fill').style.width = `${pct}%`;
}

function renderAxiomChart(coin) {
    const ctx = document.getElementById('axiomChart').getContext('2d');
    if (axiomChartInstance) axiomChartInstance.destroy();

    const currentPrice = coin.robuxReserve / coin.tokenReserve;
    document.getElementById('live-price-val').innerText = `R$ ${currentPrice.toFixed(8)}`;

    axiomChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: coin.priceHistory.map((_, i) => `#${i + 1}`),
            datasets: [{
                data: coin.priceHistory,
                borderColor: '#10b981',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.15,
                fill: true,
                backgroundColor: 'rgba(16, 185, 129, 0.05)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
                x: { display: false },
                y: { grid: { color: '#1e294a' }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// ==========================================
// TRADING OPTIONS & PERCENTAGE BUTTONS
// ==========================================
function setTradeMode(mode) {
    currentTradeMode = mode;
    document.getElementById('mode-buy-btn').classList.toggle('active', mode === 'buy');
    document.getElementById('mode-sell-btn').classList.toggle('active', mode === 'sell');

    const execBtn = document.getElementById('axiom-execute-btn');
    const topLbl = document.getElementById('input-top-label');
    const tag = document.getElementById('token-symbol-tag');

    if (mode === 'buy') {
        execBtn.innerText = 'Place Buy Order';
        execBtn.classList.remove('sell-mode');
        topLbl.innerText = 'Robux to Pay';
        tag.innerText = 'R$';
        document.getElementById('trade-input-val').value = 500;
    } else {
        execBtn.innerText = 'Place Sell Order';
        execBtn.classList.add('sell-mode');
        topLbl.innerText = 'Tokens to Sell';
        tag.innerText = `$${currentTicker}`;
        const userBag = currentUser.holdings[currentTicker] || 0;
        document.getElementById('trade-input-val').value = userBag > 0 ? userBag : 0;
    }
    
    updatePresetLabels();
    updateTradePreview();
}

// Dynamically change preset buttons to percentages (25%, 50%, 75%, 100%)
function updatePresetLabels() {
    const container = document.getElementById('quick-presets-container');
    if (!container) return;

    if (currentTradeMode === 'buy') {
        container.innerHTML = `
            <button onclick="setPercentageAmount(0.25)">25%</button>
            <button onclick="setPercentageAmount(0.50)">50%</button>
            <button onclick="setPercentageAmount(0.75)">75%</button>
            <button onclick="setPercentageAmount(1.00)">100%</button>
        `;
    } else {
        container.innerHTML = `
            <button onclick="setPercentageAmount(0.25)">25%</button>
            <button onclick="setPercentageAmount(0.50)">50%</button>
            <button onclick="setPercentageAmount(0.75)">75%</button>
            <button onclick="setPercentageAmount(1.00)">100%</button>
        `;
    }
}

function setPercentageAmount(fraction) {
    const inputField = document.getElementById('trade-input-val');
    
    if (currentTradeMode === 'buy') {
        // Calculate percentage of available Robux balance
        const maxRobux = currentUser.robuxBalance;
        const amount = maxRobux * fraction;
        inputField.value = amount > 0 ? amount.toFixed(2) : 0;
    } else {
        // Calculate percentage of current coin holdings
        const userBag = currentUser.holdings[currentTicker] || 0;
        const amount = userBag * fraction;
        inputField.value = amount > 0 ? amount.toFixed(2) : 0;
    }
    
    updateTradePreview();
}

function updateTradePreview() {
    const coin = coins[currentTicker];
    if (!coin) return;
    const val = parseFloat(document.getElementById('trade-input-val').value) || 0;
    const estEl = document.getElementById('est-output-val');

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

function executeAxiomTrade() {
    const coin = coins[currentTicker];
    const val = parseFloat(document.getElementById('trade-input-val').value);
    if (!val || val <= 0) return alert("Please enter a valid amount.");

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (currentTradeMode === 'buy') {
        if (currentUser.robuxBalance < val) {
            alert("Insufficient Robux balance! Top up in top navigation.");
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

        if (!currentUser.holdings[currentTicker]) currentUser.holdings[currentTicker] = 0;
        currentUser.holdings[currentTicker] += tokensOut;

        if (!coin.holders) coin.holders = {};
        coin.holders[currentUser.username] = true;

        coin.trades.unshift({ type: 'BUY', user: currentUser.username, amountR: val, amountT: tokensOut, time: timeStr });
    } else {
        const userBag = currentUser.holdings[currentTicker] || 0;
        if (userBag < val) {
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

        coin.trades.unshift({ type: 'SELL', user: currentUser.username, amountR: robuxOut, amountT: val, time: timeStr });
    }

    const newPrice = coin.robuxReserve / coin.tokenReserve;
    coin.priceHistory.push(newPrice);

    if (coin.robuxReserve - 3000 >= GRADUATION_TARGET_RESERVE) {
        coin.isGraduated = true;
    }

    saveState(); // Persist changes immediately
    updateBalanceDisplay();
    loadTerminal(currentTicker);
}

function renderLiveTradesFeed(coin) {
    const feed = document.getElementById('live-trades-feed');
    feed.innerHTML = '';
    coin.trades.forEach(t => {
        const row = document.createElement('div');
        row.className = 'trade-feed-row';
        const typeCls = t.type === 'BUY' ? 't-buy' : 't-sell';
        row.innerHTML = `
            <span style="overflow:hidden; text-overflow:ellipsis;">${t.user}</span>
            <span>R$ ${t.amountR.toFixed(0)}</span>
            <span class="${typeCls}">${t.type}</span>
            <span style="color:var(--text-muted);">${t.time}</span>
        `;
        feed.appendChild(row);
    });
}

// ==========================================
// CHAT & COMMUNITY
// ==========================================
function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const msg = input.value.trim();
    if (!msg) return;

    const coin = coins[currentTicker];
    if (!coin) return;

    if (!coin.chat) coin.chat = [];
    coin.chat.push({ user: currentUser.username, text: msg });
    input.value = '';
    
    saveState(); // Persist chat messages
    renderChatBox(coin);
}

function handleChatKey(e) {
    if (e.key === 'Enter') sendChatMessage();
}

function renderChatBox(coin) {
    const box = document.getElementById('chat-messages');
    box.innerHTML = '';
    if (!coin.chat || coin.chat.length === 0) {
        box.innerHTML = `<div class="chat-msg">No messages yet. Start the conversation!</div>`;
        return;
    }
    coin.chat.forEach(c => {
        const div = document.createElement('div');
        div.className = 'chat-msg';
        div.innerHTML = `<span class="chat-user">${c.user}:</span> ${c.text}`;
        box.appendChild(div);
    });
}

// ==========================================
// LAUNCH COIN WITH DEV PRE-LAUNCH BUY
// ==========================================
function openLaunchModal() { document.getElementById('launch-modal').style.display = 'flex'; }
function closeLaunchModal() { document.getElementById('launch-modal').style.display = 'none'; }

function submitLaunchCoin(e) {
    e.preventDefault();
    const name = document.getElementById('l-name').value;
    const ticker = document.getElementById('l-ticker').value.toUpperCase();
    const description = document.getElementById('l-desc').value;
    const imageUrl = document.getElementById('l-img').value;
    const devBuyRobux = parseFloat(document.getElementById('l-devbuy').value) || 0;

    if (coins[ticker]) {
        alert("Ticker already exists!");
        return;
    }

    if (devBuyRobux > currentUser.robuxBalance) {
        alert("Insufficient Robux for Dev Pre-Launch Buy!");
        return;
    }

    let robuxReserve = 3000.00;
    let tokenReserve = 1073000000;
    let tokensAvailable = 800000000;
    let k = robuxReserve * tokenReserve;

    const newCoin = {
        name,
        ticker,
        description,
        imageUrl,
        creator: currentUser.username,
        robuxReserve,
        tokenReserve,
        tokensAvailable,
        k,
        isGraduated: false,
        priceHistory: [0.0000028],
        trades: [],
        holders: {},
        chat: []
    };

    coins[ticker] = newCoin;

    if (devBuyRobux > 0) {
        currentUser.robuxBalance -= devBuyRobux;
        const newRobuxRes = newCoin.robuxReserve + devBuyRobux;
        const newTokenRes = newCoin.k / newRobuxRes;
        let tokensOut = newCoin.tokenReserve - newTokenRes;
        if (tokensOut > newCoin.tokensAvailable) tokensOut = newCoin.tokensAvailable;

        newCoin.robuxReserve = newRobuxRes;
        newCoin.tokenReserve = newTokenRes;
        newCoin.tokensAvailable -= tokensOut;

        if (!currentUser.holdings[ticker]) currentUser.holdings[ticker] = 0;
        currentUser.holdings[ticker] += tokensOut;
        newCoin.holders[currentUser.username] = true;

        newCoin.trades.push({
            type: 'BUY',
            user: currentUser.username,
            amountR: devBuyRobux,
            amountT: tokensOut,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        newCoin.priceHistory.push(newCoin.robuxReserve / newCoin.tokenReserve);
    }

    closeLaunchModal();
    document.getElementById('launch-form').reset();
    saveState(); // Persist newly launched coin
    updateBalanceDisplay();
    switchView('trade', ticker);
}

// ==========================================
// DEPOSITS & BALANCES
// ==========================================
function updateBalanceDisplay() {
    document.getElementById('nav-balance').innerText = currentUser.robuxBalance.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
    const swapBal = document.getElementById('swap-user-bal');
    if (swapBal) swapBal.innerText = currentUser.robuxBalance.toLocaleString(undefined, {maximumFractionDigits: 0});
}

function openDepositModal() { document.getElementById('deposit-modal').style.display = 'flex'; }
function closeDepositModal() { document.getElementById('deposit-modal').style.display = 'none'; }

function topUpRobux(amount) {
    currentUser.robuxBalance += amount;
    saveState(); // Persist new balance
    updateBalanceDisplay();
    closeDepositModal();
}
