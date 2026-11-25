/**
 * Beyond 3D — Third-Person 4D Grab & Rotate Stage + Honest XZW Side-View Renderer
 *
 * Implements D8 & Pillar 4 (Geometric Honesty):
 * 1. Smoothly transitions the Babylon camera between First-Person Walk mode and Third-Person Grab Stage
 *    (plus elevated side-aligned inspection framing when Tab switches to Side View XZW).
 * 2. Renders the mathematically exact X-W cross-section on a dedicated holographic canvas:
 *    - Constant-radius rigid oblate disk (R = 1.00 m major axis, 2*eps = 0.070 m thickness) rotating rigidly in X-W
 *    - Unit reference circle R = 1.00 m proving the sphere is NEVER squashed
 *    - Monolith walls extending vertically across ALL W slices at |X| >= 0.082 m
 *    - Bright Cyan W = 0 slice line intersecting the tilted disk + Gold X-projection span markers
 */

import { lerp } from '../core/math4d.js';
import { LEVEL14_CONFIG, sampleOblateDiskXW } from '../core/sanctuary-4d.js';
import { PALETTE } from './phase-materials.js';

export class GrabStageController {
  constructor(sideViewCanvas, sideViewPanel) {
    this.canvas = sideViewCanvas;
    this.panel = sideViewPanel;
    this.ctx = sideViewCanvas ? sideViewCanvas.getContext('2d') : null;
    this.camPos = { x: 1.55, y: 1.85, z: -7.8 };
    this.camTarget = { x: 0, y: 2.2, z: -1.2 };
    this.blockFlash = 0;
  }

  triggerBlockFlash() {
    this.blockFlash = 1.0;
  }

  /**
   * Smoothly interpolate Babylon FreeCamera pose for Walk / Grab / Tab Side View.
   */
  updateCamera(camera, state, input, dtSec) {
    const smooth = Math.min(1, dtSec * 8.5);
    this.blockFlash = Math.max(0, this.blockFlash - dtSec * 2.6);

    let desiredPos;
    let desiredTarget;

    if (!state.grabbed) {
      // First-person sanctuary exploration
      desiredPos = {
        x: state.playerPos[0],
        y: state.playerPos[1],
        z: state.playerPos[2],
      };
      const lookDist = 6.5;
      const cosP = Math.cos(input.pitch);
      desiredTarget = {
        x: desiredPos.x + Math.sin(input.yaw) * cosP * lookDist,
        y: desiredPos.y + Math.sin(input.pitch) * lookDist,
        z: desiredPos.z + Math.cos(input.yaw) * cosP * lookDist,
      };
      // Responsive FPS look without sluggish lag when walking
      const fpSmooth = Math.min(1, dtSec * 18);
      this.camPos.x = lerp(this.camPos.x, desiredPos.x, fpSmooth);
      this.camPos.y = lerp(this.camPos.y, desiredPos.y, fpSmooth);
      this.camPos.z = lerp(this.camPos.z, desiredPos.z, fpSmooth);
      this.camTarget.x = lerp(this.camTarget.x, desiredTarget.x, fpSmooth);
      this.camTarget.y = lerp(this.camTarget.y, desiredTarget.y, fpSmooth);
      this.camTarget.z = lerp(this.camTarget.z, desiredTarget.z, fpSmooth);
    } else {
      // Zero-Occlusion 3-Zone Slit Camera Choreography (consistent in both Slice & Tab Side View):
      // Zone 1 (South, orbZ <= -1.05): Diagonal hero framing of Passing Orb + Hairline Slit ahead
      // Zone 2 (Slit Transit, -1.05 < orbZ < +1.15): Slit-centered periscope (X=0) looking straight
      //         down the open 0.164m luminous hairline corridor — ZERO wall occlusion!
      // Zone 3 (North Emergence, orbZ >= +1.15): North-side hero framing (Z > +1.2) looking back at
      //         the orb emerging onto the North Golden Pedestal — ZERO wall occlusion!
      const isSide = state.viewMode === 'side_xzw';
      if (state.orbZ <= -1.05) {
        desiredPos = {
          x: isSide ? 2.35 : 2.15,
          y: isSide ? 2.75 : 2.55,
          z: state.orbZ - 4.35,
        };
        desiredTarget = {
          x: 0,
          y: LEVEL14_CONFIG.orbCenterY + 0.18,
          z: Math.min(2.6, state.orbZ + 1.6),
        };
      } else if (state.orbZ < 1.15) {
        // Centered cleanly on X=0 looking straight through the open hairline slit!
        desiredPos = {
          x: 0.0,
          y: 2.08,
          z: -2.85,
        };
        desiredTarget = {
          x: 0.0,
          y: LEVEL14_CONFIG.orbCenterY,
          z: state.orbZ + 0.9,
        };
      } else {
        // Emerged cleanly on North side: camera stays strictly on North side (Z > +1.2)
        desiredPos = {
          x: isSide ? 2.5 : 2.35,
          y: isSide ? 2.75 : 2.6,
          z: Math.max(2.3, state.orbZ + 3.45),
        };
        desiredTarget = {
          x: 0,
          y: LEVEL14_CONFIG.orbCenterY + 0.12,
          z: state.orbZ - 0.35,
        };
      }
      this.camPos.x = lerp(this.camPos.x, desiredPos.x, smooth);
      this.camPos.y = lerp(this.camPos.y, desiredPos.y, smooth);
      this.camPos.z = lerp(this.camPos.z, desiredPos.z, smooth);
      this.camTarget.x = lerp(this.camTarget.x, desiredTarget.x, smooth);
      this.camTarget.y = lerp(this.camTarget.y, desiredTarget.y, smooth);
      this.camTarget.z = lerp(this.camTarget.z, desiredTarget.z, smooth);
    }

    camera.position.set(this.camPos.x, this.camPos.y, this.camPos.z);
    camera.setTarget(new globalThis.BABYLON.Vector3(this.camTarget.x, this.camTarget.y, this.camTarget.z));
  }

