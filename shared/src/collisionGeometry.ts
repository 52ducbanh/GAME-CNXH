import { MapPoint, Rect, distanceToSegment } from './mapData.js';

export interface CollisionState { bridgeBlocked?:boolean; fixedDeployed?:boolean; mobileBDeployed?:boolean; mobileCDeployed?:boolean }
export type CollisionContext = boolean | CollisionState;
export const collisionState=(context:CollisionContext=false):CollisionState=>typeof context==='boolean'?{bridgeBlocked:context}:context;
export interface GroundFootprint extends Rect { id:string }
export interface Floor { id:string; a:number[]; b:number[]; width:number; missionBridge:boolean }
export function polygonContains(p:MapPoint,poly:number[][]):boolean {
 let inside=false;
 for(let i=0,j=poly.length-1;i<poly.length;j=i++){
  const a=poly[i],b=poly[j];
  if((a[1]>p.y)!==(b[1]>p.y)&&p.x<(b[0]-a[0])*(p.y-a[1])/(b[1]-a[1])+a[0])inside=!inside;
 }
 return inside;
}
export function polygonDistance(p:MapPoint,poly:number[][]):number {
 return Math.min(...poly.map((a,i)=>{const b=poly[(i+1)%poly.length];return distanceToSegment(p,{x:a[0],y:a[1]},{x:b[0],y:b[1]});}));
}
export function polygonTouchesFoot(p:MapPoint,poly:number[][],radius:number):boolean {return polygonContains(p,poly)||polygonDistance(p,poly)<radius;}
// Deck endpoints extend onto the bank, so the full foot can cross the land/deck seam.
export function floorPolygon(f:Floor):number[][] {
 const [ax,ay]=f.a,[bx,by]=f.b,len=Math.hypot(bx-ax,by-ay),ux=(bx-ax)/len,uy=(by-ay)/len,w=f.width/2,e=26;
 return [[ax-ux*e-uy*w,ay-uy*e+ux*w],[bx+ux*e-uy*w,by+uy*e+ux*w],[bx+ux*e+uy*w,by+uy*e-ux*w],[ax-ux*e+uy*w,ay-uy*e-ux*w]];
}
export function footInsidePolygon(p:MapPoint,poly:number[][],radius:number):boolean {return polygonContains(p,poly)&&polygonDistance(p,poly)>=radius-1e-6;}
export function rectTouchesFoot(p:MapPoint,r:Rect,radius:number):boolean {return Math.hypot(p.x-Math.max(r.x,Math.min(p.x,r.x+r.width)),p.y-Math.max(r.y,Math.min(p.y,r.y+r.height)))<radius;}
// At an approach, a foot may span dry land and deck. Only its wet portion needs
// support. Never let a path tube exempt water, walls or other solid footprints.
export function waterBlocksFoot(p:MapPoint,poly:number[][],floors:number[][][],radius:number):boolean {
 if(!polygonTouchesFoot(p,poly,radius))return false;
 if(floors.some(f=>footInsidePolygon(p,f,radius)))return false;
 if(!floors.some(f=>polygonTouchesFoot(p,f,radius)))return true;
 const unsupported=(q:MapPoint)=>polygonContains(q,poly)&&!floors.some(f=>polygonContains(q,f));
 if(unsupported(p))return true;
 for(let i=0;i<64;i++){const a=i*Math.PI/32;if(unsupported({x:p.x+radius*Math.cos(a),y:p.y+radius*Math.sin(a)}))return true;}
 // Also test interior boundary witnesses: a narrow water wedge can lie between
 // circular samples. The nearest point on every shore/deck edge catches it.
 for(const shape of [poly,...floors])for(let i=0;i<shape.length;i++){
  const [ax,ay]=shape[i],[bx,by]=shape[(i+1)%shape.length],dx=bx-ax,dy=by-ay;
  const t=Math.max(0,Math.min(1,((p.x-ax)*dx+(p.y-ay)*dy)/(dx*dx+dy*dy||1))),q={x:ax+t*dx,y:ay+t*dy};
  if(Math.hypot(q.x-p.x,q.y-p.y)>=radius)continue;
  for(const off of [-.01,.01]){const len=Math.hypot(dx,dy)||1,v={x:q.x-off*dy/len,y:q.y+off*dx/len};if(Math.hypot(v.x-p.x,v.y-p.y)<radius&&unsupported(v))return true;}
 }
 return false;
}
