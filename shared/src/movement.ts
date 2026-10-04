import { MOVEMENT_CONFIG, PLAYER_SPEED } from './constants.js';
import { MapPoint, Rect, LAKE_OUTLINE, CANAL_OUTLINE, isInLake, isInCanal, BRIDGE_COLLIDER } from './mapData.js';
import { CollisionContext, collisionState, polygonContains, polygonTouchesFoot, floorPolygon, footInsidePolygon, waterBlocksFoot } from './collisionGeometry.js';
import { MapId, getGameMap, getMapFootprints, isWalkableForMap } from './worldMaps.js';

export type Surface = 'stone' | 'grass' | 'wood';
export interface Contact { id:string; layer:string; normal:MapPoint; rect?:Rect }
const magnitude=(p:MapPoint)=>Math.hypot(p.x,p.y);
const unit=(p:MapPoint):MapPoint=>{const d=magnitude(p);return d>1e-8?{x:p.x/d,y:p.y/d}:{x:0,y:0};};
export function closestOnSegment(p:MapPoint,a:MapPoint,b:MapPoint):MapPoint {
  const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
  return {x:a.x+t*dx,y:a.y+t*dy};
}
function rectContact(p:MapPoint,r:Rect):MapPoint {
  const q={x:Math.max(r.x,Math.min(p.x,r.x+r.width)),y:Math.max(r.y,Math.min(p.y,r.y+r.height))};
  if(magnitude({x:p.x-q.x,y:p.y-q.y})>1e-8)return unit({x:p.x-q.x,y:p.y-q.y});
  return [{d:p.x-r.x,x:-1,y:0},{d:r.x+r.width-p.x,x:1,y:0},{d:p.y-r.y,x:0,y:-1},{d:r.y+r.height-p.y,x:0,y:1}].sort((a,b)=>a.d-b.d)[0];
}
function polygonNormal(p:MapPoint,polygon:MapPoint[],inside:boolean):MapPoint {
  let q=polygon[0],best=Infinity;
  for(let i=0;i<polygon.length;i++){
    const candidate=closestOnSegment(p,polygon[i],polygon[(i+1)%polygon.length]);
    const d=Math.hypot(p.x-candidate.x,p.y-candidate.y);
    if(d<best){best=d;q=candidate;}
  }
  return unit(inside?{x:q.x-p.x,y:q.y-p.y}:{x:p.x-q.x,y:p.y-q.y});
}
// Analytic normals of the SAME geometry used by walkability, never sprite bounds.
export function collisionContact(mapId:MapId,p:MapPoint,context:CollisionContext=false):Contact|null {
  const radius=MOVEMENT_CONFIG.footRadius,map=getGameMap(mapId),blocked=!!collisionState(context).bridgeBlocked;
  if(isWalkableForMap(mapId,p.x,p.y,context,radius))return null;
  for(const r of getMapFootprints(mapId,context)){
    const q={x:Math.max(r.x,Math.min(p.x,r.x+r.width)),y:Math.max(r.y,Math.min(p.y,r.y+r.height))};
    if(Math.hypot(p.x-q.x,p.y-q.y)<radius)return {id:r.id,layer:'environment',normal:rectContact(p,r),rect:{x:r.x,y:r.y,width:r.width,height:r.height}};
  }
  if(mapId==='hanoi'){
    if(blocked && Math.hypot(p.x-Math.max(BRIDGE_COLLIDER.x,Math.min(p.x,BRIDGE_COLLIDER.x+BRIDGE_COLLIDER.width)),p.y-Math.max(BRIDGE_COLLIDER.y,Math.min(p.y,BRIDGE_COLLIDER.y+BRIDGE_COLLIDER.height)))<radius)
      return {id:'hanoi:broken-bridge',layer:'bridge',normal:rectContact(p,BRIDGE_COLLIDER),rect:BRIDGE_COLLIDER};
    if(isInLake(p.x,p.y,radius))return {id:'hanoi:lake',layer:'water',normal:polygonNormal(p,LAKE_OUTLINE,isInLake(p.x,p.y))};
    if(isInCanal(p.x,p.y,radius))return {id:'hanoi:canal',layer:'water',normal:polygonNormal(p,CANAL_OUTLINE,isInCanal(p.x,p.y))};
  }else{
    const {a,b,width}=map.bridge,dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),u={x:dx/len,y:dy/len};
    const along=(p.x-a.x)*u.x+(p.y-a.y)*u.y,side=(p.x-a.x)*-u.y+(p.y-a.y)*u.x;
    if(blocked&&along>len*.22&&along<len*.78&&Math.abs(side)<width/2+radius){
      const faces=[{d:along-len*.22,n:{x:-u.x,y:-u.y}},{d:len*.78-along,n:u},{d:width/2+radius-Math.abs(side),n:{x:-u.y*Math.sign(side||1),y:u.x*Math.sign(side||1)}}].sort((a,b)=>a.d-b.d);
      return {id:`${mapId}:broken-bridge`,layer:'bridge',normal:faces[0].n};
    }
    if(p.x<25||p.y<25||p.x>1647||p.y>916)return {id:`${mapId}:world-edge`,layer:'bounds',normal:unit({x:p.x<25?1:p.x>1647?-1:0,y:p.y<25?1:p.y>916?-1:0})};
  }
  if(mapId!=='hanoi'){
    const blocked=!!collisionState(context).bridgeBlocked;
    if(!map.floors.some(f=>footInsidePolygon(p,floorPolygon(f),radius))){
      for(const [i,poly] of map.waterCollision.entries())if(waterBlocksFoot(p,poly,map.floors.map(floorPolygon),radius))return {id:`${mapId}:water:${i}`,layer:'water',normal:polygonNormal(p,poly.map(([x,y])=>({x,y})),polygonContains(p,poly))};
    }
    for(const poly of map.groundAreas)if(polygonContains(p,poly))return {id:`${mapId}:courtyard-edge`,layer:'walkway',normal:polygonNormal(p,poly.map(([x,y])=>({x,y})),false)};
  }
  // Union of path tubes: use the segment with greatest clearance.
  let clearance=-Infinity,normal={x:0,y:0};
  for(const path of map.paths)for(let i=1;i<path.points.length;i++){
    const q=closestOnSegment(p,path.points[i-1],path.points[i]);
    const c=path.width/2-Math.hypot(p.x-q.x,p.y-q.y);
    if(c>clearance){clearance=c;normal=unit({x:q.x-p.x,y:q.y-p.y});}
  }
  return {id:`${mapId}:walkway-edge`,layer:'walkway',normal};
}
export function isMovementSegmentClear(mapId:MapId,a:MapPoint,b:MapPoint,context:CollisionContext=false):boolean {
  if(!Number.isFinite(a.x+a.y+b.x+b.y))return false;
  const count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/MOVEMENT_CONFIG.sweepStep));
  for(let i=0;i<=count;i++)if(!isWalkableForMap(mapId,a.x+(b.x-a.x)*i/count,a.y+(b.y-a.y)*i/count,context,MOVEMENT_CONFIG.footRadius))return false;
  return true;
}
export function inputDisplacement(input:MapPoint,dtMs:number,sprint=false,carrying=false):MapPoint {
  const d=magnitude(input),f=d?Math.min(1,d)/d:0;
  const step=PLAYER_SPEED*(sprint?(carrying?1.25:1.45):1)*dtMs/1000;
  return {x:input.x*f*step,y:input.y*f*step};
}
export interface MovementResult { position:MapPoint; path:MapPoint[]; distance:number; contacts:Contact[] }
export function resolveMovement(mapId:MapId,start:MapPoint,desired:MapPoint,context:CollisionContext=false):MovementResult {
  let p={...start},distance=0;const path:MapPoint[]=[],contacts:Contact[]=[];
  if(!isWalkableForMap(mapId,p.x,p.y,context,MOVEMENT_CONFIG.footRadius)||!Number.isFinite(desired.x+desired.y))return {position:p,path,distance,contacts};
  const count=Math.max(1,Math.ceil(magnitude(desired)/2));
  const advance=(q:MapPoint)=>{distance+=Math.hypot(q.x-p.x,q.y-p.y);p=q;path.push({...p});};
  for(let step=0;step<count;step++){
    let remaining={x:desired.x/count,y:desired.y/count};
    for(let iteration=0;iteration<MOVEMENT_CONFIG.contactIterations&&magnitude(remaining)>1e-5;iteration++){
      const target={x:p.x+remaining.x,y:p.y+remaining.y};
      if(isMovementSegmentClear(mapId,p,target,context)){advance(target);break;}
      let lo=0,hi=1;
      for(let i=0;i<14;i++){const mid=(lo+hi)/2,q={x:p.x+remaining.x*mid,y:p.y+remaining.y*mid};if(isMovementSegmentClear(mapId,p,q,context))lo=mid;else hi=mid;}
      const hit={x:p.x+remaining.x*hi,y:p.y+remaining.y*hi},contact=collisionContact(mapId,hit,context);
      if(lo>1e-5)advance({x:p.x+remaining.x*lo,y:p.y+remaining.y*lo});
      remaining={x:remaining.x*(1-lo),y:remaining.y*(1-lo)};
      if(!contact)break;
      if(!contacts.some(c=>c.id===contact.id))contacts.push(contact);
      const dot=remaining.x*contact.normal.x+remaining.y*contact.normal.y;
      if(dot>=-1e-7)break;
      remaining={x:remaining.x-dot*contact.normal.x,y:remaining.y-dot*contact.normal.y};
    }
  }
  return {position:p,path,distance,contacts};
}
// Authoritative recovery only; clients do not call this to teleport out of walls.
export function safeSpawn(mapId:MapId,candidate:MapPoint,context:CollisionContext=false):MapPoint {
  if(isWalkableForMap(mapId,candidate.x,candidate.y,context))return candidate;
  for(let r=1;r<=96;r+=2)for(let i=0;i<16;i++){
    const q={x:candidate.x+r*Math.cos(i*Math.PI/8),y:candidate.y+r*Math.sin(i*Math.PI/8)};
    if(isWalkableForMap(mapId,q.x,q.y,context))return q;
  }
  return {...getGameMap(mapId).spawn};
}
// Explicit ground metadata. No pixel/roof sampling; uncertain ground falls back to stone.
export function surfaceAt(mapId:MapId,p:MapPoint):Surface {
  const {a,b,width,kind}=getGameMap(mapId).bridge,q=closestOnSegment(p,a,b);
  if(kind==='wood'&&Math.hypot(p.x-q.x,p.y-q.y)<width/2)return 'wood';
  // Traced lawn left of the stone stairs in Thanh Hoa's clean plate.
  if(mapId==='thanh-hoa'&&p.x>=560&&p.x<=660&&p.y>=400&&p.y<=445)return 'grass';
  return 'stone';
}
