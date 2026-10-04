export interface NemChuaState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  meetDispute: boolean;
  inspectShopC: boolean;
  collectKit: boolean;
  resolveDispute: boolean;
  score: number; // max 30
}

export interface DuongRayState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  approachScene: boolean;
  subdueGuard: boolean;
  blockEscape: boolean;
  handoverEvidence: boolean;
  score: number; // max 35
}

export interface ValiMuoiToiState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  meetBribe: boolean;
  recordEvidence: boolean;
  triggerAlarm: boolean;
  choice: 'NONE' | 'BRIBE_ACCEPTED' | 'REJECT_ROUGH' | 'RECORD_PROFESSIONAL';
  retryCount: number;
  score: number; // max 35
}

export interface ThanhHoaState {
  currentQuest: 1 | 2 | 3;
  nemChua: NemChuaState;
  duongRay: DuongRayState;
  valiMuoiToi: ValiMuoiToiState;
}

export const THANH_HOA_POIS: Record<string, [number, number]> = {
  TH_ARCH_GATE: [820, 465],
  TH_NEM_B_SHOP: [1465, 580],
  TH_NEM_C_SHOP: [1260, 890],
  TH_SUPPLY_WAREHOUSE: [425, 775],
  TH_RAIL_CORRIDOR: [370, 675],
  TH_RAIL_GUARD: [390, 710],
  TH_BRIDGE_ESCAPE: [450, 720],
  TH_OFFICE_LOBBY: [235, 290],
  TH_BRIEFCASE_TABLE: [245, 330],
  TH_ALARM_BUTTON: [210, 310]
};

export function selectThanhHoaScore(s: ThanhHoaState) {
  return {
    nemChua: s.nemChua.score,
    duongRay: s.duongRay.score,
    valiMuoiToi: s.valiMuoiToi.score,
    total: s.nemChua.score + s.duongRay.score + s.valiMuoiToi.score
  };
}
