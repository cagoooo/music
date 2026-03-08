/**
 * index.js — 主控制器 v2 (ES Module)
 * 協調 UI、遊戲引擎、輸入系統
 * 功能：難度選擇、LocalStorage 最高分顯示、觸控按鍵、模式切換
 */
'use strict';

import {
    initGame, startGame, togglePause, getStatus, stopGame,
    setOnEnd, getBestScore, DIFFICULTIES,
} from './game.js';

import {
    startKeyboardMode, startMicMode, stopAllInputs, bindTouchKeys,
} from './input.js';

/* ════════════ 曲目資料 ════════════ */
const SONGS = [
    {
        id: 'star', title: '小星星', subtitle: 'Twinkle Twinkle Little Star', bpm: 96, difficulty: 1,
        notes: [
            { num: 1, dur: 1 }, { num: 1, dur: 1 }, { num: 5, dur: 1 }, { num: 5, dur: 1 }, { num: 6, dur: 1 }, { num: 6, dur: 1 }, { num: 5, dur: 2 },
            { num: 4, dur: 1 }, { num: 4, dur: 1 }, { num: 3, dur: 1 }, { num: 3, dur: 1 }, { num: 2, dur: 1 }, { num: 2, dur: 1 }, { num: 1, dur: 2 },
            { num: 5, dur: 1 }, { num: 5, dur: 1 }, { num: 4, dur: 1 }, { num: 4, dur: 1 }, { num: 3, dur: 1 }, { num: 3, dur: 1 }, { num: 2, dur: 2 },
            { num: 5, dur: 1 }, { num: 5, dur: 1 }, { num: 4, dur: 1 }, { num: 4, dur: 1 }, { num: 3, dur: 1 }, { num: 3, dur: 1 }, { num: 2, dur: 2 },
            { num: 1, dur: 1 }, { num: 1, dur: 1 }, { num: 5, dur: 1 }, { num: 5, dur: 1 }, { num: 6, dur: 1 }, { num: 6, dur: 1 }, { num: 5, dur: 2 },
            { num: 4, dur: 1 }, { num: 4, dur: 1 }, { num: 3, dur: 1 }, { num: 3, dur: 1 }, { num: 2, dur: 1 }, { num: 2, dur: 1 }, { num: 1, dur: 2 },
        ],
    },
    {
        id: 'birthday', title: '生日快樂', subtitle: 'Happy Birthday to You', bpm: 88, difficulty: 1,
        notes: [
            { num: 5, dur: .75 }, { num: 5, dur: .25 }, { num: 6, dur: 1 }, { num: 5, dur: 1 }, { num: 1, dur: 1 }, { num: 7, dur: 2 },
            { num: 5, dur: .75 }, { num: 5, dur: .25 }, { num: 6, dur: 1 }, { num: 5, dur: 1 }, { num: 2, dur: 1 }, { num: 1, dur: 2 },
            { num: 5, dur: .75 }, { num: 5, dur: .25 }, { num: 5, dur: 1 }, { num: 3, dur: 1 }, { num: 1, dur: 1 }, { num: 7, dur: 1 }, { num: 6, dur: 2 },
            { num: 4, dur: .75 }, { num: 4, dur: .25 }, { num: 3, dur: 1 }, { num: 1, dur: 1 }, { num: 2, dur: 1 }, { num: 1, dur: 2 },
        ],
    },
    {
        id: 'tiger', title: '兩隻老虎', subtitle: 'Are You Sleeping', bpm: 116, difficulty: 1,
        notes: [
            { num: 1, dur: 1 }, { num: 2, dur: 1 }, { num: 3, dur: 1 }, { num: 1, dur: 1 }, { num: 1, dur: 1 }, { num: 2, dur: 1 }, { num: 3, dur: 1 }, { num: 1, dur: 1 },
            { num: 3, dur: 1 }, { num: 4, dur: 1 }, { num: 5, dur: 2 }, { num: 3, dur: 1 }, { num: 4, dur: 1 }, { num: 5, dur: 2 },
            { num: 5, dur: .5 }, { num: 6, dur: .5 }, { num: 5, dur: .5 }, { num: 4, dur: .5 }, { num: 3, dur: 1 }, { num: 1, dur: 1 },
            { num: 5, dur: .5 }, { num: 6, dur: .5 }, { num: 5, dur: .5 }, { num: 4, dur: .5 }, { num: 3, dur: 1 }, { num: 1, dur: 1 },
            { num: 2, dur: 1 }, { num: 5, dur: 1 }, { num: 1, dur: 2 }, { num: 2, dur: 1 }, { num: 5, dur: 1 }, { num: 1, dur: 2 },
        ],
    },
    {
        id: 'dark', title: '天黑黑', subtitle: '台灣童謠', bpm: 108, difficulty: 2,
        notes: [
            { num: 5, dur: 1 }, { num: 3, dur: 1 }, { num: 5, dur: 1 }, { num: 3, dur: 1 }, { num: 2, dur: 1 }, { num: 3, dur: 1 }, { num: 2, dur: 2 },
            { num: 1, dur: 1 }, { num: 2, dur: 1 }, { num: 3, dur: 1 }, { num: 5, dur: 1 }, { num: 3, dur: 2 }, { num: 2, dur: 2 },
            { num: 5, dur: 1 }, { num: 3, dur: 1 }, { num: 5, dur: 1 }, { num: 3, dur: 1 }, { num: 2, dur: 1 }, { num: 1, dur: 1 }, { num: 2, dur: 2 },
            { num: 3, dur: 1 }, { num: 5, dur: 1 }, { num: 6, dur: 1 }, { num: 5, dur: 1 }, { num: 3, dur: 2 }, { num: 1, dur: 2 },
        ],
    },
    {
        id: 'moon', title: '月亮代表我的心', subtitle: '鄧麗君', bpm: 72, difficulty: 2,
        notes: [
            { num: 3, dur: 1 }, { num: 3, dur: 1 }, { num: 5, dur: 1 }, { num: 6, dur: 1 }, { num: 1, dur: 2 }, { num: 6, dur: 1 }, { num: 5, dur: 1 },
            { num: 3, dur: 1 }, { num: 3, dur: 1 }, { num: 2, dur: 1 }, { num: 3, dur: 1 }, { num: 5, dur: 4 },
            { num: 3, dur: 1 }, { num: 3, dur: 1 }, { num: 5, dur: 1 }, { num: 6, dur: 1 }, { num: 1, dur: 2 }, { num: 7, dur: 1 }, { num: 6, dur: 1 },
            { num: 5, dur: 1 }, { num: 6, dur: 1 }, { num: 5, dur: 1 }, { num: 3, dur: 1 }, { num: 2, dur: 4 },
        ],
    },
];

