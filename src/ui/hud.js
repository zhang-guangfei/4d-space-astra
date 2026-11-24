/**
 * Beyond 3D — Minimalist HUD Controller (03-interaction-and-ui.md)
 * Manages:
 * - Smart dynamic reticle
 * - Top-center single-line character voice subtitle
 * - Top-left honest view badge, precision tabular-nums telemetry, non-checklist 3-beat card
 * - Top-right H hint pill (45s breathing pulse), voice toggle, F console toggle, Esc menu
 * - Peripheral W-shift / collision shimmer & transient block toast
 * - Esc pause modal + 18-level roadmap overview
 */

import { LEVEL_HINTS } from '../core/tiered-hints.js';
import { PALETTE } from '../engine/phase-materials.js';

export class HudController {
  constructor(callbacks = {}) {
    this.cb = callbacks;
    this.shimmerTimer = null;
    this.toastTimer = null;

    this.els = {
      edgeShimmer: document.getElementById('edge-shimmer'),
      honestBadge: document.getElementById('honest-view-badge'),
      honestDot: document.getElementById('honest-badge-dot'),
      honestTitle: document.getElementById('honest-badge-title'),
      honestDetail: document.getElementById('honest-badge-detail'),
      telemetryCoord: document.getElementById('telemetry-coord'),
      telemetryOrb: document.getElementById('telemetry-orb'),
      beatChips: Array.from(document.querySelectorAll('.beat-chip')),
      subtitleBar: document.getElementById('subtitle-bar'),
      subtitleSpeaker: document.getElementById('subtitle-speaker'),
      subtitleTier: document.getElementById('subtitle-tier'),
      subtitleText: document.getElementById('subtitle-text'),
      btnHint: document.getElementById('btn-hint'),
      btnHintLabel: document.getElementById('btn-hint-label'),
      btnVoice: document.getElementById('btn-voice'),
      btnVoiceLabel: document.getElementById('btn-voice-label'),
      btnConsole: document.getElementById('btn-console'),
      btnPause: document.getElementById('btn-pause'),
      btnTabView: document.getElementById('btn-tab-view'),
      btnTabLabel: document.getElementById('btn-tab-label'),
      reticle: document.getElementById('reticle'),
      reticlePrompt: document.getElementById('reticle-prompt'),
      controlStripText: document.getElementById('control-strip-text'),
      blockToast: document.getElementById('block-toast'),
      victoryBanner: document.getElementById('victory-banner'),
      btnReplayVictory: document.getElementById('btn-replay-victory'),
      btnRoadmapVictory: document.getElementById('btn-roadmap-victory'),
      pauseModal: document.getElementById('pause-modal'),
      btnClosePause: document.getElementById('btn-close-pause'),
      btnResumeLevel: document.getElementById('btn-resume-level'),
      btnResetLevel: document.getElementById('btn-reset-level'),
      inputMouseSens: document.getElementById('input-mouse-sens'),
      valMouseSens: document.getElementById('val-mouse-sens'),
      inputWheelSens: document.getElementById('input-wheel-sens'),
      valWheelSens: document.getElementById('val-wheel-sens'),
      roadmapGrid: document.getElementById('roadmap-grid'),
    };

    this._populateRoadmap();
    this._bindButtons();
  }

  _populateRoadmap() {
    if (!this.els.roadmapGrid) return;
    this.els.roadmapGrid.innerHTML = '';
    for (let id = 1; id <= 18; id += 1) {
      const info = LEVEL_HINTS[id];
      const item = document.createElement('div');
      item.className = `roadmap-item${id === 14 ? ' is-current' : ''}`;
      item.innerHTML = `<span>#${id} ${info.name}</span><span class="roadmap-status">${
        id === 14 ? 'LIVE' : 'Phase 2'
      }</span>`;
      this.els.roadmapGrid.appendChild(item);
    }
  }

