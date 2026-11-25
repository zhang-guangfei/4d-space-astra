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

async function wheelTo(angle, ticks) {
  // Keep the pointer over the game itself, including after using a HUD button.
  await canvas.hover({ position: { x: 480, y: 280 } });
  for (let i = 0; i < Math.abs(ticks); i++) {
    await page.mouse.wheel(0, ticks > 0 ? -140 : 140);
    // Each wheel event must reach the game before the next one can be coalesced.
    const expected = angle - (Math.abs(ticks) - i - 1) * 7 * Math.sign(ticks);
    await visibleText(reading, 'θ ' + expected.toFixed(1) + '°');
  }
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

try {
  await page.goto(levelUrl, { waitUntil: 'load' });
  await page.getByText('几何读数', { exact: true }).click();
  await visibleText(reading, '整球宽');
  await grab();
  await wheelTo(7, 1);
  await page.locator('#slice-callout-tag.is-visible').waitFor();
  await photo('01-first-turn');
  await wheelTo(0, -1);
  await wheelTo(84, 12);

  // Opening the side view first used to suppress the neighboring-layer demonstration.
  await page.keyboard.press('Tab');
  await holdUntil('w', () => visibleText(title, '相邻层 · 球身越过了缝边'));
  await visibleText(subtitle, '换了一层');
  await photo('02-neighbor');
  await page.keyboard.press('c');
  await visibleText(title, '原层 · 青色截面落在缝内');
  await page.locator('#subtitle-bar.is-visible').filter({ hasText: '看红圈' }).waitFor({ state: 'hidden' });
  await photo('03-original');
  await page.getByRole('button', { name: /查看相邻层/ }).click();
  await visibleText(title, '相邻层 · 球身越过了缝边');
  await wheelTo(91, 1);
  await photo('04-upright');
  await holdUntil('w', () => visibleText(subtitle, '球送到了'));
  await wheelTo(0, -13);
  await page.locator('#victory-banner:not([hidden])').waitFor();
  await page.locator('#reticle:not(.is-hidden)').waitFor();
  await holdUntil('w', () => page.locator('#teleporter-modal:not([hidden])').waitFor());
  await photo('05-completed');
  console.log('通过：84° 邻层越界、回看原层、立直、还原、走到传送台。');

  await page.locator('#btn-teleporter-replay').click();
  await visibleText(title, '三维切面');
  await grab();
  await wheelTo(7, 1);
  await holdUntil('w', () => page.locator('#tab-entry-pill.is-attention').waitFor());
  await page.keyboard.press('Tab');
  await visibleText(title, '相邻层 · 球身越过了缝边');
  await photo('06-bump-first');
  console.log('通过：轻转 7°，先碰壁再开侧视。');
  assert.deepEqual(errors, [], 'Uncaught errors during play');
} catch (error) {
  console.error(error.message, errors);
  console.error(await page.locator('body').innerText({ timeout: 5000 }).catch(() => '页面未响应'));
  await photo('failure').catch(() => {});
  throw error;
} finally {
  await browser.close();
}
