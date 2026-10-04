import type { JobType, M1Plan, M2Plan, PlayerRole } from '../../types.js';
import type { HatinhAction } from '../provinces/ha-tinh/commands.js';
import type { MapId } from '../../worldMaps.js';

type Command<T extends string, P> = { actionId: string; type: T; payload: P };
type EmptyCommand<T extends string> = { actionId: string; type: T; payload?: never };
export type StartTaskType = JobType | 'SURVEY_BRIDGE' | 'RECEIVE_FEEDBACK_C' | 'CROSS_CHECK_CLINIC';

/** Typed callers; the socket boundary still receives unknown data. */
export type GameplayCommand =
  | Command<'MOVE', { x: number; y: number; path?: { x: number; y: number }[]; dir?: 'up' | 'down' | 'left' | 'right' }>
  | Command<'SET_ROLE', { role: PlayerRole }>
  | Command<'START_JOB', { type: StartTaskType; targetId: string }>
  | { actionId: string; type: 'PICK_CRATE'; payload?: { crateId?: string } }
  | Command<'DELIVER_CRATE', { targetId: string }>
  | Command<'PROPOSE_PLAN', { missionId: 'M1'; plan: Exclude<M1Plan, 'NONE'> } | { missionId: 'M2'; plan: Exclude<M2Plan, 'NONE'> }>
  | Command<'CAST_VOTE', { plan: Exclude<M1Plan | M2Plan, 'NONE'> }>
  | Command<'PUBLISH_NOTICE', { missionId: 'M1' | 'M2' | 'M3' }>
  | Command<'PING_LOCATION', { x: number; y: number }>
  | Command<'HATINH_ACTION', { action: HatinhAction }>
  | EmptyCommand<'CANCEL_JOB' | 'DROP_CRATE' | 'RETURN_CRATE' | 'CONFIRM_M3_PLAN'>;

export type ActionIntent = GameplayCommand extends infer C
  ? C extends GameplayCommand ? Omit<C, 'actionId'> : never : never;

export type ProvinceCommand<P extends MapId> = P extends 'ha-tinh' ? GameplayCommand
  : Exclude<GameplayCommand, { type: 'HATINH_ACTION' }>;

export interface UntrustedIntent { actionId: string; type: string; payload?: unknown }
export function readPayload(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? value as Record<string, unknown> : undefined;
}
export function readString(value: unknown): string | undefined { return typeof value === 'string' ? value : undefined; }
export function readIntentEnvelope(value: unknown): UntrustedIntent | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  return typeof v.actionId === 'string' && typeof v.type === 'string'
    ? { actionId: v.actionId, type: v.type, payload: v.payload } : null;
}
