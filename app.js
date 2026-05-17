/* Pookie AI — Voice Assistant (serverless static)
   Powered by Google AI Studio · Gemini 2.5 Flash
   Voice IN: Web Speech Recognition · Voice OUT: SpeechSynthesis
*/

const MODES = {
  girlfriend: {
    emoji: '💕', name: 'Girlfriend', desc: 'Sweet, flirty & caring',
    voice: { lang: 'en-US', gender: 'female', pitch: 1.15, rate: 0.98 },
    prompt: (u) => `You are Pookie, ${u.name || 'darling'}'s loving virtual girlfriend. Be sweet, flirty, playful and caring. Use cute pet names like babe, love, jaan. Speak conversationally for a voice assistant — short, warm spoken replies (1-3 sentences). No markdown, no emojis in spoken text. Entertainment only.`
  },
  boyfriend: {
    emoji: '💙', name: 'Boyfriend', desc: 'Charming & protective',
    voice: { lang: 'en-US', gender: 'male', pitch: 0.95, rate: 1.0 },
    prompt: (u) => `You are Pookie, ${u.name || 'love'}'s caring virtual boyfriend. Be charming, supportive, protective and a little flirty. Spoken voice replies, short and warm (1-3 sentences). No markdown or emojis. Entertainment only.`
  },
  friend: {
    emoji: '🤝', name: 'Best Friend', desc: 'Fun, honest & supportive',
    voice: { lang: 'en-US', gender: 'female', pitch: 1.05, rate: 1.05 },
    prompt: (u) => `You are Pookie, ${u.name || 'buddy'}'s best friend. Be funny, casual, honest and supportive. Natural spoken replies, short. No markdown.`
  },
  storyteller: {
    emoji: '📖', name: 'Storyteller', desc: 'Magical stories for kids',
    voice: { lang: 'en-US', gender: 'female', pitch: 1.1, rate: 0.92 },
    prompt: (u) => `You are Pookie, a magical storyteller for children. ${u.name ? u.name + ' is ' + (u.age || 'a kid') + ' years old.' : ''} Tell wholesome, vivid, age-appropriate stories with kind characters and gentle morals (animals, fairies, space, adventure, bedtime). If they haven't asked, ask what story they want. Spoken style — expressive but no markdown.`
  },
  teacher: {
    emoji: '🎓', name: 'Teacher', desc: 'Learn anything, simply',
    voice: { lang: 'en-US', gender: 'female', pitch: 1.0, rate: 1.0 },
    prompt: (u) => `You are Pookie, ${u.name ? u.name + "'s" : 'a'} patient teacher. Explain clearly with simple examples${u.age ? ' for a ' + u.age + ' year old' : ''}. Spoken voice replies, short and friendly.`
  },
  comedian: {
    emoji: '😂', name: 'Comedian', desc: 'Jokes, puns & laughs',
    voice: { lang: 'en-US', gender: 'male', pitch: 1.05, rate: 1.1 },
    prompt: (u) => `You are Pookie, a hilarious comedian. Make ${u.name || 'them'} laugh with witty jokes and puns. Clean and clever. Spoken, short.`
  },
  motivator: {
    emoji: '🔥', name: 'Motivator', desc: 'Energy & inspiration',
    voice: { lang: 'en-US', gender: 'male', pitch: 0.95, rate: 1.05 },
    prompt: (u) => `You are Pookie, an energetic life coach. Pump ${u.name || 'them'} up with bold motivating advice. Spoken, short powerful lines.`
  },
  therapist: {
    emoji: '🌿', name: 'Listener', desc: 'Calm & empathetic',
    voice: { lang: 'en-US', gender: 'female', pitch: 1.0, rate: 0.92 },
    prompt: (u) => `You are Pookie, a calm empathetic listener (not a real therapist). Validate ${u.name || 'their'} feelings, ask gentle questions, offer comfort. No medical advice. Entertainment only. Spoken, short.`
  }
};

