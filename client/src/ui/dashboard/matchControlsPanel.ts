import type { DashboardRoom, ServerAck } from 'shared';
import { SocketClient } from '../../network/socketClient.js';
import { phaseLabels } from './viewModel.js';

export class MatchControlsPanel {
  private pending = false;
  private room?: DashboardRoom;
  private connected = false;
  private message: HTMLElement;
  constructor(private container: HTMLElement, private socket: SocketClient, private allowControl: boolean) {
    container.innerHTML = `
      <div class="dashboard-control-room"></div>
      <div class="dashboard-time-setting"><label for="dashboard-extra-minutes">Gia hạn đồng hồ (phút)</label><div><input id="dashboard-extra-minutes" type="number" min="1" max="10" step="1" value="1" required/><button id="dashboard-add-time" class="dashboard-button secondary">+ Thời gian</button></div></div>
      <div class="dashboard-primary-controls"><button id="host-btn-start" class="dashboard-button start">▶ Bắt đầu</button><button id="host-btn-toggle-pause" class="dashboard-button pause">Ⅱ Tạm dừng</button></div>
      <div class="dashboard-secondary-controls"><button id="dashboard-skip" class="dashboard-button secondary" hidden></button><button id="host-btn-end" class="dashboard-button secondary">Chốt kết quả</button><button id="host-btn-reset" class="dashboard-button reset">↻ Reset</button></div>
      <p id="dashboard-control-feedback" class="dashboard-feedback" role="status" aria-live="polite"></p>
    `;
    this.message = container.querySelector('#dashboard-control-feedback')!;
    const bind = (id: string, command: () => string) => {
      container.querySelector<HTMLButtonElement>(`#${id}`)!.onclick = () => void this.send(command());
    };
    bind('host-btn-start', () => 'START');
    bind('host-btn-toggle-pause', () => this.room?.isPaused ? 'RESUME' : 'PAUSE');
    bind('host-btn-reset', () => 'RESET'); bind('host-btn-end', () => 'END');
    bind('dashboard-skip', () => this.room?.phase === 'BRIEFING' ? 'SKIP_BRIEFING' : 'SKIP_PRACTICE');
    container.querySelector<HTMLButtonElement>('#dashboard-add-time')!.onclick = () => {
      const input = container.querySelector<HTMLInputElement>('#dashboard-extra-minutes')!;
      if (!input.reportValidity()) return;
      void this.send('ADD_60S', Number(input.value));
    };
  }

  update(room: DashboardRoom | undefined, connected: boolean): void {
    this.room = room; this.connected = connected;
    const permitted = this.allowControl && connected && !!this.socket.getHostToken() && !!room && !this.pending;
    const active = room && ['BRIEFING', 'PRACTICE', 'RUNNING'].includes(room.phase);
    this.container.querySelector('.dashboard-control-room')!.textContent = room
      ? `${room.roomCode} · ${phaseLabels[room.phase]}` : 'Đang kết nối phòng…';
    for (const control of this.container.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button,input')) control.disabled = !permitted;
    this.container.querySelector<HTMLButtonElement>('#host-btn-start')!.disabled = !permitted || room?.phase !== 'LOBBY';
    const pause = this.container.querySelector<HTMLButtonElement>('#host-btn-toggle-pause')!;
    pause.disabled = !permitted || !active; pause.textContent = room?.isPaused ? '▶ Tiếp tục' : 'Ⅱ Tạm dừng';
    this.container.querySelector<HTMLButtonElement>('#host-btn-end')!.disabled = !permitted || !active;
    this.container.querySelector<HTMLButtonElement>('#dashboard-add-time')!.disabled = !permitted || !active;
    this.container.querySelector<HTMLInputElement>('#dashboard-extra-minutes')!.disabled = !permitted || !active;
    const skip = this.container.querySelector<HTMLButtonElement>('#dashboard-skip')!;
    skip.hidden = room?.phase !== 'BRIEFING' && room?.phase !== 'PRACTICE';
    skip.textContent = room?.phase === 'BRIEFING' ? 'Bỏ qua dẫn nhập' : 'Bỏ qua tập dượt';
    if (!this.allowControl && !this.pending) this.message.textContent = 'Chế độ trình chiếu · điều khiển tại trang Host.';
  }

  private async send(command: string, repeats = 1): Promise<void> {
    if (this.pending || !this.allowControl || !this.connected || !this.socket.getHostToken()) return;
    if (!Number.isInteger(repeats) || repeats < 1 || repeats > 10) return;
    this.pending = true; this.message.textContent = 'Đang chờ xác nhận…';
    this.update(this.room, this.connected);
    try {
      for (let i = 0; i < repeats; i++) {
        let timer: ReturnType<typeof setTimeout> | undefined;
        const ack = await Promise.race([
          this.socket.sendHostCommand(command),
          new Promise<ServerAck>(resolve => { timer = setTimeout(() => resolve({ actionId: 'host', success: false, reason: 'Chưa nhận được xác nhận. Kiểm tra kết nối và trạng thái phòng.' }), 8000); }),
        ]).finally(() => clearTimeout(timer));
        if (!ack.success) { this.message.textContent = ack.reason || 'Lệnh chưa được thực hiện.'; return; }
      }
      this.message.textContent = 'Đã xác nhận.';
    } catch {
      this.message.textContent = 'Không gửi được lệnh. Kiểm tra kết nối.';
    } finally {
      this.pending = false; this.update(this.room, this.connected);
    }
  }
}
