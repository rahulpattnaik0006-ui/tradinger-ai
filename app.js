import { CONFIG } from './config.js';
import { SYSTEM_INSTRUCTION_TEMPLATE } from './tradinger_prompt.mjs';

document.addEventListener('DOMContentLoaded', () => {
  const intentForm = document.getElementById('intentForm');
  const chatForm = document.getElementById('chatForm');
  const chatHistory = document.getElementById('chatHistory');

  // Multi-Timeline Forecast Benchmark Data
  const forecastData = {
    '1M': { label: '1 Month Forecast', price: '₹1,47,000 - ₹1,51,000 / 10g', reason: 'Short-term consolidation phase following institutional profit-taking and currency fluctuations.' },
    '3M': { label: '3 Months Forecast', price: '₹1,55,000 - ₹1,60,000 / 10g', reason: 'Seasonal wedding demand peak combined with Q1 global central bank purchase cycles.' },
    '6M': { label: '6 Months Forecast', price: '₹1,62,000 - ₹1,68,000 / 10g', reason: 'Mid-year inflation adjustments and international monetary policy rate adjustments.' },
    '1Y': { label: '1 Year Forecast', price: '₹1,75,000 - ₹1,85,000 / 10g', reason: 'Global interest rate easing decreasing opportunity costs for non-yielding bullion assets.' },
    '10Y': { label: '10 Years Forecast', price: '₹3,50,000 - ₹4,20,000 / 10g', reason: 'Historical compounding growth (~9–11% CAGR in INR) acting as a long-term hedge against currency debasement.' }
  };

  // Timeline Selector Handler
  document.querySelectorAll('.timeline-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.timeline-btn').forEach(b => {
        b.className = 'timeline-btn px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 hover:text-white';
      });
      e.target.className = 'timeline-btn active px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/40';

      const period = e.target.getAttribute('data-period');
      const data = forecastData[period];
      document.getElementById('projLabel').innerText = `Projected 24K Gold Rate (${data.label})`;
      document.getElementById('projPrice').innerText = data.price;
      document.getElementById('projReason').innerText = data.reason;
    });
  });

  // Intent Analyzer Submission Handler
  intentForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('userInput').value.trim();
    if (!input) return;

    appendMessage('User Intent', input, 'user');
    document.getElementById('userInput').value = '';

    appendLoading('Analyzing intent, DCA timeline & true costs...');
    const response = await callGeminiAPI(input);
    removeLoading();
    appendMessage('Tradinger AI', response, 'ai');
  });

  // Live Chat Submission Handler
  chatForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const chatInput = document.getElementById('chatInput');
    const msg = chatInput.value.trim();
    if (!msg) return;

    appendMessage('You', msg, 'user');
    chatInput.value = '';

    appendLoading('Consulting live market analysis...');
    const response = await callGeminiAPI(msg);
    removeLoading();
    appendMessage('Tradinger AI', response, 'ai');
  });

  // Gemini Direct Fetch Function (Using Query Param Authentication)
  async function callGeminiAPI(userQuery) {
    if (!CONFIG || !CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY.includes('YOUR_ACTUAL')) {
      return "⚠️ API Key Missing: Please update CONFIG.GEMINI_API_KEY inside config.js.";
    }

    // Passing the key as a query parameter bypasses header constraints for browser SPAs
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${CONFIG.GEMINI_API_KEY.trim()}`;

    // Live Context Payload (October 2026 Benchmarks)
    const liveContext = `
LIVE CONTEXT (Verified October 2026 Benchmarks):
- Date: 23 October 2026
- 24K Gold (99.9% Pure): ₹1,44,370 per 10g
- 22K Gold (Jewelry Standard): ₹1,32,340 per 10g
- Pure Silver (999): ₹1,93,715 per kg
- sgbNewTrancheOpen: false
- SEBI Digital Gold Warning Active: true
- Import Duty: 6% (5% BCD + 1% AIDC)
- GST on Metal & Making: 3%
- LTCG Tax: Gold ETFs >12 months @ 12.5%; Physical/Digital/Gold MFs >24 months @ 12.5%
`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: SYSTEM_INSTRUCTION_TEMPLATE }]
          },
          contents: [{
            role: 'user',
            parts: [{ text: `${liveContext}\n\nUSER PROMPT: ${userQuery}` }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return `API Error (${response.status}): ${errorData?.error?.message || 'Failed to fetch response.'}`;
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to parse AI response.";
    } catch (err) {
      return "Network connection error. Please verify internet connectivity and your API key.";
    }
  }

  function appendMessage(sender, text, type) {
    const div = document.createElement('div');
    div.className = type === 'user' 
      ? 'bg-amber-500/10 p-3.5 rounded-xl border border-amber-500/20 text-amber-200 ml-auto max-w-[88%]'
      : 'bg-slate-800/80 p-3.5 rounded-xl border border-slate-700 text-slate-300 max-w-[88%]';
    
    const formattedText = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');

    div.innerHTML = `<span class="text-xs font-semibold text-slate-400 block mb-1">${sender}</span><div class="leading-relaxed">${formattedText}</div>`;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function appendLoading(text) {
    const div = document.createElement('div');
    div.id = 'loadingIndicator';
    div.className = 'bg-slate-800/50 p-3 rounded-xl text-slate-400 italic text-xs animate-pulse flex items-center gap-2';
    div.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin text-amber-500"></i> ${text}`;
    chatHistory.appendChild(div);
    chatHistory.scrollTop = chatHistory.scrollHeight;
  }

  function removeLoading() {
    const el = document.getElementById('loadingIndicator');
    if (el) el.remove();
  }
});