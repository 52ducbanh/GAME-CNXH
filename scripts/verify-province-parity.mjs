import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { build } from 'esbuild';
import path from 'node:path';
import { GameEngine } from '../server/dist/gameEngine.js';
import { MAP_IDS, getInteractionActions, getMissionGuide } from '../shared/dist/index.js';

// Migration regression against the actual working-tree checkpoint, without keeping
// a second gameplay implementation in production or changing a running server.
const baseline = process.env.REFACTOR_BASELINE ?? 'b76710245e8f19f2a871de67ff4b4d7d2e586546';
async function checkpointModule(file) {
  const source = execFileSync('git', ['show', `${baseline}:${file}`], { encoding: 'utf8' });
  const result = await build({ stdin: { contents: source, loader: 'ts', resolveDir: path.dirname(path.resolve(file)) }, bundle: true, write: false, platform: 'node', format: 'esm' });
  return import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
}
const legacyActions = (await checkpointModule('shared/src/interactions.ts')).getInteractionActions;
const legacyGuide = (await checkpointModule('shared/src/missionGuide.ts')).getMissionGuide;
let checked = 0;
for (const mapId of MAP_IDS) {
  const engine = new GameEngine('PARITY', 'host', mapId), player = engine.addPlayer('p', 'Người chơi');
  engine.startRunning();
  const initial = engine.getSnapshot();
  const verify = snapshot => {
    assert.deepEqual(getInteractionActions(snapshot, player.id), legacyActions(snapshot, player.id), `${mapId}: catalogue ${checked}`);
    assert.deepEqual(getMissionGuide(snapshot, player.id), legacyGuide(snapshot, player.id), `${mapId}: guide ${checked}`);
    checked++;
  };
  for (const phase of ['LOBBY', 'BRIEFING', 'PRACTICE', 'RUNNING', 'RESULTS']) {
    verify({ ...initial, phase });
    verify({ ...initial, phase, isPaused: true });
  }
  const practice = structuredClone(initial); practice.phase = 'PRACTICE'; practice.practiceCrateDelivered = true; verify(practice);
  for (const plan of ['FIXED', 'MOBILE']) {
    const s = structuredClone(initial); s.m1.status = 'ACTIVE'; s.m1.surveys = { A: true, B: true, C: true }; verify(s);
    s.m1.planCommitted = plan; verify(s);
    s.m1.deliveredCratesFixed = s.m1.deliveredCratesMobileB = s.m1.deliveredCratesMobileC = 2; verify(s);
    s.m1.fixedDeployed = s.m1.mobileBDeployed = s.m1.mobileCDeployed = true; verify(s);
    s.m1.verifiedA = s.m1.verifiedB = s.m1.verifiedC = true; verify(s);
    s.m1.status = 'RESOLVED'; s.m2.status = 'ACTIVE'; s.m2.bridgeBroken = true; verify(s);
    s.m2.surveyDone = true; verify(s);
    for (const response of ['REPAIR', 'DETOUR']) {
      s.m2.planCommitted = response; verify(s);
      s.m2.bridgeCratesDelivered = 2; verify(s);
      s.m2.bridgeRepaired = true; s.m2.reliefCratesDeliveredB = 2; verify(s);
      s.m2.verifiedB = true; verify(s);
    }
    s.m2.status = 'RESOLVED'; s.m3.status = 'ACTIVE'; verify(s);
    s.m3.receivedFeedbackC = true; verify(s);
    s.m3.crossCheckedList = true; verify(s);
    s.m3.planConfirmed = true; verify(s);
    s.m3.deliveredC1 = s.m3.deliveredC2 = true; verify(s);
    s.m3.deployedC1 = s.m3.deployedC2 = true; verify(s);
    s.m3.lossAuditDone = true; verify(s);
  }
  if (initial.hatinhState) {
    const s = structuredClone(initial), ht = s.hatinhState;
    for (const key of Object.keys(ht.va)) if (typeof ht.va[key] === 'boolean') { ht.va[key] = true; verify(s); }
    ht.va.status = 'RESOLVED'; ht.currentQuest = 2;
    for (const status of ['NOT_STARTED', 'GATHERING', 'COUNTDOWN', 'ACTIVE', 'RESOLVED']) { ht.dg.status = status; verify(s); }
    ht.dg.status = 'ACTIVE';
    for (const key of Object.keys(ht.dg)) if (typeof ht.dg[key] === 'boolean') { ht.dg[key] = true; verify(s); }
    ht.dg.status = 'RESOLVED'; ht.currentQuest = 3; ht.dl.status = 'ACTIVE';
    for (const key of Object.keys(ht.dl)) if (typeof ht.dl[key] === 'boolean') { ht.dl[key] = true; verify(s); }
  }
}
console.log(JSON.stringify({ status: 'PASS', baseline, checks: checked, maps: MAP_IDS.length, method: 'catalogue/guide fixtures against checkpoint; no browser or live authority claim' }));
