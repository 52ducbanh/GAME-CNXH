import type { ProvinceModule } from '../../core/contracts.js';
import { thanhHoa } from './definition.js';
import { appendThanhHoaActions } from './interactions.js';
import { thanhHoaGuide } from './guide.js';
import { thanhHoaView } from './view.js';
import { describePublicServiceAction } from '../../presets/public-service/interactions.js';
import { publicServiceWorldState } from '../../presets/public-service/view.js';

export const thanhHoaModule: ProvinceModule = {
  definition: thanhHoa,
  interactions: appendThanhHoaActions,
  describeAction: describePublicServiceAction,
  guide: thanhHoaGuide,
  view: thanhHoaView,
  worldState: publicServiceWorldState,
};
