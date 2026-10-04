import { getGameMap, type DashboardRoom } from 'shared';
import { patchMarkup } from '../patchMarkup.js';
import { escapeHtml } from '../utils.js';
import { percentage, roomStatus } from './viewModel.js';

export function renderFeaturedMission(container: HTMLElement, room: DashboardRoom | undefined): void {
  if (!room) { patchMarkup(container, '<p class="dashboard-empty">Đang kết nối phòng…</p>'); return; }
  const map = getGameMap(room.mapId), quest = room.activeQuest;
  const percent = percentage(quest.score, quest.maxScore);
  patchMarkup(container, `
    <img class="dashboard-feature-image" src="${room.thumbnailUrl}" alt="Cảnh nhiệm vụ tại ${escapeHtml(map.name)}"/>
    <div class="dashboard-feature-copy province-${map.id}">
      <span class="dashboard-province-tag">${escapeHtml(map.name)}</span>
      <h3 title="${escapeHtml(quest.title)}">NV${quest.number}: ${escapeHtml(quest.title)}</h3>
      <p title="${escapeHtml(room.nextStep)}">${escapeHtml(room.nextStep)}</p>
      <div class="dashboard-feature-meta"><span>${roomStatus(room)}</span><strong>${quest.score}/${quest.maxScore} điểm</strong></div>
      <div class="dashboard-progress" role="progressbar" aria-label="Tiến độ điểm nhiệm vụ" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100"><span style="width:${percent}%"></span></div>
    </div>
  `);
}
