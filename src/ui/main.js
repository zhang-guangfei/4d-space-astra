/**
 * Beyond 3D — Application Bootstrap (Phase 1 Vertical Slice: Level 14 "发丝裂缝")
 *
 * Discovery-First Guided Experience ("Show first -> point attention in 1 line -> let player verify!"):
 * 1. Opening: Briefly spotlight North Golden Pedestal behind slit; voice sets goal only ("把这颗球送到那边的底座上。").
 * 2. Grab (E): Scroll-wheel handoff cue glides from right w-ruler to orb + 1 line ("现在，滚轮转动的是你手里的球。");
 *    Side View stays tucked behind a clean [Tab] pill to prevent information overload.
 * 3. First Slight Tilt: Decorative rings dim, △ & ○ diameter markers fade outward reversibly, cyan disc shows
 *    "留在这一层的部分" tag + 1 observation ("你把球的一部分转出了我们这一层。青色的，是还留在这里的那一片。") -> STOP!
 * 4. First Tilted Wall Bump: Confirm thin cyan slice fits inside slit lips + highlight exact protruding contact spot
 *    + pulse [Tab] pill + 1 Socratic question ("眼前这片够薄了。刚才是哪里碰到了墙？").
 * 5. Tab Inspection After Bump: Glides observer's w-layer smoothly to the colliding neighboring layer while orb & wall
 *    stay fixed, revealing the orb body pressing against the solid wall in that layer -> names discovery once seen!
 * 6. 90° Upright: △ & ○ tuck inside the slit lips and glow emerald -> silent space for player's own decision to push W!
 * 7. North Arrival: Full-sphere pedestal silhouette pulses -> "球送到了。看看底座的形状。" -> context-aware H hints!
 * 8. Key Restored: Twin 13.6m monoliths part 7.86m wide open -> walk straight to North Teleportation Pad (Z = 11.2)!
 */

