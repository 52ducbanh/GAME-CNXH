import type { ProvinceDefinition } from '../../core/contracts.js';
export const haTinh: ProvinceDefinition = {
  id: 'ha-tinh', gameplay: 'hatinh-rescue', objectives: [],
  quests: [
    { id: 'vung-ang', title: 'LỬA ĐỎ TUYẾN VŨNG ÁNG', scoreLabel: 'M1', maxScore: 30 },
    { id: 'deo-ngang', title: 'MÂY TRẮNG ĐÈO NGANG', scoreLabel: 'M2', maxScore: 35 },
    { id: 'dong-loc', title: 'NÉN HƯƠNG TRƯỚC CHUÔNG ĐỒNG', scoreLabel: 'M3', maxScore: 35 },
  ],
  presentation: {
    renderer: 'regional', palms: [], waterfall: [1430, 535],
    rescueSceneUrl: '/assets/regions/ha-tinh/rescue-scene.webp',
    npcs: [
      { pointId: 'WORKER_TUAN', name: 'Anh Tuấn', texture: 'hn-volunteer', color: '#ffb050' },
      { pointId: 'INSPECTION_BANG', name: 'Đ/c Bàng', texture: 'hn-volunteer', color: '#50b0ff' },
      { pointId: 'DOSSIER_DOAN', name: 'Ông Doãn', texture: 'hn-citizen', color: '#d0d0d0' },
      { pointId: 'RESCUE_STAGING', name: 'Chỉ huy cứu hộ', texture: 'hn-doctor', color: '#ff5050' },
      { pointId: 'RESCUE_NAM', name: 'Nam (Nạn nhân)', texture: 'hn-citizen', color: '#ff7070' },
      { pointId: 'DONG_LOC_TUNG', name: 'Bác Tùng (BQL)', texture: 'hn-doctor', color: '#ffd700' },
      { pointId: 'DONG_LOC_SAU', name: 'Mụ Sáu', texture: 'hn-citizen', color: '#ffa0a0' },
      { pointId: 'DONG_LOC_TEO', name: 'Tèo (Đổi tiền)', texture: 'hn-citizen', color: '#ffb070' },
      { pointId: 'DONG_LOC_HAI', name: 'Bác Hải (CCB)', texture: 'hn-volunteer', color: '#90ee90' },
      { pointId: 'DONG_LOC_TIKTOKER', name: 'TikToker', texture: 'hn-citizen', color: '#ee88ee' },
    ],
  },
};
