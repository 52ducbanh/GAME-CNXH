import type { ActiveJob, TimedObjectiveDefinition } from 'shared';

/** Completion facts are owned once; score and presentation are selectors of these facts. */
export class TimedObjectives {
  private completed: Record<string, boolean> = {};
  constructor(private readonly definitions: readonly TimedObjectiveDefinition[]) {}
  find(type: string, pointId: string) { return this.definitions.find(o => o.jobType === type && o.pointId === pointId); }
  complete(task: ActiveJob): boolean {
    const objective = this.find(task.type, task.targetId);
    if (!objective) return false;
    this.completed[objective.id] = true;
    return true;
  }
  score() { return this.definitions.reduce((sum, o) => sum + (this.completed[o.id] ? o.score : 0), 0); }
  snapshot() { return this.definitions.length ? { ...this.completed } : undefined; }
  reset() { this.completed = {}; }
}
