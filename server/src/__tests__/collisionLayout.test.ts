import { createTestEngine, serviceStateOf, rescueStateOf } from './fixtures/gameplay.js';
import {describe,it,expect} from 'vitest';
import {GAME_MAPS,getMapFootprints,isWalkableForMap,isMovementSegmentClear,findWalkingRoute,resolveMovement,CollisionState,MOVEMENT_CONFIG} from 'shared';
import {GameEngine} from '../gameEngine.js';

describe('Approved collision C01–C12',()=>{
 it.each([
  ['ninh-binh',855,660],['nghe-an',1075,515],['ha-tinh',1340,645],['hai-phong',1345,280],
  ['hai-phong',625,480],['thanh-hoa',1085,570],['hai-phong',625,310],['hanoi',1030,860],['quang-ninh',735,565],
 ] as const)('%s blocks the reported footprint at %i,%i and nearby corners',(map,x,y)=>{
  for(const dx of [-3,0,3])for(const dy of [-3,0,3])expect(isWalkableForMap(map,x+dx,y+dy)).toBe(false);
  expect(MOVEMENT_CONFIG.footRadius).toBe(14);
 });
 it('keeps the legitimate area behind the Hanoi bench accessible',()=>{
  expect(isWalkableForMap('hanoi',1040,835)).toBe(true);
  expect(findWalkingRoute(GAME_MAPS[0].spawn,{x:1040,y:835},false,'hanoi').length).toBeGreaterThan(0);
 });
 it('opens Thanh Hoa public paving with a route in/out, preserving the citadel wall',()=>{
  const map=GAME_MAPS.find(m=>m.id==='thanh-hoa')!;
  expect(isWalkableForMap(map.id,900,345)).toBe(true);
  expect(findWalkingRoute(map.spawn,{x:900,y:345},false,map.id).length).toBeGreaterThan(0);
  expect(isWalkableForMap(map.id,900,310)).toBe(false);
 });
 it.each(GAME_MAPS)('$name switches tent walls with deployment and keeps all doors reachable',map=>{
  const state:CollisionState={fixedDeployed:true,mobileBDeployed:true,mobileCDeployed:true};
  for(const poi of Object.values(map.points)){
   expect(isWalkableForMap(map.id,poi.x,poi.y,state),poi.id).toBe(true);
   expect(findWalkingRoute(map.spawn,poi,state,map.id).length,poi.id).toBeGreaterThan(0);
  }
  const before=getMapFootprints(map.id),after=getMapFootprints(map.id,state);
  expect(before.some(f=>f.id.includes(':CLINIC_'))).toBe(false);
  for(const id of ['CLINIC_MOBILE_B','CLINIC_MOBILE_C']){
   const p=map.points[id],wall=after.find(f=>f.id===`${map.id}:${id}:rear`)!;
   expect(wall).toBeDefined();expect(isWalkableForMap(map.id,wall.x+wall.width/2,wall.y+wall.height/2,state)).toBe(false);
   expect(isWalkableForMap(map.id,p.x,p.y,state)).toBe(true);
   for(const bridgeBlocked of [false,true])expect(findWalkingRoute(map.spawn,p,{...state,bridgeBlocked},map.id).length,`${id}/${bridgeBlocked}`).toBeGreaterThan(0);
  }
 },15000);
 it.each(GAME_MAPS)('$name resolves a player overlap when deployment completes on the server',map=>{
  const e=createTestEngine('TENT_QA','host',map.id),builder=e.addPlayer('builder','Builder'),peer=e.addPlayer('peer','Peer');
  e.startRunning();serviceStateOf(e).medicalService.planCommitted='MOBILE';serviceStateOf(e).medicalService.deliveredCratesMobileB=2;
  const p=map.points.CLINIC_MOBILE_B;builder.x=p.x;builder.y=p.y;
  // Authorized fixture placement on the undeployed rear wall; no client teleport.
  const rear=getMapFootprints(map.id,{mobileBDeployed:true}).find(f=>f.id.endsWith(':CLINIC_MOBILE_B:rear'))!;
  peer.x=rear.x+rear.width/2;peer.y=rear.y+rear.height/2;
  const old={x:peer.x,y:peer.y};
  expect(e.handleIntent(builder.id,{actionId:'deploy',type:'START_JOB',payload:{type:'DEPLOY_MOBILE_CLINIC',targetId:p.id}}).success).toBe(true);
  e.tick(builder.activeJob!.durationMs+100);
  expect(e.m1.mobileBDeployed).toBe(true);
  expect(isWalkableForMap(map.id,peer.x,peer.y,{mobileBDeployed:true})).toBe(true);
  expect(Math.hypot(peer.x-old.x,peer.y-old.y)).toBeLessThanOrEqual(96);
  expect(e.addPlayer(peer.id,peer.name)).toBe(peer);
 });
 it('sweeps and slides along the new bench without entering its footprint',()=>{
  const start={x:1040,y:835};expect(isWalkableForMap('hanoi',start.x,start.y)).toBe(true);
  const r=resolveMovement('hanoi',start,{x:12,y:12});
  expect(r.contacts.some(c=>c.id.includes('bench-0'))).toBe(true);
  expect(r.position.x).toBeGreaterThan(start.x);expect(isWalkableForMap('hanoi',r.position.x,r.position.y)).toBe(true);
  let previous=start;for(const q of r.path){expect(isMovementSegmentClear('hanoi',previous,q)).toBe(true);previous=q;}
 });
 it('keeps segment authority: an otherwise valid lake-side endpoint cannot tunnel across water',()=>{
  const e=createTestEngine('WATER_QA','host'),p=e.addPlayer('p','P');
  expect(isWalkableForMap('hanoi',1144,729)).toBe(true);
  expect(e.handleIntent(p.id,{actionId:'lake',type:'MOVE',payload:{x:1144,y:729}}).success).toBe(false);
 });
});
