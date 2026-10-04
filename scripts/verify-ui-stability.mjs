import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import { GameEngine } from '../server/dist/gameEngine.js';
import { io } from 'socket.io-client';

// Use an installed Playwright or the desktop's bundled runtime, without adding dependencies.
const { chromium } = await import(process.env.UI_QA_PLAYWRIGHT_PATH
  ? pathToFileURL(process.env.UI_QA_PLAYWRIGHT_PATH).href : 'playwright');
const base = process.env.PREVIEW_URL || 'http://127.0.0.1:3126';
assert.equal(process.env.QA_ISOLATED, '1', 'Run against a disposable QA server: QA_ISOLATED=1');
const clientDist = process.env.QA_CLIENT_DIST || 'client/dist-projector-dashboard';
const evidence = path.resolve(process.env.QA_REPORT_DIR || path.join(clientDist, 'qa/player-ui'));
await fs.mkdir(evidence, { recursive: true });
const components = process.env.UI_QA_BASELINE
  ? ['HostView', 'VotingModal', 'BriefingModal', 'PracticeModal', 'ResultsModal', 'LedgerModal', 'ProjectorView']
  : ['VotingModal', 'BriefingModal', 'PracticeModal', 'ResultsModal', 'LedgerModal'];
const bundle = await build({
  stdin: { contents: components.map(name => `export { ${name} } from './client/src/ui/${name[0].toLowerCase() + name.slice(1)}.ts';`).join('\n'), resolveDir: process.cwd() },
  bundle: true, write: false, format: 'iife', globalName: 'UIUnderTest', platform: 'browser',
  alias: { shared: path.resolve('shared/src/index.ts') },
  plugins: process.env.UI_QA_BASELINE ? [{
    name: 'read-baseline-ui',
    setup(esbuild) {
      esbuild.onResolve({ filter: /(hostView|projectorView)\.ts$/ }, args => ({ path: path.resolve(args.resolveDir, args.path) }));
      esbuild.onLoad({ filter: /[/\\]client[/\\]src[/\\]ui[/\\].+\.ts$/ }, ({ path: file }) => ({
        contents: execFileSync('git', ['show', `${process.env.UI_QA_BASELINE}:${path.relative(process.cwd(), file).replaceAll('\\', '/')}`], { encoding: 'utf8' }),
        loader: 'ts',
      }));
    },
  }] : [],
});
const snapshot = new GameEngine('UI_FIXTURE', 'fixture-only').getSnapshot();
const browser = await chromium.launch({ channel: process.env.UI_QA_BROWSER || 'chrome', headless: true });
let peer;
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  // Load the actual compiled stylesheet, including the original 150ms fade-in.
  const assetNames = await fs.readdir(path.join(clientDist, 'assets'));
  const css = await fs.readFile(path.join(clientDist, 'assets', assetNames.find(n => n.endsWith('.css'))), 'utf8');
  await page.goto(`${base}/api/network-info`);
  await page.setContent('<!doctype html><meta charset="utf-8"><body></body>');
  await page.addStyleTag({ content: css });
  await page.addScriptTag({ content: bundle.outputFiles[0].text });
  const fixtureResults = await page.evaluate(async (initial) => {
    const check = (condition, message) => { if (!condition) throw Error(message); };
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const results = [];
    const commands = [], intents = [], copied = [];
    const socket = { onSnapshot() {}, getHostToken: () => 'fixture', getPlayerId: () => 'p1',
      sendHostCommand: command => commands.push(command), sendIntent: intent => intents.push(intent) };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async text => copied.push(text) } });
    const realFetch = window.fetch;
    window.fetch = async () => {
      await sleep(250);
      return { ok: true, json: async () => ({ qrDataUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>', joinUrl: 'https://example.test/play/UI_FIXTURE' }) };
    };
    const s = structuredClone(initial);
    s.phase = 'BRIEFING'; s.phaseTimerRemainingMs = 60000;
    if (UIUnderTest.HostView) {
    const host = new UIUnderTest.HostView(socket, 'UI_FIXTURE');
    host.show();
    host.update(s);
    const root = document.querySelector('#host-view');
    const card = root.firstElementChild, button = root.querySelector('#host-btn-toggle-pause');
    const copy = root.querySelector('#host-btn-copy');
    button.focus();
    let animations = 0;
    card.addEventListener('animationstart', () => animations++);
    // Wait for the first entrance to finish even if other tests saturate the CPU.
    await Promise.all(card.getAnimations().map(animation => animation.finished));
    for (let i = 0; i < 25; i++) {
      s.phaseTimerRemainingMs -= 100; s.totalRunningTimeMs += 100; s.totalScore = i;
      host.update(s); await sleep(100);
      check(root.firstElementChild === card && button.isConnected && copy.isConnected, 'Host replaced a live node');
      check(document.activeElement === button, 'Host lost keyboard focus');
      check(getComputedStyle(card).opacity === '1', `Host fade restarted: tick=${i}, opacity=${getComputedStyle(card).opacity}, animations=${animations}`);
    }
    check(animations === 1, `Expected one entrance animation, got ${animations}`);
    button.click(); s.isPaused = true; host.update(s); button.click();
    check(commands.join(',') === 'PAUSE,RESUME', 'Pause uses stale state or duplicated handlers');
    copy.click(); await sleep(0);
    for (let i = 0; i < 20; i++) { s.totalScore++; host.update(s); }
    check(copy.textContent.trim() === 'Đã sao chép!', 'Snapshots erased copy feedback');
    check(copied[0] === 'https://example.test/play/UI_FIXTURE', 'Copy did not use loaded QR URL');
    await sleep(2100); check(copy.textContent === 'Sao chép liên kết', 'Copy label did not reset');
    check(!/áº|á»|ðŸ|â€|â–|\uFFFD/.test(root.textContent), 'Host has broken encoding');
    check(root.textContent.includes('QUÊ MÌNH ĐỨNG ĐẦU!'), 'Host Vietnamese title is wrong');
    results.push({ component: 'HostView', pacedSnapshots: 25, animations, focus: true, qr: true, copy: true, pauseResume: true });
    host.hide();
    }
    window.fetch = realFetch;

    for (const [name, id, phase, buttonId, command] of [
      ['BriefingModal', 'briefing-modal', 'BRIEFING', 'btn-skip-briefing', 'SKIP_BRIEFING'],
      ['PracticeModal', 'practice-modal', 'PRACTICE', 'btn-skip-practice', 'SKIP_PRACTICE'],
      ['ResultsModal', 'results-modal', 'RESULTS', 'btn-reset-match', 'RESET'],
      ['LedgerModal', 'ledger-modal', 'RUNNING', 'btn-close-ledger', null],
      ['ProjectorView', 'projector-view', 'RUNNING', null, null],
    ]) {
      if (!UIUnderTest[name]) continue;
      const view = new UIUnderTest[name](socket, 'UI_FIXTURE');
      if (name === 'LedgerModal') view.toggle();
      if (name === 'ProjectorView') view.show();
      s.phase = phase; view.update(s);
      const container = document.getElementById(id), panel = container.firstElementChild;
      const control = buttonId ? document.getElementById(buttonId) : null;
      if (control) control.focus();
      panel.scrollTop = 80; const scroll = panel.scrollTop;
      for (let i = 0; i < 40; i++) {
        s.phaseTimerRemainingMs -= 100; s.totalScore++; s.practiceCrateDelivered = i > 10;
        view.update(s);
        check(container.firstElementChild === panel, `${name} restarted animation`);
        check(panel.scrollTop === scroll, `${name} reset scroll`);
        if (control) check(control.isConnected && document.activeElement === control, `${name} lost its button/focus`);
      }
      const count = commands.length; if (control) control.click();
      if (command) check(commands.length === count + 1 && commands.at(-1) === command, `${name} duplicated handlers`);
      if (name === 'LedgerModal') check(container.classList.contains('hidden'), 'Close toggled more than once');
      container.classList.add('hidden');
      if (['BriefingModal', 'PracticeModal', 'ResultsModal'].includes(name)) {
        const exit = { ...s, phase: 'LOBBY' }; view.update(exit); view.update(s);
        check(!container.classList.contains('hidden'), `${name} did not reopen`);
      }
      container.classList.add('hidden');
      results.push({ component: name, snapshots: 40, nodeIdentity: true, focusScroll: true, singleHandler: true });
    }
    const voting = new UIUnderTest.VotingModal(socket);
    s.voting = { active: true, missionId: 'M1', proposerName: 'Nguyễn Văn An', proposerId: 'p1', votes: {}, totalOnlineVoters: 2, remainingMs: 15000 };
    voting.update(s);
    const modal = document.getElementById('voting-modal'), panel = modal.firstElementChild;
    const option = document.getElementById('vote-opt-fixed'); option.focus();
    for (let i = 0; i < 40; i++) {
      s.voting.remainingMs -= 100; s.voting.votes = i > 10 ? { p1: 'FIXED' } : {}; voting.update(s);
      check(modal.firstElementChild === panel && document.getElementById('vote-opt-fixed') === option, 'Vote replaced panel/button');
      check(document.activeElement === option, 'Vote lost focus');
    }
    option.click(); check(intents.length === 1 && intents[0].payload.plan === 'FIXED', 'Vote duplicated/wrong intent');
    check(option.textContent.includes('Phiếu của bạn') && option.textContent.includes('Trạm Cố định'), 'Vote text/selection did not update');
    s.voting.missionId = 'M2'; s.voting.votes = {}; voting.update(s);
    check(!document.getElementById('vote-opt-fixed') && document.getElementById('vote-opt-repair'), 'Vote kept stale options');
    document.getElementById('vote-opt-repair').click(); check(intents.length === 2 && intents[1].payload.plan === 'REPAIR', 'New vote binding is wrong');
    check(!/áº|á»|ðŸ|â€|â–|\uFFFD/.test(modal.textContent), 'Voting has broken encoding');
    results.push({ component: 'VotingModal', snapshots: 40, focus: true, selection: true, missionSwitch: true, singleIntent: true });
    return results;
  }, snapshot);

  // Production app + real Socket.IO snapshots and host ACKs on the disposable instance.
  const room = `UI_${Date.now().toString(36).toUpperCase()}`;
  await page.goto(`${base}/host/${room}`);
  await page.locator('#host-btn-start').waitFor({ state: 'visible' });
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  peer = io(base, { transports: ['websocket'] });
  const joined = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(Error('Peer join timeout')), 8000);
    peer.once('joined_room', data => { clearTimeout(timer); resolve(data); });
    peer.emit('join_room', { roomCode: room, playerName: 'Nguyễn Văn An' });
  });
  let live = joined.snapshot; peer.on('room_snapshot', s => live = s);
  const wait = async predicate => {
    const deadline = Date.now() + 8000;
    while (!predicate(live)) { assert.ok(Date.now() < deadline, 'Live snapshot timeout'); await new Promise(r => setTimeout(r, 100)); }
  };
  const playerPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  playerPage.on('pageerror', error => errors.push(error.message));
  await playerPage.goto(`${base}/play/${room}`);
  await playerPage.locator('#briefing-modal').waitFor({ state: 'attached' });
  await page.locator('#host-btn-start').click(); await wait(s => s.phase === 'BRIEFING');
  await playerPage.locator('#briefing-modal').waitFor({ state: 'visible' });
  await playerPage.waitForFunction(() => getComputedStyle(document.querySelector('#briefing-modal > div')).opacity === '1');
  await playerPage.screenshot({ path: path.join(evidence, 'briefing-desktop.png'), fullPage: true });
  await page.locator('#host-btn-toggle-pause').click(); await wait(s => s.isPaused);
  const paused = live.phaseTimerRemainingMs;
  await new Promise(r => setTimeout(r, 500)); assert.equal(live.phaseTimerRemainingMs, paused);
  await page.locator('#host-btn-toggle-pause').click(); await wait(s => !s.isPaused);
  await page.locator('#dashboard-add-time').click(); await wait(s => s.phaseTimerRemainingMs > paused + 50000);
  await page.locator('#dashboard-skip').click(); await wait(s => s.phase === 'PRACTICE');
  await page.locator('#dashboard-skip').click(); await wait(s => s.phase === 'RUNNING');
  await page.locator('#dashboard-qr').waitFor({ state: 'visible' });
  await page.screenshot({ path: path.join(evidence, 'host-desktop.png'), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: path.join(evidence, 'host-mobile.png'), fullPage: true });
  await page.locator('#host-btn-end').click(); await wait(s => s.phase === 'RESULTS');
  await playerPage.locator('#results-modal').waitFor({ state: 'visible' });
  await playerPage.waitForFunction(() => getComputedStyle(document.querySelector('#results-modal > div')).opacity === '1');
  await playerPage.screenshot({ path: path.join(evidence, 'results-desktop.png'), fullPage: true });
  await page.locator('#host-btn-reset').click(); await wait(s => s.phase === 'LOBBY');
  assert.deepEqual(errors, []);
  const report = { passed: true, fixtureResults, live: { realSocket: true, start: true, pauseResume: true, add60s: true, skip: true, endReset: true, briefingResultsVisible: true, pageErrors: errors }, screenshots: ['host-desktop.png', 'host-mobile.png', 'briefing-desktop.png', 'results-desktop.png'] };
  await fs.writeFile(path.join(evidence, 'ui-stability.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  peer?.disconnect(); await browser.close();
}
