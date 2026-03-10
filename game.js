/**
 * game.js — 遊戲引擎 v2
 * 新增：難度設定、LocalStorage 最高分、背景旋律合成、AudioContext pause/resume
 */
'use strict';

/* ────────── 難度設定 ────────── */
export const DIFFICULTIES = {
  easy: { label: '初學 Easy', perfect: 250, good: 500 },
  normal: { label: '一般 Normal', perfect: 150, good: 320 },
  hard: { label: '高手 Hard', perfect: 80, good: 180 },
  expert: { label: '地獄 Expert', perfect: 40, good: 100 },
};

let PERFECT_MS = 150;
let GOOD_MS = 320;

/* ────────── 音符頻率 / 色彩 ────────── */
const NOTE_FREQS = [0, 261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88];
const NOTE_COLORS = ['#444466', '#ff6b6b', '#ff9f43', '#ffd32a', '#0be881', '#00d2d3', '#54a0ff', '#c44cff'];

/* ────────── 遊戲狀態 ────────── */
export const gState = {
  status: 'idle', // idle, playing, paused, result
  song: null,
  bpm: 120,
  score: 0,
  combo: 0,
  maxCombo: 0,
  perfects: 0,
  goods: 0,
  misses: 0,
  startTime: 0,
  activeNotes: [],
  judgeWidth: 100,
  difficulty: 1, // 難度倍率
  settings: { metronome: false, hitSound: 'default' },
  // 玩家生涯數據與成就
  stats: {
    playCount: 0,
    fullCombos: 0,
    achievements: [] // 儲存已解鎖的成就ID: ['novice', 'master', 'pitch']
  },
  // Internal state (not exported, reset on game start)
  _internal: {
    beat: 600,
    noteQueue: [],
    totalNotes: 0,
    gameDuration: 0,
    _pauseAt: 0,
    trackWidth: 0,
    animId: null,
  }
};

// 讀取本地端存檔
try {
  const savedStats = localStorage.getItem('rhythm_stats');
  if (savedStats) {
    gState.stats = { ...gState.stats, ...JSON.parse(savedStats) };
  }
} catch (e) { console.error("Failed to load stats", e) }

/* ────────── DOM & 回呼 ────────── */
let DOM = {};
let onEndCallback = null;

export function initGame(domRefs) {
  DOM = domRefs;
  window.addEventListener('resize', _updateDims);
}
export function setOnEnd(cb) { onEndCallback = cb; }

function _getBH() {
  return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--bh')) || 54;
}

function _updateDims() {
  gState._internal.trackWidth = DOM.trackEl?.offsetWidth || window.innerWidth;
  gState.judgeWidth = parseInt(getComputedStyle(document.documentElement)
    .getPropertyValue('--jw')) || 110;
}

/* ────────── 開始遊戲 ────────── */
export function startGame(song, bpmOverride, difficulty = 'normal', settings = {}) {
  const diff = DIFFICULTIES[difficulty] || DIFFICULTIES.normal;
  PERFECT_MS = diff.perfect;
  GOOD_MS = diff.good;

  const bpm = bpmOverride || song.bpm;
  const beat = 60000 / bpm;

  let cursor = 0;
  const notes = song.notes.map((n, i) => {
    const t = cursor;
    cursor += n.dur * beat;
    return { ...n, id: i, targetTime: t, hit: false, missed: false, el: null, tailEl: null };
  });

  // Reset gState for new game
  gState.status = 'countdown';
  gState.song = song;
  gState.bpm = bpm;
  gState.difficulty = difficulty;
  gState.settings = { ...gState.settings, ...settings };
  gState.score = 0;
  gState.combo = 0;
  gState.maxCombo = 0;
  gState.perfects = 0;
  gState.goods = 0;
  gState.misses = 0;
  gState.activeNotes = [];

  // Set internal state
  gState._internal.beat = beat;
  gState._internal.noteQueue = notes.slice();
  gState._internal.totalNotes = notes.length;
  gState._internal.gameDuration = cursor;

  _updateDims();
  _clearTrack();
  _scheduleBackgroundMelody(song, bpm);
  _showCountdown(3, () => {
    gState.status = 'playing';
    gState.startTime = performance.now();
    _loop();
  });
}

