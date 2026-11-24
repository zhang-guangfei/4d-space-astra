/**
 * Beyond 3D — Interactive Opening Principle Briefing ("纸上硬币 → 四维圆球" Dimensional Analogy)
 *
 * Designed specifically to solve "players brute-force keys without understanding WHY":
 * - Shows a live side-by-side animated geometric analogy:
 *   LEFT:  2D Flatlander's Coin (diameter 2.0m) on paper (Z=0) tilted into 3rd dimension Z to pass a 0.16m slit
 *   RIGHT: Our 3D Passing Orb (diameter 2.0m) in slice W=0 rotated around YZ into 4th dimension W
 * - Interactive angle slider (0°..90°) OR smooth auto-play lets first-time players IMMEDIATELY witness:
 *   1. Why even a 5° tilt instantly collapses the W=0 slice into a razor-thin disc (just like a tilted coin cuts paper as a line!)
 *   2. Why the tilted ball STILL hits the All-W monolith wall until it stands fully vertical at 90°!
 *   3. Why the rigid radius NEVER shrinks (R = 1.00m invariant — never squashed!)
 * - Never prints a mechanical "press W then scroll back" checklist; empowers genuine independent deduction!
 */

import { degToRad } from '../core/math4d.js';
import { PALETTE } from '../engine/phase-materials.js';

export class PrincipleGuideController {
  constructor(callbacks = {}) {
    this.cb = callbacks;
    this.modalEl = document.getElementById('principle-modal');
    this.canvas = document.getElementById('principle-analogy-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.sliderEl = document.getElementById('principle-theta-slider');
    this.angleReadoutEl = document.getElementById('principle-theta-readout');
    this.btnStartEl = document.getElementById('btn-start-sanctuary');
    this.btnCloseEl = document.getElementById('btn-close-principle');

    this.visible = false;
    this.autoPlay = true;
    this.animPhase = 0;
    this.thetaDeg = 0;
    this.rafId = null;

    this._bindEvents();
  }

  _bindEvents() {
    this.sliderEl?.addEventListener('input', (e) => {
      this.autoPlay = false;
      this.thetaDeg = parseFloat(e.target.value);
      this._renderDiagram();
    });

    const close = () => this.hide();
    this.btnStartEl?.addEventListener('click', close);
    this.btnCloseEl?.addEventListener('click', close);

    window.addEventListener('keydown', (e) => {
      if (!this.visible) return;
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        this.hide();
      }
    });
  }

  show() {
    if (!this.modalEl) return;
    this.visible = true;
    this.autoPlay = true;
    this.modalEl.hidden = false;
    this.cb.onVisibilityChange?.(true);
    this._startLoop();
  }

  hide() {
    if (!this.modalEl || !this.visible) return;
    this.visible = false;
    this.modalEl.hidden = true;
    this._stopLoop();
    this.cb.onVisibilityChange?.(false);
    this.cb.onDismissed?.();
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }

