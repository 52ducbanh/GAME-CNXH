import { describe, it, expect } from 'vitest';
import { getGameMap, getMapFootprints, isWalkable, isWalkableForMap, isMovementSegmentClear, findWalkingRoute, resolveMovement } from 'shared';
import { createTestEngine, serviceStateOf } from './fixtures/gameplay.js';

// Points chosen on the clean plates, outside the old path tubes; not geometry-derived fixtures.
const dryPoints = [
 ['hanoi',720,170], ['hanoi',400,500], ['hanoi',1000,180],
 ['quang-ninh',400,600], ['quang-ninh',680,540], ['quang-ninh',440,620],
 ['ninh-binh',760,305], ['ninh-binh',350,570], ['ninh-binh',440,760],
 ['thanh-hoa',900,535], ['thanh-hoa',1200,470], ['thanh-hoa',360,780],
 ['nghe-an',600,520], ['nghe-an',340,770],
] as const;

describe('Remaining provinces: open paving and safe server routes', () => {
 it.each(dryPoints)('%s opens paved ground at %i,%i', (map,x,y) => {
  for (const bridgeBlocked of [false,true]) {
   const e=createTestEngine('OPEN_GROUND','host',map),p=e.addPlayer('walker','Walker'); e.startRunning();
   const service=serviceStateOf(e); service.bridgeResponse.bridgeBroken=bridgeBlocked;
   service.medicalService.fixedDeployed=true; service.medicalService.mobileBDeployed=true; service.medicalService.mobileCDeployed=true;
   const context={bridgeBlocked,fixedDeployed:true,mobileBDeployed:true,mobileCDeployed:true};
   expect(isWalkableForMap(map,x,y,context)).toBe(true);
   if(map==='hanoi') expect(isWalkable(x,y,bridgeBlocked)).toBe(true);
   const route=findWalkingRoute(p,{x,y},context,map);
   expect(route.length).toBeGreaterThan(1);
   for(let i=1;i<route.length;i++) {
    const a=route[i-1],b=route[i],n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)));
    expect(isMovementSegmentClear(map,a,b,context)).toBe(true);
    // Dense sampling catches narrow unsupported seams between sweep samples.
    for(let k=1;k<=n;k++) expect(isWalkableForMap(map,a.x+(b.x-a.x)*k/n,a.y+(b.y-a.y)*k/n,context)).toBe(true);
    expect(e.handleIntent(p.id,{actionId:`move_${i}`,type:'MOVE',payload:b}).success).toBe(true);
   }
   const dx=map==='quang-ninh'&&x===680?-8:8;
   const move=resolveMovement(map,{x,y},{x:dx,y:0},context);
   expect(move.position.x).toBeCloseTo(x+dx);
  }
 },15000);
 it.each(['hanoi','quang-ninh','ninh-binh','thanh-hoa','nghe-an'] as const)('%s still blocks every solid footprint, with deployed clinics',map=>{
  const context={fixedDeployed:true,mobileBDeployed:true,mobileCDeployed:true};
  for(const f of getMapFootprints(map,context)) expect(isWalkableForMap(map,f.x+f.width/2,f.y+f.height/2,context),f.id).toBe(false);
  const m=getGameMap(map),e=createTestEngine('NO_TUNNEL','host',map),p=e.addPlayer('p','P');
  const solid=getMapFootprints(map)[4];
  const before={x:p.x,y:p.y};
  expect(e.handleIntent(p.id,{actionId:'solid',type:'MOVE',payload:{x:solid.x+solid.width/2,y:solid.y+solid.height/2}}).success).toBe(false);
  expect({x:p.x,y:p.y}).toEqual(before);
 });
 it.each([['hanoi',900,475],['quang-ninh',1000,400],['ninh-binh',1100,450],['thanh-hoa',1150,690],['nghe-an',1020,550]] as const)('%s keeps water blocked at %i,%i',(map,x,y)=>{
  expect(isWalkableForMap(map,x,y)).toBe(false);
 });
});
