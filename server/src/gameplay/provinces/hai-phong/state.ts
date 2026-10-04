import type { HaiPhongState } from 'shared';

export function createHaiPhongState(): HaiPhongState {
  return {
    currentQuest: 1,
    foodtour: {
      status: 'ACTIVE',
      hoaMet: false,
      sidewalkSetup: false,
      parkingOrganized: false,
      pricesPosted: false,
      score: 0,
    },
    cheLo: {
      status: 'LOCKED',
      furnaceInspected: false,
      sampleTaken: false,
      filterChecked: false,
      dossierSigned: false,
      score: 0,
    },
    doSon: {
      status: 'LOCKED',
      residentsMet: false,
      planningPosted: false,
      compensationResolved: false,
      excavatorSecured: false,
      score: 0,
    },
  };
}