/* ════════════ UI 狀態 ════════════ */
let currentMode = 'keyboard';
let currentDiff = 'normal';
let currentBpm = 100;
let lastSong = null;

/* ════════════ DOM helper ════════════ */
const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

/* ════════════ 初始化 ════════════ */
document.addEventListener('DOMContentLoaded', () => {
    // keyCaps map: { 0: el, 1: el, ... 7: el }
    const keyCaps = {};
    for (let i = 0; i <= 7; i++) keyCaps[i] = $('k' + i);

    initGame({
        trackEl: $('track-el'),
        progressBar: $('prog-bar'),
        scoreEl: $('score-el'),
        comboEl: $('combo-el'),
        pauseOverlay: $('pause-ov'),
        keyCaps,
        bh: 54,
    });

    setOnEnd(_showResult);

    buildMenu();
    _buildStars();
    _initModeButtons();
    _initDiffButtons();
    _initBpmSlider();

    // 觸控按鍵（khint 是按鍵容器）
    bindTouchKeys($('khint'));

    // ESC 暫停
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && ['playing', 'paused'].includes(getStatus())) togglePause();
    });
});

/* ════════════ 選曲卡片（含最高分）════════════ */
export function buildMenu() {
    const grid = $('song-grid');
    grid.innerHTML = '';
    const dlabels = ['', '初級', '中級', '進階'];

    SONGS.forEach(s => {
        const best = getBestScore(s.id);
        const c = document.createElement('div');
        c.className = 'scard';
        c.innerHTML = `
      ${best ? `<div class="best-badge">⭐ ${best.grade}&nbsp;&nbsp;${best.score.toLocaleString()}</div>` : ''}
      <div class="st">${s.title}</div>
      <div class="ss">${s.subtitle || ''}</div>
      <div class="sm">
        <span class="badge d${s.difficulty}">${dlabels[s.difficulty] || '初級'}</span>
        <span class="badge">♩ ${s.bpm} BPM</span>
        <span class="badge">${s.notes.length} 音符</span>
      </div>`;
        c.onclick = () => beginSong(s);
        grid.appendChild(c);
    });
}

