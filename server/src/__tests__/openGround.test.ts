import { describe, it, expect } from 'vitest';
import { isWalkableForMap, isMovementSegmentClear, findWalkingRoute, getGameMap, resolveMovement } from 'shared';

describe('Open paved ground stays accessible without exempting obstacles', () => {
  it.each([
    ['hai-phong', 760, 550], ['hai-phong', 460, 670],
    ['hai-phong', 1130, 230], ['ha-tinh', 890, 490],
    ['ha-tinh', 950, 510], ['ha-tinh', 1450, 700],
  ] as const)('%s opens paved ground at %i,%i', (map, x, y) => {
    for (const bridgeBlocked of [false, true]) {
      const context = { bridgeBlocked, mobileBDeployed: true, mobileCDeployed: true };
      expect(isWalkableForMap(map, x, y, context)).toBe(true);
      const route = findWalkingRoute(getGameMap(map).spawn, { x, y }, context, map);
      expect(route.length).toBeGreaterThan(1);
      for (let i = 1; i < route.length; i++) {
        expect(isMovementSegmentClear(map, route[i - 1], route[i], context)).toBe(true);
      }
      const result = resolveMovement(map, { x, y }, { x: 12, y: 0 }, context);
      expect(result.position.x).toBeCloseTo(x + 12);
    }
  });
  it('keeps the plaza/path seam continuous for arbitrary MOVE sampling', () => {
    for (let y = 290; y <= 310; y += 0.5) expect(isWalkableForMap('hai-phong', 550, y)).toBe(true);
  });
  it.each([
    ['hai-phong', 800, 400], ['hai-phong', 625, 480],
    ['hai-phong', 670, 560], ['hai-phong', 1450, 600],
    ['ha-tinh', 1050, 250], ['ha-tinh', 90, 700],
    ['ha-tinh', 800, 880], ['ha-tinh', 1620, 620],
  ] as const)('%s preserves solid/water blocking at %i,%i', (map, x, y) => {
    expect(isWalkableForMap(map, x, y)).toBe(false);
  });
});
