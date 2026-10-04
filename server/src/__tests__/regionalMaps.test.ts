import { createTestEngine, serviceStateOf, rescueStateOf } from './fixtures/gameplay.js';
import {describe,it,expect} from 'vitest';
import {GAME_MAPS,findWalkingRoute,isWalkableForMap,getMissionGuide,ClientIntent,JobType} from 'shared';
import {GameEngine} from '../gameEngine.js';
import {RoomManager} from '../roomManager.js';

const regional=GAME_MAPS.filter(m=>m.id!=='hanoi'&&m.id!=='ha-tinh');
describe('Regional worlds',()=>{
 it.each(regional)('$name has accessible POIs, a blocked bridge and a working detour',map=>{
  const e=createTestEngine('REGION_WALK','host',map.id),p=e.addPlayer('walker','Walker');e.startRunning();
  const midpoint={x:(map.bridge.a.x+map.bridge.b.x)/2,y:(map.bridge.a.y+map.bridge.b.y)/2};
  expect(isWalkableForMap(map.id,midpoint.x,midpoint.y,false),'intact bridge').toBe(true);
  expect(isWalkableForMap(map.id,midpoint.x,midpoint.y,true),'broken bridge').toBe(false);
  for(const blocked of [false,true]){
   serviceStateOf(e).bridgeResponse.bridgeBroken=blocked;p.x=map.spawn.x;p.y=map.spawn.y;
   for(const poi of Object.values(map.points)){
    expect(isWalkableForMap(map.id,poi.x,poi.y,blocked),`${map.id}/${poi.id} walkable`).toBe(true);
    const route=findWalkingRoute(p,poi,blocked,map.id);
    expect(route.length,`${map.id}/${poi.id} reachable, blocked=${blocked}`).toBeGreaterThan(1);
    for(let j=1;j<route.length;j++){
     const a=route[j-1],b=route[j],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/7);
     for(let k=1;k<=steps;k++){
      const ack=e.handleIntent(p.id,{actionId:`${blocked}_${poi.id}_${j}_${k}`,type:'MOVE',payload:{x:a.x+(b.x-a.x)*k/steps,y:a.y+(b.y-a.y)*k/steps}});
      expect(ack.success,`${map.id}/${poi.id}: ${ack.reason}`).toBe(true);
     }
    }
   }
  }
  for(const water of map.water){const point=water[0];if(!isWalkableForMap(map.id,point[0],point[1]))expect(e.handleIntent(p.id,{actionId:`water_${point}`,type:'MOVE',payload:{x:point[0],y:point[1]}}).success).toBe(false);}
  const guide = getMissionGuide(e.getSnapshot(), p.id);
  expect(guide.target).toBeDefined();
  expect(isWalkableForMap(map.id, guide.target!.x, guide.target!.y)).toBe(true);
 },15000);

 it.each(regional)('$name preserves region selection across co-op, disconnect and reset',map=>{
  const manager=new RoomManager(),first=manager.createRoom('FIRST',map.id),second=manager.createRoom('SECOND','hanoi');
  const a=first.engine.addPlayer('a','A'),b=first.engine.addPlayer('b','B');
  expect(first.engine.getSnapshot().mapId).toBe(map.id);expect(second.engine.getSnapshot().mapId).toBe('hanoi');
  first.engine.removeOrDisconnectPlayer(a.id);expect(first.engine.addPlayer(a.id,'A')).toBe(a);
  expect(first.engine.getSnapshot().players[b.id]).toBeDefined();
  expect(()=>manager.createRoom('FIRST','hanoi')).toThrow();
  first.engine.hostAction('RESET',first.hostToken);expect(first.engine.getSnapshot().mapId).toBe(map.id);
  expect(isWalkableForMap(map.id,a.x,a.y)).toBe(true);
 });
});

const customProvinceIds = new Set(['ha-tinh', 'ninh-binh', 'quang-ninh', 'hai-phong', 'thanh-hoa', 'nghe-an']);
const publicServiceRegional = regional.filter(m => !customProvinceIds.has(m.id));

