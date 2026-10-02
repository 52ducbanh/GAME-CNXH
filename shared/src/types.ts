export type RoomPhase = 'LOBBY' | 'BRIEFING' | 'PRACTICE' | 'RUNNING' | 'RESULTS';

export type PlayerRole = 
  | 'SURVEY'     // Tiếp nhận nhu cầu
  | 'PLANNER'    // Lập phương án
  | 'LOGISTICS'  // Tổ chức thực hiện
  | 'AUDIT'      // Giám sát
  | 'RIGHTS';    // Bảo vệ quyền

export interface Player {
  id: string;
  name: string;
  roomCode: string;
  color: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  role: PlayerRole;
  carriedCrateId: string | null;
  activeJob: ActiveJob | null;
  isOnline: boolean;
  lastHeartbeat: number;
  isHost: boolean;
  disconnectedAt?: number;
}

export type JobType = 
  | 'SURVEY_ZONE'
  | 'DEPLOY_FIXED_CLINIC'
  | 'DEPLOY_MOBILE_CLINIC'
  | 'REPAIR_BRIDGE_1'
  | 'REPAIR_BRIDGE_2'
  | 'SUPPORT_CITIZEN'
  | 'AUDIT_RESULT'
  | 'AUDIT_LEDGER'
  | 'PRACTICE_SAMPLE_JOB';

export interface ActiveJob {
  jobId: string;
  type: JobType;
  targetId: string;
  progress: number;       // 0 to 1
  elapsedMs: number;
  durationMs: number;
  startedAt: number;
  requiresManpower: boolean;
}

export type CrateState = 'WAREHOUSE' | 'CARRIED' | 'DROPPED' | 'DELIVERED' | 'CONSUMED';

export interface Crate {
  id: string;
  state: CrateState;
  x: number;
  y: number;
  carriedByPlayerId: string | null;
  missionContext: 'M1' | 'M2' | 'M3' | 'PRACTICE';
  purpose: string;
  deliveredSlotId: string | null;
}

export interface Citizen {
  id: string; // e.g. A1..A12, B1..B10, C1..C8
  name: string;
  zone: 'A' | 'B' | 'C';
  isSpecialNeeds?: boolean; // C1 and C2
  served: boolean;
  servedByMission?: 'M1' | 'M2' | 'M3';
}

export interface LedgerEntry {
  id: string;
  timestamp: number;
  missionId: 'M1' | 'M2' | 'M3' | 'INIT';
  description: string;
  amount: number; // positive = deduction
  balanceAfter: number;
}

export interface ResourceLedger {
  initialBudget: number;
  currentBudget: number;
  totalCrates: number;
  availableCrates: number;
  entries: LedgerEntry[];
  version: number;
}

export interface ManpowerPool {
  total: number; // default 3
  busy: number;
}

export type M1Plan = 'NONE' | 'FIXED' | 'MOBILE';
export type M2Plan = 'NONE' | 'REPAIR' | 'DETOUR';

export interface Mission1State {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  surveys: {
    A: boolean;
    B: boolean;
    C: boolean;
  };
  surveyAssignedTo: {
    A?: string;
    B?: string;
    C?: string;
  };
  planProposed: M1Plan;
  planCommitted: M1Plan;
  planVersion: number;
  requiredCrates: number;
  deliveredCratesFixed: number;
  deliveredCratesMobileB: number;
  deliveredCratesMobileC: number;
  fixedDeployed: boolean;
  mobileBDeployed: boolean;
  mobileCDeployed: boolean;
  verifiedA: boolean;
  verifiedB: boolean;
  verifiedC: boolean;
  noticePublished: boolean;
  score: number; // max 30
}

export interface Mission2State {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  bridgeBroken: boolean;
  bridgeRepaired: boolean;
  surveyDone: boolean;
  planProposed: M2Plan;
  planCommitted: M2Plan;
  planVersion: number;
  bridgeCratesDelivered: number; // needs 2 for repair
  bridgeRepairTask1: boolean;
  bridgeRepairTask2: boolean;
  reliefCratesDeliveredB: number; // needs 2
  verifiedB: boolean;
  noticePublished: boolean;
  score: number; // max 35
}

export interface Mission3State {
  status: 'LOCKED' | 'ACTIVE' | 'RESOLVED';
  receivedFeedbackC: boolean;
  crossCheckedList: boolean;
  planConfirmed: boolean;
  deliveredC1: boolean;
  deployedC1: boolean;
  deliveredC2: boolean;
  deployedC2: boolean;
  lossAuditDone: boolean;
  lossAuditConclusion: string;
  noticePublished: boolean;
  score: number; // max 35
}

export interface VoteState {
  active: boolean;
  missionId: 'M1' | 'M2' | null;
  proposedPlan: string;
  proposerId: string;
  proposerName: string;
  remainingMs: number;
  endsAt: number;
  totalOnlineVoters: number;
  votes: Record<string, string>; // playerId -> plan choice
}

export interface AuditEvent {
  id: string;
  timestamp: number;
  playerId?: string;
  playerName?: string;
  category: 'MISSION' | 'PLAN' | 'RESOURCE' | 'VOTE' | 'SERVICE' | 'PLAYER' | 'AUDIT';
  message: string;
}

export interface PersonalContribution {
  playerId: string;
  playerName: string;
  surveys: number;
  deliveries: number;
  deployments: number;
  audits: number;
  plansProposed: number;
  votesParticipated: number;
}

export interface GameSnapshot {
  roomCode: string;
  phase: RoomPhase;
  phaseTimerRemainingMs: number;
  isPaused: boolean;
  totalRunningTimeMs: number;
  players: Record<string, Player>;
  crates: Record<string, Crate>;
  manpower: ManpowerPool;
  resources: ResourceLedger;
  citizens: Citizen[];
  citizensServedCount: number;
  totalCitizensCount: number;
  m1: Mission1State;
  m2: Mission2State;
  m3: Mission3State;
  voting: VoteState | null;
  totalScore: number;
  recentAuditEvents: AuditEvent[];
  practiceCompleted: boolean;
  practiceCrateDelivered: boolean;
  ruleVersion: number;
}

export interface ClientIntent {
  actionId: string;
  type: 
    | 'MOVE'
    | 'SET_ROLE'
    | 'START_JOB'
    | 'CANCEL_JOB'
    | 'PICK_CRATE'
    | 'DROP_CRATE'
    | 'DELIVER_CRATE'
    | 'RETURN_CRATE'
    | 'PROPOSE_PLAN'
    | 'CAST_VOTE'
    | 'PUBLISH_NOTICE'
    | 'CONFIRM_M3_PLAN'
    | 'HOST_COMMAND';
  payload?: any;
}

export interface ServerAck {
  actionId: string;
  success: boolean;
  reason?: string;
}

export interface HostCommandPayload {
  action: 'START' | 'SKIP_BRIEFING' | 'SKIP_PRACTICE' | 'PAUSE' | 'RESUME' | 'ADD_60S' | 'END' | 'RESET';
}