/* ────────── 清除軌道 ────────── */
function _clearTrack() {
  DOM.trackEl.innerHTML = '';
  const jl = document.createElement('div');
  jl.className = 'jline';
  DOM.trackEl.appendChild(jl);
}

/* ────────── 倒數 ────────── */
function _showCountdown(n, cb) {
  const ov = document.createElement('div'); ov.className = 'cd-ov';
  const nm = document.createElement('div'); nm.className = 'cd-num';
  ov.appendChild(nm); document.body.appendChild(ov);
  let cur = n;
  const tick = () => {
    if (cur === 0) { ov.remove(); cb(); return; }
    nm.textContent = cur;
    nm.style.animation = 'none'; nm.offsetWidth; nm.style.animation = '';
    cur--;
    setTimeout(tick, 900);
  };
  tick();
}

/* ────────── 主循環 ────────── */
function _loop() {
  if (gState.status !== 'playing') return;
  const elapsed = performance.now() - gState.startTime;
  _spawnNotes(elapsed);
  _moveNotes(elapsed);
  _checkMiss(elapsed);
  DOM.progressBar.style.width = Math.min(100, (elapsed / gState._internal.gameDuration) * 100) + '%';
  if (gState._internal.noteQueue.length === 0 && gState.activeNotes.length === 0) { _endGame(); return; }
  gState._internal.animId = requestAnimationFrame(_loop);
}

/* ────────── 音符生成 ────────── */
function _getSpeed() { return 0.25 * (gState.bpm / 100); }

function _spawnNotes(elapsed) {
  const speed = _getSpeed();
  const lead = (gState._internal.trackWidth - gState.judgeWidth) / speed + 200;
  while (gState._internal.noteQueue.length > 0 && gState._internal.noteQueue[0].targetTime <= elapsed + lead) {
    const note = gState._internal.noteQueue.shift();
    _spawnNote(note, elapsed, speed);
    gState.activeNotes.push(note);
  }
}

function _spawnNote(note, elapsed, speed) {
  const track = DOM.trackEl;
  if (note.dur > 1 && note.num !== 0) {
    const tail = document.createElement('div'); tail.className = 'ntail';
    const bh = _getBH();
    const tailLen = note.dur * gState._internal.beat * speed - bh;
    tail.style.width = Math.max(0, tailLen) + 'px';
    tail.style.background = NOTE_COLORS[note.num];
    track.appendChild(tail); note.tailEl = tail;
  }
  const ball = document.createElement('div'); ball.className = 'nball';
  ball.setAttribute('data-n', note.num);
  ball.textContent = note.num === 0 ? '－' : note.num + '';
  track.appendChild(ball); note.el = ball;
  _setX(note, gState.judgeWidth + (note.targetTime - elapsed) * speed);
}

function _setX(note, x) {
  const h = _getBH() / 2;
  if (note.el) note.el.style.left = (x - h) + 'px';
  if (note.tailEl) note.tailEl.style.left = (x - h) + 'px';
}

/* ────────── 移動音符 ────────── */
function _moveNotes(elapsed) {
  const speed = _getSpeed();
  for (const note of gState.activeNotes) {
    if (note.hit || note.missed) continue;
    _setX(note, gState.judgeWidth + (note.targetTime - elapsed) * speed);
  }
}

/* ────────── Miss 判定 ────────── */
function _checkMiss(elapsed) {
  for (const note of gState.activeNotes) {
    if (!note.hit && !note.missed && elapsed - note.targetTime > GOOD_MS)
      _registerMiss(note);
  }
  gState.activeNotes = gState.activeNotes.filter(n => {
    if ((n.hit || n.missed) && n.el && !n.el.classList.contains('hit') && !n.el.classList.contains('miss')) {
      _removeSoon(n); return false;
    }
    return true;
  });
}

