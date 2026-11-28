import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';

const { chromium } = createRequire(import.meta.url)('playwright-core');
const levelUrl = process.argv[2];
if (!levelUrl) throw new Error('Pass the published level URL as the first argument.');
const output = process.env.PLAYTEST_OUTPUT || 'playtest-output';
await mkdir(output, { recursive: true });

const browser = await chromium.launch({
  channel: 'msedge',
  executablePath: process.env.EDGE_EXECUTABLE_PATH,
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
});
const page = await browser.newPage({ viewport: { width: 880, height: 620 }, locale: 'zh-CN' });
page.setDefaultTimeout(100_000);
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));

const canvas = page.locator('#render-canvas');
const title = page.locator('#honest-badge-title');
const subtitle = page.locator('#subtitle-text');
const reading = page.locator('#telemetry-orb');
async function photo(name) {
  console.log('试玩画面', name);
  await page.screenshot({ path: path.join(output, name + '.png'), timeout: 30_000 });
}
const visibleText = (locator, text) => locator.filter({ hasText: text }).waitFor();

async function holdUntil(key, check) {
  await page.keyboard.down('Shift');
  await page.keyboard.down(key);
  try {
    await check();
  } finally {
    await page.keyboard.up(key);
    await page.keyboard.up('Shift');
  }
}

async function rotateTo(angle, ticks, target = canvas) {
  if (target === canvas) await canvas.hover({ position: { x: 480, y: 280 } });
  else await target.hover();
  const { w } = await geometry();
  await page.keyboard.down('Shift');
  try {
    for (let i = 0; i < Math.abs(ticks); i++) {
      await page.mouse.wheel(0, ticks > 0 ? -140 : 140);
      const expected = angle - (Math.abs(ticks) - i - 1) * 7 * Math.sign(ticks);
      await visibleText(reading, 'θ ' + expected.toFixed(1) + '°');
    }
  } finally {
    await page.keyboard.up('Shift');
  }
  assert.equal((await geometry()).w, w, 'Shift + wheel must rotate at the current W');
}

async function grab() {
  await holdUntil('w', () => page.waitForFunction(() => {
    const label = document.getElementById('telemetry-coord').textContent;
    const z = label.match(/XYZ \([^,]+,[^,]+,\s*(-?[\d.]+)\)/);
    return z && Number(z[1]) >= -5;
  }));
  await page.keyboard.press('e');
  await visibleText(title, '正在操控圆球');
}

// Read the rendered scenario without changing the game state. Only real input
// below may move the player, the ball or the layer used for its cross-section.
function geometry() {
  return page.evaluate(() => {
    const { state } = globalThis.__BEYOND3D__;
    return { w: state.playerPos[3], x: state.getSliceAtPlayerW().xCenter, z: state.orbZ, angle: state.thetaDeg };
  });
}

async function checkOriginalLayerAtRest() {
  await page.locator('#side-view-panel.is-visible').waitFor();
  await visibleText(title, '原层 · 青色截面落在缝内');
  const start = await geometry();
  assert.equal(start.w, 0);
  assert.equal(start.x, 0);
  await page.evaluate(async () => {
    for (let i = 0; i < 6; i++) await new Promise(requestAnimationFrame);
  });
  assert.deepEqual(await geometry(), start, 'Idle frames must leave the observation layer and orb in place');
  return start;
}

async function observeByWheel(ticks) {
  await canvas.hover({ position: { x: 480, y: 280 } });
  const { angle } = await geometry();
  for (let i = 0; i < Math.abs(ticks); i++) {
    const { w } = await geometry();
    await page.mouse.wheel(0, ticks > 0 ? -140 : 140);
    await page.waitForFunction(previous => globalThis.__BEYOND3D__.state.playerPos[3] !== previous, w);
  }
  assert.equal((await geometry()).angle, angle, 'Plain wheel must keep the angle fixed');
}

