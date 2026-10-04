import { describe, expect, it } from 'vitest';
import { MAP_IDS, getGameMap, getProvinceDefinition, PROVINCES } from 'shared';

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
    expect(getProvinceDefinition('nghe-an').quests).toBe(getProvinceDefinition('hanoi').quests);
    expect(getProvinceDefinition('nghe-an').presentation.palms).not.toEqual(getProvinceDefinition('hai-phong').presentation.palms);
    expect(getProvinceDefinition('ha-tinh').gameplay).toBe('hatinh-rescue');
  });
});
