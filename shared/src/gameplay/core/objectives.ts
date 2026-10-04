import type { CatalogueContext } from './interactions.js';
import type { ProvinceDefinition, ProvinceView } from './contracts.js';
import type { GameSnapshot } from '../../types.js';
import type { GuideContext, MissionGuide } from './guide.js';

export function appendTimedObjectives(context: CatalogueContext, definition: ProvinceDefinition) {
  for (const o of definition.objectives) if (!context.s.objectiveProgress?.[o.id] && o.available(context.s))
    context.job(o.pointId, o.jobType, o.label);
}

export function timedObjectiveGuide(context: GuideContext, definition: ProvinceDefinition, base: MissionGuide): MissionGuide {
  const objective = definition.objectives.find(o => !context.s.objectiveProgress?.[o.id] && o.available(context.s));
  if (!objective) return base;
  context.guide.title = definition.quests.find(q => q.id === objective.questId)?.title ?? base.title;
  context.to(objective.pointId, objective.label);
  context.guide.checks = definition.objectives.filter(o => o.questId === objective.questId).map(o => ({ text: o.label, done: !!context.s.objectiveProgress?.[o.id] }));
  return context.guide;
}

export function withTimedObjectiveView(view: ProvinceView, s: GameSnapshot, definition: ProvinceDefinition): ProvinceView {
  if (!definition.objectives.length) return view;
  for (const quest of view.quests) {
    const objectives = definition.objectives.filter(o => o.questId === quest.id);
    quest.score += objectives.reduce((sum, o) => sum + (s.objectiveProgress?.[o.id] ? o.score : 0), 0);
    if (definition.quests.findIndex(q => q.id === quest.id) >= 3 && objectives.length)
      quest.status = objectives.every(o => s.objectiveProgress?.[o.id]) ? 'RESOLVED' : 'ACTIVE';
  }
  for (const o of definition.objectives) view.markers.push({ pointId: o.pointId, done: !!s.objectiveProgress?.[o.id] });
  const active = definition.objectives.find(o => !s.objectiveProgress?.[o.id] && o.available(s));
  if (active) { view.activeQuestId = active.questId; view.activeQuestNumber = definition.quests.findIndex(q => q.id === active.questId) + 1; }
  return view;
}
