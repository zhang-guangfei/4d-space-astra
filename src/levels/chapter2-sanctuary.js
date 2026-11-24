/**
 * Beyond 3D — Chapter 2 Sanctuary (Act III) 3D Landmark Builder
 * Phase 1 Vertical Slice: Level 14 "发丝裂缝" (Hairline Slit)
 *
 * Strictly obeys 04-visual-and-art-direction.md (C-Zone Obsidian Dark-Gold + Pure White):
 * - Environment base: #1D1912 obsidian / #8A6A2F bronze / #F6F4EE sanctuary white (low saturation)
 * - Accents strictly reserved for W slices & interactables (#4DE6D3, #F7C346, #58A6FF, #FFF6D6, #69F0AE, #FF6B6B)
 * - Strict Solid (alpha=1, depthWrite ON) vs Ghost (alpha=0.34, depthWrite OFF, depthPrePass OFF)
 * - Three Rendering Groups (0: env/walls, 1: puzzle/ghosts, 2: characters/wireframes)
 * - Optimized 3-light shader budget & frozen static world matrices for rock-solid 60 FPS everywhere
 */

import { LEVEL14_CONFIG } from '../core/sanctuary-4d.js';
import {
  PALETTE,
  RENDER_GROUPS,
  applyPhaseToMaterial,
  configureRenderingGroups,
  createGhostMaterial,
  createSolidMaterial,
} from '../engine/phase-materials.js';

export class Level14SanctuaryScene {
  constructor(scene) {
    this.scene = scene;
    this.B = globalThis.BABYLON;
    this.root = new this.B.TransformNode('level14_root', scene);
    this.elapsed = 0;
    this.barrierFlash = 0;
    this.hintHighlight = false;
    this.gateOpenProgress = 0;

    configureRenderingGroups(scene);
    this._setupAtmosphereAndLights();
    this._buildSanctuaryArchitecture();
    this._buildLayerReferenceArches();
    this._buildHairlineMonoliths();
    this._buildPedestalsAndGate();
    this._buildPassingOrb();
    this._buildAstronaut08();
    this._buildSanctuaryMotes();
  }

  _setupAtmosphereAndLights() {
    const B = this.B;
    const s = this.scene;

    s.clearColor = B.Color4.FromHexString(`${PALETTE.zoneC.bg}FF`);
    s.fogMode = B.Scene.FOGMODE_EXP2;
    s.fogColor = B.Color3.FromHexString('#14110D');
    s.fogDensity = 0.015;

    // Filmic ACES tone mapping & subtle cathedral vignette for rich obsidian-gold contrast
    s.imageProcessingConfiguration.toneMappingEnabled = true;
    s.imageProcessingConfiguration.toneMappingType = B.ImageProcessingConfiguration.TONEMAPPING_ACES;
    s.imageProcessingConfiguration.contrast = 1.18;
    s.imageProcessingConfiguration.exposure = 1.08;
    s.imageProcessingConfiguration.vignetteEnabled = true;
    s.imageProcessingConfiguration.vignetteWeight = 1.4;
    s.imageProcessingConfiguration.vignetteStretch = 0.4;
    s.imageProcessingConfiguration.vignetteColor = new B.Color4(0.03, 0.025, 0.018, 0);

    // Cinematic GlowLayer bloom for the platinum hairline slit, orb rim, and golden sanctuary trim
    const glow = new B.GlowLayer('sanctuary_glow', s, {
      mainTextureFixedSize: 512,
      blurKernelSize: 48,
    });
    glow.intensity = 0.62;
    this.glowLayer = glow;

    // 3-light budget for crisp architectural contrast and 60 FPS shader speed
    const hemi = new B.HemisphericLight('sanctuary_hemi', new B.Vector3(0, 1, -0.25), s);
    hemi.intensity = 0.65;
    hemi.diffuse = B.Color3.FromHexString('#F4ECDC');
    hemi.groundColor = B.Color3.FromHexString('#1B1610');

    const dir = new B.DirectionalLight('sanctuary_dir', new B.Vector3(-0.32, -0.88, 0.32), s);
    dir.position = new B.Vector3(5, 14, -5);
    dir.intensity = 1.12;
    dir.diffuse = B.Color3.FromHexString('#FFEAC0');
    dir.specular = B.Color3.FromHexString('#F7C346');

    // Orb reactive energy light (dynamically follows orb & turns emerald/platinum)
    this.orbLight = new B.PointLight(
      'orb_point_light',
      new B.Vector3(0, LEVEL14_CONFIG.orbCenterY, LEVEL14_CONFIG.orbStartZ),
      s
    );
    this.orbLight.diffuse = B.Color3.FromHexString(PALETTE.accent.cyanW0);
    this.orbLight.intensity = 1.45;
    this.orbLight.range = 10.5;
  }

