import { GameEngine } from './gameEngine.js';
import { GAME_MAPS, selectDashboardRoom, type DashboardOverview, type MapId } from 'shared';

export interface PlayerSession {
  playerId: string;
  roomCode: string;
  name: string;
  token: string;
}

export class RoomManager {
  private rooms: Map<string, GameEngine> = new Map();
  private playerSessions: Map<string, PlayerSession> = new Map(); // token -> session
  private hostTokens: Map<string, string> = new Map(); // roomCode -> hostToken

  constructor() {}

  public createRoom(customCode?: string,mapId:MapId='hanoi'): { roomCode: string; hostToken: string; engine: GameEngine } {
    let roomCode = (customCode || `VN${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
    if(customCode&&this.rooms.has(roomCode))throw new Error('Mã phòng đã tồn tại.');
    while(this.rooms.has(roomCode))roomCode=`VN${Math.random().toString(36).slice(2,8).toUpperCase()}`;
    const hostToken = `HOST_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

    const engine = new GameEngine(roomCode, hostToken,mapId);
    this.rooms.set(roomCode, engine);
    this.hostTokens.set(roomCode, hostToken);

    return { roomCode, hostToken, engine };
  }

  public getRoom(roomCode: string): GameEngine | undefined {
    return this.rooms.get(roomCode.toUpperCase());
  }

  public getOrCreateRoom(roomCode: string): { engine: GameEngine; hostToken: string } {
    const code = roomCode.toUpperCase();
    let engine = this.rooms.get(code);
    if (!engine) {
      const created = this.createRoom(code);
      return { engine: created.engine, hostToken: created.hostToken };
    }
    const hostToken = this.hostTokens.get(code) || '';
    return { engine, hostToken };
  }

  public registerPlayerSession(token: string, playerId: string, roomCode: string, name: string) {
    this.playerSessions.set(token, {
      token,
      playerId,
      roomCode: roomCode.toUpperCase(),
      name
    });
  }

  public getPlayerSession(token: string): PlayerSession | undefined {
    return this.playerSessions.get(token);
  }

  public isHostTokenValid(roomCode: string, hostToken: string): boolean {
    return this.hostTokens.get(roomCode.toUpperCase()) === hostToken;
  }

  public getAllRoomsList() {
    const list: { roomCode: string; mapId:MapId; phase: string; playerCount: number; score: number }[] = [];
    for (const [code, engine] of this.rooms.entries()) {
      list.push({
        roomCode: code,
        mapId: engine.map.id,
        phase: engine.phase,
        playerCount: engine.getOnlinePlayerCount(),
        score: engine.totalScore
      });
    }
    return list;
  }

  public tickAll(dtMs: number) {
    for (const engine of this.rooms.values()) {
      engine.tick(dtMs);
    }
  }

  /** Seven independent rooms; a custom viewed room replaces its province's default. */
  public getDashboardOverview(viewedRoomCode?: string): DashboardOverview {
    const viewed = viewedRoomCode ? this.getRoom(viewedRoomCode) : undefined;
    return { rooms: GAME_MAPS.flatMap(map => {
      const engine = viewed?.map.id === map.id ? viewed : this.getRoom(map.defaultRoom);
      return engine ? [selectDashboardRoom(engine.getSnapshot())] : [];
    }) };
  }
}
