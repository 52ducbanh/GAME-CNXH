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