/* ════════════ 按鍵初始化 ════════════ */
function _initModeButtons() {
    $('mb-keyboard').onclick = () => _setMode('keyboard');
    $('mb-mic').onclick = () => _setMode('mic');
    $('mb-custom').onclick = () => _setMode('custom');
}

function _setMode(m) {
    currentMode = m;
    $$('.mbtn[data-mode]').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mbtn[data-mode="${m}"]`)?.classList.add('active');
    $('custom-box').style.display = m === 'custom' ? 'block' : 'none';
}

function _initDiffButtons() {
    $$('.dbtn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentDiff = btn.dataset.diff;
            $$('.dbtn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function _initBpmSlider() {
    const sl = $('bpm-sl'), lbl = $('bpm-v');
    sl.oninput = (e) => { currentBpm = +e.target.value; lbl.textContent = currentBpm + ' BPM'; };
}

/* ════════════ 開始遊戲 ════════════ */
function beginSong(song) {
    lastSong = song;
    stopAllInputs();

    $('hdr-right').style.display = 'flex';
    $('hdr-song').textContent = song.title;
    $('score-el').textContent = '0';
    $('combo-el').textContent = '';
    $('prog-bar').style.width = '0%';

    const useMic = currentMode === 'mic';
    $('mic-bar').style.display = useMic ? 'flex' : 'none';

    _showView('view-game');

    if (useMic) {
        startMicMode((noteNum) => {
            const lb = ['—', 'Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
            $('mic-note').textContent = lb[noteNum] || '—';
        });
    } else {
        startKeyboardMode();
    }

    startGame(song, currentBpm || null, currentDiff);
}

/* ════════════ 自訂簡譜 ════════════ */
window.startCustom = () => {
    const raw = $('custom-in').value.trim();
    const title = $('custom-title').value || '自訂旋律';
    if (!raw) { alert('請輸入簡譜！'); return; }
    const toks = raw.split(/[\s,，]+/).filter(Boolean);
    const notes = [];
    toks.forEach(t => {
        const dot = t.endsWith('.');
        const num = parseInt(t);
        if (!isNaN(num) && num >= 0 && num <= 7) notes.push({ num, dur: dot ? 1.5 : 1 });
    });
    if (!notes.length) { alert('沒有有效音符！'); return; }
    beginSong({ id: 'custom', title, subtitle: '自訂', bpm: currentBpm, difficulty: 1, notes });
};

/* ════════════ 暫停 / 選單 / 重玩 ════════════ */
window.doPause = () => togglePause();
window.goMenu = () => {
    stopAllInputs(); stopGame();
    $('hdr-right').style.display = 'none';
    buildMenu();
    _showView('view-menu');
};
window.doReplay = () => { if (lastSong) beginSong(lastSong); };

/* ════════════ 結果畫面 ════════════ */
function _showResult(r) {
    $('hdr-right').style.display = 'none';
    $('rgrade').textContent = r.grade;
    $('rgrade').className = 'rgrade g' + r.grade;
    $('rsong').textContent = '♪ ' + r.songTitle;
    $('r-score').textContent = r.score.toLocaleString();
    $('r-combo').textContent = r.combo;
    $('r-perf').textContent = r.perfects;
    $('r-good').textContent = r.goods;
    $('r-miss').textContent = r.misses;
    $('r-acc').textContent = r.accuracy + '%';
    const newRec = $('r-newrec');
    if (newRec) newRec.style.display = r.isNewRecord ? 'flex' : 'none';
    _showView('view-result');
}

/* ════════════ 工具 ════════════ */
function _showView(id) {
    $$('.view').forEach(v => v.classList.remove('active'));
    $(id).classList.add('active');
}

function _buildStars() {
    const sc = $('stars');
    for (let i = 0; i < 120; i++) {
        const s = document.createElement('div'); s.className = 'star';
        const sz = Math.random() * 2.5 + 0.5;
        s.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random() * 100}%;top:${Math.random() * 100}%;animation-duration:${2 + Math.random() * 4}s;animation-delay:${Math.random() * 4}s`;
        sc.appendChild(s);
    }
}
