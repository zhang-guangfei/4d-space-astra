/**
 * Beyond 3D — Pure 4D Euclidean Mathematics Kernel
 * Zero DOM / Zero WebGL dependencies; deterministic Node.js & browser ESM.
 */

export const EPSILON = 1e-12;

export const AXIS_INDEX = Object.freeze({
  X: 0,
  Y: 1,
  Z: 2,
  W: 3,
  x: 0,
  y: 1,
  z: 2,
  w: 3,
});

export const PLANES_4D = Object.freeze(['XY', 'XZ', 'YZ', 'XW', 'YW', 'ZW']);

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function degToRad(deg) {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad) {
  return (rad * 180) / Math.PI;
}

export function normalizeAngleDeg(deg) {
  let out = deg % 360;
  if (out < 0) out += 360;
  return out;
}

/**
 * Shortest unsigned angular distance in degrees on a circle (0..180).
 */
export function angularDistanceDeg(a, b) {
  const diff = Math.abs(normalizeAngleDeg(a) - normalizeAngleDeg(b));
  return diff > 180 ? 360 - diff : diff;
}

/**
 * Shortest angular distance in degrees modulo 180 (0..90).
 * Useful for symmetric axes like 0° / 180° or 90° / 270°.
 */
export function angularDistanceMod180Deg(a, b) {
  let diff = Math.abs(normalizeAngleDeg(a) - normalizeAngleDeg(b)) % 180;
  if (diff > 90) diff = 180 - diff;
  return diff;
}

// ---------------------------------------------------------------------------
// 4D Vectors
// ---------------------------------------------------------------------------

export function vec4(x = 0, y = 0, z = 0, w = 0) {
  return [x, y, z, w];
}

export function add4(a, b) {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];
}

export function sub4(a, b) {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2], a[3] - b[3]];
}

export function scale4(v, s) {
  return [v[0] * s, v[1] * s, v[2] * s, v[3] * s];
}

export function dot4(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
}

export function normSq4(v) {
  return v[0] * v[0] + v[1] * v[1] + v[2] * v[2] + v[3] * v[3];
}

export function norm4(v) {
  return Math.sqrt(normSq4(v));
}

export function dist4(a, b) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  const dz = a[2] - b[2];
  const dw = a[3] - b[3];
  return Math.sqrt(dx * dx + dy * dy + dz * dz + dw * dw);
}

export function normalize4(v) {
  const len = norm4(v);
  if (len <= EPSILON) return [0, 0, 0, 0];
  return [v[0] / len, v[1] / len, v[2] / len, v[3] / len];
}

export function lerp4(a, b, t) {
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
    lerp(a[3], b[3], t),
  ];
}

// ---------------------------------------------------------------------------
// SO(4) Coordinate-Plane Orthogonal Rotations & 4x4 Matrices
// ---------------------------------------------------------------------------

function resolveAxis(axis) {
  if (typeof axis === 'number' && Number.isInteger(axis) && axis >= 0 && axis <= 3) {
    return axis;
  }
  if (typeof axis === 'string' && axis in AXIS_INDEX) {
    return AXIS_INDEX[axis];
  }
  throw new RangeError(`Invalid 4D axis specifier: ${String(axis)}`);
}

/**
 * Orthogonal rotation in coordinate plane (i, j) by angle `rad` (radians).
 * Preserves 4D Euclidean norm and all pairwise distances exactly (det = +1).
 *
 * Example: rotPlane4(v, 0, 3, rad) or rotPlane4(v, 'X', 'W', rad)
 * rotates in the XW plane (i.e. around the YZ plane).
 */
export function rotPlane4(v, i, j, rad) {
  const ai = resolveAxis(i);
  const aj = resolveAxis(j);
  if (ai === aj) {
    throw new RangeError('Rotation plane requires two distinct axes.');
  }
  const out = [v[0], v[1], v[2], v[3]];
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  const vi = v[ai];
  const vj = v[aj];
  out[ai] = vi * c - vj * s;
  out[aj] = vi * s + vj * c;
  return out;
}

