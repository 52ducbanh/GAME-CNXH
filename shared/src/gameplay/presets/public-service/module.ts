import type { ProvinceDefinition, ProvinceModule } from '../../core/contracts.js';
import { appendPublicServiceActions, describePublicServiceAction } from './interactions.js';
import { publicServiceGuide } from './guide.js';
import { publicServiceView } from './view.js';

export function publicServiceModule(definition: ProvinceDefinition): ProvinceModule {
  return { definition, interactions: appendPublicServiceActions, describeAction: describePublicServiceAction, guide: publicServiceGuide, view: (s, guide) => publicServiceView(s, definition, guide) };
}
