/**
 * Beyond 3D — Chapter 2 Sanctuary (Act III) AAA 3D Landmark Builder
 * Phase 1 Vertical Slice: Level 14 "发丝裂缝" (Hairline Slit)
 *
 * AAA Visual Architecture (strictly honoring 04-visual-and-art-direction.md C-Zone palette):
 * - Procedural 6-face Cathedral IBL CubeTexture + PBRMaterial (Sobel normal maps, ORM metallic/roughness, clearcoat)
 * - Real-time MirrorTexture polished black-obsidian cathedral floor reflecting monoliths, slit & orb
 * - Real-time PCF soft shadows from clerestory key light
 * - Babylon DefaultRenderingPipeline (ACES Filmic, Calibrated Bloom, MSAA/FXAA, Sharpen, Subtle Grain)
 * - Monumental canted obsidian rib-arches, colossal kinetic bronze vault astrolabe, volumetric sun shafts,
 *   precision-machined platinum hairline slit jaws, stepped alabaster marble pedestals & GPU-style luminous motes
 * - Strictly preserves Option A (eps=0.001m pure W=0 slice default, Tab reveals XZW + 4D envelope)
 *   and Ghost Material Invariants (alpha 0.30..0.35, disableDepthWrite=true, needDepthPrePass=false)
 */

import { LEVEL14_CONFIG } from '../core/sanctuary-4d.js';
import {
  createAntiqueBronzePBR,
  createCarvedObsidianMonolithPBR,
  createPassingOrbCrystalPBR,
  createSanctuaryEnvironmentTexture,
  createSanctuaryMarblePBR,
  createSanctuaryMirrorFloorPBR,
  createSoftGlowParticleTexture,
  createVolumetricShaftMaterial,
  setupAAAPostProcessing,
} from '../engine/aaa-materials.js';
import {
  PALETTE,
  RENDER_GROUPS,
  applyPhaseToMaterial,
  configureRenderingGroups,
  createGhostMaterial,
  createSolidMaterial,
} from '../engine/phase-materials.js';

export class Level14SanctuaryScene {
  constructor(scene, camera) {
    this.scene = scene;
    this.camera = camera;
    this.B = globalThis.BABYLON;
    this.root = new this.B.TransformNode('level14_root', scene);
    this.mirrorRenderList = [];
    this.shadowCasters = [];
    this.vaultAstrolabeRings = [];
    this.elapsed = 0;
    this.barrierFlash = 0;
    this.hintHighlight = false;
    this.gateOpenProgress = 0;
    this.monolithOpenProgress = 0;

    configureRenderingGroups(scene);
    this._setupAtmosphereAndLighting();
    this._initSharedPBRMaterials();
    this._buildSanctuaryArchitecture();
    this._buildKineticVaultAstrolabe();
    this._buildLayerReferenceArches();
    this._buildHairlineMonoliths();
    this._buildPedestalsAndGate();
    this._buildTeleportationPad();
    this._buildPassingOrb();
    this._buildAstronaut08();
    this._buildVolumetricLightShafts();
    this._buildSanctuaryParticles();
    this._finalizeMirrorAndShadows();
  }

  _setupAtmosphereAndLighting() {
    const B = this.B;
    const s = this.scene;

    s.clearColor = B.Color4.FromHexString('#0D0A07FF');
    s.fogMode = B.Scene.FOGMODE_EXP2;
    s.fogColor = B.Color3.FromHexString('#110E0A');
    s.fogDensity = 0.014;

    // 1. Procedural Cathedral IBL Environment Map (instant metallic/clearcoat speculars!)
    createSanctuaryEnvironmentTexture(s);

    // 2. AAA DefaultRenderingPipeline (ACES + Bloom + MSAA/FXAA + Sharpen + Subtle Grain)
    if (this.camera) {
      this.pipeline = setupAAAPostProcessing(s, this.camera);
    }

    // 3. Sculpted 3-Light Cathedral Rig
    const hemi = new B.HemisphericLight('sanctuary_hemi', new B.Vector3(0, 1, -0.2), s);
    hemi.intensity = 0.42;
    hemi.diffuse = B.Color3.FromHexString('#F0E5CF');
    hemi.groundColor = B.Color3.FromHexString('#16110B');

    // Key Clerestory Sunlight (casts soft PCF shadows!)
    this.keyLight = new B.DirectionalLight('sanctuary_key_dir', new B.Vector3(-0.28, -0.92, 0.26), s);
    this.keyLight.position = new B.Vector3(4.5, 13.5, -4.5);
    this.keyLight.intensity = 1.65;
    this.keyLight.diffuse = B.Color3.FromHexString('#FFE8BA');
    this.keyLight.specular = B.Color3.FromHexString('#FFD98A');

    // Dynamic Passing Orb Reactive Energy Light
    this.orbLight = new B.PointLight(
      'orb_point_light',
      new B.Vector3(0, LEVEL14_CONFIG.orbCenterY, LEVEL14_CONFIG.orbStartZ),
      s
    );
    this.orbLight.diffuse = B.Color3.FromHexString(PALETTE.accent.cyanW0);
    this.orbLight.intensity = 1.9;
    this.orbLight.range = 12.0;
  }

  _initSharedPBRMaterials() {
    const s = this.scene;
    const B = this.B;

    this.obsidianPBR = createCarvedObsidianMonolithPBR(s, 'aaa_obsidian_wall_pbr', 2, 2);
    this.pillarObsidianPBR = createCarvedObsidianMonolithPBR(s, 'aaa_obsidian_pillar_pbr', 1, 3);
    this.bronzePBR = createAntiqueBronzePBR(s, 'aaa_antique_bronze_pbr', 0.14);
    this.darkBronzePBR = createAntiqueBronzePBR(s, 'aaa_dark_bronze_pbr', 0.06);
    this.darkBronzePBR.albedoColor = B.Color3.FromHexString('#7A5C28');
    this.darkBronzePBR.roughness = 0.34;
    this.marblePBR = createSanctuaryMarblePBR(s, 'aaa_sanctuary_marble_pbr');

    this.emissivePlatinumMat = new B.PBRMaterial('aaa_platinum_emitter', s);
    this.emissivePlatinumMat.albedoColor = B.Color3.FromHexString(PALETTE.accent.platinum);
    this.emissivePlatinumMat.emissiveColor = B.Color3.FromHexString(PALETTE.accent.platinum).scale(1.65);
    this.emissivePlatinumMat.metallic = 0.1;
    this.emissivePlatinumMat.roughness = 0.2;
    this.emissivePlatinumMat.disableDepthWrite = false;
    this.emissivePlatinumMat.needDepthPrePass = false;

    this.emissiveGoldTrimMat = new B.PBRMaterial('aaa_gold_trim_emitter', s);
    this.emissiveGoldTrimMat.albedoColor = B.Color3.FromHexString(PALETTE.accent.goldWPos);
    this.emissiveGoldTrimMat.emissiveColor = B.Color3.FromHexString(PALETTE.accent.goldWPos).scale(1.25);
    this.emissiveGoldTrimMat.metallic = 0.85;
    this.emissiveGoldTrimMat.roughness = 0.18;
    this.emissiveGoldTrimMat.disableDepthWrite = false;
    this.emissiveGoldTrimMat.needDepthPrePass = false;
  }

