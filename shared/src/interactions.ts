import type { GameSnapshot } from './types.js';
import { buildInteractionCatalogue } from './gameplay/core/interactions.js';
import type { InteractionAction, InteractionContext } from './gameplay/core/interactions.js';
import { getProvinceModule } from './gameplay/registry.js';
export type { InteractionAction, InteractionContext, InteractionType } from './gameplay/core/interactions.js';
export function getInteractionActions(s:GameSnapshot,playerId:string):InteractionAction[]{
  const module=getProvinceModule(s.mapId);
  return buildInteractionCatalogue(s,playerId,module.interactions,module.describeAction);
}
export function resolveInteraction(s: GameSnapshot, playerId: string, position: {x:number;y:number} = s.players[playerId], previousId?: string): InteractionContext {
  const p = s.players[playerId];
  if (!p?.isOnline || !position || s.isPaused) return { primary: null, secondary: null, choices: [] };
  const distance = (a: InteractionAction) => Math.hypot(position.x - a.x, position.y - a.y);
  const nearby = getInteractionActions(s, playerId).filter(a => distance(a) <= a.range && Math.hypot(p.x - a.x, p.y - a.y) <= a.range);
  nearby.sort((a, b) => b.priority - a.priority || distance(a) - distance(b) || a.id.localeCompare(b.id));
  let primary = nearby[0] ?? null;
  const previous = nearby.find(a => a.id === previousId);
  if (previous && primary && previous.priority === primary.priority && distance(previous) <= distance(primary) + 12) primary = previous;
  const choices = primary ? nearby.filter(a => a.targetId === primary.targetId && a.intent.type === 'PROPOSE_PLAN') : [];
  const carried = p.carriedCrateId && s.crates[p.carriedCrateId];
  const intent: InteractionAction['intent'] = p.activeJob ? { type: 'CANCEL_JOB' }
    : carried && carried.state === 'CARRIED' && carried.carriedByPlayerId === p.id ? { type: 'DROP_CRATE' }
    : { type: 'PING_LOCATION', payload: { x: p.x, y: p.y } };
  const secondary: InteractionAction = { id: `secondary:${intent.type}`, targetId: p.id, label: p.activeJob ? 'Hủy công việc' : intent.type === 'DROP_CRATE' ? 'Đặt vật tư' : 'Báo hiệu',
    type: 'GENERIC', x: p.x, y: p.y, range: 0, priority: 0, available: true, serverValidation: true, intent };
  return { primary, secondary, choices };
}
