import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../gameEngine.js';
import { QUANG_NINH_POIS, getProvinceView } from 'shared';

describe('Quang Ninh Gameplay & Missions', () => {
  let engine: GameEngine;
  let player: any;

  beforeEach(() => {
    engine = new GameEngine('TEST_QN', 'host_token', 'quang-ninh');
    player = engine.addPlayer('p1', 'Player 1', true);
    engine.phase = 'RUNNING';
  });

  it('starts at Quest 1 To Roi with zero score and active status', () => {
    const snap = engine.getSnapshot();
    expect(snap.quangNinhState).toBeDefined();
    expect(snap.quangNinhState?.currentQuest).toBe(1);
    expect(snap.quangNinhState?.toRoi.status).toBe('ACTIVE');
    expect(snap.quangNinhState?.congTruong.status).toBe('LOCKED');
    expect(snap.quangNinhState?.thanXuat.status).toBe('LOCKED');
    expect(engine.totalScore).toBe(0);
  });

  it('rejects action when player is too far from POI', () => {
    player.x = 1000;
    player.y = 100;
    const ack = engine.handleIntent('p1', {
      actionId: 'far_1',
      type: 'QUANGNINH_ACTION',
      payload: { action: 'QN_TR_MEET_HOANG' },
    });
    expect(ack.success).toBe(false);
    expect(ack.reason).toContain('Cần đến gặp Bác Hoàng');
  });

  it('completes Quest 1 step-by-step with prerequisites and idempotency', () => {
    // 1. Meet Hoang
    player.x = QUANG_NINH_POIS.QN_CITIZEN_HOANG[0];
    player.y = QUANG_NINH_POIS.QN_CITIZEN_HOANG[1];
    let ack = engine.handleIntent('p1', {
      actionId: 'act_1',
      type: 'QUANGNINH_ACTION',
      payload: { action: 'QN_TR_MEET_HOANG' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().quangNinhState?.toRoi.score).toBe(5);

    // Duplicate check
    ack = engine.handleIntent('p1', {
      actionId: 'act_1_dup',
      type: 'QUANGNINH_ACTION',
      payload: { action: 'QN_TR_MEET_HOANG' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().quangNinhState?.toRoi.score).toBe(5);

    // 2. Peel fliers
    player.x = QUANG_NINH_POIS.QN_FLIER_WALL[0];
    player.y = QUANG_NINH_POIS.QN_FLIER_WALL[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_2',
      type: 'QUANGNINH_ACTION',
      payload: { action: 'QN_TR_PEEL_FLIERS' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().quangNinhState?.toRoi.score).toBe(15);

    // 3. Digital guide
    player.x = QUANG_NINH_POIS.QN_ALLEY_POST[0];
    player.y = QUANG_NINH_POIS.QN_ALLEY_POST[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_3',
      type: 'QUANGNINH_ACTION',
      payload: { action: 'QN_TR_DIGITAL_GUIDE' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().quangNinhState?.toRoi.score).toBe(25);

    // 4. Publish board
    player.x = QUANG_NINH_POIS.QN_PUBLIC_BOARD[0];
    player.y = QUANG_NINH_POIS.QN_PUBLIC_BOARD[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_4',
      type: 'QUANGNINH_ACTION',
      payload: { action: 'QN_TR_PUBLISH_BOARD' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().quangNinhState?.toRoi.score).toBe(30);
    expect(engine.getSnapshot().quangNinhState?.toRoi.status).toBe('RESOLVED');
    expect(engine.getSnapshot().quangNinhState?.congTruong.status).toBe('ACTIVE');
    expect(engine.getSnapshot().quangNinhState?.currentQuest).toBe(2);
  });

  it('completes all 3 missions to reach 100 points', () => {
    // Q1
    player.x = QUANG_NINH_POIS.QN_CITIZEN_HOANG[0]; player.y = QUANG_NINH_POIS.QN_CITIZEN_HOANG[1];
    engine.handleIntent('p1', { actionId: 'q1_1', type: 'QUANGNINH_ACTION', payload: { action: 'QN_TR_MEET_HOANG' } });
    player.x = QUANG_NINH_POIS.QN_FLIER_WALL[0]; player.y = QUANG_NINH_POIS.QN_FLIER_WALL[1];
    engine.handleIntent('p1', { actionId: 'q1_2', type: 'QUANGNINH_ACTION', payload: { action: 'QN_TR_PEEL_FLIERS' } });
    player.x = QUANG_NINH_POIS.QN_ALLEY_POST[0]; player.y = QUANG_NINH_POIS.QN_ALLEY_POST[1];
    engine.handleIntent('p1', { actionId: 'q1_3', type: 'QUANGNINH_ACTION', payload: { action: 'QN_TR_DIGITAL_GUIDE' } });
    player.x = QUANG_NINH_POIS.QN_PUBLIC_BOARD[0]; player.y = QUANG_NINH_POIS.QN_PUBLIC_BOARD[1];
    engine.handleIntent('p1', { actionId: 'q1_4', type: 'QUANGNINH_ACTION', payload: { action: 'QN_TR_PUBLISH_BOARD' } });

    // Q2 - Cong truong (35đ)
    player.x = QUANG_NINH_POIS.QN_CONSTRUCTION_SITE[0]; player.y = QUANG_NINH_POIS.QN_CONSTRUCTION_SITE[1];
    engine.handleIntent('p1', { actionId: 'q2_1', type: 'QUANGNINH_ACTION', payload: { action: 'QN_CT_INSPECT_SITE' } });
    player.x = QUANG_NINH_POIS.QN_TRUCK_CHECK[0]; player.y = QUANG_NINH_POIS.QN_TRUCK_CHECK[1];
    engine.handleIntent('p1', { actionId: 'q2_2', type: 'QUANGNINH_ACTION', payload: { action: 'QN_CT_CHECK_TRUCKS' } });
    player.x = QUANG_NINH_POIS.QN_ENVIRONMENT_OFFICE[0]; player.y = QUANG_NINH_POIS.QN_ENVIRONMENT_OFFICE[1];
    engine.handleIntent('p1', { actionId: 'q2_3', type: 'QUANGNINH_ACTION', payload: { action: 'QN_CT_MONITOR_WATER' } });
    player.x = QUANG_NINH_POIS.QN_WAREHOUSE_SITE[0]; player.y = QUANG_NINH_POIS.QN_WAREHOUSE_SITE[1];
    engine.handleIntent('p1', { actionId: 'q2_4', type: 'QUANGNINH_ACTION', payload: { action: 'QN_CT_SIGN_COMMITMENT' } });
    expect(engine.getSnapshot().quangNinhState?.congTruong.status).toBe('RESOLVED');
    expect(engine.getSnapshot().quangNinhState?.congTruong.score).toBe(35);

    // Q3 - Than xuat (35đ)
    player.x = QUANG_NINH_POIS.QN_HIDDEN_DEPOT[0]; player.y = QUANG_NINH_POIS.QN_HIDDEN_DEPOT[1];
    engine.handleIntent('p1', { actionId: 'q3_1', type: 'QUANGNINH_ACTION', payload: { action: 'QN_TX_DISCOVER_DEPOT' } });
    player.x = QUANG_NINH_POIS.QN_BARGE_DOCK[0]; player.y = QUANG_NINH_POIS.QN_BARGE_DOCK[1];
    engine.handleIntent('p1', { actionId: 'q3_2', type: 'QUANGNINH_ACTION', payload: { action: 'QN_TX_INSPECT_BARGE' } });
    player.x = QUANG_NINH_POIS.QN_SEAL_STATION[0]; player.y = QUANG_NINH_POIS.QN_SEAL_STATION[1];
    engine.handleIntent('p1', { actionId: 'q3_3', type: 'QUANGNINH_ACTION', payload: { action: 'QN_TX_SEAL_VIOLATION' } });
    player.x = QUANG_NINH_POIS.QN_BRIDGE_CHECKPOINT[0]; player.y = QUANG_NINH_POIS.QN_BRIDGE_CHECKPOINT[1];
    engine.handleIntent('p1', { actionId: 'q3_4', type: 'QUANGNINH_ACTION', payload: { action: 'QN_TX_SECURE_BRIDGE' } });
    expect(engine.getSnapshot().quangNinhState?.thanXuat.status).toBe('RESOLVED');
    expect(engine.getSnapshot().quangNinhState?.thanXuat.score).toBe(35);

    expect(engine.totalScore).toBe(100);
    const finalView = getProvinceView(engine.getSnapshot(), 'p1');
    expect(finalView.totalScore).toBe(100);
    expect(finalView.results.recap.length).toBe(3);
  });
});
