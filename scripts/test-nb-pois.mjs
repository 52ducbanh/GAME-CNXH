import { isWalkableForMap, getGameMap } from '../shared/dist/index.js';

const points = {
  NB_BQL_CHU: [685, 295],
  NB_BAI_DINH_GATE: [555, 570],
  NB_LIVESTREAM_GROUP: [710, 745],
  NB_RULE_BOARD: [410, 290],
  NB_RANGERS_POST: [1518, 587],
  NB_ANIMAL_TRAP: [1450, 575],
  NB_WILDLIFE_RELEASE: [1615, 640],
  NB_TIMBER_ZONE: [1550, 635],
  NB_BOATMAN_REP: [770, 830],
  NB_TICKET_BOARD: [885, 780],
  NB_LIFEJACKET_STATION: [960, 892],
  NB_DISPATCH_POST: [1000, 751]
};

console.log('Testing Ninh Binh POI walkability:');
for (const [name, [x, y]] of Object.entries(points)) {
  const ok = isWalkableForMap('ninh-binh', x, y);
  console.log(` - ${name} [${x}, ${y}]: ${ok ? 'WALKABLE' : 'BLOCKED'}`);
}
