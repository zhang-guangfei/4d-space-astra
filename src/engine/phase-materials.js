/**
 * Beyond 3D — Phase Material Controller & Three-Rendering-Group Pipeline
 * Strictly enforces 04-visual-and-art-direction.md:
 * - Solid State (current W slice): alpha = 1.0, disableDepthWrite = false, needDepthPrePass = false
 * - Ghost State (adjacent W slice): alpha = 0.34 (0.30..0.35), disableDepthWrite = true, needDepthPrePass = false
 * - Three Rendering Groups (0: static hall/walls, 1: puzzle/ghosts, 2: characters/wireframes)
 *   with auto-clear depth disabled for groups 1 & 2 so depth sorting remains 100% honest.
 */

export const PALETTE = Object.freeze({
  // Zone A: Corridor Research Station (Levels 1-4)
  zoneA: {
    base: '#ECEEF2',
    struct: '#9AA5B4',
    bg: '#DCE2EA',
  },
  // Zone B: Between Pages (Levels 5-12)
  zoneB: {
    base: '#141923',
    struct: '#263042',
    bg: '#0E121A',
  },
  // Zone C: Geometric Sanctuary (Levels 13-18)
  zoneC: {
    obsidian: '#1D1912',
    obsidianLight: '#2B251B',
    bronze: '#8A6A2F',
    sanctuaryWhite: '#F6F4EE',
    stoneDark: '#231F18',
    bg: '#120F0B',
  },
  // Strict Global Functional Accent Colors (W slices & interactables only!)
  accent: {
    cyanW0: '#4DE6D3', // W = 0.0 base slice / interactables
    goldWPos: '#F7C346', // W = +1.8 positive slice / rotation meridian / north pedestal
    blueWNeg: '#58A6FF', // W = -1.8 negative slice / forcefield membrane
    platinum: '#FFF6D6', // Completed / hairline slit lips / Ark core
    emerald: '#69F0AE', // Confirmed lock / solved status
    amberCoral: '#FF6B6B', // Blocked / collision / short-circuit alert
    suitCyanWhite: '#A5FCF2', // Level 17 suit conduit schematic wireframe
  },
});

export const RENDER_GROUPS = Object.freeze({
  ENVIRONMENT: 0, // Background dome, floor grid, static walls
  PUZZLE_AND_GHOSTS: 1, // Interactive 4D objects & translucent ghost slices
  CHARACTERS_AND_WIREFRAMES: 2, // Astronauts, Lin Xia, key holographic wireframes
});

/**
 * Pure material specification objects (testable in Node.js without WebGL).
 */
export function getSolidMaterialSpec(hexColor = PALETTE.accent.cyanW0) {
  return {
    state: 'solid',
    hexColor,
    alpha: 1.0,
    disableDepthWrite: false,
    needDepthPrePass: false,
    backFaceCulling: true,
  };
}

export function getGhostMaterialSpec(hexColor = PALETTE.accent.goldWPos, alpha = 0.34) {
  const clampedAlpha = Math.min(0.35, Math.max(0.30, alpha));
  return {
    state: 'ghost',
    hexColor,
    alpha: clampedAlpha,
    disableDepthWrite: true,
    needDepthPrePass: false,
    backFaceCulling: false,
  };
}

/**
 * Hard anti-regression invariant assertion (05-from-zero-build-plan.md §3.3):
 * Ghost translucent materials MUST NEVER enable depthPrePass or depthWrite.
 */
export function assertGhostMaterialInvariants(material) {
  if (!material) {
    throw new Error('Ghost material cannot be null or undefined.');
  }
  if (material.needDepthPrePass === true) {
    throw new Error('Invariant violation: Ghost material must NOT enable needDepthPrePass.');
  }
  if (material.disableDepthWrite !== true) {
    throw new Error('Invariant violation: Ghost material MUST set disableDepthWrite = true.');
  }
  if (typeof material.alpha !== 'number' || material.alpha < 0.25 || material.alpha > 0.45) {
    throw new Error(
      `Invariant violation: Ghost material alpha (${material.alpha}) outside translucent range.`
    );
  }
  return true;
}

/**
 * Configure Babylon.js scene for the three-rendering-group pipeline while preserving depth buffer.
 */
export function configureRenderingGroups(scene) {
  // Group 0 clears depth normally; Groups 1 and 2 preserve depth from lower groups
  scene.setRenderingAutoClearDepthStencil(RENDER_GROUPS.PUZZLE_AND_GHOSTS, false, false, false);
  scene.setRenderingAutoClearDepthStencil(
    RENDER_GROUPS.CHARACTERS_AND_WIREFRAMES,
    false,
    false,
    false
  );
}

/**
 * Create a Babylon StandardMaterial conforming to Solid State rules.
 */
export function createSolidMaterial(scene, name, options = {}) {
  const BABYLON = globalThis.BABYLON;
  const spec = getSolidMaterialSpec(options.diffuseHex ?? PALETTE.zoneC.obsidian);
  const mat = new BABYLON.StandardMaterial(name, scene);
  mat.diffuseColor = BABYLON.Color3.FromHexString(spec.hexColor);
  mat.emissiveColor = options.emissiveHex
    ? BABYLON.Color3.FromHexString(options.emissiveHex).scale(options.emissiveScale ?? 0.35)
    : BABYLON.Color3.Black();
  mat.specularColor = options.specularHex
    ? BABYLON.Color3.FromHexString(options.specularHex)
    : new BABYLON.Color3(0.28, 0.25, 0.2);
  mat.specularPower = options.specularPower ?? 48;
  mat.alpha = spec.alpha;
  mat.disableDepthWrite = spec.disableDepthWrite;
  mat.needDepthPrePass = spec.needDepthPrePass;
  mat.backFaceCulling = options.backFaceCulling ?? true;
  return mat;
}

/**
 * Create a Babylon StandardMaterial conforming strictly to Ghost State rules.
 */
export function createGhostMaterial(scene, name, hexColor, alpha = 0.34) {
  const BABYLON = globalThis.BABYLON;
  const spec = getGhostMaterialSpec(hexColor, alpha);
  const mat = new BABYLON.StandardMaterial(name, scene);
  const color = BABYLON.Color3.FromHexString(spec.hexColor);
  mat.diffuseColor = color.scale(0.55);
  mat.emissiveColor = color.scale(0.65);
  mat.specularColor = new BABYLON.Color3(0.15, 0.15, 0.15);
  mat.alpha = spec.alpha;
  mat.disableDepthWrite = spec.disableDepthWrite;
  mat.needDepthPrePass = spec.needDepthPrePass;
  mat.backFaceCulling = spec.backFaceCulling;
  assertGhostMaterialInvariants(mat);
  return mat;
}

/**
 * Dynamically blend a material between Solid (W distance == 0) and Ghost (W distance >= threshold),
 * keeping depth write & alpha invariants rock-solid without sorting flicker.
 */
export function applyPhaseToMaterial(mat, deltaW, options = {}) {
  const solidThreshold = options.solidThreshold ?? 0.45;
  const ghostAlpha = options.ghostAlpha ?? 0.34;
  const absW = Math.abs(deltaW);
  if (absW <= solidThreshold) {
    mat.alpha = 1.0;
    mat.disableDepthWrite = false;
    mat.needDepthPrePass = false;
  } else {
    mat.alpha = ghostAlpha;
    mat.disableDepthWrite = true;
    mat.needDepthPrePass = false;
  }
}
