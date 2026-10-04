import type { ProvinceDefinition } from '../../core/contracts.js';

export const haiPhong: ProvinceDefinition = {
  id: 'hai-phong',
  gameplay: 'public-service',
  objectives: [],
  quests: [
    { id: 'foodtour', title: 'VĂN MINH FOODTOUR & TRẬT TỰ ĐÔ THỊ', scoreLabel: 'M1', maxScore: 30 },
    { id: 'che-lo', title: 'QUẢN LÝ MÔI TRƯỜNG LÒ ĐÚC CHÈ LÒ', scoreLabel: 'M2', maxScore: 35 },
    { id: 'do-son', title: 'DỰ ÁN MỞ ĐƯỜNG & ĐỒNG THUẬN ĐỒ SƠN', scoreLabel: 'M3', maxScore: 35 },
  ],
  presentation: {
    renderer: 'regional',
    palms: [[492, 666], [1105, 708]],
    npcs: [],
  },
};
