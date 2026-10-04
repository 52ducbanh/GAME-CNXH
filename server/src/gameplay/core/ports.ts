import type { ActiveJob, AuditEvent, ClientIntent, Crate, GameSnapshot, ManpowerPool, PersonalContribution, Player, ResourceLedger, RoomPhase, ServerAck, WorldMap } from 'shared';

export interface TaskSpec {
  type: ActiveJob['type']; targetId: string; durationMs: number; requiresManpower: boolean;
}
export interface GameplayPorts {
  read: { map: WorldMap; phase(): RoomPhase; paused(): boolean; snapshot(): GameSnapshot };
  team: {
    contribution(playerId: string): PersonalContribution | undefined;
    onlineCount(): number;
    audit(category: AuditEvent['category'], message: string, playerId?: string): void;
  };
  tasks: { manpower: ManpowerPool; start(player: Player, spec: TaskSpec, actionId: string): ServerAck };
  items: { get(crateId: string): Crate | undefined };
  resources: { ledger: ResourceLedger; deduct(missionId: 'M1' | 'M2' | 'M3', description: string, amount: number): void };
  votes: { active(): boolean; start(missionId: 'M1' | 'M2', plan: string, proposer: Player): void };
  lifecycle: { end(reason: string): void; recoverWorld(reason: (player: Player) => string): void };
  practice: { complete(player: Player): void; deliver(player: Player): void };
}
