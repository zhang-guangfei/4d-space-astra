/**
 * Beyond 3D — Application Bootstrap (Phase 1 Vertical Slice: Level 14 "发丝裂缝")
 * Wires:
 * - Pure 4D Math & Level 14 State Machine (src/core/sanctuary-4d.js)
 * - 45s / H-Key Tiered Oral Hints (src/core/tiered-hints.js)
 * - Babylon.js 3D C-Zone Sanctuary Landmark (src/levels/chapter2-sanctuary.js)
 * - Unified D8 Input Controller + Third-Person Grab Stage + Honest XZW Side View
 * - Collapsible Right-Side Hyper-Holographic Console + Web Audio SFX + Dual-Character Voice
 */

import { Level14HairlineSlitState } from '../core/sanctuary-4d.js';
import { TieredHintController } from '../core/tiered-hints.js';
import { CharacterVoiceEngine } from '../engine/character-voice.js';
import { GrabStageController } from '../engine/grab-stage.js';
import { InputController } from '../engine/input-controller.js';
import { PALETTE } from '../engine/phase-materials.js';
import { SoundFxEngine } from '../engine/sound-fx.js';
import { TacticalConsole } from '../engine/tactical-console.js';
import { Level14SanctuaryScene } from '../levels/chapter2-sanctuary.js';
import { HudController } from './hud.js';

