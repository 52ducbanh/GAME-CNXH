import type { GameSnapshot } from '../../../types.js';
import { getGameMap } from '../../../worldMaps.js';
import { generateRecap } from '../../../knowledgeMap.js';
import type { MissionGuide } from '../../core/guide.js';
import type { ProvinceDefinition, ProvinceView } from '../../core/contracts.js';
import { publicServiceVotingOptions } from './votingView.js';

export function publicServiceWorldState(s: GameSnapshot) {
  return { bridgeBlocked: s.m2.bridgeBroken && !s.m2.bridgeRepaired, fixedDeployed: s.m1.fixedDeployed, mobileBDeployed: s.m1.mobileBDeployed, mobileCDeployed: s.m1.mobileCDeployed };
}

export function publicServiceView(s: GameSnapshot, definition: ProvinceDefinition, guide: MissionGuide): ProvinceView {
  const states = [s.m1, s.m2, s.m3];
  const activeQuestNumber = s.m1.status === 'ACTIVE' ? 1 : s.m2.status === 'ACTIVE' ? 2 : 3;
  return {
    quests: definition.quests.map((q, i) => ({ ...q, score: states[i]?.score ?? 0, status: states[i]?.status ?? 'LOCKED' })),
    activeQuestNumber, activeQuestId: definition.quests[activeQuestNumber - 1].id, totalScore: s.totalScore,
    guide, minimapUrl: getGameMap(s.mapId).minimapUrl, markers: [], votingOptions: publicServiceVotingOptions(s),
    visual: {
      world: publicServiceWorldState(s),
      bridgeFrame: s.m2.bridgeRepaired ? 2 : s.m2.bridgeBroken ? 1 : 0,
      clinics: { fixed: { deployed: s.m1.fixedDeployed, crates: s.m1.deliveredCratesFixed }, mobileB: { deployed: s.m1.mobileBDeployed, crates: s.m1.deliveredCratesMobileB }, mobileC: { deployed: s.m1.mobileCDeployed, crates: s.m1.deliveredCratesMobileC } },
      rescue: { sceneAlpha: 0, duskAlpha: 0, fogAlpha: 0 },
    },
    results: {
      metrics: [],
      recap: generateRecap(s.m1.planCommitted, s.m2.planCommitted, s.m3.status === 'RESOLVED', s.citizensServedCount, s.totalCitizensCount, s.resources.currentBudget, s.resources.availableCrates).recaps,
      bridgeLabel: s.m2.bridgeRepaired ? 'Đã sửa chữa' : 'Dùng tuyến vòng', bridgePlan: s.m2.planCommitted, bridgeRepaired: s.m2.bridgeRepaired,
      simulationSummary: `${getGameMap(s.mapId).name}: 30 người dân mô phỏng (A: 12, B: 10, C: 8)`,
    },
  };
}
