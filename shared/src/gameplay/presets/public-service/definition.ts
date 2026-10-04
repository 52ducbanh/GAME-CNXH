import type { ProvinceDefinition, QuestDefinition } from '../../core/contracts.js';
import type { MapId } from '../../../worldMaps.js';

export const PUBLIC_SERVICE_QUESTS: readonly QuestDefinition[] = [
  { id: 'medical-service', title: 'MỞ TRẠM Y TẾ', scoreLabel: 'M1', maxScore: 30 },
  { id: 'bridge-response', title: 'ỨNG PHÓ SỰ CỐ CẦU', scoreLabel: 'M2', maxScore: 35 },
  { id: 'citizen-rights', title: 'BẢO VỆ QUYỀN TIẾP CẬN', scoreLabel: 'M3', maxScore: 35 },
];

export function publicServiceProvince(id: MapId, presentation: Partial<ProvinceDefinition['presentation']> = {}): ProvinceDefinition {
  return {
    id, gameplay: 'public-service', quests: PUBLIC_SERVICE_QUESTS, objectives: [],
    presentation: {
      renderer: 'regional', palms: [],
      npcs: [
        { pointId: 'ZONE_A', name: 'Huyền', texture: 'hn-citizen', color: '#ed92d1' },
        { pointId: 'ZONE_B', name: 'Ninh', texture: 'hn-volunteer', color: '#9cdb88' },
        { pointId: 'ZONE_C', name: 'Tâm', texture: 'hn-volunteer', color: '#ffdc70' },
        { pointId: 'CITIZEN_C1', name: 'Cụ Lan' }, { pointId: 'CITIZEN_C2', name: 'Cụ Bình' },
      ], ...presentation,
    },
  };
}