function _removeSoon(note, ms = 400) {
  setTimeout(() => { note.el?.remove(); note.tailEl?.remove(); }, ms);
}

/* ────────── 玩家輸入 ────────── */
export function playerInput(num) {
  if (gState.status !== 'playing') return;
  const elapsed = performance.now() - gState.startTime;
  let best = null, bestDiff = Infinity, rawDiff = 0;
  for (const note of gState.activeNotes) {
    if (note.hit || note.missed || note.num === 0 || note.num !== num) continue;
    const diff = elapsed - note.targetTime;  // Negative means Early, Positive means Late
    const absDiff = Math.abs(diff);
    if (absDiff < bestDiff) { bestDiff = absDiff; best = note; rawDiff = diff; }
  }
  if (!best) { flashKey(num, false); return; }

  // Decide early/late status text (only shown on good/miss)
  const timingStatus = rawDiff < -20 ? 'EARLY' : (rawDiff > 20 ? 'LATE' : '');

  if (bestDiff <= PERFECT_MS) _registerHit(best, 'perfect');
  else if (bestDiff <= GOOD_MS) _registerHit(best, 'good', timingStatus);
  else flashKey(num, false);
}

/* ────────── 命中 / Miss ────────── */
function _registerHit(note, grade, timingStatus = '') {
  note.hit = true;
  gState.combo++;
  gState.maxCombo = Math.max(gState.maxCombo, gState.combo);
  _updateComboEffects(); // Update combo visuals

  if (grade === 'perfect') {
    gState.score += 100 + Math.min(gState.combo * 2, 50);
    gState.perfects++;
    _showJudgeText(note, 'PERFECT!', 'perfect');
    _spawnParticles(note);
  } else {
    gState.score += 60 + Math.min(gState.combo, 20);
    gState.goods++;
    _showJudgeText(note, 'GOOD', 'good', timingStatus);
  }
  note.el?.classList.add('hit');
  _updateHUD();
  _playHitSound(note.num, grade);
  _removeSoon(note, 380);
  gState.activeNotes = gState.activeNotes.filter(n => n !== note);
}

function _registerMiss(note) {
  note.missed = true; gState.combo = 0; gState.misses++;
  _updateComboEffects();
  // For untouched notes that scroll past, timing is always late
  _showJudgeText(note, 'MISS', 'miss', 'LATE');
  note.el?.classList.add('miss');
  _updateHUD();
  _removeSoon(note, 280);
  gState.activeNotes = gState.activeNotes.filter(n => n !== note);
}

function _updateHUD() {
  if (DOM.scoreEl) DOM.scoreEl.textContent = gState.score.toLocaleString();
  if (DOM.comboEl) DOM.comboEl.textContent = gState.combo > 0 ? `×${gState.combo}` : '';
}

/* ────────── 視覺效果 ────────── */
function _updateComboEffects() {
  const c = gState.combo;
  document.body.classList.remove('cb-10', 'cb-20');
  if (c >= 20) document.body.classList.add('cb-20');
  else if (c >= 10) document.body.classList.add('cb-10');
}

function _showJudgeText(note, text, cls, subText = '') {
  const div = document.createElement('div');
  div.className = `jtxt ${cls}`;
  div.textContent = text;
  if (subText) {
    const sub = document.createElement('div');
    sub.className = 'jtxt-sub'; sub.textContent = subText;
    div.appendChild(sub);
  }
  div.style.left = gState.judgeWidth + 'px';
  DOM.trackEl.appendChild(div);
  setTimeout(() => div.remove(), 700);
}

