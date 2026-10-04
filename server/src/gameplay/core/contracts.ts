import type { ActiveJob, Citizen, UntrustedIntent, GameSnapshot, HatinhState, NinhBinhState, Mission1State, Mission2State, Mission3State, Player, ServerAck, CollisionState } from 'shared';

/** The wire projections are retained until all separately deployed clients migrate. */
export interface GameplayProjection {
  objectiveProgress?: Record<string, boolean>;
  citizens: Citizen[];
  m1: Mission1State;
  m2: Mission2State;
  m3: Mission3State;
  hatinhState?: HatinhState;
  ninhBinhState?: NinhBinhState;
  quangNinhState?: any;
  haiPhongState?: any;
  thanhHoaState?: any;
  ngheAnState?: any;
}

export interface ProvinceRuntime {
  start(): void;
  reset(): void;
  tick(dtMs: number): void;
  dispatch(player: Player, intent: UntrustedIntent): ServerAck;
  completeTask(player: Player, task: ActiveJob): void;
  commitVote(missionId: 'M1' | 'M2' | null, plan: string): void;
  projection(): GameplayProjection;
  totalScore(): number;
  worldState(): CollisionState;
}
