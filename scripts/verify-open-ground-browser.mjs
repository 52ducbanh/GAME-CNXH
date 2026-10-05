// Disposable QA only: rendered game, physical browser keys and real socket MOVE.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { io } from 'socket.io-client';
import { GAME_MAPS, findWalkingRoute, getProvinceWorldState, resolveMovement } from '../shared/dist/index.js';

assert.equal(process.env.QA_ISOLATED,'1','Use a disposable QA server.');
const base=process.env.PREVIEW_URL;
assert.ok(base,'Set PREVIEW_URL.');
const out=path.resolve(process.env.QA_REPORT_DIR||'client/dist-collision-all-ground/qa');
await mkdir(out,{recursive:true});
const {chromium}=await import(process.env.UI_QA_PLAYWRIGHT_PATH?pathToFileURL(process.env.UI_QA_PLAYWRIGHT_PATH).href:'playwright');
const browser=await chromium.launch({channel:'chrome',headless:true});
const checks=[],sockets=[],errors=[];
let serial=0;
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(predicate,label){const end=Date.now()+15000;while(!predicate()){assert.ok(Date.now()<end,label);await sleep(50);}}
const targets={hanoi:{x:400,y:500},'hai-phong':{x:760,y:550},'ha-tinh':{x:950,y:510},'quang-ninh':{x:400,y:600},'ninh-binh':{x:760,y:305},'thanh-hoa':{x:900,y:535},'nghe-an':{x:600,y:520}};
try {
 for(const map of GAME_MAPS){
  const created=await fetch(base+'/api/rooms/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mapId:map.id})});
  assert.equal(created.status,200);const room=await created.json();
  const socket=io(base,{transports:['websocket']});sockets.push(socket);
  await new Promise((res,rej)=>{socket.once('connect',res);socket.once('connect_error',rej);});
  const joined=await new Promise(res=>{socket.once('joined_room',res);socket.emit('join_room',{roomCode:room.roomCode,playerName:'QA route',isHost:true,hostToken:room.hostToken});});
  assert.equal(joined.success,true);let snapshot=joined.snapshot;
  socket.on('room_snapshot',s=>snapshot=s);
  for(const command of ['START','SKIP_BRIEFING','SKIP_PRACTICE']){
   const ack=await new Promise((res,rej)=>socket.timeout(8000).emit('host_command',{command,hostToken:room.hostToken},(err,a)=>err?rej(err):res(a)));
   assert.equal(ack.success,true,ack.reason);
  }
  await until(()=>snapshot.phase==='RUNNING','RUNNING');
  const context=await browser.newContext({viewport:{width:1440,height:900}}),page=await context.newPage();
  page.on('pageerror',error=>errors.push({mapId:map.id,message:error.message}));
  await page.goto(base+'/play/'+room.roomCode);
  await page.locator('#hud-view').waitFor({state:'visible'});
  await page.waitForFunction(()=>document.querySelector('#game-container canvas')?.width>0);
  await until(()=>Object.values(snapshot.players).some(p=>p.id!==joined.playerId&&p.isOnline),'browser player joined');
  const uiPlayer=Object.values(snapshot.players).find(p=>p.id!==joined.playerId&&p.isOnline);
  await sleep(500);
  const before={x:snapshot.players[uiPlayer.id].x,y:snapshot.players[uiPlayer.id].y};
  const state=getProvinceWorldState(snapshot);
  const directions=[['ArrowRight',72,0],['ArrowLeft',-72,0],['ArrowDown',0,72],['ArrowUp',0,-72]];
  const direction=directions.map(([key,x,y])=>({key,result:resolveMovement(map.id,before,{x,y},state)})).sort((a,b)=>b.result.distance-a.result.distance)[0];
  await page.keyboard.down(direction.key);await sleep(550);await page.keyboard.up(direction.key);await sleep(300);
  const after={x:snapshot.players[uiPlayer.id].x,y:snapshot.players[uiPlayer.id].y};
  assert.ok(Math.hypot(after.x-before.x,after.y-before.y)>15,`${map.id}: browser held-key movement`);
  const target=targets[map.id],route=findWalkingRoute(snapshot.players[joined.playerId],target,getProvinceWorldState(snapshot),map.id);
  assert.ok(route.length>1,`${map.id}: socket route to open ground`);
  for(const q of route.slice(1)){
   const ack=await new Promise((res,rej)=>socket.timeout(8000).emit('client_intent',{actionId:`ground_${++serial}`,type:'MOVE',payload:q},(err,a)=>err?rej(err):res(a)));
   assert.equal(ack.success,true,`${map.id}: ${ack.reason}`);
  }
  await until(()=>Math.hypot(snapshot.players[joined.playerId].x-target.x,snapshot.players[joined.playerId].y-target.y)<1,'open target snapshot');
  await page.keyboard.press('m');await sleep(300);
  await page.screenshot({path:path.join(out,`${map.id}-browser.png`),fullPage:true});
  const check={mapId:map.id,keyboardDistance:Math.hypot(after.x-before.x,after.y-before.y),socketRouteSegments:route.length-1,target,screenshot:`${map.id}-browser.png`,pass:true};
  checks.push(check);console.log(JSON.stringify(check));
  await context.close();socket.disconnect();
 }
 assert.equal(errors.length,0,JSON.stringify(errors));
 const report={method:'isolated production bundle; 7 Chrome pages with held arrow key; real teammate sockets route to new open ground; no engine or scene mutation',checks,pageErrors:errors,pass:true};
 await writeFile(path.join(out,'open-ground-browser.json'),JSON.stringify(report,null,2));
} finally {sockets.forEach(s=>s.disconnect());await browser.close();}
