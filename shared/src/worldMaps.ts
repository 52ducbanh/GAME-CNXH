import { MAP_CONFIG, POINTS_OF_INTEREST, WALKWAYS, STATIC_COLLIDERS, BRIDGE_CROSSING, NORTH_CROSSING, MapPoint, PointOfInterest, Rect, distanceToSegment, isWalkable } from './mapData.js';
import { REGIONAL_MAP_DATA } from './regionalMapData.js';
import { COLLISION_LAYOUT } from './collisionLayout.js';
import { CollisionContext, collisionState, GroundFootprint, Floor, polygonContains, polygonTouchesFoot, footInsidePolygon, floorPolygon, rectTouchesFoot, waterBlocksFoot } from './collisionGeometry.js';
import { MOVEMENT_CONFIG } from './constants.js';

export const MAP_IDS = ['hanoi','hai-phong','quang-ninh','ninh-binh','thanh-hoa','nghe-an','ha-tinh'] as const;
export type MapId = typeof MAP_IDS[number];
export interface Walkway { points: MapPoint[]; width: number }
export interface SceneLabel { x:number; y:number; text:string; size?:number }
export interface Foreground { key:string; depth:number; polygon:number[][] }
export interface WorldMap {
 id:MapId; name:string; landmark:string; defaultRoom:string; sceneUrl:string; minimapUrl:string; iconUrl:string;
 waterCollision:number[][][]; floors:Floor[]; groundAreas:number[][][]; footprints:GroundFootprint[];
 spawn:MapPoint; points:Record<string,PointOfInterest>; paths:Walkway[]; colliders:Rect[];
 bridge:{a:MapPoint;b:MapPoint;width:number;kind:'stone'|'steel'|'wood'};
 detour:MapPoint[]; labels:SceneLabel[]; foreground:Foreground[];
 water:number[][][]; boats:{x:number;y:number;kind:number;dx:number;dy:number}[];
}
const metadata = [
 ['hanoi','Hà Nội','Hồ Gươm','HANOI_01'],
 ['hai-phong','Hải Phòng','Cảng Hải Phòng','HAIPHONG_01'],
 ['quang-ninh','Quảng Ninh','Vịnh Hạ Long','QUANGNINH_01'],
 ['ninh-binh','Ninh Bình','Tràng An','NINHBINH_01'],
 ['thanh-hoa','Thanh Hóa','Thành Nhà Hồ','THANHHOA_01'],
 ['nghe-an','Nghệ An','Làng Sen · Kim Liên','NGHEAN_01'],
 ['ha-tinh','Hà Tĩnh','Ngã ba Đồng Lộc','HATINH_01']
] as const;
const pairs=(p:number[][]):MapPoint[]=>p.map(([x,y])=>({x,y}));
export const GAME_MAPS:WorldMap[]=metadata.map(([id,name,landmark,defaultRoom])=>{
 const base={...COLLISION_LAYOUT[id],id,name,landmark,defaultRoom,sceneUrl:`/assets/regions/${id}/scene.webp`,minimapUrl:`/assets/regions/${id}/minimap.webp`,iconUrl:`/assets/regions/${id}/icon.webp`};
 if(id==='hanoi')return {...base,sceneUrl:'/assets/hanoi/v3/scene.webp',minimapUrl:'/assets/hanoi/v3/minimap.webp',iconUrl:'/assets/hanoi/v2/tower.png',spawn:MAP_CONFIG.spawn,points:POINTS_OF_INTEREST,paths:WALKWAYS,colliders:STATIC_COLLIDERS,bridge:{a:{x:BRIDGE_CROSSING.x,y:414},b:{x:BRIDGE_CROSSING.x+BRIDGE_CROSSING.width,y:414},width:62,kind:'stone'},detour:[{x:NORTH_CROSSING.x,y:52},{x:NORTH_CROSSING.x+NORTH_CROSSING.width,y:52}],labels:[],foreground:[],water:[],boats:[]};
 const data=REGIONAL_MAP_DATA[id];
  const poi=Object.fromEntries(Object.entries(data.points).map(([key,[x,y]])=>{const def=POINTS_OF_INTEREST[key];return [key,{id:def?.id??key,name:def?.name??key,radius:def?.radius??40,type:(def?.type??'HEADQUARTERS') as PointOfInterest['type'],description:def?.description??key,vietnameseLabel:def?.vietnameseLabel??key,x,y}];}));
 return {...base,spawn:{x:data.spawn[0],y:data.spawn[1]},points:poi,paths:data.paths.map(p=>({points:pairs(p),width:64})),colliders:data.colliders.map(([x,y,width,height])=>({x,y,width,height})),bridge:{a:{x:data.bridge[0][0],y:data.bridge[0][1]},b:{x:data.bridge[1][0],y:data.bridge[1][1]},width:60,kind:data.kind as 'stone'|'steel'|'wood'},detour:pairs(data.detour),labels:data.labels,foreground:data.foreground,water:data.water,boats:data.boats};
});
export function isMapId(value:unknown):value is MapId {return typeof value==='string'&&(MAP_IDS as readonly string[]).includes(value);}
export function getGameMap(id:MapId='hanoi'):WorldMap {return GAME_MAPS.find(m=>m.id===id)??GAME_MAPS[0];}
export function getMapFootprints(mapId:MapId,context:CollisionContext=false):GroundFootprint[] {
 const map=getGameMap(mapId),state=collisionState(context);
 const footprints=[...map.colliders.map((r,i)=>({...r,id:`${mapId}:footprint:${i}`})),...map.footprints.map(r=>({...r,id:`${mapId}:${r.id}`}))];
 const tent=(id:string)=>{const p=map.points[id],bottom=p.y-(mapId==='hanoi'?22:24);
  // Trimmed 118x103 mobile sprite: physical rear/side walls; front doorway stays open.
  footprints.push({id:`${mapId}:${id}:rear`,x:p.x-49,y:bottom-39,width:98,height:16},
   {id:`${mapId}:${id}:left`,x:p.x-49,y:bottom-23,width:23,height:23},
   {id:`${mapId}:${id}:right`,x:p.x+26,y:bottom-23,width:23,height:23});
 };
 if(state.mobileBDeployed)tent('CLINIC_MOBILE_B');
 if(state.mobileCDeployed)tent('CLINIC_MOBILE_C');
 // Regional fixed clinics already have static building footprints. Hanoi constructs its clinic.
 if(mapId==='hanoi'&&state.fixedDeployed)tent('CLINIC_FIXED');
 return footprints;
}
export function isWalkableForMap(mapId:MapId,x:number,y:number,context:CollisionContext=false,radius:number=MOVEMENT_CONFIG.footRadius):boolean {
 const state=collisionState(context),blocked=!!state.bridgeBlocked,map=getGameMap(mapId),point={x,y};
 if(!Number.isFinite(x)||!Number.isFinite(y)||x<25||y<25||x>1647||y>916)return false;
 if(mapId==='hanoi'){if(!isWalkable(x,y,blocked,radius))return false;}
 else {
  const floors=map.floors.map(floorPolygon);
  const onFloor=floors.some(poly=>footInsidePolygon(point,poly,radius));
  if(!onFloor&&!map.paths.some(p=>p.points.slice(1).some((b,i)=>distanceToSegment(point,p.points[i],b)<p.width/2))&&!map.groundAreas.some(poly=>footInsidePolygon(point,poly,radius)))return false;
  if(map.waterCollision.some(poly=>waterBlocksFoot(point,poly,floors,radius)))return false;
  const {a,b}=map.bridge,dx=b.x-a.x,dy=b.y-a.y;
  const t=((x-a.x)*dx+(y-a.y)*dy)/(dx*dx+dy*dy);
  if(blocked&&t>.22&&t<.78&&distanceToSegment(point,a,b)<map.bridge.width/2+radius)return false;
 }
 return !getMapFootprints(mapId,context).some(r=>rectTouchesFoot(point,r,radius));
}
