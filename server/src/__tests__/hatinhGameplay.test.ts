import { createTestEngine, serviceStateOf, rescueStateOf } from './fixtures/gameplay.js';
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../gameEngine.js';
import { getGameMap, resolveInteraction, getInteractionActions } from 'shared';

describe('Hà Tĩnh Complete Gameplay - 3 Quests & Multiplayer', () => {
  const map = getGameMap('ha-tinh');
  const at = (p: { x: number; y: number }, pointKey: string) => {
    const pt = map.points[pointKey];
    if (!pt) throw new Error(`Missing point ${pointKey}`);
    p.x = pt.x;
    p.y = pt.y;
  };

  const setupEngine = (playerCount = 1) => {
    const e = createTestEngine('HT_TEST', 'host', 'ha-tinh');
    const players = [];
    for (let i = 1; i <= playerCount; i++) {
      players.push(e.addPlayer(`p${i}`, `Người chơi ${i}`, i === 1));
    }
    e.startRunning();
    return { e, players, p1: players[0] };
  };

  it('T01: Solo play Quest 1 (Vũng Áng) completes sequentially with 30 points', () => {
    const { e, p1 } = setupEngine(1);
    expect(e.hatinhState).toBeDefined();
    expect(e.hatinhState!.currentQuest).toBe(1);
    expect(e.hatinhState!.va.status).toBe('ACTIVE');

    // Step 1: Worker Tuan
    at(p1, 'WORKER_TUAN');
    let res = e.handleIntent(p1.id, { actionId: 'a1', type: 'HATINH_ACTION', payload: { action: 'VA_REPORT_TUAN' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.va.tuanReported).toBe(true);
    expect(e.hatinhState!.va.score).toBe(3);

    // Step 2: Camera
    at(p1, 'CAMERA');
    res = e.handleIntent(p1.id, { actionId: 'a2', type: 'HATINH_ACTION', payload: { action: 'VA_DEPLOY_CAMERA' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.va.cameraDeployed).toBe(true);
    expect(e.hatinhState!.va.score).toBe(7);

    // Step 3: Spill
    at(p1, 'SPILL');
    res = e.handleIntent(p1.id, { actionId: 'a3', type: 'HATINH_ACTION', payload: { action: 'VA_CLEAN_SPILL' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.va.spillCleaned).toBe(true);
    expect(e.hatinhState!.va.score).toBe(11);

    // Step 4: Traffic diversion
    at(p1, 'TRAFFIC_VA');
    res = e.handleIntent(p1.id, { actionId: 'a4', type: 'HATINH_ACTION', payload: { action: 'VA_DIVERT_TRAFFIC' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.va.trafficDiverted).toBe(true);
    expect(e.hatinhState!.va.score).toBe(15);

    // Step 5: Weigh station
    at(p1, 'WEIGH_STATION');
    res = e.handleIntent(p1.id, { actionId: 'a5', type: 'HATINH_ACTION', payload: { action: 'VA_WEIGH_TRUCK' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.va.weighed).toBe(true);
    expect(e.hatinhState!.va.score).toBe(19);

    // Step 6: Bang inspects truck
    at(p1, 'INSPECTION_BANG');
    res = e.handleIntent(p1.id, { actionId: 'a6', type: 'HATINH_ACTION', payload: { action: 'VA_INSPECT_BANG' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.va.inspectedBang).toBe(true);
    expect(e.hatinhState!.va.score).toBe(23);

    // Step 7: Dossier prepared
    at(p1, 'INSPECTION_BANG');
    res = e.handleIntent(p1.id, { actionId: 'a7', type: 'HATINH_ACTION', payload: { action: 'VA_PREPARE_DOSSIER' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.va.dossierPrepared).toBe(true);
    expect(e.hatinhState!.va.score).toBe(26);

    // Step 8: Negotiate Doan
    at(p1, 'DOSSIER_DOAN');
    res = e.handleIntent(p1.id, { actionId: 'a8', type: 'HATINH_ACTION', payload: { action: 'VA_NEGOTIATE_DOAN' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.va.negotiatedDoan).toBe(true);
    expect(e.hatinhState!.va.score).toBe(28);

    // Step 9: Reopen route
    at(p1, 'TRAFFIC_VA');
    res = e.handleIntent(p1.id, { actionId: 'a9', type: 'HATINH_ACTION', payload: { action: 'VA_REOPEN_ROUTE' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.va.routeReopened).toBe(true);
    expect(e.hatinhState!.va.status).toBe('RESOLVED');
    expect(e.hatinhState!.va.score).toBe(30);
    expect(e.hatinhState!.currentQuest).toBe(2);
    expect(e.totalScore).toBe(30);
    expect(e.m1.score).toBe(30);
  });

  it('T02: Quest 1 strictly validates distances and prerequisites', () => {
    const { e, p1 } = setupEngine(1);

    // Cannot report when far away
    p1.x = 0; p1.y = 0;
    let res = e.handleIntent(p1.id, { actionId: 'err1', type: 'HATINH_ACTION', payload: { action: 'VA_REPORT_TUAN' } });
    expect(res.success).toBe(false);

    // Cannot deploy camera before reporting
    at(p1, 'CAMERA');
    res = e.handleIntent(p1.id, { actionId: 'err2', type: 'HATINH_ACTION', payload: { action: 'VA_DEPLOY_CAMERA' } });
    expect(res.success).toBe(false);

    // Cannot weigh before diverting traffic
    at(p1, 'WEIGH_STATION');
    res = e.handleIntent(p1.id, { actionId: 'err3', type: 'HATINH_ACTION', payload: { action: 'VA_WEIGH_TRUCK' } });
    expect(res.success).toBe(false);

    // Cannot reopen route prematurely
    at(p1, 'TRAFFIC_VA');
    res = e.handleIntent(p1.id, { actionId: 'err4', type: 'HATINH_ACTION', payload: { action: 'VA_REOPEN_ROUTE' } });
    expect(res.success).toBe(false);
  });

  it('T03: Quest 2 (Đèo Ngang) Ready check, 3-2-1 countdown, and dusk/fog transition', () => {
    const { e, p1 } = setupEngine(1);
    rescueStateOf(e).currentQuest = 2;

    // Trigger alert
    at(p1, 'DEO_GATHER');
    let res = e.handleIntent(p1.id, { actionId: 'alert', type: 'HATINH_ACTION', payload: { action: 'DG_TRIGGER_ALERT' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.dg.status).toBe('GATHERING');

    // Rally at Staging & Ready check
    at(p1, 'RESCUE_STAGING');
    res = e.handleIntent(p1.id, { actionId: 'ready', type: 'HATINH_ACTION', payload: { action: 'DG_READY_CHECK' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.dg.status).toBe('COUNTDOWN');
    expect(e.hatinhState!.dg.countdownRemaining).toBe(3);
    expect(e.hatinhState!.dg.timeOfDay).toBe('afternoon');

    // Tick countdown
    e.tick(1600);
    expect(e.hatinhState!.dg.status).toBe('COUNTDOWN');
    expect(e.hatinhState!.dg.countdownRemaining).toBeLessThanOrEqual(1.5);

    // Complete countdown
    e.tick(1600);
    expect(e.hatinhState!.dg.status).toBe('ACTIVE');
    expect(e.hatinhState!.activeScene).toBe('rescue');
    expect(e.hatinhState!.dg.timeOfDay).toBe('dusk');
  });

  it('T04: Quest 2 strictly enforces safety dependencies before rescuer descends and winches', () => {
    const { e, p1 } = setupEngine(1);
    rescueStateOf(e).currentQuest = 2;

    at(p1, 'DEO_GATHER');
    e.handleIntent(p1.id, { actionId: 'al', type: 'HATINH_ACTION', payload: { action: 'DG_TRIGGER_ALERT' } });
    at(p1, 'RESCUE_STAGING');
    e.handleIntent(p1.id, { actionId: 'rd', type: 'HATINH_ACTION', payload: { action: 'DG_READY_CHECK' } });
    e.tick(3200);
    expect(e.hatinhState!.dg.status).toBe('ACTIVE');
    expect(e.hatinhState!.activeScene).toBe('rescue');
    expect(e.hatinhState!.dg.timeOfDay).toBe('dusk');

    // Cannot descend yet
    at(p1, 'RESCUE_WINCH');
    let res = e.handleIntent(p1.id, { actionId: 'descend_early', type: 'HATINH_ACTION', payload: { action: 'DG_DESCEND_RESCUER' } });
    expect(res.success).toBe(false);

    // Secure Traffic A & B
    at(p1, 'RESCUE_TRAFFIC_A');
    res = e.handleIntent(p1.id, { actionId: 'barA', type: 'HATINH_ACTION', payload: { action: 'DG_SET_BARRIER_A' } });
    expect(res.success).toBe(true);

    at(p1, 'RESCUE_TRAFFIC_B');
    res = e.handleIntent(p1.id, { actionId: 'barB', type: 'HATINH_ACTION', payload: { action: 'DG_SET_BARRIER_B' } });
    expect(res.success).toBe(true);

    // Tech zone: Road light, Ravine light, Anchor, Rope
    at(p1, 'RESCUE_TECH');
    res = e.handleIntent(p1.id, { actionId: 'light1', type: 'HATINH_ACTION', payload: { action: 'DG_TURN_ROAD_LIGHT' } });
    expect(res.success).toBe(true);

    res = e.handleIntent(p1.id, { actionId: 'light2', type: 'HATINH_ACTION', payload: { action: 'DG_TURN_RAVINE_LIGHT' } });
    expect(res.success).toBe(true);

    res = e.handleIntent(p1.id, { actionId: 'anc', type: 'HATINH_ACTION', payload: { action: 'DG_SET_ANCHOR' } });
    expect(res.success).toBe(true);

    res = e.handleIntent(p1.id, { actionId: 'rope', type: 'HATINH_ACTION', payload: { action: 'DG_SET_ROPE' } });
    expect(res.success).toBe(true);

    // Winch ready
    at(p1, 'RESCUE_WINCH');
    res = e.handleIntent(p1.id, { actionId: 'winch_chk', type: 'HATINH_ACTION', payload: { action: 'DG_CHECK_WINCH' } });
    expect(res.success).toBe(true);

    // Now descent is permitted
    res = e.handleIntent(p1.id, { actionId: 'descend', type: 'HATINH_ACTION', payload: { action: 'DG_DESCEND_RESCUER' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.dg.rescuerDown).toBe(true);

    // Under ravine: Comfort Nam & Secure Bike Hazard
    at(p1, 'RESCUE_NAM');
    res = e.handleIntent(p1.id, { actionId: 'comfort', type: 'HATINH_ACTION', payload: { action: 'DG_COMFORT_NAM' } });
    expect(res.success).toBe(true);

    res = e.handleIntent(p1.id, { actionId: 'bike_sec', type: 'HATINH_ACTION', payload: { action: 'DG_SECURE_BIKE' } });
    expect(res.success).toBe(true);

    // First Aid & Splint
    res = e.handleIntent(p1.id, { actionId: 'aid', type: 'HATINH_ACTION', payload: { action: 'DG_FIRST_AID' } });
    expect(res.success).toBe(true);

    res = e.handleIntent(p1.id, { actionId: 'splint', type: 'HATINH_ACTION', payload: { action: 'DG_SPLINT_NAM' } });
    expect(res.success).toBe(true);

    // Cannot operate winch before signal
    at(p1, 'RESCUE_WINCH');
    res = e.handleIntent(p1.id, { actionId: 'winch_early', type: 'HATINH_ACTION', payload: { action: 'DG_OPERATE_WINCH' } });
    expect(res.success).toBe(false);

    // Signal ready from ravine
    at(p1, 'RESCUE_NAM');
    res = e.handleIntent(p1.id, { actionId: 'sig', type: 'HATINH_ACTION', payload: { action: 'DG_SIGNAL_READY_WINCH' } });
    expect(res.success).toBe(true);

    // Prep reception at medical
    at(p1, 'RESCUE_MEDICAL');
    res = e.handleIntent(p1.id, { actionId: 'med_prep', type: 'HATINH_ACTION', payload: { action: 'DG_PREP_RECEPTION' } });
    expect(res.success).toBe(true);

    // Operate winch
    at(p1, 'RESCUE_WINCH');
    res = e.handleIntent(p1.id, { actionId: 'w1', type: 'HATINH_ACTION', payload: { action: 'DG_OPERATE_WINCH' } });
    expect(res.success).toBe(true);
    res = e.handleIntent(p1.id, { actionId: 'w2', type: 'HATINH_ACTION', payload: { action: 'DG_OPERATE_WINCH' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.dg.namLifted).toBe(true);

    // Medical handover
    at(p1, 'RESCUE_MEDICAL');
    res = e.handleIntent(p1.id, { actionId: 'handover', type: 'HATINH_ACTION', payload: { action: 'DG_HANDOVER_MEDICAL' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.dg.medicalReceived).toBe(true);

    // Recover rescuer and bike
    at(p1, 'RESCUE_WINCH');
    res = e.handleIntent(p1.id, { actionId: 'rec_rescuer', type: 'HATINH_ACTION', payload: { action: 'DG_RECOVER_RESCUER' } });
    expect(res.success).toBe(true);

    res = e.handleIntent(p1.id, { actionId: 'rec_bike', type: 'HATINH_ACTION', payload: { action: 'DG_RECOVER_BIKE' } });
    expect(res.success).toBe(true);

    expect(e.hatinhState!.dg.status).toBe('RESOLVED');
    expect(e.hatinhState!.dg.score).toBe(35);
    expect(e.hatinhState!.currentQuest).toBe(3);
    expect(e.m2.score).toBe(35);
  });

  it('T05: Quest 3 (Đồng Lộc) 3 parallel branches & match conclusion at 100 points', () => {
    const { e, p1 } = setupEngine(1);
    rescueStateOf(e).va.score = 30;
    rescueStateOf(e).va.status = 'RESOLVED';
    rescueStateOf(e).dg.score = 35;
    rescueStateOf(e).dg.status = 'RESOLVED';
    rescueStateOf(e).currentQuest = 3;

    // Briefing with Bac Tung
    at(p1, 'DONG_LOC_TUNG');
    let res = e.handleIntent(p1.id, { actionId: 'tung', type: 'HATINH_ACTION', payload: { action: 'DL_BRIEF_TUNG' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.dl.tungBriefed).toBe(true);

    // Branch 1: Mu Sau & Teo
    at(p1, 'DONG_LOC_SAU');
    res = e.handleIntent(p1.id, { actionId: 'sau', type: 'HATINH_ACTION', payload: { action: 'DL_VERIFY_SAU' } });
    expect(res.success).toBe(true);

    at(p1, 'DONG_LOC_TEO');
    res = e.handleIntent(p1.id, { actionId: 'teo', type: 'HATINH_ACTION', payload: { action: 'DL_VERIFY_TEO' } });
    expect(res.success).toBe(true);

    at(p1, 'DONG_LOC_TUNG');
    res = e.handleIntent(p1.id, { actionId: 'dossier', type: 'HATINH_ACTION', payload: { action: 'DL_FILE_DOSSIER' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.dl.dossierFiled).toBe(true);

    // Branch 2: Flow, Bac Hai, Incense Altar
    at(p1, 'DONG_LOC_FLOW');
    res = e.handleIntent(p1.id, { actionId: 'flow', type: 'HATINH_ACTION', payload: { action: 'DL_ORGANIZE_FLOW' } });
    expect(res.success).toBe(true);

    at(p1, 'DONG_LOC_HAI');
    res = e.handleIntent(p1.id, { actionId: 'hai', type: 'HATINH_ACTION', payload: { action: 'DL_ASSIST_HAI' } });
    expect(res.success).toBe(true);

    at(p1, 'DONG_LOC_ALTAR');
    res = e.handleIntent(p1.id, { actionId: 'incense', type: 'HATINH_ACTION', payload: { action: 'DL_SUPPLY_INCENSE' } });
    expect(res.success).toBe(true);

    // Branch 3: TikToker
    at(p1, 'DONG_LOC_TIKTOKER');
    res = e.handleIntent(p1.id, { actionId: 'tik', type: 'HATINH_ACTION', payload: { action: 'DL_CORRECT_TIKTOKER' } });
    expect(res.success).toBe(true);

    // Conclude mission at Dong Loc
    at(p1, 'DONG_LOC_TUNG');
    res = e.handleIntent(p1.id, { actionId: 'complete', type: 'HATINH_ACTION', payload: { action: 'DL_COMPLETE_MISSION' } });
    expect(res.success).toBe(true);
    expect(e.hatinhState!.dl.status).toBe('RESOLVED');
    expect(e.hatinhState!.dl.score).toBe(35);
    expect(e.hatinhState!.score.total).toBe(100);
    expect(e.totalScore).toBe(100);
    expect(e.phase).toBe('RESULTS');
  });

  it('T06: Multiplayer 4-player team coordination and individual contributions', () => {
    const { e, players } = setupEngine(4);
    const [p1, p2, p3, p4] = players;
    rescueStateOf(e).currentQuest = 2;
    rescueStateOf(e).dg.status = 'ACTIVE';
    rescueStateOf(e).activeScene = 'rescue';
    rescueStateOf(e).dg.timeOfDay = 'dusk';

    // Player 1 sets Traffic A
    at(p1, 'RESCUE_TRAFFIC_A');
    expect(e.handleIntent(p1.id, { actionId: 'mp_a', type: 'HATINH_ACTION', payload: { action: 'DG_SET_BARRIER_A' } }).success).toBe(true);

    // Player 2 sets Traffic B
    at(p2, 'RESCUE_TRAFFIC_B');
    expect(e.handleIntent(p2.id, { actionId: 'mp_b', type: 'HATINH_ACTION', payload: { action: 'DG_SET_BARRIER_B' } }).success).toBe(true);

    // Player 3 sets Tech
    at(p3, 'RESCUE_TECH');
    e.handleIntent(p3.id, { actionId: 'mp_l1', type: 'HATINH_ACTION', payload: { action: 'DG_TURN_ROAD_LIGHT' } });
    e.handleIntent(p3.id, { actionId: 'mp_l2', type: 'HATINH_ACTION', payload: { action: 'DG_TURN_RAVINE_LIGHT' } });
    e.handleIntent(p3.id, { actionId: 'mp_anc', type: 'HATINH_ACTION', payload: { action: 'DG_SET_ANCHOR' } });
    e.handleIntent(p3.id, { actionId: 'mp_rope', type: 'HATINH_ACTION', payload: { action: 'DG_SET_ROPE' } });

    // Player 4 checks winch
    at(p4, 'RESCUE_WINCH');
    e.handleIntent(p4.id, { actionId: 'mp_winch', type: 'HATINH_ACTION', payload: { action: 'DG_CHECK_WINCH' } });

    // Now rescuer descends
    expect(e.handleIntent(p4.id, { actionId: 'mp_descend', type: 'HATINH_ACTION', payload: { action: 'DG_DESCEND_RESCUER' } }).success).toBe(true);

    // Verify personal contributions recorded
    expect(e.personalContributions.get(p1.id)!.deployments).toBeGreaterThan(0);
    expect(e.personalContributions.get(p2.id)!.deployments).toBeGreaterThan(0);
    expect(e.personalContributions.get(p3.id)!.deployments).toBeGreaterThan(0);
    expect(e.personalContributions.get(p4.id)!.deployments).toBeGreaterThan(0);
  });

  it('T07: Disconnect, reconnect, and interaction resolver accuracy', () => {
    const { e, p1 } = setupEngine(1);
    at(p1, 'WORKER_TUAN');

    // Contextual interaction resolved for E key
    const context = resolveInteraction(e.getSnapshot(), p1.id);
    expect(context.primary).toBeDefined();
    expect(context.primary!.intent.type).toBe('HATINH_ACTION');
    expect(context.primary!.intent.payload).toEqual({ action: 'VA_REPORT_TUAN' });

    // Execute action
    e.handleIntent(p1.id, { actionId: 'rep1', type: 'HATINH_ACTION', payload: { action: 'VA_REPORT_TUAN' } });
    expect(e.hatinhState!.va.score).toBe(3);

    // Idempotent retry does not duplicate points
    e.handleIntent(p1.id, { actionId: 'rep2', type: 'HATINH_ACTION', payload: { action: 'VA_REPORT_TUAN' } });
    expect(e.hatinhState!.va.score).toBe(3);

    // Disconnect and reconnect
    e.removeOrDisconnectPlayer(p1.id);
    expect(e.players.get(p1.id)!.isOnline).toBe(false);

    e.addPlayer(p1.id, p1.name);
    expect(e.players.get(p1.id)!.isOnline).toBe(true);
    expect(e.getSnapshot().hatinhState!.va.score).toBe(3);
  });
});