  _createMonolithTexture() {
    const B = this.B;
    const tex = new B.DynamicTexture('monolith_carved_tex', { width: 512, height: 512 }, this.scene, true);
    const ctx = tex.getContext();

    // Deep obsidian stone gradient base
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#262017');
    grad.addColorStop(0.5, '#1D1811');
    grad.addColorStop(1, '#14110C');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Carved vertical sanctuary fluting & architectural monolith panel seams
    for (let x = 0; x < 512; x += 64) {
      ctx.fillStyle = 'rgba(255, 246, 214, 0.025)';
      ctx.fillRect(x + 2, 0, 10, 512);
      ctx.strokeStyle = 'rgba(138, 106, 47, 0.22)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }

    // Subtle sacred geometric diamond filigree inlays
    ctx.strokeStyle = 'rgba(247, 195, 70, 0.16)';
    ctx.lineWidth = 1.5;
    for (let y = 64; y < 512; y += 128) {
      for (let x = 64; x < 512; x += 128) {
        ctx.beginPath();
        ctx.moveTo(x, y - 28);
        ctx.lineTo(x + 28, y);
        ctx.lineTo(x, y + 28);
        ctx.lineTo(x - 28, y);
        ctx.closePath();
        ctx.stroke();
      }
    }

    tex.update();
    tex.uScale = 2;
    tex.vScale = 2;
    return tex;
  }

  _createFloorTexture() {
    const B = this.B;
    const tex = new B.DynamicTexture('sanctuary_floor_tex', { width: 512, height: 512 }, this.scene, true);
    const ctx = tex.getContext();
    ctx.fillStyle = '#1D1912';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(138, 106, 47, 0.25)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 512; i += 64) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 512);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(138, 106, 47, 0.14)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(24, 24, 464, 464);

