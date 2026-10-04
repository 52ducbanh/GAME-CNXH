// Real Socket.IO acceptance test. Creates its own disposable local room; never
// edits another room or bypasses the game's jobs, voting or movement checks.
import {io} from 'socket.io-client';
import {POINTS_OF_INTEREST as POI,findWalkingRoute} from '../shared/dist/index.js';
import {writeFile,access,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const base=process.env.PREVIEW_URL||'http://localhost:3100';
const signal=join(tmpdir(),'hanoi-v2-qa-continue');
const m1Plan=process.env.QA_M1||'FIXED',m2Plan=process.env.QA_M2||'REPAIR';
const captureAt=process.env.QA_CAPTURE||'M3';
const reportFile=process.env.QA_REPORT||'docs/hanoi-v2-runtime-qa.json';
let report;
try{await unlink(signal);}catch{}
const response=await fetch(`${base}/api/rooms/create`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customCode:`V2_${Date.now().toString(36).toUpperCase()}`})});
const {roomCode,hostToken}=await response.json();
let s,player,id=0,routeCount=0;
async function connect(name,token,isHost=false){
 const socket=io(base,{transports:['websocket']});
 await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
 const result=await new Promise(resolve=>{socket.once('joined_room',resolve);socket.emit('join_room',{roomCode,playerName:name,playerToken:token,isHost,hostToken:isHost?hostToken:undefined});});
 socket.on('room_snapshot',snapshot=>{s=snapshot;});s=result.snapshot;
 return {socket,...result};
}
const main=await connect('Đức · QA',undefined,true);player=main.playerId;
async function command(command){const ack=await new Promise(resolve=>main.socket.emit('host_command',{command,hostToken},resolve));if(!ack.success)throw Error(ack.reason);}
async function intent(type,payload,socket=main.socket){
 const ack=await new Promise(resolve=>socket.emit('client_intent',{actionId:`qa_${++id}`,type,payload},resolve));
 if(!ack.success)throw Error(`${type}: ${ack.reason}`);return ack;
}
async function until(predicate,timeout=15000){
 const started=Date.now();while(!predicate(s)){if(Date.now()-started>timeout)throw Error('Snapshot timeout');await new Promise(r=>setTimeout(r,60));}
}
async function go(targetId,who=main){
 const p=s.players[who.playerId],target=POI[targetId];
 const end=targetId==='BRIDGE'&&s.m2.bridgeBroken&&!s.m2.bridgeRepaired?{x:target.x-70,y:target.y}:target;
 const route=findWalkingRoute(p,end,s.m2.bridgeBroken&&!s.m2.bridgeRepaired);
 if(!route.length)throw Error(`No route: ${targetId}`);
 for(const q of route.slice(1))await intent('MOVE',{...q,dir:'down'},who.socket);
 routeCount++;
 await until(state=>Math.hypot(state.players[who.playerId].x-target.x,state.players[who.playerId].y-target.y)<=target.radius);
}
async function job(type,targetId){await go(targetId);await intent('START_JOB',{type,targetId});await until(state=>!!state.players[player].activeJob);await until(state=>!state.players[player].activeJob);}
async function deliver(targetId,count){for(let i=0;i<count;i++){await go('WAREHOUSE');await intent('PICK_CRATE');await go(targetId);await intent('DELIVER_CRATE',{targetId});}}
for(const cmd of ['START','SKIP_BRIEFING','SKIP_PRACTICE','RESUME'])await command(cmd);
console.log('Solo room:',`${base}/play/${roomCode}`);
for(const zone of ['ZONE_A','ZONE_B','ZONE_C'])await job('SURVEY_ZONE',zone);
await go('HEADQUARTERS');await intent('PROPOSE_PLAN',{missionId:'M1',plan:m1Plan});
if(m1Plan==='FIXED'){
 await deliver('CLINIC_FIXED',2);await job('DEPLOY_FIXED_CLINIC','CLINIC_FIXED');await job('AUDIT_RESULT','CLINIC_FIXED');
}else{
 for(const clinic of ['CLINIC_MOBILE_B','CLINIC_MOBILE_C']){await deliver(clinic,2);await job('DEPLOY_MOBILE_CLINIC',clinic);await job('AUDIT_RESULT',clinic);}
}
if(captureAt==='M1')await capture('M1');
await go('NOTICE_BOARD');await intent('PUBLISH_NOTICE',{missionId:'M1'});await until(state=>state.m2.status==='ACTIVE');
console.log('M1 clinic deployed and verified; bridge broken.');
if(captureAt==='M2')await capture('M2');
await go('BRIDGE_TASK_1');await intent('START_JOB',{type:'SURVEY_BRIDGE',targetId:'BRIDGE'});
await go('HEADQUARTERS');await intent('PROPOSE_PLAN',{missionId:'M2',plan:m2Plan});
if(m2Plan==='REPAIR'){await deliver('BRIDGE',2);await job('REPAIR_BRIDGE_1','BRIDGE_TASK_1');await job('REPAIR_BRIDGE_2','BRIDGE_TASK_2');}
await deliver('ZONE_B',2);await job('AUDIT_RESULT','ZONE_B');await go('NOTICE_BOARD');await intent('PUBLISH_NOTICE',{missionId:'M2'});
console.log('M2 relief verified:',m2Plan);
await go('ZONE_C');await intent('START_JOB',{type:'RECEIVE_FEEDBACK_C',targetId:'ZONE_C'});
await go(m1Plan==='MOBILE'?'CLINIC_MOBILE_C':'CLINIC_FIXED');await intent('START_JOB',{type:'CROSS_CHECK_CLINIC',targetId:m1Plan==='MOBILE'?'CLINIC_MOBILE_C':'CLINIC_FIXED'});
await go('HEADQUARTERS');await intent('CONFIRM_M3_PLAN');
for(const target of ['CITIZEN_C1','CITIZEN_C2']){await deliver(target,1);await job('SUPPORT_CITIZEN',target);}
await job('AUDIT_LEDGER','WAREHOUSE');
// Second live player: shared cargo snapshot, token reconnect and return stock.
const peer=await connect('Ninh · QA');await go('WAREHOUSE',peer);await intent('PICK_CRATE',undefined,peer.socket);
await until(state=>!!state.players[peer.playerId].carriedCrateId);
const cargo=s.players[peer.playerId].carriedCrateId;peer.socket.disconnect();
const rejoined=await connect('Ninh · QA',peer.playerToken);
if(rejoined.playerId!==peer.playerId||s.players[peer.playerId].carriedCrateId!==cargo)throw Error('Reconnect lost cargo');
await intent('RETURN_CRATE',undefined,rejoined.socket);await until(state=>!state.players[peer.playerId].carriedCrateId);
await go('ZONE_B',rejoined);await go(m1Plan==='MOBILE'?'CLINIC_MOBILE_C':'CLINIC_FIXED');
if(captureAt==='M3')await capture('M3');
async function capture(stage){
 await command('PAUSE');
 report={roomUrl:`${base}/play/${roomCode}`,roomCode,stage:`Capture ${stage}`,routes:routeCount,m1:s.m1,m2:s.m2,m3:s.m3,score:s.totalScore};
 await writeFile(reportFile,JSON.stringify(report,null,2));
 console.log('Capture-ready:',report.roomUrl);console.log('To finish QA, create:',signal);
 while(true){try{await access(signal);break;}catch{await new Promise(r=>setTimeout(r,300));}}
 await unlink(signal);await command('RESUME');
}
await command('RESUME');await go('NOTICE_BOARD');await intent('PUBLISH_NOTICE',{missionId:'M3'});await until(state=>state.phase==='RESULTS');
if(s.totalScore!==100)throw Error(`Score ${s.totalScore}`);
await writeFile(reportFile,JSON.stringify({...report,stage:'Complete',routes:routeCount,m1:s.m1,m2:s.m2,m3:s.m3,score:s.totalScore,phase:s.phase,resources:s.resources,peerReconnect:true},null,2));
console.log('PASS: solo all 3 missions, 100 points, all routes acknowledged; two clients synchronized; reconnect retained cargo.');
main.socket.disconnect();rejoined.socket.disconnect();

