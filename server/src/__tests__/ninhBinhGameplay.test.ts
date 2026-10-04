import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../gameEngine.js';
import { NINH_BINH_POIS, getProvinceView } from 'shared';

describe('Ninh Binh Gameplay & Missions', () => {
  let engine: GameEngine;
  let player: any;

  beforeEach(() => {
    engine = new GameEngine('TEST_NB', 'host_token', 'ninh-binh');
    player = engine.addPlayer('p1', 'Player 1', true);
    engine.phase = 'RUNNING';
  });

  it('starts at Quest 1 Bai Dinh with zero score and active status', () => {
    const snap = engine.getSnapshot();
    expect(snap.ninhBinhState).toBeDefined();
    expect(snap.ninhBinhState?.currentQuest).toBe(1);
    expect(snap.ninhBinhState?.baiDinh.status).toBe('ACTIVE');
    expect(snap.ninhBinhState?.cucPhuong.status).toBe('LOCKED');
    expect(snap.ninhBinhState?.tamCoc.status).toBe('LOCKED');
    expect(engine.totalScore).toBe(0);
  });

  it('rejects action when player is too far from POI', () => {
    player.x = 100;
    player.y = 100;
    const ack = engine.handleIntent('p1', {
      actionId: 'far_1',
      type: 'NINHBINH_ACTION',
      payload: { action: 'NB_BD_MEET_BQL' },
    });
    expect(ack.success).toBe(false);
    expect(ack.reason).toContain('Cần đến gặp BQL');
  });

  it('completes Quest 1 Bai Dinh step-by-step with prerequisites and idempotency', () => {
    // 1. Meet BQL
    const bqlPos = NINH_BINH_POIS.NB_BQL_CHU;
    player.x = bqlPos[0];
    player.y = bqlPos[1];
    let ack = engine.handleIntent('p1', {
      actionId: 'act_1',
      type: 'NINHBINH_ACTION',
      payload: { action: 'NB_BD_MEET_BQL' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().ninhBinhState?.baiDinh.score).toBe(5);

    // Duplicate action is idempotent
    ack = engine.handleIntent('p1', {
      actionId: 'act_1_dup',
      type: 'NINHBINH_ACTION',
      payload: { action: 'NB_BD_MEET_BQL' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().ninhBinhState?.baiDinh.score).toBe(5);

    // 2. Inspect box
    const gatePos = NINH_BINH_POIS.NB_BAI_DINH_GATE;
    player.x = gatePos[0];
    player.y = gatePos[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_2',
      type: 'NINHBINH_ACTION',
      payload: { action: 'NB_BD_INSPECT_BOX' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().ninhBinhState?.baiDinh.score).toBe(15);

    // 3. Resolve livestream
    const livePos = NINH_BINH_POIS.NB_LIVESTREAM_GROUP;
    player.x = livePos[0];
    player.y = livePos[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_3',
      type: 'NINHBINH_ACTION',
      payload: { action: 'NB_BD_RESOLVE_LIVESTREAM' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().ninhBinhState?.baiDinh.score).toBe(25);

    // 4. Publish rules
    const boardPos = NINH_BINH_POIS.NB_RULE_BOARD;
    player.x = boardPos[0];
    player.y = boardPos[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_4',
      type: 'NINHBINH_ACTION',
      payload: { action: 'NB_BD_PUBLISH_RULES' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().ninhBinhState?.baiDinh.score).toBe(30);
    expect(engine.getSnapshot().ninhBinhState?.baiDinh.status).toBe('RESOLVED');
    expect(engine.getSnapshot().ninhBinhState?.cucPhuong.status).toBe('ACTIVE');
    expect(engine.getSnapshot().ninhBinhState?.currentQuest).toBe(2);
  });

  it('completes all 3 missions to reach 90 points and transitions night lighting', () => {
    // Q1
    player.x = NINH_BINH_POIS.NB_BQL_CHU[0]; player.y = NINH_BINH_POIS.NB_BQL_CHU[1];
    engine.handleIntent('p1', { actionId: 'q1_1', type: 'NINHBINH_ACTION', payload: { action: 'NB_BD_MEET_BQL' } });
    player.x = NINH_BINH_POIS.NB_BAI_DINH_GATE[0]; player.y = NINH_BINH_POIS.NB_BAI_DINH_GATE[1];
    engine.handleIntent('p1', { actionId: 'q1_2', type: 'NINHBINH_ACTION', payload: { action: 'NB_BD_INSPECT_BOX' } });
    player.x = NINH_BINH_POIS.NB_LIVESTREAM_GROUP[0]; player.y = NINH_BINH_POIS.NB_LIVESTREAM_GROUP[1];
    engine.handleIntent('p1', { actionId: 'q1_3', type: 'NINHBINH_ACTION', payload: { action: 'NB_BD_RESOLVE_LIVESTREAM' } });
    player.x = NINH_BINH_POIS.NB_RULE_BOARD[0]; player.y = NINH_BINH_POIS.NB_RULE_BOARD[1];
    engine.handleIntent('p1', { actionId: 'q1_4', type: 'NINHBINH_ACTION', payload: { action: 'NB_BD_PUBLISH_RULES' } });

    // Q2 - Cuc Phuong
    player.x = NINH_BINH_POIS.NB_RANGERS_POST[0]; player.y = NINH_BINH_POIS.NB_RANGERS_POST[1];
    engine.handleIntent('p1', { actionId: 'q2_1', type: 'NINHBINH_ACTION', payload: { action: 'NB_CP_START_PATROL' } });
    expect(engine.getSnapshot().ninhBinhState?.cucPhuong.isNight).toBe(true);

    const viewNight = getProvinceView(engine.getSnapshot(), 'p1');
    expect(viewNight.visual.rescue.duskAlpha).toBeGreaterThan(0);

    player.x = NINH_BINH_POIS.NB_ANIMAL_TRAP[0]; player.y = NINH_BINH_POIS.NB_ANIMAL_TRAP[1];
    engine.handleIntent('p1', { actionId: 'q2_2', type: 'NINHBINH_ACTION', payload: { action: 'NB_CP_DISARM_TRAP' } });
    player.x = NINH_BINH_POIS.NB_WILDLIFE_RELEASE[0]; player.y = NINH_BINH_POIS.NB_WILDLIFE_RELEASE[1];
    engine.handleIntent('p1', { actionId: 'q2_3', type: 'NINHBINH_ACTION', payload: { action: 'NB_CP_RESCUE_ANIMAL' } });
    player.x = NINH_BINH_POIS.NB_TIMBER_ZONE[0]; player.y = NINH_BINH_POIS.NB_TIMBER_ZONE[1];
    engine.handleIntent('p1', { actionId: 'q2_4', type: 'NINHBINH_ACTION', payload: { action: 'NB_CP_SECURE_TIMBER' } });
    expect(engine.getSnapshot().ninhBinhState?.cucPhuong.status).toBe('RESOLVED');
    expect(engine.getSnapshot().ninhBinhState?.cucPhuong.score).toBe(35);

    // Q3 - Tam Coc
    player.x = NINH_BINH_POIS.NB_BOATMAN_REP[0]; player.y = NINH_BINH_POIS.NB_BOATMAN_REP[1];
    engine.handleIntent('p1', { actionId: 'q3_1', type: 'NINHBINH_ACTION', payload: { action: 'NB_TC_MEET_BOATMAN' } });
    player.x = NINH_BINH_POIS.NB_TICKET_BOARD[0]; player.y = NINH_BINH_POIS.NB_TICKET_BOARD[1];
    engine.handleIntent('p1', { actionId: 'q3_2', type: 'NINHBINH_ACTION', payload: { action: 'NB_TC_POST_PRICES' } });
    player.x = NINH_BINH_POIS.NB_LIFEJACKET_STATION[0]; player.y = NINH_BINH_POIS.NB_LIFEJACKET_STATION[1];
    engine.handleIntent('p1', { actionId: 'q3_3', type: 'NINHBINH_ACTION', payload: { action: 'NB_TC_EQUIP_LIFEJACKETS' } });
    player.x = NINH_BINH_POIS.NB_DISPATCH_POST[0]; player.y = NINH_BINH_POIS.NB_DISPATCH_POST[1];
    engine.handleIntent('p1', { actionId: 'q3_4', type: 'NINHBINH_ACTION', payload: { action: 'NB_TC_DISPATCH_BOATS' } });
    expect(engine.getSnapshot().ninhBinhState?.tamCoc.status).toBe('RESOLVED');
    expect(engine.getSnapshot().ninhBinhState?.tamCoc.score).toBe(35);

    expect(engine.totalScore).toBe(100);
    const finalView = getProvinceView(engine.getSnapshot(), 'p1');
    expect(finalView.totalScore).toBe(100);
    expect(finalView.results.recap.length).toBe(3);
  });
});
