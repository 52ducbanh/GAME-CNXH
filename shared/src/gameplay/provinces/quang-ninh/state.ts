export interface ToRoiState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  hoangMet: boolean;
  fliersPeeled: boolean;
  digitalGuided: boolean;
  boardPublished: boolean;
  score: number; // max 30
}

export interface CongTruongState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  siteInspected: boolean;
  trucksChecked: boolean;
  waterMonitored: boolean;
  commitmentSigned: boolean;
  score: number; // max 35
}

export interface ThanXuatState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  depotDiscovered: boolean;
  bargeInspected: boolean;
  violationSealed: boolean;
  bridgeSecured: boolean;
  score: number; // max 35
}

export interface QuangNinhState {
  currentQuest: 1 | 2 | 3;
  toRoi: ToRoiState;
  congTruong: CongTruongState;
  thanXuat: ThanXuatState;
}

export const QUANG_NINH_POIS: Record<string, [number, number]> = {
  QN_ALLEY_POST: [420, 340],
  QN_FLIER_WALL: [290, 570],
  QN_CITIZEN_HOANG: [395, 325],
  QN_PUBLIC_BOARD: [205, 305],
  QN_CONSTRUCTION_SITE: [495, 570],
  QN_WAREHOUSE_SITE: [170, 800],
  QN_TRUCK_CHECK: [600, 570],
  QN_ENVIRONMENT_OFFICE: [690, 610],
  QN_HIDDEN_DEPOT: [955, 900],
  QN_BARGE_DOCK: [1120, 900],
  QN_SEAL_STATION: [1240, 915],
  QN_BRIDGE_CHECKPOINT: [840, 612]
};

export function selectQuangNinhScore(s: QuangNinhState) {
  return {
    toRoi: s.toRoi.score,
    congTruong: s.congTruong.score,
    thanXuat: s.thanXuat.score,
    total: s.toRoi.score + s.congTruong.score + s.thanXuat.score
  };
}
