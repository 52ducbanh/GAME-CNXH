import type { GameSnapshot } from './types.js';
import { getProvinceModule } from './gameplay/registry.js';
import { buildMissionGuide } from './gameplay/core/guide.js';
export type { MissionGuide } from './gameplay/core/guide.js';
export function getMissionGuide(s:GameSnapshot,playerId:string){return buildMissionGuide(s,playerId,getProvinceModule(s.mapId).guide);}