function _spawnParticles(note) {
  const x = gState.judgeWidth, y = DOM.trackEl.offsetHeight / 2;
  const color = NOTE_COLORS[note.num] || '#fff';
  for (let i = 0; i < 10; i++) {
    const p = document.createElement('div'); p.className = 'particle';
    const sz = Math.random() * 8 + 5;
    const ang = (Math.PI * 2 * i / 10) + Math.random() * 0.5;
    const dist = 40 + Math.random() * 50;
    p.style.cssText = `width:${sz}px;height:${sz}px;background:${color};left:${x}px;top:${y}px;--dx:${Math.cos(ang) * dist}px;--dy:${Math.sin(ang) * dist}px`;
    DOM.trackEl.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}

export function flashKey(num, success) {
  const key = DOM.keyCaps ? DOM.keyCaps[num] : document.getElementById('k' + num);
  if (!key) return;
  key.classList.remove('pressed', 'wrong');
  key.classList.add(success ? 'pressed' : 'wrong');
  setTimeout(() => key.classList.remove('pressed', 'wrong'), 150);
}

/* ────────── Web Audio ────────── */
let audioCtx = null;
function _getACtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function _playHitSound(num, grade) {
  try {
    const ctx = _getACtx();
    if (ctx.state === 'suspended') ctx.resume();

    const soundType = gState.settings.hitSound;

    if (soundType === 'taiko') {
      // 模擬太鼓聲音：紅色系 (1) 為「咚」(低頻)，其他為「喀」(高頻邊緣)
      const isDon = num === 1;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);

      if (isDon) {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.8, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.6, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      }
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.15);

    } else if (soundType === 'cat') {
      // 模擬貓咪「喵」的滑音
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'triangle';

      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(800, ctx.currentTime + 0.05); // 上揚
      osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.2); // 下滑

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);

    } else {
      // 預設效果 (電子弦樂)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = grade === 'perfect' ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(NOTE_FREQS[num], ctx.currentTime);
      gain.gain.setValueAtTime(0, ctx.currentTime);
      const vol = grade === 'perfect' ? 0.2 : 0.1;
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (_) { }
}

/* ────────── 背景旋律（Web Audio 排程）────────── */
let bgSources = [];

function _scheduleBackgroundMelody(song, bpm) {
  _stopBackgroundMelody();
  try {
    const ctx = _getACtx();
    const beat = 60 / bpm;              // 秒/拍
    let t = ctx.currentTime + 2.8;      // 對齊倒數結束後

    // 排程節拍器 (Metronome)
    if (gState.settings.metronome) {
      const totalDur = song.notes.reduce((acc, n) => acc + n.dur, 0);
      for (let i = 0; i < totalDur; i++) {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.value = i % 4 === 0 ? 800 : 600; // 第一拍高音
        gain.gain.setValueAtTime(0, t + (i * beat));
        gain.gain.linearRampToValueAtTime(0.04, t + (i * beat) + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, t + (i * beat) + 0.1);
        osc.start(t + (i * beat)); osc.stop(t + (i * beat) + 0.15);
        bgSources.push(osc);
      }
    }

    for (const note of song.notes) {
      if (note.num !== 0) {
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.value = NOTE_FREQS[note.num];
        const dur = note.dur * beat;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.08, t + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, t + dur * 0.88);
        osc.start(t); osc.stop(t + dur);
        bgSources.push(osc);
      }
      t += note.dur * beat;
    }
  } catch (_) { }
}

function _stopBackgroundMelody() {
  for (const src of bgSources) { try { src.stop(0); } catch { } }
  bgSources = [];
}

/* ────────── 暫停（AudioContext suspend/resume）────────── */
export function togglePause() {
  if (gState.status === 'playing') {
    gState.status = 'paused'; gState._internal._pauseAt = performance.now();
    cancelAnimationFrame(gState._internal.animId);
    try { audioCtx?.suspend(); } catch (_) { }
    if (DOM.pauseOverlay) DOM.pauseOverlay.style.display = 'flex';
  } else if (gState.status === 'paused') {
    gState.startTime += performance.now() - gState._internal._pauseAt;
    gState.status = 'playing';
    try { audioCtx?.resume(); } catch (_) { }
    if (DOM.pauseOverlay) DOM.pauseOverlay.style.display = 'none';
    _loop();
  }
}

