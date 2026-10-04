import type { ProvinceModule } from '../../core/contracts.js';
import { haTinh } from './definition.js';
import { appendHatinhActions } from './interactions.js';
import { hatinhGuide } from './guide.js';
import { hatinhView } from './view.js';
import { describePublicServiceAction } from '../../presets/public-service/interactions.js';
import { publicServiceWorldState } from '../../presets/public-service/view.js';
export const hatinhModule:ProvinceModule={definition:haTinh,interactions:appendHatinhActions,describeAction:describePublicServiceAction,guide:hatinhGuide,view:hatinhView,worldState:publicServiceWorldState};
