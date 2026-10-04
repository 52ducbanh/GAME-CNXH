import type { ProvinceDefinition } from '../../core/contracts.js';

export const ngheAn: ProvinceDefinition = {
  id: 'nghe-an',
  gameplay: 'public-service',
  objectives: [],
  quests: [
    { id: 'chao-luon', title: 'LẬP LẠI TRẬT TỰ KHU PHỐ CHÁO LƯƠN', scoreLabel: 'M1', maxScore: 30 },
    { id: 'lua-dao-dat', title: 'VÂY BẮT ĐỐI TƯỢNG LỪA ĐẢO HỒ SƠ ĐẤT ĐAI', scoreLabel: 'M2', maxScore: 35 },
    { id: 'quy-khuyen-hoc', title: 'PHÁ ÁN MẤT TRỘM QUỸ KHUYẾN HỌC KHỐI PHỐ', scoreLabel: 'M3', maxScore: 35 },
  ],
  presentation: {
    renderer: 'regional',
    palms: [],
    npcs: [],
  },
};
