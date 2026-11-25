/**
 * Beyond 3D — Interactive Principle Briefing ("二维硬币 → 四维圆球" 3D Perspective Dimensional Analogy)
 *
 * Strictly scoped to Level 14:
 * - Large, readable canvas with true 3D perspective projection on both panels:
 *   LEFT:  3D perspective coin on a 2D paper plane lifting into 3rd dimension height to clear a vertical slit
 *   RIGHT: True 3D perspective animation of our 3D sphere rotating off "我们所在的三维切面"
 *          along an arrowed golden number line representing "第四维度 w"
 * - NEVER displays "W=0切片" / "W=0" anywhere; always uses "我们所在的三维切面" and "第四维度 w"
 */

import { degToRad } from '../core/math4d.js';
import { PALETTE } from '../engine/phase-materials.js';

/**
 * Simple 3D perspective projector (X = right, Y = depth away/toward viewer, Z = vertical extra dimension).
 */
function makeProjector3D(cx, cy, scale, yawRad, pitchRad, camDist = 6.4) {
  const cyaw = Math.cos(yawRad);
  const syaw = Math.sin(yawRad);
  const cpitch = Math.cos(pitchRad);
  const spitch = Math.sin(pitchRad);

  return function project(x, y, z) {
    // Rotate around vertical Z axis by yaw
    const rx = x * cyaw - y * syaw;
    const ry = x * syaw + y * cyaw;
    // Tilt camera by pitch around X axis
    const py = ry * cpitch - z * spitch;
    const pz = ry * spitch + z * cpitch;

    const denom = Math.max(1.5, camDist + py);
    const persp = camDist / denom;
    return {
      sx: cx + rx * scale * persp,
      sy: cy - pz * scale * persp,
      depth: py,
      persp,
    };
  };
}

function drawPolygon3D(ctx, pts3D, project, fillStyle, strokeStyle, lineWidth = 1) {
  const pts2D = pts3D.map(([x, y, z]) => project(x, y, z));
  ctx.beginPath();
  pts2D.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.sx, p.sy);
    else ctx.lineTo(p.sx, p.sy);
  });
  ctx.closePath();
  if (fillStyle) {
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }
  if (strokeStyle) {
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }
  return pts2D;
}

function drawBox3D(ctx, x0, x1, y0, y1, z0, z1, project, colors) {
  // Painter's order for camera looking from (-Y, +Z, +X)
  const faces = [
    // Bottom
    {
      pts: [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y1, z0],
        [x0, y1, z0],
      ],
      fill: colors.side,
    },
    // Back (+Y)
    {
      pts: [
        [x0, y1, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
      fill: colors.side,
    },
    // Left (-X)
    {
      pts: [
        [x0, y0, z0],
        [x0, y1, z0],
        [x0, y1, z1],
        [x0, y0, z1],
      ],
      fill: colors.inner,
    },
    // Right (+X)
    {
      pts: [
        [x1, y0, z0],
        [x1, y1, z0],
        [x1, y1, z1],
        [x1, y0, z1],
      ],
      fill: colors.inner,
    },
    // Front (-Y)
    {
      pts: [
        [x0, y0, z0],
        [x1, y0, z0],
        [x1, y0, z1],
        [x0, y0, z1],
      ],
      fill: colors.front,
    },
    // Top (+Z)
    {
      pts: [
        [x0, y0, z1],
        [x1, y0, z1],
        [x1, y1, z1],
        [x0, y1, z1],
      ],
      fill: colors.top,
    },
  ];

  // Sort back-to-front by average projected depth
  faces
    .map((f) => {
      const proj = f.pts.map(([x, y, z]) => project(x, y, z));
      const avgDepth = proj.reduce((acc, p) => acc + p.depth, 0) / proj.length;
      return { ...f, proj, avgDepth };
    })
    .sort((a, b) => b.avgDepth - a.avgDepth)
    .forEach((f) => {
      ctx.beginPath();
      f.proj.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.sx, p.sy);
        else ctx.lineTo(p.sx, p.sy);
      });
      ctx.closePath();
      ctx.fillStyle = f.fill;
      ctx.fill();
      if (colors.stroke) {
        ctx.strokeStyle = colors.stroke;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });
}

