// Local visual QA helper, restricted to the disposable room prefixes above.
import {io} from 'socket.io-client';
const [roomCode,command='RESUME']=process.argv.slice(2);
if(!/^(ART_|V2_)/.test(roomCode||'')||!['PAUSE','RESUME'].includes(command))throw Error('Expected a disposable ART_/V2_ QA room and PAUSE/RESUME');
const socket=io(process.env.PREVIEW_URL||'http://localhost:3100',{transports:['websocket']});
await new Promise((r,j)=>{socket.once('connect',r);socket.once('connect_error',j);});
const joined=await new Promise(r=>{socket.once('joined_room',r);socket.emit('join_room',{roomCode,playerName:'Visual QA host',isHost:true,isSpectator:true});});
const ack=await new Promise(r=>socket.emit('host_command',{command,hostToken:joined.hostToken},r));
socket.disconnect();if(!ack.success)throw Error(ack.reason);console.log(`${roomCode}: ${command}`);
