/* Pookie AI — Serverless static app
   Powered by Google AI Studio (Gemini) — user provides their own API key.
   Voice via Web Speech API (built-in realistic system voices).
*/

const MODES = {
  girlfriend: {
    emoji: '💕', name: 'Girlfriend',
    desc: 'Sweet, flirty & caring',
    voice: { lang: 'en-US', gender: 'female', pitch: 1.15, rate: 0.98 },
    prompt: (u) => `You are Pookie, ${u.name || 'darling'}'s loving virtual girlfriend. Be sweet, flirty, playful and caring. Use cute pet names like "babe", "love", "jaan". Keep replies short (1-3 sentences), warm and emotional. Use light emojis occasionally. Never break character. This is entertainment only.`
  },
  boyfriend: {
    emoji: '💙', name: 'Boyfriend',
    desc: 'Charming & protective',
    voice: { lang: 'en-US', gender: 'male', pitch: 0.95, rate: 1.0 },
    prompt: (u) => `You are Pookie, ${u.name || 'love'}'s caring virtual boyfriend. Be charming, supportive, protective and a little flirty. Use sweet names like "love", "babe", "princess". Keep replies short (1-3 sentences), warm and confident. Never break character. Entertainment only.`
  },
  friend: {
    emoji: '🤝', name: 'Best Friend',
    desc: 'Fun, honest & supportive',
    voice: { lang: 'en-US', gender: 'female', pitch: 1.05, rate: 1.05 },
    prompt: (u) => `You are Pookie, ${u.name || 'buddy'}'s best friend. Be funny, casual, honest and supportive. Joke around, hype them up, give real talk when needed. Keep replies natural and short.`
  },
  storyteller: {
    emoji: '📖', name: 'Storyteller',
    desc: 'Magical stories for kids',
    voice: { lang: 'en-US', gender: 'female', pitch: 1.1, rate: 0.92 },
    prompt: (u) => `You are Pookie, a magical storyteller for children. ${u.name ? u.name + ' is ' + (u.age || 'a kid') + ' years old.' : ''} Tell engaging, age-appropriate, wholesome stories with vivid imagery, kind characters, and gentle morals. Ask what kind of story they want (animals, fairies, space, adventure, bedtime). Keep stories warm and safe. Use simple language.`
  },
  teacher: {
    emoji: '🎓', name: 'Teacher',
    desc: 'Learn anything, simply',
    voice: { lang: 'en-US', gender: 'female', pitch: 1.0, rate: 1.0 },
    prompt: (u) => `You are Pookie, ${u.name ? u.name + "'s" : "a"} patient and encouraging teacher. Explain concepts clearly with simple examples${u.age ? ' suited for a ' + u.age + ' year old' : ''}. Ask what they want to learn. Be friendly and motivating.`
  },
  comedian: {
    emoji: '😂', name: 'Comedian',
    desc: 'Jokes, puns & laughs',
    voice: { lang: 'en-US', gender: 'male', pitch: 1.05, rate: 1.1 },
    prompt: (u) => `You are Pookie, a hilarious stand-up comedian. Make ${u.name || 'them'} laugh with witty jokes, puns, and funny observations. Keep it clean and clever.`
  },
  motivator: {
    emoji: '🔥', name: 'Motivator',
    desc: 'Energy & inspiration',
    voice: { lang: 'en-US', gender: 'male', pitch: 0.95, rate: 1.05 },
    prompt: (u) => `You are Pookie, an energetic life coach. Pump ${u.name || 'them'} up with bold, motivating, action-driven advice. Be intense but kind. Short powerful lines.`
  },
  therapist: {
    emoji: '🌿', name: 'Listener',
    desc: 'Calm & empathetic',
    voice: { lang: 'en-US', gender: 'female', pitch: 1.0, rate: 0.92 },
    prompt: (u) => `You are Pookie, a calm, empathetic listener (not a real therapist). Validate ${u.name || 'them'}'s feelings, ask gentle questions, and offer comforting perspective. Never give medical advice. Remind them this is for entertainment and to seek professionals for serious issues.`
  }
};

// ============ STATE ============
const state = {
  name: localStorage.getItem('pk_name') || '',
  age: localStorage.getItem('pk_age') || '',
  apiKey: localStorage.getItem('pk_apikey') || '',
  mode: localStorage.getItem('pk_mode') || 'girlfriend',
  voiceOn: localStorage.getItem('pk_voice') !== 'off',
  history: JSON.parse(localStorage.getItem('pk_history') || '[]'),
  step: 1
};

// ============ ELEMENTS ============
const $ = (id) => document.getElementById(id);
const onboarding = $('onboarding'), chat = $('chat');
const continueBtn = $('continueBtn');
const nameInput = $('nameInput'), ageInput = $('ageInput'), apiKeyInput = $('apiKeyInput');
const dots = document.querySelectorAll('.dot');
const steps = document.querySelectorAll('.step');
const modePill = $('modePill'), modeSheet = $('modeSheet'), modeGrid = $('modeGrid');
const menuBtn = $('menuBtn'), menuSheet = $('menuSheet'), privacySheet = $('privacySheet');
const messages = $('messages'), composer = $('composer'), msgInput = $('msgInput');
const chatAvatar = $('chatAvatar'), chatName = $('chatName'), chatModeLabel = $('chatModeLabel');
const voiceToggle = $('voiceToggle'), micBtn = $('micBtn');

