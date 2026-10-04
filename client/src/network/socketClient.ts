import { io, Socket } from 'socket.io-client';
import { GameSnapshot, ClientIntent, ServerAck } from 'shared';

let actionSerial = 0;
const actionSession = Math.random().toString(36).slice(2);
export function newActionId(){return `ui_${actionSession}_${Date.now()}_${++actionSerial}`;}

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

export class SocketClient {
  private socket: Socket;
  private currentRoomCode: string = '';
  private currentPlayerName = '';
  private currentPlayerId: string = '';
  private currentPlayerToken: string = '';
  private currentHostToken: string = '';
  private isHost: boolean = false;
  private isSpectator: boolean = false;

  private latestSnapshot: GameSnapshot | null = null;
  private snapshotCallbacks: ((snapshot: GameSnapshot) => void)[] = [];
  private joinedCallbacks: ((data: any) => void)[] = [];
  private statusCallbacks: ((status: ConnectionStatus) => void)[] = [];

  private connectionStatus: ConnectionStatus = 'CONNECTING';

  constructor() {
    // In dev, Vite proxies /socket.io to server. In prod, same origin.
    this.socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });

    this.socket.on('connect', () => {
      // A connected transport is not a rejoined room yet.
      if (this.currentRoomCode) {
        this.updateStatus('RECONNECTING');
        this.rejoin();
      } else this.updateStatus('CONNECTED');
    });

    this.socket.on('disconnect', () => {
      this.updateStatus('RECONNECTING');
    });

    this.socket.on('connect_error', () => {
      this.updateStatus('DISCONNECTED');
    });

    this.socket.on('joined_room', (data) => {
      if (data.success) {
        this.currentPlayerId = data.playerId;
        this.currentPlayerToken = data.playerToken;
        if (data.hostToken) this.currentHostToken = data.hostToken;
        if (this.currentRoomCode && data.playerToken) {
          localStorage.setItem(`token_${this.currentRoomCode}`, data.playerToken);
        }
        this.updateStatus('CONNECTED');
        this.joinedCallbacks.forEach(cb => cb(data));
      }
    });

    this.socket.on('room_snapshot', (snapshot: GameSnapshot) => {
      this.latestSnapshot = snapshot;
      this.snapshotCallbacks.forEach(cb => cb(snapshot));
    });
  }

  private updateStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.statusCallbacks.forEach(cb => cb(status));
  }

  public getStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  public getPlayerId(): string {
    return this.currentPlayerId;
  }

  public getHostToken(): string {
    return this.currentHostToken;
  }

  public joinRoom(roomCode: string, playerName: string, isHost: boolean = false, isSpectator: boolean = false) {
    this.currentRoomCode = roomCode.toUpperCase();
    this.currentPlayerName = playerName;
    this.isHost = isHost;
    this.isSpectator = isSpectator;

    const storedToken = localStorage.getItem(`token_${this.currentRoomCode}`) || undefined;
    const storedHostToken = sessionStorage.getItem(`host_token_${this.currentRoomCode}`) || undefined;

    this.currentHostToken = storedHostToken || '';
    if (!this.socket.connected) return;
    this.updateStatus('RECONNECTING');
    this.socket.emit('join_room', {
      roomCode: this.currentRoomCode,
      playerName,
      playerToken: storedToken,
      hostToken: storedHostToken,
      isHost,
      isSpectator
    });
  }

  private rejoin() {
    const storedToken = localStorage.getItem(`token_${this.currentRoomCode}`) || this.currentPlayerToken;
    this.socket.emit('join_room', {
      roomCode: this.currentRoomCode,
      playerName: this.currentPlayerName,
      playerToken: storedToken,
      hostToken: this.currentHostToken,
      isHost: this.isHost,
      isSpectator: this.isSpectator
    });
  }

  public sendIntent(intent: ClientIntent): Promise<ServerAck> {
    return new Promise((resolve) => {
      if(!this.socket.connected||this.connectionStatus!=='CONNECTED'){resolve({actionId:intent.actionId,success:false,reason:'Mất kết nối. Hãy thử lại khi đã vào phòng.'});return;}
      this.socket.timeout(8000).emit('client_intent', intent, (error:Error|null,ack: ServerAck) => {
        resolve(!error&&ack ? ack : { actionId: intent.actionId, success: false, reason: 'Không nhận được phản hồi từ server' });
      });
    });
  }

  public sendHostCommand(command: string): Promise<ServerAck> {
    return new Promise((resolve) => {
      this.socket.emit('host_command', { command, hostToken: this.currentHostToken }, (ack: ServerAck) => {
        resolve(ack || { actionId: 'host', success: false, reason: 'Không nhận được phản hồi từ server' });
      });
    });
  }

  public onSnapshot(callback: (snapshot: GameSnapshot) => void) {
    this.snapshotCallbacks.push(callback);
    if (this.latestSnapshot) callback(this.latestSnapshot);
    return () => { this.snapshotCallbacks = this.snapshotCallbacks.filter(cb => cb !== callback); };
  }

  public onJoined(callback: (data: any) => void) {
    this.joinedCallbacks.push(callback);
    return ()=>{this.joinedCallbacks=this.joinedCallbacks.filter(cb=>cb!==callback);};
  }

  public disconnect(){this.socket.disconnect();}

  public onConnectionStatusChange(callback: (status: ConnectionStatus) => void) {
    this.statusCallbacks.push(callback);
    return ()=>{this.statusCallbacks=this.statusCallbacks.filter(cb=>cb!==callback);};
  }
}
