import { ngheAn } from './definition.js';
import type { ProvinceDefinition } from '../../core/contracts.js';

/** Test-only composition: deliberately absent from the production registry/index. */
export const ngheAnLocalityFixture: ProvinceDefinition = {
  ...ngheAn,
  quests: [...ngheAn.quests, { id: 'community-check', title: 'Kiểm tra điểm cộng đồng', scoreLabel: 'Kiểm tra', maxScore: 4 }],
  objectives: [{
    id: 'notice-inspection', questId: 'community-check', pointId: 'NOTICE_BOARD',
    label: 'Kiểm tra bảng công khai', jobType: 'AUDIT_RESULT', durationMs: 2000, score: 4,
    available: snapshot => snapshot.phase === 'RUNNING',
  }],
};
