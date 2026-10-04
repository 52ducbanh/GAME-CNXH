import { describe, expect, it } from 'vitest';
import type { ClientIntent, ProvinceCommand } from 'shared';
import { GameEngine } from '../gameEngine.js';

describe('Typed caller and untrusted room boundary', () => {
  it('validates the envelope and keeps cross-province dispatch authoritative', () => {
    const e = new GameEngine('BOUNDARY', 'host', 'nghe-an'), p = e.addPlayer('p', 'P');
    e.startRunning();
    expect(e.handleIntent(p.id, null).success).toBe(false);
    expect(e.handleIntent(p.id, { type: 'MOVE' }).success).toBe(false);
    const intent = { actionId: 'foreign', type: 'HATINH_ACTION', provinceId: 'ha-tinh', payload: { action: 'VA_REPORT_TUAN' } };
    expect(e.handleIntent(p.id, intent)).toEqual({ actionId: 'foreign', success: false, reason: 'Bản đồ hiện tại không phải Hà Tĩnh.' });
    expect(e.totalScore).toBe(0);
  });
  it('never converts a malformed explicit item ID into a stock pickup', () => {
    const e = new GameEngine('ITEM_BOUNDARY', 'host'), p = e.addPlayer('p', 'P');
    p.x = e.map.points.WAREHOUSE.x; p.y = e.map.points.WAREHOUSE.y;
    expect(e.handleIntent(p.id, { actionId: 'invalid', type: 'PICK_CRATE', payload: { crateId: 123 } }).success).toBe(false);
    expect(e.resources.availableCrates).toBe(12);
    expect(p.carriedCrateId).toBeNull();
  });
  it('detaches legacy projection readers from canonical room state', () => {
    const e = new GameEngine('DETACHED', 'host', 'ha-tinh');
    const m1 = e.m1, ht = e.hatinhState!, snapshot = e.getSnapshot();
    m1.surveys.A = true; ht.va.score = 30; snapshot.m1.surveys.B = true;
    expect(e.m1.surveys).toEqual({ A: false, B: false, C: false });
    expect(e.hatinhState!.va.score).toBe(0);
    expect(e.totalScore).toBe(0);
  });
  it('rejects bad action/payload/quest/province at compile time', () => {
    const valid: ClientIntent = { actionId: 'job', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_A' } };
    // @ts-expect-error Required task payload is absent.
    const missing: ClientIntent = { actionId: 'job', type: 'START_JOB' };
    // @ts-expect-error Coordinates must be numbers.
    const wrongPayload: ClientIntent = { actionId: 'move', type: 'MOVE', payload: { x: '1', y: 2 } };
    // @ts-expect-error Medical plan cannot be a bridge plan.
    const wrongQuest: ClientIntent = { actionId: 'plan', type: 'PROPOSE_PLAN', payload: { missionId: 'M1', plan: 'REPAIR' } };
    // @ts-expect-error A public-service province does not expose rescue commands.
    const wrongProvince: ProvinceCommand<'nghe-an'> = { actionId: 'foreign', type: 'HATINH_ACTION', payload: { action: 'VA_REPORT_TUAN' } };
    // @ts-expect-error Unknown action code.
    const wrongAction: ClientIntent = { actionId: 'bad', type: 'HATINH_ACTION', payload: { action: 'DO_ANYTHING' } };
    expect(valid.type).toBe('START_JOB');
    void [missing, wrongPayload, wrongQuest, wrongProvince, wrongAction];
  });
});
