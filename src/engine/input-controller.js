/**
 * Beyond 3D — Unified D8 Input Controller
 *
 * Strict D8 Mapping:
 * - Walk Mode:
 *   * Mouse Move (Pointer Lock OR Left-Drag fallback) = First-person 360° look
 *   * WASD (+ Shift sprint) = Walk on XZ plane
 *   * Mouse Wheel = Sole 4D control: translate smoothly along W axis
 *   * E = Grab nearby 4D object (enter Third-Person Grab Stage)
 * - Grab Stage Mode:
 *   * Mouse Left-Drag = Pure 3D SO(3) rotation of grabbed object
 *   * Mouse Wheel = Sole 4D control: 4D rigid rotation around preset plane (XW around YZ)
 *   * W / S = Push / pull object along track (e.g. through Level 14 hairline slit)
 *   * E = Release object back to Walk Mode
 * - Global:
 *   * Tab = Toggle Honest Dual View (Slice W=0 + 4D Projection ⇄ Side View XZW)
 *   * F = Fold / unfold Right-Side Hyper-Holographic Console
 *   * H = Request next Tiered Oral Hint (Tier 1 -> 2 -> 3)
 *   * R = Reset current level
 *   * Esc = Pause / Level Roadmap / Settings
 */

import { clamp } from '../core/math4d.js';

export class InputController {
  constructor(canvas, callbacks = {}) {
    this.canvas = canvas;
    this.cb = callbacks;

    this.keys = new Set();
    this.paused = false;
    this.grabbed = false;
    this.pointerLocked = false;
    this.dragging = false;
    this.lastMouseX = 0;
    this.lastMouseY = 0;

    this.yaw = -0.20; // Diagonal hero framing of Passing Orb + Twin Monolith Hairline Slit
    this.pitch = 0.03;
    this.mouseSensitivity = 0.0024;
    this.wheelSensitivity = 1.0;

    this._bindEvents();
  }

  setPaused(paused) {
    this.paused = Boolean(paused);
    if (this.paused) {
      this.keys.clear();
      this.dragging = false;
      this.releasePointerLock();
    }
  }

  setGrabbed(grabbed) {
    this.grabbed = Boolean(grabbed);
    if (this.grabbed) {
      // In Grab Stage, cursor is free so Left-Drag performs crisp SO(3) 3D rotation
      this.releasePointerLock();
    }
  }

  setLookAngles(yaw, pitch) {
    this.yaw = yaw;
    this.pitch = clamp(pitch, -1.25, 1.25);
  }

  requestPointerLock() {
    if (this.grabbed || this.paused) return;
    if (this.canvas && typeof this.canvas.requestPointerLock === 'function') {
      try {
        const res = this.canvas.requestPointerLock();
        if (res && typeof res.catch === 'function') {
          res.catch(() => {});
        }
      } catch {
        // Gracefully fall back to drag-look if embedded iframe restricts pointer lock
      }
    }
  }

  releasePointerLock() {
    if (document.pointerLockElement === this.canvas && document.exitPointerLock) {
      try {
        document.exitPointerLock();
      } catch {
        // ignore
      }
    }
  }

  _bindEvents() {
    this._onPointerLockChange = () => {
      this.pointerLocked = document.pointerLockElement === this.canvas;
      this.cb.onPointerLockChange?.(this.pointerLocked);
    };

    this._onMouseDown = (e) => {
      if (this.paused) return;
      this.cb.onUserGesture?.();
      if (e.button === 0) {
        this.dragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        // In walk mode, clicking canvas also attempts pointer lock for FPS immersion
        if (!this.grabbed && !this.pointerLocked) {
          this.requestPointerLock();
        }
      }
    };

    this._onMouseUp = () => {
      this.dragging = false;
    };

    this._onMouseMove = (e) => {
      if (this.paused) return;

      let dx = 0;
      let dy = 0;
      if (this.pointerLocked && !this.grabbed) {
        dx = e.movementX || 0;
        dy = e.movementY || 0;
      } else if (this.dragging) {
        dx = e.clientX - this.lastMouseX;
        dy = e.clientY - this.lastMouseY;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      } else {
        return;
      }

      if (this.grabbed) {
        // Left-drag rotates the grabbed object in pure 3D SO(3)
        const rotYaw = -dx * 0.0085 * this.wheelSensitivity;
        const rotPitch = -dy * 0.0085 * this.wheelSensitivity;
        this.cb.onGrabDrag3D?.(rotYaw, rotPitch);
      } else {
        this.yaw += dx * this.mouseSensitivity;
        this.pitch = clamp(this.pitch - dy * this.mouseSensitivity, -1.25, 1.25);
      }
    };

    this._onWheel = (e) => {
      if (this.paused) return;
      e.preventDefault();
      this.cb.onUserGesture?.();

      // Normalize wheel delta across trackpads & discrete mouse wheels
      const raw = clamp(e.deltaY, -140, 140);
      const dir = -raw / 100; // Scroll UP -> positive (+W or +theta)
      this.cb.onWheel4D?.(dir * this.wheelSensitivity);
    };

    this._onKeyDown = (e) => {
      // Allow Esc even while paused
      if (e.code === 'Escape') {
        e.preventDefault();
        this.cb.onTogglePause?.();
        return;
      }
      if (this.paused) return;
      this.cb.onUserGesture?.();

      if (e.code === 'Tab') {
        e.preventDefault();
        if (!e.repeat) this.cb.onToggleHonestView?.();
        return;
      }

      if (e.code === 'KeyE' && !e.repeat) {
        e.preventDefault();
        this.cb.onInteract?.();
        return;
      }

      if (e.code === 'KeyF' && !e.repeat) {
        e.preventDefault();
        this.cb.onToggleConsole?.();
        return;
      }

      if (e.code === 'KeyH' && !e.repeat) {
        e.preventDefault();
        this.cb.onRequestHint?.();
        return;
      }

      if (e.code === 'KeyR' && !e.repeat) {
        e.preventDefault();
        this.cb.onReset?.();
        return;
      }

      // Silent accessibility wheel aliases ([ / ] or PageUp / PageDown) for trackpad-less testing
      if (e.code === 'BracketRight' || e.code === 'PageUp') {
        e.preventDefault();
        this.cb.onWheel4D?.(0.85 * this.wheelSensitivity);
        return;
      }
      if (e.code === 'BracketLeft' || e.code === 'PageDown') {
        e.preventDefault();
        this.cb.onWheel4D?.(-0.85 * this.wheelSensitivity);
        return;
      }

      this.keys.add(e.code);
    };

    this._onKeyUp = (e) => {
      this.keys.delete(e.code);
    };

    this._onBlur = () => {
      this.keys.clear();
      this.dragging = false;
    };

    document.addEventListener('pointerlockchange', this._onPointerLockChange);
    this.canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('mouseup', this._onMouseUp);
    window.addEventListener('mousemove', this._onMouseMove);
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    window.addEventListener('blur', this._onBlur);
  }

  /**
   * Read per-frame continuous movement intent from WASD + Shift.
   */
  sampleMoveVector(dtSec) {
    if (this.paused) {
      return { forward: 0, right: 0, sprint: false, dtSec };
    }
    let forward = 0;
    let right = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) right += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) right -= 1;
    const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    return { forward, right, sprint, dtSec };
  }

  dispose() {
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    this.canvas.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('blur', this._onBlur);
  }
}