  /**
   * Render the mathematically exact X-W Side View diagram (Honest Dual View).
   */
  renderSideView(state) {
    if (!this.canvas || !this.ctx || !this.panel) return;

    const isExpanded = state.viewMode === 'side_xzw';
    const shouldShow = state.grabbed || isExpanded;
    this.panel.classList.toggle('is-visible', shouldShow);
    this.panel.classList.toggle('is-expanded', isExpanded);
    if (!shouldShow) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    const cssW = Math.max(220, Math.round(rect.width));
    const cssH = Math.max(200, Math.round(rect.height));
    if (this.canvas.width !== cssW * dpr || this.canvas.height !== cssH * dpr) {
      this.canvas.width = cssW * dpr;
      this.canvas.height = cssH * dpr;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);

    // Clear dark obsidian scientific background
    ctx.fillStyle = '#120F0B';
    ctx.fillRect(0, 0, cssW, cssH);

    const cx = cssW * 0.5;
    const cy = cssH * 0.52;
    const scale = Math.min(cssW, cssH) * 0.34; // 1.0 m -> scale px
    const toPxX = (x) => cx + x * scale;
    const toPxW = (w) => cy - w * scale;

    const ext = state.getExtents();
    const activeW = state.grabbed ? 0 : state.playerPos[3];
    const activeSlice = state.grabbed ? state.getSliceAtW0() : state.getSliceAtPlayerW();
    const activeSliceY = Math.max(24, Math.min(cssH - 26, toPxW(activeW)));
    const isBlade = state.isBladeThinEnough();
    const inWallZ = state.isOrbOverlappingWallZ();

    // 1. Subtle coordinate grid
    ctx.strokeStyle = 'rgba(138, 106, 47, 0.14)';
    ctx.lineWidth = 1;
    for (const v of [-1.0, -0.5, 0.5, 1.0]) {
      ctx.beginPath();
      ctx.moveTo(toPxX(v), 18);
      ctx.lineTo(toPxX(v), cssH - 22);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(16, toPxW(v));
      ctx.lineTo(cssW - 16, toPxW(v));
      ctx.stroke();
    }

    // 2. All-W Monolith Wall Slit Corridor (|X| >= 0.082 m for ALL W!)
    const slitHalfPx = LEVEL14_CONFIG.slitHalfWidth * scale;
    const wallAlpha = inWallZ ? 0.32 : 0.16;
    ctx.fillStyle =
      this.blockFlash > 0.05
        ? `rgba(255, 107, 107, ${0.18 + this.blockFlash * 0.3})`
        : `rgba(138, 106, 47, ${wallAlpha})`;
    ctx.fillRect(16, 18, Math.max(0, cx - slitHalfPx - 16), cssH - 40);
    ctx.fillRect(cx + slitHalfPx, 18, Math.max(0, cssW - 16 - (cx + slitHalfPx)), cssH - 40);

    // Bright platinum hairline slit vertical lip lines (showing full-W continuity)
    ctx.strokeStyle =
      this.blockFlash > 0.05 ? PALETTE.accent.amberCoral : 'rgba(255, 246, 214, 0.72)';
    ctx.lineWidth = inWallZ ? 1.8 : 1.2;
    ctx.setLineDash(inWallZ ? [] : [4, 4]);
    for (const sign of [-1, 1]) {
      const lx = cx + sign * slitHalfPx;
      ctx.beginPath();
      ctx.moveTo(lx, 18);
      ctx.lineTo(lx, cssH - 22);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 3. Unit Circle R = 1.00 m (honest geometric proof that major radius NEVER shrinks!)
    ctx.strokeStyle = 'rgba(247, 195, 70, 0.34)';
    ctx.lineWidth = 1.1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    ctx.arc(cx, cy, LEVEL14_CONFIG.radiusR * scale, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. Primary Axes: Horizontal "我们所在的三维切面" & Vertical Arrowed Number Line "第四维度 w"
    if (Math.abs(activeW) > 0.02) {
      // Faint origin reference line at center
      ctx.strokeStyle = 'rgba(77, 230, 211, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(16, cy);
      ctx.lineTo(cssW - 16, cy);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.strokeStyle = 'rgba(77, 230, 211, 0.88)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(16, activeSliceY);
    ctx.lineTo(cssW - 16, activeSliceY);
    ctx.stroke();

    // Vertical Fourth-Dimension w Arrowed Number Line with scale ticks
    const axisTop = 20;
    const axisBot = cssH - 24;
    ctx.strokeStyle = PALETTE.accent.goldWPos;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(cx, axisBot);
    ctx.lineTo(cx, axisTop);
    ctx.stroke();

    // Crisp upward arrowhead at +w tip
    ctx.fillStyle = PALETTE.accent.goldWPos;
    ctx.beginPath();
    ctx.moveTo(cx, axisTop - 4);
    ctx.lineTo(cx - 5, axisTop + 6);
    ctx.lineTo(cx + 5, axisTop + 6);
    ctx.closePath();
    ctx.fill();

    // Number-line scale tick marks (-1, +1) along w axis
    ctx.strokeStyle = 'rgba(247, 195, 70, 0.72)';
    ctx.lineWidth = 1.2;
    for (const wTick of [-1, 1]) {
      const ty = toPxW(wTick);
      ctx.beginPath();
      ctx.moveTo(cx - 4, ty);
      ctx.lineTo(cx + 4, ty);
      ctx.stroke();
    }

    // 5. Projection drop lines showing xMax(theta) on X-axis
    const xMaxPx = ext.xMax * scale;
    ctx.strokeStyle = isBlade ? 'rgba(105, 240, 174, 0.75)' : 'rgba(247, 195, 70, 0.55)';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 3]);
    for (const sign of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + sign * xMaxPx, cy - scale * 1.05);
      ctx.lineTo(cx + sign * xMaxPx, cssH - 24);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // 6. Rigid 4D Oblate Disk rotated in X-W by exact thetaRad
    const diskPts = sampleOblateDiskXW(state.thetaRad, 72);
    ctx.beginPath();
    diskPts.forEach((pt, idx) => {
      const px = toPxX(pt.x);
      const py = toPxW(pt.w);
      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.closePath();
    ctx.fillStyle = isBlade
      ? 'rgba(105, 240, 174, 0.28)'
      : 'rgba(77, 230, 211, 0.24)';
    ctx.fill();
    ctx.strokeStyle = isBlade ? PALETTE.accent.emerald : PALETTE.accent.goldWPos;
    ctx.lineWidth = 2.2;
    ctx.stroke();

    // Rigid major-axis diameter bar (explicitly demonstrating constant 2.00 m length)
    const tipX = Math.cos(state.thetaRad) * LEVEL14_CONFIG.radiusR;
    const tipW = Math.sin(state.thetaRad) * LEVEL14_CONFIG.radiusR;
    ctx.strokeStyle = PALETTE.accent.platinum;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(toPxX(-tipX), toPxW(-tipW));
    ctx.lineTo(toPxX(tipX), toPxW(tipW));
    ctx.stroke();

    // Endpoint beacons on unit circle
    for (const sign of [-1, 1]) {
      ctx.fillStyle = PALETTE.accent.platinum;
      ctx.beginPath();
      ctx.arc(toPxX(sign * tipX), toPxW(sign * tipW), 3.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Highlight intersection segment on our 3D slice in vivid Cyan
    if (activeSlice.intersects) {
      ctx.strokeStyle = PALETTE.accent.cyanW0;
      ctx.lineWidth = 4.2;
      ctx.beginPath();
      ctx.moveTo(toPxX(activeSlice.xCenter - activeSlice.semiX), activeSliceY);
      ctx.lineTo(toPxX(activeSlice.xCenter + activeSlice.semiX), activeSliceY);
      ctx.stroke();
    }

    // 8. Clear Human-Readable Labels (ZERO "W=0 切片" jargon!)
    const isCompact = cssW < 340;
    ctx.font = `600 ${isCompact ? 10 : 11}px "Inter", "PingFang SC", sans-serif`;
    ctx.fillStyle = PALETTE.accent.goldWPos;
    ctx.textAlign = 'left';
    ctx.fillText('第四维度 w ↑', cx + 8, axisTop + 10);

    ctx.fillStyle = PALETTE.accent.cyanW0;
    ctx.textAlign = 'right';
    ctx.fillText('我们所在的三维切面', cssW - 12, Math.max(36, activeSliceY - 7));

    ctx.font = `600 ${isCompact ? 10 : 11}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.fillStyle = PALETTE.accent.platinum;
    ctx.textAlign = 'left';
    ctx.fillText(
      isCompact
        ? `R=${ext.rigidRadiusInvariant.toFixed(2)}m 恒定`
        : `R = ${ext.rigidRadiusInvariant.toFixed(2)}m (从未压扁)`,
      12,
      cssH - 8
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = isBlade ? PALETTE.accent.emerald : PALETTE.accent.goldWPos;
    ctx.fillText(
      isCompact
        ? `总宽 ${ext.xMax.toFixed(3)}m ${isBlade ? '✓' : '>0.082'}`
        : `四维总半宽 ${ext.xMax.toFixed(3)}m ${isBlade ? '✓ 可过缝' : '> 0.082m'}`,
      cssW - 12,
      cssH - 8
    );
    ctx.textAlign = 'left';

    ctx.restore();
  }
}