  _registerMesh(mesh, { freeze = true, mirror = false, shadow = false, receiveShadow = false } = {}) {
    mesh.isPickable = false;
    if (receiveShadow) mesh.receiveShadows = true;
    if (mirror) this.mirrorRenderList.push(mesh);
    if (shadow) this.shadowCasters.push(mesh);
    if (freeze) mesh.freezeWorldMatrix();
    return mesh;
  }

  _buildSanctuaryArchitecture() {
    const B = this.B;
    const s = this.scene;

    // 1. Glossy Reflective Obsidian Floor (MirrorTexture wired in _finalizeMirrorAndShadows)
    const { mat: floorMat, mirrorTex } = createSanctuaryMirrorFloorPBR(s, this.mirrorRenderList);
    this.floorMirrorTex = mirrorTex;

    const floor = B.MeshBuilder.CreateGround('sanctuary_floor', { width: 20, height: 26 }, s);
    floor.position.set(0, 0, -0.6);
    floor.material = floorMat;
    floor.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    floor.parent = this.root;
    this._registerMesh(floor, { freeze: true, receiveShadow: true });

    // Central raised brushed-bronze & dark basalt ceremonial runway leading through slit to the North Teleportation Pad
    const runway = B.MeshBuilder.CreateBox('orb_runway', { width: 0.76, height: 0.036, depth: 14.2 }, s);
    runway.position.set(0, 0.018, 0.7);
    runway.material = this.darkBronzePBR;
    runway.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    runway.parent = this.root;
    this._registerMesh(runway, { freeze: true, receiveShadow: true });

    // Exact 0.164m luminous platinum floor rails (precision alignment datum along X = ±0.082m)
    for (const sign of [-1, 1]) {
      const rail = B.MeshBuilder.CreateBox(
        `slit_floor_rail_${sign}`,
        { width: 0.016, height: 0.044, depth: 9.8 },
        s
      );
      rail.position.set(sign * LEVEL14_CONFIG.slitHalfWidth, 0.022, 0);
      rail.material = this.emissivePlatinumMat;
      rail.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      rail.parent = this.root;
      this._registerMesh(rail, { freeze: true, mirror: true });
    }

    // 2. Monumental Canted Brutalist Obsidian Rib-Arches & Stepped Colonnade (5 bays soaring 10.6m!)
    const bayZs = [-8.6, -5.2, -2.1, 4.4, 7.6];
    bayZs.forEach((bz, idx) => {
      for (const side of [-1, 1]) {
        // Heavy stepped obsidian plinth base
        const plinth = B.MeshBuilder.CreateBox(
          `col_plinth_${idx}_${side}`,
          { width: 1.5, height: 1.0, depth: 1.45 },
          s
        );
        plinth.position.set(side * 6.9, 0.5, bz);
        plinth.material = this.darkBronzePBR;
        plinth.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
        plinth.parent = this.root;
        this._registerMesh(plinth, { freeze: true, mirror: true, shadow: true, receiveShadow: true });

        // Towering carved obsidian pier
        const pier = B.MeshBuilder.CreateBox(
          `col_pier_${idx}_${side}`,
          { width: 1.15, height: 9.6, depth: 1.1 },
          s
        );
        pier.position.set(side * 6.9, 5.2, bz);
        pier.material = this.pillarObsidianPBR;
        pier.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
        pier.parent = this.root;
        this._registerMesh(pier, { freeze: true, mirror: true, shadow: true });

        // Recessed metallic antique-bronze vertical flute inlay
        const inlay = B.MeshBuilder.CreateBox(
          `col_inlay_${idx}_${side}`,
          { width: 0.09, height: 8.8, depth: 0.16 },
          s
        );
        inlay.position.set(side * 6.3, 5.1, bz);
        inlay.material = this.bronzePBR;
        inlay.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
        inlay.parent = this.root;
        this._registerMesh(inlay, { freeze: true, mirror: true });

        // Angled brutalist cathedral corbel rib arching inward toward the high vault
        const rib = B.MeshBuilder.CreateBox(
          `vault_rib_${idx}_${side}`,
          { width: 4.4, height: 0.52, depth: 0.72 },
          s
        );
        rib.position.set(side * 4.5, 9.65, bz);
        rib.rotation.z = side * -0.32;
        rib.material = this.pillarObsidianPBR;
        rib.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
        rib.parent = this.root;
        this._registerMesh(rib, { freeze: true, mirror: true });

        // Illuminated golden soffit trim under each cathedral arch rib
        const soffit = B.MeshBuilder.CreateBox(
          `vault_soffit_${idx}_${side}`,
          { width: 4.1, height: 0.08, depth: 0.14 },
          s
        );
        soffit.position.set(side * 4.42, 9.35, bz);
        soffit.rotation.z = side * -0.32;
        soffit.material = this.emissiveGoldTrimMat;
        soffit.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
        soffit.parent = this.root;
        this._registerMesh(soffit, { freeze: true, mirror: true });
      }

      // High transverse vault lintel framing the pure-white clerestory skylight
      const lintel = B.MeshBuilder.CreateBox(
        `vault_lintel_${idx}`,
        { width: 5.4, height: 0.55, depth: 0.78 },
        s
      );
      lintel.position.set(0, 10.45, bz);
      lintel.material = this.darkBronzePBR;
      lintel.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      lintel.parent = this.root;
      this._registerMesh(lintel, { freeze: true });
    });

    // Outer vaulted obsidian sanctuary walls & coffered high ceiling slabs
    for (const side of [-1, 1]) {
      const wall = B.MeshBuilder.CreateBox(
        `sanctuary_outer_wall_${side}`,
        { width: 0.8, height: 11.0, depth: 26 },
        s
      );
      wall.position.set(side * 7.9, 5.5, -0.6);
      wall.material = this.obsidianPBR;
      wall.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      wall.parent = this.root;
      this._registerMesh(wall, { freeze: true });

      const ceilingWing = B.MeshBuilder.CreateBox(
        `sanctuary_ceiling_${side}`,
        { width: 6.2, height: 0.45, depth: 26 },
        s
      );
      ceilingWing.position.set(side * 4.7, 10.8, -0.6);
      ceilingWing.material = this.obsidianPBR;
      ceilingWing.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      ceilingWing.parent = this.root;
      this._registerMesh(ceilingWing, { freeze: true });
    }

    // South rear monumental wall
    const southWall = B.MeshBuilder.CreateBox('sanctuary_south_wall', { width: 17, height: 11.2, depth: 0.8 }, s);
    southWall.position.set(0, 5.6, -11.6);
    southWall.material = this.obsidianPBR;
    southWall.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    southWall.parent = this.root;
    this._registerMesh(southWall, { freeze: true });

    // Pure-White Clerestory Skylight Strip pouring luminous sanctuary light down the central nave
    const skylight = B.MeshBuilder.CreateBox('clerestory_skylight', { width: 2.3, height: 0.14, depth: 21 }, s);
    skylight.position.set(0, 10.9, -0.6);
    skylight.material = this.emissivePlatinumMat;
    skylight.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    skylight.parent = this.root;
    this._registerMesh(skylight, { freeze: true, mirror: true });
  }

