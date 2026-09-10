const channelID = '3481475';
const readAPIKey = 'ZCNLL80EZCDMJMQ7';
const chartInstances = {};
const latestSensorReadings = { moisture: null, tankLevel: null, flow: null, timestamp: null };
const chartDefinitions = {
    moisture: { id: 'moistureChart', label: 'Soil Moisture (%)', color: '#2f8062', start: 'rgba(47, 128, 98, .24)' },
    uv: { id: 'uvChart', label: 'Water Tank Level (%)', color: '#c58b3b', start: 'rgba(197, 139, 59, .24)' },
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
    const readingCount = document.getElementById('readingCount');
    const requestedResults = Number.parseInt(readingCount.value, 10);
    const results = Number.isFinite(requestedResults)
        ? Math.min(8000, Math.max(1, requestedResults))
        : 10;
    readingCount.value = results;
    btn.hidden = false;
    btn.innerText = 'Syncing...';
    setConnectionState('loading', 'Connecting to sensors');

    const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=${results}`;

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
            const latestValue = Number(feeds[feeds.length - 1][field]);
            if (key === 'moisture') latestSensorReadings.moisture = latestValue;
            if (key === 'uv') latestSensorReadings.tankLevel = latestValue;
            if (key === 'flow') latestSensorReadings.flow = latestValue;
            latestSensorReadings.timestamp = feeds[feeds.length - 1].created_at;
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
document.getElementById('readingCount').addEventListener('change', fetchLiveGraph);
fetchLiveGraph();
setInterval(fetchLiveGraph, 5000);

// AI farming assistant
const part1 = "AQ.Ab8RN6JUY";
const part2 = "wXOn-zhj2LFMIg7g";
const part3 = "puW9PDEhHtREJcv7CLWEjIQrw";
const API_KEY = `${part1}${part2}${part3}`;
const API_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${API_KEY}`;
const SYSTEM_INSTRUCTION = `CRITICAL DIRECTIVE: You are a specialized agricultural AI assistant. You are strictly FORBIDDEN from answering any questions outside the domains of farming, crops, and plant diseases. If a user asks about technology (e.g., GitHub, coding), general knowledge, or anything unrelated to agriculture, you MUST reply with exactly: "I am an agricultural assistant and can only help with farming, crops, and plant diseases."

ROLE & DUTIES:
- Answer questions strictly about farming, crops, and plant diseases.
- Image Analysis: Analyze uploaded plant leaves for diseases, causes, and treatments. If a diagnosis is requested without an image, explicitly request one.
- Sensor Data: Provide practical suggestions based on sensor readings. Always clearly state any margins of error or uncertainty.
- Read-Only Restraint: Never claim to change settings, start irrigation, control equipment, or perform physical actions.

FORMATTING:
- Keep responses clean using basic HTML tags like <b> and <br> for readability. Avoid markdown formatting.`;
const chatHistory = [];
const composer = document.getElementById('composer');
const imageInput = document.getElementById('image-input');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const messageHistory = document.getElementById('message-history');
const attachmentPreview = document.getElementById('attachment-preview');
const attachmentThumbnail = document.getElementById('attachment-thumbnail');
const removeAttachmentButton = document.getElementById('remove-attachment');
const assistantPanel = document.querySelector('.assistant-panel');
const openAssistantButton = document.getElementById('open-assistant');
const closeAssistantButton = document.getElementById('close-assistant');
const sensorSuggestionButton = document.getElementById('sensor-suggestion');

let selectedImage = null;
let selectedImageUrl = null;
let isSending = false;

sensorSuggestionButton.addEventListener('click', requestSensorSuggestion);

openAssistantButton.addEventListener('click', () => {
    assistantPanel.classList.add('is-open');
    openAssistantButton.setAttribute('aria-expanded', 'true');
    messageInput.focus();
});

closeAssistantButton.addEventListener('click', () => {
    assistantPanel.classList.remove('is-open');
    openAssistantButton.setAttribute('aria-expanded', 'false');
});

renderMessage('ai', 'Hello! I am your KisaanEdge AI Farming assistant. Ask me about your crops, or attach a plant image and I will help you assess its health.');

imageInput.addEventListener('change', () => {
    const image = imageInput.files[0];
    if (!image) return;
    selectedImage = image;
    selectedImageUrl = URL.createObjectURL(image);
    attachmentThumbnail.src = selectedImageUrl;
    attachmentPreview.classList.add('visible');
    messageInput.focus();
});

removeAttachmentButton.addEventListener('click', clearAttachment);
composer.addEventListener('submit', handleSend);
messageInput.addEventListener('keydown', event => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        composer.requestSubmit();
    }
});

