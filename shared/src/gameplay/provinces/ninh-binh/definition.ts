import type { ProvinceDefinition } from '../../core/contracts.js';

export const ninhBinh: ProvinceDefinition = {
  id: 'ninh-binh',
  gameplay: 'public-service',
  objectives: [],
  quests: [
    { id: 'bai-dinh', title: 'BẢO VỆ TÍN NGƯỠNG BÁI ĐÍNH', scoreLabel: 'M1', maxScore: 30 },
    { id: 'cuc-phuong', title: 'TUẦN TRA ĐÊM RỪNG CÚC PHƯƠNG', scoreLabel: 'M2', maxScore: 35 },
    { id: 'tam-coc', title: 'GIẢI TỎA ÁCH TẮC BẾN TAM CỐC', scoreLabel: 'M3', maxScore: 35 },
  ],
  presentation: {
    renderer: 'regional',
    palms: [],
    npcs: [],
  },
};
