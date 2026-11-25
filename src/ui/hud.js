/**
 * Beyond 3D — Minimalist HUD Controller (03-interaction-and-ui.md)
 * Manages:
 * - Smart dynamic reticle
 * - Top-center single-line character voice subtitle
 * - Top-left honest view badge, precision tabular-nums telemetry, non-checklist 3-beat card
 * - Top-right I Principle Guide, H hint pill (45s breathing pulse), voice toggle, F console toggle, Esc menu
 * - Non-spoiling neutral control micro-strip (never gives away mechanical puzzle steps!)
 * - Victory card with core 4D insight takeaway & E release button to walk freely
 */

import { LEVEL_HINTS } from '../core/tiered-hints.js';
import { PALETTE } from '../engine/phase-materials.js';

export class HudController {
  constructor(callbacks = {}) {
    this.cb = callbacks;
    this.shimmerTimer = null;
    this.toastTimer = null;
    this.victoryBannerDismissed = false;
    this.wheelCueVisible = false;
    this.wheelCueTimer = null;
    this.sliceTagVisible = false;
    this.sliceTagTimer = null;
    this.tabAttention = false;

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
      btnGuide: document.getElementById('btn-guide'),
      btnHint: document.getElementById('btn-hint'),
      btnHintLabel: document.getElementById('btn-hint-label'),
      btnVoice: document.getElementById('btn-voice'),
      btnVoiceLabel: document.getElementById('btn-voice-label'),
      btnConsole: document.getElementById('btn-console'),
      btnPause: document.getElementById('btn-pause'),
      btnTabView: document.getElementById('btn-tab-view'),
      btnTabLabel: document.getElementById('btn-tab-label'),
      btnWMinus: document.getElementById('btn-w-minus'),
      btnWPlus: document.getElementById('btn-w-plus'),
      btnWOrigin: document.getElementById('btn-w-origin'),
      observeW: document.getElementById('observe-w'),
      goalMarker: document.getElementById('goal-marker'),
      tabEntryPill: document.getElementById('tab-entry-pill'),
      tabEntryLabel: document.getElementById('tab-entry-label'),
      wheelHandoffCue: document.getElementById('wheel-handoff-cue'),
      sliceCalloutTag: document.getElementById('slice-callout-tag'),
      wRulerBox: document.getElementById('w-ruler-box'),
      reticle: document.getElementById('reticle'),
      reticlePrompt: document.getElementById('reticle-prompt'),
      controlStripText: document.getElementById('control-strip-text'),
      blockToast: document.getElementById('block-toast'),
      victoryBanner: document.getElementById('victory-banner'),
      btnReleaseVictory: document.getElementById('btn-release-victory'),
      btnReplayVictory: document.getElementById('btn-replay-victory'),
      teleporterModal: document.getElementById('teleporter-modal'),
      btnTeleporterReplay: document.getElementById('btn-teleporter-replay'),
      btnTeleporterRoadmap: document.getElementById('btn-teleporter-roadmap'),
      btnTeleporterStay: document.getElementById('btn-teleporter-stay'),
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
    this.els.btnGuide?.addEventListener('click', () => this.cb.onToggleGuide?.());
    this.els.btnHint?.addEventListener('click', () => this.cb.onRequestHint?.());
    this.els.btnVoice?.addEventListener('click', () => this.cb.onToggleVoice?.());
    this.els.btnConsole?.addEventListener('click', () => this.cb.onToggleConsole?.());
    this.els.btnPause?.addEventListener('click', () => this.cb.onTogglePause?.());
    this.els.btnTabView?.addEventListener('click', () => this.cb.onToggleHonestView?.());
    this.els.btnWMinus.addEventListener('click', () => this.cb.onStepW?.(-1));
    this.els.btnWPlus.addEventListener('click', () => this.cb.onStepW?.(1));
    this.els.btnWOrigin.addEventListener('click', () => this.cb.onReturnToOriginLayer?.());
    this.els.tabEntryPill?.addEventListener('click', () => this.cb.onToggleHonestView?.());
    this.els.btnClosePause?.addEventListener('click', () => this.cb.onTogglePause?.());
    this.els.btnResumeLevel?.addEventListener('click', () => this.cb.onTogglePause?.());
    this.els.btnResetLevel?.addEventListener('click', () => {
      this.cb.onReset?.();
      this.cb.onTogglePause?.();
    });
    this.els.btnReleaseVictory?.addEventListener('click', () => {
      this.victoryBannerDismissed = true;
      this.cb.onReleaseAfterVictory?.();
    });
    this.els.btnReplayVictory?.addEventListener('click', () => this.cb.onReset?.());

    this.els.btnTeleporterReplay?.addEventListener('click', () => {
      this.setTeleporterVisible(false);
      this.cb.onReset?.();
    });
    this.els.btnTeleporterRoadmap?.addEventListener('click', () => {
      this.setTeleporterVisible(false);
      this.cb.onCloseTeleporterModal?.();
      this.cb.onTogglePause?.();
    });
    this.els.btnTeleporterStay?.addEventListener('click', () => {
      this.setTeleporterVisible(false);
      this.cb.onCloseTeleporterModal?.();
    });

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

  resetBanner() {
    this.victoryBannerDismissed = false;
    this.tabAttention = false;
    this.hideWheelHandoffCue();
    this.hideSliceCallout();
    this.setTeleporterVisible(false);
  }

  dismissVictoryBanner() {
    this.victoryBannerDismissed = true;
  }

  showWheelHandoffCue(durationMs = 4600) {
    if (!this.els.wheelHandoffCue) return;
    this.wheelCueVisible = true;
    this.els.wheelHandoffCue.classList.add('is-visible');
    if (this.wheelCueTimer) clearTimeout(this.wheelCueTimer);
    this.wheelCueTimer = setTimeout(() => this.hideWheelHandoffCue(), durationMs);
  }

  hideWheelHandoffCue() {
    this.wheelCueVisible = false;
    if (this.wheelCueTimer) {
      clearTimeout(this.wheelCueTimer);
      this.wheelCueTimer = null;
    }
    this.els.wheelHandoffCue?.classList.remove('is-visible');
  }

  showSliceCallout(durationMs = 5400) {
    if (!this.els.sliceCalloutTag) return;
    this.sliceTagVisible = true;
    this.els.sliceCalloutTag.classList.add('is-visible');
    if (this.sliceTagTimer) clearTimeout(this.sliceTagTimer);
    this.sliceTagTimer = setTimeout(() => this.hideSliceCallout(), durationMs);
  }

  hideSliceCallout() {
    this.sliceTagVisible = false;
    if (this.sliceTagTimer) {
      clearTimeout(this.sliceTagTimer);
      this.sliceTagTimer = null;
    }
    this.els.sliceCalloutTag?.classList.remove('is-visible');
  }

  setTabAttention(active) {
    this.tabAttention = Boolean(active);
  }

  setTeleporterVisible(visible) {
    if (this.els.teleporterModal) {
      this.els.teleporterModal.hidden = !visible;
    }
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
    }, 3200);
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
   * Synchronize all HUD indicators with current level, hint state, and 3D orb anchor every frame.
   */
  sync(state, hintSnapshot, orbAnchor = null, goalAnchor = null) {
    const badge = state.getHonestViewBadge();
    const ext = state.getExtents();
    const slice = state.getSliceAtPlayerW();
    const isBlade = state.isBladeThinEnough();

    // 1. Honest View Badge
    this.els.honestTitle.textContent = badge.title;
    this.els.honestDetail.textContent = badge.detail;
    this.els.honestBadge.classList.toggle('is-side-view', badge.mode === 'side_xzw');

    let dotColor = PALETTE.accent.cyanW0;
    if (badge.mode === 'side_xzw') dotColor = PALETTE.accent.goldWPos;
    else if (state.completed) dotColor = PALETTE.accent.emerald;
    else if (state.playerPos[3] > 0.6) dotColor = PALETTE.accent.goldWPos;
    else if (state.playerPos[3] < -0.6) dotColor = PALETTE.accent.blueWNeg;
    this.els.honestDot.style.background = dotColor;
    this.els.honestDot.style.boxShadow = `0 0 8px ${dotColor}`;

    // 2. Subtle precision telemetry (available for curious explorers, never shouting over visuals)
    const [px, py, pz, pw] = state.playerPos;
    const wSign = pw >= 0 ? '+' : '';
    this.els.telemetryCoord.textContent = `XYZ (${px.toFixed(1)}, ${py.toFixed(1)}, ${pz.toFixed(1)}) · w ${wSign}${pw.toFixed(2)}`;
    const sliceWidth = slice.intersects ? `本层宽 ${(2 * slice.semiX).toFixed(3)} m` : '本层没有球身';
    this.els.telemetryOrb.textContent = `θ ${state.thetaDeg.toFixed(1)}° · 观察层 w ${pw.toFixed(2)} · ${sliceWidth} · 整球宽 ${(2 * ext.xMax).toFixed(3)} m · 缝宽 ${(2 * state.config.slitHalfWidth).toFixed(3)} m`;
    this.els.telemetryOrb.style.color = isBlade || state.completed ? PALETTE.accent.emerald : '';

    // 3. Three-Beat Organic Progress Strip
    for (const chip of this.els.beatChips) {
      const b = Number(chip.dataset.beat);
      chip.classList.toggle('is-lit', state.beat >= b);
    }

    // 4. Hint Button & 45s Stagnation Breathing Glow
    this.els.btnHintLabel.textContent = `提示 ${hintSnapshot.tier}/${hintSnapshot.maxTier}`;
    this.els.btnHint.classList.toggle('is-hint-pulse', hintSnapshot.pulseSuggested);

    // 5. Progressive Tab Entry Pill + Right-Edge w-Ruler Dimming while Grabbed
    this.els.wRulerBox?.classList.toggle('is-orb-mode', state.grabbed && !state.hasRotated4DWhileGrabbed && pw === 0);
    if (this.els.tabEntryPill) {
      const showPill = state.grabbed && state.viewMode !== 'side_xzw' && !state.completed;
      this.els.tabEntryPill.hidden = !showPill;
      this.els.tabEntryPill.classList.toggle('is-attention', this.tabAttention);
      if (this.els.tabEntryLabel) {
        this.els.tabEntryLabel.textContent = this.tabAttention ? '看看哪里碰到了墙' : '第四维侧视';
      }
    }
    if (this.els.btnTabLabel) {
      this.els.btnTabLabel.textContent = state.viewMode === 'side_xzw' ? '收起侧视' : '展开侧视';
    }
    const wText = `W ${wSign}${pw.toFixed(2)}`;
    if (this.els.observeW.textContent !== wText) this.els.observeW.textContent = wText;
    this.els.btnWOrigin.disabled = pw === 0;
    this.els.btnWMinus.disabled = pw <= state.config.playerWMin;
    this.els.btnWPlus.disabled = pw >= state.config.playerWMax;

    const marker = this.els.goalMarker;
    marker.hidden = !goalAnchor?.inFront || goalAnchor.x < 0 || goalAnchor.x > window.innerWidth ||
      goalAnchor.y < 0 || goalAnchor.y > window.innerHeight;
    if (!marker.hidden) {
      marker.style.left = `${goalAnchor.x}px`;
      marker.style.top = `${goalAnchor.y}px`;
      marker.classList.toggle('opens-left', goalAnchor.x > window.innerWidth - 180);
    }

    // Anchor floating cues beside the 3D Passing Orb in viewport coordinates
    if (orbAnchor && orbAnchor.inFront) {
      const vw = window.innerWidth || 1280;
      const vh = window.innerHeight || 720;
      if (this.wheelCueVisible && this.els.wheelHandoffCue) {
        const cx = Math.max(120, Math.min(vw - 140, orbAnchor.x + 132));
        const cy = Math.max(130, Math.min(vh - 110, orbAnchor.y - 36));
        this.els.wheelHandoffCue.style.left = `${cx}px`;
        this.els.wheelHandoffCue.style.top = `${cy}px`;
      }
      if (this.sliceTagVisible && this.els.sliceCalloutTag) {
        const cx = Math.max(90, Math.min(vw - 180, orbAnchor.x + 28));
        const cy = Math.max(130, Math.min(vh - 110, orbAnchor.y - 24));
        this.els.sliceCalloutTag.style.left = `${cx}px`;
        this.els.sliceCalloutTag.style.top = `${cy}px`;
      }
    }

    // 6. Smart Dynamic Reticle
    if (state.grabbed) {
      this.els.reticle.classList.add('is-hidden');
      this.els.reticle.classList.remove('is-interactable');
    } else {
      this.els.reticle.classList.remove('is-hidden');
      const canGrab = state.canGrabOrb() && !state.completed;
      this.els.reticle.classList.toggle('is-interactable', canGrab);
      this.els.reticlePrompt.textContent = state.canReconnectAtPedestal ? '[E] 重新操控底座上的球' : canGrab ? '[E] 抓住圆球' : '';
    }

    // 7. Context Control Micro-Strip (clean & uncluttered)
    if (state.completed && state.grabbed) {
      this.els.controlStripText.innerHTML =
        '钥匙归位，巨墙正在打开 · 按 <strong>E</strong> 返回自由视角走向北侧传送台';
    } else if (state.completed) {
      this.els.controlStripText.innerHTML =
        '巨墙已敞开 · 按 <strong>WASD</strong> 穿过通道踏上前方<strong>北侧传送台</strong> · 按 <strong>R</strong> 重玩';
    } else if (state.grabbed) {
      this.els.controlStripText.innerHTML =
        '<strong>滚轮</strong> 转球 · <strong>Shift + 滚轮</strong> 沿 W 轴观察 · <strong>W/S</strong> 推拉 · <strong>Tab</strong> 侧视 · <strong>E</strong> 松开';
    } else {
      this.els.controlStripText.innerHTML =
        'WASD 移动 · 拖拽/点击环视 · <strong>滚轮沿 w 轴移动</strong> · 靠近圆球按 <strong>E</strong> 抓取 · <strong>H</strong> 提示 · <strong>I</strong> 原理';
    }

    // 8. Victory Banner
    if (this.els.victoryBanner) {
      this.els.victoryBanner.hidden = !state.completed || this.victoryBannerDismissed || state.enteredTeleporter;
    }
  }
}