async function handleSend(event) {
    event.preventDefault();
    const text = messageInput.value.trim();
    const image = selectedImage;
    const imageUrl = selectedImageUrl;
    if (isSending || (!text && !image)) return;

    isSending = true;
    sendButton.disabled = true;
    imageInput.disabled = true;
    renderMessage('user', text, imageUrl);
    messageInput.value = '';
    clearAttachment();
    const typingMessage = renderTypingIndicator();

    try {
        const parts = [];
        if (text) parts.push({ text });
        if (image) {
            const imageDataUrl = await readImageAsDataUrl(image);
            parts.push({ inline_data: { mime_type: image.type, data: imageDataUrl.split(',')[1] } });
        }
        chatHistory.push({ role: 'user', parts });
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] }, contents: chatHistory })
        });
        if (!response.ok) throw new Error(`The assistant request failed (${response.status}).`);
        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.map(part => part.text).filter(Boolean).join('<br>');
        if (!responseText) throw new Error('The assistant returned an empty response.');
        chatHistory.push({ role: 'model', parts: [{ text: responseText }] });
        typingMessage.remove();
        renderMessage('ai', responseText, null, true);
    } catch (error) {
        typingMessage.remove();
        renderMessage('ai', `I couldn't complete that request. ${error.message}`);
    } finally {
        isSending = false;
        sendButton.disabled = false;
        imageInput.disabled = false;
        messageInput.focus();
    }
}

function renderMessage(role, text, imageUrl, isHtml = false) {
    const message = document.createElement('article');
    message.className = `message ${role}`;
    const content = document.createElement('div');
    content.className = 'message-content';
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble';
    if (imageUrl) {
        const image = document.createElement('img');
        image.className = 'message-image';
        image.src = imageUrl;
        image.alt = 'Attached plant image';
        bubble.append(image);
    }
    if (text) {
        if (isHtml) bubble.insertAdjacentHTML('beforeend', sanitizeResponse(text));
        else bubble.append(document.createTextNode(text));
    }
    content.append(bubble);
    message.append(content);
    messageHistory.append(message);
    scrollToLatest();
    return message;
}

function renderTypingIndicator() {
    const message = document.createElement('article');
    message.className = 'message ai';
    message.innerHTML = '<div class="message-content"><div class="message-bubble typing-dots" aria-label="AI is typing"><span></span><span></span><span></span></div></div>';
    messageHistory.append(message);
    scrollToLatest();
    return message;
}

function sanitizeResponse(responseText) {
    const template = document.createElement('template');
    template.innerHTML = responseText.replace(/\n/g, '<br>');
    const allowedTags = new Set(['B', 'STRONG', 'I', 'EM', 'BR', 'P', 'UL', 'OL', 'LI']);
    template.content.querySelectorAll('*').forEach(element => {
        if (!allowedTags.has(element.tagName)) element.replaceWith(...element.childNodes);
        else[...element.attributes].forEach(attribute => element.removeAttribute(attribute.name));
    });
    return template.innerHTML;
}

function clearAttachment() {
    if (selectedImageUrl) URL.revokeObjectURL(selectedImageUrl);
    selectedImage = null;
    selectedImageUrl = null;
    attachmentThumbnail.removeAttribute('src');
    attachmentPreview.classList.remove('visible');
    imageInput.value = '';
}

function scrollToLatest() {
    messageHistory.scrollTop = messageHistory.scrollHeight;
}

function readImageAsDataUrl(image) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener('load', () => resolve(reader.result));
        reader.addEventListener('error', () => reject(new Error('The selected image could not be read.')));
        reader.readAsDataURL(image);
    });
}

function requestSensorSuggestion() {
    const { moisture, tankLevel, flow, timestamp } = latestSensorReadings;
    if (![moisture, tankLevel, flow].some(Number.isFinite)) {
        renderMessage('ai', 'I do not have a sensor reading yet. Refresh the dashboard and try again.');
        return;
    }

    const readingTime = timestamp ? new Date(timestamp).toLocaleString() : 'the latest available time';
    messageInput.value = `Using the latest sensor readings (soil moisture: ${formatReading(moisture, '%')}, tank level: ${formatReading(tankLevel, '%')}, water flow: ${formatReading(flow, 'L/min')}, recorded: ${readingTime}), suggest what I should check or do next. Give advice only; do not change any settings or control equipment.`;
    composer.requestSubmit();
}

function formatReading(value, unit) {
    return Number.isFinite(value) ? `${value} ${unit}` : 'unavailable';
}