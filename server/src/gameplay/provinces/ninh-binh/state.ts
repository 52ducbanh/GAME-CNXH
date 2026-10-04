import type { NinhBinhState } from 'shared';

export function createNinhBinhState(): NinhBinhState {
  return {
    currentQuest: 1,
    baiDinh: {
      status: 'ACTIVE',
      bqlMet: false,
      boxInspected: false,
      livestreamResolved: false,
      rulesPublished: false,
      score: 0,
    },
    cucPhuong: {
      status: 'LOCKED',
      isNight: false,
      patrolStarted: false,
      trapDisarmed: false,
      animalRescued: false,
      timberSecured: false,
      score: 0,
    },
    tamCoc: {
      status: 'LOCKED',
      boatmanMet: false,
      pricesPosted: false,
      lifejacketsEquipped: false,
      boatsDispatched: false,
      score: 0,
    },
  };
}
