import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../gameEngine.js';
import { HAI_PHONG_POIS, getProvinceView } from 'shared';

describe('Hai Phong Gameplay & Missions', () => {
  let engine: GameEngine;
  let player: any;

  beforeEach(() => {
    engine = new GameEngine('TEST_HP', 'host_token', 'hai-phong');
    player = engine.addPlayer('p1', 'Player 1', true);
    engine.phase = 'RUNNING';
  });

  it('starts at Quest 1 Foodtour with zero score and active status', () => {
    const snap = engine.getSnapshot();
    expect(snap.haiPhongState).toBeDefined();
    expect(snap.haiPhongState?.currentQuest).toBe(1);
    expect(snap.haiPhongState?.foodtour.status).toBe('ACTIVE');
    expect(snap.haiPhongState?.cheLo.status).toBe('LOCKED');
    expect(snap.haiPhongState?.doSon.status).toBe('LOCKED');
    expect(engine.totalScore).toBe(0);
  });

  it('rejects action when player is too far from POI', () => {
    player.x = 1000;
    player.y = 100;
    const ack = engine.handleIntent('p1', {
      actionId: 'far_1',
      type: 'HAIPHONG_ACTION',
      payload: { action: 'HP_FD_MEET_HOA' },
    });
    expect(ack.success).toBe(false);
    expect(ack.reason).toContain('Cần đến gặp Cô Hoa');
  });

  it('completes Quest 1 step-by-step with prerequisites and idempotency', () => {
    // 1. Meet Hoa
    player.x = HAI_PHONG_POIS.HP_HOA_CRAB_NOODLE[0];
    player.y = HAI_PHONG_POIS.HP_HOA_CRAB_NOODLE[1];
    let ack = engine.handleIntent('p1', {
      actionId: 'act_1',
      type: 'HAIPHONG_ACTION',
      payload: { action: 'HP_FD_MEET_HOA' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().haiPhongState?.foodtour.score).toBe(5);

    // Duplicate check
    ack = engine.handleIntent('p1', {
      actionId: 'act_1_dup',
      type: 'HAIPHONG_ACTION',
      payload: { action: 'HP_FD_MEET_HOA' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().haiPhongState?.foodtour.score).toBe(5);

    // 2. Setup sidewalk
    player.x = HAI_PHONG_POIS.HP_SIDEWALK_BARRIER[0];
    player.y = HAI_PHONG_POIS.HP_SIDEWALK_BARRIER[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_2',
      type: 'HAIPHONG_ACTION',
      payload: { action: 'HP_FD_SETUP_SIDEWALK' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().haiPhongState?.foodtour.score).toBe(15);

    // 3. Organize parking
    player.x = HAI_PHONG_POIS.HP_PARKING_ZONE[0];
    player.y = HAI_PHONG_POIS.HP_PARKING_ZONE[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_3',
      type: 'HAIPHONG_ACTION',
      payload: { action: 'HP_FD_ORGANIZE_PARKING' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().haiPhongState?.foodtour.score).toBe(25);

    // 4. Post prices
    player.x = HAI_PHONG_POIS.HP_PRICE_LIST[0];
    player.y = HAI_PHONG_POIS.HP_PRICE_LIST[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_4',
      type: 'HAIPHONG_ACTION',
      payload: { action: 'HP_FD_POST_PRICES' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().haiPhongState?.foodtour.score).toBe(30);
    expect(engine.getSnapshot().haiPhongState?.foodtour.status).toBe('RESOLVED');
    expect(engine.getSnapshot().haiPhongState?.cheLo.status).toBe('ACTIVE');
    expect(engine.getSnapshot().haiPhongState?.currentQuest).toBe(2);
  });

  it('completes all 3 missions to reach 100 points', () => {
    // Q1
    player.x = HAI_PHONG_POIS.HP_HOA_CRAB_NOODLE[0]; player.y = HAI_PHONG_POIS.HP_HOA_CRAB_NOODLE[1];
    engine.handleIntent('p1', { actionId: 'q1_1', type: 'HAIPHONG_ACTION', payload: { action: 'HP_FD_MEET_HOA' } });
    player.x = HAI_PHONG_POIS.HP_SIDEWALK_BARRIER[0]; player.y = HAI_PHONG_POIS.HP_SIDEWALK_BARRIER[1];
    engine.handleIntent('p1', { actionId: 'q1_2', type: 'HAIPHONG_ACTION', payload: { action: 'HP_FD_SETUP_SIDEWALK' } });
    player.x = HAI_PHONG_POIS.HP_PARKING_ZONE[0]; player.y = HAI_PHONG_POIS.HP_PARKING_ZONE[1];
    engine.handleIntent('p1', { actionId: 'q1_3', type: 'HAIPHONG_ACTION', payload: { action: 'HP_FD_ORGANIZE_PARKING' } });
    player.x = HAI_PHONG_POIS.HP_PRICE_LIST[0]; player.y = HAI_PHONG_POIS.HP_PRICE_LIST[1];
    engine.handleIntent('p1', { actionId: 'q1_4', type: 'HAIPHONG_ACTION', payload: { action: 'HP_FD_POST_PRICES' } });

    // Q2
    player.x = HAI_PHONG_POIS.HP_CHE_LO_FURNACE[0]; player.y = HAI_PHONG_POIS.HP_CHE_LO_FURNACE[1];
    engine.handleIntent('p1', { actionId: 'q2_1', type: 'HAIPHONG_ACTION', payload: { action: 'HP_CL_INSPECT_FURNACE' } });
    player.x = HAI_PHONG_POIS.HP_SAMPLE_POINT[0]; player.y = HAI_PHONG_POIS.HP_SAMPLE_POINT[1];
    engine.handleIntent('p1', { actionId: 'q2_2', type: 'HAIPHONG_ACTION', payload: { action: 'HP_CL_TAKE_SAMPLE' } });
    player.x = HAI_PHONG_POIS.HP_FILTER_INSPECTION[0]; player.y = HAI_PHONG_POIS.HP_FILTER_INSPECTION[1];
    engine.handleIntent('p1', { actionId: 'q2_3', type: 'HAIPHONG_ACTION', payload: { action: 'HP_CL_CHECK_FILTER' } });
    player.x = HAI_PHONG_POIS.HP_DOSSIER_STATION[0]; player.y = HAI_PHONG_POIS.HP_DOSSIER_STATION[1];
    engine.handleIntent('p1', { actionId: 'q2_4', type: 'HAIPHONG_ACTION', payload: { action: 'HP_CL_SIGN_DOSSIER' } });

    expect(engine.getSnapshot().haiPhongState?.cheLo.status).toBe('RESOLVED');
    expect(engine.getSnapshot().haiPhongState?.doSon.status).toBe('ACTIVE');

    // Q3
    player.x = HAI_PHONG_POIS.HP_DO_SON_RESIDENTS[0]; player.y = HAI_PHONG_POIS.HP_DO_SON_RESIDENTS[1];
    engine.handleIntent('p1', { actionId: 'q3_1', type: 'HAIPHONG_ACTION', payload: { action: 'HP_DS_MEET_RESIDENTS' } });
    player.x = HAI_PHONG_POIS.HP_PLANNING_BOARD[0]; player.y = HAI_PHONG_POIS.HP_PLANNING_BOARD[1];
    engine.handleIntent('p1', { actionId: 'q3_2', type: 'HAIPHONG_ACTION', payload: { action: 'HP_DS_POST_PLANNING' } });
    player.x = HAI_PHONG_POIS.HP_COMPENSATION_DESK[0]; player.y = HAI_PHONG_POIS.HP_COMPENSATION_DESK[1];
    engine.handleIntent('p1', { actionId: 'q3_3', type: 'HAIPHONG_ACTION', payload: { action: 'HP_DS_RESOLVE_COMPENSATION' } });
    player.x = HAI_PHONG_POIS.HP_EXCAVATOR_SITE[0]; player.y = HAI_PHONG_POIS.HP_EXCAVATOR_SITE[1];
    engine.handleIntent('p1', { actionId: 'q3_4', type: 'HAIPHONG_ACTION', payload: { action: 'HP_DS_SECURE_EXCAVATOR' } });

    const snap = engine.getSnapshot();
    expect(snap.haiPhongState?.doSon.status).toBe('RESOLVED');
    expect(engine.totalScore).toBe(100);

    const view = getProvinceView(snap, 'p1');
    expect(view.totalScore).toBe(100);
    expect(view.quests[0].status).toBe('RESOLVED');
    expect(view.quests[1].status).toBe('RESOLVED');
    expect(view.quests[2].status).toBe('RESOLVED');
  });
});
