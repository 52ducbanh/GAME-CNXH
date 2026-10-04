import type { ProvinceModule } from '../../core/contracts.js';
import { ngheAn } from './definition.js';
import { appendNgheAnActions } from './interactions.js';
import { ngheAnGuide } from './guide.js';
import { ngheAnView } from './view.js';
import { describePublicServiceAction } from '../../presets/public-service/interactions.js';
import { publicServiceWorldState } from '../../presets/public-service/view.js';

export const ngheAnModule: ProvinceModule = {
  definition: ngheAn,
  interactions: appendNgheAnActions,
  describeAction: describePublicServiceAction,
  guide: ngheAnGuide,
  view: ngheAnView,
  worldState: publicServiceWorldState,
};