import { angularDistanceMod180Deg } from '../core/math4d.js';
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
import { PrincipleGuideController } from './principle-guide.js';

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

  const camera = new B.FreeCamera('sanctuary_cam', new B.Vector3(2.6, 1.85, -10.8), scene);
  camera.minZ = 0.20;
  camera.maxZ = 160;
  camera.fov = 0.92;

  // 2. Pure Core State & Context-Aware Tiered Hints (Level 14)
  const state = new Level14HairlineSlitState();
  const hints = new TieredHintController(14);
  let lastBeat = 0;
  let victoryAnnounced = false;
  let autoReleaseTimer = null;
  let paused = false;
  let guideOpen = false;
  let teleporterOpen = false;
  let audioUnlocked = false;
  let northStuckTimer = 0;

  // Discovery-first coaching milestones (every moment fires ONCE at the exact right beat!)
  const coached = {
    firstGrabWheel: false,
    wScrollAllW: false,
    wScrollSphereSlices: false,
    drag3DInvariant: false,
    slightTiltDisc: false,
    tiltedBlocked: false,
    wallEvidenceNamed: false,
    northArrived: false,
    northRestoreNudge: false,
  };
  const resetCoaching = () => {
    for (const k of Object.keys(coached)) coached[k] = false;
    northStuckTimer = 0;
  };

  // 3. Audio & Dual-Character Voice (D12)
  const sfx = new SoundFxEngine();
  let hud = null;
  const voice = new CharacterVoiceEngine({
    onSubtitle: (payload) => hud?.showSubtitle(payload),
  });

  // 4. 3D Sanctuary Landmark + Grab Stage + Tactical Console
  const sanctuary3D = new Level14SanctuaryScene(scene, camera);
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

  const syncPauseState = () => {
    input.setPaused(paused || guideOpen || teleporterOpen);
  };

  const unlockAudioOnce = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    sfx.unlock();
    sfx.startSanctuaryAmbience();
    voice.unlockOnGesture();
  };

  const releaseGrabCleanly = ({ keepVictoryBanner = false } = {}) => {
    if (autoReleaseTimer) {
      clearTimeout(autoReleaseTimer);
      autoReleaseTimer = null;
    }
    if (!state.grabbed) return;
    const releasingAtNorthUnrestored = !state.completed && state.isOnNorthPedestal();
    state.setGrabbed(false);
    input.setGrabbed(false);
    hud?.hideWheelHandoffCue();
    hud?.hideSliceCallout();
    hud?.setTabAttention(false);
    input.setLookAngles(0, 0.03);
    sfx.playGrabLock(false);
    if (state.completed && !keepVictoryBanner) {
      hud?.dismissVictoryBanner();
    } else if (releasingAtNorthUnrestored && !coached.northRestoreNudge) {
      coached.northRestoreNudge = true;
      voice.speak('tomb', '还记得它刚才是怎么立起来的吗？', { durationMs: 5600 });
    }
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
      hud?.hideSliceCallout();
      hud?.hideWheelHandoffCue();
      hud?.setTabAttention(false);
      sfx.playVictory();
      voice.speak(
        'tomb',
        '钥匙归位，巨墙打开了。穿过前方通道，踏上传送台前往下一关。',
        { durationMs: 7400 }
      );
      // Auto-release after a brief beat so player watches the twin 13.6m monolith walls part wide open
      if (autoReleaseTimer) clearTimeout(autoReleaseTimer);
      autoReleaseTimer = setTimeout(() => {
        autoReleaseTimer = null;
        if (state.completed && state.grabbed) {
          releaseGrabCleanly({ keepVictoryBanner: true });
        }
      }, 1150);
    }
  };

  const handleRequestHint = () => {
    unlockAudioOnce();
    const phase = state.getCurrentPuzzlePhase();
    const res = hints.requestContextHint(phase, {
      sideViewOpen: state.viewMode === 'side_xzw',
    });
    const tierNames = ['思路启发', '操作方向', '完整解法'];
    voice.speak(res.speaker, res.text, {
      tierLabel: `${res.tier}级·${tierNames[Math.min(res.tier - 1, tierNames.length - 1)]}`,
      durationMs: 8200,
    });
    if (res.shouldHighlightTarget) {
      sanctuary3D.setHintHighlight(true);
    }
  };

  const handleToggleHonestView = () => {
    unlockAudioOnce();
    const mode = state.toggleViewMode();
    sfx.playTabViewSwitch(mode === 'side_xzw');
    hud?.setTabAttention(false);
    hud?.hideSliceCallout();

    announceBeatAdvance();
  };

  const compareLayers = () => {
    if (paused || guideOpen || teleporterOpen || !state.canCompareLayers) return;
    if (state.inspectModeActive) state.clearCollisionInspect();
    else state.startCollisionInspect();
  };

  const handleReset = () => {
    unlockAudioOnce();
    if (autoReleaseTimer) {
      clearTimeout(autoReleaseTimer);
      autoReleaseTimer = null;
    }
    state.reset();
    hints.setLevel(14);
    resetCoaching();
    teleporterOpen = false;
    hud?.resetBanner();
    input.setGrabbed(false);
    input.setLookAngles(-0.22, 0.04);
    sanctuary3D.setHintHighlight(false);
    sanctuary3D.triggerOpeningPedestalSpotlight();
    lastBeat = 0;
    victoryAnnounced = false;
    syncPauseState();
    const opening = hints.getOpeningLine();
    voice.speak(opening.speaker, opening.text, { durationMs: 5200 });
  };

  const handleTogglePause = () => {
    if (guideOpen) {
      principleGuide.hide();
      return;
    }
    if (teleporterOpen) {
      teleporterOpen = false;
      hud?.setTeleporterVisible(false);
      syncPauseState();
      return;
    }
    paused = !paused;
    syncPauseState();
    hud.setPaused(paused);
  };

  // 5. Enlarged Interactive 3D Principle Briefing (opened via I key; never blocks entry!)
  const principleGuide = new PrincipleGuideController({
    onVisibilityChange: (isOpen) => {
      guideOpen = isOpen;
      if (isOpen) unlockAudioOnce();
      syncPauseState();
    },
    onDismissed: () => {
      unlockAudioOnce();
    },
  });

  // 6. HUD Controller
  hud = new HudController({
    onToggleGuide: () => {
      unlockAudioOnce();
      principleGuide.toggle();
    },
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
    onCompareLayers: compareLayers,
    onReleaseAfterVictory: () => releaseGrabCleanly({ keepVictoryBanner: false }),
    onCloseTeleporterModal: () => {
      teleporterOpen = false;
      syncPauseState();
    },
    onReset: handleReset,
    onSensitivityChange: ({ mouseScale, wheelScale }) => {
      if (typeof mouseScale === 'number') {
        input.mouseSensitivity = 0.0028 * mouseScale;
      }
      if (typeof wheelScale === 'number') {
        input.wheelSensitivity = wheelScale;
      }
    },
  });

  // 7. Unified D8 Input Controller
  const input = new InputController(canvas, {
    onUserGesture: unlockAudioOnce,
    onTogglePause: handleTogglePause,
    onToggleGuide: () => principleGuide.toggle(),
    onToggleHonestView: handleToggleHonestView,
    onCompareLayers: compareLayers,
    onToggleConsole: () => {
      const expanded = consolePanel.toggle();
      hud.setConsoleExpanded(expanded);
    },
    onRequestHint: handleRequestHint,
    onReset: handleReset,
    onInteract: () => {
      // ALWAYS allow pressing E to release Grab Stage — including AFTER victory!
      if (state.grabbed) {
        releaseGrabCleanly({ keepVictoryBanner: false });
        return;
      }
      if (state.completed) {
        hud?.dismissVictoryBanner();
        return;
      }
      const res = state.setGrabbed(true);
      if (res.grabbed) {
        input.setGrabbed(true);
        sfx.playGrabLock(true);
        // Clean scroll-wheel handoff cue from right w-ruler to orb + 1 clear line!
        hud.showWheelHandoffCue(4800);
        if (!coached.firstGrabWheel) {
          coached.firstGrabWheel = true;
          voice.speak('tomb', '现在，滚轮转动的是你手里的球。', { durationMs: 5000 });
        }
        announceBeatAdvance();
      } else {
        hud.showBlockToast('再走近圆球一些，按 E 抓住它');
      }
    },
    onGrabDrag3D: (deltaYaw, deltaPitch) => {
      if (state.viewMode === 'side_xzw') return;
      state.rotateOrb3D(deltaYaw, deltaPitch);
      if (!coached.drag3DInvariant && state.hasRotated3DWhileGrabbed && !state.hasRotated4DWhileGrabbed) {
        coached.drag3DInvariant = true;
        voice.speak('tomb', '这样转动，球的宽度一点也没变。试试拨动鼠标滚轮。', { durationMs: 5600 });
      }
    },
    onWheel4D: (wheelUnits) => {
      if (state.grabbed) {
        const deltaDeg = wheelUnits * 5.0;
        const wasBlade = state.isBladeThinEnough();
        const res = state.rotateOrb4D(deltaDeg);
        hud.hideWheelHandoffCue();

        if (res.blocked) {
          sfx.playBlocked();
          sanctuary3D.triggerBarrierFlash();
          grabStage.triggerBlockFlash();
          hud.flashEdge(PALETTE.accent.amberCoral);
          hud.showBlockToast(state.lastBlockEvent?.message || '狭缝内空间不足，请先将球推到对面底座');
        } else if (res.applied) {
          const isBladeNow = res.isBlade;
          sfx.playRotate4D(res.thetaDeg, !wasBlade && isBladeNow);

          // Beat: First slight tilt — show "留在这一层的部分" tag + 1 clean observation -> STOP!
          // Leave room for the player to scroll back & forth or test pushing into the slit themselves!
          const distFrom0 = angularDistanceMod180Deg(res.thetaDeg, 0);
          if (!coached.slightTiltDisc && !isBladeNow && distFrom0 >= 4 && distFrom0 < 85) {
            coached.slightTiltDisc = true;
            hud.showSliceCallout(5800);
            voice.speak(
              'tomb',
              '球朝第四维转了。看，两端转到了别的层，留在眼前的是中间这片圆面。',
              { durationMs: 6800 }
            );
          }

          // Hide slice callout if player returns cleanly to 0° (reversible confirmation!)
          if (distFrom0 < 3) {
            hud.hideSliceCallout();
          }

          // Reached 90° upright: bright emerald slit lips & harmonic chime — SILENT so player decides to push W!
          if (!wasBlade && isBladeNow) {
            hud.flashEdge(PALETTE.accent.emerald);
            hud.hideSliceCallout();
            hud.setTabAttention(false);
          }
          announceBeatAdvance();
        }
      } else {
        // Walk Mode: Mouse Wheel = Shift player along Fourth Dimension w!
        const res = state.shiftPlayerW(wheelUnits * 0.28);
        sfx.playWShift(res.w);
        const wColor =
          res.w > 0.6
            ? PALETTE.accent.goldWPos
            : res.w < -0.6
              ? PALETTE.accent.blueWNeg
              : PALETTE.accent.cyanW0;
        hud.flashEdge(wColor);

        // When sphere is tilted and player scrolls w watching circular cross-sections grow & shrink:
        const orbRotatedIntoW = Math.abs(Math.sin(state.thetaRad)) > 0.08;
        const orbSliceNow = state.getSliceAtPlayerW();
        if (
          !coached.wScrollSphereSlices &&
          orbRotatedIntoW &&
          Math.abs(res.w) >= 0.08 &&
          (orbSliceNow.intersects || Math.abs(res.w) <= state.getExtents().wMax + 0.35)
        ) {
          coached.wScrollSphereSlices = true;
          voice.speak(
            'tomb',
            '你在换层。每一层都能看到同一颗球的不同部分。',
            { durationMs: 5800 }
          );
        } else if (!coached.wScrollAllW && !orbRotatedIntoW && Math.abs(res.w) >= 0.85 && !state.completed) {
          coached.wScrollAllW = true;
          voice.speak(
            'tomb',
            '换到这一层，两旁的折页变了——但前方的墙依然在原位。',
            { durationMs: 5800 }
          );
        }
        announceBeatAdvance();
      }
    },
  });

  // Enter Level 14 directly: spotlight North Pedestal behind slit + 1 concise goal line!
  sanctuary3D.triggerOpeningPedestalSpotlight();
  const opening = hints.getOpeningLine();
  setTimeout(() => {
    voice.speak(opening.speaker, opening.text, { durationMs: 5200 });
  }, 350);

  const stepFrame = (dtSec = 1 / 24) => {
    if (!paused && !guideOpen && !teleporterOpen) {
      // Smoothly glide observer's w-layer during Tab collision inspection after a tilted bump
      const inspectStatus = state.stepInspectW(dtSec);
      if (!state.inspectModeActive) voice.dismissCue('wall-evidence');
      if (inspectStatus.arrivedAtEvidence && !coached.wallEvidenceNamed) {
        coached.wallEvidenceNamed = true;
        voice.speak(
          'tomb',
          '看红圈。换了一层，这里也有墙，这一片球身还在缝外。',
          { durationMs: 6800, cue: 'wall-evidence' }
        );
      }

      // Gentle nudge if player lingers on North Pedestal without restoring the sphere
      if (state.grabbed && !state.completed && state.isOnNorthPedestal()) {
        northStuckTimer += dtSec;
        if (northStuckTimer >= 12.0 && !coached.northRestoreNudge) {
          coached.northRestoreNudge = true;
          voice.speak('tomb', '还记得它刚才是怎么立起来的吗？', { durationMs: 5800 });
        }
      } else {
        northStuckTimer = 0;
      }

      const move = input.sampleMoveVector(dtSec);
      if (state.grabbed) {
        if (move.forward !== 0) {
          const speed = move.sprint ? 3.4 : 2.15;
          const wasBlocked = state.lastBlockEvent?.type === 'too_wide_for_slit';
          const res = state.pushOrbZ(move.forward * speed * dtSec);
          if (res.blocked && !wasBlocked) {
            sfx.playBlocked();
            grabStage.triggerBlockFlash();
            if (state.computeTiltedCollisionInspectW() !== 0) {
              sanctuary3D.triggerTiltedBump();
              hud.hideSliceCallout();
              if (state.viewMode !== 'side_xzw') {
                hud.setTabAttention(true);
              }
              if (!coached.tiltedBlocked) {
                coached.tiltedBlocked = true;
                voice.speak(
                  'tomb',
                  state.viewMode === 'side_xzw'
                    ? '球先别动。沿第四维换一层看看。'
                    : '眼前这片够薄了。刚才是哪里碰到了墙？',
                  { durationMs: 6400 }
                );
              }
            } else {
              sanctuary3D.triggerBarrierFlash();
              hud.flashEdge(PALETTE.accent.amberCoral);
            }
            hud.showBlockToast(state.lastBlockEvent?.message || '被墙挡住了');
          } else if (res.onNorthPedestal && !state.completed) {
            if (!coached.northArrived) {
              coached.northArrived = true;
              voice.speak('tomb', '球送到了。看看底座的形状。', { durationMs: 5800 });
            }
          }
          announceBeatAdvance();
        }
      } else if (move.forward !== 0 || move.right !== 0) {
        if (state.completed) {
          hud?.dismissVictoryBanner();
        }
        const speed = move.sprint ? 8.5 : 5.2;
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
          hud.showBlockToast(state.lastBlockEvent?.message || '缝隙太窄，人穿不过去');
          announceBeatAdvance();
        }
        if (res.justEnteredTeleporter) {
          sfx.playVictory();
          hud.flashEdge(PALETTE.accent.emerald);
          voice.speak('tomb', '传送台已启动，准备前往下一关。', { durationMs: 5600 });
          teleporterOpen = true;
          hud.setTeleporterVisible(true);
          syncPauseState();
        }
      }

      hints.update(dtSec, state.beat, state.completed, state.getCurrentPuzzlePhase());
    }

    // Render 3D scene & synchronize anchored HUD cues
    sanctuary3D.syncFromState(state, dtSec);
    grabStage.updateCamera(camera, state, input, dtSec);
    grabStage.renderSideView(state);
    consolePanel.render(state);
    const orbAnchor = sanctuary3D.getOrbScreenAnchor(camera);
    hud.sync(state, hints.getSnapshot(), orbAnchor);
    scene.render();
  };

  // Expose diagnostic & verification hooks
  globalThis.__BEYOND3D__ = {
    engine,
    state,
    hints,
    input,
    scene,
    sanctuary3D,
    principleGuide,
    grabStage,
    hud,
    voice,
    stepFrame,
    actions: {
      grab: () => {
        const r = state.setGrabbed(true);
        if (r.grabbed) {
          input.setGrabbed(true);
          hud.showWheelHandoffCue(4800);
          if (!coached.firstGrabWheel) {
            coached.firstGrabWheel = true;
            voice.speak('tomb', '现在，滚轮转动的是你手里的球。', { durationMs: 5000 });
          }
        }
        return r;
      },
      release: () => releaseGrabCleanly({ keepVictoryBanner: false }),
      toggleTab: handleToggleHonestView,
      requestHint: handleRequestHint,
      reset: handleReset,
      dismissGuide: () => principleGuide.hide(),
      showGuide: () => principleGuide.show(),
    },
  };

  // 8. Main 60 FPS Render & Simulation Loop
  let lastTime = performance.now();
  engine.runRenderLoop(() => {
    const now = performance.now();
    const dtSec = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;
    stepFrame(dtSec);
  });

  window.addEventListener('resize', () => {
    engine.resize();
  });
}

boot();
