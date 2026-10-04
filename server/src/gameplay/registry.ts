import { HatinhRuntime } from './provinces/ha-tinh/runtime.js';
import { NinhBinhRuntime } from './provinces/ninh-binh/runtime.js';
import { QuangNinhRuntime } from './provinces/quang-ninh/runtime.js';
import { HaiPhongRuntime } from './provinces/hai-phong/runtime.js';
import { ThanhHoaRuntime } from './provinces/thanh-hoa/runtime.js';
import { NgheAnRuntime } from './provinces/nghe-an/runtime.js';
import type { MapId } from 'shared';
import type { GameplayPorts } from './core/ports.js';
import type { ProvinceRuntime } from './core/contracts.js';
import { PublicServiceRuntime } from './presets/public-service/runtime.js';

type Factory = (ports: GameplayPorts) => ProvinceRuntime;

const publicService: Factory = ports => new PublicServiceRuntime(ports);

const factories: Record<MapId, Factory> = {
  hanoi: publicService,
  'ninh-binh': ports => new NinhBinhRuntime(ports),
  'hai-phong': ports => new HaiPhongRuntime(ports),
  'quang-ninh': ports => new QuangNinhRuntime(ports),
  'thanh-hoa': ports => new ThanhHoaRuntime(ports),
  'nghe-an': ports => new NgheAnRuntime(ports),
  'ha-tinh': ports => new HatinhRuntime(ports),
};

export function createProvinceRuntime(id: MapId, ports: GameplayPorts): ProvinceRuntime {
  return factories[id](ports);
}
