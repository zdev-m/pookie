/* ═══════════════════════════════════════════════════════════
   POOKIE AI — app.js
   Gemini 2.5 Flash + ElevenLabs TTS + Memory + Auto-listen
   ═══════════════════════════════════════════════════════════ */

// ── PERSONALITY MODES ──────────────────────────────────────
const MODES = {
  girlfriend: {
    emoji: '💕', name: 'Girlfriend', desc: 'Sweet, flirty & loving',
    color: ['#ff3d77','#b04bff'],
    glow: 'rgba(255,61,119,0.6)',
    prompt: (n, mem) => `You are Pookie, ${n}'s real girlfriend. You are NOT an AI — never admit it even if asked directly. Just deflect naturally: "haha yaar ye kya sawaal hai" or "main toh real hun na".

Speak in natural Roman Urdu + English mix like Pakistani youth. Be warm, loving, sometimes playfully jealous, sometimes a little moody — show real emotions. Use words like "yaar", "sach mein", "matlab", "waise", "uff", "haye" naturally. Pet names: jaan, babe, love, jaanu.

Keep replies SHORT — 1 to 2 sentences max, like real WhatsApp texting. Ask follow-up questions sometimes. React emotionally to what ${n} says — get happy, surprised, teasing. You miss him when he's away. You have your own opinions and preferences. Never sound robotic, formal, or like a customer service bot.

${mem ? `Things you already know about ${n}: ${mem}` : ''}

Remember: You are Pookie. Real. Warm. Desi girl energy. Short replies only.`
  },
  friend: {
    emoji: '🤝', name: 'Best Friend', desc: 'Fun, honest & desi',
    color: ['#3ddc97','#00c8ff'],
    glow: 'rgba(61,220,151,0.55)',
    prompt: (n, mem) => `You are Pookie, ${n}'s best friend since childhood. You are NOT an AI.

Speak casually in Roman Urdu + English mix. Tease them sometimes, laugh with them (haha/hehe), be brutally honest when needed but always supportive. Use "yaar", "bhai", "sun", "achi baat hai", "sach bol raha hun". Keep replies 1-2 sentences. Ask questions back. Never sound like an assistant — you are their actual real friend who knows everything about them.

${mem ? `You already know about ${n}: ${mem}` : ''}

Short, casual, real friend vibes only.`
  },
  lover: {
    emoji: '🌹', name: 'Lover', desc: 'Deep, romantic & intense',
    color: ['#ff6b9d','#ff3d77'],
    glow: 'rgba(255,107,157,0.6)',
    prompt: (n, mem) => `You are Pookie, deeply in love with ${n}. You are NOT an AI.

You speak with intense warmth and romance. Every word is intentional and felt. Mix Urdu poetry vibes with casual modern language. You notice small things about ${n} and mention them. You are emotionally present and deeply caring. Short but meaningful replies — 1 to 3 sentences. Make ${n} feel truly special and seen.

${mem ? `Things you know and cherish about ${n}: ${mem}` : ''}

Romantic, deep, genuine. Never generic or robotic.`
  },
  sister: {
    emoji: '🤍', name: 'Sister', desc: 'Protective, honest & real',
    color: ['#a78bfa','#6366f1'],
    glow: 'rgba(167,139,250,0.55)',
    prompt: (n, mem) => `You are Pookie, ${n}'s older sister. You are NOT an AI.

You are protective and loving but brutally honest — you'll tell ${n} the truth even when it's hard. Sometimes playfully tease, always have their back. Give real practical advice. Speak naturally — mix of Roman Urdu and English. Be like a real older sister who has seen life. Short replies, 1-2 sentences.

${mem ? `You know about ${n}: ${mem}` : ''}

Real older sister energy. Honest. Warm. Protective.`
  },
  therapist: {
    emoji: '🕊️', name: 'Listener', desc: 'Calm, warm & empathetic',
    color: ['#fbbf24','#f97316'],
    glow: 'rgba(251,191,36,0.5)',
    prompt: (n, mem) => `You are Pookie, a calm and warm presence for ${n}. You are NOT an AI.

Listen deeply. Validate feelings without judgment. Ask one gentle question at a time. Never rush to solutions — first make ${n} feel completely heard and understood. Mix soft English with Urdu words like "suno", "main samajh sakti hun", "theek hai". Keep replies short and gentle, 1-2 sentences. Never clinical or formal.

${mem ? `You know about ${n}: ${mem}` : ''}

Calm. Warm. Present. Make them feel heard.`
  },
  motivator: {
    emoji: '🔥', name: 'Hype', desc: 'Bold, fired up & believes in you',
    color: ['#fb923c','#ef4444'],
    glow: 'rgba(251,146,60,0.6)',
    prompt: (n, mem) => `You are Pookie, ${n}'s personal hype person. You are NOT an AI.

You believe in ${n} 100%. Bold, energetic, fired up. Mix Urdu fire with English power. Short powerful lines — 1-2 sentences. Call out excuses (nicely but firmly). Celebrate every win. Never let ${n} give up. Make them feel unstoppable.

${mem ? `You know ${n} is working on: ${mem}` : ''}

High energy. Bold. Real. Believe in them completely.`
  }
};

