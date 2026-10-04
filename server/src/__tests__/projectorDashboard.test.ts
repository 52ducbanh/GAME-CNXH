import { describe, expect, it } from 'vitest';
import { GAME_MAPS, MAP_IDS, getGameMap, selectDashboardRoom } from 'shared';
import { RoomManager } from '../roomManager.js';
import { createTestEngine, rescueStateOf, serviceStateOf, provinceRuntimeOf } from './fixtures/gameplay.js';

describe('Classroom dashboard is a read-only room projection', () => {
  it.each(MAP_IDS)('%s keeps real score, quest meaning and excludes private/player state', id => {
    const engine = createTestEngine('DASH', 'private-host', id);
    engine.addPlayer('p', 'Nguyễn An'); engine.startRunning();
    if (id === 'ha-tinh') rescueStateOf(engine).va.score = 7;
    else if (id === 'ninh-binh') provinceRuntimeOf(engine).state.baiDinh.score = 7;
    else if (id === 'quang-ninh') provinceRuntimeOf(engine).state.toRoi.score = 7;
    else if (id === 'hai-phong') provinceRuntimeOf(engine).state.foodtour.score = 7;
    else if (id === 'thanh-hoa') provinceRuntimeOf(engine).state.nemChua.score = 7;
    else if (id === 'nghe-an') provinceRuntimeOf(engine).state.chaoLuon.score = 7;
    else serviceStateOf(engine).medicalService.score = 7;
    const before = engine.getSnapshot(), room = selectDashboardRoom(before);
    expect(room.score).toBe(engine.totalScore);
    expect(room.activeQuest.score).toBe(7);
    expect(room.activeQuest.number).toBe(1);
    expect(room.maxScore).toBe(100);
    expect(room.questCount).toBe(3);
    expect(room.onlineCount).toBe(1);
    expect(room.thumbnailUrl).toBe(getGameMap(id).sceneUrl);
    expect(room).not.toHaveProperty('players'); expect(room).not.toHaveProperty('hostToken');
    expect(engine.getSnapshot()).toEqual(before);
    room.events[0].message = 'changed by consumer';
    expect(engine.getSnapshot().recentAuditEvents).toEqual(before.recentAuditEvents);
  });

  it('tracks seven defaults and replaces only the viewed province with its custom room', () => {
    const manager = new RoomManager();
    for (const map of GAME_MAPS) manager.createRoom(map.defaultRoom, map.id);
    manager.createRoom('HT_CUSTOM', 'ha-tinh');
    const before = manager.getAllRoomsList();
    const rooms = manager.getDashboardOverview('HT_CUSTOM').rooms;
    expect(rooms).toHaveLength(7);
    expect(new Set(rooms.map(room => room.mapId)).size).toBe(7);
    expect(rooms.find(room => room.mapId === 'ha-tinh')?.roomCode).toBe('HT_CUSTOM');
    expect(rooms.find(room => room.mapId === 'hanoi')?.roomCode).toBe('HANOI_01');
    expect(manager.getAllRoomsList()).toEqual(before);
    expect(manager.getDashboardOverview().rooms.find(room => room.mapId === 'ha-tinh')?.roomCode).toBe('HATINH_01');
  });

  it('shows the first mission before play and the real rescue scene and completed tasks after progress', () => {
    const engine = createTestEngine('HT', 'h', 'ha-tinh');
    expect(selectDashboardRoom(engine.getSnapshot()).activeQuest.number).toBe(1);
    engine.startRunning();
    const state = rescueStateOf(engine); state.va.status = 'RESOLVED'; state.va.score = 30;
    state.dg.status = 'ACTIVE'; state.activeScene = 'rescue';
    const room = selectDashboardRoom(engine.getSnapshot());
    expect(room.activeQuest.number).toBe(2);
    expect(room.completedQuests).toBe(1);
    expect(room.thumbnailUrl).toBe('/assets/regions/ha-tinh/rescue-scene.webp');
  });
});
