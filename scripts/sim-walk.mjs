import { createTestEngine, serviceStateOf } from './server/dist/__tests__/fixtures/gameplay.js';
import { getGameMap, findWalkingRoute } from './shared/dist/index.js';

const map = getGameMap('hai-phong');
const e = createTestEngine('REGION_WALK', 'host', 'hai-phong');
const p = e.addPlayer('walker', 'Walker');
e.startRunning();

for (const blocked of [false, true]) {
  serviceStateOf(e).bridgeResponse.bridgeBroken = blocked;
  p.x = map.spawn.x;
  p.y = map.spawn.y;
  console.log(`\nTesting blocked=${blocked}, start at spawn:`, p.x, p.y);
  for (const poi of Object.values(map.points)) {
    const route = findWalkingRoute(p, poi, blocked, map.id);
    for (let j = 1; j < route.length; j++) {
      const a = route[j-1], b = route[j];
      const steps = Math.ceil(Math.hypot(b.x-a.x, b.y-a.y)/7);
      for (let k = 1; k <= steps; k++) {
        const nextX = a.x + (b.x-a.x)*k/steps;
        const nextY = a.y + (b.y-a.y)*k/steps;
        const ack = e.handleIntent(p.id, {
          actionId: `${blocked}_${poi.id}_${j}_${k}`,
          type: 'MOVE',
          payload: { x: nextX, y: nextY }
        });
        if (!ack.success) {
          console.log(`FAIL at POI ${poi.id}, segment ${j}, step ${k}/${steps}:`, ack.reason);
          console.log(`  from (${p.x}, ${p.y}) to (${nextX}, ${nextY})`);
          process.exit(1);
        }
      }
    }
    console.log(`Reached ${poi.id}`);
  }
}
console.log('All POIs in Hai Phong walked successfully!');