export function identityMat4() {
  return [
    [1, 0, 0, 0],
    [0, 1, 0, 0],
    [0, 0, 1, 0],
    [0, 0, 0, 1],
  ];
}

export function makePlaneRotationMatrix4(i, j, rad) {
  const ai = resolveAxis(i);
  const aj = resolveAxis(j);
  if (ai === aj) {
    throw new RangeError('Rotation plane requires two distinct axes.');
  }
  const m = identityMat4();
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  m[ai][ai] = c;
  m[ai][aj] = -s;
  m[aj][ai] = s;
  m[aj][aj] = c;
  return m;
}

export function mulMat4Vec4(m, v) {
  return [
    m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2] + m[0][3] * v[3],
    m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2] + m[1][3] * v[3],
    m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2] + m[2][3] * v[3],
    m[3][0] * v[0] + m[3][1] * v[1] + m[3][2] * v[2] + m[3][3] * v[3],
  ];
}

export function mulMat4(a, b) {
  const out = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ];
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 4; c += 1) {
      out[r][c] =
        a[r][0] * b[0][c] +
        a[r][1] * b[1][c] +
        a[r][2] * b[2][c] +
        a[r][3] * b[3][c];
    }
  }
  return out;
}

export function transpose4(m) {
  return [
    [m[0][0], m[1][0], m[2][0], m[3][0]],
    [m[0][1], m[1][1], m[2][1], m[3][1]],
    [m[0][2], m[1][2], m[2][2], m[3][2]],
    [m[0][3], m[1][3], m[2][3], m[3][3]],
  ];
}

export function det3(a, b, c) {
  return (
    a[0] * (b[1] * c[2] - b[2] * c[1]) -
    a[1] * (b[0] * c[2] - b[2] * c[0]) +
    a[2] * (b[0] * c[1] - b[1] * c[0])
  );
}

/**
 * Exact 4x4 matrix determinant via cofactor expansion along row 0.
 */
export function det4(m) {
  const minor = (colSkip) => {
    const cols = [0, 1, 2, 3].filter((c) => c !== colSkip);
    return det3(
      [m[1][cols[0]], m[1][cols[1]], m[1][cols[2]]],
      [m[2][cols[0]], m[2][cols[1]], m[2][cols[2]]],
      [m[3][cols[0]], m[3][cols[1]], m[3][cols[2]]]
    );
  };
  return (
    m[0][0] * minor(0) -
    m[0][1] * minor(1) +
    m[0][2] * minor(2) -
    m[0][3] * minor(3)
  );
}

/**
 * Intersect a 4D line segment [a, b] with hyperplane W = wSlice.
 * Returns the 4D intersection point [x, y, z, wSlice] or null if disjoint.
 */
export function sliceSegmentWithHyperplaneW(a, b, wSlice = 0) {
  const da = a[3] - wSlice;
  const db = b[3] - wSlice;
  if (Math.abs(da) <= EPSILON && Math.abs(db) <= EPSILON) {
    return lerp4(a, b, 0.5);
  }
  if ((da < 0 && db < 0) || (da > 0 && db > 0)) {
    return null;
  }
  const denom = db - da;
  if (Math.abs(denom) <= EPSILON) return null;
  const t = clamp(-da / denom, 0, 1);
  return [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
    wSlice,
  ];
}

// ---------------------------------------------------------------------------
// 3D Signed Volume & Orientation Determinant (Chiral Invariants)
// ---------------------------------------------------------------------------

/**
 * Signed 3D tetrahedron volume of 4 vertices [v0, v1, v2, v3]
 * (uses X, Y, Z coordinates; sign flips under orientation-reversing reflection).
 */
export function signedVolume3D(verts4) {
  if (!Array.isArray(verts4) || verts4.length !== 4) {
    throw new RangeError('signedVolume3D requires an array of exactly 4 vertices.');
  }
  const [v0, v1, v2, v3] = verts4;
  const e1 = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
  const e2 = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
  const e3 = [v3[0] - v0[0], v3[1] - v0[1], v3[2] - v0[2]];
  return det3(e1, e2, e3) / 6;
}

