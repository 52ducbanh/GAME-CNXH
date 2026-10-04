import { io } from 'socket.io-client';
const base=process.env.PREVIEW_URL||'http://localhost:3100';
const response=await fetch(`${base}/api/rooms/create`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({customCode:`ART_${Date.now().toString(36).toUpperCase()}`})});
const {roomCode,hostToken}=await response.json();
const host=io(base,{transports:['websocket']});
await new Promise((resolve,reject)=>{host.on('connect',resolve);host.on('connect_error',reject);});
const joined=new Promise(resolve=>host.once('joined_room',resolve));
host.emit('join_room',{roomCode,playerName:'Visual QA',isHost:true,isSpectator:true,hostToken});await joined;
for(const command of ['START','SKIP_BRIEFING','SKIP_PRACTICE']){
 const ack=await new Promise(resolve=>host.emit('host_command',{command,hostToken},resolve));
 if(!ack?.success)throw new Error(`Preview command failed: ${command}`);
}
console.log(`Preview ready: ${base}/play/${roomCode}`);
console.log('When a player joins, resume from the Host panel if the empty-room timer paused.');
host.disconnect();
