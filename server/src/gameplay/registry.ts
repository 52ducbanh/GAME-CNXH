import { HatinhRuntime } from './provinces/ha-tinh/runtime.js';
import type { MapId } from 'shared';
import type { GameplayPorts } from './core/ports.js';
import type { ProvinceRuntime } from './core/contracts.js';
import { PublicServiceRuntime } from './presets/public-service/runtime.js';
type Factory=(ports:GameplayPorts)=>ProvinceRuntime;
// Complete static composition: every room gets its own runtime.
const factories:Record<MapId,Factory>={'ninh-binh':ports=>new PublicServiceRuntime(ports),'hai-phong':ports=>new PublicServiceRuntime(ports),'quang-ninh':ports=>new PublicServiceRuntime(ports),'thanh-hoa':ports=>new PublicServiceRuntime(ports),'nghe-an':ports=>new PublicServiceRuntime(ports),'hanoi':ports=>new PublicServiceRuntime(ports),'ha-tinh':ports=>new HatinhRuntime(ports)};
export function createProvinceRuntime(id:MapId,ports:GameplayPorts):ProvinceRuntime{return factories[id](ports);}