  /**
   * Colossal slow-counter-rotating Antique Bronze Kinetic Astrolabe suspended high in the vault
   * above the South Nave — delivers awe-inspiring cosmic scale without cluttering eye-level puzzles.
   */
  _buildKineticVaultAstrolabe() {
    const B = this.B;
    const s = this.scene;

    const specs = [
      { diam: 5.8, thick: 0.09, y: 7.9, z: -3.2, tiltX: 0.25, speedY: 0.14, speedZ: 0.05 },
      { diam: 4.5, thick: 0.075, y: 7.9, z: -3.2, tiltX: -0.42, speedY: -0.2, speedZ: 0.08 },
      { diam: 3.3, thick: 0.06, y: 7.9, z: -3.2, tiltX: 0.68, speedY: 0.28, speedZ: -0.1 },
    ];

    specs.forEach((sp, i) => {
      const ring = B.MeshBuilder.CreateTorus(
        `vault_astrolabe_${i}`,
        { diameter: sp.diam, thickness: sp.thick, tessellation: 48 },
        s
      );
      ring.position.set(0, sp.y, sp.z);
      ring.rotation.x = sp.tiltX;
      ring.material = i === 1 ? this.emissiveGoldTrimMat : this.bronzePBR;
      ring.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      ring.parent = this.root;
      this._registerMesh(ring, { freeze: false, mirror: true });
      this.vaultAstrolabeRings.push({ mesh: ring, speedY: sp.speedY, speedZ: sp.speedZ });
    });
  }

  /**
   * Flanking W-layer architectural reference rings (W = +1.8 Gold on East, W = -1.8 Blue on West).
   * Strictly obeys Ghost Material Invariants when off-slice!
   */
  _buildLayerReferenceArches() {
    const B = this.B;
    const s = this.scene;

    this.wLayerGroups = [];
    const defs = [
      { w: 1.8, hex: PALETTE.accent.goldWPos, xOffset: 4.45, zPositions: [-5.1, -2.5] },
      { w: -1.8, hex: PALETTE.accent.blueWNeg, xOffset: -4.45, zPositions: [-5.1, -2.5] },
    ];

    defs.forEach((def, idx) => {
      const mat = createGhostMaterial(s, `w_ref_arch_mat_${idx}`, def.hex, 0.34);
      const meshes = [];
      def.zPositions.forEach((zPos, j) => {
        const ring = B.MeshBuilder.CreateTorus(
          `w_ref_ring_${idx}_${j}`,
          { diameter: 2.35, thickness: 0.075, tessellation: 32 },
          s
        );
        ring.position.set(def.xOffset, 3.05, zPos);
        ring.rotation.z = Math.PI * 0.5;
        ring.material = mat;
        ring.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
        ring.parent = this.root;
        this._registerMesh(ring, { freeze: true, mirror: true });
        meshes.push(ring);

        const stela = B.MeshBuilder.CreateBox(
          `w_ref_stela_${idx}_${j}`,
          { width: 0.16, height: 3.7, depth: 0.45 },
          s
        );
        stela.position.set(def.xOffset + (def.xOffset > 0 ? 0.62 : -0.62), 1.85, zPos);
        stela.material = mat;
        stela.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
        stela.parent = this.root;
        this._registerMesh(stela, { freeze: true, mirror: true });
        meshes.push(stela);
      });
      this.wLayerGroups.push({ w: def.w, mat, meshes });
    });
  }