  _bindButtons() {
    this.els.btnHint?.addEventListener('click', () => this.cb.onRequestHint?.());
    this.els.btnVoice?.addEventListener('click', () => this.cb.onToggleVoice?.());
    this.els.btnConsole?.addEventListener('click', () => this.cb.onToggleConsole?.());
    this.els.btnPause?.addEventListener('click', () => this.cb.onTogglePause?.());
    this.els.btnTabView?.addEventListener('click', () => this.cb.onToggleHonestView?.());
    this.els.btnClosePause?.addEventListener('click', () => this.cb.onTogglePause?.());
    this.els.btnResumeLevel?.addEventListener('click', () => this.cb.onTogglePause?.());
    this.els.btnResetLevel?.addEventListener('click', () => {
      this.cb.onReset?.();
      this.cb.onTogglePause?.();
    });
    this.els.btnReplayVictory?.addEventListener('click', () => this.cb.onReset?.());
    this.els.btnRoadmapVictory?.addEventListener('click', () => this.cb.onTogglePause?.());

    this.els.inputMouseSens?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.els.valMouseSens.textContent = `${val.toFixed(1)}×`;
      this.cb.onSensitivityChange?.({ mouseScale: val });
    });
    this.els.inputWheelSens?.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      this.els.valWheelSens.textContent = `${val.toFixed(1)}×`;
      this.cb.onSensitivityChange?.({ wheelScale: val });
    });
  }

  showSubtitle({ visible, speaker, text, tierLabel }) {
    if (!this.els.subtitleBar) return;
    if (!visible) {
      this.els.subtitleBar.classList.remove('is-visible');
      return;
    }
    this.els.subtitleSpeaker.textContent = speaker.displayName;
    this.els.subtitleSpeaker.style.color = speaker.color;
    this.els.subtitleTier.textContent = tierLabel ? `[${tierLabel}]` : '';
    this.els.subtitleText.textContent = text;
    this.els.subtitleBar.classList.add('is-visible');
  }

  flashEdge(hexColor) {
    if (!this.els.edgeShimmer) return;
    this.els.edgeShimmer.style.setProperty('--shimmer-color', `${hexColor}66`);
    this.els.edgeShimmer.classList.add('is-active');
    if (this.shimmerTimer) clearTimeout(this.shimmerTimer);
    this.shimmerTimer = setTimeout(() => {
      this.els.edgeShimmer.classList.remove('is-active');
    }, 240);
  }

  showBlockToast(message) {
    if (!this.els.blockToast) return;
    this.els.blockToast.textContent = message;
    this.els.blockToast.classList.add('is-visible');
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.els.blockToast.classList.remove('is-visible');
    }, 2600);
  }

  setVoiceEnabled(enabled) {
    this.els.btnVoice?.classList.toggle('is-active', enabled);
    if (this.els.btnVoiceLabel) {
      this.els.btnVoiceLabel.textContent = enabled ? '配音 开' : '配音 关';
    }
  }

  setConsoleExpanded(expanded) {
    this.els.btnConsole?.classList.toggle('is-active', expanded);
  }

  setPaused(paused) {
    if (this.els.pauseModal) {
      this.els.pauseModal.hidden = !paused;
    }
  }

  /**
   * Synchronize all HUD indicators with current level & hint state every frame.
   */
  sync(state, hintSnapshot) {
    const badge = state.getHonestViewBadge();
    const ext = state.getExtents();
    const isBlade = state.isBladeThinEnough();

    // 1. Honest View Badge
    this.els.honestTitle.textContent = badge.title;
    this.els.honestDetail.textContent = badge.detail;
    this.els.honestBadge.classList.toggle('is-side-view', badge.mode === 'side_xzw');

    let dotColor = PALETTE.accent.cyanW0;
    if (badge.mode === 'side_xzw') dotColor = PALETTE.accent.goldWPos;
    else if (state.completed) dotColor = PALETTE.accent.platinum;
    else if (state.playerPos[3] > 0.6) dotColor = PALETTE.accent.goldWPos;
    else if (state.playerPos[3] < -0.6) dotColor = PALETTE.accent.blueWNeg;
    this.els.honestDot.style.background = dotColor;
    this.els.honestDot.style.boxShadow = `0 0 8px ${dotColor}`;

    // 2. Precision tabular-nums telemetry
    const [px, py, pz, pw] = state.playerPos;
    const wSign = pw >= 0 ? '+' : '';
    this.els.telemetryCoord.textContent = `XYZ (${px.toFixed(1)}, ${py.toFixed(1)}, ${pz.toFixed(1)}) · W ${wSign}${pw.toFixed(2)}`;
    this.els.telemetryOrb.textContent = `θ ${state.thetaDeg.toFixed(1)}° · xMax ${ext.xMax.toFixed(3)}m / 缝 0.082m`;
    this.els.telemetryOrb.style.color = isBlade ? PALETTE.accent.emerald : '';

    // 3. Three-Beat Organic Progress Strip
    for (const chip of this.els.beatChips) {
      const b = Number(chip.dataset.beat);
      chip.classList.toggle('is-lit', state.beat >= b);
    }

    // 4. Hint Button & 45s Stagnation Breathing Glow
    this.els.btnHintLabel.textContent = `提示 ${hintSnapshot.tier}/${hintSnapshot.maxTier}`;
    this.els.btnHint.classList.toggle('is-hint-pulse', hintSnapshot.pulseSuggested);

    // 5. Tab button label inside side view panel
    if (this.els.btnTabLabel) {
      this.els.btnTabLabel.textContent = state.viewMode === 'side_xzw' ? '返回主切片' : '展开侧视';
    }

    // 6. Smart Dynamic Reticle
    if (state.grabbed) {
      this.els.reticle.classList.add('is-hidden');
      this.els.reticle.classList.remove('is-interactable');
    } else {
      this.els.reticle.classList.remove('is-hidden');
      const canGrab = state.canGrabOrb() && !state.completed;
      this.els.reticle.classList.toggle('is-interactable', canGrab);
      this.els.reticlePrompt.textContent = canGrab ? '[E] 抓取通行珠（进入四维旋转舞台）' : '';
    }

    // 7. Context Control Micro-Strip
    if (state.completed) {
      this.els.controlStripText.innerHTML =
        '圣殿通道已开启 · 按 <strong>R</strong> 重玩垂直切片 · 按 <strong>Esc</strong> 查看 18 关路线图';
    } else if (state.grabbed) {
      const pushHint = state.isOnNorthPedestal()
        ? '已抵北侧基座：<strong>滚轮转回 0°</strong> 恢复完整圆球'
        : isBlade
          ? '已收窄为薄刃：按 <strong>W</strong> 推过发丝裂缝'
          : '左键拖拽：三维旋转 SO(3) · <strong>滚轮：绕 YZ 面四维旋转</strong> · <strong>W/S</strong> 推动';
      this.els.controlStripText.innerHTML = `${pushHint} · <strong>Tab</strong> 诚实侧视 · <strong>E</strong> 松开`;
    } else {
      this.els.controlStripText.innerHTML =
        'WASD 移动 · 点击/拖拽环视 · <strong>滚轮切 W 切片</strong> · 走近圆球按 <strong>E</strong> 抓取 · <strong>H</strong> 提示';
    }

    // 8. Victory Banner
    if (this.els.victoryBanner) {
      this.els.victoryBanner.hidden = !state.completed;
    }
  }
}
