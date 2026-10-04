import { GAME_MAPS, getGameMap, type DashboardRoom, type RoomPhase } from 'shared';

export const phaseLabels: Record<RoomPhase, string> = {
  LOBBY: 'Chờ bắt đầu', BRIEFING: 'Dẫn nhập', PRACTICE: 'Tập dượt', RUNNING: 'Đang chơi', RESULTS: 'Đã kết thúc',
};
export function percentage(score: number, maximum: number): number {
  return maximum > 0 ? Math.min(100, Math.max(0, Math.round(score / maximum * 100))) : 0;
}
export function clock(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
}
export function roomStatus(room: DashboardRoom): string {
  return room.isPaused ? 'Tạm dừng' : phaseLabels[room.phase];
}
export function selectDashboardModel(rooms: readonly DashboardRoom[], active: DashboardRoom | undefined) {
  const byProvince = new Map(rooms.map(room => [room.mapId, room]));
  if (active) byProvince.set(active.mapId, active);
  const sorted = [...byProvince.values()].sort((a, b) => b.score - a.score ||
    GAME_MAPS.findIndex(m => m.id === a.mapId) - GAME_MAPS.findIndex(m => m.id === b.mapId));
  const rows = sorted.map(room => ({
    room, map: getGameMap(room.mapId),
    rank: 1 + sorted.filter(other => other.score > room.score).length,
    percent: percentage(room.score, room.maxScore),
  }));
  const events = sorted.flatMap(room => room.events.map(event => ({ event, room, province: getGameMap(room.mapId).name })))
    .sort((a, b) => b.event.timestamp - a.event.timestamp || a.event.id.localeCompare(b.event.id)).slice(0, 5);
  return {
    rows, events, active,
    online: sorted.reduce((sum, room) => sum + room.onlineCount, 0),
    participants: sorted.reduce((sum, room) => sum + room.playerCount, 0),
  };
}
export type DashboardModel = ReturnType<typeof selectDashboardModel>;
