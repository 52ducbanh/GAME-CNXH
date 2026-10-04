import type { NgheAnState } from 'shared';

export function createNgheAnState(): NgheAnState {
  return {
    currentQuest: 1,
    chaoLuon: {
      status: 'ACTIVE',
      meetHoa: false,
      meetTuan: false,
      measureBoundary: false,
      signCommitment: false,
      score: 0,
    },
    luaDaoDat: {
      status: 'LOCKED',
      interviewVictim: false,
      askMarket: false,
      blockShortcut: false,
      captureSuspect: false,
      score: 0,
    },
    quyKhuyenHoc: {
      status: 'LOCKED',
      calmCrowd: false,
      inspectCabinet: false,
      inspectWindow: false,
      interrogate: false,
      solveCase: false,
      score: 0,
    },
  };
}