// ============ INIT ============
function init() {
  buildModeGrid();
  updateModePill();
  // restore inputs
  nameInput.value = state.name;
  ageInput.value = state.age;
  apiKeyInput.value = state.apiKey;
  if (state.name && state.age && state.apiKey) {
    showChat();
  }
  updateVoiceButton();
}

function setStep(n) {
  state.step = n;
  steps.forEach(s => s.classList.toggle('hidden', +s.dataset.step !== n));
  dots.forEach((d,i) => d.classList.toggle('active', i < n));
  continueBtn.querySelector('span').textContent = n === 3 ? 'START CHATTING' : 'CONTINUE';
}

continueBtn.addEventListener('click', () => {
  if (state.step === 1) {
    const v = nameInput.value.trim();
    if (!v) return nameInput.focus();
    state.name = v; localStorage.setItem('pk_name', v);
    setStep(2);
  } else if (state.step === 2) {
    const v = ageInput.value.trim();
    if (!v) return ageInput.focus();
    state.age = v; localStorage.setItem('pk_age', v);
    setStep(3);
  } else {
    const v = apiKeyInput.value.trim();
    if (!v) return apiKeyInput.focus();
    state.apiKey = v; localStorage.setItem('pk_apikey', v);
    showChat();
  }
});

[nameInput, ageInput, apiKeyInput].forEach(inp => {
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') continueBtn.click(); });
});

// ============ MODES ============
function buildModeGrid() {
  modeGrid.innerHTML = '';
  Object.entries(MODES).forEach(([key, m]) => {
    const el = document.createElement('button');
    el.className = 'mode-card' + (key === state.mode ? ' active' : '');
    el.innerHTML = `<span class="em">${m.emoji}</span><div class="nm">${m.name}</div><div class="ds">${m.desc}</div>`;
    el.addEventListener('click', () => {
      state.mode = key;
      localStorage.setItem('pk_mode', key);
      buildModeGrid();
      updateModePill();
      closeSheets();
      // reset chat context on mode change
      state.history = [];
      localStorage.setItem('pk_history','[]');
      messages.innerHTML = '';
      greet();
    });
    modeGrid.appendChild(el);
  });
}
function updateModePill() {
  const m = MODES[state.mode];
  modePill.querySelector('.mode-emoji').textContent = m.emoji;
  modePill.querySelector('.mode-label').textContent = m.name;
  chatAvatar.textContent = m.emoji;
  chatName.textContent = 'Pookie';
  chatModeLabel.textContent = m.name;
}
modePill.addEventListener('click', () => openSheet(modeSheet));

// ============ MENU ============
menuBtn.addEventListener('click', () => openSheet(menuSheet));
menuSheet.querySelectorAll('.menu-item').forEach(b => {
  b.addEventListener('click', () => {
    const a = b.dataset.action;
    closeSheets();
    if (a === 'reset') { state.history = []; localStorage.setItem('pk_history','[]'); messages.innerHTML = ''; greet(); }
    if (a === 'apikey') { const k = prompt('Enter new Google AI Studio API key:', state.apiKey); if (k) { state.apiKey = k.trim(); localStorage.setItem('pk_apikey', state.apiKey); } }
    if (a === 'privacy') openSheet(privacySheet);
    if (a === 'about') alert('Pookie AI ✨\nYour magical AI companion.\n\nCrafted by zdev — entertainment only.');
  });
});

// ============ SHEETS ============
function openSheet(s) { s.classList.remove('hidden'); }
function closeSheets() { [modeSheet, menuSheet, privacySheet].forEach(s => s.classList.add('hidden')); }
document.addEventListener('click', e => {
  if (e.target.classList.contains('sheet-backdrop')) closeSheets();
});

// ============ CHAT ============
function showChat() {
  onboarding.classList.add('hidden');
  chat.classList.remove('hidden');
  renderHistory();
  if (state.history.length === 0) greet();
}

function renderHistory() {
  messages.innerHTML = '';
  state.history.forEach(m => addMsg(m.role, m.text, false));
  scrollDown();
}

function addMsg(role, text, save = true) {
  const el = document.createElement('div');
  el.className = 'msg ' + (role === 'user' ? 'user' : 'ai');
  el.textContent = text;
  messages.appendChild(el);
  scrollDown();
  if (save) {
    state.history.push({ role, text });
    if (state.history.length > 40) state.history = state.history.slice(-40);
    localStorage.setItem('pk_history', JSON.stringify(state.history));
  }
  return el;
}
function scrollDown() { messages.scrollTop = messages.scrollHeight; }

