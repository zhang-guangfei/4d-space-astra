/**
 * Beyond 3D — Deterministic 4D Mathematics & Geometric Invariants Test Suite
 * Strictly enforces 05-from-zero-build-plan.md §3.1:
 * 1. Core 4D Euclidean distance, SO(4) coordinate-plane rotations (all 6 planes), det = +1, norm preservation
 * 2. SO(3) unit quaternion Slerp geodesic accuracy & signed 3D volume determinant
 * 3. Level 14 rigid-body invariant sqrt(xMax^2 + wMax^2 - eps^2) === 1.000 m (< 1e-12) across [0°, 180°]
 *    plus exact W = c cross-section equation verification
 * 4. Level 15 2-sphere slice circle center X = c*cot(theta) & radius r = sqrt(R^2 - c^2/sin^2(theta)) (< 1e-12)
 * 5. Level 16 chiral key: det > +1.5 under ALL 64 signed 3D orthogonal rotations & arbitrary quaternions;
 *    XW 180° rotation yields det < -1.5 while ALL 15 pairwise 4D distances stay constant (< 1e-12)!
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  degToRad,
  det4,
  dist4,
  dot4,
  makePlaneRotationMatrix4,
  mulMat4,
  mulMat4Vec4,
  norm4,
  qFromAxisAngle,
  qIdentity,
  qMul,
  qRotateVec3,
  qSlerp,
  rotPlane4,
  signedVolume3D,
  sliceSegmentWithHyperplaneW,
  transpose4,
} from '../src/core/math4d.js';

import {
  LEVEL14_CONFIG,
  computeKeyChiralityDet,
  computeLevel15SphereSliceCircle,
  computeOblateSpheroidExtents,
  computeOblateSpheroidSliceAtW,
  computePairwiseDistances4D,
  createLevel16ChiralKeyVertices,
  sampleOblateDiskXW,
  transformKeySO3,
  transformKeyXW,
} from '../src/core/sanctuary-4d.js';

const TOL = 1e-12;

test('math4d: dist4, norm4, and all 6 SO(4) plane rotations preserve 4D norm & pairwise distance', () => {
  const a = [1.25, -2.5, 0.75, 3.1];
  const b = [-0.8, 1.9, -2.2, 0.4];
  const origDist = dist4(a, b);
  const origNormA = norm4(a);

  const pairs = [
    [0, 1],
    [0, 2],
    [1, 2],
    [0, 3],
    [1, 3],
    [2, 3],
  ];

  for (const [i, j] of pairs) {
    for (const deg of [0, 30, 45, 90, 137.5, 180, 270]) {
      const rad = degToRad(deg);
      const ra = rotPlane4(a, i, j, rad);
      const rb = rotPlane4(b, i, j, rad);

      assert.ok(Math.abs(norm4(ra) - origNormA) < TOL, `Norm drift in plane (${i},${j}) at ${deg}°`);
      assert.ok(Math.abs(dist4(ra, rb) - origDist) < TOL, `Dist drift in plane (${i},${j}) at ${deg}°`);

      const mat = makePlaneRotationMatrix4(i, j, rad);
      assert.ok(Math.abs(det4(mat) - 1) < TOL, `SO(4) matrix det must be +1`);
      const mra = mulMat4Vec4(mat, a);
      assert.ok(dist4(ra, mra) < TOL, `rotPlane4 must match matrix multiplication`);

      // Orthogonality: M^T * M = I
      const prod = mulMat4(transpose4(mat), mat);
      for (let r = 0; r < 4; r += 1) {
        for (let c = 0; c < 4; c += 1) {
          assert.ok(Math.abs(prod[r][c] - (r === c ? 1 : 0)) < TOL);
        }
      }
    }
  }
});

test('math4d: SO(3) quaternion qSlerp and signedVolume3D accuracy', () => {
  const q0 = qIdentity();
  const q90 = qFromAxisAngle([0, 1, 0], Math.PI / 2);
  const qHalf = qSlerp(q0, q90, 0.5);

  // Rotating [1,0,0] by 45° around +Y -> [cos45, 0, -sin45]
  const v = qRotateVec3(qHalf, [1, 0, 0]);
  const s = Math.SQRT1_2;
  assert.ok(Math.abs(v[0] - s) < TOL);
  assert.ok(Math.abs(v[1]) < TOL);
  assert.ok(Math.abs(v[2] + s) < TOL);

  // Unit tetrahedron signed volume = +1/6; reflected along X = -1/6
  const tetra = [
    [0, 0, 0, 0],
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
  ];
  assert.ok(Math.abs(signedVolume3D(tetra) - 1 / 6) < TOL);
  const reflected = tetra.map((p) => rotPlane4(p, 'X', 'W', Math.PI));
  assert.ok(Math.abs(signedVolume3D(reflected) + 1 / 6) < TOL);

  // Hyperplane W=0 segment slicing
  const hit = sliceSegmentWithHyperplaneW([0, 2, 0, -1], [4, 2, 0, 3], 0);
  assert.ok(hit && Math.abs(hit[0] - 1) < TOL && Math.abs(hit[3]) < TOL);
});

test('Level 14 invariant: rigid-body radius sqrt(xMax^2 + wMax^2 - eps^2) === 1.000m (< 1e-12) for all theta in [0°, 180°]', () => {
  const { radiusR: R, wHalfThickness: eps, slitHalfWidth } = LEVEL14_CONFIG;

  for (let deg = 0; deg <= 180; deg += 1) {
    const rad = degToRad(deg);
    const ext = computeOblateSpheroidExtents(rad, R, eps);
    assert.ok(
      Math.abs(ext.rigidRadiusInvariant - 1.0) < TOL,
      `Invariant drift at ${deg}°: ${ext.rigidRadiusInvariant}`
    );

    // Every sampled point on the rotated X-W oblate disk must obey |x| <= xMax and |w| <= wMax
    const pts = sampleOblateDiskXW(rad, 96, R, eps);
    for (const pt of pts) {
      assert.ok(Math.abs(pt.x) <= ext.xMax + TOL);
      assert.ok(Math.abs(pt.w) <= ext.wMax + TOL);
    }
  }

  // Exact key angles from GDD (Option A: eps = 0.001m near-zero W-thickness)
  const at0 = computeOblateSpheroidExtents(0);
  assert.ok(Math.abs(at0.xMax - 1.0) < TOL);
  assert.ok(Math.abs(at0.wMax - 0.001) < TOL);

  const at90 = computeOblateSpheroidExtents(degToRad(90));
  assert.ok(Math.abs(at90.xMax - 0.001) < TOL);
  assert.ok(Math.abs(at90.wMax - 1.0) < TOL);
  assert.ok(at90.xMax < slitHalfWidth, '90° blade half-width 0.001m must fit cleanly inside 0.082m slit');

  // Option A geometric honesty check: at just 5° tilt, W=0 slice immediately collapses to a razor-thin disc (< 0.015m),
  // while total 4D X-span xMax is still > 0.99m (so All-W monolith still blocks until ~90°!)
  const sliceAt5 = computeOblateSpheroidSliceAtW(degToRad(5), 0, R, eps);
  assert.ok(sliceAt5.semiX < 0.015, `At 5°, W=0 slice should immediately flatten (<0.015m), got ${sliceAt5.semiX}`);
  assert.ok(sliceAt5.xMax > 0.99, `At 5°, total 4D xMax should still be >0.99m, got ${sliceAt5.xMax}`);

  // Verify ±4.4° tolerance window (86° fits <= 0.078m < 0.082m; 85° exceeds 0.082m)
  const at86 = computeOblateSpheroidExtents(degToRad(86));
  const at85 = computeOblateSpheroidExtents(degToRad(85));
  assert.ok(at86.xMax < slitHalfWidth, `86° xMax=${at86.xMax} should clear slit ${slitHalfWidth}`);
  assert.ok(at85.xMax > slitHalfWidth, `85° xMax=${at85.xMax} should be blocked by slit ${slitHalfWidth}`);

  // Verify analytical W = c cross-section equation satisfies implicit ellipsoid boundary to < 1e-12
  for (const deg of [20, 45, 72, 90]) {
    const rad = degToRad(deg);
    const { wMax } = computeOblateSpheroidExtents(rad, R, eps);
    const wSlice = wMax * 0.45;
    const sl = computeOblateSpheroidSliceAtW(rad, wSlice, R, eps);
    assert.equal(sl.intersects, true);

    // Check extreme X boundary point (xCenter + semiX, 0, 0, wSlice) lies strictly on ellipsoid surface (= 1)
    const bx = sl.xCenter + sl.semiX;
    const [x0, , , w0] = rotPlane4([bx, 0, 0, wSlice], 'X', 'W', -rad);
    const implicit = (x0 * x0) / (R * R) + (w0 * w0) / (eps * eps);
    assert.ok(Math.abs(implicit - 1.0) < TOL, `Slice boundary implicit value=${implicit} at ${deg}°`);
  }
});

test('Level 15 analytical invariant: 2-sphere XW-rotated slice circle exact to < 1e-12', () => {
  const R = 3.0;
  const cases = [
    { deg: 90, c: 0.0, expectedX: 0.0, expectedR: 3.0 },
    { deg: 45, c: 1.8, expectedX: 1.8, expectedR: Math.sqrt(R * R - 1.8 * 1.8 * 2) },
    { deg: 45, c: -1.8, expectedX: -1.8, expectedR: Math.sqrt(R * R - 1.8 * 1.8 * 2) },
    { deg: 60, c: 1.2, expectedX: 1.2 / Math.tan(degToRad(60)), expectedR: Math.sqrt(R * R - (1.2 / Math.sin(degToRad(60))) ** 2) },
  ];

  for (const tc of cases) {
    const rad = degToRad(tc.deg);
    const res = computeLevel15SphereSliceCircle(rad, tc.c, R);
    assert.ok(res && res.type === 'circle');
    assert.ok(Math.abs(res.centerX - tc.expectedX) < TOL);
    assert.ok(Math.abs(res.radius - tc.expectedR) < TOL);

    // Verify a point on the slice circle un-rotated by -theta lies on X0^2 + Y0^2 + Z0^2 = R^2, W0 = 0
    const sample4D = [res.centerX, res.radius * Math.cos(0.7), res.radius * Math.sin(0.7), tc.c];
    const orig = rotPlane4(sample4D, 'X', 'W', -rad);
    assert.ok(Math.abs(orig[3]) < TOL, 'Un-rotated 2-sphere point must lie in W0 = 0');
    assert.ok(Math.abs(dot4(orig, orig) - R * R) < TOL, 'Un-rotated 2-sphere point must have norm R');
  }

  // Outside |c| > R sin(theta) must return null
  assert.equal(computeLevel15SphereSliceCircle(degToRad(45), 2.5, R), null);
});

test('Level 16 chirality invariant: det > +1.5 across all 64 3D orthogonal rotations & quaternions; XW 180° flips det < -1.5 with all 15 4D distances invariant (< 1e-12)', () => {
  const key = createLevel16ChiralKeyVertices();
  const baseDet = computeKeyChiralityDet(key);
  assert.ok(Math.abs(baseDet - 1.68) < TOL, `Base chiral key det must be +1.68, got ${baseDet}`);

  const baseDistances = computePairwiseDistances4D(key);
  assert.equal(baseDistances.length, 15, '6-vertex key must have C(6,2) = 15 pairwise distances');

  // Test all 4^3 = 64 combinations of 90° Euler rotations around X, Y, Z (all in SO(3))
  const angles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
  let count = 0;
  for (const ax of angles) {
    for (const ay of angles) {
      for (const az of angles) {
        const q = qMul(
          qFromAxisAngle([1, 0, 0], ax),
          qMul(qFromAxisAngle([0, 1, 0], ay), qFromAxisAngle([0, 0, 1], az))
        );
        const rotated = transformKeySO3(key, q);
        const d = computeKeyChiralityDet(rotated);
        assert.ok(d > 1.5, `SO(3) rotation #${count} must keep det > +1.5, got ${d}`);
        count += 1;
      }
    }
  }
  assert.equal(count, 64);

  // Also test arbitrary non-axis-aligned quaternions
  for (let k = 1; k <= 12; k += 1) {
    const q = qFromAxisAngle([k, k * 1.7 - 3, Math.sin(k)], k * 0.61);
    const d = computeKeyChiralityDet(transformKeySO3(key, q));
    assert.ok(d > 1.5);
  }

  // Now apply 4D rigid XW rotation from 0° to 180°: all 15 pairwise 4D distances stay constant to < 1e-12!
  for (const deg of [30, 60, 90, 120, 150, 180]) {
    const rotated4D = transformKeyXW(key, degToRad(deg));
    const dists = computePairwiseDistances4D(rotated4D);
    for (let i = 0; i < 15; i += 1) {
      assert.ok(
        Math.abs(dists[i] - baseDistances[i]) < TOL,
        `4D distance #${i} drifted at ${deg}°: ${dists[i]} vs ${baseDistances[i]}`
      );
    }
  }

  // At 90°, key collapses to flat section in W=0 (det === 0)
  const at90Det = computeKeyChiralityDet(transformKeyXW(key, degToRad(90)));
  assert.ok(Math.abs(at90Det) < TOL, `At XW=90°, 3D signed det must be 0, got ${at90Det}`);

  // At 180°, key is strictly mirror-flipped (det === -1.68 < -1.5)
  const at180Det = computeKeyChiralityDet(transformKeyXW(key, degToRad(180)));
  assert.ok(at180Det < -1.5 && Math.abs(at180Det + 1.68) < TOL);
});
