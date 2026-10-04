import { describe, expect, it } from 'vitest';
import { GAME_MAPS, buildInteractionCatalogue, buildMissionGuide, getProvinceDefinition, publicServiceModule } from 'shared';
import { ngheAnLocalityFixture } from 'shared/dist/gameplay/provinces/nghe-an/locality.fixture.js';
import { GameEngine } from '../gameEngine.js';
import { PublicServiceRuntime } from '../gameplay/presets/public-service/runtime.js';

function fixture() {
  const engine = new GameEngine('LOCALITY', 'host', 'nghe-an', (_id, ports) => new PublicServiceRuntime(ports, ngheAnLocalityFixture));
  const player = engine.addPlayer('p', 'P'), peer = engine.addPlayer('q', 'Q');
  engine.startRunning();
  // Rule fixture positioning, not a browser/movement certification.
  const poi = engine.map.points.NOTICE_BOARD;
  player.x = peer.x = poi.x; player.y = peer.y = poi.y;
  const module = publicServiceModule(ngheAnLocalityFixture);
  const actions = () => buildInteractionCatalogue(engine.getSnapshot(), player.id, module.interactions, module.describeAction);
  const view = () => { const snapshot = engine.getSnapshot(); return module.view(snapshot, buildMissionGuide(snapshot, player.id, module.guide)); };
  return { engine, player, peer, actions, view };
}

describe('Nghệ An module-only locality proof', () => {
  it('adds catalogue, guide, fourth quest, marker and derived score with existing capabilities', () => {
    const { engine, player, peer, actions, view } = fixture();
    const action = actions().find(a => a.label === 'Kiểm tra bảng công khai')!;
    expect(action.intent).toEqual({ type: 'START_JOB', payload: { type: 'AUDIT_RESULT', targetId: 'NOTICE_BOARD' } });
    expect(view().guide.target?.id).toBe('NOTICE_BOARD');
    expect(view().activeQuestId).toBe('community-check');
    expect(view().activeQuestNumber).toBe(4);
    expect(view().markers).toContainEqual({ pointId: 'NOTICE_BOARD', done: false });
    const intent = { actionId: 'inspection', ...action.intent };
    const ack = engine.handleIntent(player.id, intent);
    expect(ack.success).toBe(true);
    expect(engine.handleIntent(player.id, intent)).toEqual(ack);
    expect(engine.handleIntent(peer.id, { ...intent, actionId: 'race' }).success).toBe(false);
    engine.tick(2100);
    expect(engine.getSnapshot().objectiveProgress).toEqual({ 'notice-inspection': true });
    expect(engine.totalScore).toBe(4);
    expect(view().quests.find(q => q.id === 'community-check')).toMatchObject({ score: 4, status: 'RESOLVED' });
    expect(view().markers).toContainEqual({ pointId: 'NOTICE_BOARD', done: true });
    expect(actions().some(a => a.label === action.label)).toBe(false);
    expect(engine.handleIntent(player.id, intent)).toEqual(ack);
    expect(engine.totalScore).toBe(4);
  });
  it('uses the common pause, cancel, timer and reset lifecycle', () => {
    const { engine, player, actions } = fixture();
    const action = actions().find(a => a.label === 'Kiểm tra bảng công khai')!;
    engine.handleIntent(player.id, { actionId: 'start', ...action.intent });
    engine.hostAction('PAUSE', 'host'); engine.tick(3000);
    expect(engine.totalScore).toBe(0);
    expect(player.activeJob).not.toBeNull();
    engine.hostAction('RESUME', 'host');
    expect(engine.handleIntent(player.id, { actionId: 'cancel', type: 'CANCEL_JOB' }).success).toBe(true);
    engine.tick(3000); expect(engine.totalScore).toBe(0);
    engine.handleIntent(player.id, { actionId: 'again', ...action.intent }); engine.tick(2100);
    expect(engine.totalScore).toBe(4);
    engine.hostAction('RESET', 'host');
    expect(engine.totalScore).toBe(0);
    expect(engine.getSnapshot().objectiveProgress).toEqual({});
    expect(player.activeJob).toBeNull();
  });
  it('never registers the test objective in any production province', () => {
    for (const map of GAME_MAPS) {
      expect(getProvinceDefinition(map.id).objectives).toEqual([]);
      expect(getProvinceDefinition(map.id).quests).toHaveLength(3);
      expect(new GameEngine(`PROD_${map.id}`, 'host', map.id).getSnapshot().objectiveProgress).toBeUndefined();
    }
  });
});