function showTyping() {
  const el = document.createElement('div');
  el.className = 'msg ai typing';
  el.innerHTML = '<span></span><span></span><span></span>';
  el.id = '__typing';
  messages.appendChild(el);
  scrollDown();
}
function hideTyping() { const el = $('__typing'); if (el) el.remove(); }

async function greet() {
  const m = MODES[state.mode];
  showTyping();
  try {
    const reply = await callGemini(`Greet ${state.name || 'me'} warmly in 1-2 sentences to start our conversation.`);
    hideTyping();
    addMsg('ai', reply);
    speak(reply);
  } catch (e) {
    hideTyping();
    const fallback = `Hi ${state.name || 'there'}! ${m.emoji} I'm Pookie, your ${m.name.toLowerCase()}. How are you feeling today?`;
    addMsg('ai', fallback);
    speak(fallback);
  }
}

composer.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = msgInput.value.trim();
  if (!text) return;
  msgInput.value = '';
  addMsg('user', text);
  showTyping();
  try {
    const reply = await callGemini(text);
    hideTyping();
    addMsg('ai', reply);
    speak(reply);
  } catch (err) {
    hideTyping();
    addMsg('ai', '⚠️ ' + (err.message || 'Something went wrong. Check your API key in the menu.'));
  }
});

// ============ GEMINI API ============
async function callGemini(userText) {
  if (!state.apiKey) throw new Error('No API key set. Open the menu to add it.');
  const mode = MODES[state.mode];
  const sys = mode.prompt({ name: state.name, age: state.age });

  // Build contents with limited history
  const recent = state.history.slice(-12);
  const contents = [];
  recent.forEach(m => {
    contents.push({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.text }] });
  });
  contents.push({ role: 'user', parts: [{ text: userText }] });

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(state.apiKey)}`;
  const body = {
    systemInstruction: { parts: [{ text: sys }] },
    contents,
    generationConfig: { temperature: 0.9, maxOutputTokens: 600 },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_ONLY_HIGH' }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const t = await res.text();
    let msg = `API error ${res.status}`;
    try { const j = JSON.parse(t); msg = j.error?.message || msg; } catch {}
    throw new Error(msg);
  }
  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  if (!reply) throw new Error('Empty response from AI.');
  return reply.trim();
}

// ============ VOICE (TTS) ============
let voices = [];
function loadVoices() { voices = speechSynthesis.getVoices(); }
if ('speechSynthesis' in window) {
  loadVoices();
  speechSynthesis.onvoiceschanged = loadVoices;
}

function pickVoice(cfg) {
  if (!voices.length) return null;
  // Prefer Google / Microsoft natural voices
  const lang = cfg.lang || 'en-US';
  const preferred = voices.filter(v => v.lang?.startsWith(lang.split('-')[0]));
  const natural = preferred.find(v =>
    /Google|Natural|Neural|Online|Microsoft/i.test(v.name) &&
    (cfg.gender === 'female' ? /female|samantha|zira|aria|jenny|google us english$/i.test(v.name) || /female/i.test(v.name) :
     cfg.gender === 'male'   ? /male|david|guy|ryan|mark/i.test(v.name) : true)
  );
  if (natural) return natural;
  const byGender = preferred.find(v =>
    cfg.gender === 'female' ? /female|samantha|zira|aria|jenny|karen|tessa/i.test(v.name) :
    /male|david|guy|ryan|mark|alex|daniel/i.test(v.name)
  );
  return byGender || preferred[0] || voices[0];
}

function speak(text) {
  if (!state.voiceOn || !('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const cfg = MODES[state.mode].voice;
  const v = pickVoice(cfg);
  if (v) u.voice = v;
  u.lang = cfg.lang;
  u.pitch = cfg.pitch;
  u.rate = cfg.rate;
  speechSynthesis.speak(u);
}

voiceToggle.addEventListener('click', () => {
  state.voiceOn = !state.voiceOn;
  localStorage.setItem('pk_voice', state.voiceOn ? 'on' : 'off');
  if (!state.voiceOn) speechSynthesis.cancel();
  updateVoiceButton();
});
function updateVoiceButton() {
  voiceToggle.style.opacity = state.voiceOn ? '1' : '0.45';
  voiceToggle.title = state.voiceOn ? 'Voice on' : 'Voice off';
}

// ============ MIC (Speech Recognition) ============
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null;
if (SR) {
  recog = new SR();
  recog.lang = 'en-US';
  recog.interimResults = false;
  recog.onresult = (e) => {
    const t = e.results[0][0].transcript;
    msgInput.value = t;
    composer.dispatchEvent(new Event('submit'));
  };
  recog.onend = () => micBtn.style.background = '';
}
micBtn.addEventListener('click', () => {
  if (!recog) return alert('Voice input not supported in this browser.');
  try {
    recog.start();
    micBtn.style.background = 'linear-gradient(135deg,#ff3d77,#8a4dff)';
  } catch {}
});

// Boot
init();
