// Run only on an explicitly identified isolated QA instance. Uses real Socket.IO and shared routes.
import assert from 'node:assert/strict';
import { io } from 'socket.io-client';
import { GAME_MAPS, findWalkingRoute, getProvinceWorldState } from '../shared/dist/index.js';
import { writeFile } from 'node:fs/promises';

const base = process.env.PREVIEW_URL;
if (!base || process.env.QA_ISOLATED !== '1') throw Error('Set PREVIEW_URL and QA_ISOLATED=1 for your isolated QA server.');
const sockets = [], rooms = [], results = [];
let serial = 0;
const stamp = Date.now().toString(36).toUpperCase();
const emit = (peer, intent) => new Promise((resolve, reject) => peer.socket.timeout(8000).emit('client_intent', intent, (error, ack) => error ? reject(error) : resolve(ack)));
const send = (peer, type, payload) => emit(peer, { actionId: `province_${++serial}`, type, payload });
async function until(predicate, label) {
  const end = Date.now() + 8000;
  while (Date.now() < end) { if (predicate()) return; await new Promise(resolve => setTimeout(resolve, 30)); }
  throw Error(`Snapshot timeout: ${label}`);
}
async function join(room, name, playerToken, host = false) {
  const socket = io(base, { transports: ['websocket'] }); sockets.push(socket);
  await new Promise((resolve, reject) => { socket.once('connect', resolve); socket.once('connect_error', reject); });
  const joined = await new Promise(resolve => {
    socket.once('joined_room', resolve);
    socket.emit('join_room', { roomCode: room.roomCode, playerName: name, playerToken, isHost: host, hostToken: host ? room.hostToken : undefined });
  });
  assert.equal(joined.success, true);
  let latest = joined.snapshot;
  socket.on('room_snapshot', snapshot => latest = snapshot);
  return { socket, ...joined, get snapshot() { return latest; } };
}
async function host(room, command) {
  const ack = await new Promise((resolve, reject) => room.a.socket.timeout(8000).emit('host_command', { command, hostToken: room.hostToken }, (error, value) => error ? reject(error) : resolve(value)));
  assert.equal(ack.success, true, `${command}: ${ack.reason}`);
}
async function go(peer, map, targetId) {
  const target = map.points[targetId], player = peer.snapshot.players[peer.playerId];
  const route = findWalkingRoute(player, target, getProvinceWorldState(peer.snapshot), map.id);
  assert.ok(route.length, `${map.id} route to ${targetId}`);
  for (const point of route.slice(1)) assert.equal((await send(peer, 'MOVE', point)).success, true);
  await until(() => Math.hypot(peer.snapshot.players[peer.playerId].x - target.x, peer.snapshot.players[peer.playerId].y - target.y) < 2, targetId);
  return route.length - 1;
}
try {
  // Keep all rooms connected while probing another one, so cross-room isolation is observable.
  for (const map of GAME_MAPS) {
    const response = await fetch(base + '/api/rooms/create', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ customCode: `MOD_${rooms.length}_${stamp}`, mapId: map.id }) });
    assert.equal(response.status, 200);
    const room = { ...await response.json(), map };
    room.a = await join(room, 'Module QA A', undefined, true); room.b = await join(room, 'Module QA B');
    for (const command of ['START', 'SKIP_BRIEFING', 'SKIP_PRACTICE']) await host(room, command);
    await until(() => room.a.snapshot.phase === 'RUNNING' && room.b.snapshot.phase === 'RUNNING', map.id);
    rooms.push(room);
  }
  for (const room of rooms) {
    const { map, a, b } = room;
    assert.equal(a.snapshot.mapId, map.id); assert.equal(b.snapshot.mapId, map.id);
    const unaffected = rooms.filter(other => other !== room).map(other => [other, other.a.snapshot.totalScore]);
    let segments = await go(a, map, 'WAREHOUSE');
    const pickup = { actionId: `duplicate_pick_${map.id}`, type: 'PICK_CRATE', provinceId: 'ha-tinh' };
    const ack = await emit(a, pickup); assert.equal(ack.success, true); assert.deepEqual(await emit(a, pickup), ack);
    await until(() => !!b.snapshot.players[a.playerId]?.carriedCrateId, 'peer cargo');
    const crateId = a.snapshot.players[a.playerId].carriedCrateId;
    a.socket.disconnect();
    await until(() => !b.snapshot.players[a.playerId].isOnline, 'disconnect observed by peer');
    const rejoin = await join(room, 'Module QA reconnect', a.playerToken, true);
    room.a = rejoin;
    assert.equal(rejoin.playerId, a.playerId); assert.equal(rejoin.snapshot.players[a.playerId].carriedCrateId, crateId);
    const returned = await send(rejoin, 'RETURN_CRATE');
    assert.equal(returned.success, true, returned.reason);
    await host(room, 'RESUME');
    if (map.id === 'ha-tinh') {
      segments += await go(rejoin, map, 'WORKER_TUAN');
      const intent = { actionId: 'rescue_report', type: 'HATINH_ACTION', payload: { action: 'VA_REPORT_TUAN' } };
      const first = await emit(rejoin, intent); assert.equal(first.success, true); assert.deepEqual(await emit(rejoin, intent), first);
      await until(() => b.snapshot.hatinhState.va.tuanReported, 'rescue progress');
    } else {
      assert.equal((await send(rejoin, 'HATINH_ACTION', { action: 'VA_REPORT_TUAN' })).success, false);
      segments += await go(rejoin, map, 'ZONE_A');
      const intent = { actionId: 'survey', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_A' } };
      const first = await emit(rejoin, intent); assert.equal(first.success, true); assert.deepEqual(await emit(rejoin, intent), first);
      await until(() => b.snapshot.m1.surveys.A, 'timed survey');
    }
    for (const [other, score] of unaffected) assert.equal(other.a.snapshot.totalScore, score, `room isolation from ${map.id} to ${other.map.id}`);
    assert.equal(room.a.snapshot.totalScore, b.snapshot.totalScore);
    results.push({ mapId: map.id, roomCode: room.roomCode, segments, score: b.snapshot.totalScore, twoClients: true, duplicateReceipt: true, cargoRejoin: true, roomIsolation: true, representativeObjective: true, pass: true });
  }
  const report = { base, method: '7 concurrent disposable rooms, 14 real clients plus replacement sockets; MOVE follows shared navigation; no engine mutation; representative objective only', results, pass: true };
  if (process.env.QA_REPORT_PATH) await writeFile(process.env.QA_REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  if (process.env.QA_KEEP_OPEN === '1') {
    console.log('QA fixtures remain connected for browser smoke; interrupt this helper after inspection.');
    await new Promise(resolve => process.once('SIGINT', resolve));
  }
} finally { sockets.forEach(socket => socket.disconnect()); }
