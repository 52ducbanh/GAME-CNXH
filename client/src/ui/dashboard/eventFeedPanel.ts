import { escapeHtml } from '../utils.js';
import { patchMarkup } from '../patchMarkup.js';
import type { DashboardModel } from './viewModel.js';

export function renderEventFeed(container: HTMLElement, model: DashboardModel): void {
  patchMarkup(container, model.events.length ? model.events.map(({ event, room, province }) => `
    <li class="dashboard-event province-${room.mapId}"><time>${new Date(event.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</time>
      <div><strong>${escapeHtml(province)}</strong><span title="${escapeHtml(event.message)}">${escapeHtml(event.message)}</span></div>
    </li>`).join('') : '<li class="dashboard-empty">Sự kiện sẽ xuất hiện khi người chơi vào phòng hoặc thực hiện nhiệm vụ.</li>');
}