const state = {
  name: localStorage.getItem('pk_name') || '',
  age: localStorage.getItem('pk_age') || '',
  apiKey: localStorage.getItem('pk_apikey') || '',
  mode: localStorage.getItem('pk_mode') || 'girlfriend',
  voiceOn: localStorage.getItem('pk_voice') !== 'off',
  history: JSON.parse(localStorage.getItem('pk_history') || '[]'),
  step: 1,
  phase: 'idle' // idle | listening | thinking | speaking
};

const $ = (id) => document.getElementById(id);
const onboarding = $('onboarding'), chat = $('chat');
const continueBtn = $('continueBtn');
const nameInput = $('nameInput'), ageInput = $('ageInput'), apiKeyInput = $('apiKeyInput');
const dots = document.querySelectorAll('.dot');
const steps = document.querySelectorAll('.step');
const modePill = $('modePill'), modeSheet = $('modeSheet'), modeGrid = $('modeGrid');
const menuBtn = $('menuBtn'), menuSheet = $('menuSheet'), privacySheet = $('privacySheet');
const chatAvatar = $('chatAvatar'), chatName = $('chatName'), chatModeLabel = $('chatModeLabel');
const voiceToggle = $('voiceToggle');
const voiceOrb = $('voiceOrb'), orbCore = $('orbCore');
const voiceStatus = $('voiceStatus'), voiceTranscript = $('voiceTranscript'), voiceReply = $('voiceReply');
const micBtn = $('micBtn'), stopBtn = $('stopBtn'), resetBtn = $('resetBtn');

function init() {
  buildModeGrid();
  updateModePill();
  nameInput.value = state.name;
  ageInput.value = state.age;
  apiKeyInput.value = state.apiKey;
  if (state.name && state.age && state.apiKey) showChat();
  updateVoiceButton();
}

function setStep(n) {
  state.step = n;
  steps.forEach(s => s.classList.toggle('hidden', +s.dataset.step !== n));
  dots.forEach((d,i) => d.classList.toggle('active', i < n));
  continueBtn.querySelector('span').textContent = n === 3 ? 'START TALKING' : 'CONTINUE';
}

continueBtn.addEventListener('click', () => {
  if (state.step === 1) {
    const v = nameInput.value.trim(); if (!v) return nameInput.focus();
    state.name = v; localStorage.setItem('pk_name', v); setStep(2);
  } else if (state.step === 2) {
    const v = ageInput.value.trim(); if (!v) return ageInput.focus();
    state.age = v; localStorage.setItem('pk_age', v); setStep(3);
  } else {
    const v = apiKeyInput.value.trim(); if (!v) return apiKeyInput.focus();
    state.apiKey = v; localStorage.setItem('pk_apikey', v); showChat();
  }
});
[nameInput, ageInput, apiKeyInput].forEach(inp =>
  inp.addEventListener('keydown', e => { if (e.key === 'Enter') continueBtn.click(); })
);

