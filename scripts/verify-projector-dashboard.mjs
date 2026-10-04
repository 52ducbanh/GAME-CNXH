import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'esbuild';
import { io } from 'socket.io-client';
import { GAME_MAPS, findWalkingRoute, getProvinceWorldState } from '../shared/dist/index.js';

assert.equal(process.env.QA_ISOLATED, '1', 'Use a disposable QA instance (QA_ISOLATED=1).');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:3126';
const out = path.resolve(process.env.QA_REPORT_DIR || 'client/dist-projector-dashboard/qa');
await fs.mkdir(out, { recursive: true });
const { chromium } = await import(process.env.UI_QA_PLAYWRIGHT_PATH ? pathToFileURL(process.env.UI_QA_PLAYWRIGHT_PATH).href : 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const peers = []; let serial = 0;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(predicate, label) {
  const end = Date.now() + 10000;
  while (!predicate()) { assert.ok(Date.now() < end, label); await sleep(50); }
}
async function join(roomCode, mapId) {
  const socket = io(base, { transports: ['websocket'] });
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  const joined = await new Promise(resolve => { socket.once('joined_room', resolve); socket.emit('join_room', { roomCode, playerName: `QA ${mapId}`, isHost: true }); });
  assert.equal(joined.success, true);
  const peer = { socket, ...joined, snapshot: joined.snapshot, map: GAME_MAPS.find(m => m.id === mapId) };
  socket.on('room_snapshot', snapshot => { peer.snapshot = snapshot; }); peers.push(peer); return peer;
}
async function host(peer, command) {
  const ack = await new Promise((resolve, reject) => peer.socket.timeout(8000).emit('host_command', { command, hostToken: peer.hostToken }, (error, result) => error ? reject(error) : resolve(result)));
  assert.equal(ack.success, true, ack.reason);
}
async function intent(peer, type, payload) {
  const ack = await new Promise((resolve, reject) => peer.socket.timeout(8000).emit('client_intent', { actionId: `dashboard_${Date.now()}_${++serial}`, type, payload }, (error, result) => error ? reject(error) : resolve(result)));
  assert.equal(ack.success, true, ack.reason);
}
async function go(peer, targetId) {
  const target = peer.map.points[targetId];
  const route = findWalkingRoute(peer.snapshot.players[peer.playerId], target, getProvinceWorldState(peer.snapshot), peer.map.id);
  assert.ok(route.length);
  for (const point of route.slice(1)) await intent(peer, 'MOVE', point);
  await until(() => Math.hypot(peer.snapshot.players[peer.playerId].x - target.x, peer.snapshot.players[peer.playerId].y - target.y) < 2, `MOVE to ${targetId}`);
}
try {
  for (const map of GAME_MAPS) {
    const peer = await join(map.defaultRoom, map.id);
    await host(peer, 'RESET');
  }
  const hanoi = peers.find(peer => peer.map.id === 'hanoi'), hatinh = peers.find(peer => peer.map.id === 'ha-tinh');
  const errors = [];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/host/${hanoi.roomCode}`);
  await page.waitForFunction(() => document.querySelectorAll('.dashboard-score-row').length === 7);
  await page.locator('#host-btn-start').waitFor({ state: 'visible' });
  await page.waitForFunction(() => !document.querySelector('#host-btn-start').disabled);
  assert.equal(await page.locator('.dashboard-score-row').count(), 7);
  assert.equal(await page.locator('#host-view,#projector-view').count(), 0);
  const overview = await (await fetch(`${base}/api/dashboard`)).json();
  assert.equal(overview.rooms.length, 7);
  const onlineText = `${overview.rooms.reduce((n, room) => n + room.onlineCount, 0)} / ${overview.rooms.reduce((n, room) => n + room.playerCount, 0)}`;
  await page.waitForFunction(expected => document.querySelector('#dashboard-online').textContent === expected, onlineText);
  assert.equal(overview.rooms.reduce((n, room) => n + room.onlineCount, 0), 7);
  assert.ok(overview.rooms.every(room => !('players' in room) && !('hostToken' in room)));
  const qr = await (await fetch(`${base}/api/qr`)).json();
  assert.equal(new URL(qr.joinUrl).pathname, '/'); assert.ok(qr.qrDataUrl.startsWith('data:image/png;base64,'));
  const roomQr = await (await fetch(`${base}/api/qr/${hanoi.roomCode}`)).json();
  assert.equal(new URL(roomQr.joinUrl).pathname, `/play/${hanoi.roomCode}`);
  assert.equal((await fetch(`${base}/api/dashboard?room=UNKNOWN_QA_ROOM`)).status, 404);
  await page.locator('#dashboard-qr').waitFor({ state: 'visible' });
  assert.equal(await page.locator('#dashboard-join-url').getAttribute('href'), qr.joinUrl);
  assert.equal(await page.locator('#dashboard-room-link').getAttribute('href'), `/play/${hanoi.roomCode}`);
  await page.locator('#host-btn-start').click(); await until(() => hanoi.snapshot.phase === 'BRIEFING', 'START');
  await page.waitForFunction(() => !document.querySelector('#host-btn-toggle-pause').disabled);
  await page.locator('#host-btn-toggle-pause').click(); await until(() => hanoi.snapshot.isPaused, 'PAUSE');
  const paused = hanoi.snapshot.phaseTimerRemainingMs; await sleep(400); assert.equal(hanoi.snapshot.phaseTimerRemainingMs, paused);
  await page.locator('#host-btn-toggle-pause').click(); await until(() => !hanoi.snapshot.isPaused, 'RESUME');
  await page.locator('#dashboard-extra-minutes').fill('2');
  const before = hanoi.snapshot.phaseTimerRemainingMs;
  await page.locator('#dashboard-add-time').click(); await until(() => hanoi.snapshot.phaseTimerRemainingMs > before + 110000, 'ADD_60S twice');
  await page.locator('#dashboard-skip').click(); await until(() => hanoi.snapshot.phase === 'PRACTICE', 'SKIP_BRIEFING');
  await page.waitForFunction(() => document.querySelector('#dashboard-skip').textContent.includes('tập dượt'));
  await page.locator('#dashboard-skip').click(); await until(() => hanoi.snapshot.phase === 'RUNNING', 'SKIP_PRACTICE');
  const row = await page.locator('[data-province="hanoi"]').elementHandle();
  const input = await page.locator('#dashboard-extra-minutes').elementHandle();
  await page.locator('#dashboard-extra-minutes').fill('3');
  await sleep(1200);
  assert.ok(await input.evaluate(node => node.isConnected && document.activeElement === node && node.value === '3'));
  await go(hanoi, 'ZONE_A'); await intent(hanoi, 'START_JOB', { type: 'SURVEY_ZONE', targetId: 'ZONE_A' });
  await until(() => hanoi.snapshot.m1.surveys.A, 'real survey completion');
  assert.equal(hanoi.snapshot.totalScore, 2);
  await page.waitForFunction(() => document.querySelector('[data-province="hanoi"] .dashboard-score').textContent.trim().startsWith('2'));
  assert.ok(await row.evaluate(node => node.isConnected && node === document.querySelector('[data-province="hanoi"]')));
  assert.equal(await page.locator('[data-province="hanoi"] [role="progressbar"]').getAttribute('aria-valuenow'), '2');
  assert.equal(await page.locator('#dashboard-featured-mission [role="progressbar"]').getAttribute('aria-valuenow'), '7');
  await host(hatinh, 'START'); await host(hatinh, 'SKIP_BRIEFING'); await host(hatinh, 'SKIP_PRACTICE');
  await until(() => hatinh.snapshot.phase === 'RUNNING', 'HT start');
  await go(hatinh, 'WORKER_TUAN'); await intent(hatinh, 'HATINH_ACTION', { action: 'VA_REPORT_TUAN' });
  await until(() => hatinh.snapshot.totalScore > 0, 'HT authoritative score');
  await page.waitForFunction(expected => document.querySelector('[data-province="ha-tinh"] .dashboard-score').textContent.trim().startsWith(String(expected)), hatinh.snapshot.totalScore);
  const domScores = await page.locator('.dashboard-score').allTextContents();
  const scores = domScores.map(text => Number(text.trim().split('/')[0]));
  assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  const visibleEvents = await page.locator('#dashboard-event-feed').textContent();
  assert.ok(visibleEvents.includes('Hà Tĩnh') || visibleEvents.includes('Hà Nội'));

  // Read the production view model in a real browser: stale overview, ties, provenance and timers.
  const modelBundle = await build({ stdin: { contents: `export * from './client/src/ui/dashboard/viewModel.ts'; export { MatchControlsPanel } from './client/src/ui/dashboard/matchControlsPanel.ts';`, resolveDir: process.cwd() }, bundle: true, write: false, format: 'iife', globalName: 'DashboardSelectors', alias: { shared: path.resolve('shared/src/index.ts') } });
  await page.addScriptTag({ content: modelBundle.outputFiles[0].text });
  const modelChecks = await page.evaluate(rooms => {
    const s = DashboardSelectors;
    const defaults = structuredClone(rooms); defaults[0].score = 4; defaults[1].score = 20; defaults[2].score = 20;
    const active = { ...defaults[0], roomCode: 'CUSTOM', score: 30, onlineCount: 1 };
    const model = s.selectDashboardModel(defaults, active);
    return {
      ranks: model.rows.slice(0, 3).map(row => row.rank), scores: model.rows.slice(0, 3).map(row => row.room.score),
      current: model.rows[0].room.roomCode, sourceUnchanged: defaults[0].score === 4,
      clock: s.clock(600000), emptyProgress: s.percentage(0, 0),
    };
  }, overview.rooms);
  assert.deepEqual(modelChecks, { ranks: [1, 2, 2], scores: [30, 20, 20], current: 'CUSTOM', sourceUnchanged: true, clock: '10:00', emptyProgress: 0 });
  const commandChecks = await page.evaluate(async initial => {
    let resolveAck; const sent = [];
    const socket = { getHostToken: () => 'fixture', sendHostCommand: command => { sent.push(command); return new Promise(resolve => { resolveAck = resolve; }); } };
    const root = document.createElement('div'); document.body.append(root);
    const room = { ...initial, phase: 'RUNNING', isPaused: false };
    const before = JSON.stringify(room);
    const controls = new DashboardSelectors.MatchControlsPanel(root, socket, true);
    controls.update(room, true);
    const button = root.querySelector('#host-btn-toggle-pause'); button.click(); button.click();
    const pending = button.disabled && sent.join(',') === 'PAUSE' && JSON.stringify(room) === before;
    resolveAck({ success: true }); await new Promise(resolve => setTimeout(resolve, 0));
    socket.sendHostCommand = async command => { sent.push(command); return { success: false, reason: 'Fixture reject' }; };
    button.click(); await new Promise(resolve => setTimeout(resolve, 0));
    const reject = root.querySelector('#dashboard-control-feedback').textContent === 'Fixture reject' && room.isPaused === false;
    controls.update(room, false); const count = sent.length; button.click();
    const offline = button.disabled && sent.length === count;
    root.remove(); return { pending, reject, offline };
  }, overview.rooms[0]);
  assert.deepEqual(commandChecks, { pending: true, reject: true, offline: true });
  for (const [name, width, height] of [['dashboard-desktop',1440,900],['dashboard-projector',1920,1080],['dashboard-720p',1280,720],['dashboard-mobile',390,844]]) {
    await page.setViewportSize({ width, height }); await sleep(200);
    await page.evaluate(() => { document.querySelector('#projector-dashboard').scrollTop = 0; });
    await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: true });
    if (width >= 1280) {
      const bounds = await page.evaluate(() => ({ horizontalOverflow: document.querySelector('.dashboard-shell').scrollWidth > innerWidth, tableOverflow: document.querySelector('.dashboard-table-scroll').scrollWidth > document.querySelector('.dashboard-table-scroll').clientWidth, verticalOverflow: document.querySelector('#projector-dashboard').scrollHeight > innerHeight + 1,
        rowTextOverflow: [...document.querySelectorAll('.dashboard-score-row')].some(row => [...row.querySelectorAll('.dashboard-province,.dashboard-row-status,.dashboard-score')].some(cell => cell.getBoundingClientRect().bottom > row.getBoundingClientRect().bottom + 1)) }));
      assert.equal(bounds.horizontalOverflow, false, name); assert.equal(bounds.tableOverflow, false, name);
      assert.equal(bounds.verticalOverflow, false, `${name} must fit a projector frame`);
      assert.equal(bounds.rowTextOverflow, false, `${name} row text must remain inside its row`);
    }
  }

  const projector = await context.newPage(); projector.on('pageerror', error => errors.push(error.message));
  await projector.goto(`${base}/projector/${hanoi.roomCode}`);
  await projector.waitForFunction(() => document.querySelectorAll('.dashboard-score-row').length === 7);
  assert.equal(await projector.locator('#host-btn-start').isDisabled(), true);
  assert.equal(await projector.locator('#host-btn-reset').isDisabled(), true);

  const custom = await (await fetch(`${base}/api/rooms/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mapId: 'ha-tinh' }) })).json();
  const customOverview = await (await fetch(`${base}/api/dashboard?room=${custom.roomCode}`)).json();
  assert.equal(customOverview.rooms.length, 7);
  assert.equal(customOverview.rooms.find(room => room.mapId === 'ha-tinh').roomCode, custom.roomCode);
  await projector.goto(`${base}/projector/${custom.roomCode}`);
  await projector.waitForFunction(code => document.querySelector('[data-province="ha-tinh"]')?.textContent.includes(code), custom.roomCode);

  // General invitation lands on existing lobby; no player-screen implementation change.
  const lobby = await context.newPage(); lobby.on('pageerror', error => errors.push(error.message));
  await lobby.goto(base + '/');
  assert.equal(await lobby.locator('[data-map]').count(), 7);
  await lobby.locator('[data-map="ha-tinh"]').click();
  assert.equal(await lobby.locator('#selected-region-name').textContent(), 'Hà Tĩnh');
  await lobby.locator('#input-player-name').fill('QA chọn Hà Tĩnh');
  await lobby.locator('#btn-explore-region').click(); await lobby.waitForURL(`**/play/${hatinh.roomCode}`);
  await lobby.locator('#hud-view').waitFor({ state: 'visible' });
  await lobby.waitForFunction(() => document.querySelector('#game-container canvas')?.width > 0);
  assert.equal(await lobby.locator('#projector-dashboard').count(), 0);
  await lobby.screenshot({ path: path.join(out, 'player-hatinh-unchanged.png'), fullPage: true });
  await lobby.setViewportSize({ width: 390, height: 844 });
  await lobby.goto(base + '/');
  await lobby.locator('[data-map="nghe-an"]').click();
  await lobby.locator('#btn-explore-region').click();
  await lobby.waitForURL(`**/play/${GAME_MAPS.find(map => map.id === 'nghe-an').defaultRoom}`);
  await lobby.locator('#joystick-zone').waitFor({ state: 'visible' });
  await lobby.locator('#btn-touch-interact').waitFor({ state: 'visible' });
  assert.equal(await lobby.locator('#projector-dashboard').count(), 0);
  await lobby.screenshot({ path: path.join(out, 'player-mobile-unchanged.png'), fullPage: true });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.locator('#host-btn-end').click(); await until(() => hanoi.snapshot.phase === 'RESULTS', 'END');
  await page.locator('#host-btn-reset').click(); await until(() => hanoi.snapshot.phase === 'LOBBY' && hanoi.snapshot.totalScore === 0, 'RESET');
  assert.deepEqual(errors, []);
  const report = { pass: true, method: 'Chrome + production app + seven real Socket.IO players; validated MOVE and genuine survey/rescue actions',
    checks: ['seven provinces', 'shared host/projector implementation', 'real scores/progress/ranks', 'single-room controls/ACK', 'timer/pause/extension', 'stable nodes/focus/input', 'online count', 'real event feed', 'featured quest progress', 'general QR + compatible room QR', 'custom-room replacement', 'read-only projector', 'desktop/720p/mobile layouts', 'seven-province lobby + player canvas'],
    modelChecks, commandChecks, pageErrors: errors, screenshots: ['dashboard-desktop.png','dashboard-projector.png','dashboard-720p.png','dashboard-mobile.png','player-hatinh-unchanged.png','player-mobile-unchanged.png'] };
  await fs.writeFile(path.join(out, 'projector-dashboard.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally { peers.forEach(peer => peer.socket.disconnect()); await browser.close(); }
