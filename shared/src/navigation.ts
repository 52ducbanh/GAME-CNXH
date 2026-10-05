import { isMovementSegmentClear } from './movement.js';
import { CollisionContext } from './collisionGeometry.js';
import { MapPoint } from './mapData.js';
import { MapId, isWalkableForMap } from './worldMaps.js';
import { WORLD_WIDTH, WORLD_HEIGHT } from './constants.js';
// A small grid keeps guidance out of the lake, walls and the broken crossing.
export function findWalkingRoute(start:MapPoint,end:MapPoint,bridgeBlocked:CollisionContext=false,mapId:MapId='hanoi',step=20):MapPoint[] {
  const cols=Math.floor(WORLD_WIDTH/step),rows=Math.floor(WORLD_HEIGHT/step);
  const clear=(x:number,y:number)=>isWalkableForMap(mapId,x,y,bridgeBlocked);
  const segmentClear=(a:MapPoint,b:MapPoint)=>isMovementSegmentClear(mapId,a,b,bridgeBlocked);
  const point=(i:number)=>({x:(i%cols)*step+step/2,y:Math.floor(i/cols)*step+step/2});
  const nearest=(p:MapPoint)=>{
    let best=-1,d=Infinity;
    for(let i=0;i<cols*rows;i++) {
      const q=point(i),dist=Math.hypot(p.x-q.x,p.y-q.y);
      if(dist<d&&clear(q.x,q.y)&&segmentClear(p,q)){best=i;d=dist;}
    }
    if(best>=0)return best;
    for(let i=0;i<cols*rows;i++) {
      const q=point(i),dist=Math.hypot(p.x-q.x,p.y-q.y);
      if(dist<d&&clear(q.x,q.y)){best=i;d=dist;}
    }
    return best;
  };
  const from=nearest(start),to=nearest(end);
  if(from<0||to<0)return step===20?findWalkingRoute(start,end,bridgeBlocked,mapId,10):[];
  const previous=new Int32Array(cols*rows).fill(-1),queue=[from];previous[from]=from;
  for(let head=0;head<queue.length&&previous[to]===-1;head++) {
    const i=queue[head];
    for(const next of [i-1,i+1,i-cols,i+cols]) {
      if(next<0||next>=cols*rows||previous[next]!==-1)continue;
      if(Math.abs(next-i)===1&&Math.floor(next/cols)!==Math.floor(i/cols))continue;
      const q=point(next),cur=point(i);
      if(!clear(q.x,q.y)||!segmentClear(cur,q))continue;
      previous[next]=i;queue.push(next);
    }
  }
  if(previous[to]===-1)return step===20?findWalkingRoute(start,end,bridgeBlocked,mapId,10):[];
  const route:MapPoint[]=[];
  for(let i=to;i!==from;i=previous[i])route.push(point(i));
  const raw=[start,point(from),...route.reverse(),end];
  const out:MapPoint[]=[];
  for(const pt of raw){
    if(!out.length||Math.hypot(pt.x-out[out.length-1].x,pt.y-out[out.length-1].y)>0.1){
      out.push(pt);
    }
  }
  return out;
}
