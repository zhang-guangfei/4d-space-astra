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
    } else if (state.viewMode === 'side_xzw') {
      // Elevated angled framing showing the orb + monolith slit clearly alongside the expanded XZW canvas
      desiredPos = {
        x: 3.35,
        y: 3.35,
        z: state.orbZ - 3.35,
      };
      desiredTarget = {
        x: 0.25,
        y: LEVEL14_CONFIG.orbCenterY + 0.15,
        z: Math.min(1.6, state.orbZ + 1.15),
      };
      this.camPos.x = lerp(this.camPos.x, desiredPos.x, smooth);
      this.camPos.y = lerp(this.camPos.y, desiredPos.y, smooth);
      this.camPos.z = lerp(this.camPos.z, desiredPos.z, smooth);
      this.camTarget.x = lerp(this.camTarget.x, desiredTarget.x, smooth);
      this.camTarget.y = lerp(this.camTarget.y, desiredTarget.y, smooth);
      this.camTarget.z = lerp(this.camTarget.z, desiredTarget.z, smooth);
    } else {
      // Third-person Grab & Rotate Stage: hero composition framing Passing Orb + 6.8m Hairline Slit ahead
      const isNorth = state.orbZ > 1.3;
      desiredPos = {
        x: isNorth ? 2.4 : 2.15,
        y: isNorth ? 2.65 : 2.55,
        z: isNorth ? state.orbZ - 3.8 : state.orbZ - 4.35,
      };
      desiredTarget = {
        x: 0,
        y: LEVEL14_CONFIG.orbCenterY + 0.2,
        z: isNorth ? state.orbZ + 1.8 : Math.min(2.8, state.orbZ + 1.6),
      };
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
    const sliceW0 = state.getSliceAtW0();
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

    // 4. Primary Axes: X (horizontal) & W (vertical)
    ctx.strokeStyle = 'rgba(77, 230, 211, 0.75)'; // W = 0 slice hyperplane line!
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(16, cy);
    ctx.lineTo(cssW - 16, cy);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(247, 195, 70, 0.55)'; // W axis
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx, 18);
    ctx.lineTo(cx, cssH - 22);
    ctx.stroke();

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

    // 7. Highlight exact W = 0 intersection segment in vivid Cyan
    if (sliceW0.intersects) {
      ctx.strokeStyle = PALETTE.accent.cyanW0;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(toPxX(sliceW0.xCenter - sliceW0.semiX), cy);
      ctx.lineTo(toPxX(sliceW0.xCenter + sliceW0.semiX), cy);
      ctx.stroke();
    }

    // 8. Scientific Axis & Invariant Labels
    const isCompact = cssW < 340;
    ctx.font = `600 ${isCompact ? 10 : 11}px "JetBrains Mono", ui-monospace, monospace`;
    ctx.fillStyle = PALETTE.accent.goldWPos;
    ctx.fillText('+W (第四维)', cx + 6, 29);
    ctx.fillStyle = PALETTE.accent.blueWNeg;
    ctx.fillText('-W', cx + 6, cssH - 28);

    ctx.fillStyle = PALETTE.accent.cyanW0;
    ctx.fillText(isCompact ? 'W=0 → +X' : 'W=0 切片 → +X', cssW - (isCompact ? 68 : 102), cy - 6);

    ctx.fillStyle = PALETTE.accent.platinum;
    ctx.fillText(
      isCompact
        ? `R=${ext.rigidRadiusInvariant.toFixed(2)}m 恒定`
        : `R = ${ext.rigidRadiusInvariant.toFixed(2)}m (刚体恒定)`,
      12,
      cssH - 8
    );

    ctx.textAlign = 'right';
    ctx.fillStyle = isBlade ? PALETTE.accent.emerald : PALETTE.accent.goldWPos;
    ctx.fillText(
      isCompact
        ? `xMax=${ext.xMax.toFixed(3)}m ${isBlade ? '✓' : '>0.082'}`
        : `xMax=${ext.xMax.toFixed(3)}m ${isBlade ? '✓ 可过缝' : '> 0.082m'}`,
      cssW - 12,
      cssH - 8
    );
    ctx.textAlign = 'left';

    ctx.restore();
  }
}