try {
  await page.goto(levelUrl, { waitUntil: 'load' });
  const goal = page.locator('#goal-marker');
  await goal.waitFor();
  await page.waitForFunction(() => document.querySelector('#goal-marker img').naturalWidth > 0);
  assert.ok(await goal.getByText('墙后 · 金色底座').isVisible());
  await photo('00-opening-goal');
  await page.getByText('几何读数', { exact: true }).click();
  await visibleText(reading, '整球宽');
  await canvas.hover({ position: { x: 480, y: 280 } });
  await page.mouse.wheel(0, -140);
  await visibleText(title, '这里没有球身');
  await page.keyboard.press('c');
  await visibleText(reading, '观察层 w 0.00');
  await grab();
  await goal.waitFor({ state: 'hidden' });
  await rotateTo(7, 1);
  await page.locator('#slice-callout-tag.is-visible').waitFor();
  await photo('01-first-turn');
  await rotateTo(0, -1);
  await rotateTo(84, 12);

  // Opening the side view first, then hitting the wall, must leave W at the origin.
  await page.keyboard.press('Tab');
  await holdUntil('w', () => visibleText(title, '原层 · 青色截面落在缝内'));
  const original = await checkOriginalLayerAtRest();
  await photo('02-original');
  await observeByWheel(1);
  await visibleText(title, '青色截面落在缝内');
  assert.ok((await geometry()).w > 0);
  await observeByWheel(4);
  await visibleText(title, '球身越过了缝边');
  await visibleText(subtitle, '你换了一层');
  const neighbor = await geometry();
  assert.ok(neighbor.x > 0.082);
  assert.equal(neighbor.angle, original.angle);
  assert.equal(neighbor.z, original.z);
  await photo('03-manual-neighbor');
  await page.keyboard.press('c');
  assert.deepEqual(await checkOriginalLayerAtRest(), original);
  await page.locator('#subtitle-bar.is-visible').filter({ hasText: '你换了一层' }).waitFor({ state: 'hidden' });
  await rotateTo(91, 1, page.locator('#side-view-canvas'));
  await photo('04-upright');
  await holdUntil('w', () => visibleText(subtitle, '球送到了'));
  await page.keyboard.press('e');
  await visibleText(title, '球已放在墙后的金色底座上');
  await page.keyboard.press('e');
  await visibleText(title, '第四维侧视');
  await rotateTo(0, -13);
  await page.locator('#victory-banner:not([hidden])').waitFor();
  await page.locator('#reticle:not(.is-hidden)').waitFor();
  await holdUntil('w', () => page.locator('#teleporter-modal:not([hidden])').waitFor());
  await photo('05-completed');
  console.log('通过：开场辨认底座、84° 碰壁停在原层、手动逐层观察、回原层、底座重新操控、完成传送。');

  await page.locator('#btn-teleporter-replay').click();
  await visibleText(title, '三维切面');
  await grab();
  await rotateTo(7, 1);
  await holdUntil('w', () => page.locator('#tab-entry-pill.is-attention').waitFor());
  await page.keyboard.press('Tab');
  const atSeven = await checkOriginalLayerAtRest();
  await page.getByRole('button', { name: '沿 W 轴负向移动' }).click();
  await visibleText(title, '球身越过了缝边');
  const negative = await geometry();
  assert.ok(negative.w < 0 && negative.x < -0.082);
  assert.equal(negative.angle, 7);
  assert.equal(negative.z, atSeven.z);
  await photo('06-manual-negative');
  await page.getByRole('button', { name: '沿 W 轴正向移动' }).click();
  assert.deepEqual(await checkOriginalLayerAtRest(), atSeven);
  console.log('通过：轻转 7°，先碰壁再开侧视，手动负向换层再逐步返回。');
  assert.deepEqual(errors, [], 'Uncaught errors during play');
} catch (error) {
  console.error(error.message, errors);
  console.error(await page.locator('body').innerText({ timeout: 5000 }).catch(() => '页面未响应'));
  await photo('failure').catch(() => {});
  throw error;
} finally {
  await browser.close();
}