describe.each(publicServiceRegional)('$name mission rules',map=>{
 it.each([['FIXED','REPAIR'],['FIXED','DETOUR'],['MOBILE','REPAIR'],['MOBILE','DETOUR']] as const)('%s + %s completes the academic missions with 100 points',(clinicPlan,bridgePlan)=>{
  const e=createTestEngine('REGION_SOLO','host',map.id),p=e.addPlayer('solo','Solo',true);e.startRunning();let id=0;
  const at=(target:string)=>{const q=map.points[target];p.x=q.x;p.y=q.y;};
  const send=(type:ClientIntent['type'],payload?:unknown)=>{const ack=e.handleIntent(p.id,{actionId:`solo_${++id}`,type,payload});expect(ack.success,`${type}: ${ack.reason}`).toBe(true);};
  const job=(type:JobType,targetId:string)=>{at(targetId);send('START_JOB',{type,targetId});expect(p.activeJob).not.toBeNull();e.tick(p.activeJob!.durationMs+100);};
  const deliver=(targetId:string,n:number)=>{for(let i=0;i<n;i++){at('WAREHOUSE');send('PICK_CRATE');at(targetId);send('DELIVER_CRATE',{targetId});}};
  for(const zone of ['ZONE_A','ZONE_B','ZONE_C'])job('SURVEY_ZONE',zone);
  at('HEADQUARTERS');send('PROPOSE_PLAN',{missionId:'M1',plan:clinicPlan});
  const clinics=clinicPlan==='FIXED'?['CLINIC_FIXED']:['CLINIC_MOBILE_B','CLINIC_MOBILE_C'];
  for(const clinic of clinics){deliver(clinic,2);job(clinicPlan==='FIXED'?'DEPLOY_FIXED_CLINIC':'DEPLOY_MOBILE_CLINIC',clinic);job('AUDIT_RESULT',clinic);}
  at('NOTICE_BOARD');send('PUBLISH_NOTICE',{missionId:'M1'});
  at('BRIDGE_TASK_1');expect(e.handleIntent(p.id,{actionId:'bridge_survey',type:'START_JOB',payload:{type:'SURVEY_BRIDGE',targetId:'BRIDGE'}}).success).toBe(true);at('HEADQUARTERS');send('PROPOSE_PLAN',{missionId:'M2',plan:bridgePlan});
  if(bridgePlan==='REPAIR'){deliver('BRIDGE',2);job('REPAIR_BRIDGE_1','BRIDGE_TASK_1');job('REPAIR_BRIDGE_2','BRIDGE_TASK_2');}
  deliver('ZONE_B',2);job('AUDIT_RESULT','ZONE_B');at('NOTICE_BOARD');send('PUBLISH_NOTICE',{missionId:'M2'});
  at('ZONE_C');expect(e.handleIntent(p.id,{actionId:'m3_feedback',type:'START_JOB',payload:{type:'RECEIVE_FEEDBACK_C',targetId:'ZONE_C'}}).success).toBe(true);const operating=clinicPlan==='FIXED'?'CLINIC_FIXED':'CLINIC_MOBILE_C';at(operating);expect(e.handleIntent(p.id,{actionId:'m3_cross_check',type:'START_JOB',payload:{type:'CROSS_CHECK_CLINIC',targetId:operating}}).success).toBe(true);
  at('HEADQUARTERS');send('CONFIRM_M3_PLAN');for(const citizen of ['CITIZEN_C1','CITIZEN_C2']){deliver(citizen,1);job('SUPPORT_CITIZEN',citizen);}
  job('AUDIT_LEDGER','WAREHOUSE');at('NOTICE_BOARD');send('PUBLISH_NOTICE',{missionId:'M3'});
  expect(e.phase).toBe('RESULTS');expect(e.totalScore).toBe(100);expect(e.manpower.busy).toBe(0);expect(e.getSnapshot().mapId).toBe(map.id);
  expect(e.getSnapshot().citizensServedCount).toBe(clinicPlan==='FIXED'?24:26);
  expect(e.m2.bridgeRepaired).toBe(bridgePlan==='REPAIR');
 });
});
