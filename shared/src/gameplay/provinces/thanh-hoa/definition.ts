import type { ProvinceDefinition } from '../../core/contracts.js';

export const thanhHoa: ProvinceDefinition = {
  id: 'thanh-hoa',
  gameplay: 'public-service',
  objectives: [],
  quests: [
    { id: 'nem-chua', title: 'TRANH CHẤP BÍ QUYẾT & THƯƠNG HIỆU NEM CHUA', scoreLabel: 'M1', maxScore: 30 },
    { id: 'duong-ray', title: 'BẮT KẺ CẠY ỐC ĐƯỜNG RAY VEN KÊNH', scoreLabel: 'M2', maxScore: 35 },
    { id: 'vali-muoi-toi', title: 'BẢN LĨNH LIÊM CHÍNH & VALI MƯỜI TỎI', scoreLabel: 'M3', maxScore: 35 },
  ],
  presentation: {
    renderer: 'regional',
    palms: [],
    npcs: [],
  },
};