/* ────────── 結束遊戲 ────────── */
function _endGame() {
  cancelAnimationFrame(gState._internal.animId);
  gState.status = 'result';
  _stopBackgroundMelody();
  try { if (audioCtx?.state === 'suspended') audioCtx.resume(); } catch { }

  const pct = gState._internal.totalNotes > 0
    ? (gState.perfects + gState.goods * 0.5) / gState._internal.totalNotes : 0;
  const grade = pct >= 0.9 ? 'S' : pct >= 0.7 ? 'A' : pct >= 0.5 ? 'B' : 'C';

  // 結束和弦音效
  try {
    const ctx = _getACtx();
    [523, 659, 784, 1047].slice(0, grade === 'S' ? 4 : grade === 'A' ? 3 : grade === 'B' ? 2 : 1)
      .forEach((hz, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.connect(g); g.connect(ctx.destination);
        o.frequency.value = hz;
        const t = ctx.currentTime + i * 0.18;
        g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.start(t); o.stop(t + 0.45);
      });
  } catch (_) { }

  // --- 成就與數據結算 ---
  gState.stats.playCount++;

  const isFullCombo = gState.misses === 0 && (gState.perfects + gState.goods) > 0;
  if (isFullCombo) gState.stats.fullCombos++;

  const newUnlocks = [];
  const checkUnlock = (id) => {
    if (!gState.stats.achievements.includes(id)) {
      gState.stats.achievements.push(id);
      newUnlocks.push(id);
    }
  };

  // 1. 初出茅廬：以 A 以上成績通關
  if (['S', 'A'].includes(grade)) checkUnlock('novice');

  // 2. 節奏大師：單次 100 連擊
  if (gState.maxCombo >= 100) checkUnlock('master');

  // 3. 絕對音感：麥克風模式 A 以上 (測試方便先用 A 以上)
  if (gState.song.inputType === 'mic' && ['S', 'A'].includes(grade)) checkUnlock('pitch');

  try { localStorage.setItem('rhythm_stats', JSON.stringify(gState.stats)); } catch (_) { }

  const result = {
    score: gState.score, grade,
    accuracy: Math.round(pct * 100),
    combo: gState.maxCombo,
    perfects: gState.perfects, goods: gState.goods, misses: gState.misses,
    total: gState._internal.totalNotes,
    songId: gState.song.id, songTitle: gState.song.title,
    difficulty: gState.difficulty,
    isNewRecord: saveBestScore(gState.song.id, {
      score: gState.score, grade,
      accuracy: Math.round(pct * 100), difficulty: gState.difficulty,
    }),
    newUnlocks // 新解鎖的成就
  };

  if (onEndCallback) onEndCallback(result);
}

/* ────────── LocalStorage 最高分 ────────── */
const LS_KEY = 'rhythm_hs_v1';

function _loadScores() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
}

export function saveBestScore(songId, data) {
  const all = _loadScores(), prev = all[songId];
  if (!prev || data.score > prev.score) {
    all[songId] = { ...data, date: new Date().toLocaleDateString('zh-TW') };
    try { localStorage.setItem(LS_KEY, JSON.stringify(all)); } catch { }
    return true;
  }
  return false;
}

export function getBestScore(songId) { return _loadScores()[songId] || null; }

/* ────────── 公開 API ────────── */
export function getStatus() { return gState.status; }
export function stopGame() {
  cancelAnimationFrame(gState.animId);
  _stopBackgroundMelody();
  try { if (audioCtx?.state === 'suspended') audioCtx.resume(); } catch { }
  gState.status = 'idle';
}