  _startLoop() {
    this._stopLoop();
    let prev = performance.now();
    const tick = (now) => {
      if (!this.visible) return;
      const dt = Math.min(0.05, (now - prev) / 1000);
      prev = now;
      if (this.autoPlay) {
        this.animPhase = (this.animPhase + dt * 0.42) % (Math.PI * 2);
        // Smooth dwell at 0° -> rise to 90° -> dwell at 90° -> return
        const s = 0.5 - 0.5 * Math.cos(this.animPhase);
        this.thetaDeg = Math.round(s * 900) / 10;
        if (this.sliderEl) this.sliderEl.value = String(Math.round(this.thetaDeg));
      }
      this._renderDiagram();
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  _stopLoop() {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  _renderDiagram() {
    if (!this.canvas || !this.ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(520, Math.round(rect.width));
    const cssH = Math.max(210, Math.round(rect.height));
    if (this.canvas.width !== cssW * dpr || this.canvas.height !== cssH * dpr) {
      this.canvas.width = cssW * dpr;
      this.canvas.height = cssH * dpr;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);

    // Background obsidian plate
    ctx.fillStyle = '#120F0B';
    ctx.fillRect(0, 0, cssW, cssH);

    const thetaRad = degToRad(this.thetaDeg);
    const eps = 0.001;
    const xMax = Math.sqrt(Math.cos(thetaRad) ** 2 + eps * eps * Math.sin(thetaRad) ** 2);
    const wMax = Math.sqrt(Math.sin(thetaRad) ** 2 + eps * eps * Math.cos(thetaRad) ** 2);
    const sliceSemiX = Math.min(1.0, eps / Math.max(eps, wMax));
    const canPass = xMax <= 0.082;

    if (this.angleReadoutEl) {
      this.angleReadoutEl.textContent = `演示转角 θ = ${this.thetaDeg.toFixed(0)}° · 截面半厚 ${sliceSemiX.toFixed(3)}m · 四维总半宽 ${xMax.toFixed(3)}m ${
        canPass ? '✓ 可过 0.082m 缝' : '✗ 撞墙'
      }`;
      this.angleReadoutEl.style.color = canPass ? PALETTE.accent.emerald : PALETTE.accent.goldWPos;
    }

    const halfW = cssW * 0.5;

    // Divider line
    ctx.strokeStyle = 'rgba(138, 106, 47, 0.32)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(halfW, 12);
    ctx.lineTo(halfW, cssH - 12);
    ctx.stroke();

    // =========================================================================
    // LEFT PANEL: 2D Paper World -> Lift Coin into 3rd Dimension (Z)
    // =========================================================================
    this._drawAnalogySide(ctx, {
      x0: 0,
      width: halfW,
      height: cssH,
      title: '① 类比：二维纸面上的硬币 → 借第三维立起',
      planeLabel: '画纸世界 (Z=0)',
      extraAxisLabel: '+Z (第三维高度)',
      sliceCaption:
        this.thetaDeg < 2
          ? '纸面看到：完整圆币'
          : '纸面切片：立刻缩成细线！',
      thetaRad,
      xMax,
      sliceSemiX,
      canPass,
      accentHex: PALETTE.accent.cyanW0,
    });

    // =========================================================================
    // RIGHT PANEL: Our 3D World (W=0) -> Rotate Sphere around YZ into 4th Dim (W)
    // =========================================================================
    this._drawAnalogySide(ctx, {
      x0: halfW,
      width: halfW,
      height: cssH,
      title: '② 本关：三维世界里的圆球 → 借第四维 W 立起',
      planeLabel: '我们所在切片 (W=0)',
      extraAxisLabel: '+W (第四维)',
      sliceCaption:
        this.thetaDeg < 2
          ? 'W=0 看到：完整 2m 圆球'
          : canPass
            ? '90° 立入 W 维：全宽 0.002m 过缝！'
            : `切片已扁，但 W≠0 仍宽 ${xMax.toFixed(2)}m 撞墙`,
      thetaRad,
      xMax,
      sliceSemiX,
      canPass,
      accentHex: PALETTE.accent.goldWPos,
    });

    ctx.restore();
  }

  _drawAnalogySide(ctx, cfg) {
    const cx = cfg.x0 + cfg.width * 0.5;
    const cy = cfg.height * 0.54;
    const R = Math.min(cfg.width * 0.24, cfg.height * 0.31);
    const slitHalfPx = Math.max(5.5, R * 0.082);

    // Panel title
    ctx.font = '600 12px "Inter", "PingFang SC", sans-serif';
    ctx.fillStyle = PALETTE.accent.platinum;
    ctx.textAlign = 'center';
    ctx.fillText(cfg.title, cx, 22);

    // All-extra-dimension Monolith Wall hatched flanks outside ±0.082m
    ctx.fillStyle = cfg.canPass ? 'rgba(105, 240, 174, 0.08)' : 'rgba(138, 106, 47, 0.18)';
    ctx.fillRect(cfg.x0 + 18, 34, cx - slitHalfPx - (cfg.x0 + 18), cfg.height - 64);
    ctx.fillRect(cx + slitHalfPx, 34, cfg.x0 + cfg.width - 18 - (cx + slitHalfPx), cfg.height - 64);

    // Hairline slit vertical lips
    ctx.strokeStyle = cfg.canPass ? PALETTE.accent.emerald : 'rgba(255, 246, 214, 0.72)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * slitHalfPx, 34);
      ctx.lineTo(cx + s * slitHalfPx, cfg.height - 30);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Unit circle (rigid radius R = 1.00m proof)
    ctx.strokeStyle = 'rgba(247, 195, 70, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, R, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Primary hyperplane line (Z=0 or W=0)
    ctx.strokeStyle = 'rgba(77, 230, 211, 0.75)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(cfg.x0 + 18, cy);
    ctx.lineTo(cfg.x0 + cfg.width - 18, cy);
    ctx.stroke();

    // Extra dimension axis (+Z or +W)
    ctx.strokeStyle = 'rgba(247, 195, 70, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 34);
    ctx.lineTo(cx, cfg.height - 30);
    ctx.stroke();

    // Rigid rotated coin / sphere bar (constant diameter 2R — NEVER squashed!)
    const dx = Math.cos(cfg.thetaRad) * R;
    const dy = Math.sin(cfg.thetaRad) * R;

    // X-span collision drop brackets
    const spanPx = cfg.xMax * R;
    ctx.strokeStyle = cfg.canPass ? PALETTE.accent.emerald : 'rgba(255, 107, 107, 0.65)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * spanPx, cy - R - 4);
      ctx.lineTo(cx + s * spanPx, cy + R + 4);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.strokeStyle = cfg.canPass ? PALETTE.accent.emerald : cfg.accentHex;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - dx, cy + dy);
    ctx.lineTo(cx + dx, cy - dy);
    ctx.stroke();

    // Bright slice intersection highlight right on the horizontal plane (Z=0 or W=0)
    const slicePx = Math.max(3, cfg.sliceSemiX * R);
    ctx.strokeStyle = PALETTE.accent.platinum;
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(cx - slicePx, cy);
    ctx.lineTo(cx + slicePx, cy);
    ctx.stroke();

    // Labels
    ctx.font = '600 10px "JetBrains Mono", ui-monospace, monospace';
    ctx.fillStyle = PALETTE.accent.goldWPos;
    ctx.textAlign = 'left';
    ctx.fillText(cfg.extraAxisLabel, cx + 8, 45);

    ctx.fillStyle = PALETTE.accent.cyanW0;
    ctx.textAlign = 'right';
    ctx.fillText(cfg.planeLabel, cfg.x0 + cfg.width - 20, cy - 6);

    ctx.font = '500 11px "Inter", "PingFang SC", sans-serif';
    ctx.fillStyle = cfg.canPass ? PALETTE.accent.emerald : PALETTE.accent.platinum;
    ctx.textAlign = 'center';
    ctx.fillText(cfg.sliceCaption, cx, cfg.height - 10);
  }
}
