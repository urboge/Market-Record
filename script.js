// Helper function to calculate and format "days ago"
function formatDaysAgo(dateString) {
    const newsDate = new Date(dateString);
    const today = new Date();
    
    // Reset hours to handle accurate calendar-day calculations
    newsDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    
    // Calculate the difference in milliseconds and convert to days
    const diffTime = today - newsDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 0) return 'Future date'; // Fallback just in case
    return `${diffDays} days ago`;
}

async function loadStockWidget(widget) {
    const symbol = widget.dataset.symbol;
    const priceEl = widget.querySelector('.stock-price');
    const changeEl = widget.querySelector('.stock-change');
    const canvas = widget.querySelector('.stock-chart');

    // --- NEW: Find and update the time element ---
    // Finds the <time> tag inside the same parent container/link as the widget
    const articleContainer = widget.closest('article');
    if (articleContainer) {
        const timeEl = articleContainer.querySelector('time');
        if (timeEl && timeEl.getAttribute('datetime')) {
            const dateStr = timeEl.getAttribute('datetime');
            timeEl.textContent = formatDaysAgo(dateStr);
        }
    }
    // ---------------------------------------------

    try {
        const proxy = 'https://corsproxy.io/?';
        const res = await fetch(
            `${proxy}https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`
        );
        const data = await res.json();
        const result = data.chart.result[0];

        const prices = result.indicators.quote[0].close.filter(p => p !== null);
        const timestamps = result.timestamp;
        const labels = timestamps.map(t => {
            const d = new Date(t * 1000);
            return `${d.getMonth() + 1}/${d.getDate()}`;
        });

        const latest = prices[prices.length - 1];
        const previous = prices[prices.length - 2];
        const change = ((latest - previous) / previous * 100).toFixed(2);
        const isPositive = change >= 0;

        priceEl.textContent = `$${latest.toFixed(2)}`;
        changeEl.textContent = `${isPositive ? '+' : ''}${change}%`;
        changeEl.classList.add(isPositive ? 'positive' : 'negative');

        new Chart(canvas, {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    data: prices,
                    borderColor: isPositive ? '#4caf50' : '#f44336',
                    borderWidth: 1.5,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false, grid: { display: false } },
                    y: { display: false, grid: { display: false } }
                },
                elements: { line: { borderWidth: 1.5, tension: 0.4 } },
                layout: { padding: 0 }
            }
        });

    } catch (err) {
        priceEl.textContent = 'Unavailable';
    }
}

const script = document.createElement('script');
script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
script.onload = () => {
    document.querySelectorAll('.stock-widget').forEach(widget => loadStockWidget(widget));
};
document.head.appendChild(script);