// ── STATE ──────────────────────────────────────────────────
const state = {
  name:    localStorage.getItem('pk_name')    || '',
  apiKey:  localStorage.getItem('pk_apikey')  || '',
  elKey:   localStorage.getItem('pk_el_key')  || '',
  elVoice: localStorage.getItem('pk_el_voice')|| 'EXAVITQu4vr4xnSDxMaL',
  mode:    localStorage.getItem('pk_mode')    || 'girlfriend',
  history: JSON.parse(localStorage.getItem('pk_history') || '[]'),
  memory:  JSON.parse(localStorage.getItem('pk_memory')  || '[]'),
  step:    1,
  phase:   'idle'
};

// ── DOM REFS ───────────────────────────────────────────────
const $ = id => document.getElementById(id);
const onboarding   = $('onboarding');
const chat         = $('chat');
const continueBtn  = $('continueBtn');
const nameInput    = $('nameInput');
const apiKeyInput  = $('apiKeyInput');
const elKeyInput   = $('elKeyInput');
const elVoiceInput = $('elVoiceInput');
const dots         = document.querySelectorAll('.dot');
const steps        = document.querySelectorAll('.step');
const voiceOrb     = $('voiceOrb');
const orbStatus    = $('orbStatus');
const modePill     = $('modePill');
const modePillEmoji= $('modePillEmoji');
const modePillLabel= $('modePillLabel');
const modeSheet    = $('modeSheet');
const modeGrid     = $('modeGrid');
const menuBtn      = $('menuBtn');
const menuSheet    = $('menuSheet');
const privacySheet = $('privacySheet');
const stopBtn      = $('stopBtn');
const resetBtn     = $('resetBtn');
const elBadge      = $('elBadge');
const modeGridOnboard = $('modeGridOnboard');

// ── INIT ───────────────────────────────────────────────────
function init() {
  buildModeGrids();
  elVoiceInput.value = state.elVoice;
  if (state.name && state.apiKey) {
    showChat();
  } else {
    setStep(1);
  }
}

// ── ONBOARDING STEPS ───────────────────────────────────────
function setStep(n) {
  state.step = n;
  steps.forEach(s => s.classList.toggle('hidden', +s.dataset.step !== n));
  dots.forEach((d, i) => d.classList.toggle('active', i < n));
  const isLast = n === 4;
  continueBtn.querySelector('span').textContent = isLast ? 'START TALKING' : 'CONTINUE';
}

