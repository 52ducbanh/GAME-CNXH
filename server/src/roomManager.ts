import { GameEngine } from './gameEngine.js';
import { GameSnapshot } from 'shared';

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

  public createRoom(customCode?: string): { roomCode: string; hostToken: string; engine: GameEngine } {
    const roomCode = (customCode || `HN${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase();
    const hostToken = `HOST_${Math.random().toString(36).substring(2, 10)}_${Date.now()}`;

    const engine = new GameEngine(roomCode, hostToken);
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
    const list: { roomCode: string; phase: string; playerCount: number; score: number }[] = [];
    for (const [code, engine] of this.rooms.entries()) {
      list.push({
        roomCode: code,
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
}
