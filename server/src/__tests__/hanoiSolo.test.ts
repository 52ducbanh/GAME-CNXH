import { createTestEngine, serviceStateOf, rescueStateOf } from './fixtures/gameplay.js';
import {describe,it,expect} from 'vitest';
import {POINTS_OF_INTEREST,ClientIntent,JobType} from 'shared';
import {GameEngine} from '../gameEngine.js';

describe('Mobile clinic solo completion on the Hanoi layout',()=>{
 it.each(['REPAIR','DETOUR'] as const)('MOBILE + %s completes all three missions without role locks',plan=>{
  const engine=createTestEngine('MOBILE_SOLO','host'),p=engine.addPlayer('solo','Solo',true);
  engine.startRunning();let id=0;
  const at=(target:string)=>{const q=POINTS_OF_INTEREST[target];p.x=q.x;p.y=q.y;};
  const send=(type:ClientIntent['type'],payload?:any)=>{
   const ack=engine.handleIntent(p.id,{actionId:`solo_${++id}`,type,payload});expect(ack.success,`${type}: ${ack.reason}`).toBe(true);
  };
  const job=(type:JobType,targetId:string)=>{at(targetId);send('START_JOB',{type,targetId});expect(p.activeJob).not.toBeNull();engine.tick(p.activeJob!.durationMs+100);expect(p.activeJob).toBeNull();};
  const deliver=(targetId:string,n:number)=>{for(let i=0;i<n;i++){at('WAREHOUSE');send('PICK_CRATE');at(targetId);send('DELIVER_CRATE',{targetId});}};
  for(const zone of ['ZONE_A','ZONE_B','ZONE_C'])job('SURVEY_ZONE',zone);
  at('HEADQUARTERS');send('PROPOSE_PLAN',{missionId:'M1',plan:'MOBILE'});
  for(const clinic of ['CLINIC_MOBILE_B','CLINIC_MOBILE_C']){
   deliver(clinic,2);job('DEPLOY_MOBILE_CLINIC',clinic);job('AUDIT_RESULT',clinic);
  }
  at('NOTICE_BOARD');send('PUBLISH_NOTICE',{missionId:'M1'});
  expect(engine.m1.mobileBDeployed&&engine.m1.mobileCDeployed).toBe(true);
  at('BRIDGE_TASK_1');expect(engine.handleIntent(p.id,{actionId:'bridge_survey',type:'START_JOB',payload:{type:'SURVEY_BRIDGE',targetId:'BRIDGE'}}).success).toBe(true);
  at('HEADQUARTERS');send('PROPOSE_PLAN',{missionId:'M2',plan});
  if(plan==='REPAIR'){
   deliver('BRIDGE',2);job('REPAIR_BRIDGE_1','BRIDGE_TASK_1');job('REPAIR_BRIDGE_2','BRIDGE_TASK_2');
  }
  deliver('ZONE_B',2);job('AUDIT_RESULT','ZONE_B');at('NOTICE_BOARD');send('PUBLISH_NOTICE',{missionId:'M2'});
  at('ZONE_C');expect(engine.handleIntent(p.id,{actionId:'m3_feedback',type:'START_JOB',payload:{type:'RECEIVE_FEEDBACK_C',targetId:'ZONE_C'}}).success).toBe(true);
  at('CLINIC_MOBILE_C');expect(engine.handleIntent(p.id,{actionId:'m3_cross_check',type:'START_JOB',payload:{type:'CROSS_CHECK_CLINIC',targetId:'CLINIC_MOBILE_C'}}).success).toBe(true);
  at('HEADQUARTERS');send('CONFIRM_M3_PLAN');
  for(const citizen of ['CITIZEN_C1','CITIZEN_C2']){deliver(citizen,1);job('SUPPORT_CITIZEN',citizen);}
  job('AUDIT_LEDGER','WAREHOUSE');at('NOTICE_BOARD');send('PUBLISH_NOTICE',{missionId:'M3'});
  expect(engine.phase).toBe('RESULTS');expect(engine.totalScore).toBe(100);
  expect(engine.manpower.busy).toBe(0);expect(engine.resources.currentBudget).toBe(plan==='REPAIR'?25:40);
  expect(engine.getSnapshot().citizensServedCount).toBe(26);
  expect(engine.m2.bridgeRepaired).toBe(plan==='REPAIR');
 });
});
