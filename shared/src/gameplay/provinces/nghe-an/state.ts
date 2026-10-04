export interface ChaoLuonState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  meetHoa: boolean;
  meetTuan: boolean;
  measureBoundary: boolean;
  signCommitment: boolean;
  score: number; // max 20
}

export interface LuaDaoDatState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  interviewVictim: boolean;
  askMarket: boolean;
  blockShortcut: boolean;
  captureSuspect: boolean;
  score: number; // max 25
}

export interface QuyKhuyenHocState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  calmCrowd: boolean;
  inspectCabinet: boolean;
  inspectWindow: boolean;
  interrogate: boolean;
  solveCase: boolean;
  score: number; // max 30
}

export interface NgheAnState {
  currentQuest: 1 | 2 | 3;
  chaoLuon: ChaoLuonState;
  luaDaoDat: LuaDaoDatState;
  quyKhuyenHoc: QuyKhuyenHocState;
}

export const NGHE_AN_POIS: Record<string, [number, number]> = {
  NA_CH_HOA_SHOP: [650, 800],
  NA_CH_TUAN_SHOP: [690, 850],
  NA_CH_SIDEWALK: [665, 875],
  NA_CULTURE_HOUSE: [885, 470],
  NA_MARKET_ALLEY: [750, 440],
  NA_SHORTCUT_BLOCK: [800, 440],
  NA_DEAD_END: [910, 440],
  NA_CABINET_EVIDENCE: [880, 475],
  NA_WINDOW_EVIDENCE: [920, 460],
  NA_SUSPECTS_LINEUP: [860, 470]
};

export function selectNgheAnScore(s: NgheAnState) {
  return {
    chaoLuon: s.chaoLuon.score,
    luaDaoDat: s.luaDaoDat.score,
    quyKhuyenHoc: s.quyKhuyenHoc.score,
    total: s.chaoLuon.score + s.luaDaoDat.score + s.quyKhuyenHoc.score
  };
}
