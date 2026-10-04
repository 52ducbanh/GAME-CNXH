import type { ActiveJob, Citizen, ClientIntent, GameSnapshot, HatinhState, Mission1State, Mission2State, Mission3State, Player, ServerAck, CollisionState } from 'shared';

/** The wire projections are retained until all separately deployed clients migrate. */
export interface GameplayProjection {
  citizens: Citizen[];
  m1: Mission1State;
  m2: Mission2State;
  m3: Mission3State;
  hatinhState?: HatinhState;
}

export interface ProvinceRuntime {
  start(): void;
  reset(): void;
  tick(dtMs: number): void;
  dispatch(player: Player, intent: ClientIntent): ServerAck;
  completeTask(player: Player, task: ActiveJob): void;
  commitVote(missionId: 'M1' | 'M2' | null, plan: string): void;
  projection(): GameplayProjection;
  totalScore(): number;
  worldState(): CollisionState;
}
