import type { GameSnapshot } from '../../../types.js';
import type { ProvinceView } from '../../core/contracts.js';

const options: ProvinceView['votingOptions'] = [
  {
    "id": "vote-opt-fixed",
    "plan": "FIXED",
    "color": "amber",
    "title": "Trạm Cố định (Gần A)",
    "description": "40 ngân sách, 2 kiện vật tư. Phục vụ 22 dân (A12, B10). Ít chuyến đi nhưng Khu C chưa tiếp cận."
  },
  {
    "id": "vote-opt-mobile",
    "plan": "MOBILE",
    "color": "sky",
    "title": "Điểm Lưu động (B & C)",
    "description": "30 ngân sách, 4 kiện vật tư. Phục vụ 24 dân (A10, B8, C6). Ngân sách thấp hơn, bao phủ rộng hơn."
  },
  {
    "id": "vote-opt-repair",
    "plan": "REPAIR",
    "color": "emerald",
    "title": "Sửa cầu (REPAIR)",
    "description": "25 ngân sách, 4 kiện vật tư (2 sửa + 2 cứu trợ). Khôi phục lâu dài hạ tầng giao thông sang Khu B."
  },
  {
    "id": "vote-opt-detour",
    "plan": "DETOUR",
    "color": "amber",
    "title": "Tuyến vòng (DETOUR)",
    "description": "10 ngân sách, 2 kiện cứu trợ. Tiết kiệm 15 ngân sách nhưng cầu vẫn hỏng, đường đi dài hơn gấp đôi."
  }
];

export function publicServiceVotingOptions(s: GameSnapshot): ProvinceView['votingOptions'] {
  if (!s.voting?.active) return [];
  return s.voting.missionId === 'M1' ? options.slice(0, 2) : s.voting.missionId === 'M2' ? options.slice(2) : [];
}
