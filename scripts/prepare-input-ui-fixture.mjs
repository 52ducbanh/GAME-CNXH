import {io} from 'socket.io-client';
import {findWalkingRoute,getGameMap} from '../shared/dist/index.js';
const base='http://127.0.0.1:3112',roomCode='INPUT_UI_QA';
const socket=io(base,{transports:['websocket']});await new Promise(r=>socket.once('connect',r));
const data=await new Promise(r=>{socket.once('joined_room',r);socket.emit('join_room',{roomCode,playerName:'Fixture vật tư UI'});});
let snapshot=data.snapshot;socket.on('room_snapshot',s=>snapshot=s);let serial=0;
const intent=(type,payload)=>new Promise((r,j)=>socket.timeout(8000).emit('client_intent',{actionId:'fixture_'+Date.now()+'_'+(++serial),type,payload},(err,a)=>err?j(err):a.success?r(a):j(Error(a.reason))));
const map=getGameMap('hanoi'),target=Object.values(snapshot.players).find(p=>p.id!==data.playerId&&p.isOnline);
if(!target)throw Error('Open the INPUT_UI_QA browser tab first.');
async function go(point){const route=findWalkingRoute(snapshot.players[data.playerId],point,false,'hanoi');for(const p of route)await intent('MOVE',p);await new Promise(r=>setTimeout(r,150));}
try{await go(map.points.WAREHOUSE);await intent('PICK_CRATE');await go(target);await intent('DROP_CRATE');console.log('Placed a real crate beside the browser QA player through validated MOVE/pick/drop intents.');}
finally{socket.disconnect();}
