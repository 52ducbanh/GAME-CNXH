import { publicServiceModule } from './presets/public-service/module.js';
import { hatinhModule } from './provinces/ha-tinh/module.js';
import { ninhBinhModule } from './provinces/ninh-binh/module.js';
import { quangNinhModule } from './provinces/quang-ninh/module.js';
import { haiPhongModule } from './provinces/hai-phong/module.js';
import { thanhHoaModule } from './provinces/thanh-hoa/module.js';
import { ngheAnModule } from './provinces/nghe-an/module.js';
import { buildMissionGuide } from './core/guide.js';
import type { GameSnapshot } from '../types.js';
import type { MapId } from '../worldMaps.js';
import type { ProvinceDefinition } from './core/contracts.js';
import { hanoi } from './provinces/hanoi/definition.js';
import { ninhBinh } from './provinces/ninh-binh/definition.js';
import { haiPhong } from './provinces/hai-phong/definition.js';
import { quangNinh } from './provinces/quang-ninh/definition.js';
import { thanhHoa } from './provinces/thanh-hoa/definition.js';
import { ngheAn } from './provinces/nghe-an/definition.js';
import { haTinh } from './provinces/ha-tinh/definition.js';

export const PROVINCES: Readonly<Record<MapId, ProvinceDefinition>> = {
  hanoi, 'ninh-binh': ninhBinh, 'hai-phong': haiPhong, 'quang-ninh': quangNinh,
  'thanh-hoa': thanhHoa, 'nghe-an': ngheAn, 'ha-tinh': haTinh,
};
export function getProvinceDefinition(id: MapId): ProvinceDefinition { return PROVINCES[id]; }

export const PROVINCE_MODULES = {
  hanoi: publicServiceModule(hanoi),
  'ninh-binh': ninhBinhModule,
  'hai-phong': haiPhongModule,
  'quang-ninh': quangNinhModule,
  'thanh-hoa': thanhHoaModule,
  'nghe-an': ngheAnModule,
  'ha-tinh': hatinhModule,
};
export function getProvinceModule(id: MapId) { return PROVINCE_MODULES[id]; }
export function getProvinceWorldState(s: GameSnapshot) { return getProvinceModule(s.mapId).worldState(s); }
export function getProvinceView(s: GameSnapshot, playerId = '') {
  const module = getProvinceModule(s.mapId);
  return module.view(s, buildMissionGuide(s, playerId, module.guide));
}

import { NINH_BINH_POIS } from './provinces/ninh-binh/state.js';
import { QUANG_NINH_POIS } from './provinces/quang-ninh/state.js';
import { HAI_PHONG_POIS } from './provinces/hai-phong/state.js';
import { THANH_HOA_POIS } from './provinces/thanh-hoa/state.js';
import { NGHE_AN_POIS } from './provinces/nghe-an/state.js';

export function getProvincePoiCoordinates(mapId: MapId, poiId: string): [number, number] | undefined {
  if (mapId === 'ninh-binh') return NINH_BINH_POIS[poiId];
  if (mapId === 'quang-ninh') return QUANG_NINH_POIS[poiId];
  if (mapId === 'hai-phong') return HAI_PHONG_POIS[poiId];
  if (mapId === 'thanh-hoa') return THANH_HOA_POIS[poiId];
  if (mapId === 'nghe-an') return NGHE_AN_POIS[poiId];
  return undefined;
}
