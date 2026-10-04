import type { ProvinceModule } from '../../core/contracts.js';
import { quangNinh } from './definition.js';
import { appendQuangNinhActions } from './interactions.js';
import { quangNinhGuide } from './guide.js';
import { quangNinhView } from './view.js';
import { describePublicServiceAction } from '../../presets/public-service/interactions.js';
import { publicServiceWorldState } from '../../presets/public-service/view.js';

export const quangNinhModule: ProvinceModule = {
  definition: quangNinh,
  interactions: appendQuangNinhActions,
  describeAction: describePublicServiceAction,
  guide: quangNinhGuide,
  view: quangNinhView,
  worldState: publicServiceWorldState,
};