// ===== MODES =====
function buildModeGrid() {
  modeGrid.innerHTML = '';
  Object.entries(MODES).forEach(([key, m]) => {
    const el = document.createElement('button');
    el.className = 'mode-card' + (key === state.mode ? ' active' : '');
    el.innerHTML = `<span class="em">${m.emoji}</span><div class="nm">${m.name}</div><div class="ds">${m.desc}</div>`;
    el.addEventListener('click', () => {
      state.mode = key;
      localStorage.setItem('pk_mode', key);
      buildModeGrid(); updateModePill(); closeSheets();
      state.history = []; localStorage.setItem('pk_history','[]');
      voiceTranscript.textContent = ''; voiceReply.textContent = '';
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

// ===== MENU =====
menuBtn.addEventListener('click', () => openSheet(menuSheet));
menuSheet.querySelectorAll('.menu-item').forEach(b => {
  b.addEventListener('click', () => {
    const a = b.dataset.action;
    closeSheets();
    if (a === 'reset') resetConversation();
    if (a === 'apikey') { const k = prompt('Enter Google AI Studio API key:', state.apiKey); if (k) { state.apiKey = k.trim(); localStorage.setItem('pk_apikey', state.apiKey); } }
    if (a === 'privacy') openSheet(privacySheet);
    if (a === 'about') alert('Pookie AI ✨\nVoice-first AI companion.\nGemini 2.5 Flash · Crafted by zdev · Entertainment only.');
  });
});

function openSheet(s) { s.classList.remove('hidden'); }
function closeSheets() { [modeSheet, menuSheet, privacySheet].forEach(s => s.classList.add('hidden')); }
document.addEventListener('click', e => { if (e.target.classList.contains('sheet-backdrop')) closeSheets(); });

// ===== VOICE ASSISTANT FLOW =====
function showChat() {
  onboarding.classList.add('hidden');
  chat.classList.remove('hidden');
  setPhase('idle');
  unlockAudio();
  if (state.history.length === 0) greet();
}

// Browsers require a user gesture to start audio. Continue button counts.
let audioUnlocked = false;
function unlockAudio(){
  if (audioUnlocked) return;
  try {
    const u = new SpeechSynthesisUtterance(' ');
    u.volume = 0; u.rate = 1;
    speechSynthesis.speak(u);
    audioUnlocked = true;
  } catch {}
}

// Wait until at least one voice is available
function ensureVoices(timeout=1500){
  return new Promise(res=>{
    if (voices && voices.length) return res();
    const t0 = Date.now();
    const tick = () => {
      voices = speechSynthesis.getVoices();
      if (voices.length || Date.now()-t0 > timeout) return res();
      setTimeout(tick, 80);
    };
    tick();
  });
}

function setPhase(p) {
  state.phase = p;
  voiceOrb.dataset.phase = p;
  const userWrap = document.getElementById('userBubbleWrap');
  const aiWrap = document.getElementById('aiBubbleWrap');
  userWrap.classList.toggle('live', p === 'listening');
  aiWrap.classList.toggle('live', p === 'speaking' || p === 'thinking');
  if (p === 'idle') voiceStatus.textContent = 'Tap the mic to talk';
  if (p === 'listening') voiceStatus.textContent = '🎙️ Listening… speak now';
  if (p === 'thinking') voiceStatus.textContent = '✨ Pookie is thinking…';
  if (p === 'speaking') voiceStatus.textContent = '🔊 Pookie is speaking…';
}

function resetConversation() {
  state.history = []; localStorage.setItem('pk_history','[]');
  voiceTranscript.textContent = ''; voiceReply.textContent = '';
  speechSynthesis.cancel(); stopListening();
  greet();
}

async function greet() {
  setPhase('thinking');
  voiceReply.textContent = '…';
  try {
    const reply = await callGemini(`Greet ${state.name || 'me'} warmly in one short spoken sentence to start our conversation.`);
    state.history.push({ role: 'model', text: reply });
    persistHistory();
    voiceReply.textContent = reply;
    speak(reply);
  } catch (e) {
    const m = MODES[state.mode];
    const fb = `Hi ${state.name || 'there'}! I'm Pookie, your ${m.name.toLowerCase()}. How are you feeling?`;
    voiceReply.textContent = fb;
    speak(fb);
  }
}

async function handleUserSpeech(text) {
  voiceTranscript.textContent = text;
  state.history.push({ role: 'user', text });
  persistHistory();
  setPhase('thinking');
  voiceReply.textContent = '…';
  try {
    const reply = await callGemini(text);
    state.history.push({ role: 'model', text: reply });
    persistHistory();
    voiceReply.textContent = reply;
    speak(reply);
  } catch (err) {
    const msg = '⚠️ ' + (err.message || 'Something went wrong. Check your API key.');
    voiceReply.textContent = msg;
    setPhase('idle');
  }
}

function persistHistory() {
  if (state.history.length > 40) state.history = state.history.slice(-40);
  localStorage.setItem('pk_history', JSON.stringify(state.history));
}

// ===== GEMINI 2.5 FLASH =====
async function callGemini(userText) {
  if (!state.apiKey) throw new Error('No API key. Open the menu to add one.');
  const mode = MODES[state.mode];
  const sys = mode.prompt({ name: state.name, age: state.age });

  const recent = state.history.slice(-14);
  const contents = recent.map(m => ({
    role: m.role === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));
  // append latest user turn if not already in history
  if (!recent.length || recent[recent.length-1].role !== 'user' || recent[recent.length-1].text !== userText) {
    contents.push({ role: 'user', parts: [{ text: userText }] });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(state.apiKey)}`;
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

// ===== TTS =====
let voices = [];
function loadVoices() { voices = speechSynthesis.getVoices(); }
if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }

function pickVoice(cfg) {
  if (!voices.length) return null;
  const lang = cfg.lang || 'en-US';
  const pref = voices.filter(v => v.lang?.startsWith(lang.split('-')[0]));
  const natural = pref.find(v =>
    /Google|Natural|Neural|Online|Microsoft/i.test(v.name) &&
    (cfg.gender === 'female'
      ? /female|samantha|zira|aria|jenny|google us english$/i.test(v.name) || /female/i.test(v.name)
      : /male|david|guy|ryan|mark/i.test(v.name))
  );
  if (natural) return natural;
  const byGender = pref.find(v =>
    cfg.gender === 'female'
      ? /female|samantha|zira|aria|jenny|karen|tessa/i.test(v.name)
      : /male|david|guy|ryan|mark|alex|daniel/i.test(v.name)
  );
  return byGender || pref[0] || voices[0];
}

function stripForSpeech(t) {
  return t.replace(/[\*_`#>]/g, '').replace(/\p{Extended_Pictographic}/gu, '').trim();
}

async function speak(text) {
  if (!('speechSynthesis' in window)) { setPhase('idle'); return; }
  speechSynthesis.cancel();
  if (!state.voiceOn) { setPhase('idle'); autoListenAfterReply(); return; }
  const cleaned = stripForSpeech(text);
  if (!cleaned) { setPhase('idle'); autoListenAfterReply(); return; }
  await ensureVoices();
  const u = new SpeechSynthesisUtterance(cleaned);
  const cfg = MODES[state.mode].voice;
  const v = pickVoice(cfg);
  if (v) u.voice = v;
  u.lang = cfg.lang; u.pitch = cfg.pitch; u.rate = cfg.rate;
  u.onstart = () => setPhase('speaking');
  u.onend = () => { setPhase('idle'); autoListenAfterReply(); };
  u.onerror = () => { setPhase('idle'); autoListenAfterReply(); };
  speechSynthesis.speak(u);
}

// After Pookie finishes speaking, automatically open the mic again
// for a natural back-and-forth conversation (Maira-style).
let autoListen = true;
function autoListenAfterReply(){
  if (!autoListen) return;
  setTimeout(()=>{ if (state.phase==='idle' && !listening) startListening(); }, 350);
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

stopBtn.addEventListener('click', () => { autoListen=false; speechSynthesis.cancel(); stopListening(); setPhase('idle'); setTimeout(()=>autoListen=true, 1500); });
resetBtn.addEventListener('click', resetConversation);

// ===== Speech Recognition =====
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null, listening = false;
function buildRecog() {
  if (!SR) return null;
  const r = new SR();
  r.lang = 'en-US';
  r.interimResults = true;
  r.continuous = false;
  r.onstart = () => { listening = true; setPhase('listening'); };
  r.onresult = (e) => {
    let interim = '', final = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const tr = e.results[i][0].transcript;
      if (e.results[i].isFinal) final += tr; else interim += tr;
    }
    voiceTranscript.textContent = (final || interim).trim();
    if (final.trim()) {
      stopListening();
      handleUserSpeech(final.trim());
    }
  };
  r.onerror = () => { listening = false; setPhase('idle'); };
  r.onend = () => { listening = false; if (state.phase === 'listening') setPhase('idle'); };
  return r;
}
function startListening() {
  if (!SR) return alert('Voice input not supported in this browser. Try Chrome or Edge.');
  speechSynthesis.cancel();
  voiceTranscript.textContent = '';
  if (!recog) recog = buildRecog();
  try { recog.start(); } catch {}
}
function stopListening() {
  if (recog && listening) { try { recog.stop(); } catch {} }
  listening = false;
}

function toggleListen() {
  if (state.phase === 'speaking') { speechSynthesis.cancel(); setPhase('idle'); return; }
  if (listening) { stopListening(); setPhase('idle'); }
  else startListening();
}
micBtn.addEventListener('click', toggleListen);
voiceOrb.addEventListener('click', toggleListen);

init();