  /**
   * Hero Landmark: 「一线天石碑」 — Monumental Multi-Tiered 6.8m Obsidian-Gold Twin Monoliths
   * with precision machined 0.164m platinum hairline slit jaws & Vernier calibration marks.
   * Solid across ALL W slices!
   */
  _buildHairlineMonoliths() {
    const B = this.B;
    const s = this.scene;

    const wallH = LEVEL14_CONFIG.wallHeight; // 6.8 m
    const wallDepth = LEVEL14_CONFIG.wallZMax - LEVEL14_CONFIG.wallZMin; // 2.4 m
    const halfGap = LEVEL14_CONFIG.slitHalfWidth; // 0.082 m
    const wallWidth = 7.4;

    this.slitLipMat = new B.PBRMaterial('aaa_slit_platinum_lip', s);
    this.slitLipMat.albedoColor = B.Color3.FromHexString(PALETTE.accent.platinum);
    this.slitLipMat.emissiveColor = B.Color3.FromHexString(PALETTE.accent.platinum).scale(1.85);
    this.slitLipMat.metallic = 0.25;
    this.slitLipMat.roughness = 0.15;
    this.slitLipMat.disableDepthWrite = false;
    this.slitLipMat.needDepthPrePass = false;

    this.monolithLeftGroup = new B.TransformNode('monolith_left_group', s);
    this.monolithLeftGroup.parent = this.root;
    this.monolithRightGroup = new B.TransformNode('monolith_right_group', s);
    this.monolithRightGroup.parent = this.root;

    for (const side of [-1, 1]) {
      const centerX = side * (halfGap + wallWidth * 0.5);
      const group = side < 0 ? this.monolithLeftGroup : this.monolithRightGroup;

      // 1. Primary 6.8m Carved Normal-Mapped Obsidian Monolith Slab
      const slab = B.MeshBuilder.CreateBox(
        `hairline_monolith_${side}`,
        { width: wallWidth, height: wallH, depth: wallDepth },
        s
      );
      slab.position.set(centerX, wallH * 0.5, 0);
      slab.material = this.obsidianPBR;
      slab.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      slab.parent = group;
      this._registerMesh(slab, { freeze: false, mirror: true, shadow: true, receiveShadow: true });

      // 2. Stepped Monumental Buttress Pier flanking the outer face for deep brutalist shadow relief
      const buttress = B.MeshBuilder.CreateBox(
        `monolith_buttress_${side}`,
        { width: 1.8, height: wallH - 0.3, depth: wallDepth + 0.52 },
        s
      );
      buttress.position.set(side * 3.15, (wallH - 0.3) * 0.5, 0);
      buttress.material = this.pillarObsidianPBR;
      buttress.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      buttress.parent = group;
      this._registerMesh(buttress, { freeze: false, mirror: true, shadow: true, receiveShadow: true });

      // Stepped Bronze Plinth Skirt along base of monolith
      const baseSkirt = B.MeshBuilder.CreateBox(
        `monolith_skirt_${side}`,
        { width: wallWidth - 0.1, height: 0.26, depth: wallDepth + 0.22 },
        s
      );
      baseSkirt.position.set(centerX + side * 0.05, 0.13, 0);
      baseSkirt.material = this.darkBronzePBR;
      baseSkirt.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      baseSkirt.parent = group;
      this._registerMesh(baseSkirt, { freeze: false, mirror: true, receiveShadow: true });

      // Cantilevered Antique-Bronze Architectural Crown Cornice
      const crown = B.MeshBuilder.CreateBox(
        `monolith_crown_${side}`,
        { width: wallWidth + 0.14, height: 0.38, depth: wallDepth + 0.36 },
        s
      );
      crown.position.set(centerX, wallH + 0.19, 0);
      crown.material = this.bronzePBR;
      crown.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      crown.parent = group;
      this._registerMesh(crown, { freeze: false, mirror: true });

      // Horizontal machined bronze frieze moldings on South & North monolith faces
      [1.4, 3.45, 5.5].forEach((bandY, bIdx) => {
        for (const zFace of [-1, 1]) {
          const band = B.MeshBuilder.CreateBox(
            `monolith_band_${side}_${bIdx}_${zFace}`,
            { width: wallWidth - 0.32, height: 0.11, depth: 0.08 },
            s
          );
          band.position.set(centerX, bandY, zFace * (wallDepth * 0.5 + 0.03));
          band.material = this.bronzePBR;
          band.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
          band.parent = group;
          this._registerMesh(band, { freeze: false, mirror: true });
        }
      });

      // 3. Precision Machined Aperture Jaw Pylons framing the 0.164m Hairline Slit!
      for (const zFace of [-1, 1]) {
        const jaw = B.MeshBuilder.CreateBox(
          `monolith_aperture_jaw_${side}_${zFace}`,
          { width: 0.22, height: wallH, depth: 0.16 },
          s
        );
        jaw.position.set(side * (halfGap + 0.24), wallH * 0.5, zFace * (wallDepth * 0.5 + 0.06));
        jaw.material = this.bronzePBR;
        jaw.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
        jaw.parent = group;
        this._registerMesh(jaw, { freeze: false, mirror: true, shadow: true });

        // Cosmic Vernier Calibration Hash Marks along the slit jaw (emphasizes 0.164m precision!)
        for (let ty = 0.75; ty <= 6.25; ty += 0.55) {
          const tick = B.MeshBuilder.CreateBox(
            `slit_vernier_${side}_${zFace}_${ty}`,
            { width: 0.14, height: 0.022, depth: 0.04 },
            s
          );
          tick.position.set(side * (halfGap + 0.16), ty, zFace * (wallDepth * 0.5 + 0.14));
          tick.material = this.emissiveGoldTrimMat;
          tick.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
          tick.parent = group;
          this._registerMesh(tick, { freeze: false });
        }

        // Dazzling Platinum Vertical Slit Lip Emitter strictly at X = ±0.082m
        const lip = B.MeshBuilder.CreateBox(
          `slit_platinum_lip_${side}_${zFace}`,
          { width: 0.032, height: wallH, depth: 0.06 },
          s
        );
        lip.position.set(side * (halfGap + 0.016), wallH * 0.5, zFace * (wallDepth * 0.5 + 0.03));
        lip.material = this.slitLipMat;
        lip.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
        lip.parent = group;
        this._registerMesh(lip, { freeze: false, mirror: true });
      }

      // Luminous inner wall channel lining the entire 2.4m deep hairline corridor
      const innerStrip = B.MeshBuilder.CreateBox(
        `slit_inner_strip_${side}`,
        { width: 0.01, height: wallH - 0.1, depth: wallDepth - 0.02 },
        s
      );
      innerStrip.position.set(side * (halfGap + 0.005), wallH * 0.5, 0);
      innerStrip.material = this.slitLipMat;
      innerStrip.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      innerStrip.parent = group;
      this._registerMesh(innerStrip, { freeze: false, mirror: true });
    }

    // Heavy overhead sanctuary lintel sealing above Y = 6.8m
    const topSeal = B.MeshBuilder.CreateBox(
      'monolith_top_seal',
      { width: 15.6, height: 3.6, depth: wallDepth + 0.1 },
      s
    );
    topSeal.position.set(0, wallH + 2.18, 0);
    topSeal.material = this.obsidianPBR;
    topSeal.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    topSeal.parent = this.root;
    this._registerMesh(topSeal, { freeze: true, mirror: true });

    // Amber-coral collision feedback barrier plane at the slit entrance
    this.barrierMat = createGhostMaterial(s, 'slit_barrier_flash_mat', PALETTE.accent.amberCoral, 0.34);
    this.barrierMat.alpha = 0.0;
    this.barrierPlane = B.MeshBuilder.CreatePlane('slit_barrier_plane', { width: 2.5, height: 3.6 }, s);
    this.barrierPlane.position.set(0, LEVEL14_CONFIG.orbCenterY, LEVEL14_CONFIG.wallZMin - 0.06);
    this.barrierPlane.material = this.barrierMat;
    this.barrierPlane.isPickable = false;
    this.barrierPlane.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    this.barrierPlane.parent = this.root;
  }

  _buildSteppedPedestal(prefix, zPos, ringMat) {
    const B = this.B;
    const s = this.scene;

    // Tier 1: Outer bronze base plinth
    const tier1 = B.MeshBuilder.CreateCylinder(
      `${prefix}_tier1`,
      { diameterTop: 2.95, diameterBottom: 3.25, height: 0.16, tessellation: 40 },
      s
    );
    tier1.position.set(0, 0.08, zPos);
    tier1.material = this.darkBronzePBR;
    tier1.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    tier1.parent = this.root;
    this._registerMesh(tier1, { freeze: true, mirror: true, shadow: true, receiveShadow: true });

    // Tier 2: Honed Sanctuary Alabaster Marble step
    const tier2 = B.MeshBuilder.CreateCylinder(
      `${prefix}_tier2`,
      { diameterTop: 2.35, diameterBottom: 2.65, height: 0.2, tessellation: 40 },
      s
    );
    tier2.position.set(0, 0.26, zPos);
    tier2.material = this.marblePBR;
    tier2.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    tier2.parent = this.root;
    this._registerMesh(tier2, { freeze: true, mirror: true, shadow: true, receiveShadow: true });

    // Tier 3: Inner bronze energy focus collar
    const collar = B.MeshBuilder.CreateCylinder(
      `${prefix}_collar`,
      { diameterTop: 1.55, diameterBottom: 1.75, height: 0.08, tessellation: 32 },
      s
    );
    collar.position.set(0, 0.4, zPos);
    collar.material = this.bronzePBR;
    collar.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    collar.parent = this.root;
    this._registerMesh(collar, { freeze: true, mirror: true, receiveShadow: true });

    // Sleek Horizontal Luminous Calibration Ring (CreateTorus lies flat in XZ!)
    const ring = B.MeshBuilder.CreateTorus(
      `${prefix}_ring`,
      { diameter: 2.46, thickness: 0.06, tessellation: 48 },
      s
    );
    ring.position.set(0, 0.37, zPos);
    ring.material = ringMat;
    ring.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    ring.parent = this.root;
    this._registerMesh(ring, { freeze: true, mirror: true });

    // Four sleek architectural containment fins at 45° diagonals
    for (let k = 0; k < 4; k += 1) {
      const ang = (k * Math.PI) / 2 + Math.PI / 4;
      const fin = B.MeshBuilder.CreateBox(
        `${prefix}_fin_${k}`,
        { width: 0.1, height: 0.54, depth: 0.28 },
        s
      );
      fin.position.set(Math.cos(ang) * 1.48, 0.27, zPos + Math.sin(ang) * 1.48);
      fin.rotation.y = -ang + Math.PI / 2;
      fin.material = this.bronzePBR;
      fin.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
      fin.parent = this.root;
      this._registerMesh(fin, { freeze: true, mirror: true, shadow: true });
    }

    return ring;
  }