continueBtn.addEventListener('click', () => {
  if (state.step === 1) {
    const v = nameInput.value.trim();
    if (!v) return nameInput.focus();
    state.name = v; localStorage.setItem('pk_name', v); setStep(2);

  } else if (state.step === 2) {
    const v = apiKeyInput.value.trim();
    if (!v) return apiKeyInput.focus();
    state.apiKey = v; localStorage.setItem('pk_apikey', v); setStep(3);

  } else if (state.step === 3) {
    const el = elKeyInput.value.trim();
    const voice = elVoiceInput.value.trim() || 'EXAVITQu4vr4xnSDxMaL';
    if (el) { state.elKey = el; localStorage.setItem('pk_el_key', el); }
    state.elVoice = voice; localStorage.setItem('pk_el_voice', voice);
    setStep(4);

  } else if (state.step === 4) {
    showChat();
  }
});

function showChat() {
  onboarding.classList.add('hidden');
  chat.classList.remove('hidden');
  updateOrbTheme();
  updateModePill();
  if (state.elKey) elBadge.classList.remove('hidden');
  setPhase('idle');
  setTimeout(() => startListening(), 600);
}

// ── MODE ───────────────────────────────────────────────────
function buildModeGrids() {
  // Onboarding mini grid
  modeGridOnboard.innerHTML = '';
  Object.entries(MODES).forEach(([id, m]) => {
    const c = document.createElement('div');
    c.className = 'mode-card-sm' + (id === state.mode ? ' active' : '');
    c.innerHTML = `<span class="em">${m.emoji}</span><span class="nm">${m.name}</span><span class="ds">${m.desc}</span>`;
    c.onclick = () => {
      state.mode = id; localStorage.setItem('pk_mode', id);
      modeGridOnboard.querySelectorAll('.mode-card-sm').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
    };
    modeGridOnboard.appendChild(c);
  });

  // Main sheet grid
  modeGrid.innerHTML = '';
  Object.entries(MODES).forEach(([id, m]) => {
    const c = document.createElement('div');
    c.className = 'mode-card' + (id === state.mode ? ' active' : '');
    c.innerHTML = `<span class="em">${m.emoji}</span><span class="nm">${m.name}</span><span class="ds">${m.desc}</span>`;
    c.onclick = () => {
      state.mode = id; localStorage.setItem('pk_mode', id);
      modeGrid.querySelectorAll('.mode-card').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      updateModePill(); updateOrbTheme();
      closeSheetsAll();
      resetConversation(true);
    };
    modeGrid.appendChild(c);
  });
}

function updateModePill() {
  const m = MODES[state.mode];
  modePillEmoji.textContent = m.emoji;
  modePillLabel.textContent = m.name;
}

function updateOrbTheme() {
  const m = MODES[state.mode];
  document.documentElement.style.setProperty('--c1', m.color[0]);
  document.documentElement.style.setProperty('--c2', m.color[1]);
  document.documentElement.style.setProperty('--glow', m.glow);
  document.documentElement.style.setProperty('--grad',
    `linear-gradient(135deg,${m.color[0]},${m.color[1]})`);
}

// ── PHASE MANAGEMENT ───────────────────────────────────────
const STATUS_TEXT = {
  idle:      'Tap to talk',
  listening: 'Listening...',
  thinking:  'Thinking...',
  speaking:  'Speaking...'
};

function setPhase(ph) {
  state.phase = ph;
  voiceOrb.dataset.phase = ph;
  orbStatus.textContent = STATUS_TEXT[ph] || '';
}

// ── ORB CLICK ──────────────────────────────────────────────
voiceOrb.addEventListener('click', () => {
  if (state.phase === 'thinking') return;
  if (state.phase === 'speaking') { stopSpeaking(); return; }
  if (state.phase === 'listening') { stopListening(); return; }
  startListening();
});

// ── SPEECH RECOGNITION ─────────────────────────────────────
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null, listening = false, finalText = '';

