export interface BaiDinhState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  bqlMet: boolean;
  boxInspected: boolean;
  livestreamResolved: boolean;
  rulesPublished: boolean;
  score: number; // max 30
}

export interface CucPhuongState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  isNight: boolean;
  patrolStarted: boolean;
  trapDisarmed: boolean;
  animalRescued: boolean;
  timberSecured: boolean;
  score: number; // max 30
}

export interface TamCocState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  boatmanMet: boolean;
  pricesPosted: boolean;
  lifejacketsEquipped: boolean;
  boatsDispatched: boolean;
  score: number; // max 30
}

export interface NinhBinhState {
  currentQuest: 1 | 2 | 3;
  baiDinh: BaiDinhState;
  cucPhuong: CucPhuongState;
  tamCoc: TamCocState;
}

export const NINH_BINH_POIS: Record<string, [number, number]> = {
  NB_BQL_CHU: [685, 295],
  NB_BAI_DINH_GATE: [555, 570],
  NB_LIVESTREAM_GROUP: [710, 745],
  NB_RULE_BOARD: [410, 290],
  NB_RANGERS_POST: [1518, 587],
  NB_ANIMAL_TRAP: [1450, 575],
  NB_WILDLIFE_RELEASE: [1615, 640],
  NB_TIMBER_ZONE: [1550, 635],
  NB_BOATMAN_REP: [770, 830],
  NB_TICKET_BOARD: [885, 780],
  NB_LIFEJACKET_STATION: [960, 892],
  NB_DISPATCH_POST: [1000, 751]
};

export function selectNinhBinhScore(s: NinhBinhState) {
  return {
    baiDinh: s.baiDinh.score,
    cucPhuong: s.cucPhuong.score,
    tamCoc: s.tamCoc.score,
    total: s.baiDinh.score + s.cucPhuong.score + s.tamCoc.score
  };
}
