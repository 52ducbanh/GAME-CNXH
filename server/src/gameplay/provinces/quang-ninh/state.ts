import type { QuangNinhState } from 'shared';

export function createQuangNinhState(): QuangNinhState {
  return {
    currentQuest: 1,
    toRoi: {
      status: 'ACTIVE',
      hoangMet: false,
      fliersPeeled: false,
      digitalGuided: false,
      boardPublished: false,
      score: 0,
    },
    congTruong: {
      status: 'LOCKED',
      siteInspected: false,
      trucksChecked: false,
      waterMonitored: false,
      commitmentSigned: false,
      score: 0,
    },
    thanXuat: {
      status: 'LOCKED',
      depotDiscovered: false,
      bargeInspected: false,
      violationSealed: false,
      bridgeSecured: false,
      score: 0,
    },
  };
}
