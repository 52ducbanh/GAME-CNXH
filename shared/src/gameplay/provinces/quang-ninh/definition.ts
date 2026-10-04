import type { ProvinceDefinition } from '../../core/contracts.js';

export const quangNinh: ProvinceDefinition = {
  id: 'quang-ninh',
  gameplay: 'public-service',
  objectives: [],
  quests: [
    { id: 'to-roi', title: 'DẸP TỜ RƠI ĐEN & TUYÊN TRUYỀN PHÁP LUẬT', scoreLabel: 'M1', maxScore: 30 },
    { id: 'cong-truong', title: 'QUẢN LÝ CÔNG TRƯỜNG & MÔI TRƯỜNG VỊNH', scoreLabel: 'M2', maxScore: 35 },
    { id: 'than-xuat', title: 'XỬ LÝ KHO KHOÁNG SẢN LẬU & BẢO VỆ CẦU', scoreLabel: 'M3', maxScore: 35 },
  ],
  presentation: {
    renderer: 'regional',
    palms: [],
    npcs: [],
  },
};
