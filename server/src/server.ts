import express from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import cors from 'cors';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import { RoomManager } from './roomManager.js';
import { ServerAck, readIntentEnvelope, GAME_MAPS, isMapId } from 'shared';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT || '3000', 10);
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';

// An isolated build lets QA preserve rooms held in the live server's RAM.
const clientDistPath = process.env.CLIENT_DIST_PATH
  ? path.resolve(process.env.CLIENT_DIST_PATH)
  : path.resolve(__dirname, '../../client/dist');
// In development (npm run dev), server runs on SERVER_PORT (3001) while Vite runs on PORT (3000).
// In production (npm run start), server runs on PORT (3000) and serves client/dist directly.
const isDevMode = process.env.npm_lifecycle_event === 'dev';
const isProduction = !isDevMode && fs.existsSync(clientDistPath);
const listenPort = isProduction ? PORT : SERVER_PORT;

app.use(cors());
app.use(express.json());

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();

// Pre-create standard default room for immediate testing
for(const map of GAME_MAPS)roomManager.createRoom(map.defaultRoom,map.id);

function getLocalLanIp(): string {
  const interfaces = os.networkInterfaces();
  // Prefer the physical Wi-Fi/LAN adapter over VirtualBox/VMware/WSL adapters.
  const priority=(name:string)=>/vmware|vethernet|virtual|loopback|host.only/i.test(name)?0:/wi.fi|wireless|wlan/i.test(name)?20:/ethernet/i.test(name)?10:5;
  for (const name of Object.keys(interfaces).sort((a,b)=>priority(b)-priority(a))) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const lanIp = getLocalLanIp();
const publicBaseUrl = process.env.PUBLIC_HOST || `http://${lanIp}:${PORT}`;

console.log(`[LAN INFO] IP: ${lanIp}, Base URL: ${publicBaseUrl}`);

// API Endpoints
app.get('/api/network-info', (req, res) => {
  res.json({
    lanIp,
    port: PORT,
    serverPort: SERVER_PORT,
    publicBaseUrl
  });
});

app.get('/api/qr/:roomCode', async (req, res) => {
  const { roomCode } = req.params;
  const joinUrl = `${publicBaseUrl}/play/${roomCode.toUpperCase()}`;
  try {
    const qrDataUrl = await QRCode.toDataURL(joinUrl, {
      margin: 2,
      width: 280,
      color: {
        dark: '#1e293b',
        light: '#ffffff'
      }
    });
    res.json({ joinUrl, qrDataUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rooms', (req, res) => {
  res.json(roomManager.getAllRoomsList());
});

app.get('/api/maps', (_req,res)=>res.json(GAME_MAPS.map(({id,name,landmark,defaultRoom,sceneUrl,minimapUrl,iconUrl})=>({id,name,landmark,defaultRoom,sceneUrl,minimapUrl,iconUrl}))));
app.get('/api/rooms/:roomCode', (req,res)=>{
  const engine=roomManager.getRoom(req.params.roomCode);
  if(!engine){res.status(404).json({error:'Phòng chưa được tạo.'});return;}
  res.json({roomCode:engine.roomCode,mapId:engine.map.id});
});

app.post('/api/rooms/create', (req, res) => {
  const { customCode, mapId='hanoi' } = req.body;
  if(!isMapId(mapId)||customCode!==undefined&&(typeof customCode!=='string'||!/^[A-Za-z0-9_-]{1,32}$/.test(customCode))){res.status(400).json({error:'Bản đồ hoặc mã phòng không hợp lệ.'});return;}
  try {
    const {roomCode,hostToken}=roomManager.createRoom(customCode,mapId);
    res.json({roomCode,hostToken,mapId});
  }catch(e){res.status(409).json({error:(e as Error).message});}
});

// Serve client dist in production
if (fs.existsSync(clientDistPath)) {
  console.log(`[STATIC] Serving client build from ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res) => {
    // Only route frontend non-api requests to index.html
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(clientDistPath, 'index.html'));
    }
  });
}

// Socket.IO Handling
interface SocketMeta {
  playerId?: string;
  roomCode?: string;
  playerToken?: string;
  isHost?: boolean;
  isSpectator?: boolean;
}

const socketMap = new Map<string, SocketMeta>();

io.on('connection', (socket: Socket) => {
  socketMap.set(socket.id, {});

  socket.on('join_room', (data: {
    roomCode: string;
    playerName: string;
    playerToken?: string;
    hostToken?: string;
    isHost?: boolean;
    isSpectator?: boolean;
  }) => {
    const roomCode = (data.roomCode || 'HANOI_01').toUpperCase();
    const { engine, hostToken: actualHostToken } = roomManager.getOrCreateRoom(roomCode);

    let isHost = false;
    if (data.isHost) {
      if (data.hostToken && data.hostToken === actualHostToken) {
        isHost = true;
      } else if (!data.hostToken) {
        // If creator doesn't have token, assign current host token
        isHost = true;
      }
    }

    const isSpectator = !!data.isSpectator;
    let playerId = '';
    let playerToken = data.playerToken;

    if (!isSpectator) {
      // Reconnect check
      if (playerToken) {
        const existingSession = roomManager.getPlayerSession(playerToken);
        if (existingSession && existingSession.roomCode === roomCode) {
          playerId = existingSession.playerId;
        }
      }

      if (!playerId) {
        playerId = `P_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        playerToken = `TOK_${Math.random().toString(36).substring(2, 12)}_${Date.now()}`;
        roomManager.registerPlayerSession(playerToken, playerId, roomCode, data.playerName || 'Chiến sĩ');
      }

      engine.addPlayer(playerId, data.playerName || 'Chiến sĩ', isHost);
    }

    socketMap.set(socket.id, {
      playerId,
      roomCode,
      playerToken,
      isHost,
      isSpectator
    });

    socket.join(roomCode);

    socket.emit('joined_room', {
      success: true,
      roomCode,
      playerId,
      playerToken,
      isHost,
      hostToken: isHost ? actualHostToken : undefined,
      snapshot: engine.getSnapshot()
    });

    io.to(roomCode).emit('room_snapshot', engine.getSnapshot());
  });

  socket.on('client_intent', (intent: unknown, ackCallback?: (ack: ServerAck) => void) => {
    const meta = socketMap.get(socket.id);
    if (!meta || !meta.roomCode || !meta.playerId) {
      if (ackCallback) ackCallback({ actionId: readIntentEnvelope(intent)?.actionId ?? '', success: false, reason: 'Chưa tham gia phòng.' });
      return;
    }

    const engine = roomManager.getRoom(meta.roomCode);
    if (!engine) {
      if (ackCallback) ackCallback({ actionId: readIntentEnvelope(intent)?.actionId ?? '', success: false, reason: 'Phòng không tồn tại.' });
      return;
    }

    const ack = engine.handleIntent(meta.playerId, intent);

    if (ackCallback) ackCallback(ack);
    if (ack.success) {
      io.to(meta.roomCode).emit('room_snapshot', engine.getSnapshot());
    }
  });

  socket.on('host_command', (data: { command: string; hostToken: string }, ackCallback?: (ack: any) => void) => {
    const meta = socketMap.get(socket.id);
    if (!meta || !meta.roomCode) {
      if (ackCallback) ackCallback({ success: false, reason: 'Chưa tham gia phòng.' });
      return;
    }

    const engine = roomManager.getRoom(meta.roomCode);
    if (!engine) {
      if (ackCallback) ackCallback({ success: false, reason: 'Phòng không tồn tại.' });
      return;
    }

    const ack = engine.hostAction(data.command, data.hostToken);
    if (ackCallback) ackCallback(ack);
    io.to(meta.roomCode).emit('room_snapshot', engine.getSnapshot());
  });

  socket.on('disconnect', () => {
    const meta = socketMap.get(socket.id);
    if (meta && meta.roomCode && meta.playerId) {
      const engine = roomManager.getRoom(meta.roomCode);
      if (engine) {
        engine.removeOrDisconnectPlayer(meta.playerId);
        io.to(meta.roomCode).emit('room_snapshot', engine.getSnapshot());
      }
    }
    socketMap.delete(socket.id);
  });
});

// Periodic room tick & snapshot broadcast (100ms = 10Hz)
setInterval(() => {
  roomManager.tickAll(100);
  for (const room of roomManager.getAllRoomsList()) {
    const engine = roomManager.getRoom(room.roomCode);
    if (engine) {
      io.to(room.roomCode).emit('room_snapshot', engine.getSnapshot());
    }
  }
}, 100);

server.listen(listenPort, HOST, () => {
  console.log(`====================================================`);
  console.log(`  QUÊ MÌNH ĐỨNG ĐẦU! / HÀ NỘI - SERVER ĐANG CHẠY     `);
  console.log(`====================================================`);
  console.log(`  Mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
  console.log(`  Listening on: http://${HOST}:${listenPort}`);
  console.log(`  LAN URL:      ${publicBaseUrl}`);
  console.log(`====================================================`);
});
