import { describe, it, expect, beforeEach } from 'vitest';
import { GameEngine } from '../gameEngine.js';
import { THANH_HOA_POIS, getProvinceView } from 'shared';

describe('Thanh Hoa Gameplay & Missions', () => {
  let engine: GameEngine;
  let player: any;

  beforeEach(() => {
    engine = new GameEngine('TEST_TH', 'host_token', 'thanh-hoa');
    player = engine.addPlayer('p1', 'Player 1', true);
    engine.phase = 'RUNNING';
  });

  it('starts at Quest 1 Nem Chua with zero score and active status', () => {
    const snap = engine.getSnapshot();
    expect(snap.thanhHoaState).toBeDefined();
    expect(snap.thanhHoaState?.currentQuest).toBe(1);
    expect(snap.thanhHoaState?.nemChua.status).toBe('ACTIVE');
    expect(snap.thanhHoaState?.duongRay.status).toBe('LOCKED');
    expect(snap.thanhHoaState?.valiMuoiToi.status).toBe('LOCKED');
    expect(engine.totalScore).toBe(0);
  });

  it('rejects action when player is too far from POI', () => {
    player.x = 1000;
    player.y = 100;
    const ack = engine.handleIntent('p1', {
      actionId: 'far_1',
      type: 'THANHHOA_ACTION',
      payload: { action: 'TH_NM_MEET_DISPUTE' },
    });
    expect(ack.success).toBe(false);
    expect(ack.reason).toContain('Cần đến trước Cửa Vòm');
  });

  it('completes Quest 1 step-by-step with prerequisites and idempotency', () => {
    // 1. Meet dispute
    player.x = THANH_HOA_POIS.TH_ARCH_GATE[0];
    player.y = THANH_HOA_POIS.TH_ARCH_GATE[1];
    let ack = engine.handleIntent('p1', {
      actionId: 'act_1',
      type: 'THANHHOA_ACTION',
      payload: { action: 'TH_NM_MEET_DISPUTE' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().thanhHoaState?.nemChua.score).toBe(5);

    // Duplicate check
    ack = engine.handleIntent('p1', {
      actionId: 'act_1_dup',
      type: 'THANHHOA_ACTION',
      payload: { action: 'TH_NM_MEET_DISPUTE' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().thanhHoaState?.nemChua.score).toBe(5);

    // 2. Inspect Shop C
    player.x = THANH_HOA_POIS.TH_NEM_C_SHOP[0];
    player.y = THANH_HOA_POIS.TH_NEM_C_SHOP[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_2',
      type: 'THANHHOA_ACTION',
      payload: { action: 'TH_NM_INSPECT_SHOP_C' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().thanhHoaState?.nemChua.score).toBe(15);

    // 3. Collect Kit
    player.x = THANH_HOA_POIS.TH_SUPPLY_WAREHOUSE[0];
    player.y = THANH_HOA_POIS.TH_SUPPLY_WAREHOUSE[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_3',
      type: 'THANHHOA_ACTION',
      payload: { action: 'TH_NM_COLLECT_KIT' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().thanhHoaState?.nemChua.score).toBe(25);

    // 4. Resolve Dispute
    player.x = THANH_HOA_POIS.TH_NEM_B_SHOP[0];
    player.y = THANH_HOA_POIS.TH_NEM_B_SHOP[1];
    ack = engine.handleIntent('p1', {
      actionId: 'act_4',
      type: 'THANHHOA_ACTION',
      payload: { action: 'TH_NM_RESOLVE_DISPUTE' },
    });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().thanhHoaState?.nemChua.score).toBe(30);
    expect(engine.getSnapshot().thanhHoaState?.nemChua.status).toBe('RESOLVED');
    expect(engine.getSnapshot().thanhHoaState?.duongRay.status).toBe('ACTIVE');
    expect(engine.getSnapshot().thanhHoaState?.currentQuest).toBe(2);
  });

  it('handles Quest 3 bribe choices (reject bribe, reject rough, record professional)', () => {
    // Fast forward Q1 & Q2
    player.x = THANH_HOA_POIS.TH_ARCH_GATE[0]; player.y = THANH_HOA_POIS.TH_ARCH_GATE[1];
    engine.handleIntent('p1', { actionId: 'q1_1', type: 'THANHHOA_ACTION', payload: { action: 'TH_NM_MEET_DISPUTE' } });
    player.x = THANH_HOA_POIS.TH_NEM_C_SHOP[0]; player.y = THANH_HOA_POIS.TH_NEM_C_SHOP[1];
    engine.handleIntent('p1', { actionId: 'q1_2', type: 'THANHHOA_ACTION', payload: { action: 'TH_NM_INSPECT_SHOP_C' } });
    player.x = THANH_HOA_POIS.TH_SUPPLY_WAREHOUSE[0]; player.y = THANH_HOA_POIS.TH_SUPPLY_WAREHOUSE[1];
    engine.handleIntent('p1', { actionId: 'q1_3', type: 'THANHHOA_ACTION', payload: { action: 'TH_NM_COLLECT_KIT' } });
    player.x = THANH_HOA_POIS.TH_NEM_B_SHOP[0]; player.y = THANH_HOA_POIS.TH_NEM_B_SHOP[1];
    engine.handleIntent('p1', { actionId: 'q1_4', type: 'THANHHOA_ACTION', payload: { action: 'TH_NM_RESOLVE_DISPUTE' } });

    player.x = THANH_HOA_POIS.TH_RAIL_CORRIDOR[0]; player.y = THANH_HOA_POIS.TH_RAIL_CORRIDOR[1];
    engine.handleIntent('p1', { actionId: 'q2_1', type: 'THANHHOA_ACTION', payload: { action: 'TH_DR_APPROACH_SCENE' } });
    player.x = THANH_HOA_POIS.TH_RAIL_GUARD[0]; player.y = THANH_HOA_POIS.TH_RAIL_GUARD[1];
    engine.handleIntent('p1', { actionId: 'q2_2', type: 'THANHHOA_ACTION', payload: { action: 'TH_DR_SUBDUE_GUARD' } });
    player.x = THANH_HOA_POIS.TH_BRIDGE_ESCAPE[0]; player.y = THANH_HOA_POIS.TH_BRIDGE_ESCAPE[1];
    engine.handleIntent('p1', { actionId: 'q2_3', type: 'THANHHOA_ACTION', payload: { action: 'TH_DR_BLOCK_ESCAPE' } });
    player.x = THANH_HOA_POIS.TH_SUPPLY_WAREHOUSE[0]; player.y = THANH_HOA_POIS.TH_SUPPLY_WAREHOUSE[1];
    engine.handleIntent('p1', { actionId: 'q2_4', type: 'THANHHOA_ACTION', payload: { action: 'TH_DR_HANDOVER_EVIDENCE' } });

    // Meet bribe
    player.x = THANH_HOA_POIS.TH_OFFICE_LOBBY[0]; player.y = THANH_HOA_POIS.TH_OFFICE_LOBBY[1];
    let ack = engine.handleIntent('p1', { actionId: 'q3_1', type: 'THANHHOA_ACTION', payload: { action: 'TH_VT_MEET_BRIBE' } });
    expect(ack.success).toBe(true);

    // Branch 1: Accept bribe -> rejected by integrity guard
    ack = engine.handleIntent('p1', { actionId: 'bribe_1', type: 'THANHHOA_ACTION', payload: { action: 'TH_VT_ACCEPT_BRIBE' } });
    expect(ack.success).toBe(false);
    expect(ack.reason).toContain('Hành vi vi phạm nghiêm trọng liêm chính');

    // Branch 2: Reject rough -> suspect runs away, requires retry
    ack = engine.handleIntent('p1', { actionId: 'rough_1', type: 'THANHHOA_ACTION', payload: { action: 'TH_VT_REJECT_ROUGH' } });
    expect(ack.success).toBe(false);
    expect(ack.reason).toContain('Đối tượng ôm vali bỏ chạy');
    expect(engine.getSnapshot().thanhHoaState?.valiMuoiToi.retryCount).toBe(1);

    // Branch 3: Record professional
    player.x = THANH_HOA_POIS.TH_BRIEFCASE_TABLE[0]; player.y = THANH_HOA_POIS.TH_BRIEFCASE_TABLE[1];
    ack = engine.handleIntent('p1', { actionId: 'rec_1', type: 'THANHHOA_ACTION', payload: { action: 'TH_VT_RECORD_EVIDENCE' } });
    expect(ack.success).toBe(true);
    expect(engine.getSnapshot().thanhHoaState?.valiMuoiToi.score).toBe(25);

    // Trigger alarm
    player.x = THANH_HOA_POIS.TH_ALARM_BUTTON[0]; player.y = THANH_HOA_POIS.TH_ALARM_BUTTON[1];
    ack = engine.handleIntent('p1', { actionId: 'alarm_1', type: 'THANHHOA_ACTION', payload: { action: 'TH_VT_TRIGGER_ALARM' } });
    expect(ack.success).toBe(true);

    const snap = engine.getSnapshot();
    expect(snap.thanhHoaState?.valiMuoiToi.status).toBe('RESOLVED');
    expect(engine.totalScore).toBe(100);

    const view = getProvinceView(snap, 'p1');
    expect(view.totalScore).toBe(100);
    expect(view.quests[0].status).toBe('RESOLVED');
    expect(view.quests[1].status).toBe('RESOLVED');
    expect(view.quests[2].status).toBe('RESOLVED');
  });
});