function drawArrowedNumberLine3D(ctx, project, axisLabel, zMin = -1.48, zMax = 1.56) {
  const pBot = project(0, 0, zMin);
  const pTop = project(0, 0, zMax);

  // Subtle glow underlay
  ctx.save();
  ctx.strokeStyle = 'rgba(247, 195, 70, 0.25)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(pBot.sx, pBot.sy);
  ctx.lineTo(pTop.sx, pTop.sy);
  ctx.stroke();

  // Crisp golden axis shaft
  ctx.strokeStyle = PALETTE.accent.goldWPos;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(pBot.sx, pBot.sy);
  ctx.lineTo(pTop.sx, pTop.sy);
  ctx.stroke();

  // Directional arrowhead at +axis tip
  const dx = pTop.sx - pBot.sx;
  const dy = pTop.sy - pBot.sy;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;

  ctx.fillStyle = PALETTE.accent.goldWPos;
  ctx.beginPath();
  ctx.moveTo(pTop.sx + ux * 7, pTop.sy + uy * 7);
  ctx.lineTo(pTop.sx - ux * 8 + px * 6, pTop.sy - uy * 8 + py * 6);
  ctx.lineTo(pTop.sx - ux * 8 - px * 6, pTop.sy - uy * 8 - py * 6);
  ctx.closePath();
  ctx.fill();

  // Number-line scale ticks: -1, 0, +1
  ctx.font = '600 11px "JetBrains Mono", ui-monospace, monospace';
  ctx.textAlign = 'left';
  for (const tick of [
    { v: -1.0, label: '−1' },
    { v: 0.0, label: '0' },
    { v: 1.0, label: '+1' },
  ]) {
    const tL = project(-0.08, 0, tick.v);
    const tR = project(0.08, 0, tick.v);
    ctx.strokeStyle = PALETTE.accent.goldWPos;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(tL.sx, tL.sy);
    ctx.lineTo(tR.sx, tR.sy);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 246, 214, 0.85)';
    ctx.fillText(tick.label, tR.sx + 5, tR.sy + 4);
  }

  // Axis Title right beside arrowhead
  ctx.font = '700 13px "Inter", "PingFang SC", sans-serif';
  ctx.fillStyle = PALETTE.accent.goldWPos;
  ctx.textAlign = 'left';
  ctx.fillText(axisLabel, pTop.sx + 12, pTop.sy + 4);
  ctx.restore();
}

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
    this.orbitPhase = 0;
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
      this.orbitPhase += dt * 0.45;
      if (this.autoPlay) {
        this.animPhase = (this.animPhase + dt * 0.46) % (Math.PI * 2);
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
    const cssW = Math.max(760, Math.round(rect.width));
    const cssH = Math.max(360, Math.round(rect.height));
    if (this.canvas.width !== cssW * dpr || this.canvas.height !== cssH * dpr) {
      this.canvas.width = cssW * dpr;
      this.canvas.height = cssH * dpr;
    }

    const ctx = this.ctx;
    ctx.save();
    ctx.scale(dpr, dpr);

    // Rich dark obsidian radial backdrop
    const bgGrad = ctx.createRadialGradient(
      cssW * 0.5,
      cssH * 0.45,
      30,
      cssW * 0.5,
      cssH * 0.5,
      cssW * 0.65
    );
    bgGrad.addColorStop(0, '#1B1610');
    bgGrad.addColorStop(1, '#0F0C08');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cssW, cssH);

    const thetaRad = degToRad(this.thetaDeg);
    const eps = 0.001;
    const xMax = Math.sqrt(Math.cos(thetaRad) ** 2 + eps * eps * Math.sin(thetaRad) ** 2);
    const wMax = Math.sqrt(Math.sin(thetaRad) ** 2 + eps * eps * Math.cos(thetaRad) ** 2);
    const sliceSemiX = Math.min(1.0, eps / Math.max(eps, wMax));
    const canPass = xMax <= 0.082;

    if (this.angleReadoutEl) {
      this.angleReadoutEl.textContent = `当前旋转角 θ = ${this.thetaDeg.toFixed(0)}° · 切面厚度 ${sliceSemiX.toFixed(3)}m · 四维总半宽 ${xMax.toFixed(3)}m ${
        canPass ? '✓ 已立直，可穿过狭缝' : '✗ 仍宽于狭缝'
      }`;
      this.angleReadoutEl.style.color = canPass ? PALETTE.accent.emerald : PALETTE.accent.goldWPos;
    }

    const halfW = cssW * 0.5;

    // Subtle vertical divider between Left (2D Coin Analogy) & Right (3D Sphere -> 4D w Animation)
    ctx.strokeStyle = 'rgba(138, 106, 47, 0.38)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(halfW, 16);
    ctx.lineTo(halfW, cssH - 16);
    ctx.stroke();

    // Gentle living 3D camera sway so depth & parallax are unmistakably 3D!
    const sway = Math.sin(this.orbitPhase) * 0.14;

    // =========================================================================
    // LEFT PANEL: 3D Perspective Coin on 2D Paper -> Lifting into 3rd Dimension
    // =========================================================================
    this._drawLeftCoin3D(ctx, {
      x0: 0,
      width: halfW,
      height: cssH,
      thetaRad,
      canPass,
      yaw: -0.46 + sway * 0.6,
      pitch: 0.44,
    });

    // =========================================================================
    // RIGHT PANEL: True 3D Perspective Sphere Rotating Off "我们所在的三维切面"
    //              Along Arrowed Number Line "第四维度 w"
    // =========================================================================
    this._drawRightSphere4D3D(ctx, {
      x0: halfW,
      width: halfW,
      height: cssH,
      thetaRad,
      xMax,
      sliceSemiX,
      canPass,
      yaw: -0.52 + sway,
      pitch: 0.40,
    });

    ctx.restore();
  }

  _drawLeftCoin3D(ctx, cfg) {
    const cx = cfg.x0 + cfg.width * 0.5;
    const cy = cfg.height * 0.55;
    const scale = Math.min(cfg.width * 0.25, cfg.height * 0.30);
    const project = makeProjector3D(cx, cy, scale, cfg.yaw, cfg.pitch, 6.2);

    // Panel Header
    ctx.font = '700 14px "Inter", "PingFang SC", sans-serif';
    ctx.fillStyle = PALETTE.accent.platinum;
    ctx.textAlign = 'center';
    ctx.fillText('① 降维类比：二维纸面硬币 → 在第三维立起来', cx, 28);

    // 1. 2D Paper Plane (horizontal translucent cyan-ivory sheet at z = 0)
    const planeR = 1.68;
    drawPolygon3D(
      ctx,
      [
        [-planeR, -1.28, 0],
        [planeR, -1.28, 0],
        [planeR, 1.28, 0],
        [-planeR, 1.28, 0],
      ],
      project,
      'rgba(77, 230, 211, 0.11)',
      'rgba(77, 230, 211, 0.62)',
      1.5
    );

    // Paper subtle grid lines
    ctx.strokeStyle = 'rgba(77, 230, 211, 0.16)';
    ctx.lineWidth = 1;
    for (const g of [-1.0, -0.5, 0.5, 1.0]) {
      const a = project(g, -1.28, 0);
      const b = project(g, 1.28, 0);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();

      const c = project(-planeR, g, 0);
      const d = project(planeR, g, 0);
      ctx.beginPath();
      ctx.moveTo(c.sx, c.sy);
      ctx.lineTo(d.sx, d.sy);
      ctx.stroke();
    }

    // 2. Vertical 3D Slit Walls rising across the paper (leaving a narrow central slit!)
    const slitGap = 0.17;
    const wallColors = {
      front: cfg.canPass ? 'rgba(105, 240, 174, 0.14)' : 'rgba(138, 106, 47, 0.22)',
      top: cfg.canPass ? 'rgba(105, 240, 174, 0.22)' : 'rgba(196, 152, 68, 0.28)',
      side: 'rgba(84, 64, 28, 0.16)',
      inner: cfg.canPass ? 'rgba(105, 240, 174, 0.34)' : 'rgba(255, 246, 214, 0.24)',
      stroke: cfg.canPass ? 'rgba(105, 240, 174, 0.65)' : 'rgba(218, 178, 96, 0.5)',
    };
    drawBox3D(ctx, -1.55, -slitGap, 0.36, 0.62, -0.95, 1.15, project, wallColors);
    drawBox3D(ctx, slitGap, 1.55, 0.36, 0.62, -0.95, 1.15, project, wallColors);

    // 3. Golden Arrowed Number Line for 3rd dimension (height)
    drawArrowedNumberLine3D(ctx, project, '第三维高度', -1.28, 1.42);

    // 4. 3D Tilted Golden Coin (radius R = 0.94 rotated around Y axis by thetaRad)
    const R = 0.94;
    const cosT = Math.cos(cfg.thetaRad);
    const sinT = Math.sin(cfg.thetaRad);
    const coinPts = [];
    const segs = 48;
    for (let i = 0; i < segs; i += 1) {
      const a = (i / segs) * Math.PI * 2;
      const lx = R * Math.cos(a);
      const ly = R * Math.sin(a);
      // Rotate around Y: x' = lx * cosT, z' = lx * sinT
      coinPts.push([lx * cosT, ly, lx * sinT]);
    }

    // Coin subtle thickness rim
    const rimPts = coinPts.map(([x, y, z]) => [x + sinT * 0.045, y, z - cosT * 0.045]);
    drawPolygon3D(
      ctx,
      rimPts,
      project,
      cfg.canPass ? 'rgba(64, 185, 130, 0.45)' : 'rgba(166, 122, 36, 0.62)',
      null
    );

    // Main gleaming coin face
    const coinFill = cfg.canPass
      ? 'rgba(105, 240, 174, 0.36)'
      : 'rgba(247, 195, 70, 0.36)';
    const coinStroke = cfg.canPass ? PALETTE.accent.emerald : PALETTE.accent.goldWPos;
    drawPolygon3D(ctx, coinPts, project, coinFill, coinStroke, 2.2);

    // Coin inner decorative emboss ring
    const innerCoinPts = [];
    for (let i = 0; i < segs; i += 1) {
      const a = (i / segs) * Math.PI * 2;
      const lx = R * 0.72 * Math.cos(a);
      const ly = R * 0.72 * Math.sin(a);
      innerCoinPts.push([lx * cosT, ly, lx * sinT]);
    }
    drawPolygon3D(ctx, innerCoinPts, project, null, 'rgba(255, 246, 214, 0.5)', 1.1);

    // 5. Highlight Intersection Line on the 2D Paper Plane (z = 0)!
    // When theta > 2°, the tilted coin intersects the paper along a single glowing diameter line (x=0, y in [-R, R])!
    if (this.thetaDeg >= 2) {
      const iA = project(0, -R, 0);
      const iB = project(0, R, 0);
      ctx.strokeStyle = PALETTE.accent.cyanW0;
      ctx.lineWidth = 4.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(iA.sx, iA.sy);
      ctx.lineTo(iB.sx, iB.sy);
      ctx.stroke();
    }

    // Matching △ and ○ diameter endpoint markers on the 3D coin
    const cTri = project(-R * cosT, 0, -R * sinT);
    const cCirc = project(R * cosT, 0, R * sinT);
    ctx.font = '700 13px "Inter", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = cfg.canPass ? PALETTE.accent.emerald : '#FFB84D';
    ctx.fillText('△', cTri.sx, cTri.sy + 4);
    ctx.fillStyle = cfg.canPass ? PALETTE.accent.emerald : PALETTE.accent.platinum;
    ctx.fillText('○', cCirc.sx, cCirc.sy + 4);

    // Plane label
    const pPlaneTag = project(1.58, -1.18, 0);
    ctx.font = '600 12px "Inter", "PingFang SC", sans-serif';
    ctx.fillStyle = PALETTE.accent.cyanW0;
    ctx.textAlign = 'right';
    ctx.fillText('二维纸面', pPlaneTag.sx, pPlaneTag.sy + 14);

    // Bottom caption
    ctx.font = '500 12.5px "Inter", "PingFang SC", sans-serif';
    ctx.fillStyle = cfg.canPass ? PALETTE.accent.emerald : PALETTE.accent.platinum;
    ctx.textAlign = 'center';
    const caption =
      this.thetaDeg < 2
        ? '平放时：硬币完整落在二维纸面内，太宽过不去'
        : cfg.canPass
          ? '旋转 90° 立直：硬币竖直穿过竖直狭缝！'
          : '刚转几度：纸面只剩一条直径，但翘起的硬币仍撞墙';
    ctx.fillText(caption, cx, cfg.height - 14);
  }

  _drawRightSphere4D3D(ctx, cfg) {
    const cx = cfg.x0 + cfg.width * 0.5;
    const cy = cfg.height * 0.55;
    const scale = Math.min(cfg.width * 0.25, cfg.height * 0.30);
    const project = makeProjector3D(cx, cy, scale, cfg.yaw, cfg.pitch, 6.2);

    // Panel Header
    ctx.font = '700 14px "Inter", "PingFang SC", sans-serif';
    ctx.fillStyle = PALETTE.accent.platinum;
    ctx.textAlign = 'center';
    ctx.fillText('② 本关 3D 原理动画：圆球沿第四维度 w 立起来', cx, 28);

    // 1. Translucent Glowing 3D Slab representing "我们所在的三维切面" (at w = 0)
    const planeR = 1.68;
    const slabThickness = 0.055;
    drawBox3D(ctx, -planeR, planeR, -1.26, 1.26, -slabThickness, slabThickness, project, {
      front: 'rgba(77, 230, 211, 0.22)',
      top: 'rgba(77, 230, 211, 0.13)',
      side: 'rgba(77, 230, 211, 0.10)',
      inner: 'rgba(77, 230, 211, 0.18)',
      stroke: 'rgba(77, 230, 211, 0.68)',
    });

    // Subtle spatial lattice on our 3D slice slab
    ctx.strokeStyle = 'rgba(77, 230, 211, 0.18)';
    ctx.lineWidth = 1;
    for (const g of [-1.0, -0.5, 0.5, 1.0]) {
      const a = project(g, -1.26, slabThickness);
      const b = project(g, 1.26, slabThickness);
      ctx.beginPath();
      ctx.moveTo(a.sx, a.sy);
      ctx.lineTo(b.sx, b.sy);
      ctx.stroke();

      const c = project(-planeR, g, slabThickness);
      const d = project(planeR, g, slabThickness);
      ctx.beginPath();
      ctx.moveTo(c.sx, c.sy);
      ctx.lineTo(d.sx, d.sy);
      ctx.stroke();
    }

    // 2. 3D Four-Dimensional Monolith Walls spanning vertically along the ENTIRE w number line!
    const slitGap = 0.17;
    const wallColors = {
      front: cfg.canPass ? 'rgba(105, 240, 174, 0.15)' : 'rgba(138, 106, 47, 0.24)',
      top: cfg.canPass ? 'rgba(105, 240, 174, 0.24)' : 'rgba(196, 152, 68, 0.30)',
      side: 'rgba(84, 64, 28, 0.18)',
      inner: cfg.canPass ? 'rgba(105, 240, 174, 0.38)' : 'rgba(255, 246, 214, 0.26)',
      stroke: cfg.canPass ? 'rgba(105, 240, 174, 0.72)' : 'rgba(225, 185, 105, 0.55)',
    };
    drawBox3D(ctx, -1.58, -slitGap, 0.42, 0.68, -1.12, 1.22, project, wallColors);
    drawBox3D(ctx, slitGap, 1.58, 0.42, 0.68, -1.12, 1.22, project, wallColors);

    // 3. Bold Golden Arrowed Number Line representing "第四维度 w"
    drawArrowedNumberLine3D(ctx, project, '第四维度 w', -1.24, 1.32);

    // 4. True 3D Shaded Sphere rotating rigidly from our 3D slice into Fourth Dimension w!
    // Visualized in (X, Y_3d, W_vertical):
    // Local sphere has radius R along (X_local, Y_local) and subtle thickness along W_local,
    // rotating rigidly around Y by thetaRad into the W axis — NEVER squashed!
    const R = 0.96;
    const cosT = Math.cos(cfg.thetaRad);
    const sinT = Math.sin(cfg.thetaRad);
    // Gentle pass-through glide along +Y toward the slit when standing cleanly vertical at 90°!
    const glideY = cfg.canPass ? Math.sin(this.orbitPhase * 1.9) * 0.24 + 0.16 : 0;

    // 4a. Draw 3D Volumetric Shaded Sphere / Oblate Body (meridian & latitude ribs + glowing radial body)
    // Compute 3D points of latitude rings of the rotated 3D sphere in (X, Y, W)
    const bodyColor = cfg.canPass ? '105, 240, 174' : '247, 195, 70';
    const coreColor = cfg.canPass ? PALETTE.accent.emerald : PALETTE.accent.goldWPos;

    // Outer silhouette ellipse of the rotated 3D sphere projected into screen space
    const center2D = project(0, glideY, 0);
    const outerLoop = [];
    const segs = 56;
    for (let i = 0; i < segs; i += 1) {
      const a = (i / segs) * Math.PI * 2;
      const lx = R * Math.cos(a);
      const ly = R * Math.sin(a);
      outerLoop.push([lx * cosT, ly + glideY, lx * sinT]);
    }

    // Soft 3D spherical volume glow centered at sphere origin
    const rxProj = Math.max(26, R * scale * (0.28 + 0.72 * Math.abs(cosT)));
    const ryProj = Math.max(26, R * scale * (0.48 + 0.52 * Math.abs(sinT)));
    const radGlow = ctx.createRadialGradient(
      center2D.sx - rxProj * 0.22,
      center2D.sy - ryProj * 0.22,
      4,
      center2D.sx,
      center2D.sy,
      Math.max(rxProj, ryProj) * 1.05
    );
    radGlow.addColorStop(0, `rgba(255, 250, 232, 0.55)`);
    radGlow.addColorStop(0.45, `rgba(${bodyColor}, 0.28)`);
    radGlow.addColorStop(1, `rgba(${bodyColor}, 0.04)`);

    // Draw 3D wireframe latitude/longitude shells that genuinely look like a 3D sphere turning into W!
    // We embed a true 3D sphere (radius R in X_local, Y_local, and visual 3D thickness factor 0.42 in Z_local
    // that tapers smoothly as it turns into W, while preserving full circular R in all cross-sections!).
    const visualThick = 0.52 * Math.cos(cfg.thetaRad) ** 2 + 0.14 * Math.sin(cfg.thetaRad) ** 2;

    // Stacked circular cross-section slices along the sphere's tilted axis — visually illustrates
    // "球被切成了不同的圆被分散放在了 w 轴上"!
    const sliceLevels = [-0.78, -0.45, 0, 0.45, 0.78];
    sliceLevels.forEach((u) => {
      const sliceR = R * Math.sqrt(Math.max(0.02, 1 - u * u));
      const pts = [];
      for (let i = 0; i < 40; i += 1) {
        const a = (i / 40) * Math.PI * 2;
        const lx = u * R;
        const ly = sliceR * Math.cos(a);
        const lz = sliceR * visualThick * Math.sin(a);
        // Rotate (lx, lz) into (X, W) by thetaRad!
        const wx = lx * cosT - lz * sinT;
        const ww = lx * sinT + lz * cosT;
        pts.push([wx, ly + glideY, ww]);
      }
      const isCenterSlice = u === 0;
      drawPolygon3D(
        ctx,
        pts,
        project,
        isCenterSlice ? `rgba(77, 230, 211, 0.22)` : `rgba(${bodyColor}, 0.11)`,
        isCenterSlice ? PALETTE.accent.cyanW0 : `rgba(${bodyColor}, 0.58)`,
        isCenterSlice ? 2.4 : 1.2
      );
    });

    // Equatorial + Meridian 3D rings for unmistakable spherical volume
    for (const phi of [0, Math.PI * 0.5]) {
      const mPts = [];
      for (let i = 0; i < 48; i += 1) {
        const a = (i / 48) * Math.PI * 2;
        const lx = R * Math.cos(a);
        const ly = R * Math.sin(a) * Math.cos(phi);
        const lz = R * visualThick * Math.sin(a) * Math.sin(phi);
        const wx = lx * cosT - lz * sinT;
        const ww = lx * sinT + lz * cosT;
        mPts.push([wx, ly + glideY, ww]);
      }
      drawPolygon3D(ctx, mPts, project, phi === 0 ? radGlow : null, coreColor, phi === 0 ? 2.2 : 1.4);
    }

    // 4b. Highlight the bright Cyan Cross-Section sitting RIGHT inside "我们所在的三维切面" (w = 0)!
    const slicePts = [];
    const sliceXHalf = Math.max(0.04, cfg.sliceSemiX * R);
    for (let i = 0; i < 40; i += 1) {
      const a = (i / 40) * Math.PI * 2;
      slicePts.push([sliceXHalf * Math.cos(a), R * Math.sin(a) + glideY, slabThickness + 0.01]);
    }
    drawPolygon3D(
      ctx,
      slicePts,
      project,
      'rgba(77, 230, 211, 0.42)',
      PALETTE.accent.cyanW0,
      2.6
    );

    // 4c. Outer 4D X-extent indicator ticks showing collision vs clear slit
    const xSpan = cfg.xMax * R;
    ctx.strokeStyle = cfg.canPass ? PALETTE.accent.emerald : 'rgba(255, 107, 107, 0.78)';
    ctx.lineWidth = 1.4;
    ctx.setLineDash([4, 3]);
    for (const s of [-1, 1]) {
      const dTop = project(s * xSpan, glideY, 1.05);
      const dBot = project(s * xSpan, glideY, -1.05);
      ctx.beginPath();
      ctx.moveTo(dTop.sx, dTop.sy);
      ctx.lineTo(dBot.sx, dBot.sy);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Matching △ and ○ diameter endpoint markers on the 3D sphere
    const sTri = project(-R * cosT, glideY, -R * sinT);
    const sCirc = project(R * cosT, glideY, R * sinT);
    ctx.font = '700 13px "Inter", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = cfg.canPass ? PALETTE.accent.emerald : '#FFB84D';
    ctx.fillText('△', sTri.sx, sTri.sy + 4);
    ctx.fillStyle = cfg.canPass ? PALETTE.accent.emerald : PALETTE.accent.platinum;
    ctx.fillText('○', sCirc.sx, sCirc.sy + 4);

    // 5. Crisp Slab Label: "我们所在的三维切面" (NEVER "W=0 切片"!)
    const pSlabLabel = project(1.66, -1.24, 0.06);
    ctx.font = '700 13px "Inter", "PingFang SC", sans-serif';
    ctx.fillStyle = PALETTE.accent.cyanW0;
    ctx.textAlign = 'right';
    ctx.fillText('我们所在的三维切面', pSlabLabel.sx + 28, pSlabLabel.sy + 14);

    // Bottom intuitive caption
    ctx.font = '500 12.5px "Inter", "PingFang SC", sans-serif';
    ctx.fillStyle = cfg.canPass ? PALETTE.accent.emerald : PALETTE.accent.platinum;
    ctx.textAlign = 'center';
    const caption =
      this.thetaDeg < 2
        ? '未旋转时：圆球完整平放在我们所在的三维切面中'
        : cfg.canPass
          ? '旋转 90° 立入第四维度 w：球体完整未压扁，轻松滑过狭缝！'
          : `倾斜中：切面只剩薄圆，但球本体跨度仍有 ${cfg.xMax.toFixed(2)}m 会撞墙`;
    ctx.fillText(caption, cx, cfg.height - 14);
  }
}
