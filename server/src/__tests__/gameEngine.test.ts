import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../gameEngine.js';
import { RoomManager } from '../roomManager.js';
import { POINTS_OF_INTEREST } from 'shared';

describe('GameEngine - Full MVP Verification', () => {
  let engine: GameEngine;
  const hostToken = 'TEST_HOST_TOKEN';

  beforeEach(() => {
    engine = new GameEngine('TEST_ROOM', hostToken);
  });

  it('Scenario 1: Solo player can perform entire game from start to finish without locks', () => {
    const p1 = engine.addPlayer('p1', 'Player Solo', true);
    expect(p1).toBeDefined();
    expect(engine.getOnlinePlayerCount()).toBe(1);

    // Host starts running directly (skipping intro/practice)
    engine.startRunning();
    expect(engine.phase).toBe('RUNNING');
    expect(engine.m1.status).toBe('ACTIVE');

    // 1. Survey A, B, C
    // Move to Zone A
    p1.x = POINTS_OF_INTEREST.ZONE_A.x;
    p1.y = POINTS_OF_INTEREST.ZONE_A.y;
    let ack = engine.handleIntent('p1', {
      actionId: 's1',
      type: 'START_JOB',
      payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_A' }
    });
    expect(ack.success).toBe(true);
    expect(p1.activeJob).not.toBeNull();

    // Fast-forward tick for survey duration (4000ms)
    engine.tick(4100);
    expect(p1.activeJob).toBeNull();
    expect(engine.m1.surveys.A).toBe(true);
    expect(engine.totalScore).toBe(2);

    // Move to Zone B
    p1.x = POINTS_OF_INTEREST.ZONE_B.x;
    p1.y = POINTS_OF_INTEREST.ZONE_B.y;
    engine.handleIntent('p1', {
      actionId: 's2',
      type: 'START_JOB',
      payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_B' }
    });
    engine.tick(4100);
    expect(engine.m1.surveys.B).toBe(true);
    expect(engine.totalScore).toBe(4);

    // Move to Zone C
    p1.x = POINTS_OF_INTEREST.ZONE_C.x;
    p1.y = POINTS_OF_INTEREST.ZONE_C.y;
    engine.handleIntent('p1', {
      actionId: 's3',
      type: 'START_JOB',
      payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_C' }
    });
    engine.tick(4100);
    expect(engine.m1.surveys.C).toBe(true);
    expect(engine.totalScore).toBe(6);

    // 2. Propose & Commit Plan FIXED at Headquarters (Solo instant resolve)
    p1.x = POINTS_OF_INTEREST.HEADQUARTERS.x;
    p1.y = POINTS_OF_INTEREST.HEADQUARTERS.y;
    ack = engine.handleIntent('p1', {
      actionId: 'prop_m1',
      type: 'PROPOSE_PLAN',
      payload: { missionId: 'M1', plan: 'FIXED' }
    });
    expect(ack.success).toBe(true);
    expect(engine.m1.planCommitted).toBe('FIXED');
    expect(engine.resources.currentBudget).toBe(60); // 100 - 40

    // 3. Logistics: Deliver 2 crates from warehouse to Fixed Clinic
    // Pick crate 1
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x;
    p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    ack = engine.handleIntent('p1', { actionId: 'pick_1', type: 'PICK_CRATE' });
    expect(ack.success).toBe(true);
    expect(p1.carriedCrateId).toBe('CRATE_1');

    // Deliver crate 1
    p1.x = POINTS_OF_INTEREST.CLINIC_FIXED.x;
    p1.y = POINTS_OF_INTEREST.CLINIC_FIXED.y;
    ack = engine.handleIntent('p1', { actionId: 'del_1', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_FIXED' } });
    expect(ack.success).toBe(true);
    expect(engine.m1.deliveredCratesFixed).toBe(1);

    // Pick crate 2
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x;
    p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'pick_2', type: 'PICK_CRATE' });

    // Deliver crate 2
    p1.x = POINTS_OF_INTEREST.CLINIC_FIXED.x;
    p1.y = POINTS_OF_INTEREST.CLINIC_FIXED.y;
    engine.handleIntent('p1', { actionId: 'del_2', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_FIXED' } });
    expect(engine.m1.deliveredCratesFixed).toBe(2);

    // 4. Deploy Fixed Clinic (8s job, uses manpower)
    expect(engine.manpower.busy).toBe(0);
    ack = engine.handleIntent('p1', {
      actionId: 'deploy_fix',
      type: 'START_JOB',
      payload: { type: 'DEPLOY_FIXED_CLINIC', targetId: 'CLINIC_FIXED' }
    });
    expect(ack.success).toBe(true);
    expect(engine.manpower.busy).toBe(1);
    engine.tick(8100);
    expect(engine.manpower.busy).toBe(0);
    expect(engine.m1.fixedDeployed).toBe(true);
    expect(engine.m1.score).toBe(16); // 6 survey + 10 deploy

    // 5. Verify results at Fixed Clinic (8s or 4s, delivers 8 pts)
    ack = engine.handleIntent('p1', {
      actionId: 'ver_m1',
      type: 'START_JOB',
      payload: { type: 'AUDIT_RESULT', targetId: 'CLINIC_FIXED' }
    });
    expect(ack.success).toBe(true);
    engine.tick(4100);
    expect(engine.m1.verifiedA).toBe(true);
    expect(engine.citizens.filter(c => c.served).length).toBe(22); // A12 + B10
    expect(engine.m1.score).toBe(24);

    // 6. Publish notice board M1
    p1.x = POINTS_OF_INTEREST.NOTICE_BOARD.x;
    p1.y = POINTS_OF_INTEREST.NOTICE_BOARD.y;
    ack = engine.handleIntent('p1', { actionId: 'pub_m1', type: 'PUBLISH_NOTICE', payload: { missionId: 'M1' } });
    expect(ack.success).toBe(true);
    expect(engine.m1.score).toBe(30);
    expect(engine.m1.status).toBe('RESOLVED');
    expect(engine.m2.status).toBe('ACTIVE');
    expect(engine.m2.bridgeBroken).toBe(true);
  });

  it('Combo 1 Complete: FIXED + REPAIR + M3 reaches 100 points and correct resource balance', () => {
    const p1 = engine.addPlayer('p1', 'Player Solo', true);
    engine.startRunning();

    // M1
    p1.x = POINTS_OF_INTEREST.ZONE_A.x; p1.y = POINTS_OF_INTEREST.ZONE_A.y;
    engine.handleIntent('p1', { actionId: 'a1', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_A' } });
    engine.tick(4100);
    p1.x = POINTS_OF_INTEREST.ZONE_B.x; p1.y = POINTS_OF_INTEREST.ZONE_B.y;
    engine.handleIntent('p1', { actionId: 'a2', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_B' } });
    engine.tick(4100);
    p1.x = POINTS_OF_INTEREST.ZONE_C.x; p1.y = POINTS_OF_INTEREST.ZONE_C.y;
    engine.handleIntent('p1', { actionId: 'a3', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_C' } });
    engine.tick(4100);

    p1.x = POINTS_OF_INTEREST.HEADQUARTERS.x; p1.y = POINTS_OF_INTEREST.HEADQUARTERS.y;
    engine.handleIntent('p1', { actionId: 'a4', type: 'PROPOSE_PLAN', payload: { missionId: 'M1', plan: 'FIXED' } });

    // Deliver 2 crates
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'a5', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CLINIC_FIXED.x; p1.y = POINTS_OF_INTEREST.CLINIC_FIXED.y;
    engine.handleIntent('p1', { actionId: 'a6', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_FIXED' } });

    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'a7', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CLINIC_FIXED.x; p1.y = POINTS_OF_INTEREST.CLINIC_FIXED.y;
    engine.handleIntent('p1', { actionId: 'a8', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_FIXED' } });

    engine.handleIntent('p1', { actionId: 'a9', type: 'START_JOB', payload: { type: 'DEPLOY_FIXED_CLINIC', targetId: 'CLINIC_FIXED' } });
    engine.tick(8100);

    engine.handleIntent('p1', { actionId: 'a10', type: 'START_JOB', payload: { type: 'AUDIT_RESULT', targetId: 'CLINIC_FIXED' } });
    engine.tick(4100);

    p1.x = POINTS_OF_INTEREST.NOTICE_BOARD.x; p1.y = POINTS_OF_INTEREST.NOTICE_BOARD.y;
    engine.handleIntent('p1', { actionId: 'a11', type: 'PUBLISH_NOTICE', payload: { missionId: 'M1' } });
    expect(engine.m1.status).toBe('RESOLVED');
    expect(engine.totalScore).toBe(30);

    // M2: REPAIR
    // 1. Survey bridge
    p1.x = POINTS_OF_INTEREST.BRIDGE.x; p1.y = POINTS_OF_INTEREST.BRIDGE.y;
    engine.surveyBridgeM2(p1);
    expect(engine.m2.surveyDone).toBe(true);

    // 2. Propose & commit REPAIR at HQ
    p1.x = POINTS_OF_INTEREST.HEADQUARTERS.x; p1.y = POINTS_OF_INTEREST.HEADQUARTERS.y;
    engine.handleIntent('p1', { actionId: 'm2_prop', type: 'PROPOSE_PLAN', payload: { missionId: 'M2', plan: 'REPAIR' } });
    expect(engine.m2.planCommitted).toBe('REPAIR');
    expect(engine.resources.currentBudget).toBe(35); // 100 - 40 - 25

    // 3. Deliver 2 crates for bridge repair
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm2_c1', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.BRIDGE.x; p1.y = POINTS_OF_INTEREST.BRIDGE.y;
    engine.handleIntent('p1', { actionId: 'm2_d1', type: 'DELIVER_CRATE', payload: { targetId: 'BRIDGE' } });

    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm2_c2', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.BRIDGE.x; p1.y = POINTS_OF_INTEREST.BRIDGE.y;
    engine.handleIntent('p1', { actionId: 'm2_d2', type: 'DELIVER_CRATE', payload: { targetId: 'BRIDGE' } });
    expect(engine.m2.bridgeCratesDelivered).toBe(2);

    // 4. Do two repair tasks
    p1.x = POINTS_OF_INTEREST.BRIDGE_TASK_1.x; p1.y = POINTS_OF_INTEREST.BRIDGE_TASK_1.y;
    engine.handleIntent('p1', { actionId: 'rep_1', type: 'START_JOB', payload: { type: 'REPAIR_BRIDGE_1', targetId: 'BRIDGE_TASK_1' } });
    engine.tick(8100);
    expect(engine.m2.bridgeRepairTask1).toBe(true);

    p1.x = POINTS_OF_INTEREST.BRIDGE_TASK_2.x; p1.y = POINTS_OF_INTEREST.BRIDGE_TASK_2.y;
    engine.handleIntent('p1', { actionId: 'rep_2', type: 'START_JOB', payload: { type: 'REPAIR_BRIDGE_2', targetId: 'BRIDGE_TASK_2' } });
    engine.tick(8100);
    expect(engine.m2.bridgeRepairTask2).toBe(true);
    expect(engine.m2.bridgeRepaired).toBe(true);

    // 5. Deliver 2 relief crates to Zone B
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm2_r1', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.ZONE_B.x; p1.y = POINTS_OF_INTEREST.ZONE_B.y;
    engine.handleIntent('p1', { actionId: 'm2_dr1', type: 'DELIVER_CRATE', payload: { targetId: 'ZONE_B' } });

    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm2_r2', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.ZONE_B.x; p1.y = POINTS_OF_INTEREST.ZONE_B.y;
    engine.handleIntent('p1', { actionId: 'm2_dr2', type: 'DELIVER_CRATE', payload: { targetId: 'ZONE_B' } });
    expect(engine.m2.reliefCratesDeliveredB).toBe(2);

    // 6. Verify delivery at B
    engine.handleIntent('p1', { actionId: 'm2_ver', type: 'START_JOB', payload: { type: 'AUDIT_RESULT', targetId: 'ZONE_B' } });
    engine.tick(4100);
    expect(engine.m2.verifiedB).toBe(true);

    // 7. Publish M2 notice
    p1.x = POINTS_OF_INTEREST.NOTICE_BOARD.x; p1.y = POINTS_OF_INTEREST.NOTICE_BOARD.y;
    engine.handleIntent('p1', { actionId: 'm2_pub', type: 'PUBLISH_NOTICE', payload: { missionId: 'M2' } });
    expect(engine.m2.status).toBe('RESOLVED');
    expect(engine.totalScore).toBe(65); // 30 + 35

    // M3
    // 1. Receive feedback at C
    p1.x = POINTS_OF_INTEREST.ZONE_C.x; p1.y = POINTS_OF_INTEREST.ZONE_C.y;
    engine.receiveFeedbackM3(p1);
    expect(engine.m3.receivedFeedbackC).toBe(true);

    // 2. Cross-check list at clinic
    p1.x = POINTS_OF_INTEREST.CLINIC_FIXED.x; p1.y = POINTS_OF_INTEREST.CLINIC_FIXED.y;
    engine.crossCheckClinicM3(p1, 'CLINIC_FIXED');
    expect(engine.m3.crossCheckedList).toBe(true);

    // 3. Confirm M3 plan at HQ (costs 20 budget)
    p1.x = POINTS_OF_INTEREST.HEADQUARTERS.x; p1.y = POINTS_OF_INTEREST.HEADQUARTERS.y;
    engine.handleIntent('p1', { actionId: 'm3_conf', type: 'CONFIRM_M3_PLAN' });
    expect(engine.m3.planConfirmed).toBe(true);
    expect(engine.resources.currentBudget).toBe(15); // 35 - 20

    // 4. Deliver and deploy C1
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm3_c1', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CITIZEN_C1.x; p1.y = POINTS_OF_INTEREST.CITIZEN_C1.y;
    engine.handleIntent('p1', { actionId: 'm3_dc1', type: 'DELIVER_CRATE', payload: { targetId: 'CITIZEN_C1' } });
    engine.handleIntent('p1', { actionId: 'm3_sc1', type: 'START_JOB', payload: { type: 'SUPPORT_CITIZEN', targetId: 'CITIZEN_C1' } });
    engine.tick(5100);
    expect(engine.m3.deployedC1).toBe(true);

    // 5. Deliver and deploy C2
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm3_c2', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CITIZEN_C2.x; p1.y = POINTS_OF_INTEREST.CITIZEN_C2.y;
    engine.handleIntent('p1', { actionId: 'm3_dc2', type: 'DELIVER_CRATE', payload: { targetId: 'CITIZEN_C2' } });
    engine.handleIntent('p1', { actionId: 'm3_sc2', type: 'START_JOB', payload: { type: 'SUPPORT_CITIZEN', targetId: 'CITIZEN_C2' } });
    engine.tick(5100);
    expect(engine.m3.deployedC2).toBe(true);

    // 6. Audit rumor at warehouse
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm3_aud', type: 'START_JOB', payload: { type: 'AUDIT_LEDGER', targetId: 'WAREHOUSE' } });
    engine.tick(4100);
    expect(engine.m3.lossAuditDone).toBe(true);

    // 7. Publish M3 notice
    p1.x = POINTS_OF_INTEREST.NOTICE_BOARD.x; p1.y = POINTS_OF_INTEREST.NOTICE_BOARD.y;
    engine.handleIntent('p1', { actionId: 'm3_pub', type: 'PUBLISH_NOTICE', payload: { missionId: 'M3' } });
    expect(engine.m3.status).toBe('RESOLVED');
    expect(engine.phase).toBe('RESULTS');
    expect(engine.totalScore).toBe(100);

    // Check final counts
    expect(engine.resources.currentBudget).toBe(15);
    expect(engine.citizens.filter(c => c.served).length).toBe(24); // 22 from Fixed + C1 + C2
  });

  it('Combo 3 Complete: FIXED + DETOUR + M3 reaches 100 points, bridge stays broken, budget is 30', () => {
    const p1 = engine.addPlayer('p1', 'Player 1', true);
    engine.startRunning();

    // M1 surveys & plan FIXED
    p1.x = POINTS_OF_INTEREST.ZONE_A.x; p1.y = POINTS_OF_INTEREST.ZONE_A.y;
    engine.handleIntent('p1', { actionId: 'a1', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_A' } });
    engine.tick(4100);
    p1.x = POINTS_OF_INTEREST.ZONE_B.x; p1.y = POINTS_OF_INTEREST.ZONE_B.y;
    engine.handleIntent('p1', { actionId: 'a2', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_B' } });
    engine.tick(4100);
    p1.x = POINTS_OF_INTEREST.ZONE_C.x; p1.y = POINTS_OF_INTEREST.ZONE_C.y;
    engine.handleIntent('p1', { actionId: 'a3', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_C' } });
    engine.tick(4100);

    p1.x = POINTS_OF_INTEREST.HEADQUARTERS.x; p1.y = POINTS_OF_INTEREST.HEADQUARTERS.y;
    engine.handleIntent('p1', { actionId: 'a4', type: 'PROPOSE_PLAN', payload: { missionId: 'M1', plan: 'FIXED' } });

    // 2 crates delivered & deployed
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'a5', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CLINIC_FIXED.x; p1.y = POINTS_OF_INTEREST.CLINIC_FIXED.y;
    engine.handleIntent('p1', { actionId: 'a6', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_FIXED' } });

    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'a7', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CLINIC_FIXED.x; p1.y = POINTS_OF_INTEREST.CLINIC_FIXED.y;
    engine.handleIntent('p1', { actionId: 'a8', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_FIXED' } });

    engine.handleIntent('p1', { actionId: 'a9', type: 'START_JOB', payload: { type: 'DEPLOY_FIXED_CLINIC', targetId: 'CLINIC_FIXED' } });
    engine.tick(8100);
    engine.handleIntent('p1', { actionId: 'a10', type: 'START_JOB', payload: { type: 'AUDIT_RESULT', targetId: 'CLINIC_FIXED' } });
    engine.tick(4100);
    p1.x = POINTS_OF_INTEREST.NOTICE_BOARD.x; p1.y = POINTS_OF_INTEREST.NOTICE_BOARD.y;
    engine.handleIntent('p1', { actionId: 'a11', type: 'PUBLISH_NOTICE', payload: { missionId: 'M1' } });

    // M2: DETOUR
    p1.x = POINTS_OF_INTEREST.BRIDGE.x; p1.y = POINTS_OF_INTEREST.BRIDGE.y;
    engine.surveyBridgeM2(p1);

    p1.x = POINTS_OF_INTEREST.HEADQUARTERS.x; p1.y = POINTS_OF_INTEREST.HEADQUARTERS.y;
    engine.handleIntent('p1', { actionId: 'm2_detour', type: 'PROPOSE_PLAN', payload: { missionId: 'M2', plan: 'DETOUR' } });
    expect(engine.m2.planCommitted).toBe('DETOUR');
    expect(engine.resources.currentBudget).toBe(50); // 100 - 40 - 10

    // In DETOUR, bridge stays broken
    expect(engine.m2.bridgeBroken).toBe(true);
    expect(engine.m2.bridgeRepaired).toBe(false);

    // Deliver 2 relief crates to Zone B via detour
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm2_r1', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.ZONE_B.x; p1.y = POINTS_OF_INTEREST.ZONE_B.y;
    engine.handleIntent('p1', { actionId: 'm2_dr1', type: 'DELIVER_CRATE', payload: { targetId: 'ZONE_B' } });

    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm2_r2', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.ZONE_B.x; p1.y = POINTS_OF_INTEREST.ZONE_B.y;
    engine.handleIntent('p1', { actionId: 'm2_dr2', type: 'DELIVER_CRATE', payload: { targetId: 'ZONE_B' } });

    engine.handleIntent('p1', { actionId: 'm2_ver', type: 'START_JOB', payload: { type: 'AUDIT_RESULT', targetId: 'ZONE_B' } });
    engine.tick(4100);

    p1.x = POINTS_OF_INTEREST.NOTICE_BOARD.x; p1.y = POINTS_OF_INTEREST.NOTICE_BOARD.y;
    engine.handleIntent('p1', { actionId: 'm2_pub', type: 'PUBLISH_NOTICE', payload: { missionId: 'M2' } });
    expect(engine.m2.status).toBe('RESOLVED');

    // M3
    p1.x = POINTS_OF_INTEREST.ZONE_C.x; p1.y = POINTS_OF_INTEREST.ZONE_C.y;
    engine.receiveFeedbackM3(p1);
    p1.x = POINTS_OF_INTEREST.CLINIC_FIXED.x; p1.y = POINTS_OF_INTEREST.CLINIC_FIXED.y;
    engine.crossCheckClinicM3(p1, 'CLINIC_FIXED');

    p1.x = POINTS_OF_INTEREST.HEADQUARTERS.x; p1.y = POINTS_OF_INTEREST.HEADQUARTERS.y;
    engine.handleIntent('p1', { actionId: 'm3_conf', type: 'CONFIRM_M3_PLAN' });
    expect(engine.resources.currentBudget).toBe(30); // 50 - 20

    // Deliver C1, C2
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm3_c1', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CITIZEN_C1.x; p1.y = POINTS_OF_INTEREST.CITIZEN_C1.y;
    engine.handleIntent('p1', { actionId: 'm3_dc1', type: 'DELIVER_CRATE', payload: { targetId: 'CITIZEN_C1' } });
    engine.handleIntent('p1', { actionId: 'm3_sc1', type: 'START_JOB', payload: { type: 'SUPPORT_CITIZEN', targetId: 'CITIZEN_C1' } });
    engine.tick(5100);

    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm3_c2', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CITIZEN_C2.x; p1.y = POINTS_OF_INTEREST.CITIZEN_C2.y;
    engine.handleIntent('p1', { actionId: 'm3_dc2', type: 'DELIVER_CRATE', payload: { targetId: 'CITIZEN_C2' } });
    engine.handleIntent('p1', { actionId: 'm3_sc2', type: 'START_JOB', payload: { type: 'SUPPORT_CITIZEN', targetId: 'CITIZEN_C2' } });
    engine.tick(5100);

    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'm3_aud', type: 'START_JOB', payload: { type: 'AUDIT_LEDGER', targetId: 'WAREHOUSE' } });
    engine.tick(4100);

    p1.x = POINTS_OF_INTEREST.NOTICE_BOARD.x; p1.y = POINTS_OF_INTEREST.NOTICE_BOARD.y;
    engine.handleIntent('p1', { actionId: 'm3_pub', type: 'PUBLISH_NOTICE', payload: { missionId: 'M3' } });

    expect(engine.totalScore).toBe(100);
    expect(engine.resources.currentBudget).toBe(30);
    expect(engine.m2.bridgeBroken).toBe(true);
  });

  it('Combo 2 & 4: MOBILE plan functions properly and reaches 26 citizens served', () => {
    const p1 = engine.addPlayer('p1', 'Player 1', true);
    engine.startRunning();

    // M1 surveys
    p1.x = POINTS_OF_INTEREST.ZONE_A.x; p1.y = POINTS_OF_INTEREST.ZONE_A.y;
    engine.handleIntent('p1', { actionId: 'a1', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_A' } });
    engine.tick(4100);
    p1.x = POINTS_OF_INTEREST.ZONE_B.x; p1.y = POINTS_OF_INTEREST.ZONE_B.y;
    engine.handleIntent('p1', { actionId: 'a2', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_B' } });
    engine.tick(4100);
    p1.x = POINTS_OF_INTEREST.ZONE_C.x; p1.y = POINTS_OF_INTEREST.ZONE_C.y;
    engine.handleIntent('p1', { actionId: 'a3', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_C' } });
    engine.tick(4100);

    // Commit MOBILE (cost 30)
    p1.x = POINTS_OF_INTEREST.HEADQUARTERS.x; p1.y = POINTS_OF_INTEREST.HEADQUARTERS.y;
    engine.handleIntent('p1', { actionId: 'a4', type: 'PROPOSE_PLAN', payload: { missionId: 'M1', plan: 'MOBILE' } });
    expect(engine.m1.planCommitted).toBe('MOBILE');
    expect(engine.resources.currentBudget).toBe(70); // 100 - 30

    // Deliver 2 crates to B
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'b1', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CLINIC_MOBILE_B.x; p1.y = POINTS_OF_INTEREST.CLINIC_MOBILE_B.y;
    engine.handleIntent('p1', { actionId: 'b2', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_MOBILE_B' } });

    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'b3', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CLINIC_MOBILE_B.x; p1.y = POINTS_OF_INTEREST.CLINIC_MOBILE_B.y;
    engine.handleIntent('p1', { actionId: 'b4', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_MOBILE_B' } });

    // Deploy B
    engine.handleIntent('p1', { actionId: 'b5', type: 'START_JOB', payload: { type: 'DEPLOY_MOBILE_CLINIC', targetId: 'CLINIC_MOBILE_B' } });
    engine.tick(6100);
    expect(engine.m1.mobileBDeployed).toBe(true);

    // Deliver 2 crates to C
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'c1', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CLINIC_MOBILE_C.x; p1.y = POINTS_OF_INTEREST.CLINIC_MOBILE_C.y;
    engine.handleIntent('p1', { actionId: 'c2', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_MOBILE_C' } });

    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'c3', type: 'PICK_CRATE' });
    p1.x = POINTS_OF_INTEREST.CLINIC_MOBILE_C.x; p1.y = POINTS_OF_INTEREST.CLINIC_MOBILE_C.y;
    engine.handleIntent('p1', { actionId: 'c4', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_MOBILE_C' } });

    // Deploy C
    engine.handleIntent('p1', { actionId: 'c5', type: 'START_JOB', payload: { type: 'DEPLOY_MOBILE_CLINIC', targetId: 'CLINIC_MOBILE_C' } });
    engine.tick(6100);
    expect(engine.m1.mobileCDeployed).toBe(true);

    // Verify B and C
    p1.x = POINTS_OF_INTEREST.CLINIC_MOBILE_B.x; p1.y = POINTS_OF_INTEREST.CLINIC_MOBILE_B.y;
    engine.handleIntent('p1', { actionId: 'vb', type: 'START_JOB', payload: { type: 'AUDIT_RESULT', targetId: 'CLINIC_MOBILE_B' } });
    engine.tick(4100);

    p1.x = POINTS_OF_INTEREST.CLINIC_MOBILE_C.x; p1.y = POINTS_OF_INTEREST.CLINIC_MOBILE_C.y;
    engine.handleIntent('p1', { actionId: 'vc', type: 'START_JOB', payload: { type: 'AUDIT_RESULT', targetId: 'CLINIC_MOBILE_C' } });
    engine.tick(4100);

    expect(engine.m1.verifiedB).toBe(true);
    expect(engine.m1.verifiedC).toBe(true);
    expect(engine.citizens.filter(c => c.served).length).toBe(24);

    p1.x = POINTS_OF_INTEREST.NOTICE_BOARD.x; p1.y = POINTS_OF_INTEREST.NOTICE_BOARD.y;
    engine.handleIntent('p1', { actionId: 'pub1', type: 'PUBLISH_NOTICE', payload: { missionId: 'M1' } });
    expect(engine.m1.status).toBe('RESOLVED');
  });

  it('Concurrency & Anti-Cheat: Simultaneous crate picking and double spending prevention', () => {
    const p1 = engine.addPlayer('p1', 'Player 1', true);
    const p2 = engine.addPlayer('p2', 'Player 2', false);
    engine.startRunning();

    // Set available crates to 1
    engine.resources.availableCrates = 1;

    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    p2.x = POINTS_OF_INTEREST.WAREHOUSE.x; p2.y = POINTS_OF_INTEREST.WAREHOUSE.y;

    // Both attempt to pick crate with same or different actionId
    const ack1 = engine.handleIntent('p1', { actionId: 'act_p1_pick', type: 'PICK_CRATE' });
    const ack2 = engine.handleIntent('p2', { actionId: 'act_p2_pick', type: 'PICK_CRATE' });

    expect(ack1.success).toBe(true);
    expect(ack2.success).toBe(false); // Second player rejected because warehouse is empty
    expect(engine.resources.availableCrates).toBe(0);

    // Idempotency: replaying same actionId gives success without extra allocation
    const ack1Replay = engine.handleIntent('p1', { actionId: 'act_p1_pick', type: 'PICK_CRATE' });
    expect(ack1Replay.success).toBe(true);
    expect(engine.resources.availableCrates).toBe(0);
  });

  it('Manpower Pool Invariance: Cancelling job or moving immediately returns manpower', () => {
    const p1 = engine.addPlayer('p1', 'Player 1', true);
    engine.startRunning();

    // Prepare M1 fixed deployed prerequisites
    engine.m1.planCommitted = 'FIXED';
    engine.m1.deliveredCratesFixed = 2;

    p1.x = POINTS_OF_INTEREST.CLINIC_FIXED.x;
    p1.y = POINTS_OF_INTEREST.CLINIC_FIXED.y;

    expect(engine.manpower.busy).toBe(0);

    // Start deploy job
    engine.handleIntent('p1', {
      actionId: 'dep',
      type: 'START_JOB',
      payload: { type: 'DEPLOY_FIXED_CLINIC', targetId: 'CLINIC_FIXED' }
    });
    expect(engine.manpower.busy).toBe(1);

    // Cancel job
    engine.handleIntent('p1', { actionId: 'cancel', type: 'CANCEL_JOB' });
    expect(engine.manpower.busy).toBe(0);
    expect(p1.activeJob).toBeNull();

    // Start again, then move away
    engine.handleIntent('p1', {
      actionId: 'dep2',
      type: 'START_JOB',
      payload: { type: 'DEPLOY_FIXED_CLINIC', targetId: 'CLINIC_FIXED' }
    });
    expect(engine.manpower.busy).toBe(1);

    // Player moves 50 units
    engine.handleIntent('p1', {
      actionId: 'move_away',
      type: 'MOVE',
      payload: { x: p1.x + 50, y: p1.y }
    });
    expect(engine.manpower.busy).toBe(0); // Manpower released automatically!
    expect(p1.activeJob).toBeNull();
  });

  it('Multi-room Isolation: Actions in Room 1 do not leak to Room 2', () => {
    const rm = new RoomManager();
    const r1 = rm.createRoom('ROOM_1');
    const r2 = rm.createRoom('ROOM_2');

    const p1 = r1.engine.addPlayer('p1', 'Alice', true);
    const p2 = r2.engine.addPlayer('p2', 'Bob', true);

    r1.engine.startRunning();
    expect(r1.engine.phase).toBe('RUNNING');
    expect(r2.engine.phase).toBe('LOBBY'); // R2 unaffected

    const target = POINTS_OF_INTEREST.NOTICE_BOARD;
    // A room-isolation fixture must not teleport across map geometry.
    p1.x=target.x-2;p1.y=target.y;
    const secondRoomPosition = {x:p2.x,y:p2.y};
    const move = r1.engine.handleIntent('p1', { actionId: 'mv1', type: 'MOVE', payload: target });
    expect(move.success).toBe(true);
    expect({x:p1.x,y:p1.y}).toEqual({x:target.x,y:target.y});
    expect({x:p2.x,y:p2.y}).toEqual(secondRoomPosition);
  });

  it('Disconnect Grace Period: Crate kept within 10s, dropped safely after 10s without duplication', () => {
    const p1 = engine.addPlayer('p1', 'Player 1', true);
    engine.startRunning();

    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x; p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;
    engine.handleIntent('p1', { actionId: 'pick_c', type: 'PICK_CRATE' });
    expect(p1.carriedCrateId).toBe('CRATE_1');

    // Player disconnects
    engine.removeOrDisconnectPlayer('p1');
    expect(p1.isOnline).toBe(false);

    // After 5s (within 10s grace period)
    engine.tick(5000);
    expect(p1.carriedCrateId).toBe('CRATE_1');

    // Player reconnects before 10s
    engine.addPlayer('p1', 'Player 1', true);
    expect(p1.isOnline).toBe(true);
    expect(p1.carriedCrateId).toBe('CRATE_1');

    // Now player disconnects again, and passes 11 seconds (exceeding 10s grace)
    engine.removeOrDisconnectPlayer('p1');
    // Set disconnectedAt 11 seconds in past
    p1.disconnectedAt = Date.now() - 11000;
    engine.tick(100);

    // Crate should now be safely DROPPED on the ground, player carried is cleared
    expect(p1.carriedCrateId).toBeNull();
    const crate1 = engine.crates.get('CRATE_1');
    expect(crate1?.state).toBe('DROPPED');
    expect(crate1?.carriedByPlayerId).toBeNull();

    // Auto-pause was correctly triggered because 0 players were online!
    expect(engine.isPaused).toBe(true);

    // Another player comes in, game is resumed
    const p2 = engine.addPlayer('p2', 'Player 2', false);
    engine.hostAction('RESUME', hostToken);
    expect(engine.isPaused).toBe(false);

    p2.x = crate1!.x; p2.y = crate1!.y;
    const pickAck = engine.handleIntent('p2', { actionId: 'p2_pick', type: 'PICK_CRATE' });
    expect(pickAck.success).toBe(true);
    expect(p2.carriedCrateId).toBe('CRATE_1');
    expect(crate1?.state).toBe('CARRIED');
    expect(crate1?.carriedByPlayerId).toBe('p2');
  });

  it('Pause and Reset: Timers stop during pause and reset clears all active jobs/votes', () => {
    const p1 = engine.addPlayer('p1', 'Player 1', true);
    engine.startRunning();

    // Start a survey
    p1.x = POINTS_OF_INTEREST.ZONE_A.x; p1.y = POINTS_OF_INTEREST.ZONE_A.y;
    engine.handleIntent('p1', { actionId: 'sv_a', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_A' } });
    expect(p1.activeJob).not.toBeNull();

    // Host pauses game
    engine.hostAction('PAUSE', hostToken);
    expect(engine.isPaused).toBe(true);

    const initialProgress = p1.activeJob!.progress;
    // Tick 5000ms during pause
    engine.tick(5000);
    // Job progress and match timer should NOT have progressed!
    expect(p1.activeJob!.progress).toBe(initialProgress);
    expect(engine.phaseTimerRemainingMs).toBe(600000);

    // Host resets to lobby
    engine.hostAction('RESET', hostToken);
    expect(engine.phase).toBe('LOBBY');
    expect(p1.activeJob).toBeNull();
    expect(p1.carriedCrateId).toBeNull();
    expect(engine.manpower.busy).toBe(0);
  });

  it('Q1 Robustness: Active Vote timer pauses when game is paused', () => {
    const p1 = engine.addPlayer('p1', 'Player 1', true);
    const p2 = engine.addPlayer('p2', 'Player 2', false);
    engine.startRunning();

    // Surveys
    engine.m1.surveys.A = true;
    engine.m1.surveys.B = true;
    engine.m1.surveys.C = true;

    // Propose plan at HQ
    p1.x = POINTS_OF_INTEREST.HEADQUARTERS.x;
    p1.y = POINTS_OF_INTEREST.HEADQUARTERS.y;
    const ack = engine.handleIntent('p1', {
      actionId: 'prop_vote',
      type: 'PROPOSE_PLAN',
      payload: { missionId: 'M1', plan: 'FIXED' }
    });
    expect(ack.success).toBe(true);
    expect(engine.voting).not.toBeNull();
    expect(engine.voting?.active).toBe(true);
    expect(engine.voting?.remainingMs).toBe(15000);

    // Host pauses game
    engine.hostAction('PAUSE', hostToken);
    expect(engine.isPaused).toBe(true);

    // Tick 6000ms while paused
    engine.tick(6000);
    expect(engine.voting?.remainingMs).toBe(15000);
    expect(engine.voting?.active).toBe(true);

    // Host resumes
    engine.hostAction('RESUME', hostToken);
    expect(engine.isPaused).toBe(false);

    // Tick 5000ms after resume
    engine.tick(5000);
    expect(engine.voting?.remainingMs).toBe(10000);
    expect(engine.voting?.active).toBe(true);
  });

  it('Q2 Robustness: M2 Publish Notice rejected if plan is REPAIR and bridge is not yet repaired', () => {
    const p1 = engine.addPlayer('p1', 'Player 1', true);
    engine.startRunning();

    // Setup M2 active
    engine.m1.status = 'RESOLVED';
    engine.m2.status = 'ACTIVE';
    engine.m2.planCommitted = 'REPAIR';
    engine.m2.surveyDone = true;
    engine.m2.bridgeBroken = true;

    // Deliver 2 relief crates to B and verify B
    engine.m2.reliefCratesDeliveredB = 2;
    engine.m2.verifiedB = true;

    // Bridge is NOT yet repaired
    expect(engine.m2.bridgeRepaired).toBe(false);

    // Attempt to publish notice at notice board
    p1.x = POINTS_OF_INTEREST.NOTICE_BOARD.x;
    p1.y = POINTS_OF_INTEREST.NOTICE_BOARD.y;
    let ack = engine.handleIntent('p1', {
      actionId: 'pub_m2_early',
      type: 'PUBLISH_NOTICE',
      payload: { missionId: 'M2' }
    });
    expect(ack.success).toBe(false);
    expect(ack.reason).toContain('REPAIR');

    // Now complete bridge repair
    engine.m2.bridgeRepairTask1 = true;
    engine.m2.bridgeRepairTask2 = true;
    engine.m2.bridgeRepaired = true;

    // Now publish notice succeeds
    ack = engine.handleIntent('p1', {
      actionId: 'pub_m2_ok',
      type: 'PUBLISH_NOTICE',
      payload: { missionId: 'M2' }
    });
    expect(ack.success).toBe(true);
    expect(engine.m2.noticePublished).toBe(true);
    expect(engine.m2.status).toBe('RESOLVED');
    expect(engine.m3.status).toBe('ACTIVE');
  });

  it('ISSUE-05: Dynamic Manpower scales with online players (up to 8)', () => {
    // Initially solo: manpower total is at least 3
    const p1 = engine.addPlayer('p1', 'Player 1', true);
    expect(engine.manpower.total).toBe(3);

    // Add players up to 6
    engine.addPlayer('p2', 'Player 2');
    engine.addPlayer('p3', 'Player 3');
    engine.addPlayer('p4', 'Player 4');
    engine.addPlayer('p5', 'Player 5');
    engine.addPlayer('p6', 'Player 6');
    expect(engine.manpower.total).toBe(6);

    // Add players up to 10: capped at 8 max
    engine.addPlayer('p7', 'Player 7');
    engine.addPlayer('p8', 'Player 8');
    engine.addPlayer('p9', 'Player 9');
    expect(engine.manpower.total).toBe(8);

    // Disconnect some players
    engine.removeOrDisconnectPlayer('p9');
    engine.removeOrDisconnectPlayer('p8');
    engine.removeOrDisconnectPlayer('p7');
    engine.removeOrDisconnectPlayer('p6');
    expect(engine.manpower.total).toBe(5);
  });

  it('ISSUE-11: Player can ping location and broadcast via audit events', () => {
    const p1 = engine.addPlayer('p1', 'Player 1', true);
    p1.x = POINTS_OF_INTEREST.WAREHOUSE.x;
    p1.y = POINTS_OF_INTEREST.WAREHOUSE.y;

    const ack = engine.handleIntent('p1', {
      actionId: 'ping_1',
      type: 'PING_LOCATION',
      payload: { x: p1.x, y: p1.y }
    });
    expect(ack.success).toBe(true);

    const latestEvent = engine.recentAuditEvents[0];
    expect(latestEvent.category).toBe('PLAYER');
    expect(latestEvent.message).toContain('đã phát tín hiệu tại Kho vật tư');
  });
});
