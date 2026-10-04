// Real rescue match, with optional pauses for browser inspection; never mutates engine state.
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import { getGameMap, getProvinceWorldState, findWalkingRoute } from '../shared/dist/index.js';
import { writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline';
const base = process.env.PREVIEW_URL;
if (!base || process.env.QA_ISOLATED !== '1') throw Error('Use an explicitly isolated PREVIEW_URL with QA_ISOLATED=1.');
const response = await fetch(base + '/api/rooms/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customCode: `RESCUE_${Date.now().toString(36)}`, mapId: 'ha-tinh' }) });
assert.equal(response.status, 200);
const { roomCode, hostToken } = await response.json(), socket = io(base, { transports: ['websocket'] });
await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
const joined = await new Promise(resolve => { socket.once('joined_room', resolve); socket.emit('join_room', { roomCode, playerName: 'Rescue QA', isHost: true, hostToken }); });
assert.equal(joined.success, true);
let snapshot = joined.snapshot, serial = 0, segments = 0;
const map = getGameMap('ha-tinh');
socket.on('room_snapshot', next => snapshot = next);
const terminal = createInterface({ input: process.stdin, output: process.stdout });
const waitForBrowser = label => process.env.QA_BROWSER_PAUSE === '1' ? new Promise(resolve => terminal.question(`${label}: ${roomCode}; press Enter after browser inspection\n`, resolve)) : Promise.resolve();
async function until(predicate) {
  const end = Date.now() + 10000;
  while (Date.now() < end) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 30)); }
  throw Error('Snapshot timeout');
}
async function send(type, payload) {
  const ack = await new Promise((resolve, reject) => socket.timeout(8000).emit('client_intent', { actionId: `rescue_${++serial}`, type, payload }, (error, value) => error ? reject(error) : resolve(value)));
  assert.equal(ack.success, true, `${type}: ${ack.reason}`);
}
async function act(pointId, action) {
  const point = map.points[pointId], route = findWalkingRoute(snapshot.players[joined.playerId], point, getProvinceWorldState(snapshot), map.id);
  assert.ok(route.length, `route ${pointId}`);
  for (const step of route.slice(1)) { await send('MOVE', step); segments++; }
  await until(() => Math.hypot(snapshot.players[joined.playerId].x - point.x, snapshot.players[joined.playerId].y - point.y) < 2);
  await send('HATINH_ACTION', { action });
}
try {
  for (const command of ['START', 'SKIP_BRIEFING', 'SKIP_PRACTICE']) {
    const ack = await new Promise(resolve => socket.emit('host_command', { command, hostToken }, resolve)); assert.equal(ack.success, true);
  }
  for (const [point, action] of [
    ['WORKER_TUAN','VA_REPORT_TUAN'],['CAMERA','VA_DEPLOY_CAMERA'],['SPILL','VA_CLEAN_SPILL'],['TRAFFIC_VA','VA_DIVERT_TRAFFIC'],['WEIGH_STATION','VA_WEIGH_TRUCK'],['INSPECTION_BANG','VA_INSPECT_BANG'],['INSPECTION_BANG','VA_PREPARE_DOSSIER'],['DOSSIER_DOAN','VA_NEGOTIATE_DOAN'],['TRAFFIC_VA','VA_REOPEN_ROUTE'],
    ['DEO_GATHER','DG_TRIGGER_ALERT'],['RESCUE_STAGING','DG_READY_CHECK'],
  ]) await act(point, action);
  await until(() => snapshot.hatinhState.activeScene === 'rescue');
  console.log(JSON.stringify({ roomCode, stage: 'rescue', timeOfDay: snapshot.hatinhState.dg.timeOfDay, score: snapshot.totalScore }));
  await waitForBrowser('RESCUE READY');
  for (const [point, action] of [
    ['RESCUE_TRAFFIC_A','DG_SET_BARRIER_A'],['RESCUE_TRAFFIC_B','DG_SET_BARRIER_B'],['RESCUE_TECH','DG_TURN_ROAD_LIGHT'],['RESCUE_TECH','DG_TURN_RAVINE_LIGHT'],['RESCUE_TECH','DG_SET_ANCHOR'],['RESCUE_TECH','DG_SET_ROPE'],['RESCUE_WINCH','DG_CHECK_WINCH'],['RESCUE_WINCH','DG_DESCEND_RESCUER'],
    ['RESCUE_NAM','DG_COMFORT_NAM'],['RESCUE_NAM','DG_SECURE_BIKE'],['RESCUE_NAM','DG_FIRST_AID'],['RESCUE_NAM','DG_SPLINT_NAM'],['RESCUE_NAM','DG_SIGNAL_READY_WINCH'],['RESCUE_MEDICAL','DG_PREP_RECEPTION'],['RESCUE_WINCH','DG_OPERATE_WINCH'],['RESCUE_WINCH','DG_OPERATE_WINCH'],['RESCUE_MEDICAL','DG_HANDOVER_MEDICAL'],['RESCUE_WINCH','DG_RECOVER_RESCUER'],['RESCUE_WINCH','DG_RECOVER_BIKE'],
    ['DONG_LOC_TUNG','DL_BRIEF_TUNG'],['DONG_LOC_SAU','DL_VERIFY_SAU'],['DONG_LOC_TEO','DL_VERIFY_TEO'],['DONG_LOC_TUNG','DL_FILE_DOSSIER'],['DONG_LOC_FLOW','DL_ORGANIZE_FLOW'],['DONG_LOC_HAI','DL_ASSIST_HAI'],['DONG_LOC_ALTAR','DL_SUPPLY_INCENSE'],['DONG_LOC_TIKTOKER','DL_CORRECT_TIKTOKER'],['DONG_LOC_TUNG','DL_COMPLETE_MISSION'],
  ]) await act(point, action);
  await until(() => snapshot.phase === 'RESULTS');
  assert.equal(snapshot.totalScore, 100);
  assert.deepEqual([snapshot.m1.score, snapshot.m2.score, snapshot.m3.score], [30, 35, 35]);
  const report = { base, roomCode, segments, method: 'Full rescue match via real intents and shared MOVE routes; countdown uses live server ticks; no fixture teleport', scores: [snapshot.m1.score, snapshot.m2.score, snapshot.m3.score], totalScore: snapshot.totalScore, pass: true };
  if (process.env.QA_REPORT_PATH) await writeFile(process.env.QA_REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await waitForBrowser('RESULTS READY');
} finally { terminal.close(); socket.disconnect(); }
