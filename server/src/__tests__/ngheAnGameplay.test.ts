import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../gameEngine.js';
import { NGHE_AN_POIS, getProvinceView } from 'shared';

describe('Nghe An Gameplay & Missions', () => {
  let engine: GameEngine;
  let player: any;

  beforeEach(() => {
    engine = new GameEngine('TEST_NA', 'host_token', 'nghe-an');
    player = engine.addPlayer('p1', 'Player 1', true);
    engine.phase = 'RUNNING';
  });

  it('starts at Quest 1 Chao Luon with zero score and active status', () => {
    const snap = engine.getSnapshot();
    expect(snap.ngheAnState).toBeDefined();
    expect(snap.ngheAnState?.currentQuest).toBe(1);
    expect(snap.ngheAnState?.chaoLuon.status).toBe('ACTIVE');
    expect(snap.ngheAnState?.luaDaoDat.status).toBe('LOCKED');
    expect(snap.ngheAnState?.quyKhuyenHoc.status).toBe('LOCKED');
    expect(engine.totalScore).toBe(0);
  });

  it('rejects action when player is too far from POI', () => {
    player.x = 1000;
    player.y = 100;
    const ack = engine.handleIntent('p1', {
      actionId: 'far_1',
      type: 'NGHEAN_ACTION',
      payload: { action: 'NA_CH_MEET_HOA' },
    });
    expect(ack.success).toBe(false);
    expect(ack.reason).toContain('Cần đến quán cháo Dì Hoa');
  });

  it('completes Quest 1 step-by-step with prerequisites and idempotency', () => {
    // 1. Meet Hoa
    player.x = NGHE_AN_POIS.NA_CH_HOA_SHOP[0];
    player.y = NGHE_AN_POIS.NA_CH_HOA_SHOP[1];
    let ack = engine.handleIntent('p1', {
      actionId: 'act_1',
      type: 'NGHEAN_ACTION',
      payload: { action: 'NA_CH_MEET_HOA' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().ngheAnState?.chaoLuon.score).toBe(5);

    // Duplicate check
    ack = engine.handleIntent('p1', {
      actionId: 'act_1_dup',
      type: 'NGHEAN_ACTION',
      payload: { action: 'NA_CH_MEET_HOA' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().ngheAnState?.chaoLuon.score).toBe(5);

    // 2. Meet Tuan
    player.x = NGHE_AN_POIS.NA_CH_TUAN_SHOP[0];
    player.y = NGHE_AN_POIS.NA_CH_TUAN_SHOP[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_2',
      type: 'NGHEAN_ACTION',
      payload: { action: 'NA_CH_MEET_TUAN' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().ngheAnState?.chaoLuon.score).toBe(15);

    // 3. Measure Boundary
    player.x = NGHE_AN_POIS.NA_CH_SIDEWALK[0];
    player.y = NGHE_AN_POIS.NA_CH_SIDEWALK[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_3',
      type: 'NGHEAN_ACTION',
      payload: { action: 'NA_CH_MEASURE_BOUNDARY' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().ngheAnState?.chaoLuon.score).toBe(25);

    // 4. Sign Commitment
    player.x = NGHE_AN_POIS.NA_CH_HOA_SHOP[0];
    player.y = NGHE_AN_POIS.NA_CH_HOA_SHOP[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_4',
      type: 'NGHEAN_ACTION',
      payload: { action: 'NA_CH_SIGN_COMMITMENT' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().ngheAnState?.chaoLuon.score).toBe(30);
    expect(engine.getSnapshot().ngheAnState?.chaoLuon.status).toBe('RESOLVED');
    expect(engine.getSnapshot().ngheAnState?.luaDaoDat.status).toBe('ACTIVE');
    expect(engine.getSnapshot().ngheAnState?.currentQuest).toBe(2);
  });

  it('completes all 3 missions to reach 75 points', () => {
    // Q1
    player.x = NGHE_AN_POIS.NA_CH_HOA_SHOP[0]; player.y = NGHE_AN_POIS.NA_CH_HOA_SHOP[1];
    engine.handleIntent('p1', { actionId: 'q1_1', type: 'NGHEAN_ACTION', payload: { action: 'NA_CH_MEET_HOA' } });
    player.x = NGHE_AN_POIS.NA_CH_TUAN_SHOP[0]; player.y = NGHE_AN_POIS.NA_CH_TUAN_SHOP[1];
    engine.handleIntent('p1', { actionId: 'q1_2', type: 'NGHEAN_ACTION', payload: { action: 'NA_CH_MEET_TUAN' } });
    player.x = NGHE_AN_POIS.NA_CH_SIDEWALK[0]; player.y = NGHE_AN_POIS.NA_CH_SIDEWALK[1];
    engine.handleIntent('p1', { actionId: 'q1_3', type: 'NGHEAN_ACTION', payload: { action: 'NA_CH_MEASURE_BOUNDARY' } });
    player.x = NGHE_AN_POIS.NA_CH_HOA_SHOP[0]; player.y = NGHE_AN_POIS.NA_CH_HOA_SHOP[1];
    engine.handleIntent('p1', { actionId: 'q1_4', type: 'NGHEAN_ACTION', payload: { action: 'NA_CH_SIGN_COMMITMENT' } });

    // Q2
    player.x = NGHE_AN_POIS.NA_CULTURE_HOUSE[0]; player.y = NGHE_AN_POIS.NA_CULTURE_HOUSE[1];
    engine.handleIntent('p1', { actionId: 'q2_1', type: 'NGHEAN_ACTION', payload: { action: 'NA_LD_INTERVIEW_VICTIM' } });
    player.x = NGHE_AN_POIS.NA_MARKET_ALLEY[0]; player.y = NGHE_AN_POIS.NA_MARKET_ALLEY[1];
    engine.handleIntent('p1', { actionId: 'q2_2', type: 'NGHEAN_ACTION', payload: { action: 'NA_LD_ASK_MARKET' } });
    player.x = NGHE_AN_POIS.NA_SHORTCUT_BLOCK[0]; player.y = NGHE_AN_POIS.NA_SHORTCUT_BLOCK[1];
    engine.handleIntent('p1', { actionId: 'q2_3', type: 'NGHEAN_ACTION', payload: { action: 'NA_LD_BLOCK_SHORTCUT' } });
    player.x = NGHE_AN_POIS.NA_DEAD_END[0]; player.y = NGHE_AN_POIS.NA_DEAD_END[1];
    engine.handleIntent('p1', { actionId: 'q2_4', type: 'NGHEAN_ACTION', payload: { action: 'NA_LD_CAPTURE_SUSPECT' } });

    expect(engine.getSnapshot().ngheAnState?.luaDaoDat.status).toBe('RESOLVED');
    expect(engine.getSnapshot().ngheAnState?.quyKhuyenHoc.status).toBe('ACTIVE');

    // Q3
    player.x = NGHE_AN_POIS.NA_CULTURE_HOUSE[0]; player.y = NGHE_AN_POIS.NA_CULTURE_HOUSE[1];
    engine.handleIntent('p1', { actionId: 'q3_1', type: 'NGHEAN_ACTION', payload: { action: 'NA_QK_CALM_CROWD' } });
    player.x = NGHE_AN_POIS.NA_CABINET_EVIDENCE[0]; player.y = NGHE_AN_POIS.NA_CABINET_EVIDENCE[1];
    engine.handleIntent('p1', { actionId: 'q3_2', type: 'NGHEAN_ACTION', payload: { action: 'NA_QK_INSPECT_CABINET' } });
    player.x = NGHE_AN_POIS.NA_WINDOW_EVIDENCE[0]; player.y = NGHE_AN_POIS.NA_WINDOW_EVIDENCE[1];
    engine.handleIntent('p1', { actionId: 'q3_3', type: 'NGHEAN_ACTION', payload: { action: 'NA_QK_INSPECT_WINDOW' } });
    player.x = NGHE_AN_POIS.NA_SUSPECTS_LINEUP[0]; player.y = NGHE_AN_POIS.NA_SUSPECTS_LINEUP[1];
    engine.handleIntent('p1', { actionId: 'q3_4', type: 'NGHEAN_ACTION', payload: { action: 'NA_QK_INTERROGATE' } });
    player.x = NGHE_AN_POIS.NA_CULTURE_HOUSE[0]; player.y = NGHE_AN_POIS.NA_CULTURE_HOUSE[1];
    engine.handleIntent('p1', { actionId: 'q3_5', type: 'NGHEAN_ACTION', payload: { action: 'NA_QK_SOLVE_CASE' } });

    const snap = engine.getSnapshot();
    expect(snap.ngheAnState?.quyKhuyenHoc.status).toBe('RESOLVED');
    expect(engine.totalScore).toBe(100);

    const view = getProvinceView(snap, 'p1');
    expect(view.totalScore).toBe(100);
    expect(view.quests[0].status).toBe('RESOLVED');
    expect(view.quests[1].status).toBe('RESOLVED');
    expect(view.quests[2].status).toBe('RESOLVED');
  });
});
