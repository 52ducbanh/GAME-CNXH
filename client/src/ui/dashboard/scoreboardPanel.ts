import { GAME_MAPS } from 'shared';
import { escapeHtml } from '../utils.js';
import { patchMarkup } from '../patchMarkup.js';
import { roomStatus, type DashboardModel } from './viewModel.js';

export class ScoreboardPanel {
  private rows = new Map<string, HTMLElement>();
  constructor(private container: HTMLElement, private mode: 'host' | 'projector') {}

  update(model: DashboardModel): void {
    const focused = this.container.contains(document.activeElement) ? document.activeElement as HTMLElement : null;
    model.rows.forEach(({ room, map, rank, percent }, index) => {
      let row = this.rows.get(map.id);
      if (!row) {
        row = document.createElement('div'); row.dataset.province = map.id;
        this.rows.set(map.id, row);
      }
      row.className = `dashboard-score-row province-${map.id}${room.roomCode === model.active?.roomCode ? ' is-watched' : ''}`;
      row.setAttribute('role', 'row');
      const status = roomStatus(room);
      const mission = room.phase === 'RUNNING' ? `NV${room.activeQuest.number}: ${room.activeQuest.title}`
        : `${room.completedQuests}/${room.questCount} nhiệm vụ hoàn tất`;
      patchMarkup(row, `
        <span class="dashboard-rank" role="cell">${rank}</span>
        <a class="dashboard-province" role="cell" href="/${this.mode}/${encodeURIComponent(room.roomCode)}" ${room.roomCode === model.active?.roomCode ? 'aria-current="page"' : ''}>
          <img src="${map.iconUrl}" alt="" width="44" height="44"/><span><strong>${escapeHtml(map.name)}</strong><small>${escapeHtml(room.roomCode)} · ${room.onlineCount} online</small></span>
        </a>
        <strong class="dashboard-score" role="cell">${room.score}<small> / ${room.maxScore}</small></strong>
        <div class="dashboard-progress-cell" role="cell"><div class="dashboard-progress" role="progressbar" aria-label="Tiến độ điểm ${escapeHtml(map.name)}" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div><strong>${percent}%</strong></div>
        <div class="dashboard-row-status" role="cell"><strong>${status}</strong><span>${escapeHtml(mission)}</span></div>
      `);
      if (this.container.children[index] !== row) this.container.insertBefore(row, this.container.children[index] ?? null);
    });
    for (const map of GAME_MAPS) {
      if (!model.rows.some(row => row.map.id === map.id)) {
        this.rows.get(map.id)?.remove(); this.rows.delete(map.id);
      }
    }
    if (focused?.isConnected && document.activeElement !== focused) focused.focus({ preventScroll: true });
  }
}