  _buildPedestalsAndGate() {
    const B = this.B;
    const s = this.scene;

    const cyanRingMat = new B.PBRMaterial('aaa_south_ring_mat', s);
    cyanRingMat.albedoColor = B.Color3.FromHexString(PALETTE.accent.cyanW0);
    cyanRingMat.emissiveColor = B.Color3.FromHexString(PALETTE.accent.cyanW0).scale(1.4);
    cyanRingMat.metallic = 0.2;
    cyanRingMat.roughness = 0.18;

    this.northRingMat = new B.PBRMaterial('aaa_north_ring_mat', s);
    this.northRingMat.albedoColor = B.Color3.FromHexString(PALETTE.accent.goldWPos);
    this.northRingMat.emissiveColor = B.Color3.FromHexString(PALETTE.accent.goldWPos).scale(1.45);
    this.northRingMat.metallic = 0.3;
    this.northRingMat.roughness = 0.18;

    this._buildSteppedPedestal('south_pedestal', LEVEL14_CONFIG.orbStartZ, cyanRingMat);
    this.northRing = this._buildSteppedPedestal('north_pedestal', LEVEL14_CONFIG.orbTargetZ, this.northRingMat);

    // North Target Ghost Sphere Silhouette (strict Ghost invariants: alpha=0.32, disableDepthWrite=true!)
    this.northTargetGhostMat = createGhostMaterial(s, 'north_target_ghost_mat', PALETTE.accent.goldWPos, 0.32);
    this.northTargetGhost = B.MeshBuilder.CreateSphere(
      'north_target_ghost_sphere',
      { diameter: LEVEL14_CONFIG.radiusR * 2, segments: 24 },
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
      { diameter: 2.2, height: 11.0, tessellation: 32 },
      s
    );
    this.victoryBeam.position.set(0, 5.5, LEVEL14_CONFIG.orbTargetZ);
    this.victoryBeam.material = this.victoryBeamMat;
    this.victoryBeam.isVisible = false;
    this.victoryBeam.isPickable = false;
    this.victoryBeam.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.victoryBeam.parent = this.root;

    // Sanctuary Monumental Inner Gate at Z = +7.8m
    const gateFrame = B.MeshBuilder.CreateBox('sanctuary_gate_frame', { width: 16, height: 11.2, depth: 0.9 }, s);
    gateFrame.position.set(0, 5.6, 8.4);
    gateFrame.material = this.obsidianPBR;
    gateFrame.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    gateFrame.parent = this.root;
    this._registerMesh(gateFrame, { freeze: true });

    this.gateLeft = B.MeshBuilder.CreateBox('gate_door_left', { width: 2.3, height: 6.2, depth: 0.45 }, s);
    this.gateLeft.position.set(-1.16, 3.1, 7.7);
    this.gateLeft.material = this.pillarObsidianPBR;
    this.gateLeft.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    this.gateLeft.parent = this.root;
    this._registerMesh(this.gateLeft, { freeze: false, mirror: true });

    this.gateRight = B.MeshBuilder.CreateBox('gate_door_right', { width: 2.3, height: 6.2, depth: 0.45 }, s);
    this.gateRight.position.set(1.16, 3.1, 7.7);
    this.gateRight.material = this.pillarObsidianPBR;
    this.gateRight.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    this.gateRight.parent = this.root;
    this._registerMesh(this.gateRight, { freeze: false, mirror: true });

    // Golden Sacred Gate Seal Ring (vertical facing South!)
    this.gateEmblem = B.MeshBuilder.CreateTorus(
      'gate_emblem_ring',
      { diameter: 2.4, thickness: 0.09, tessellation: 48 },
      s
    );
    this.gateEmblem.position.set(0, 3.1, 7.42);
    this.gateEmblem.rotation.x = Math.PI * 0.5;
    this.gateEmblem.material = this.emissiveGoldTrimMat;
    this.gateEmblem.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.gateEmblem.parent = this.root;
    this._registerMesh(this.gateEmblem, { freeze: false, mirror: true });

    const behindGlow = B.MeshBuilder.CreatePlane('behind_gate_radiance', { width: 4.6, height: 6.2 }, s);
    behindGlow.position.set(0, 3.1, 7.94);
    behindGlow.material = this.emissivePlatinumMat;
    behindGlow.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    behindGlow.parent = this.root;
    this._registerMesh(behindGlow, { freeze: true, mirror: true });
  }

