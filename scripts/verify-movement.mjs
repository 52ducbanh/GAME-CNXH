// Real two-client Socket.IO check at paced 60Hz; shared solver only, no engine mutation.
import {io} from 'socket.io-client';
import {findWalkingRoute,resolveMovement,inputDisplacement} from '../shared/dist/index.js';
import {writeFile} from 'node:fs/promises';
const base=process.env.PREVIEW_URL??'http://localhost:3110',roomCode=`MOVE_${Date.now().toString(36).toUpperCase()}`;
const created=await(await fetch(`${base}/api/rooms/create`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customCode:roomCode,mapId:'hanoi'})})).json();
const clients=[];let serial=0;
async function join(name,token){
  const socket=io(base,{transports:['websocket']});clients.push(socket);
  await new Promise((resolve,reject)=>{socket.once('connect',resolve);socket.once('connect_error',reject);});
  const joined=await new Promise(resolve=>{socket.once('joined_room',resolve);socket.emit('join_room',{roomCode,playerName:name,playerToken:token});});
  const client={socket,...joined,state:joined.snapshot};socket.on('room_snapshot',s=>client.state=s);return client;
}
const a=await join('Movement QA A'),b=await join('Movement QA B');
const report={base,roomCode,clients:2,method:'real Socket.IO, solver input at paced 60Hz, MOVE batches ~66ms',checks:[],packets:0,rejections:0};
async function move(p,path){
  const end=path.at(-1),ack=await new Promise(resolve=>p.socket.timeout(5000).emit('client_intent',{actionId:`moveqa_${++serial}`,type:'MOVE',payload:{...end,path,dir:'up'}},(err,ack)=>resolve(err?{success:false,reason:String(err)}:ack)));
  report.packets++;if(!ack.success){report.rejections++;throw Error(ack.reason);}return ack;
}
async function go(client,target){
  let p={...client.state.players[client.playerId]},queue=[];
  const route=findWalkingRoute(p,target,false,'hanoi');if(!route.length)throw Error('no route');
  for(const waypoint of route.slice(1)){
    let guard=0;
    while(Math.hypot(waypoint.x-p.x,waypoint.y-p.y)>.05){
      if(++guard>1000)throw Error('stuck on route');
      const dx=waypoint.x-p.x,dy=waypoint.y-p.y,d=Math.hypot(dx,dy),desired=inputDisplacement({x:dx/d,y:dy/d},Math.min(1000/60,d/180*1000));
      const result=resolveMovement('hanoi',p,desired);p=result.position;queue.push(...result.path);
      if(queue.length>=8){await move(client,queue);queue=[];}await new Promise(resolve=>setTimeout(resolve,1000/60));
    }
  }
  if(queue.length)await move(client,queue);await new Promise(resolve=>setTimeout(resolve,130));return p;
}
try{
  const beforePeer={x:b.state.players[b.playerId].x,y:b.state.players[b.playerId].y};
  await go(a,{x:452.5,y:345});
  let p={x:a.state.players[a.playerId].x,y:a.state.players[a.playerId].y};
  const contact=resolveMovement('hanoi',p,{x:6,y:0});await move(a,contact.path);
  report.checks.push({case:'tree straight contact',before:p,input:{x:1,y:0},desired:{x:6,y:0},actual:contact.position,collider:contact.contacts[0],pass:Math.abs(contact.position.x-453)<.01});
  const slide=resolveMovement('hanoi',contact.position,{x:12,y:-12});await move(a,slide.path);
  await new Promise(resolve=>setTimeout(resolve,150));
  const peerPosition=b.state.players[a.playerId];
  report.checks.push({case:'diagonal slide visible to peer',predicted:slide.position,authoritative:{x:peerPosition.x,y:peerPosition.y},pass:Math.hypot(peerPosition.x-slide.position.x,peerPosition.y-slide.position.y)<.001});
  await go(a,{x:486,y:535});
  p=a.state.players[a.playerId];const shore=resolveMovement('hanoi',p,{x:15,y:-15});await move(a,shore.path);
  report.checks.push({case:'curved shore trace accepted',pass:true,contacts:shore.contacts});
  await go(a,b.state.players[b.playerId]);
  report.checks.push({case:'peer does not hard block (both feet overlap)',pass:Math.hypot(b.state.players[a.playerId].x-beforePeer.x,b.state.players[a.playerId].y-beforePeer.y)<.05});
  const id=b.playerId;b.socket.disconnect();await new Promise(resolve=>setTimeout(resolve,200));const rejoined=await join('Movement QA B',b.playerToken);
  report.checks.push({case:'reconnect stable identity',pass:rejoined.playerId===id});
  report.pass=report.rejections===0&&report.checks.every(c=>c.pass);
  await writeFile(process.env.QA_REPORT_PATH || 'docs/movement-runtime-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(!report.pass)process.exitCode=1;
}finally{clients.forEach(socket=>socket.disconnect());}
