import type { ProvinceModule } from '../../core/contracts.js';
import { ninhBinh } from './definition.js';
import { appendNinhBinhActions } from './interactions.js';
import { ninhBinhGuide } from './guide.js';
import { ninhBinhView } from './view.js';
import { describePublicServiceAction } from '../../presets/public-service/interactions.js';
import { publicServiceWorldState } from '../../presets/public-service/view.js';

export const ninhBinhModule: ProvinceModule = {
  definition: ninhBinh,
  interactions: appendNinhBinhActions,
  describeAction: describePublicServiceAction,
  guide: ninhBinhGuide,
  view: ninhBinhView,
  worldState: publicServiceWorldState,
};
