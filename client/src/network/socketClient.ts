import { io, Socket } from 'socket.io-client';
import { GameSnapshot, ClientIntent, ServerAck } from 'shared';

export type ConnectionStatus = 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED';

export class SocketClient {
  private socket: Socket;
  private currentRoomCode: string = '';
  private currentPlayerId: string = '';
  private currentPlayerToken: string = '';
  private currentHostToken: string = '';
  private isHost: boolean = false;
  private isSpectator: boolean = false;

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
      this.updateStatus('CONNECTED');
      // If we already had a room, re-join seamlessly
      if (this.currentRoomCode) {
        this.rejoin();
      }
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
        this.joinedCallbacks.forEach(cb => cb(data));
      }
    });

    this.socket.on('room_snapshot', (snapshot: GameSnapshot) => {
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
    this.isHost = isHost;
    this.isSpectator = isSpectator;

    const storedToken = localStorage.getItem(`token_${this.currentRoomCode}`) || undefined;
    const storedHostToken = sessionStorage.getItem(`host_token_${this.currentRoomCode}`) || undefined;

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
      playerName: '',
      playerToken: storedToken,
      hostToken: this.currentHostToken,
      isHost: this.isHost,
      isSpectator: this.isSpectator
    });
  }

  public sendIntent(intent: ClientIntent): Promise<ServerAck> {
    return new Promise((resolve) => {
      this.socket.emit('client_intent', intent, (ack: ServerAck) => {
        resolve(ack || { actionId: intent.actionId, success: false, reason: 'Không nhận được phản hồi từ server' });
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
  }

  public onJoined(callback: (data: any) => void) {
    this.joinedCallbacks.push(callback);
  }

  public onConnectionStatusChange(callback: (status: ConnectionStatus) => void) {
    this.statusCallbacks.push(callback);
  }
}
