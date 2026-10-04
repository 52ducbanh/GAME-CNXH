import type { MapId } from 'shared';
import type { GameplayPorts } from './core/ports.js';
import type { ProvinceRuntime } from './core/contracts.js';
import { PublicServiceRuntime } from './presets/public-service/runtime.js';
type Factory=(ports:GameplayPorts)=>ProvinceRuntime;
// Migration-only partial routing; delete the optional fallback after province 7.
const factories:Partial<Record<MapId,Factory>>={'ninh-binh':ports=>new PublicServiceRuntime(ports),'hai-phong':ports=>new PublicServiceRuntime(ports),'quang-ninh':ports=>new PublicServiceRuntime(ports),'thanh-hoa':ports=>new PublicServiceRuntime(ports),'nghe-an':ports=>new PublicServiceRuntime(ports)};
export function createProvinceRuntime(id:MapId,ports:GameplayPorts):ProvinceRuntime|undefined{return factories[id]?.(ports);}