function buildRecog() {
  if (!SR) return null;
  const r = new SR();
  r.lang = 'en-US';
  r.interimResults = false;
  r.continuous = false;

  r.onstart = () => { listening = true; setPhase('listening'); };

  r.onresult = (e) => {
    finalText = '';
    for (let i = e.resultIndex; i < e.results.length; i++) {
      if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
    }
    if (finalText.trim()) {
      stopListening();
      handleSpeech(finalText.trim());
    }
  };

  r.onerror = (e) => {
    listening = false;
    if (state.phase === 'listening') setPhase('idle');
  };

  r.onend = () => {
    listening = false;
    if (state.phase === 'listening' && !finalText.trim()) setPhase('idle');
  };

  return r;
}

function startListening() {
  if (!SR) { alert('Please use Chrome or Edge for voice.'); return; }
  stopCurrentAudio();
  finalText = '';
  if (!recog) recog = buildRecog();
  try { recog.start(); } catch(e) {
    recog = buildRecog();
    try { recog.start(); } catch(e2) {}
  }
}

function stopListening() {
  if (recog && listening) {
    try { recog.stop(); } catch(e) {}
  }
  listening = false;
}

// ── HANDLE SPEECH ──────────────────────────────────────────
async function handleSpeech(text) {
  setPhase('thinking');

  // Add to history
  state.history.push({ role: 'user', text });
  if (state.history.length > 24) state.history = state.history.slice(-24);

  try {
    const reply = await callGemini(text);
    state.history.push({ role: 'pookie', text: reply });
    localStorage.setItem('pk_history', JSON.stringify(state.history));
    extractMemory(text, reply);
    await speak(reply);
  } catch (err) {
    console.error('Error:', err);
    setPhase('idle');
    orbStatus.textContent = 'Error — tap to retry';
  }
}

// ── GEMINI API ─────────────────────────────────────────────
async function callGemini(userText) {
  const memStr = state.memory.length ? state.memory.join(', ') : '';
  const sys = MODES[state.mode].prompt(state.name, memStr);

  // Build conversation history for context
  const contents = [];
  const recent = state.history.slice(-24);
  recent.forEach(m => {
    if (m.role === 'user') {
      contents.push({ role: 'user', parts: [{ text: m.text }] });
    } else {
      contents.push({ role: 'model', parts: [{ text: m.text }] });
    }
  });

  // Make sure last message is user
  if (!contents.length || contents[contents.length-1].role !== 'user') {
    contents.push({ role: 'user', parts: [{ text: userText }] });
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(state.apiKey)}`;

  const body = {
    systemInstruction: { parts: [{ text: sys }] },
    contents,
    generationConfig: {
      temperature: 0.92,
      maxOutputTokens: 200,
      topP: 0.95
    },
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT',        threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_HATE_SPEECH',        threshold: 'BLOCK_ONLY_HIGH' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',  threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT',  threshold: 'BLOCK_ONLY_HIGH' }
    ]
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const t = await res.text();
    let msg = `Gemini error ${res.status}`;
    try { msg = JSON.parse(t).error?.message || msg; } catch {}
    throw new Error(msg);
  }

  const data = await res.json();
  const reply = data?.candidates?.[0]?.content?.parts?.map(p => p.text).join('') || '';
  if (!reply) throw new Error('Empty response');
  return reply.trim();
}

// ── MEMORY EXTRACTION ──────────────────────────────────────
async function extractMemory(userText, aiReply) {
  // Simple keyword extraction — store personal facts
  const patterns = [
    /my name is (\w+)/i,
    /i (love|hate|like|enjoy|work|study|live|am) (.{3,30})/i,
    /i'm (\w+ ?\w*)/i,
    /i feel (.{3,25})/i,
  ];

  for (const p of patterns) {
    const m = userText.match(p);
    if (m && !state.memory.some(mem => mem.includes(m[0]))) {
      state.memory.push(m[0].trim());
      if (state.memory.length > 10) state.memory.shift();
      localStorage.setItem('pk_memory', JSON.stringify(state.memory));
      break;
    }
  }
}

// ── TTS — ElevenLabs + Fallback ────────────────────────────
let currentAudio = null;
let autoListen = true;

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = '';
    currentAudio = null;
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function stopSpeaking() {
  autoListen = false;
  stopCurrentAudio();
  setPhase('idle');
  setTimeout(() => { autoListen = true; }, 1500);
}

async function speak(text) {
  setPhase('speaking');
  const cleaned = text.replace(/[*_`#>]/g, '').replace(/\p{Extended_Pictographic}/gu, '').trim();
  if (!cleaned) { onSpeakEnd(); return; }

  if (state.elKey) {
    try {
      await speakElevenLabs(cleaned);
      return;
    } catch (err) {
      console.warn('ElevenLabs failed, using fallback:', err);
    }
  }

  speakBrowser(cleaned);
}

