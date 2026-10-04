import type { MapPoint, Player } from 'shared';

type Facing = Player['direction'];
interface Pose extends MapPoint { direction: Facing; time: number }

// Keep diagonal facing stable, but follow the displacement when sliding along a wall.
export function movementFacing(dx: number, dy: number, previous: Facing): Facing {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (ax + ay < 1e-6) return previous;
  const horizontal: Facing = dx > 0 ? 'right' : 'left';
  const vertical: Facing = dy > 0 ? 'down' : 'up';
  if (ax > ay * 1.15) return horizontal;
  if (ay > ax * 1.15) return vertical;
  return previous === horizontal || previous === vertical ? previous : vertical;
}

export function smoothingFactor(delta: number, duration: number): number {
  return 1 - Math.exp(-Math.max(0, delta) / duration);
}

// Interpolate received positions on a short delayed timeline. No extrapolation or
// exponential tail: the last received position is also the exact stopping point.
export class RemoteMotion {
  private poses: Pose[] = [];
  constructor(player: Pick<Player, 'x' | 'y' | 'direction'>, now: number) {
    this.reset(player, now);
  }
  reset(player: Pick<Player, 'x' | 'y' | 'direction'>, now: number) {
    this.poses = [{ x: player.x, y: player.y, direction: player.direction, time: now }];
  }
  push(player: Pick<Player, 'x' | 'y' | 'direction'>, now: number) {
    const last = this.poses[this.poses.length - 1];
    // Room reset, rejoin or a long gap is a correction, not a walking segment.
    if (now - last.time > 500 || Math.hypot(player.x - last.x, player.y - last.y) > 120) {
      this.reset(player, now);
      return;
    }
    if (now <= last.time) return;
    this.poses.push({ x: player.x, y: player.y, direction: player.direction, time: now });
    if (this.poses.length > 32) this.poses.shift();
  }
  sample(now: number) {
    const time = now - 100;
    while (this.poses.length > 1 && this.poses[1].time <= time) this.poses.shift();
    const a = this.poses[0], b = this.poses[1];
    if (!b || time < a.time) return { x: a.x, y: a.y, direction: a.direction, speed: 0 };
    const t = Math.min(1, (time - a.time) / (b.time - a.time));
    const dx = b.x - a.x, dy = b.y - a.y;
    return { x: a.x + dx * t, y: a.y + dy * t,
      direction: movementFacing(dx, dy, b.direction),
      speed: Math.hypot(dx, dy) * 1000 / (b.time - a.time) };
  }
}
