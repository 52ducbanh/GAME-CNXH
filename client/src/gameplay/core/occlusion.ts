import Phaser from 'phaser';
import { CHARACTER_FRAME } from '../../game/hanoiAssets.js';
import { smoothingFactor } from '../../game/characterMotion.js';

interface ForegroundLayer { depth: number; polygon: readonly (readonly number[])[] }

// The visible body must intersect the actual mask. A crop bounding box alone
// includes transparent corners and fails when only the head is behind a canopy.
export function bodyIntersectsMask(x: number, y: number, layer: ForegroundLayer): boolean {
  if (y >= layer.depth) return false;
  const polygon = new Phaser.Geom.Polygon(layer.polygon.map(([px, py]) => ({ x: px, y: py })));
  const body = new Phaser.Geom.Rectangle(x - 14, y - CHARACTER_FRAME.footY, 28, CHARACTER_FRAME.footY);
  if (polygon.points.some(p => Phaser.Geom.Rectangle.Contains(body,p.x,p.y))) return true;
  if ([[body.left,body.top],[body.right,body.top],[body.right,body.bottom],[body.left,body.bottom]]
    .some(([px,py]) => Phaser.Geom.Polygon.Contains(polygon,px,py))) return true;
  return polygon.points.some((a,i) => {
    const b=polygon.points[(i+1)%polygon.points.length];
    return Phaser.Geom.Intersects.LineToRectangle(new Phaser.Geom.Line(a.x,a.y,b.x,b.y),body);
  });
}

export function fadeOccluder(image: Phaser.GameObjects.Image, covered: boolean, delta: number, fadedAlpha: number) {
  const target = covered ? fadedAlpha : 1;
  const alpha = image.alpha + (target - image.alpha) * smoothingFactor(delta, 90);
  image.setAlpha(Math.abs(alpha - target) < .005 ? target : alpha);
}

export function fadeDynamicOccluder(image: Phaser.GameObjects.Image, x: number, y: number, delta: number) {
  const body = new Phaser.Geom.Rectangle(x - 14, y - CHARACTER_FRAME.footY, 28, CHARACTER_FRAME.footY);
  const covered = image.visible && y < image.depth && Phaser.Geom.Intersects.RectangleToRectangle(body, image.getBounds());
  fadeOccluder(image, covered, delta, .42);
}
