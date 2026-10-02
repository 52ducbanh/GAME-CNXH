export const WORLD_WIDTH = 1280;
export const WORLD_HEIGHT = 960;

export const PLAYER_SPEED = 180; // world units / sec
export const INTERACTION_RADIUS = 72; // world units

export const MATCH_DURATION_MS = 600 * 1000; // 600s (10 phút)
export const BRIEFING_DURATION_MS = 60 * 1000; // 60s
export const PRACTICE_DURATION_MS = 60 * 1000; // 60s
export const VOTE_DURATION_MS = 15 * 1000; // 15s
export const CLAIM_RESERVATION_MS = 20 * 1000; // 20s
export const DISCONNECT_GRACE_MS = 10 * 1000; // 10s

// Job Durations (ms)
export const JOB_DURATION = {
  SURVEY: 4000,
  PICK_CRATE: 1000,
  DELIVER_CRATE: 1000,
  DEPLOY_FIXED: 8000,
  DEPLOY_MOBILE: 6000,
  REPAIR_BRIDGE: 8000, // each task (2 tasks)
  SUPPORT_CITIZEN: 5000, // C1, C2 each
  AUDIT_RESULT: 4000,
  AUDIT_LEDGER: 4000,
  PRACTICE_SAMPLE: 3000
};

// Seed resources
export const INITIAL_BUDGET = 100;
export const INITIAL_CRATES = 12;
export const TOTAL_MANPOWER_UNITS = 3;

// Plan Costs
export const PLAN_COSTS = {
  M1_FIXED: {
    budget: 40,
    crates: 2,
    deployTimeMs: JOB_DURATION.DEPLOY_FIXED
  },
  M1_MOBILE: {
    budget: 30,
    crates: 4, // 2 at B, 2 at C
    deployTimeMs: JOB_DURATION.DEPLOY_MOBILE
  },
  M2_REPAIR: {
    budget: 25,
    crates: 4 // 2 for bridge repair + 2 for B relief
  },
  M2_DETOUR: {
    budget: 10,
    crates: 2 // 2 for B relief via detour
  },
  M3_CONFIRM: {
    budget: 20,
    crates: 2 // 1 for C1, 1 for C2
  }
};

// Scores
export const SCORES = {
  M1: {
    SURVEY_PER_ZONE: 2, // 3 zones -> 6
    DEPLOY_TOTAL: 10,   // Fixed: 10, Mobile: 5 each (2 sites)
    VERIFY_TOTAL: 8,    // Fixed: 8, Mobile: 4 each (2 sites)
    PUBLISH_NOTICE: 6,
    MAX: 30
  },
  M2: {
    SURVEY: 5,
    COMMIT_PLAN: 5,
    DELIVER_RELIEF_PER_CRATE: 8, // 2 crates -> 16
    VERIFY_DELIVERY: 4,
    PUBLISH_NOTICE: 5,
    MAX: 35
  },
  M3: {
    RECEIVE_FEEDBACK: 5,
    CROSS_CHECK_CLINIC: 5,
    SUPPORT_PER_CITIZEN: 7, // C1 (7) + C2 (7) -> 14
    AUDIT_LEDGER_RUMOR: 5,
    PUBLISH_NOTICE: 6,
    MAX: 35
  },
  TOTAL_MAX: 100
};

// Citizen initial counts
export const INITIAL_CITIZENS = {
  ZONE_A: 12,
  ZONE_B: 10,
  ZONE_C: 8 // includes C1, C2
};
