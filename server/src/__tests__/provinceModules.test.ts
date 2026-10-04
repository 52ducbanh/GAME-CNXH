import { createTestEngine, serviceStateOf, rescueStateOf } from './fixtures/gameplay.js';
import { describe, expect, it } from 'vitest';
import { MAP_IDS, getGameMap, getProvinceDefinition, getProvinceView, getInteractionActions, PROVINCES } from 'shared';
import { GameEngine } from '../gameEngine.js';

describe('Province contract and static registry', () => {
  it('registers exactly the seven playable provinces', () => {
    expect(Object.keys(PROVINCES).sort()).toEqual([...MAP_IDS].sort());
  });
  it.each(MAP_IDS)('%s composes three quests and valid map/NPC bindings', id => {
    const definition = getProvinceDefinition(id), map = getGameMap(id);
    expect(definition.id).toBe(map.id);
    expect(definition.quests).toHaveLength(3);
    expect(new Set(definition.quests.map(q => q.id)).size).toBe(3);
    expect(definition.quests.reduce((sum, q) => sum + q.maxScore, 0)).toBe(100);
    expect(definition.objectives).toHaveLength(0);
    for (const npc of definition.presentation.npcs) expect(map.points[npc.pointId]).toBeDefined();
  });
  it('shares the public-service composition while keeping local presentation bindings', () => {
    expect(getProvinceDefinition('nghe-an').quests).not.toBe(getProvinceDefinition('hanoi').quests);
    expect(getProvinceDefinition('nghe-an').presentation.palms).not.toEqual(getProvinceDefinition('hai-phong').presentation.palms);
    expect(getProvinceDefinition('ha-tinh').gameplay).toBe('hatinh-rescue');
  });
  it.each(MAP_IDS)('%s owns fresh room state, reset and presentation selectors', id => {
    const a = createTestEngine('A', 'host', id), b = createTestEngine('B', 'host', id);
    const p = a.addPlayer('p', 'P'); a.startRunning();
    const before = a.getSnapshot(), view = getProvinceView(before, p.id);
    expect(view.quests.map(q => q.id)).toEqual(getProvinceDefinition(id).quests.map(q => q.id));
    expect(view.totalScore).toBe(before.totalScore);
    expect(view.minimapUrl).toBe(getGameMap(id).minimapUrl);
    expect(view.guide.target).toBeDefined();
    expect(view.results.recap).toBeInstanceOf(Array);
    expect(getInteractionActions(before, p.id).length).toBeGreaterThan(0);
    p.x = a.map.points.WAREHOUSE.x; p.y = a.map.points.WAREHOUSE.y;
    expect(a.handleIntent(p.id, { actionId: 'stock', type: 'PICK_CRATE' }).success).toBe(true);
    serviceStateOf(a).medicalService.surveys.A = true;
    expect(b.m1.surveys.A).toBe(false);
    a.resetToLobby();
    expect(a.m1.surveys.A).toBe(false);
    expect(a.getSnapshot().mapId).toBe(id);
    expect(a.totalScore).toBe(0);
    expect([...a.crates.values()].every(crate => crate.state === 'WAREHOUSE' && crate.carriedByPlayerId === null)).toBe(true);
    expect(a.resources.availableCrates).toBe(12);
  });
});
