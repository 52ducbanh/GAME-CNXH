import { publicServiceModule } from './presets/public-service/module.js';
import { hatinhModule } from './provinces/ha-tinh/module.js';
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
  hanoi:publicServiceModule(hanoi),'ninh-binh':publicServiceModule(ninhBinh),'hai-phong':publicServiceModule(haiPhong),
  'quang-ninh':publicServiceModule(quangNinh),'thanh-hoa':publicServiceModule(thanhHoa),'nghe-an':publicServiceModule(ngheAn),
  'ha-tinh':hatinhModule,
};
export function getProvinceModule(id:MapId){return PROVINCE_MODULES[id];}
export function getProvinceView(s:GameSnapshot,playerId=''){
  const module=getProvinceModule(s.mapId);
  return module.view(s,buildMissionGuide(s,playerId,module.guide));
}
