import { getGameMap, findWalkingRoute, isMovementSegmentClear } from '../shared/dist/index.js';

const map = getGameMap('hai-phong');
const pois = Object.values(map.points);
console.log('POI count:', pois.length);
for (let i = 0; i < pois.length; i++) {
  const from = i === 0 ? map.spawn : pois[i - 1];
  const to = pois[i];
  const route = findWalkingRoute(from, to, false, 'hai-phong');
  for (let j = 1; j < route.length; j++) {
    const a = route[j-1], b = route[j];
    const steps = Math.ceil(Math.hypot(b.x-a.x, b.y-a.y)/7);
    for (let k = 1; k <= steps; k++) {
      const cur = { x: a.x + (b.x-a.x)*(k-1)/steps, y: a.y + (b.y-a.y)*(k-1)/steps };
      const next = { x: a.x + (b.x-a.x)*k/steps, y: a.y + (b.y-a.y)*k/steps };
      if (!isMovementSegmentClear('hai-phong', cur, next, false)) {
        console.log(`BLOCKED walking from ${from.id || 'spawn'} to ${to.id}:`);
        console.log(`  node ${j-1} -> ${j}, step ${k}/${steps}`);
        console.log(`  cur:`, cur, `next:`, next);
        process.exit(1);
      }
    }
  }
}
console.log('All consecutive POIs walked cleanly without obstacle!');
