import { HatinhRuntime } from './provinces/ha-tinh/runtime.js';
import type { MapId } from 'shared';
import type { GameplayPorts } from './core/ports.js';
import type { ProvinceRuntime } from './core/contracts.js';
import { PublicServiceRuntime } from './presets/public-service/runtime.js';
type Factory = (ports: GameplayPorts) => ProvinceRuntime;
// Complete static composition: every room gets its own runtime.
const publicService: Factory = ports => new PublicServiceRuntime(ports);
const factories: Record<MapId, Factory> = {
  hanoi: publicService,
  'ninh-binh': publicService,
  'hai-phong': publicService,
  'quang-ninh': publicService,
  'thanh-hoa': publicService,
  'nghe-an': publicService,
  'ha-tinh': ports => new HatinhRuntime(ports),
};
export function createProvinceRuntime(id: MapId, ports: GameplayPorts): ProvinceRuntime {
  return factories[id](ports);
}
