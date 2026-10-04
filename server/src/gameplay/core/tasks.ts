import type { ActiveJob, ManpowerPool, Player, ServerAck } from 'shared';
import type { TaskSpec } from './ports.js';

export function startTask(player: Player, spec: TaskSpec, manpower: ManpowerPool, actionId: string): ServerAck {
  if (spec.requiresManpower) manpower.busy++;
  player.activeJob = {
    jobId: `JOB_${Date.now()}`, type: spec.type, targetId: spec.targetId,
    progress: 0, elapsedMs: 0, durationMs: spec.durationMs,
    startedAt: Date.now(), requiresManpower: spec.requiresManpower,
  };
  return { actionId, success: true };
}

export function releaseTask(player: Player, manpower: ManpowerPool): ActiveJob | null {
  const task = player.activeJob;
  if (task?.requiresManpower && manpower.busy > 0) manpower.busy--;
  player.activeJob = null;
  return task;
}
