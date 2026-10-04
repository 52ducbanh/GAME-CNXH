import type { AuditEvent, GameSnapshot, RoomPhase } from './types.js';
import type { MapId } from './worldMaps.js';
import { getGameMap } from './worldMaps.js';
import { getProvinceView } from './gameplay/registry.js';

export interface DashboardRoom {
  roomCode: string;
  mapId: MapId;
  phase: RoomPhase;
  isPaused: boolean;
  remainingMs: number;
  score: number;
  maxScore: number;
  onlineCount: number;
  playerCount: number;
  completedQuests: number;
  questCount: number;
  activeQuest: { title: string; number: number; score: number; maxScore: number };
  nextStep: string;
  thumbnailUrl: string;
  events: AuditEvent[];
}

/** Read-only presentation projection. Never changes a room or invents progress. */
export function selectDashboardRoom(snapshot: GameSnapshot): DashboardRoom {
  const view = getProvinceView(snapshot);
  const quest = ['LOBBY', 'BRIEFING', 'PRACTICE'].includes(snapshot.phase) ? view.quests[0]
    : view.quests.find(q => q.id === view.activeQuestId) ?? view.quests[0];
  const players = Object.values(snapshot.players);
  return {
    roomCode: snapshot.roomCode, mapId: snapshot.mapId, phase: snapshot.phase,
    isPaused: snapshot.isPaused, remainingMs: snapshot.phaseTimerRemainingMs,
    score: snapshot.totalScore, maxScore: view.quests.reduce((sum, q) => sum + q.maxScore, 0),
    onlineCount: players.filter(p => p.isOnline).length, playerCount: players.length,
    completedQuests: view.quests.filter(q => q.status === 'RESOLVED').length, questCount: view.quests.length,
    activeQuest: { title: quest.title, number: view.quests.indexOf(quest) + 1, score: quest.score, maxScore: quest.maxScore },
    nextStep: view.guide.step,
    thumbnailUrl: snapshot.hatinhState?.activeScene === 'rescue'
      ? '/assets/regions/ha-tinh/rescue-scene.webp' : getGameMap(snapshot.mapId).sceneUrl,
    events: snapshot.recentAuditEvents.slice(0, 6).map(event => ({ ...event })),
  };
}

export interface DashboardOverview {
  rooms: DashboardRoom[];
}