/**
 * Signed parallelepiped determinant = 6 * signedVolume3D(verts4).
 */
export function signedOrientationDet3D(verts4) {
  return signedVolume3D(verts4) * 6;
}

// ---------------------------------------------------------------------------
// SO(3) Unit Quaternions [x, y, z, w]
// ---------------------------------------------------------------------------

export function qIdentity() {
  return [0, 0, 0, 1];
}

export function qNormalize(q) {
  const len = Math.hypot(q[0], q[1], q[2], q[3]);
  if (len <= EPSILON) return [0, 0, 0, 1];
  return [q[0] / len, q[1] / len, q[2] / len, q[3] / len];
}

export function qConjugate(q) {
  return [-q[0], -q[1], -q[2], q[3]];
}

export function qMul(a, b) {
  const [ax, ay, az, aw] = a;
  const [bx, by, bz, bw] = b;
  return [
    aw * bx + ax * bw + ay * bz - az * by,
    aw * by - ax * bz + ay * bw + az * bx,
    aw * bz + ax * by - ay * bx + az * bw,
    aw * bw - ax * bx - ay * by - az * bz,
  ];
}

export function qFromAxisAngle(axis3, rad) {
  const len = Math.hypot(axis3[0], axis3[1], axis3[2]);
  if (len <= EPSILON) return qIdentity();
  const half = rad * 0.5;
  const s = Math.sin(half) / len;
  return qNormalize([axis3[0] * s, axis3[1] * s, axis3[2] * s, Math.cos(half)]);
}

/**
 * Rotate a 3D vector (or the XYZ components of a 4D vector, preserving W) by unit quaternion q.
 */
export function qRotateVec3(q, v) {
  const [qx, qy, qz, qw] = qNormalize(q);
  const vx = v[0];
  const vy = v[1];
  const vz = v[2];
  // t = 2 * cross(q.xyz, v)
  const tx = 2 * (qy * vz - qz * vy);
  const ty = 2 * (qz * vx - qx * vz);
  const tz = 2 * (qx * vy - qy * vx);
  const out = [
    vx + qw * tx + (qy * tz - qz * ty),
    vy + qw * ty + (qz * tx - qx * tz),
    vz + qw * tz + (qx * ty - qy * tx),
  ];
  if (v.length >= 4) {
    out.push(v[3]);
  }
  return out;
}

/**
 * Spherical Linear Interpolation (Slerp) on SO(3) unit quaternions.
 * Always follows the shortest geodesic arc on S^3.
 */
export function qSlerp(a, b, t) {
  const qa = qNormalize(a);
  let qb = qNormalize(b);
  let dot = qa[0] * qb[0] + qa[1] * qb[1] + qa[2] * qb[2] + qa[3] * qb[3];

  if (dot < 0) {
    dot = -dot;
    qb = [-qb[0], -qb[1], -qb[2], -qb[3]];
  }

  const clampedT = clamp(t, 0, 1);
  if (dot > 0.999995) {
    return qNormalize([
      lerp(qa[0], qb[0], clampedT),
      lerp(qa[1], qb[1], clampedT),
      lerp(qa[2], qb[2], clampedT),
      lerp(qa[3], qb[3], clampedT),
    ]);
  }

  const theta0 = Math.acos(clamp(dot, -1, 1));
  const sinTheta0 = Math.sin(theta0);
  const theta = theta0 * clampedT;
  const s0 = Math.sin(theta0 - theta) / sinTheta0;
  const s1 = Math.sin(theta) / sinTheta0;

  return qNormalize([
    qa[0] * s0 + qb[0] * s1,
    qa[1] * s0 + qb[1] * s1,
    qa[2] * s0 + qb[2] * s1,
    qa[3] * s0 + qb[3] * s1,
  ]);
}
