/**
 * Beyond 3D — Application Bootstrap (Phase 1 Vertical Slice: Level 14 "发丝裂缝")
 * Level 14 Experience Flow:
 * 1. Enter the 3D Sanctuary directly (no blocking Principle modal on entry; I key opens 3D Principle Guide anytime).
 * 2. Opening voice immediately poses the puzzle goal: "如何让三维的球穿过这个四维墙壁？"
 * 3. Warm coin-analogy H-key hints & reactive coaching (rotation into 4D, Tab side view, W-axis cross-sections,
 *    90° upright passage, North Pedestal restoration) with ZERO "W=0切片" jargon.
 * 4. Passing Orb acts as the Key: restoring it on the North Pedestal automatically parts the twin 6.8m monolith walls
 *    and ignites the North Teleportation Pad (Z = 6.4) so the player walks straight through to the next level.
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
  let autoReleaseTimer = null;
  let paused = false;
  let guideOpen = false;
  let teleporterOpen = false;
  let audioUnlocked = false;

  // Reactive coin-analogy coaching milestones (each fires once per natural player discovery)
  const coached = {
    wScrollAllW: false,
    wScrollSphereSlices: false,
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
    state.setGrabbed(false);
    input.setGrabbed(false);
    // Face straight North through the parting twin monolith walls toward the North Teleportation Pad
    input.setLookAngles(0, 0.03);
    sfx.playGrabLock(false);
    if (state.completed && !keepVictoryBanner) {
      hud?.dismissVictoryBanner();
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
      sfx.playVictory();
      voice.speak(
        'tomb',
        '钥匙归位！球体已经在对面完好复原，四维巨墙正在为你打开。请穿过巨墙走上前方发光的传送台，前往下一关。',
        { durationMs: 8200 }
      );
      // Automatically release Grab Stage cleanly after a brief beat so the player watches
      // the twin 6.8m monolith walls part wide open in front of them and can walk right through!
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
    const res = hints.requestNextHint();
    const tierNames = ['思路启发', '操作方向', '完整解法'];
    voice.speak(res.speaker, res.text, {
      tierLabel: `${res.tier}级·${tierNames[res.tier - 1]}`,
      durationMs: 9200,
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
    input.setLookAngles(-0.20, 0.03);
    sanctuary3D.setHintHighlight(false);
    lastBeat = 0;
    victoryAnnounced = false;
    syncPauseState();
    const opening = hints.getOpeningLine();
    voice.speak(opening.speaker, opening.text, { durationMs: 6000 });
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

  // 5. Enlarged Interactive 3D Principle Briefing (opened manually via I key or button; never blocks entry!)
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
        announceBeatAdvance();
      } else {
        hud.showBlockToast('请再走近圆球一些，按 E 抓住它');
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
          '这样转动就像让平放的硬币在桌面上原地打转，球的宽度还是完整的两米，过不去狭缝。试试拨动鼠标滚轮，把球旋转到第四维度里。',
          { tierLabel: '思路提醒', durationMs: 7600 }
        );
      }
    },
    onWheel4D: (wheelUnits) => {
      if (state.grabbed) {
        // Grab Stage: Mouse Wheel = 4D Rotation into Fourth Dimension w!
        const deltaDeg = wheelUnits * 5.0;
        const wasBlade = state.isBladeThinEnough();
        const res = state.rotateOrb4D(deltaDeg);
        if (res.blocked) {
          sfx.playBlocked();
          sanctuary3D.triggerBarrierFlash();
          grabStage.triggerBlockFlash();
          hud.flashEdge(PALETTE.accent.amberCoral);
          hud.showBlockToast(state.lastBlockEvent?.message || '狭缝内空间不足，请先将球推到对面基座再放平');
        } else if (res.applied) {
          const isBladeNow = res.isBlade;
          sfx.playRotate4D(res.thetaDeg, !wasBlade && isBladeNow);

          // Exact requested narration when rotating the sphere into the 4th dimension!
          const distFrom0 = Math.min(res.thetaDeg, 360 - res.thetaDeg);
          if (!coached.slightTiltDisc && !isBladeNow && distFrom0 >= 4 && distFrom0 < 85) {
            coached.slightTiltDisc = true;
            voice.speak(
              'tomb',
              '球已经脱离当前三维空间，被旋转到了第四个维度，只在当前三维空间内留下一个球的切面，就像硬币旋转了几度后，只在二维平面留下一条直径一样。请继续在第四维度旋转球，直到旋转90度后让球在第四维度立起来。按Tab查看第四维度侧视图。',
              { tierLabel: '现象解析', durationMs: 11800 }
            );
          }

          // Reached 90° upright blade state
          if (!wasBlade && isBladeNow) {
            hud.flashEdge(PALETTE.accent.emerald);
            if (!coached.bladeAligned) {
              coached.bladeAligned = true;
              voice.speak(
                'tomb',
                '很好！这颗球已经在第四维度完全立起来了——它一点也没有被压扁，只是像一枚竖直的硬币一样把宽度藏进了第四维度。现在按 W 把它推过狭缝吧！',
                { tierLabel: '状态达成', durationMs: 8000 }
              );
            }
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

        // Exact requested narration when scrolling along w while the sphere is rotated and its slice grows/shrinks!
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
            '现在你看到的是在第四维度不同位置的球切面，所有切面拼接起来就是球的整体三维结构。换句话说，球被切成了不同的圆被分散放在了w轴上。',
            { tierLabel: '维度洞察', durationMs: 10500 }
          );
        } else if (!coached.wScrollAllW && !orbRotatedIntoW && Math.abs(res.w) >= 0.85 && !state.completed) {
          coached.wScrollAllW = true;
          voice.speak(
            'tomb',
            '你正在沿第四维度 w 轴移动，两旁的折页已虚实交替——但眼前的四维巨墙贯穿了整个 w 轴，靠平移绕不过去，得想办法转动那颗球。',
            { tierLabel: '现象提示', durationMs: 7400 }
          );
        }
        announceBeatAdvance();
      }
    },
  });

  // Enter Level 14 directly (DO NOT auto-show Principle modal on entry!)
  // Immediately announce the opening goal voice line (plays on first gesture via CharacterVoiceEngine)
  const opening = hints.getOpeningLine();
  setTimeout(() => {
    voice.speak(opening.speaker, opening.text, { durationMs: 6500 });
  }, 350);

  const stepFrame = (dtSec = 1 / 24) => {
    if (!paused && !guideOpen && !teleporterOpen) {
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
              voice.speak(
                'tomb',
                '就像只倾斜了一点点的硬币：它在纸面上只留一条细线，但翘在空中的硬币本体还是太宽，会卡在狭缝外。按 Tab 打开第四维度侧视图，继续滚轮转满 90 度让它彻底立直吧！',
                { tierLabel: '受阻原因', durationMs: 8800 }
              );
            }
            hud.showBlockToast(state.lastBlockEvent?.message || '圆球四维总宽大于狭缝，请先转满 90° 立直');
          } else if (res.onNorthPedestal && !state.completed && !coached.northArrived) {
            coached.northArrived = true;
            voice.speak(
              'tomb',
              '圆球已经完好穿过狭缝到达对面基座了！它现在还像竖立的硬币一样立在第四维度里，反向拨动滚轮把它重新放平，回到我们所在的三维空间吧。',
              { tierLabel: '最后一步', durationMs: 8000 }
            );
          }
          announceBeatAdvance();
        }
      } else if (move.forward !== 0 || move.right !== 0) {
        if (state.completed) {
          // Dismiss banner smoothly once player begins walking through the parted walls
          hud?.dismissVictoryBanner();
        }
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
          hud.showBlockToast('四维巨墙贯穿整个 w 轴，需先将圆球送过狭缝作为钥匙打开它');
          announceBeatAdvance();
        }
        if (res.justEnteredTeleporter) {
          sfx.playVictory();
          hud.flashEdge(PALETTE.accent.emerald);
          voice.speak(
            'tomb',
            '传送台已启动！你已经真正理解了四维旋转的奥秘，准备前往下一关。',
            { durationMs: 6500 }
          );
          teleporterOpen = true;
          hud.setTeleporterVisible(true);
          syncPauseState();
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
        if (r.grabbed) input.setGrabbed(true);
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
