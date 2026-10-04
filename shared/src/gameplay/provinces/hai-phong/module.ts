import type { ProvinceModule } from '../../core/contracts.js';
import { haiPhong } from './definition.js';
import { appendHaiPhongActions } from './interactions.js';
import { haiPhongGuide } from './guide.js';
import { haiPhongView } from './view.js';
import { describePublicServiceAction } from '../../presets/public-service/interactions.js';
import { publicServiceWorldState } from '../../presets/public-service/view.js';

export const haiPhongModule: ProvinceModule = {
  definition: haiPhong,
  interactions: appendHaiPhongActions,
  describeAction: describePublicServiceAction,
  guide: haiPhongGuide,
  view: haiPhongView,
  worldState: publicServiceWorldState,
};
