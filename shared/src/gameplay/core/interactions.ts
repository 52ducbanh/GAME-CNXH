import type { ActionIntent, StartTaskType } from './commands.js';
import type { ClientIntent, GameSnapshot } from '../../types.js';
import { INTERACTION_RADIUS } from '../../constants.js';
import { getGameMap } from '../../worldMaps.js';
import { getProvincePoiCoordinates } from '../registry.js';
export type InteractionType = 'NPC' | 'ITEM' | 'DEVICE' | 'OBJECTIVE' | 'CARRYABLE' | 'GENERIC';
export interface InteractionAction {
  id: string;
  targetId: string;
  label: string;
  description?: string;
  type: InteractionType;
  x: number;
  y: number;
  range: number;
  priority: number;
  available: boolean;
  serverValidation: true;
  intent: ActionIntent;
}
export interface InteractionContext { primary: InteractionAction | null; secondary: InteractionAction | null; choices: InteractionAction[] }

// One catalogue for prompts, drawer choices and server eligibility. Only available
// actions are returned; snapshots never replace authoritative validation on arrival.
export interface CatalogueContext {
  s: GameSnapshot; playerId: string; actions: InteractionAction[];
  add(targetId: string, label: string, intent: InteractionAction['intent'], priority?: number, type?: InteractionType, point?: {x:number;y:number;name?:string}): void;
  job(targetId:string,type:StartTaskType,label:string,manpower?:boolean):void;
  deliver(targetId:string):void;
}
export function buildInteractionCatalogue(s: GameSnapshot, playerId: string, append: (context: CatalogueContext) => void, describe: (intent: InteractionAction['intent']) => string | undefined): InteractionAction[] {
  const p = s.players[playerId], map = getGameMap(s.mapId), actions: InteractionAction[] = [];
  if (!p?.isOnline || p.roomCode !== s.roomCode || s.isPaused) return actions;
  const add = (targetId: string, label: string, intent: InteractionAction['intent'], priority = 80, type: InteractionType = 'OBJECTIVE', point: {x:number;y:number;name?:string} | undefined = map.points[targetId]) => {
    let resolvedPoint = point;
    if (!resolvedPoint) {
      const coords = getProvincePoiCoordinates(s.mapId, targetId);
      if (coords) resolvedPoint = { x: coords[0], y: coords[1], name: targetId };
    }
    if (!resolvedPoint) return;
    actions.push({ id: `${targetId}:${intent.type}:${JSON.stringify(intent.payload ?? {})}`, targetId, label, intent, priority, type: targetId.startsWith('ZONE_') || targetId.startsWith('CITIZEN_') ? 'NPC' : type,
      description: describe(intent),
      x: resolvedPoint.x, y: resolvedPoint.y, range: INTERACTION_RADIUS, available: true, serverValidation: true });
  };
  const job = (target: string, type: StartTaskType, label: string, manpower = false) => {
    if (manpower && s.manpower.busy >= s.manpower.total) return;
    if (Object.values(s.players).some(peer => peer.activeJob?.type === type && peer.activeJob.targetId === target)) return;
    add(target, label, { type: 'START_JOB', payload: { type, targetId: target } });
  };
  const carry = p.carriedCrateId && s.crates[p.carriedCrateId];
  const ownsCarry = !!carry && carry.state === 'CARRIED' && carry.carriedByPlayerId === p.id;
  const deliver = (target: string) => { if (ownsCarry) add(target, 'Giao vật tư', { type: 'DELIVER_CRATE', payload: { targetId: target } }, 100, 'CARRYABLE'); };
  if (p.activeJob) return actions;
  if (ownsCarry) add('WAREHOUSE', 'Trả vật tư về kho', { type: 'RETURN_CRATE' }, 90, 'CARRYABLE');
  else if (!p.carriedCrateId) {
    if (s.resources.availableCrates > 0 && Object.values(s.crates).some(c => c.state === 'WAREHOUSE')) add('WAREHOUSE', 'Lấy vật tư', { type: 'PICK_CRATE' }, 60, 'ITEM');
    for (const c of Object.values(s.crates)) if (c.state === 'DROPPED' && !c.carriedByPlayerId)
      add(c.id, 'Nhặt vật tư', { type: 'PICK_CRATE', payload: { crateId: c.id } }, 90, 'ITEM', { ...map.points.WAREHOUSE, x: c.x, y: c.y });
  }
  if (s.phase === 'PRACTICE') {
    if (!s.practiceCrateDelivered) deliver('PRACTICE_TARGET');
    else if (!s.practiceCompleted) job('PRACTICE_TARGET', 'PRACTICE_SAMPLE_JOB', 'Thực hành thao tác');
    return actions;
  }
  if (s.phase !== 'RUNNING') return actions;
  append({s,playerId,actions,add,job,deliver});
  return actions;
}
