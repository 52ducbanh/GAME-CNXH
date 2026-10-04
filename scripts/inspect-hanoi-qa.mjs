// Read-only snapshot observer, restricted to disposable local art/QA rooms.
import {io} from 'socket.io-client';
const [roomCode]=process.argv.slice(2);
if(!/^(ART_|V2_)/.test(roomCode||''))throw Error('Expected a disposable QA room');
const socket=io(process.env.PREVIEW_URL||'http://localhost:3100',{transports:['websocket']});
await new Promise((r,j)=>{socket.once('connect',r);socket.once('connect_error',j);});
const joined=await new Promise(r=>{socket.once('joined_room',r);socket.emit('join_room',{roomCode,playerName:'Snapshot observer',isHost:true,isSpectator:true});});
console.log(JSON.stringify({roomCode,phase:joined.snapshot.phase,isPaused:joined.snapshot.isPaused,
 players:Object.values(joined.snapshot.players).filter(p=>p.isOnline).map(({name,x,y})=>({name,x,y}))}));
socket.disconnect();
