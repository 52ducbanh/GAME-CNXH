import { createTestEngine, serviceStateOf, rescueStateOf } from './fixtures/gameplay.js';
import { describe, it, expect } from 'vitest';
import { GameEngine } from '../gameEngine.js';
import { MAP_CONFIG, POINTS_OF_INTEREST, LAKE, LAKE_OUTLINE, CANAL, NORTH_CROSSING, isInLake, isWalkable } from 'shared';
import { findWalkingRoute } from 'shared';
import { getMissionGuide } from 'shared';

describe('Hanoi map and mission guidance',()=>{
  it('every interaction point is reachable from spawn on the new map',()=>{
    for(const p of Object.values(POINTS_OF_INTEREST)){
      expect(isWalkable(p.x,p.y),p.id).toBe(true);
      const route=findWalkingRoute(MAP_CONFIG.spawn,p);
      expect(route.length,p.id).toBeGreaterThan(1);
      expect(route.every(q=>isWalkable(q.x,q.y)),p.id).toBe(true);
    }
  });
  it('routes to the east use the north crossing while the bridge is broken',()=>{
    const start={x:POINTS_OF_INTEREST.BRIDGE.x-68,y:POINTS_OF_INTEREST.BRIDGE.y},end=POINTS_OF_INTEREST.ZONE_B;
    const direct=findWalkingRoute(start,end),detour=findWalkingRoute(start,end,true);
    expect(detour.length).toBeGreaterThan(direct.length);
    expect(detour.some(p=>p.x>=NORTH_CROSSING.x&&p.x<=NORTH_CROSSING.x+NORTH_CROSSING.width&&p.y<CANAL.y-14)).toBe(true);
    expect(detour.every(p=>isWalkable(p.x,p.y,true))).toBe(true);
    expect(isWalkable(POINTS_OF_INTEREST.BRIDGE.x,POINTS_OF_INTEREST.BRIDGE.y,true)).toBe(false);
    expect(isWalkable(POINTS_OF_INTEREST.BRIDGE.x,POINTS_OF_INTEREST.BRIDGE.y,false)).toBe(true);
  });
  it('server rejects lake, building and broken bridge movement at the rendered positions',()=>{
    const e=createTestEngine('MAP_TEST','host'),p=e.addPlayer('p','Tester');
    for(const [i,target] of [{x:LAKE.x,y:LAKE.y},{x:POINTS_OF_INTEREST.HEADQUARTERS.x,y:140},{x:CANAL.x+CANAL.width/2,y:600}].entries()){
      const original={x:p.x,y:p.y};
      const ack=e.handleIntent(p.id,{actionId:`blocked_${i}`,type:'MOVE',payload:target});
      expect(ack.success).toBe(false);expect({x:p.x,y:p.y}).toEqual(original);
    }
    serviceStateOf(e).bridgeResponse.status='ACTIVE';serviceStateOf(e).bridgeResponse.bridgeBroken=true;
    expect(e.handleIntent(p.id,{actionId:'bridge',type:'MOVE',payload:POINTS_OF_INTEREST.BRIDGE}).success).toBe(false);
  });
  it('every route segment can be walked through the authoritative server',()=>{
    for(const blocked of [false,true]){
      const e=createTestEngine('WALK_TEST','host'),player=e.addPlayer('walker','Walker');
      e.startRunning();serviceStateOf(e).bridgeResponse.status=blocked?'ACTIVE':'LOCKED';serviceStateOf(e).bridgeResponse.bridgeBroken=blocked;
      for(const poi of Object.values(POINTS_OF_INTEREST)){
        const end=blocked&&poi.type==='BRIDGE'?{x:poi.x-70,y:poi.y}:poi;
        const route=findWalkingRoute({x:player.x,y:player.y},end,blocked);
        expect(route.length,poi.id).toBeGreaterThan(1);
        for(let j=1;j<route.length;j++){
          const a=route[j-1],b=route[j],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/4);
          for(let k=1;k<=steps;k++){
            const ack=e.handleIntent(player.id,{actionId:`walk_${blocked}_${poi.id}_${j}_${k}`,type:'MOVE',payload:{x:a.x+(b.x-a.x)*k/steps,y:a.y+(b.y-a.y)*k/steps}});
            expect(ack.success,`${poi.id}: ${ack.reason}`).toBe(true);
          }
        }
        expect(Math.hypot(player.x-poi.x,player.y-poi.y)).toBeLessThanOrEqual(poi.radius);
      }
    }
  });
  it('polygon shoreline and persistent detour bridge match server collision',()=>{
    const e=createTestEngine('SHORE_TEST','host'),p=e.addPlayer('p','Tester');
    for(const point of LAKE_OUTLINE){
      expect(isInLake(point.x,point.y,14)).toBe(true);
      expect(e.handleIntent(p.id,{actionId:`shore_${point.x}`,type:'MOVE',payload:point}).success).toBe(false);
    }
    serviceStateOf(e).bridgeResponse.status='RESOLVED';serviceStateOf(e).bridgeResponse.bridgeBroken=true;serviceStateOf(e).citizenRights.status='ACTIVE';
    const target=POINTS_OF_INTEREST.BRIDGE;
    expect(e.handleIntent(p.id,{actionId:'still_broken',type:'MOVE',payload:target}).success).toBe(false);
    serviceStateOf(e).bridgeResponse.bridgeRepaired=true;
    // Validate entering the repaired crossing from its shore, not teleporting from spawn.
    p.x=1338;p.y=414;
    expect(e.handleIntent(p.id,{actionId:'repaired',type:'MOVE',payload:target}).success).toBe(true);
  });
  it('guidance follows the carried crate and the unfinished mobile clinic',()=>{
    const e=createTestEngine('GUIDE_TEST','host'),p=e.addPlayer('p','Tester');
    e.phase='RUNNING';serviceStateOf(e).medicalService.status='ACTIVE';serviceStateOf(e).medicalService.surveys={A:true,B:true,C:true};serviceStateOf(e).medicalService.planCommitted='MOBILE';serviceStateOf(e).medicalService.deliveredCratesMobileB=2;
    expect(getMissionGuide(e.getSnapshot(),p.id).target?.id).toBe('WAREHOUSE');
    p.carriedCrateId='crate';expect(getMissionGuide(e.getSnapshot(),p.id).target?.id).toBe('CLINIC_MOBILE_C');
    serviceStateOf(e).medicalService.deliveredCratesMobileC=2;serviceStateOf(e).medicalService.mobileBDeployed=true;
    expect(getMissionGuide(e.getSnapshot(),p.id).target?.id).toBe('CLINIC_MOBILE_C');
    serviceStateOf(e).medicalService.mobileCDeployed=true;serviceStateOf(e).medicalService.verifiedB=true;
    expect(getMissionGuide(e.getSnapshot(),p.id).target?.id).toBe('CLINIC_MOBILE_C');
  });
  it('M3 points to the operating clinic and to C2 after C1 is served',()=>{
    const e=createTestEngine('GUIDE_TEST','host'),p=e.addPlayer('p','Tester');
    e.phase='RUNNING';serviceStateOf(e).medicalService.status='RESOLVED';serviceStateOf(e).medicalService.planCommitted='MOBILE';serviceStateOf(e).citizenRights.status='ACTIVE';serviceStateOf(e).citizenRights.receivedFeedbackC=true;
    expect(getMissionGuide(e.getSnapshot(),p.id).target?.id).toBe('CLINIC_MOBILE_C');
    serviceStateOf(e).citizenRights.crossCheckedList=true;serviceStateOf(e).citizenRights.planConfirmed=true;serviceStateOf(e).citizenRights.deployedC1=true;p.carriedCrateId='crate';
    expect(getMissionGuide(e.getSnapshot(),p.id).target?.id).toBe('CITIZEN_C2');
  });
});
