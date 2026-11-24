/**
 * Beyond 3D — Application Bootstrap (Phase 1 Vertical Slice: Level 14 "发丝裂缝")
 * Wires:
 * - Pure 4D Math & Level 14 State Machine (src/core/sanctuary-4d.js)
 * - 45s / H-Key Tiered Oral Hints (src/core/tiered-hints.js)
 * - AAA PBR C-Zone Sanctuary Landmark (src/levels/chapter2-sanctuary.js)
 * - Unified D8 Input Controller + Third-Person Grab Stage + Honest XZW Side View
 * - Interactive Opening 2D->3D->4D Principle Guide (I key) + Reactive Phenomenon Coaching
 * - Post-victory clean E-release back to free South-side exploration
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

  const camera = new B.FreeCamera('sanctuary_cam', new B.Vector3(1.55, 1.85, -7.8), scene);
  camera.minZ = 0.08;
  camera.maxZ = 120;
  camera.fov = 0.9;

  // 2. Pure Core State & Tiered Hints (Level 14)
  const state = new Level14HairlineSlitState();
  const hints = new TieredHintController(14);
  let lastBeat = 0;
  let victoryAnnounced = false;
  let paused = false;
  let guideOpen = false;
  let audioUnlocked = false;
  let openingPlayed = false;

  // Reactive geometric phenomenon coaching milestones (fires once per genuine player discovery!)
  const coached = {
    wScrollAllW: false,
    drag3DInvariant: false,
    slightTiltDisc: false,
    tiltedBlocked: false,
    bladeAligned: false,
    northArrived: false,
  };
  const resetCoaching = () => {
    for (const k of Object.keys(coached)) coached[k] = false;
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
    input.setPaused(paused || guideOpen);
  };

  const unlockAudioOnce = () => {
    if (audioUnlocked) return;
    audioUnlocked = true;
    sfx.unlock();
    sfx.startSanctuaryAmbience();
    voice.unlockOnGesture();
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
        '你没有压扁它，只是借第四维立起了它。圣殿内门已敞开——按 E 随时解除操控自由漫游。',
        { durationMs: 6800 }
      );
    }
  };

  const releaseGrabCleanly = () => {
    if (!state.grabbed) return;
    state.setGrabbed(false);
    input.setGrabbed(false);
    // Restore unobstructed South-side facing so player is NEVER trapped behind the monolith!
    input.setLookAngles(0, 0.04);
    sfx.playGrabLock(false);
    if (state.completed) {
      hud?.dismissVictoryBanner();
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
    resetCoaching();
    hud?.resetBanner();
    input.setGrabbed(false);
    input.setLookAngles(-0.20, 0.03);
    sanctuary3D.setHintHighlight(false);
    lastBeat = 0;
    victoryAnnounced = false;
    const opening = hints.getOpeningLine();
    voice.speak(opening.speaker, opening.text, { durationMs: 5600 });
  };

  const handleTogglePause = () => {
    if (guideOpen) {
      principleGuide.hide();
      return;
    }
    paused = !paused;
    syncPauseState();
    hud.setPaused(paused);
  };

  // 5. Interactive Opening Principle Briefing (I key)
  const principleGuide = new PrincipleGuideController({
    onVisibilityChange: (isOpen) => {
      guideOpen = isOpen;
      if (isOpen) unlockAudioOnce();
      syncPauseState();
    },
    onDismissed: () => {
      unlockAudioOnce();
      if (!openingPlayed) {
        openingPlayed = true;
        const opening = hints.getOpeningLine();
        voice.speak(opening.speaker, opening.text, { durationMs: 6000 });
      }
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
    onReleaseAfterVictory: releaseGrabCleanly,
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
    onToggleConsole: () => {
      const expanded = consolePanel.toggle();
      hud.setConsoleExpanded(expanded);
    },
    onRequestHint: handleRequestHint,
    onReset: handleReset,
    onInteract: () => {
      // ALWAYS allow pressing E to release Grab Stage — including AFTER victory!
      if (state.grabbed) {
        releaseGrabCleanly();
        return;
      }
      if (state.completed) return;
      const res = state.setGrabbed(true);
      if (res.grabbed) {
        input.setGrabbed(true);
        sfx.playGrabLock(true);
        announceBeatAdvance();
      } else {
        hud.showBlockToast('请再走近通行珠一些，按 E 抓取');
      }
    },
    onGrabDrag3D: (deltaYaw, deltaPitch) => {
      // Lock 3D rotation axes in Tab Side View so mouse movement never disorients the player
      if (state.viewMode === 'side_xzw') return;
      state.rotateOrb3D(deltaYaw, deltaPitch);
      if (!coached.drag3DInvariant && state.hasRotated3DWhileGrabbed && !state.hasRotated4DWhileGrabbed) {
        coached.drag3DInvariant = true;
        voice.speak(
          'tomb',
          '三维旋转只能让球原地翻滚，它沿 X 轴的跨度仍是完整的 2.00 米。试试拨动鼠标滚轮。',
          { tierLabel: '现象洞察', durationMs: 5600 }
        );
      }
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

          // Reactive Coaching Moment C: Instant 2D disc collapse upon slight 4D tilt!
          const distFrom0 = Math.min(res.thetaDeg, 360 - res.thetaDeg);
          if (!coached.slightTiltDisc && !isBladeNow && distFrom0 >= 4 && distFrom0 <= 45) {
            coached.slightTiltDisc = true;
            voice.speak(
              'tomb',
              '刚转几度，W=0 切片就瞬间坍缩成了二维圆盘——但球在 W≠0 的部分仍很宽，按 Tab 看 XZW 侧视！',
              { tierLabel: '原理洞察', durationMs: 6400 }
            );
          }

          // Reactive Coaching Moment E: Full 90° alignment into YZW hyperplane!
          if (!wasBlade && isBladeNow) {
            hud.flashEdge(PALETTE.accent.emerald);
            if (!coached.bladeAligned) {
              coached.bladeAligned = true;
              voice.speak(
                'tomb',
                '整颗球已完整立入 YZW 超平面——半径仍是 1.00 米，从未被压扁，只是把两米直径藏进了第四维。',
                { tierLabel: '原理洞察', durationMs: 6200 }
              );
            }
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

        // Reactive Coaching Moment A: Explaining why W-translation shifts arches but NOT monolith!
        if (!coached.wScrollAllW && Math.abs(res.w) >= 0.85) {
          coached.wScrollAllW = true;
          voice.speak(
            'tomb',
            '你确实沿 W 轴穿行了，两旁折页已虚实交替——但这座石碑贯穿所有 W 层，靠移动你自己无法绕过。',
            { tierLabel: '现象洞察', durationMs: 6200 }
          );
        }
        announceBeatAdvance();
      }
    },
  });

  // Show Interactive Opening Principle Briefing unless URL specifies ?skipGuide=1
  const params = new URLSearchParams(window.location.search);
  if (params.get('skipGuide') === '1') {
    openingPlayed = true;
    const opening = hints.getOpeningLine();
    setTimeout(() => {
      voice.speak(opening.speaker, opening.text, { durationMs: 5600 });
    }, 450);
  } else {
    principleGuide.show();
  }

  const stepFrame = (dtSec = 1 / 24) => {
    if (!paused && !guideOpen) {
      const move = input.sampleMoveVector(dtSec);
      if (state.grabbed) {
        if (move.forward !== 0) {
          const speed = move.sprint ? 3.4 : 2.15;
          const res = state.pushOrbZ(move.forward * speed * dtSec);
          if (res.blocked) {
            sfx.playBlocked();
            sanctuary3D.triggerBarrierFlash();
            grabStage.triggerBlockFlash();
            hud.flashEdge(PALETTE.accent.amberCoral);
            const distFrom0 = Math.min(state.thetaDeg, 360 - state.thetaDeg);
            if (!coached.tiltedBlocked && distFrom0 >= 4 && distFrom0 < 85) {
              coached.tiltedBlocked = true;
              const xMaxVal = state.getExtents().xMax.toFixed(2);
              voice.speak(
                'tomb',
                `别被 W=0 的薄片迷惑——它在 W≠0 处仍横跨 ${xMaxVal} 米，撞上了全 W 巨墙。继续转满 90°！`,
                { tierLabel: '原理洞察', durationMs: 6400 }
              );
            }
            hud.showBlockToast(state.lastBlockEvent?.message || '圆球四维总宽大于窄缝，无法通过');
          } else if (res.onNorthPedestal && !state.completed && !coached.northArrived) {
            coached.northArrived = true;
            voice.speak(
              'tomb',
              '它已完好穿过发丝裂缝抵达北侧基座。此刻它仍立在第四维里——怎样让它重新回到 W=0？',
              { tierLabel: '思考引导', durationMs: 6000 }
            );
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

      hints.update(dtSec, state.beat, state.completed);
    }

    // Always render 3D backdrop & HUD cleanly even behind modal
    sanctuary3D.syncFromState(state, dtSec);
    grabStage.updateCamera(camera, state, input, dtSec);
    grabStage.renderSideView(state);
    consolePanel.render(state);
    hud.sync(state, hints.getSnapshot());
    scene.render();
  };

  // Expose diagnostic & deterministic demo-capture hooks
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
        if (r.grabbed) input.setGrabbed(true);
        return r;
      },
      release: releaseGrabCleanly,
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
