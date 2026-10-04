export interface FoodtourState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  hoaMet: boolean;
  sidewalkSetup: boolean;
  parkingOrganized: boolean;
  pricesPosted: boolean;
  score: number; // max 30
}

export interface CheLoState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  furnaceInspected: boolean;
  sampleTaken: boolean;
  filterChecked: boolean;
  dossierSigned: boolean;
  score: number; // max 35
}

export interface DoSonState {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  residentsMet: boolean;
  planningPosted: boolean;
  compensationResolved: boolean;
  excavatorSecured: boolean;
  score: number; // max 35
}

export interface HaiPhongState {
  currentQuest: 1 | 2 | 3;
  foodtour: FoodtourState;
  cheLo: CheLoState;
  doSon: DoSonState;
}

export const HAI_PHONG_POIS: Record<string, [number, number]> = {
  HP_HOA_CRAB_NOODLE: [345, 370],
  HP_SIDEWALK_BARRIER: [420, 530],
  HP_PARKING_ZONE: [520, 315],
  HP_PRICE_LIST: [455, 280],
  HP_CHE_LO_FURNACE: [1200, 900],
  HP_SAMPLE_POINT: [1070, 755],
  HP_FILTER_INSPECTION: [1280, 855],
  HP_DOSSIER_STATION: [1080, 890],
  HP_DO_SON_RESIDENTS: [300, 735],
  HP_PLANNING_BOARD: [170, 275],
  HP_COMPENSATION_DESK: [180, 760],
  HP_EXCAVATOR_SITE: [370, 650]
};

export function selectHaiPhongScore(s: HaiPhongState) {
  return {
    foodtour: s.foodtour.score,
    cheLo: s.cheLo.score,
    doSon: s.doSon.score,
    total: s.foodtour.score + s.cheLo.score + s.doSon.score
  };
}