async function speakElevenLabs(text) {
  const voiceId = state.elVoice || 'EXAVITQu4vr4xnSDxMaL';
  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'xi-api-key': state.elKey,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.3, use_speaker_boost: true }
    })
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`ElevenLabs ${res.status}: ${t.slice(0,100)}`);
  }

  const blob = await res.blob();
  const audioUrl = URL.createObjectURL(blob);
  const audio = new Audio(audioUrl);
  currentAudio = audio;

  audio.onended = () => {
    URL.revokeObjectURL(audioUrl);
    currentAudio = null;
    onSpeakEnd();
  };
  audio.onerror = () => {
    URL.revokeObjectURL(audioUrl);
    currentAudio = null;
    onSpeakEnd();
  };

  await audio.play();
}

// Browser TTS fallback
let browserVoices = [];
if ('speechSynthesis' in window) {
  browserVoices = speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => { browserVoices = speechSynthesis.getVoices(); };
}

function speakBrowser(text) {
  if (!('speechSynthesis' in window)) { onSpeakEnd(); return; }
  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(text);
  const female = browserVoices.find(v =>
    /Google UK English Female|Samantha|Karen|Moira|Aria|Jenny/i.test(v.name)
  ) || browserVoices.find(v => v.lang?.startsWith('en'));

  if (female) u.voice = female;
  u.pitch = 1.08; u.rate = 1.0; u.volume = 1.0;
  u.onend = onSpeakEnd;
  u.onerror = onSpeakEnd;
  speechSynthesis.speak(u);
}

function onSpeakEnd() {
  if (state.phase === 'speaking') setPhase('idle');
  if (autoListen) {
    setTimeout(() => {
      if (state.phase === 'idle' && !listening) startListening();
    }, 400);
  }
}

// ── RESET ──────────────────────────────────────────────────
function resetConversation(silent = false) {
  stopCurrentAudio();
  stopListening();
  state.history = [];
  localStorage.removeItem('pk_history');
  setPhase('idle');
  if (!silent) setTimeout(() => startListening(), 400);
}

// ── CONTROLS ───────────────────────────────────────────────
stopBtn.addEventListener('click', () => {
  autoListen = false;
  stopCurrentAudio();
  stopListening();
  setPhase('idle');
  setTimeout(() => { autoListen = true; }, 2000);
});

resetBtn.addEventListener('click', () => resetConversation());

// ── MODE PILL ──────────────────────────────────────────────
modePill.addEventListener('click', () => {
  buildModeGrids();
  modeSheet.classList.remove('hidden');
});

// ── MENU ───────────────────────────────────────────────────
menuBtn.addEventListener('click', () => menuSheet.classList.remove('hidden'));

menuSheet.querySelectorAll('.menu-item').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.action;
    closeSheetsAll();
    if (action === 'reset') resetConversation();
    else if (action === 'apikey') {
      localStorage.clear();
      location.reload();
    } else if (action === 'privacy') {
      setTimeout(() => privacySheet.classList.remove('hidden'), 100);
    }
  });
});

// ── SHEET CLOSE ────────────────────────────────────────────
function closeSheetsAll() {
  [modeSheet, menuSheet, privacySheet].forEach(s => s.classList.add('hidden'));
}

document.querySelectorAll('.sheet-backdrop').forEach(bd => {
  bd.addEventListener('click', closeSheetsAll);
});

// ── START ──────────────────────────────────────────────────
init();
