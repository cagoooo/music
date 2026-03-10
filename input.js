/**
 * input.js — 輸入系統 v2
 * 新增：觸控虛擬按鍵（多點觸控 touchstart）
 */
'use strict';

import { playerInput, flashKey, getStatus } from './game.js';

/* ── 音高辨識頻率表（C4 ~ B5 雙八度）── */
const SCALE_FREQS = [
    { num: 1, hz: 261.63 }, { num: 2, hz: 293.66 }, { num: 3, hz: 329.63 },
    { num: 4, hz: 349.23 }, { num: 5, hz: 392.00 }, { num: 6, hz: 440.00 },
    { num: 7, hz: 493.88 },
    { num: 1, hz: 523.25 }, { num: 2, hz: 587.33 }, { num: 3, hz: 659.25 },
    { num: 4, hz: 698.46 }, { num: 5, hz: 783.99 }, { num: 6, hz: 880.00 },
    { num: 7, hz: 987.77 },
];

/* ════════════ 鍵盤 ════════════ */
let keydownHandler = null;

export function startKeyboardMode() {
    stopKeyboardMode();
    keydownHandler = (e) => {
        if (getStatus() !== 'playing') return;
        const map = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '0': 0 };
        const num = map[e.key];
        if (num === undefined) return;
        e.preventDefault();
        flashKey(num, true);
        playerInput(num);
    };
    window.addEventListener('keydown', keydownHandler);
}

export function stopKeyboardMode() {
    if (keydownHandler) { window.removeEventListener('keydown', keydownHandler); keydownHandler = null; }
}

/* ════════════ 觸控虛擬按鍵 ════════════ */
let _touchTarget = null;
let _touchHandler = null;

/**
 * 綁定觸控事件到包含 .k 按鍵的容器元素
 * 利用 touchstart + elementFromPoint 支援多指同時觸控
 */
export function bindTouchKeys(container) {
    unbindTouchKeys();
    _touchTarget = container;
    _touchHandler = (e) => {
        if (e.cancelable) e.preventDefault();  // 阻止捲動與縮放
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const keyEl = el?.closest?.('[data-num]') || (el?.dataset?.num != null ? el : null);
        if (!keyEl) return;
        const num = parseInt(keyEl.dataset.num);
        if (!isNaN(num) && num >= 0 && num <= 7) {
            flashKey(num, true);
            playerInput(num);
        }
    };
    // 使用 pointerdown 可以更即時且支援滑鼠與觸控
    container.addEventListener('pointerdown', _touchHandler, { passive: false });
}

export function unbindTouchKeys() {
    if (_touchTarget && _touchHandler) {
        _touchTarget.removeEventListener('pointerdown', _touchHandler);
    }
    _touchTarget = _touchHandler = null;
}

/* ════════════ 麥克風 ════════════ */
let micStream = null, micAudioCtx = null, micAnalyser = null, micBuffer = null;
let micRunning = false, micNoteCallback = null;

export async function startMicMode(onNoteDetected) {
    micNoteCallback = onNoteDetected || (() => { });
    try {
        micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        micAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = micAudioCtx.createMediaStreamSource(micStream);
        micAnalyser = micAudioCtx.createAnalyser();
        micAnalyser.fftSize = 2048;
        source.connect(micAnalyser);
        micBuffer = new Float32Array(micAnalyser.fftSize);
        micRunning = true;
        _micLoop();
        return true;
    } catch (err) {
        console.warn('麥克風開啟失敗：', err);
        return false;
    }
}

export function stopMicMode() {
    micRunning = false;
    micStream?.getTracks().forEach(t => t.stop());
    try { micAudioCtx?.close(); } catch { }
    micStream = micAudioCtx = micAnalyser = micBuffer = null;
}

function _micLoop() {
    if (!micRunning) return;
    requestAnimationFrame(_micLoop);
    micAnalyser.getFloatTimeDomainData(micBuffer);
    const freq = _autocorrelate(micBuffer, micAudioCtx.sampleRate);
    if (freq > 0) {
        const noteNum = _freqToNoteNum(freq);
        if (noteNum !== null) {
            micNoteCallback(noteNum);
            if (getStatus() === 'playing') playerInput(noteNum);
        }
    }
}

function _autocorrelate(buf, sampleRate) {
    let SIZE = buf.length, rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < 0.012) return -1;
    let r1 = 0, r2 = SIZE - 1;
    for (let i = 0; i < SIZE / 2; i++) { if (Math.abs(buf[i]) < 0.2) { r1 = i; break; } }
    for (let i = 1; i < SIZE / 2; i++) { if (Math.abs(buf[SIZE - i]) < 0.2) { r2 = SIZE - i; break; } }
    const tb = buf.slice(r1, r2); SIZE = tb.length;
    const c = new Float32Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++) for (let j = 0; j < SIZE - i; j++) c[i] += tb[j] * tb[j + i];
    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -Infinity, maxpos = -1;
    for (let i = d; i < SIZE; i++) { if (c[i] > maxval) { maxval = c[i]; maxpos = i; } }
    let T0 = maxpos;
    const x1 = c[T0 - 1], x2 = c[T0], x3 = c[T0 + 1];
    const a = (x1 + x3 - 2 * x2) / 2, b = (x3 - x1) / 2;
    if (a) T0 = T0 - b / (2 * a);
    return sampleRate / T0;
}

function _freqToNoteNum(hz) {
    if (hz < 200 || hz > 1100) return null;
    let best = null, bestRatio = Infinity;
    for (const s of SCALE_FREQS) {
        const ratio = Math.abs(Math.log2(hz / s.hz));
        if (ratio < bestRatio) { bestRatio = ratio; best = s.num; }
    }
    return bestRatio < 0.085 ? best : null;
}

export function stopAllInputs() {
    stopKeyboardMode();
    stopMicMode();
    unbindTouchKeys();
}
