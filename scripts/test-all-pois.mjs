import { isWalkableForMap } from '../shared/dist/index.js';

const allProvinces = {
  'quang-ninh': {
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
  },
  'hai-phong': {
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
  },
  'thanh-hoa': {
    TH_HO_CITADEL_GATE: [670, 520],
    TH_NEM_FACILITY_B: [1410, 645],
    TH_NEM_FACILITY_C: [1155, 850],
    TH_TRACEABILITY_DESK: [1150, 545],
    TH_RAIL_CORRIDOR: [370, 670],
    TH_TRACK_INSPECTOR: [280, 546],
    TH_BOLT_REPAIR: [180, 790],
    TH_SCRAP_YARD: [510, 780],
    TH_HQ_OFFICE: [190, 305],
    TH_BRIBERY_DOSSIER: [410, 315],
    TH_EVIDENCE_SAFE: [460, 335],
    TH_INSPECTION_DESK: [535, 370]
  },
  'nghe-an': {
    NA_EEL_SHOP_1: [650, 900],
    NA_EEL_SHOP_2: [760, 873],
    NA_PEDESTRIAN_LANE: [870, 890],
    NA_COMMITMENT_DESK: [1030, 885],
    NA_COMMUNITY_HOUSE_LOBBY: [760, 620],
    NA_ME_BAY: [465, 300],
    NA_MARKET_ALLEY: [650, 450],
    NA_NHUT_SELLER: [970, 660],
    NA_PEDICAB_DRIVER: [1205, 680],
    NA_DEAD_END_ALLEY: [1510, 405],
    NA_DESK_DRAWER: [590, 290],
    NA_WINDOW_SILL: [650, 235],
    NA_SUSPECT_TEO: [920, 230],
    NA_SUSPECT_HUNG: [1130, 230],
    NA_SUSPECT_DUNG: [1190, 280],
    NA_VERDICT_DESK: [420, 340]
  }
};

let allOk = true;
for (const [prov, pts] of Object.entries(allProvinces)) {
  console.log(`\n--- ${prov} ---`);
  for (const [name, [x, y]] of Object.entries(pts)) {
    const ok = isWalkableForMap(prov, x, y);
    if (!ok) {
      console.log(`FAIL: ${name} [${x}, ${y}]`);
      allOk = false;
    } else {
      console.log(`OK: ${name}`);
    }
  }
}
console.log('\nAll points check:', allOk ? 'PASSED 100%' : 'SOME BLOCKED');
