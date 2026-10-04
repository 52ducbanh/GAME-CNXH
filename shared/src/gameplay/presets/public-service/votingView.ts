import type { GameSnapshot } from '../../../types.js';
import type { ProvinceView } from '../../core/contracts.js';

const options: ProvinceView['votingOptions'] = [
  {
    "id": "vote-opt-fixed",
    "plan": "FIXED",
    "color": "amber",
    "title": "Tráº¡m Cá»‘ Ä‘á»‹nh (Gáº§n A)",
    "description": "40 ngÃ¢n sÃ¡ch, 2 kiá»‡n váº­t tÆ°. Phá»¥c vá»¥ 22 dÃ¢n (A12, B10). Ãt chuyáº¿n Ä‘i nhÆ°ng Khu C chÆ°a tiáº¿p cáº­n."
  },
  {
    "id": "vote-opt-mobile",
    "plan": "MOBILE",
    "color": "sky",
    "title": "Äiá»ƒm LÆ°u Ä‘á»™ng (B & C)",
    "description": "30 ngÃ¢n sÃ¡ch, 4 kiá»‡n váº­t tÆ°. Phá»¥c vá»¥ 24 dÃ¢n (A10, B8, C6). NgÃ¢n sÃ¡ch tháº¥p hÆ¡n, bao phá»§ rá»™ng hÆ¡n."
  },
  {
    "id": "vote-opt-repair",
    "plan": "REPAIR",
    "color": "emerald",
    "title": "Sá»­a cáº§u (REPAIR)",
    "description": "25 ngÃ¢n sÃ¡ch, 4 kiá»‡n váº­t tÆ° (2 sá»­a + 2 cá»©u trá»£). KhÃ´i phá»¥c lÃ¢u dÃ i háº¡ táº§ng giao thÃ´ng sang Khu B."
  },
  {
    "id": "vote-opt-detour",
    "plan": "DETOUR",
    "color": "amber",
    "title": "Tuyáº¿n vÃ²ng (DETOUR)",
    "description": "10 ngÃ¢n sÃ¡ch, 2 kiá»‡n cá»©u trá»£. Tiáº¿t kiá»‡m 15 ngÃ¢n sÃ¡ch nhÆ°ng cáº§u váº«n há»ng, Ä‘Æ°á»ng Ä‘i dÃ i hÆ¡n gáº¥p Ä‘Ã´i."
  }
];

export function publicServiceVotingOptions(s: GameSnapshot): ProvinceView['votingOptions'] {
  if (!s.voting?.active) return [];
  return s.voting.missionId === 'M1' ? options.slice(0, 2) : s.voting.missionId === 'M2' ? options.slice(2) : [];
}
