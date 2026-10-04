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


const BaselineEngine = (await checkpointModule('server/src/gameEngine.ts')).GameEngine;
const savedRandom = Math.random, savedNow = Date.now;
let now = 1800000000000, runtimeChecks = 0;
Math.random = () => .5; Date.now = () => now;
function pairedRoom(mapId) {
  const old = new BaselineEngine('TRACE', 'host', mapId), current = new GameEngine('TRACE', 'host', mapId);
  const engines = [old, current];
  for (const e of engines) e.addPlayer('p', 'Người chơi', true);
  let serial = 0;
  const compare = label => {
    assert.deepEqual(JSON.parse(JSON.stringify(current.getSnapshot())), JSON.parse(JSON.stringify(old.getSnapshot())), `${mapId}: snapshot ${label}`);
    runtimeChecks++;
  };
  const at = pointId => { for (const e of engines) { const point = e.map.points[pointId]; e.players.get('p').x = point.x; e.players.get('p').y = point.y; } };
  const send = (type, payload, expectSuccess = true) => {
    const intent = { actionId: `trace_${++serial}`, type, payload };
    const a = old.handleIntent('p', intent), b = current.handleIntent('p', intent);
    assert.deepEqual(b, a, `${mapId}: ACK ${type}`);
    assert.equal(b.success, expectSuccess, `${mapId}: ${type}: ${b.reason}`);
    compare(type);
    return intent;
  };
  const tick = ms => { now += ms; for (const e of engines) e.tick(ms); compare(`tick${ms}`); };
  const host = command => { assert.deepEqual(current.hostAction(command, 'host'), old.hostAction(command, 'host')); compare(command); };
  const job = (type, pointId) => { at(pointId); send('START_JOB', { type, targetId: pointId }); const duration = current.players.get('p').activeJob.durationMs; tick(duration + 100); };
  const deliver = (pointId, count) => { for (let n = 0; n < count; n++) { at('WAREHOUSE'); send('PICK_CRATE'); at(pointId); send('DELIVER_CRATE', { targetId: pointId }); } };
  compare('join');
  host('START'); host('SKIP_BRIEFING');
  deliver('PRACTICE_TARGET', 1); job('PRACTICE_SAMPLE_JOB', 'PRACTICE_TARGET'); host('SKIP_PRACTICE');
  return { old, current, engines, at, send, tick, host, job, deliver, compare };
}
try {
  for (const mapId of MAP_IDS.filter(id => id !== 'ha-tinh')) for (const clinic of ['FIXED', 'MOBILE']) for (const response of ['REPAIR', 'DETOUR']) {
    const t = pairedRoom(mapId), { at, send, job, deliver, host, tick, compare } = t;
    for (const zone of ['ZONE_A', 'ZONE_B', 'ZONE_C']) job('SURVEY_ZONE', zone);
    at('HEADQUARTERS'); send('PROPOSE_PLAN', { missionId: 'M1', plan: clinic });
    for (const pointId of clinic === 'FIXED' ? ['CLINIC_FIXED'] : ['CLINIC_MOBILE_B', 'CLINIC_MOBILE_C']) {
      deliver(pointId, 2); job(clinic === 'FIXED' ? 'DEPLOY_FIXED_CLINIC' : 'DEPLOY_MOBILE_CLINIC', pointId); job('AUDIT_RESULT', pointId);
    }
    at('NOTICE_BOARD'); send('PUBLISH_NOTICE', { missionId: 'M1' });
    at('BRIDGE'); send('START_JOB', { type: 'SURVEY_BRIDGE', targetId: 'BRIDGE' });
    at('HEADQUARTERS'); send('PROPOSE_PLAN', { missionId: 'M2', plan: response });
    if (response === 'REPAIR') { deliver('BRIDGE', 2); job('REPAIR_BRIDGE_1', 'BRIDGE_TASK_1'); job('REPAIR_BRIDGE_2', 'BRIDGE_TASK_2'); }
    deliver('ZONE_B', 2); job('AUDIT_RESULT', 'ZONE_B'); at('NOTICE_BOARD'); send('PUBLISH_NOTICE', { missionId: 'M2' });
    at('ZONE_C'); send('START_JOB', { type: 'RECEIVE_FEEDBACK_C', targetId: 'ZONE_C' });
    const clinicPoint = clinic === 'FIXED' ? 'CLINIC_FIXED' : 'CLINIC_MOBILE_C'; at(clinicPoint); send('START_JOB', { type: 'CROSS_CHECK_CLINIC', targetId: clinicPoint });
    at('HEADQUARTERS'); send('CONFIRM_M3_PLAN');
    for (const pointId of ['CITIZEN_C1', 'CITIZEN_C2']) { deliver(pointId, 1); job('SUPPORT_CITIZEN', pointId); }
    job('AUDIT_LEDGER', 'WAREHOUSE'); at('NOTICE_BOARD'); const last = send('PUBLISH_NOTICE', { missionId: 'M3' });
    assert.equal(t.current.totalScore, 100);
    assert.deepEqual(t.current.handleIntent('p', last), t.old.handleIntent('p', last)); compare('receipt replay');
    host('RESET'); compare('reset');
    for (const e of t.engines) e.removeOrDisconnectPlayer('p'); tick(11000);
    for (const e of t.engines) e.addPlayer('p', 'Người chơi'); compare('rejoin');
  }
  const t = pairedRoom('ha-tinh');
  const action = (pointId, code) => { t.at(pointId); t.send('HATINH_ACTION', { action: code }); };
  for (const [pointId, code] of [
    ['WORKER_TUAN','VA_REPORT_TUAN'],['CAMERA','VA_DEPLOY_CAMERA'],['SPILL','VA_CLEAN_SPILL'],['TRAFFIC_VA','VA_DIVERT_TRAFFIC'],['WEIGH_STATION','VA_WEIGH_TRUCK'],['INSPECTION_BANG','VA_INSPECT_BANG'],['INSPECTION_BANG','VA_PREPARE_DOSSIER'],['DOSSIER_DOAN','VA_NEGOTIATE_DOAN'],['TRAFFIC_VA','VA_REOPEN_ROUTE'],
    ['DEO_GATHER','DG_TRIGGER_ALERT'],['RESCUE_STAGING','DG_READY_CHECK'],
  ]) action(pointId, code);
  t.tick(3200);
  for (const [pointId, code] of [
    ['RESCUE_TRAFFIC_A','DG_SET_BARRIER_A'],['RESCUE_TRAFFIC_B','DG_SET_BARRIER_B'],['RESCUE_TECH','DG_TURN_ROAD_LIGHT'],['RESCUE_TECH','DG_TURN_RAVINE_LIGHT'],['RESCUE_TECH','DG_SET_ANCHOR'],['RESCUE_TECH','DG_SET_ROPE'],['RESCUE_WINCH','DG_CHECK_WINCH'],['RESCUE_WINCH','DG_DESCEND_RESCUER'],
    ['RESCUE_NAM','DG_COMFORT_NAM'],['RESCUE_NAM','DG_SECURE_BIKE'],['RESCUE_NAM','DG_FIRST_AID'],['RESCUE_NAM','DG_SPLINT_NAM'],['RESCUE_NAM','DG_SIGNAL_READY_WINCH'],['RESCUE_MEDICAL','DG_PREP_RECEPTION'],['RESCUE_WINCH','DG_OPERATE_WINCH'],['RESCUE_WINCH','DG_OPERATE_WINCH'],['RESCUE_MEDICAL','DG_HANDOVER_MEDICAL'],['RESCUE_WINCH','DG_RECOVER_RESCUER'],['RESCUE_WINCH','DG_RECOVER_BIKE'],
    ['DONG_LOC_TUNG','DL_BRIEF_TUNG'],['DONG_LOC_SAU','DL_VERIFY_SAU'],['DONG_LOC_TEO','DL_VERIFY_TEO'],['DONG_LOC_TUNG','DL_FILE_DOSSIER'],['DONG_LOC_FLOW','DL_ORGANIZE_FLOW'],['DONG_LOC_HAI','DL_ASSIST_HAI'],['DONG_LOC_ALTAR','DL_SUPPLY_INCENSE'],['DONG_LOC_TIKTOKER','DL_CORRECT_TIKTOKER'],['DONG_LOC_TUNG','DL_COMPLETE_MISSION'],
  ]) action(pointId, code);
  assert.equal(t.current.totalScore,100); t.host('RESET');
} finally { Math.random = savedRandom; Date.now = savedNow; }
console.log(JSON.stringify({ status:'PASS',baseline,catalogueGuideFixtures:checked,runtimeSnapshots:runtimeChecks,maps:MAP_IDS.length,publicServiceMatches:24,hatinhMatches:1,method:'checkpoint ACK/snapshot traces; positions set only in rule fixtures, not a browser/movement claim' }));