    tex.update();
    tex.uScale = 7;
    tex.vScale = 9;
    return tex;
  }

  _freezeStatic(mesh) {
    mesh.isPickable = false;
    mesh.freezeWorldMatrix();
    return mesh;
  }

  _buildSanctuaryArchitecture() {
    const B = this.B;
    const s = this.scene;

    const obsidianMat = createSolidMaterial(s, 'obsidian_base_mat', {
      diffuseHex: PALETTE.zoneC.obsidian,
      specularHex: '#473920',
      specularPower: 64,
    });
    const stoneMat = createSolidMaterial(s, 'obsidian_stone_mat', {
      diffuseHex: PALETTE.zoneC.stoneDark,
      specularHex: '#3A2E1B',
      specularPower: 40,
    });
    const bronzeMat = createSolidMaterial(s, 'bronze_trim_mat', {
      diffuseHex: PALETTE.zoneC.bronze,
      emissiveHex: PALETTE.zoneC.bronze,
      emissiveScale: 0.22,
      specularHex: '#D8B772',
      specularPower: 96,
    });
    const whiteMat = createSolidMaterial(s, 'sanctuary_white_mat', {
      diffuseHex: PALETTE.zoneC.sanctuaryWhite,
      emissiveHex: PALETTE.zoneC.sanctuaryWhite,
      emissiveScale: 0.16,
      specularHex: '#FFFFFF',
      specularPower: 64,
    });

    // 1. Sanctuary Floor with inlaid architectural stone seams
    const floorMat = createSolidMaterial(s, 'sanctuary_floor_mat', {
      diffuseHex: '#FFFFFF',
      specularHex: '#524227',
      specularPower: 72,
    });
    floorMat.diffuseTexture = this._createFloorTexture();

    const floor = B.MeshBuilder.CreateGround('sanctuary_floor', { width: 18, height: 24 }, s);
    floor.position.set(0, 0, -0.5);
    floor.material = floorMat;
    floor.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    floor.parent = this.root;
    this._freezeStatic(floor);

    // Central dark-bronze ceremonial runway leading directly through the 0.164m hairline slit
    const track = B.MeshBuilder.CreateBox('orb_runway', { width: 0.64, height: 0.03, depth: 11.2 }, s);
    track.position.set(0, 0.015, 0);
    track.material = stoneMat;
    track.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    track.parent = this.root;
    this._freezeStatic(track);

    // Exact 0.164m hairline floor rails (visual precision gauge along X = ±0.082m)
    const railMat = createSolidMaterial(s, 'slit_rail_mat', {
      diffuseHex: PALETTE.accent.platinum,
      emissiveHex: PALETTE.accent.platinum,
      emissiveScale: 0.72,
    });
    for (const sign of [-1, 1]) {
      const rail = B.MeshBuilder.CreateBox(
        `slit_floor_rail_${sign}`,
        { width: 0.018, height: 0.038, depth: 9.6 },
        s
      );
      rail.position.set(sign * LEVEL14_CONFIG.slitHalfWidth, 0.02, 0);
      rail.material = railMat;
      rail.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      rail.parent = this.root;
      this._freezeStatic(rail);
    }

    // 2. Flanking Sanctuary Colonnade Pillars & Overhead Vault Beams
    const pillarZs = [-7.8, -4.4, 4.4, 7.2];
    pillarZs.forEach((pz, idx) => {
      for (const side of [-1, 1]) {
        const pillar = B.MeshBuilder.CreateBox(
          `sanctuary_pillar_${idx}_${side}`,
          { width: 1.05, height: 9.2, depth: 1.05 },
          s
        );
        pillar.position.set(side * 6.8, 4.6, pz);
        pillar.material = obsidianMat;
        pillar.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
        pillar.parent = this.root;
        this._freezeStatic(pillar);

        const strip = B.MeshBuilder.CreateBox(
          `pillar_bronze_${idx}_${side}`,
          { width: 0.08, height: 8.6, depth: 0.14 },
          s
        );
        strip.position.set(side * 6.26, 4.5, pz);
        strip.material = bronzeMat;
        strip.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
        strip.parent = this.root;
        this._freezeStatic(strip);
      }

      const beam = B.MeshBuilder.CreateBox(`vault_beam_${idx}`, { width: 14.8, height: 0.65, depth: 0.85 }, s);
      beam.position.set(0, 9.2, pz);
      beam.material = stoneMat;
      beam.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      beam.parent = this.root;
      this._freezeStatic(beam);
    });

    // Side & rear sanctuary enclosure walls
    for (const side of [-1, 1]) {
      const sideWall = B.MeshBuilder.CreateBox(
        `sanctuary_side_wall_${side}`,
        { width: 0.6, height: 9.6, depth: 24 },
        s
      );
      sideWall.position.set(side * 7.6, 4.8, -0.5);
      sideWall.material = obsidianMat;
      sideWall.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      sideWall.parent = this.root;
      this._freezeStatic(sideWall);
    }

    const southWall = B.MeshBuilder.CreateBox('sanctuary_south_wall', { width: 16, height: 9.6, depth: 0.6 }, s);
    southWall.position.set(0, 4.8, -11.2);
    southWall.material = obsidianMat;
    southWall.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    southWall.parent = this.root;
    this._freezeStatic(southWall);

    // High clerestory skylight pure-white sanctuary ribbon overhead
    const skylight = B.MeshBuilder.CreateBox('clerestory_skylight', { width: 2.0, height: 0.12, depth: 18 }, s);
    skylight.position.set(0, 9.65, -0.5);
    skylight.material = whiteMat;
    skylight.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    skylight.parent = this.root;
    this._freezeStatic(skylight);
  }

  /**
   * Flanking W-layer reference arches (W = +1.8 Gold on East, W = -1.8 Blue on West).
   * Scrolling W smoothly transitions them between Ghost (alpha=0.34, depthWrite=OFF) and Solid (alpha=1),
   * creating an instant sensory contrast against the Twin Hairline Monoliths that stay SOLID in ALL W!
   */
  _buildLayerReferenceArches() {
    const B = this.B;
    const s = this.scene;

    this.wLayerGroups = [];
    const defs = [
      { w: 1.8, hex: PALETTE.accent.goldWPos, xOffset: 4.5, zPositions: [-5.2, -2.6] },
      { w: -1.8, hex: PALETTE.accent.blueWNeg, xOffset: -4.5, zPositions: [-5.2, -2.6] },
    ];

    defs.forEach((def, idx) => {
      const mat = createGhostMaterial(s, `w_ref_arch_mat_${idx}`, def.hex, 0.34);
      const meshes = [];
      def.zPositions.forEach((zPos, j) => {
        // Babylon CreateTorus lies in XZ; rotation.z = PI/2 stands it vertically in YZ facing the nave!
        const ring = B.MeshBuilder.CreateTorus(
          `w_ref_ring_${idx}_${j}`,
          { diameter: 2.4, thickness: 0.08, tessellation: 28 },
          s
        );
        ring.position.set(def.xOffset, 3.0, zPos);
        ring.rotation.z = Math.PI * 0.5;
        ring.material = mat;
        ring.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
        ring.parent = this.root;
        this._freezeStatic(ring);
        meshes.push(ring);

        const stela = B.MeshBuilder.CreateBox(
          `w_ref_stela_${idx}_${j}`,
          { width: 0.18, height: 3.6, depth: 0.5 },
          s
        );
        stela.position.set(def.xOffset + (def.xOffset > 0 ? 0.6 : -0.6), 1.8, zPos);
        stela.material = mat;
        stela.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
        stela.parent = this.root;
        this._freezeStatic(stela);
        meshes.push(stela);
      });
      this.wLayerGroups.push({ w: def.w, mat, meshes });
    });
  }

  /**
   * Hero Landmark: 「一线天石碑」 — Twin 6.8m Obsidian-Gold Monoliths with exact 0.164m Hairline Slit.
   * Exists solidly across ALL W slices!
   */
  _buildHairlineMonoliths() {
    const B = this.B;
    const s = this.scene;

    const wallH = LEVEL14_CONFIG.wallHeight; // 6.8 m
    const wallDepth = LEVEL14_CONFIG.wallZMax - LEVEL14_CONFIG.wallZMin; // 2.4 m
    const halfGap = LEVEL14_CONFIG.slitHalfWidth; // 0.082 m
    const wallWidth = 7.4;

    this.monolithMat = createSolidMaterial(s, 'monolith_obsidian_mat', {
      diffuseHex: '#241E15',
      emissiveHex: '#2E2517',
      emissiveScale: 0.2,
      specularHex: '#8A6A2F',
      specularPower: 80,
    });

    const bronzeMat = createSolidMaterial(s, 'monolith_bronze_mat', {
      diffuseHex: PALETTE.zoneC.bronze,
      emissiveHex: PALETTE.zoneC.bronze,
      emissiveScale: 0.28,
      specularHex: '#F7C346',
      specularPower: 96,
    });

    this.slitLipMat = createSolidMaterial(s, 'slit_platinum_lip_mat', {
      diffuseHex: PALETTE.accent.platinum,
      emissiveHex: PALETTE.accent.platinum,
      emissiveScale: 1.0,
      specularHex: '#FFFFFF',
    });

    for (const side of [-1, 1]) {
      const centerX = side * (halfGap + wallWidth * 0.5);

      const slab = B.MeshBuilder.CreateBox(
        `hairline_monolith_${side}`,
        { width: wallWidth, height: wallH, depth: wallDepth },
        s
      );
      slab.position.set(centerX, wallH * 0.5, 0);
      slab.material = this.monolithMat;
      slab.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      slab.parent = this.root;
      this._freezeStatic(slab);

      const crown = B.MeshBuilder.CreateBox(
        `monolith_crown_${side}`,
        { width: wallWidth + 0.12, height: 0.34, depth: wallDepth + 0.24 },
        s
      );
      crown.position.set(centerX, wallH + 0.17, 0);
      crown.material = bronzeMat;
      crown.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      crown.parent = this.root;
      this._freezeStatic(crown);

      // Stepped architectural bronze bands across both monolith faces
      [1.35, 3.4, 5.45].forEach((bandY, bIdx) => {
        for (const zFace of [-1, 1]) {
          const band = B.MeshBuilder.CreateBox(
            `monolith_band_${side}_${bIdx}_${zFace}`,
            { width: wallWidth - 0.35, height: 0.1, depth: 0.06 },
            s
          );
          band.position.set(centerX, bandY, zFace * (wallDepth * 0.5 + 0.02));
          band.material = bronzeMat;
          band.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
          band.parent = this.root;
          this._freezeStatic(band);
        }
      });

      // Vertical architectural bronze framing ribs flanking the hairline slit (scale accent)
      for (const zFace of [-1, 1]) {
        const rib = B.MeshBuilder.CreateBox(
          `monolith_slit_rib_${side}_${zFace}`,
          { width: 0.14, height: wallH, depth: 0.08 },
          s
        );
        rib.position.set(side * (halfGap + 0.32), wallH * 0.5, zFace * (wallDepth * 0.5 + 0.03));
        rib.material = bronzeMat;
        rib.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
        rib.parent = this.root;
        this._freezeStatic(rib);
      }

      // Razor-sharp glowing platinum vertical hairline lip emitters along X = ±0.082m!
      for (const zFace of [-1, 1]) {
        const lip = B.MeshBuilder.CreateBox(
          `slit_platinum_lip_${side}_${zFace}`,
          { width: 0.034, height: wallH, depth: 0.05 },
          s
        );
        lip.position.set(side * (halfGap + 0.017), wallH * 0.5, zFace * (wallDepth * 0.5 + 0.015));
        lip.material = this.slitLipMat;
        lip.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
        lip.parent = this.root;
        this._freezeStatic(lip);
      }

      // Luminous inner wall channel lining the 2.4m deep hairline corridor
      const innerStrip = B.MeshBuilder.CreateBox(
        `slit_inner_strip_${side}`,
        { width: 0.01, height: wallH - 0.1, depth: wallDepth - 0.04 },
        s
      );
      innerStrip.position.set(side * (halfGap + 0.005), wallH * 0.5, 0);
      innerStrip.material = this.slitLipMat;
      innerStrip.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      innerStrip.parent = this.root;
      this._freezeStatic(innerStrip);
    }

    // Overhead lintel sealing above Y = 6.8m
    const topSeal = B.MeshBuilder.CreateBox(
      'monolith_top_seal',
      { width: 15.2, height: 2.6, depth: wallDepth },
      s
    );
    topSeal.position.set(0, wallH + 1.64, 0);
    topSeal.material = this.monolithMat;
    topSeal.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    topSeal.parent = this.root;
    this._freezeStatic(topSeal);

    // Amber-coral collision feedback barrier plane at the slit entrance
    this.barrierMat = createGhostMaterial(s, 'slit_barrier_flash_mat', PALETTE.accent.amberCoral, 0.34);
    this.barrierMat.alpha = 0.0;
    this.barrierPlane = B.MeshBuilder.CreatePlane('slit_barrier_plane', { width: 2.4, height: 3.4 }, s);
    this.barrierPlane.position.set(0, LEVEL14_CONFIG.orbCenterY, LEVEL14_CONFIG.wallZMin - 0.05);
    this.barrierPlane.material = this.barrierMat;
    this.barrierPlane.isPickable = false;
    this.barrierPlane.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    this.barrierPlane.parent = this.root;
  }

  _buildPedestalsAndGate() {
    const B = this.B;
    const s = this.scene;

    const whiteMat = createSolidMaterial(s, 'pedestal_white_mat', {
      diffuseHex: PALETTE.zoneC.sanctuaryWhite,
      emissiveHex: PALETTE.zoneC.sanctuaryWhite,
      emissiveScale: 0.14,
      specularHex: '#FFFFFF',
      specularPower: 64,
    });
    const bronzeMat = createSolidMaterial(s, 'pedestal_bronze_mat', {
      diffuseHex: PALETTE.zoneC.bronze,
      emissiveHex: PALETTE.zoneC.bronze,
      emissiveScale: 0.32,
    });
    const cyanRingMat = createSolidMaterial(s, 'south_ring_mat', {
      diffuseHex: PALETTE.accent.cyanW0,
      emissiveHex: PALETTE.accent.cyanW0,
      emissiveScale: 0.88,
    });
    this.northRingMat = createSolidMaterial(s, 'north_ring_mat', {
      diffuseHex: PALETTE.accent.goldWPos,
      emissiveHex: PALETTE.accent.goldWPos,
      emissiveScale: 0.92,
    });

    // South Pedestal (Z = -3.2m) — flat sleek horizontal cyan ring!
    const southBase = B.MeshBuilder.CreateCylinder(
      'south_pedestal_base',
      { diameterTop: 2.25, diameterBottom: 2.75, height: 0.32, tessellation: 28 },
      s
    );
    southBase.position.set(0, 0.16, LEVEL14_CONFIG.orbStartZ);
    southBase.material = whiteMat;
    southBase.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    southBase.parent = this.root;
    this._freezeStatic(southBase);

    // Babylon CreateTorus lies horizontally in XZ by default — NO rotation.x!
    const southRing = B.MeshBuilder.CreateTorus(
      'south_pedestal_ring',
      { diameter: 2.34, thickness: 0.065, tessellation: 36 },
      s
    );
    southRing.position.set(0, 0.34, LEVEL14_CONFIG.orbStartZ);
    southRing.material = cyanRingMat;
    southRing.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    southRing.parent = this.root;
    this._freezeStatic(southRing);

    // North Destination Golden Pedestal (Z = +3.2m)
    const northBase = B.MeshBuilder.CreateCylinder(
      'north_pedestal_base',
      { diameterTop: 2.35, diameterBottom: 2.9, height: 0.34, tessellation: 28 },
      s
    );
    northBase.position.set(0, 0.17, LEVEL14_CONFIG.orbTargetZ);
    northBase.material = whiteMat;
    northBase.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    northBase.parent = this.root;
    this._freezeStatic(northBase);

    this.northRing = B.MeshBuilder.CreateTorus(
      'north_pedestal_ring',
      { diameter: 2.44, thickness: 0.08, tessellation: 36 },
      s
    );
    this.northRing.position.set(0, 0.36, LEVEL14_CONFIG.orbTargetZ);
    this.northRing.material = this.northRingMat;
    this.northRing.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.northRing.parent = this.root;
    this._freezeStatic(this.northRing);

    // North Target Ghost Sphere Silhouette (strict Ghost invariants: alpha=0.32, disableDepthWrite=true!)
    this.northTargetGhostMat = createGhostMaterial(s, 'north_target_ghost_mat', PALETTE.accent.goldWPos, 0.32);
    this.northTargetGhost = B.MeshBuilder.CreateSphere(
      'north_target_ghost_sphere',
      { diameter: LEVEL14_CONFIG.radiusR * 2, segments: 20 },
      s
    );
    this.northTargetGhost.position.set(0, LEVEL14_CONFIG.orbCenterY, LEVEL14_CONFIG.orbTargetZ);
    this.northTargetGhost.material = this.northTargetGhostMat;
    this.northTargetGhost.isPickable = false;
    this.northTargetGhost.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.northTargetGhost.parent = this.root;

    // Victory Radiant Light Pillar
    this.victoryBeamMat = createGhostMaterial(s, 'victory_beam_mat', PALETTE.accent.platinum, 0.34);
    this.victoryBeam = B.MeshBuilder.CreateCylinder(
      'victory_beam',
      { diameter: 2.1, height: 10.0, tessellation: 24 },
      s
    );
    this.victoryBeam.position.set(0, 5.0, LEVEL14_CONFIG.orbTargetZ);
    this.victoryBeam.material = this.victoryBeamMat;
    this.victoryBeam.isVisible = false;
    this.victoryBeam.isPickable = false;
    this.victoryBeam.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.victoryBeam.parent = this.root;

    // Sanctuary Inner Gate at Z = +7.6m
    const gateFrame = B.MeshBuilder.CreateBox('sanctuary_gate_frame', { width: 15, height: 9.6, depth: 0.7 }, s);
    gateFrame.position.set(0, 4.8, 8.2);
    gateFrame.material = createSolidMaterial(s, 'gate_frame_mat', { diffuseHex: '#18140E' });
    gateFrame.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    gateFrame.parent = this.root;
    this._freezeStatic(gateFrame);

    const gateDoorMat = createSolidMaterial(s, 'gate_door_mat', {
      diffuseHex: '#251F16',
      specularHex: '#8A6A2F',
    });

    this.gateLeft = B.MeshBuilder.CreateBox('gate_door_left', { width: 2.2, height: 5.8, depth: 0.4 }, s);
    this.gateLeft.position.set(-1.12, 2.9, 7.6);
    this.gateLeft.material = gateDoorMat;
    this.gateLeft.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    this.gateLeft.parent = this.root;

    this.gateRight = B.MeshBuilder.CreateBox('gate_door_right', { width: 2.2, height: 5.8, depth: 0.4 }, s);
    this.gateRight.position.set(1.12, 2.9, 7.6);
    this.gateRight.material = gateDoorMat;
    this.gateRight.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    this.gateRight.parent = this.root;

    // Vertical Golden Gate Seal Ring (rotation.x = PI/2 faces South!)
    this.gateEmblem = B.MeshBuilder.CreateTorus(
      'gate_emblem_ring',
      { diameter: 2.2, thickness: 0.085, tessellation: 36 },
      s
    );
    this.gateEmblem.position.set(0, 3.0, 7.35);
    this.gateEmblem.rotation.x = Math.PI * 0.5;
    this.gateEmblem.material = bronzeMat;
    this.gateEmblem.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.gateEmblem.parent = this.root;

    const behindGlowMat = createSolidMaterial(s, 'behind_gate_glow', {
      diffuseHex: PALETTE.accent.platinum,
      emissiveHex: PALETTE.accent.platinum,
      emissiveScale: 1.0,
    });
    const behindGlow = B.MeshBuilder.CreatePlane('behind_gate_radiance', { width: 4.2, height: 5.6 }, s);
    behindGlow.position.set(0, 2.9, 7.82);
    behindGlow.material = behindGlowMat;
    behindGlow.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    behindGlow.parent = this.root;
    this._freezeStatic(behindGlow);
  }

  /**
   * Build the 2.0m Passing Orb (通行珠):
   * 1. `orbSliceCore`: exact W = c cross-section ellipsoid (semiX, semiY, semiZ, xCenter)
   * 2. `orbProjRoot`: exact 4D X-projection bounding envelope (scaled by xMax(theta))
   * 3. `orbMeridianRoot`: 3 orthogonal golden/platinum SO(3) meridian rings rotating by state.orbQuat3D
   * 4. `yzPlaneHalo`: crisp vertical YZ-plane halo (X = 0) visualizing the 4D rotation plane in Grab Stage!
   */
  _buildPassingOrb() {
    const B = this.B;
    const s = this.scene;

    this.orbRoot = new B.TransformNode('passing_orb_root', s);
    this.orbRoot.position.set(0, LEVEL14_CONFIG.orbCenterY, LEVEL14_CONFIG.orbStartZ);
    this.orbRoot.parent = this.root;

    // 1. Exact W-slice Solid Core with crystalline Fresnel rim glow
    this.orbCoreMat = createSolidMaterial(s, 'orb_slice_core_mat', {
      diffuseHex: PALETTE.accent.cyanW0,
      emissiveHex: PALETTE.accent.cyanW0,
      emissiveScale: 0.35,
      specularHex: '#FFF6D6',
      specularPower: 112,
    });
    this.orbCoreMat.emissiveFresnelParameters = new B.FresnelParameters();
    this.orbCoreMat.emissiveFresnelParameters.bias = 0.28;
    this.orbCoreMat.emissiveFresnelParameters.power = 2.6;
    this.orbCoreMat.emissiveFresnelParameters.leftColor = B.Color3.FromHexString('#FFF6D6');
    this.orbCoreMat.emissiveFresnelParameters.rightColor = B.Color3.FromHexString('#143B38');
    this.orbSliceCore = B.MeshBuilder.CreateSphere('orb_slice_core', { diameter: 2.0, segments: 24 }, s);
    this.orbSliceCore.material = this.orbCoreMat;
    this.orbSliceCore.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.orbSliceCore.parent = this.orbRoot;

    // 2. 4D Projection Envelope (scaled to exact xMax(theta) along X!)
    this.orbProjRoot = new B.TransformNode('orb_4d_projection_root', s);
    this.orbProjRoot.parent = this.orbRoot;

    this.orbProjShellMat = createGhostMaterial(s, 'orb_proj_shell_mat', PALETTE.accent.goldWPos, 0.30);
    this.orbProjShell = B.MeshBuilder.CreateSphere('orb_proj_shell', { diameter: 2.02, segments: 20 }, s);
    this.orbProjShell.material = this.orbProjShellMat;
    this.orbProjShell.isPickable = false;
    this.orbProjShell.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.orbProjShell.parent = this.orbProjRoot;

    // 3. SO(3) 3D Meridian & Equator Rings (tracks true W=0 slice; responds vividly to drag)
    this.orbMeridianRoot = new B.TransformNode('orb_so3_meridians', s);
    this.orbMeridianRoot.parent = this.orbRoot;

    this.meridianGoldMat = createSolidMaterial(s, 'orb_meridian_gold_mat', {
      diffuseHex: PALETTE.accent.goldWPos,
      emissiveHex: PALETTE.accent.goldWPos,
      emissiveScale: 0.78,
    });
    this.meridianPlatinumMat = createSolidMaterial(s, 'orb_meridian_platinum_mat', {
      diffuseHex: PALETTE.accent.platinum,
      emissiveHex: PALETTE.accent.platinum,
      emissiveScale: 0.72,
    });

    // Equator ring (XZ plane, default orientation)
    const ringXZ = B.MeshBuilder.CreateTorus(
      'orb_ring_xz',
      { diameter: 2.05, thickness: 0.032, tessellation: 36 },
      s
    );
    ringXZ.material = this.meridianGoldMat;
    ringXZ.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    ringXZ.parent = this.orbMeridianRoot;

    // Vertical XY meridian ring (rotation.x = PI/2)
    const ringXY = B.MeshBuilder.CreateTorus(
      'orb_ring_xy',
      { diameter: 2.05, thickness: 0.032, tessellation: 36 },
      s
    );
    ringXY.rotation.x = Math.PI * 0.5;
    ringXY.material = this.meridianGoldMat;
    ringXY.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    ringXY.parent = this.orbMeridianRoot;

    // Vertical YZ meridian ring (rotation.z = PI/2 -> lies strictly in X=0 blade plane!)
    const ringYZ = B.MeshBuilder.CreateTorus(
      'orb_ring_yz',
      { diameter: 2.06, thickness: 0.038, tessellation: 36 },
      s
    );
    ringYZ.rotation.z = Math.PI * 0.5;
    ringYZ.material = this.meridianPlatinumMat;
    ringYZ.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    ringYZ.parent = this.orbMeridianRoot;

    // Asymmetric octahedron jewel on the north pole so SO(3) drag spin is unmistakable
    const jewel = B.MeshBuilder.CreatePolyhedron('orb_so3_jewel', { type: 1, size: 0.12 }, s);
    jewel.position.set(0, 1.04, 0);
    jewel.material = this.meridianPlatinumMat;
    jewel.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    jewel.parent = this.orbMeridianRoot;

    // Stationary Vertical YZ Rotation-Plane Halo (rotation.z = PI/2 -> strictly lies in X=0 plane!)
    this.yzHaloMat = createGhostMaterial(s, 'yz_rotation_plane_halo', PALETTE.accent.cyanW0, 0.34);
    this.yzPlaneHalo = B.MeshBuilder.CreateTorus(
      'yz_plane_halo',
      { diameter: 2.58, thickness: 0.026, tessellation: 40 },
      s
    );
    this.yzPlaneHalo.rotation.z = Math.PI * 0.5;
    this.yzPlaneHalo.material = this.yzHaloMat;
    this.yzPlaneHalo.isPickable = false;
    this.yzPlaneHalo.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    this.yzPlaneHalo.parent = this.orbRoot;
  }

  _buildAstronaut08() {
    const B = this.B;
    const s = this.scene;

    this.astronaut = new B.TransformNode('astronaut_08', s);
    this.astronaut.parent = this.root;

    const suitMat = createSolidMaterial(s, 'suit_white_mat', {
      diffuseHex: PALETTE.zoneC.sanctuaryWhite,
      emissiveHex: '#D8D4CC',
      emissiveScale: 0.16,
    });
    const visorMat = createSolidMaterial(s, 'suit_visor_mat', {
      diffuseHex: PALETTE.accent.cyanW0,
      emissiveHex: PALETTE.accent.cyanW0,
      emissiveScale: 0.85,
    });
    const trimMat = createSolidMaterial(s, 'suit_trim_mat', {
      diffuseHex: '#333842',
    });

    const torso = B.MeshBuilder.CreateCylinder(
      'astro_torso',
      { diameterTop: 0.44, diameterBottom: 0.36, height: 0.72, tessellation: 14 },
      s
    );
    torso.position.y = 1.08;
    torso.material = suitMat;
    torso.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    torso.parent = this.astronaut;

    const pack = B.MeshBuilder.CreateBox('astro_pack', { width: 0.34, height: 0.46, depth: 0.18 }, s);
    pack.position.set(0, 1.12, -0.24);
    pack.material = trimMat;
    pack.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    pack.parent = this.astronaut;

    const helmet = B.MeshBuilder.CreateSphere('astro_helmet', { diameter: 0.36, segments: 14 }, s);
    helmet.position.y = 1.62;
    helmet.material = suitMat;
    helmet.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    helmet.parent = this.astronaut;

    const visor = B.MeshBuilder.CreateSphere('astro_visor', { diameter: 0.28, segments: 12 }, s);
    visor.position.set(0, 1.62, 0.08);
    visor.scaling.set(1.0, 0.72, 0.7);
    visor.material = visorMat;
    visor.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    visor.parent = this.astronaut;

    for (const side of [-1, 1]) {
      const leg = B.MeshBuilder.CreateCylinder(
        `astro_leg_${side}`,
        { diameter: 0.15, height: 0.74, tessellation: 10 },
        s
      );
      leg.position.set(side * 0.12, 0.37, 0);
      leg.material = trimMat;
      leg.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
      leg.parent = this.astronaut;
    }

    this.astronaut.setEnabled(false);
  }

  _buildSanctuaryMotes() {
    const B = this.B;
    const s = this.scene;

    this.motes = [];
    const moteMat = createSolidMaterial(s, 'sanctuary_mote_mat', {
      diffuseHex: PALETTE.accent.goldWPos,
      emissiveHex: PALETTE.accent.platinum,
      emissiveScale: 0.9,
    });

    for (let i = 0; i < 12; i += 1) {
      const mote = B.MeshBuilder.CreateSphere(`mote_${i}`, { diameter: 0.05, segments: 4 }, s);
      const baseX = Math.sin(i * 19.3) * 4.5;
      const baseY = 1.1 + ((i * 0.85) % 5.5);
      const baseZ = -6.2 + ((i * 1.37) % 11.5);
      mote.position.set(baseX, baseY, baseZ);
      mote.material = moteMat;
      mote.isPickable = false;
      mote.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
      mote.parent = this.root;
      this.motes.push({ mesh: mote, baseX, baseY, baseZ, phase: i * 0.9 });
    }
  }

  triggerBarrierFlash() {
    this.barrierFlash = 1.0;
  }

  setHintHighlight(active) {
    this.hintHighlight = Boolean(active);
  }

  syncFromState(state, dtSec) {
    const B = this.B;
    this.elapsed += dtSec;
    this.barrierFlash = Math.max(0, this.barrierFlash - dtSec * 2.4);

    const ext = state.getExtents();
    const slice = state.grabbed ? state.getSliceAtW0() : state.getSliceAtPlayerW();
    const isBlade = state.isBladeThinEnough();

    // 1. Flanking W-layer reference arches (solid when player W matches, ghost otherwise)
    const playerW = state.playerPos[3];
    for (const grp of this.wLayerGroups) {
      applyPhaseToMaterial(grp.mat, playerW - grp.w, { solidThreshold: 0.55, ghostAlpha: 0.34 });
    }

    // 2. Passing Orb exact 4D geometry & SO(3) rings
    const hoverOffset = state.completed ? 0 : Math.sin(this.elapsed * 2.1) * 0.04;
    this.orbRoot.position.set(0, LEVEL14_CONFIG.orbCenterY + hoverOffset, state.orbZ);
    this.orbLight.position.set(0, LEVEL14_CONFIG.orbCenterY + 0.2, state.orbZ);

    if (slice.intersects) {
      this.orbSliceCore.setEnabled(true);
      this.orbSliceCore.position.set(slice.xCenter, 0, 0);
      const sx = Math.max(0.006, slice.semiX);
      const sy = Math.max(0.05, slice.semiY);
      const sz = Math.max(0.05, slice.semiZ);
      this.orbSliceCore.scaling.set(sx, sy, sz);
      // Scale SO(3) meridian rings to match the TRUE W=0 slice (collapses immediately into a 2D disc on slight tilt!)
      this.orbMeridianRoot.setEnabled(true);
      this.orbMeridianRoot.position.set(slice.xCenter, 0, 0);
      this.orbMeridianRoot.scaling.set(sx, sy, sz);
    } else {
      this.orbSliceCore.setEnabled(false);
      this.orbMeridianRoot.setEnabled(false);
    }

    // Option A (Strict Geometric Honesty):
    // Default main view shows ONLY the pure W=0 3D slice (no ellipsoid projection shell).
    // Pressing Tab (side_xzw) reveals the translucent 4D projection envelope scaled to xMax(theta)
    // so the player can see why the tilted ball still collides with the All-W monolith until 90°!
    const show4DProjection = state.viewMode === 'side_xzw';
    this.orbProjShell.setEnabled(show4DProjection);
    if (show4DProjection) {
      this.orbProjRoot.scaling.set(Math.max(0.012, ext.xMax), 1.0, 1.0);
    } else {
      this.orbProjRoot.scaling.set(1.0, 1.0, 1.0);
    }

    const [qx, qy, qz, qw] = state.orbQuat3D;
    if (!this.orbMeridianRoot.rotationQuaternion) {
      this.orbMeridianRoot.rotationQuaternion = new B.Quaternion(qx, qy, qz, qw);
    } else {
      this.orbMeridianRoot.rotationQuaternion.set(qx, qy, qz, qw);
    }

    let accentHex = PALETTE.accent.cyanW0;
    if (state.completed) {
      accentHex = PALETTE.accent.platinum;
    } else if (isBlade) {
      accentHex = PALETTE.accent.emerald;
    }
    const accentColor = B.Color3.FromHexString(accentHex);
    this.orbCoreMat.diffuseColor = accentColor;
    this.orbCoreMat.emissiveColor = accentColor.scale(state.completed ? 0.78 : 0.45);
    this.orbLight.diffuse = accentColor;

    this.yzPlaneHalo.setEnabled(state.grabbed && !state.completed);
    if (state.grabbed) {
      const pulse = 0.30 + Math.sin(this.elapsed * 3.2) * 0.04;
      this.yzHaloMat.alpha = Math.min(0.35, Math.max(0.30, pulse));
    }

    // 3. Third-person Astronaut 08 placement
    this.astronaut.setEnabled(state.grabbed);
    if (state.grabbed) {
      const astroZ = Math.min(LEVEL14_CONFIG.wallZMin - 0.85, state.orbZ - 1.75);
      this.astronaut.position.set(-0.92, 0, astroZ);
      this.astronaut.rotation.y = 0.38;
    }

    // 4. Amber-coral collision feedback barrier pulse
    if (this.barrierFlash > 0.02) {
      this.barrierPlane.setEnabled(true);
      this.barrierPlane.position.z =
        state.isOrbOverlappingWallZ() ? state.orbZ : LEVEL14_CONFIG.wallZMin - 0.06;
      this.barrierMat.alpha = Math.min(0.45, this.barrierFlash * 0.42);
      this.slitLipMat.emissiveColor = B.Color3.Lerp(
        B.Color3.FromHexString(PALETTE.accent.platinum),
        B.Color3.FromHexString(PALETTE.accent.amberCoral),
        this.barrierFlash
      );
    } else {
      this.barrierPlane.setEnabled(false);
      const slitColor = isBlade
        ? B.Color3.FromHexString(PALETTE.accent.emerald)
        : B.Color3.FromHexString(PALETTE.accent.platinum);
      this.slitLipMat.emissiveColor = slitColor.scale(0.95);
    }

    // 5. North target ghost silhouette
    this.northTargetGhost.setEnabled(!state.completed);
    if (!state.completed) {
      const hintPulse = this.hintHighlight ? 0.04 * Math.sin(this.elapsed * 5.0) : 0;
      this.northTargetGhostMat.alpha = Math.min(0.35, Math.max(0.30, 0.31 + hintPulse));
    }

    // 6. Victory radiant beam & Sanctuary Inner Gate opening
    if (state.completed) {
      this.victoryBeam.isVisible = true;
      this.gateOpenProgress = Math.min(1, this.gateOpenProgress + dtSec * 0.75);
      const eased = 1 - Math.pow(1 - this.gateOpenProgress, 3);
      this.gateLeft.position.x = -1.12 - eased * 1.95;
      this.gateRight.position.x = 1.12 + eased * 1.95;
      this.gateEmblem.scaling.setAll(1 + eased * 0.25);
      this.gateEmblem.isVisible = this.gateOpenProgress < 0.7;
      this.northRingMat.emissiveColor = B.Color3.FromHexString(PALETTE.accent.platinum);
      this.orbLight.intensity = 2.4;
    } else {
      this.victoryBeam.isVisible = false;
      this.gateOpenProgress = 0;
      this.gateLeft.position.x = -1.12;
      this.gateRight.position.x = 1.12;
      this.gateEmblem.scaling.setAll(1);
      this.gateEmblem.isVisible = true;
      this.northRingMat.emissiveColor = B.Color3.FromHexString(PALETTE.accent.goldWPos).scale(0.92);
      this.orbLight.intensity = 1.35;
    }

    // 7. Gentle sanctuary mote drift
    for (const m of this.motes) {
      m.mesh.position.y = m.baseY + Math.sin(this.elapsed * 0.6 + m.phase) * 0.22;
      m.mesh.position.x = m.baseX + Math.cos(this.elapsed * 0.4 + m.phase) * 0.14;
    }
  }
}
