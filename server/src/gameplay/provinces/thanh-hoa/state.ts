import type { ThanhHoaState } from 'shared';

export function createThanhHoaState(): ThanhHoaState {
  return {
    currentQuest: 1,
    nemChua: {
      status: 'ACTIVE',
      meetDispute: false,
      inspectShopC: false,
      collectKit: false,
      resolveDispute: false,
      score: 0,
    },
    duongRay: {
      status: 'LOCKED',
      approachScene: false,
      subdueGuard: false,
      blockEscape: false,
      handoverEvidence: false,
      score: 0,
    },
    valiMuoiToi: {
      status: 'LOCKED',
      meetBribe: false,
      recordEvidence: false,
      triggerAlarm: false,
      choice: 'NONE',
      retryCount: 0,
      score: 0,
    },
  };
}
