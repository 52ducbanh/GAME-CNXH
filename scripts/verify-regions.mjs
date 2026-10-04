// Exercises the real HTTP / Socket.IO server in new disposable local rooms.
// No engine mutation, timer shortcut, DOM mutation, or teleport to blocked tiles.
import {io} from 'socket.io-client';
import {GAME_MAPS,findWalkingRoute,getMapFootprints,isWalkableForMap} from '../shared/dist/index.js';
import {writeFile,readFile} from 'node:fs/promises';
const base=process.env.PREVIEW_URL||'http://localhost:3102';
const reportPrefix=process.env.QA_REPORT_PREFIX||'regions';
const stamp=Date.now().toString(36).toUpperCase();
async function verify(map,index){
 const response=await fetch(`${base}/api/rooms/create`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customCode:`QA_${index}_${stamp}`,mapId:map.id})});
 if(!response.ok)throw Error(`create ${map.id}: ${response.status}`);
 const {roomCode,hostToken}=await response.json();
 const metadata=await(await fetch(`${base}/api/rooms/${roomCode}`)).json();if(metadata.mapId!==map.id)throw Error('Room-map mismatch');
 let s,serial=0,routes=0,rejectedCollisionProbes=0,deploymentChecks=[];const sockets=[];
 async function connect(name,token,isHost=false){
  const socket=io(base,{transports:['websocket']});sockets.push(socket);
  await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
  const joined=await new Promise(resolve=>{socket.once('joined_room',resolve);socket.emit('join_room',{roomCode,playerName:name,playerToken:token,isHost,hostToken:isHost?hostToken:undefined});});
  let latest=joined.snapshot;socket.on('room_snapshot',state=>{s=state;latest=state;});s=joined.snapshot;if(s.mapId!==map.id)throw Error('Socket-map mismatch');return {socket,...joined,get currentSnapshot(){return latest;}};
 }
 const main=await connect('Đức · Kiểm tra',undefined,true);
 async function command(command){const ack=await new Promise(r=>main.socket.timeout(8000).emit('host_command',{command,hostToken},(err,a)=>r(err?{success:false,reason:'timeout'}:a)));if(!ack.success)throw Error(`${command}: ${ack.reason}`);}
 async function intent(type,payload,who=main){const ack=await new Promise(r=>who.socket.timeout(8000).emit('client_intent',{actionId:`qa_${++serial}`,type,payload},(err,a)=>r(err?{success:false,reason:'timeout'}:a)));if(!ack.success)throw Error(`${map.id} ${type}: ${ack.reason}`);}
 async function until(predicate,timeout=16000){const start=Date.now();while(!predicate(s)){if(Date.now()-start>timeout)throw Error(`${map.id} snapshot timeout`);await new Promise(r=>setTimeout(r,50));}}
 async function go(targetId,who=main){
  const target=typeof targetId==='string'?map.points[targetId]:targetId,route=findWalkingRoute(s.players[who.playerId],target,{bridgeBlocked:s.m2.bridgeBroken&&!s.m2.bridgeRepaired,fixedDeployed:s.m1.fixedDeployed,mobileBDeployed:s.m1.mobileBDeployed,mobileCDeployed:s.m1.mobileCDeployed},map.id);
  if(!route.length)throw Error(`${map.id} no route to ${targetId}`);
  for(const q of route.slice(1))await intent('MOVE',{x:q.x,y:q.y,dir:'down'},who);
  routes++;await until(state=>Math.hypot(state.players[who.playerId].x-target.x,state.players[who.playerId].y-target.y)<=0.05);
 }
 async function job(type,targetId){await go(targetId);await intent('START_JOB',{type,targetId});await until(state=>!!state.players[main.playerId].activeJob);await until(state=>!state.players[main.playerId].activeJob);}
 async function deliver(targetId,n){for(let i=0;i<n;i++){await go('WAREHOUSE');await intent('PICK_CRATE');await go(targetId);await intent('DELIVER_CRATE',{targetId});}}
 const m1Plan=index%2?'MOBILE':'FIXED',m2Plan=index%2?'DETOUR':'REPAIR';
 try{
  for(const cmd of ['START','SKIP_BRIEFING','SKIP_PRACTICE','RESUME'])await command(cmd);
  if(reportPrefix==='collision'){
   const cases={'hanoi':[[1030,860],[1144,729]],'hai-phong':[[1345,280],[625,480],[625,310]],'quang-ninh':[[735,565]],'ninh-binh':[[855,660]],'thanh-hoa':[[1085,570]],'nghe-an':[[1075,515]],'ha-tinh':[[1340,645]]};
   for(const [x,y] of cases[map.id]){const ack=await new Promise(r=>main.socket.timeout(8000).emit('client_intent',{actionId:`reject_${++serial}`,type:'MOVE',payload:{x,y}},(err,a)=>r(err?{success:true}:a)));if(ack.success)throw Error(`${map.id}: collision probe accepted ${x},${y}`);rejectedCollisionProbes++;}
  }
  console.log(`${map.name}: running ${m1Plan}/${m2Plan}, ${base}/play/${roomCode}`);
  for(const zone of ['ZONE_A','ZONE_B','ZONE_C'])await job('SURVEY_ZONE',zone);
  await go('HEADQUARTERS');await intent('PROPOSE_PLAN',{missionId:'M1',plan:m1Plan});
  const observer=reportPrefix==='collision'?await connect('Quan sát công trình'):null;
  for(const clinic of m1Plan==='FIXED'?['CLINIC_FIXED']:['CLINIC_MOBILE_B','CLINIC_MOBILE_C']){await deliver(clinic,2);let overlapStart=null;if(observer&&(m1Plan==='MOBILE'||map.id==='hanoi')){const wall=getMapFootprints(map.id,{fixedDeployed:true,mobileBDeployed:true,mobileCDeployed:true}).find(f=>f.id===`${map.id}:${clinic}:rear`);const q={x:wall.x+wall.width/2,y:wall.y+wall.height/2};const ctx={fixedDeployed:s.m1.fixedDeployed,mobileBDeployed:s.m1.mobileBDeployed,mobileCDeployed:s.m1.mobileCDeployed};if(isWalkableForMap(map.id,q.x,q.y,ctx)){await go(q,observer);overlapStart=q;}}await job(m1Plan==='FIXED'?'DEPLOY_FIXED_CLINIC':'DEPLOY_MOBILE_CLINIC',clinic);if(observer){const flag=clinic==='CLINIC_FIXED'?'fixedDeployed':clinic==='CLINIC_MOBILE_B'?'mobileBDeployed':'mobileCDeployed';await until(()=>observer.currentSnapshot.m1[flag]&&main.currentSnapshot.m1[flag]);const seen=observer.currentSnapshot,p=seen.players[observer.playerId],ctx={fixedDeployed:seen.m1.fixedDeployed,mobileBDeployed:seen.m1.mobileBDeployed,mobileCDeployed:seen.m1.mobileCDeployed};if(!isWalkableForMap(map.id,p.x,p.y,ctx))throw Error('Observer remains inside new footprint');if(overlapStart&&Math.hypot(p.x-overlapStart.x,p.y-overlapStart.y)>96)throw Error('Recovery exceeded local bound');deploymentChecks.push({clinic,bothClientsSawDeployment:true,overlapRecovered:!!overlapStart,position:{x:p.x,y:p.y}});}await job('AUDIT_RESULT',clinic);}
  if(observer){observer.socket.disconnect();await until(state=>Object.values(state.players).filter(p=>p.isOnline).length===1);}
  await go('NOTICE_BOARD');await intent('PUBLISH_NOTICE',{missionId:'M1'});await until(state=>state.m2.status==='ACTIVE');
  await go('BRIDGE_TASK_1');await intent('START_JOB',{type:'SURVEY_BRIDGE',targetId:'BRIDGE'});await go('HEADQUARTERS');await intent('PROPOSE_PLAN',{missionId:'M2',plan:m2Plan});
  if(m2Plan==='REPAIR'){await deliver('BRIDGE',2);await job('REPAIR_BRIDGE_1','BRIDGE_TASK_1');await job('REPAIR_BRIDGE_2','BRIDGE_TASK_2');}
  await deliver('ZONE_B',2);await job('AUDIT_RESULT','ZONE_B');await go('NOTICE_BOARD');await intent('PUBLISH_NOTICE',{missionId:'M2'});
  await go('ZONE_C');await intent('START_JOB',{type:'RECEIVE_FEEDBACK_C',targetId:'ZONE_C'});
  const clinic=m1Plan==='FIXED'?'CLINIC_FIXED':'CLINIC_MOBILE_C';await go(clinic);await intent('START_JOB',{type:'CROSS_CHECK_CLINIC',targetId:clinic});await go('HEADQUARTERS');await intent('CONFIRM_M3_PLAN');
  for(const citizen of ['CITIZEN_C1','CITIZEN_C2']){await deliver(citizen,1);await job('SUPPORT_CITIZEN',citizen);}
  await job('AUDIT_LEDGER','WAREHOUSE');
  const peer=await connect('Ninh · Đồng đội');await go('WAREHOUSE',peer);await intent('PICK_CRATE',undefined,peer);await until(state=>!!state.players[peer.playerId].carriedCrateId);
  const cargo=s.players[peer.playerId].carriedCrateId;peer.socket.disconnect();
  const rejoined=await connect('Ninh · Đồng đội',peer.playerToken);if(rejoined.playerId!==peer.playerId||s.players[peer.playerId].carriedCrateId!==cargo)throw Error('Reconnect lost cargo');
  await intent('RETURN_CRATE',undefined,rejoined);await go('ZONE_B',rejoined);
  await command('PAUSE');const report={mapId:map.id,name:map.name,roomCode,roomUrl:`${base}/play/${roomCode}`,m1Plan,m2Plan,routes,rejectedCollisionProbes,deploymentChecks,stage:'visual-ready',score:s.totalScore,peerReconnect:true,bridgeRepaired:s.m2.bridgeRepaired,snapshot:s};
  await writeFile(`docs/${reportPrefix}-${map.id}-runtime-qa.json`,JSON.stringify(report,null,2));console.log(`${map.name}: visual-ready (${s.totalScore} points)`);
  // Give the screenshot pass an existing, stable room without changing its state.
  if(process.env.QA_HOLD==='1'){
   const {access}=await import('node:fs/promises');while(true){try{await access('docs/regions-qa-continue.signal');break;}catch{await new Promise(r=>setTimeout(r,500));}}
  }
  await command('RESUME');await go('NOTICE_BOARD');await intent('PUBLISH_NOTICE',{missionId:'M3'});await until(state=>state.phase==='RESULTS');
  if(s.totalScore!==100||s.mapId!==map.id)throw Error(`Final result ${s.totalScore}/${s.mapId}`);
  const final={...report,stage:'Complete',score:s.totalScore,phase:s.phase,routes,snapshot:s};await writeFile(`docs/${reportPrefix}-${map.id}-runtime-qa.json`,JSON.stringify(final,null,2));
  console.log(`PASS ${map.name}: 100 points, ${routes} routes, cargo reconnect and synchronized co-op.`);return final;
 }finally{sockets.forEach(socket=>socket.disconnect());}
}
const selected=GAME_MAPS.filter(m=>(process.env.QA_INCLUDE_HANOI==='1'||m.id!=='hanoi')&&(!process.env.QA_MAP||m.id===process.env.QA_MAP));
const results=await Promise.allSettled(selected.map(map=>verify(map,GAME_MAPS.findIndex(m=>m.id===map.id)-1)));
let summary=results.map((r,i)=>r.status==='fulfilled'?{...r.value,snapshot:undefined}:{mapId:selected[i].id,error:String(r.reason)});
if(process.env.QA_MAP){try{const old=JSON.parse(await readFile(`docs/${reportPrefix}-runtime-qa.json`,'utf8'));summary=[...old.filter(r=>!selected.some(m=>m.id===r.mapId)),...summary].sort((a,b)=>GAME_MAPS.findIndex(m=>m.id===a.mapId)-GAME_MAPS.findIndex(m=>m.id===b.mapId));}catch{}}
await writeFile(`docs/${reportPrefix}-runtime-qa.json`,JSON.stringify(summary,null,2));
for(const r of results)if(r.status==='rejected')console.error(r.reason);
if(results.some(r=>r.status==='rejected'))process.exitCode=1;
