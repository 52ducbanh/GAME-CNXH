import assert from 'node:assert/strict';
import {io} from 'socket.io-client';
import {findWalkingRoute,getGameMap} from '../shared/dist/index.js';
import {writeFile} from 'node:fs/promises';
const base=process.env.PREVIEW_URL;
if(!base||(!base.includes(':3112')&&process.env.QA_ISOLATED!=='1'))throw Error('Use the isolated input QA server at port 3112.');
const {roomCode,hostToken}=await(await fetch(base+'/api/rooms/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customCode:'INPUT_NET_'+Date.now().toString(36),mapId:'hanoi'})})).json();
let serial=0;const sockets=[];
async function join(name,token,host=false){
 const socket=io(base,{transports:['websocket']});sockets.push(socket);await new Promise((r,j)=>{socket.once('connect',r);socket.once('connect_error',j);});
 const data=await new Promise(r=>{socket.once('joined_room',r);socket.emit('join_room',{roomCode,playerName:name,playerToken:token,isHost:host,hostToken:host?hostToken:undefined});});assert.equal(data.success,true);
 let s=data.snapshot;socket.on('room_snapshot',x=>s=x);return {...data,socket,get snapshot(){return s;}};
}
const a=await join('Input QA A',undefined,true),b=await join('Input QA B');
const emit=(peer,intent)=>new Promise((resolve,reject)=>peer.socket.timeout(8000).emit('client_intent',intent,(err,ack)=>err?reject(err):resolve(ack)));
const send=(peer,type,payload)=>emit(peer,{actionId:'net_'+(++serial),type,payload});
async function command(command){await new Promise(r=>a.socket.emit('host_command',{command,hostToken},r));}
async function until(predicate){const end=Date.now()+5000;while(Date.now()<end){if(predicate())return;await new Promise(r=>setTimeout(r,30));}throw Error('Snapshot timeout');}
async function go(peer,id){
 const map=getGameMap('hanoi'),target=map.points[id],s=peer.snapshot,p=s.players[peer.playerId];
 const ctx={bridgeBlocked:s.m2.bridgeBroken&&!s.m2.bridgeRepaired,fixedDeployed:s.m1.fixedDeployed,mobileBDeployed:s.m1.mobileBDeployed,mobileCDeployed:s.m1.mobileCDeployed};
 const route=findWalkingRoute(p,target,ctx,map.id);assert.ok(route.length);
 for(const point of route){assert.equal((await send(peer,'MOVE',point)).success,true);}
 await until(()=>Math.hypot(peer.snapshot.players[peer.playerId].x-target.x,peer.snapshot.players[peer.playerId].y-target.y)<2);
}
let checks=[];
try{
 await command('START');await command('SKIP_BRIEFING');await command('SKIP_PRACTICE');
 await go(a,'WAREHOUSE');await go(b,'WAREHOUSE');assert.equal((await send(a,'PICK_CRATE')).success,true);
 await until(()=>!!a.snapshot.players[a.playerId].carriedCrateId);const crateId=a.snapshot.players[a.playerId].carriedCrateId;
 assert.equal((await send(a,'DROP_CRATE')).success,true);
 const picks=await Promise.all([send(a,'PICK_CRATE',{crateId}),send(b,'PICK_CRATE',{crateId})]);assert.equal(picks.filter(x=>x.success).length,1);checks.push('two sockets race named crate: exactly one ACK success');
 const winner=picks[0].success?a:b,loser=picks[0].success?b:a;
 await until(()=>winner.snapshot.players[winner.playerId].carriedCrateId===crateId);
 const token=winner.playerToken,id=winner.playerId;winner.socket.disconnect();await until(()=>!loser.snapshot.players[id].isOnline);
 const rejoined=await join('Rejoin QA',token,id===a.playerId);assert.equal(rejoined.playerId,id);assert.equal(rejoined.snapshot.players[id].carriedCrateId,crateId);checks.push('disconnect + reconnect preserves cargo ownership within grace');
 const repeat={actionId:'repeat_return',type:'RETURN_CRATE'};const first=await emit(rejoined,repeat);assert.equal(first.success,true);assert.deepEqual(await emit(rejoined,repeat),first);checks.push('duplicate action returns same receipt without repeated mutation');
 await go(rejoined,'ZONE_A');await go(loser,'ZONE_A');
 const job={type:'SURVEY_ZONE',targetId:'ZONE_A'},claims=await Promise.all([send(rejoined,'START_JOB',job),send(loser,'START_JOB',job)]);assert.equal(claims.filter(x=>x.success).length,1);checks.push('two sockets race same NPC objective: one reservation');
 const owner=claims[0].success?rejoined:loser;await send(owner,'CANCEL_JOB');
 const invalid=await send(loser,'START_JOB',{type:'AUDIT_RESULT',targetId:'WAREHOUSE'});assert.equal(invalid.success,false);assert.ok(invalid.reason);checks.push('server reject includes reason; invalid target cannot award progress');
 // Delay the ACK seen by a caller, then retry the exact request; not packet-loss or Wi-Fi emulation.
 const delayedIntent={actionId:'delayed_survey',type:'START_JOB',payload:job};
 const start=Date.now(),ack=await emit(loser,delayedIntent);await new Promise(r=>setTimeout(r,350));assert.equal(ack.success,true);assert.deepEqual(await emit(loser,delayedIntent),ack);
 checks.push('350ms delayed ACK consumption + duplicate retry remains idempotent');
 const report={base,roomCode,method:'real Socket.IO two-player disposable room; artificial ACK-consumer delay, not physical LAN latency',checks,delayedAckMs:Date.now()-start,pass:true};
 await writeFile(process.env.QA_REPORT_PATH || 'docs/input-multiplayer-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}finally{sockets.forEach(s=>s.disconnect());}