  /**
   * AAA North Teleportation Pad (Z = +6.4m):
   * Dormant behind the monolith until the Passing Orb key restores on the North Pedestal.
   * Upon victory, the twin 6.8m monolith walls slide open and the Teleportation Pad ignites
   * with counter-rotating emerald-platinum energy rings and a rising warp light column!
   */
  _buildTeleportationPad() {
    const B = this.B;
    const s = this.scene;
    const pz = LEVEL14_CONFIG.teleporterZ;

    this.portalCoreMat = new B.PBRMaterial('aaa_portal_core_mat', s);
    this.portalCoreMat.albedoColor = B.Color3.FromHexString(PALETTE.accent.emerald);
    this.portalCoreMat.emissiveColor = B.Color3.FromHexString('#1E3A2F');
    this.portalCoreMat.metallic = 0.35;
    this.portalCoreMat.roughness = 0.16;
    this.portalCoreMat.disableDepthWrite = false;
    this.portalCoreMat.needDepthPrePass = false;

    // Low stepped walkable circular dais (bronze rim + honed alabaster marble deck)
    const outerStep = B.MeshBuilder.CreateCylinder(
      'teleporter_outer_step',
      { diameterTop: 3.1, diameterBottom: 3.35, height: 0.08, tessellation: 48 },
      s
    );
    outerStep.position.set(0, 0.04, pz);
    outerStep.material = this.darkBronzePBR;
    outerStep.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    outerStep.parent = this.root;
    this._registerMesh(outerStep, { freeze: true, mirror: true, receiveShadow: true });

    const innerDeck = B.MeshBuilder.CreateCylinder(
      'teleporter_inner_deck',
      { diameterTop: 2.55, diameterBottom: 2.75, height: 0.12, tessellation: 48 },
      s
    );
    innerDeck.position.set(0, 0.1, pz);
    innerDeck.material = this.marblePBR;
    innerDeck.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    innerDeck.parent = this.root;
    this._registerMesh(innerDeck, { freeze: true, mirror: true, receiveShadow: true });

    // Flush glowing teleport deck ring
    this.portalDeckRing = B.MeshBuilder.CreateTorus(
      'teleporter_deck_ring',
      { diameter: 2.28, thickness: 0.075, tessellation: 48 },
      s
    );
    this.portalDeckRing.position.set(0, 0.17, pz);
    this.portalDeckRing.material = this.portalCoreMat;
    this.portalDeckRing.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.portalDeckRing.parent = this.root;
    this._registerMesh(this.portalDeckRing, { freeze: true, mirror: true });

    // Grand upright bronze-and-emerald portal archway framing the Teleportation Pad
    const archOuter = B.MeshBuilder.CreateTorus(
      'teleporter_arch_outer',
      { diameter: 3.55, thickness: 0.13, tessellation: 48 },
      s
    );
    archOuter.position.set(0, 2.0, pz);
    archOuter.rotation.x = Math.PI * 0.5;
    archOuter.material = this.bronzePBR;
    archOuter.renderingGroupId = RENDER_GROUPS.ENVIRONMENT;
    archOuter.parent = this.root;
    this._registerMesh(archOuter, { freeze: true, mirror: true, shadow: true });

    // Counter-rotating kinetic energy halo rings suspended inside the portal archway
    this.portalHaloOuter = B.MeshBuilder.CreateTorus(
      'teleporter_halo_outer',
      { diameter: 3.05, thickness: 0.055, tessellation: 48 },
      s
    );
    this.portalHaloOuter.position.set(0, 2.0, pz);
    this.portalHaloOuter.rotation.x = Math.PI * 0.5;
    this.portalHaloOuter.material = this.portalCoreMat;
    this.portalHaloOuter.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.portalHaloOuter.parent = this.root;
    this._registerMesh(this.portalHaloOuter, { freeze: false, mirror: true });

    this.portalHaloInner = B.MeshBuilder.CreateTorus(
      'teleporter_halo_inner',
      { diameter: 2.35, thickness: 0.045, tessellation: 48 },
      s
    );
    this.portalHaloInner.position.set(0, 2.0, pz);
    this.portalHaloInner.rotation.x = Math.PI * 0.5;
    this.portalHaloInner.material = this.emissivePlatinumMat;
    this.portalHaloInner.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.portalHaloInner.parent = this.root;
    this._registerMesh(this.portalHaloInner, { freeze: false, mirror: true });

    // Translucent vertical warp beacon column (strictly obeys Ghost Material Invariants!)
    this.portalBeamMat = createGhostMaterial(s, 'teleporter_beam_mat', PALETTE.accent.emerald, 0.31);
    this.portalBeam = B.MeshBuilder.CreateCylinder(
      'teleporter_beam',
      { diameter: 2.1, height: 8.6, tessellation: 32 },
      s
    );
    this.portalBeam.position.set(0, 4.4, pz);
    this.portalBeam.material = this.portalBeamMat;
    this.portalBeam.isVisible = false;
    this.portalBeam.isPickable = false;
    this.portalBeam.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.portalBeam.parent = this.root;

    // Dedicated reactive emerald-gold point light illuminating the opened North Portal
    this.portalLight = new B.PointLight('teleporter_point_light', new B.Vector3(0, 2.2, pz), s);
    this.portalLight.diffuse = B.Color3.FromHexString(PALETTE.accent.emerald);
    this.portalLight.intensity = 0.0;
    this.portalLight.range = 14.0;
  }

