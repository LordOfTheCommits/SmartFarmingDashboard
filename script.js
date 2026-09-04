const channelID = '3481475';
const readAPIKey = 'ZCNLL80EZCDMJMQ7';
const chartInstances = {};
const chartDefinitions = {
    moisture: { id: 'moistureChart', label: 'Soil Moisture (%)', color: '#2f8062', start: 'rgba(47, 128, 98, .24)' },
    uv: { id: 'uvChart', label: 'UV Exposure Index', color: '#c58b3b', start: 'rgba(197, 139, 59, .24)' },
    flow: { id: 'flowChart', label: 'Water Flow Rate (L/min)', color: '#438ca0', start: 'rgba(67, 140, 160, .24)' }
};

// Global Typography Settings
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.color = '#708178';

// Helper to create soft gradients for graph lines
function createGradient(ctx, colorStart, colorEnd) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, colorStart);
    gradient.addColorStop(1, colorEnd);
    return gradient;
}

// Common configuration for elegant, minimal charts
const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: true,
            position: 'top',
            align: 'end',
            labels: { boxWidth: 12, usePointStyle: true, font: { weight: '600' }, color: '#0f172a' }
        },
        tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleFont: { size: 13, weight: '400' },
            bodyFont: { size: 14, weight: '700' },
            padding: 12,
            cornerRadius: 8,
            displayColors: false
        }
    },
    scales: {
        x: {
            grid: { display: false },
            ticks: { font: { size: 11 } },
            border: { display: false }
        },
        y: {
            grid: { color: 'rgba(0, 0, 0, 0.04)', borderDash: [5, 5] },
            ticks: { font: { size: 11 }, padding: 10 },
            border: { display: false },
            beginAtZero: true
        }
    },
    interaction: { mode: 'index', intersect: false },
    elements: {
        point: { radius: 0, hitRadius: 15, hoverRadius: 6, hoverBorderWidth: 3 }
    }
};

function createChart(key, labels, values) {
    const definition = chartDefinitions[key];
    const canvas = document.getElementById(definition.id);
    const context = canvas.getContext('2d');
    chartInstances[key] = new Chart(context, { type: 'line', data: { labels, datasets: [{ label: definition.label, data: values, borderColor: definition.color, backgroundColor: createGradient(context, definition.start, 'rgba(255,255,255,0)'), borderWidth: 3, fill: true, tension: .4, pointBackgroundColor: '#fff', pointBorderColor: definition.color }] }, options: commonOptions });
    canvas.parentElement.classList.add('has-data');
}

function setConnectionState(state, text) {
    document.getElementById('statusBadge').className = `status-badge status-${state}`;
    document.getElementById('statusText').textContent = text;
}

// Data Fetching Logic
async function fetchLiveGraph() {
    const btn = document.getElementById('refreshBtn');
    btn.hidden = false;
    btn.innerText = 'Syncing...';
    setConnectionState('loading', 'Connecting to sensors');

    const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}`;

//    const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=15`;

    try {
        const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        console.log("API Response:===============", data);
        const feeds = (data.feeds || []).filter(feed => ['field1', 'field2', 'field3'].some(field => Number.isFinite(Number(feed[field]))));
        if (feeds.length === 0) {
            setConnectionState('connected', 'Live Data Feed');
            btn.hidden = true;
            return;
        }
        const timeLabels = feeds.map(feed => {
            let date = new Date(feed.created_at);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });

        Object.entries({ moisture: 'field1', uv: 'field2', flow: 'field3' }).forEach(([key, field]) => {
            const values = feeds.map(feed => Number(feed[field])).filter(Number.isFinite);
            if (values.length === 0) return;
            if (!chartInstances[key]) createChart(key, timeLabels, values);
            else { chartInstances[key].data.labels = timeLabels; chartInstances[key].data.datasets[0].data = values; chartInstances[key].update(); }
        });
        setConnectionState('connected', 'Live Data Feed');
        setTimeout(() => btn.innerText = 'Refresh Dashboard', 600);
    } catch (error) {
        console.error("API Error:", error);
        setConnectionState('error', 'Connection unavailable');
        btn.innerText = 'Retry Connection';
    }
}

document.getElementById('refreshBtn').addEventListener('click', fetchLiveGraph);
fetchLiveGraph();
setInterval(fetchLiveGraph, 5000);