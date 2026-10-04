import { createGame } from '../client/src/game/phaserGame.js';
import { getGameMap, isWalkableForMap } from 'shared';
declare const QA_FIXTURES: Record<string, any>;
declare const QA_VARIANT: string;
const selected=new URLSearchParams(location.search).get('map')||'hanoi';
const select=document.querySelector<HTMLSelectElement>('#map')!;select.value=selected;
select.onchange=()=>{location.href=`?map=${select.value}`;};
const state=structuredClone(QA_FIXTURES[selected]);
const local=state.players.local,remote=state.players.remote;
remote.x=local.x+40;remote.y=local.y+20;
let subscriber:(s:any)=>void=()=>{};
const socket:any={getPlayerId:()=>local.id,getStatus:()=> 'CONNECTED',onJoined:()=>()=>{},onConnectionStatusChange:()=>()=>{},
  onSnapshot:(fn:any)=>{subscriber=fn;return()=>{};},sendIntent:async(intent:any)=>{
    if(intent.type==='MOVE'){await sleep(30);Object.assign(local,{x:intent.payload.x,y:intent.payload.y,direction:intent.payload.dir});}
    return {success:true,actionId:intent.actionId};
  }};
const game=createGame('game-container',socket,selected as any);
const sleep=(ms:number)=>new Promise(resolve=>setTimeout(resolve,ms));
let scene:any, busy=false;
const metrics=document.querySelector('#metrics')!,results=document.querySelector('#results')!,status=document.querySelector('#status')!;
let record:MediaRecorder|null=null;
document.querySelector<HTMLButtonElement>('#record')!.onclick=()=>{
  if(record?.state==='recording'){record.stop();return;}
  const canvas=document.querySelector('canvas')!;const chunks:Blob[]=[];
  record=new MediaRecorder(canvas.captureStream(30),{mimeType:'video/webm'});
  record.ondataavailable=e=>chunks.push(e.data);
  record.onstop=()=>{const link=document.createElement('a');link.href=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));link.download=`character-${QA_VARIANT}-${selected}.webm`;link.textContent='Tải video QA';document.querySelector('#qa-controls')!.appendChild(link);};
  record.start();
};
function report(checks:any){results.textContent=JSON.stringify({variant:QA_VARIANT,map:selected,checks},null,2);status.textContent='Hoàn tất';busy=false;}
function warp(x:number,y:number){Object.assign(local,{x,y});scene.reconcileNext=true;subscriber(structuredClone(state));}
async function start(){if(busy)return false;busy=true;status.textContent='Đang chạy';scene.controls.reset();return true;}
document.querySelector<HTMLButtonElement>('#map-toggle')!.onclick=()=>scene.toggleOverview();
document.querySelector<HTMLButtonElement>('#compact')!.onclick=()=>document.querySelector('#qa-controls')!.classList.toggle('compact');
document.querySelector<HTMLButtonElement>('#route')!.onclick=async()=>{
  if(!await start())return;
  const map=getGameMap(selected as any);warp(map.spawn.x,map.spawn.y);
  const checks=[];
  // Hold real keyboard events through the single InputController.
  for(const codes of [['KeyD'],['KeyA'],['KeyW','KeyD'],['KeyS','KeyA'],['KeyD','ShiftLeft']]){
    const c=scene.localPlayerSprite,before={x:c.x,y:c.y};
    codes.forEach(code=>window.dispatchEvent(new KeyboardEvent('keydown',{code})));
    await sleep(500);
    checks.push({codes,distance:Math.hypot(c.x-before.x,c.y-before.y),direction:c.getData('direction'),animation:c.getByName('body').anims.isPlaying,timeScale:c.getByName('body').anims.timeScale,overview:scene.overview});
    codes.forEach(code=>window.dispatchEvent(new KeyboardEvent('keyup',{code})));
    await sleep(220);
    checks.push({idle:true,animation:c.getByName('body').anims.isPlaying,depthMatchesFeet:c.depth===c.y});
  }
  report(checks);
};
document.querySelector<HTMLButtonElement>('#remote')!.onclick=async()=>{
  if(!await start())return;
  const map=getGameMap(selected as any);warp(map.spawn.x,map.spawn.y);
  Object.assign(remote,{x:local.x+40,y:local.y+20,direction:'right'});scene.remoteMotion?.clear();subscriber(structuredClone(state));await sleep(250);
  const checks=[];
  for(let i=0;i<10;i++){remote.x+=18;remote.direction='right';subscriber(structuredClone(state));await sleep(100);}
  remote.y+=18;remote.direction='down';subscriber(structuredClone(state));
  await sleep(50);const c=scene.otherPlayerSprites.get('remote');
  checks.push({case:'turn',direction:c.getData('direction'),position:{x:c.x,y:c.y}});
  await sleep(140);
  checks.push({case:'idle190ms',animation:c.getByName('body').anims.isPlaying,error:Math.hypot(c.x-remote.x,c.y-remote.y)});
  await sleep(500);
  // A correction should immediately resort the actor at the authoritative feet.
  warp(local.x,local.y+80);checks.push({case:'correction',depth:scene.localPlayerSprite.depth,footY:scene.localPlayerSprite.y});
  report(checks);
};
document.querySelector<HTMLButtonElement>('#occlusion')!.onclick=async()=>{
  if(!await start())return;
  // Visual fixture at the clinic, no mission progress is invented in production.
  if(selected==='hanoi'){state.m1.fixedDeployed=true;state.m1.mobileBDeployed=true;state.m1.mobileCDeployed=true;}
  const map=getGameMap(selected as any);
  const points=selected==='hanoi'?[[318,220],[490,400],[1505,420],[298,490],[433,440]]:[[map.spawn.x,map.spawn.y],[map.spawn.x+30,map.spawn.y+20]];
  const checks=[];
  for(const [x,y] of points){
    if(!isWalkableForMap(selected as any,x,y))continue;
    warp(x,y);await sleep(350);
    const c=scene.localPlayerSprite,body=c.getByName('body');
    const layers=scene.children.list.filter((o:any)=>o.mask).map((o:any)=>({key:o.texture?.key,alpha:o.alpha,depth:o.depth}));
    checks.push({x,y,bodyBottom:body.y-body.displayOriginY+46,depth:c.depth,nameLayer:c.getData('overlay')?.depth??c.depth,layers});
  }
  report(checks);
};
game.events.once('hanoi-ready',()=>{
  scene=game.scene.getScene('MainScene');subscriber(structuredClone(state));
  status.textContent='Sẵn sàng';
  setInterval(()=>subscriber(structuredClone(state)),100);
  scene.events.on('postupdate',()=>{
    const c=scene.localPlayerSprite;if(!c)return;
    const body=c.getByName('body'),camera=scene.cameras.main;
    const layers=scene.children.list.filter((o:any)=>o.mask).map((o:any)=>({key:o.texture?.key,alpha:Number(o.alpha.toFixed(3)),depth:o.depth}));
    metrics.textContent=JSON.stringify({x:Number(c.x.toFixed(2)),y:Number(c.y.toFixed(2)),direction:c.getData('direction'),playing:body.anims.isPlaying,
      frame:body.frame.name,bodyBottom:body.y-body.displayOriginY+46,depth:c.depth,overview:scene.overview,
      camera:{roundPixels:camera.roundPixels,scrollX:Number(camera.scrollX.toFixed(3)),scrollY:Number(camera.scrollY.toFixed(3)),zoom:camera.zoom,
        followOffsetY:camera.followOffset.y,screenFootY:(c.y-camera.scrollY-camera.height/2)*camera.zoom+camera.height/2},layers:layers.filter((l:any)=>l.alpha<1)},null,2);
  });
});