function boot() {
  const B = globalThis.BABYLON;
  const canvas = document.getElementById('render-canvas');
  if (!B || !canvas) {
    throw new Error('Babylon.js or #render-canvas failed to initialize.');
  }

  // 1. Babylon Engine & Scene
  const engine = new B.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    antialias: true,
  });
  const scene = new B.Scene(engine);
  scene.skipPointerMovePicking = true;

  const camera = new B.FreeCamera('sanctuary_cam', new B.Vector3(1.55, 1.85, -7.8), scene);
  camera.minZ = 0.08;
  camera.maxZ = 120;
  camera.fov = 0.9; // Crisp architectural FOV

  // 2. Pure Core State & Tiered Hints (Level 14)
  const state = new Level14HairlineSlitState();
  const hints = new TieredHintController(14);
  let lastBeat = 0;
  let victoryAnnounced = false;
  let paused = false;
  let audioUnlocked = false;

  // 3. Audio & Dual-Character Voice (D12)
  const sfx = new SoundFxEngine();
  let hud = null;
  const voice = new CharacterVoiceEngine({
    onSubtitle: (payload) => hud?.showSubtitle(payload),
  });

  // 4. 3D Sanctuary Landmark + Grab Stage + Tactical Console
  const sanctuary3D = new Level14SanctuaryScene(scene);
  const grabStage = new GrabStageController(
    document.getElementById('side-view-canvas'),
    document.getElementById('side-view-panel')
  );
  const consolePanel = new TacticalConsole({
    wrapperEl: document.getElementById('tactical-wrapper'),
    bodyEl: document.getElementById('tactical-body'),
    canvas: document.getElementById('tactical-canvas'),
    rulerCursorEl: document.getElementById('w-ruler-cursor'),
    rulerReadoutEl: document.getElementById('w-ruler-readout'),
  });

  // Helper actions
  const unlockAudioOnce = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    sfx.unlock();
    sfx.startSanctuaryAmbience();
  };

  const announceBeatAdvance = () => {
    if (state.beat > lastBeat) {
      lastBeat = state.beat;
      if (state.beat < 3) {
        sfx.playBeatUnlock(state.beat);
      }
    }
    if (state.completed && !victoryAnnounced) {
      victoryAnnounced = true;
      sanctuary3D.setHintHighlight(false);
      sfx.playVictory();
      voice.speak(
        'tomb',
        '你没有压扁它，只是将它转入了第四维。圣殿内门已为你敞开。',
        { durationMs: 6500 }
      );
    }
  };

  const handleRequestHint = () => {
    unlockAudioOnce();
    const res = hints.requestNextHint();
    const tierNames = ['现象提醒', '思考方向', '明确解法'];
    voice.speak(res.speaker, res.text, {
      tierLabel: `${res.tier}级·${tierNames[res.tier - 1]}`,
    });
    if (res.shouldHighlightTarget) {
      sanctuary3D.setHintHighlight(true);
    }
  };

  const handleToggleHonestView = () => {
    unlockAudioOnce();
    const mode = state.toggleViewMode();
    sfx.playTabViewSwitch(mode === 'side_xzw');
    announceBeatAdvance();
  };

  const handleReset = () => {
    unlockAudioOnce();
    state.reset();
    hints.setLevel(14);
    input.setGrabbed(false);
    input.setLookAngles(-0.20, 0.03);
    sanctuary3D.setHintHighlight(false);
    lastBeat = 0;
    victoryAnnounced = false;
    const opening = hints.getOpeningLine();
    voice.speak(opening.speaker, opening.text, { durationMs: 5500 });
  };

  const handleTogglePause = () => {
    paused = !paused;
    input.setPaused(paused);
    hud.setPaused(paused);
  };

  // 5. HUD Controller
  hud = new HudController({
    onRequestHint: handleRequestHint,
    onToggleVoice: () => {
      unlockAudioOnce();
      voice.setEnabled(!voice.enabled);
      sfx.setMuted(!voice.enabled);
      hud.setVoiceEnabled(voice.enabled);
    },
    onToggleConsole: () => {
      unlockAudioOnce();
      const expanded = consolePanel.toggle();
      hud.setConsoleExpanded(expanded);
    },
    onTogglePause: handleTogglePause,
    onToggleHonestView: handleToggleHonestView,
    onReset: handleReset,
    onSensitivityChange: ({ mouseScale, wheelScale }) => {
      if (typeof mouseScale === 'number') {
        input.mouseSensitivity = 0.0024 * mouseScale;
      }
      if (typeof wheelScale === 'number') {
        input.wheelSensitivity = wheelScale;
      }
    },
  });

  // 6. Unified D8 Input Controller
  const input = new InputController(canvas, {
    onUserGesture: unlockAudioOnce,
    onTogglePause: handleTogglePause,
    onToggleHonestView: handleToggleHonestView,
    onToggleConsole: () => {
      const expanded = consolePanel.toggle();
      hud.setConsoleExpanded(expanded);
    },
    onRequestHint: handleRequestHint,
    onReset: handleReset,
    onInteract: () => {
      if (state.completed) return;
      if (state.grabbed) {
        state.setGrabbed(false);
        input.setGrabbed(false);
        sfx.playGrabLock(false);
      } else {
        const res = state.setGrabbed(true);
        if (res.grabbed) {
          input.setGrabbed(true);
          sfx.playGrabLock(true);
          announceBeatAdvance();
        } else {
          hud.showBlockToast('请再走近通行珠一些，按 E 抓取');
        }
      }
    },
    onGrabDrag3D: (deltaYaw, deltaPitch) => {
      state.rotateOrb3D(deltaYaw, deltaPitch);
    },
    onWheel4D: (wheelUnits) => {
      if (state.grabbed) {
        // Grab Stage: Mouse Wheel = 4D XW Rotation around YZ plane!
        const deltaDeg = wheelUnits * 5.0;
        const wasBlade = state.isBladeThinEnough();
        const res = state.rotateOrb4D(deltaDeg);
        if (res.blocked) {
          sfx.playBlocked();
          sanctuary3D.triggerBarrierFlash();
          grabStage.triggerBlockFlash();
          hud.flashEdge(PALETTE.accent.amberCoral);
          hud.showBlockToast(state.lastBlockEvent?.message || '窄缝内无法提前展开圆球');
        } else if (res.applied) {
          const isBladeNow = res.isBlade;
          sfx.playRotate4D(res.thetaDeg, !wasBlade && isBladeNow);
          if (!wasBlade && isBladeNow) {
            hud.flashEdge(PALETTE.accent.emerald);
          }
          announceBeatAdvance();
        }
      } else {
        // Walk Mode: Mouse Wheel = Translate along W axis!
        const res = state.shiftPlayerW(wheelUnits * 0.28);
        sfx.playWShift(res.w);
        const wColor =
          res.w > 0.6
            ? PALETTE.accent.goldWPos
            : res.w < -0.6
              ? PALETTE.accent.blueWNeg
              : PALETTE.accent.cyanW0;
        hud.flashEdge(wColor);
        announceBeatAdvance();
      }
    },
  });

  // Play Tomb's short contextual opening line on level entry (zero checklist popup!)
  const opening = hints.getOpeningLine();
  setTimeout(() => {
    voice.speak(opening.speaker, opening.text, { durationMs: 5600 });
  }, 450);

  // Expose read-only diagnostic hook for automated browser inspection & verification
  globalThis.__BEYOND3D__ = {
    state,
    hints,
    input,
    scene,
    sanctuary3D,
    actions: {
      grab: () => {
        const r = state.setGrabbed(true);
        if (r.grabbed) input.setGrabbed(true);
        return r;
      },
      toggleTab: handleToggleHonestView,
      requestHint: handleRequestHint,
      reset: handleReset,
    },
  };

  // 7. Main 60 FPS Render & Simulation Loop
  let lastTime = performance.now();
  engine.runRenderLoop(() => {
    const now = performance.now();
    const dtSec = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    if (!paused) {
      const move = input.sampleMoveVector(dtSec);
      if (state.grabbed) {
        // W / S pushes or pulls the grabbed Passing Orb along the sanctuary Z axis
        if (move.forward !== 0) {
          const speed = move.sprint ? 3.4 : 2.15;
          const res = state.pushOrbZ(move.forward * speed * dtSec);
          if (res.blocked) {
            sfx.playBlocked();
            sanctuary3D.triggerBarrierFlash();
            grabStage.triggerBlockFlash();
            hud.flashEdge(PALETTE.accent.amberCoral);
            hud.showBlockToast(state.lastBlockEvent?.message || '圆球过宽，无法穿过发丝窄缝');
          }
          announceBeatAdvance();
        }
      } else if (move.forward !== 0 || move.right !== 0) {
        const speed = move.sprint ? 5.6 : 3.5;
        const sinY = Math.sin(input.yaw);
        const cosY = Math.cos(input.yaw);
        const rawDx = move.forward * sinY + move.right * cosY;
        const rawDz = move.forward * cosY - move.right * sinY;
        const len = Math.hypot(rawDx, rawDz) || 1;
        const res = state.movePlayerXZ((rawDx / len) * speed * dtSec, (rawDz / len) * speed * dtSec);
        if (res.blockedByWall) {
          sfx.playBlocked();
          sanctuary3D.triggerBarrierFlash();
          hud.flashEdge(PALETTE.accent.amberCoral);
          hud.showBlockToast('巨墙在所有 W 切片均实体封死');
          announceBeatAdvance();
        }
      }

      // Update 45s stagnation hint timer
      hints.update(dtSec, state.beat, state.completed);

      // Update 3D scene, camera, Honest XZW Side View, Tactical Console, and HUD
      sanctuary3D.syncFromState(state, dtSec);
      grabStage.updateCamera(camera, state, input, dtSec);
      grabStage.renderSideView(state);
      consolePanel.render(state);
      hud.sync(state, hints.getSnapshot());
    }

    scene.render();
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
}

boot();
