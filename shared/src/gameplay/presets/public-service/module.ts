import type { ProvinceDefinition, ProvinceModule } from '../../core/contracts.js';
import { appendPublicServiceActions, describePublicServiceAction } from './interactions.js';
import { publicServiceGuide } from './guide.js';
import { publicServiceView } from './view.js';
import { appendTimedObjectives, timedObjectiveGuide, withTimedObjectiveView } from '../../core/objectives.js';

export function publicServiceModule(definition: ProvinceDefinition): ProvinceModule {
  return {
    definition,
    interactions: context => { appendPublicServiceActions(context); appendTimedObjectives(context, definition); },
    describeAction: describePublicServiceAction,
    guide: context => timedObjectiveGuide(context, definition, publicServiceGuide(context)),
    view: (s, guide) => withTimedObjectiveView(publicServiceView(s, definition, guide), s, definition),
  };
}
