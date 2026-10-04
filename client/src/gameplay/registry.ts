import type Phaser from 'phaser';
import type { MapId, WorldMap } from 'shared';
import { preloadHanoi } from '../game/hanoiAssets.js';
import { drawHanoi } from './provinces/hanoi/presentation.js';
import { preloadRegion, drawRegion } from './core/regionalRenderer.js';

interface ProvincePresentation {
  preload(scene: Phaser.Scene, map: WorldMap): void;
  draw(scene: Phaser.Scene, map: WorldMap): Pick<ReturnType<typeof drawHanoi>, 'practiceLabel' | 'updateState' | 'updateOcclusion'>;
}
const regional: ProvincePresentation = { preload: preloadRegion, draw: drawRegion };
const presentations: Record<MapId, ProvincePresentation> = {
  hanoi: { preload: scene => preloadHanoi(scene), draw: scene => drawHanoi(scene) },
  'ninh-binh': regional, 'hai-phong': regional, 'quang-ninh': regional,
  'thanh-hoa': regional, 'nghe-an': regional, 'ha-tinh': regional,
};
export function getProvincePresentation(id: MapId): ProvincePresentation { return presentations[id]; }