  /**
   * Build the AAA Crystalline 2.0m Passing Orb (通行珠):
   * - Clearcoat engraved energy crystal PBR core (`orbSliceCore`)
   * - Machined metallic gold/platinum SO(3) gimbal rings (`orbMeridianRoot`, tracks true W=0 slice!)
   * - Translucent 4D projection envelope (`orbProjShell`, shown ONLY in Tab Side View per Option A!)
   */
  _buildPassingOrb() {
    const B = this.B;
    const s = this.scene;

    this.orbRoot = new B.TransformNode('passing_orb_root', s);
    this.orbRoot.position.set(0, LEVEL14_CONFIG.orbCenterY, LEVEL14_CONFIG.orbStartZ);
    this.orbRoot.parent = this.root;

    // 1. Exact W-slice AAA Crystal PBR Core
    this.orbCoreMat = createPassingOrbCrystalPBR(s);
    this.orbSliceCore = B.MeshBuilder.CreateSphere('orb_slice_core', { diameter: 2.0, segments: 36 }, s);
    this.orbSliceCore.material = this.orbCoreMat;
    this.orbSliceCore.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.orbSliceCore.parent = this.orbRoot;
    this._registerMesh(this.orbSliceCore, { freeze: false, mirror: true, shadow: true });

    // 2. 4D Projection Envelope (hidden by default per Option A; visible in Tab Side View)
    this.orbProjRoot = new B.TransformNode('orb_4d_projection_root', s);
    this.orbProjRoot.parent = this.orbRoot;

    this.orbProjShellMat = createGhostMaterial(s, 'orb_proj_shell_mat', PALETTE.accent.goldWPos, 0.30);
    this.orbProjShell = B.MeshBuilder.CreateSphere('orb_proj_shell', { diameter: 2.02, segments: 24 }, s);
    this.orbProjShell.material = this.orbProjShellMat;
    this.orbProjShell.isPickable = false;
    this.orbProjShell.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    this.orbProjShell.parent = this.orbProjRoot;

    // 3. Machined Metallic SO(3) Meridian & Equator Gimbal Rings (tracks true W=0 slice!)
    this.orbMeridianRoot = new B.TransformNode('orb_so3_meridians', s);
    this.orbMeridianRoot.parent = this.orbRoot;

    const ringXZ = B.MeshBuilder.CreateTorus(
      'orb_ring_xz',
      { diameter: 2.05, thickness: 0.034, tessellation: 48 },
      s
    );
    ringXZ.material = this.emissiveGoldTrimMat;
    ringXZ.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    ringXZ.parent = this.orbMeridianRoot;
    this._registerMesh(ringXZ, { freeze: false, mirror: true });

    const ringXY = B.MeshBuilder.CreateTorus(
      'orb_ring_xy',
      { diameter: 2.05, thickness: 0.034, tessellation: 48 },
      s
    );
    ringXY.rotation.x = Math.PI * 0.5;
    ringXY.material = this.emissiveGoldTrimMat;
    ringXY.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    ringXY.parent = this.orbMeridianRoot;
    this._registerMesh(ringXY, { freeze: false, mirror: true });

    const ringYZ = B.MeshBuilder.CreateTorus(
      'orb_ring_yz',
      { diameter: 2.07, thickness: 0.04, tessellation: 48 },
      s
    );
    ringYZ.rotation.z = Math.PI * 0.5;
    ringYZ.material = this.emissivePlatinumMat;
    ringYZ.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    ringYZ.parent = this.orbMeridianRoot;
    this._registerMesh(ringYZ, { freeze: false, mirror: true });

    // Glowing Polar Octahedron Landmark Jewels (north & south)
    const jewelTop = B.MeshBuilder.CreatePolyhedron('orb_so3_jewel_top', { type: 1, size: 0.11 }, s);
    jewelTop.position.set(0, 1.05, 0);
    jewelTop.material = this.emissivePlatinumMat;
    jewelTop.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    jewelTop.parent = this.orbMeridianRoot;

    const jewelBot = B.MeshBuilder.CreatePolyhedron('orb_so3_jewel_bot', { type: 1, size: 0.085 }, s);
    jewelBot.position.set(0, -1.05, 0);
    jewelBot.material = this.emissiveGoldTrimMat;
    jewelBot.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    jewelBot.parent = this.orbMeridianRoot;

    // Stationary Vertical YZ Rotation-Plane Halo (strictly lies in X=0 plane during Grab Stage)
    this.yzHaloMat = createGhostMaterial(s, 'yz_rotation_plane_halo', PALETTE.accent.cyanW0, 0.34);
    this.yzPlaneHalo = B.MeshBuilder.CreateTorus(
      'yz_plane_halo',
      { diameter: 2.62, thickness: 0.025, tessellation: 48 },
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

    const visorMat = new B.PBRMaterial('aaa_visor_pbr', s);
    visorMat.albedoColor = B.Color3.FromHexString(PALETTE.accent.cyanW0);
    visorMat.emissiveColor = B.Color3.FromHexString(PALETTE.accent.cyanW0).scale(1.2);
    visorMat.metallic = 0.85;
    visorMat.roughness = 0.08;

    const trimMat = createSolidMaterial(s, 'suit_trim_mat', { diffuseHex: '#252A33' });

    const torso = B.MeshBuilder.CreateCylinder(
      'astro_torso',
      { diameterTop: 0.44, diameterBottom: 0.36, height: 0.72, tessellation: 18 },
      s
    );
    torso.position.y = 1.08;
    torso.material = this.marblePBR;
    torso.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    torso.parent = this.astronaut;
    this._registerMesh(torso, { freeze: false, mirror: true, shadow: true });

    const pack = B.MeshBuilder.CreateBox('astro_pack', { width: 0.34, height: 0.46, depth: 0.18 }, s);
    pack.position.set(0, 1.12, -0.24);
    pack.material = trimMat;
    pack.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    pack.parent = this.astronaut;

    const helmet = B.MeshBuilder.CreateSphere('astro_helmet', { diameter: 0.36, segments: 18 }, s);
    helmet.position.y = 1.62;
    helmet.material = this.marblePBR;
    helmet.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    helmet.parent = this.astronaut;
    this._registerMesh(helmet, { freeze: false, mirror: true, shadow: true });

    const visor = B.MeshBuilder.CreateSphere('astro_visor', { diameter: 0.28, segments: 16 }, s);
    visor.position.set(0, 1.62, 0.08);
    visor.scaling.set(1.0, 0.72, 0.7);
    visor.material = visorMat;
    visor.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
    visor.parent = this.astronaut;

    for (const side of [-1, 1]) {
      const leg = B.MeshBuilder.CreateCylinder(
        `astro_leg_${side}`,
        { diameter: 0.15, height: 0.74, tessellation: 12 },
        s
      );
      leg.position.set(side * 0.12, 0.37, 0);
      leg.material = trimMat;
      leg.renderingGroupId = RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES;
      leg.parent = this.astronaut;
    }

    this.astronaut.setEnabled(false);
  }

  /**
   * Volumetric Clerestory Light Shafts & Radiant Slit Light Curtain (additive gradient sheets).
   */
  _buildVolumetricLightShafts() {
    const B = this.B;
    const s = this.scene;

    const goldShaftMat = createVolumetricShaftMaterial(s, 'aaa_clerestory_shaft', '#FFE6B0', 0.13);
    [-3.2, 3.2].forEach((zPos, i) => {
      for (const rotY of [0.35, -0.35]) {
        const sheet = B.MeshBuilder.CreatePlane(`sun_shaft_${i}_${rotY}`, { width: 3.6, height: 10.6 }, s);
        sheet.position.set(0, 5.4, zPos);
        sheet.rotation.y = rotY;
        sheet.rotation.z = -0.14; // Matches directional clerestory sun angle!
        sheet.material = goldShaftMat;
        sheet.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
        sheet.parent = this.root;
        this._registerMesh(sheet, { freeze: true });
      }
    });

    // Razor-thin vertical platinum light curtain pouring south out of the 0.164m Hairline Slit!
    const slitCurtainMat = createVolumetricShaftMaterial(s, 'aaa_slit_light_curtain', '#FFF6D6', 0.28);
    const slitBeam = B.MeshBuilder.CreatePlane('slit_volumetric_curtain', { width: 1.9, height: 6.7 }, s);
    slitBeam.position.set(0, 3.4, -2.05);
    slitBeam.rotation.y = Math.PI * 0.5; // Thin luminous vertical fan extending outward along Z!
    slitBeam.material = slitCurtainMat;
    slitBeam.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    slitBeam.parent = this.root;
    this._registerMesh(slitBeam, { freeze: false, mirror: true });
    this.slitVolumetricCurtain = slitBeam;
  }

  /**
   * GPU-style Soft Radial Golden Sanctuary Dust Motes drifting upward through the sunbeams.
   */
  _buildSanctuaryParticles() {
    const B = this.B;
    const s = this.scene;

    const ps = new B.ParticleSystem('sanctuary_motes_ps', 140, s);
    ps.particleTexture = createSoftGlowParticleTexture(s);
    ps.emitter = new B.Vector3(0, 0.6, -1.5);
    ps.minEmitBox = new B.Vector3(-5.8, 0, -6.5);
    ps.maxEmitBox = new B.Vector3(5.8, 6.2, 6.5);

    ps.color1 = new B.Color4(1.0, 0.94, 0.76, 0.72);
    ps.color2 = new B.Color4(0.97, 0.76, 0.27, 0.48);
    ps.colorDead = new B.Color4(0.97, 0.76, 0.27, 0.0);

    ps.minSize = 0.035;
    ps.maxSize = 0.095;
    ps.minLifeTime = 4.0;
    ps.maxLifeTime = 8.5;
    ps.emitRate = 22;
    ps.blendMode = B.ParticleSystem.BLENDMODE_ADD;
    ps.gravity = new B.Vector3(0, 0.04, 0);
    ps.direction1 = new B.Vector3(-0.08, 0.14, -0.08);
    ps.direction2 = new B.Vector3(0.08, 0.28, 0.08);
    ps.minEmitPower = 0.15;
    ps.maxEmitPower = 0.4;
    ps.updateSpeed = 0.014;
    ps.renderingGroupId = RENDER_GROUPS.PUZZLE_AND_GHOSTS;
    ps.start();
    this.particleSystem = ps;
  }

  _finalizeMirrorAndShadows() {
    const B = this.B;
    const sg = new B.ShadowGenerator(512, this.keyLight);
    sg.usePercentageCloserFiltering = true;
    sg.filteringQuality = B.ShadowGenerator.QUALITY_LOW;
    sg.bias = 0.001;
    sg.darkness = 0.35;
    for (const m of this.shadowCasters) {
      sg.addShadowCaster(m, false);
    }
    this.shadowGenerator = sg;
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

    // 0. Majestic slow counter-rotation of the high vault astrolabe rings
    for (const r of this.vaultAstrolabeRings) {
      r.mesh.rotation.y += dtSec * r.speedY;
      r.mesh.rotation.z += dtSec * r.speedZ;
    }

    // Advance victory monolith-parting progress first so key orb & portal stay synchronized
    if (state.completed) {
      this.monolithOpenProgress = Math.min(1, this.monolithOpenProgress + dtSec * 0.56);
    } else {
      this.monolithOpenProgress = 0;
    }
    const monolithEased = 1 - Math.pow(1 - this.monolithOpenProgress, 3);

    const ext = state.getExtents();
    const slice = state.grabbed ? state.getSliceAtW0() : state.getSliceAtPlayerW();
    const isBlade = state.isBladeThinEnough();

    // 1. Flanking W-layer reference arches (solid when player W matches, ghost otherwise)
    const playerW = state.playerPos[3];
    for (const grp of this.wLayerGroups) {
      applyPhaseToMaterial(grp.mat, playerW - grp.w, { solidThreshold: 0.55, ghostAlpha: 0.34 });
    }

    // 2. Passing Orb exact 4D geometry (Option A: eps=0.001m pure 3D slice default!)
    // Once unlocked as the key, the restored orb levitates upward above the North Pedestal
    // so the player can walk unobstructed straight beneath it to the North Teleportation Pad!
    const hoverOffset = state.completed
      ? monolithEased * 1.78 + Math.sin(this.elapsed * 2.2) * 0.06
      : Math.sin(this.elapsed * 2.0) * 0.04;
    this.orbRoot.position.set(0, LEVEL14_CONFIG.orbCenterY + hoverOffset, state.orbZ);
    this.orbLight.position.set(0, LEVEL14_CONFIG.orbCenterY + hoverOffset + 0.25, state.orbZ);

    if (slice.intersects) {
      this.orbSliceCore.setEnabled(true);
      this.orbSliceCore.position.set(slice.xCenter, 0, 0);
      const sx = Math.max(0.004, slice.semiX);
      const sy = Math.max(0.05, slice.semiY);
      const sz = Math.max(0.05, slice.semiZ);
      this.orbSliceCore.scaling.set(sx, sy, sz);

      this.orbMeridianRoot.setEnabled(true);
      this.orbMeridianRoot.position.set(slice.xCenter, 0, 0);
      this.orbMeridianRoot.scaling.set(sx, sy, sz);
    } else {
      this.orbSliceCore.setEnabled(false);
      this.orbMeridianRoot.setEnabled(false);
    }

    // Option A: Default view shows ONLY pure 3D slice; Tab reveals translucent 4D projection envelope
    const show4DProjection = state.viewMode === 'side_xzw';
    this.orbProjShell.setEnabled(show4DProjection);
    if (show4DProjection) {
      this.orbProjRoot.scaling.set(Math.max(0.01, ext.xMax), 1.0, 1.0);
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
    this.orbCoreMat.albedoColor = accentColor;
    this.orbCoreMat.emissiveColor = accentColor.scale(state.completed ? 1.15 : isBlade ? 0.92 : 0.55);
    this.orbLight.diffuse = accentColor;

    this.yzPlaneHalo.setEnabled(state.grabbed && !state.completed);
    if (state.grabbed) {
      const pulse = 0.30 + Math.sin(this.elapsed * 3.2) * 0.04;
      this.yzHaloMat.alpha = Math.min(0.35, Math.max(0.30, pulse));
    }

    // 3. Third-person Astronaut 08 placement
    this.astronaut.setEnabled(state.grabbed);
    if (state.grabbed) {
      const astroZ = Math.min(LEVEL14_CONFIG.wallZMin - 0.9, state.orbZ - 1.85);
      this.astronaut.position.set(-1.05, 0, astroZ);
      this.astronaut.rotation.y = 0.42;
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
      ).scale(1.85);
    } else {
      this.barrierPlane.setEnabled(false);
      const slitColor = isBlade || state.completed
        ? B.Color3.FromHexString(PALETTE.accent.emerald)
        : B.Color3.FromHexString(PALETTE.accent.platinum);
      this.slitLipMat.emissiveColor = slitColor.scale(1.85);
    }

    // 5. North target ghost silhouette
    this.northTargetGhost.setEnabled(!state.completed);
    if (!state.completed) {
      const hintPulse = this.hintHighlight ? 0.04 * Math.sin(this.elapsed * 5.0) : 0;
      this.northTargetGhostMat.alpha = Math.min(0.35, Math.max(0.30, 0.31 + hintPulse));
    }

    // 6. Victory: Twin 6.8m Monoliths slide wide open + Sanctuary Inner Gate opens + North Teleportation Pad ignites!
    this.monolithLeftGroup.position.x = -monolithEased * 2.65;
    this.monolithRightGroup.position.x = monolithEased * 2.65;
    if (this.slitVolumetricCurtain) {
      this.slitVolumetricCurtain.isVisible = this.monolithOpenProgress < 0.12;
    }

    if (state.completed) {
      this.victoryBeam.isVisible = true;
      this.gateOpenProgress = Math.min(1, this.gateOpenProgress + dtSec * 0.72);
      const eased = 1 - Math.pow(1 - this.gateOpenProgress, 3);
      this.gateLeft.position.x = -1.16 - eased * 2.05;
      this.gateRight.position.x = 1.16 + eased * 2.05;
      this.gateEmblem.scaling.setAll(1 + eased * 0.25);
      this.gateEmblem.isVisible = this.gateOpenProgress < 0.7;
      this.northRingMat.emissiveColor = B.Color3.FromHexString(PALETTE.accent.platinum).scale(1.8);
      this.orbLight.intensity = 3.0;

      // Ignite North Teleportation Pad rings & emerald warp column
      this.portalBeam.isVisible = true;
      this.portalHaloOuter.rotation.z += dtSec * 0.95;
      this.portalHaloOuter.rotation.y = Math.sin(this.elapsed * 0.8) * 0.22;
      this.portalHaloInner.rotation.z -= dtSec * 1.45;
      this.portalHaloInner.rotation.y = -Math.sin(this.elapsed * 1.1) * 0.28;
      const portalPulse = 1.45 + 0.35 * Math.sin(this.elapsed * 3.4);
      this.portalCoreMat.emissiveColor = B.Color3.FromHexString(PALETTE.accent.emerald).scale(portalPulse);
      this.portalLight.intensity = 2.6 * monolithEased;
    } else {
      this.victoryBeam.isVisible = false;
      this.gateOpenProgress = 0;
      this.gateLeft.position.x = -1.16;
      this.gateRight.position.x = 1.16;
      this.gateEmblem.scaling.setAll(1);
      this.gateEmblem.isVisible = true;
      this.northRingMat.emissiveColor = B.Color3.FromHexString(PALETTE.accent.goldWPos).scale(1.45);
      this.orbLight.intensity = 1.9;

      // Dormant Teleportation Pad
      this.portalBeam.isVisible = false;
      this.portalHaloOuter.rotation.set(Math.PI * 0.5, 0, 0);
      this.portalHaloInner.rotation.set(Math.PI * 0.5, 0, 0);
      this.portalCoreMat.emissiveColor = B.Color3.FromHexString('#1B3026');
      this.portalLight.intensity = 0.0;
    }
  }
}
