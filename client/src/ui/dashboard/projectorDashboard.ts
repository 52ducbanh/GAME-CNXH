import { getGameMap, selectDashboardRoom, type DashboardOverview, type DashboardRoom, type GameSnapshot } from 'shared';
import { SocketClient, type ConnectionStatus } from '../../network/socketClient.js';
import { ScoreboardPanel } from './scoreboardPanel.js';
import { renderEventFeed } from './eventFeedPanel.js';
import { renderFeaturedMission } from './featuredMissionPanel.js';
import { MatchControlsPanel } from './matchControlsPanel.js';
import { clock, roomStatus, selectDashboardModel } from './viewModel.js';

export class ProjectorDashboard {
  private container: HTMLElement;
  private scoreboard: ScoreboardPanel;
  private controls: MatchControlsPanel;
  private active?: DashboardRoom;
  private overview: DashboardRoom[] = [];
  private status: ConnectionStatus;
  private visible = false;
  private refreshing = false;
  private overviewAvailable = false;
  private poll?: ReturnType<typeof setInterval>;
  private unsubscribe: (() => void)[] = [];

  constructor(private socket: SocketClient, private roomCode: string, mode: 'host' | 'projector' = 'host') {
    this.roomCode = roomCode.toUpperCase(); this.status = socket.getStatus();
    this.container = document.createElement('div');
    this.container.id = 'projector-dashboard'; this.container.className = 'projector-dashboard hidden';
    this.container.innerHTML = `
      <main class="dashboard-shell">
        <header class="dashboard-header">
          <section class="dashboard-counter dashboard-timer"><span>Thời gian còn lại</span><strong id="dashboard-clock">--:--</strong><small id="dashboard-clock-context">Đang kết nối…</small></section>
          <div class="dashboard-brand"><h1>QUÊ MÌNH ĐỨNG ĐẦU!</h1><p>KHÁM PHÁ · HỌC LUẬT · XÂY DỰNG QUÊ HƯƠNG</p></div>
          <section class="dashboard-counter dashboard-online"><div class="dashboard-online-tally"><span>Số người online</span><strong id="dashboard-online">—</strong><small>Online / đã tham gia</small></div><div class="dashboard-invitation"><a id="dashboard-join-url" href="/" title="Mở sảnh chọn 7 tỉnh"><img id="dashboard-qr" alt="Quét mã để chọn một trong 7 tỉnh thành" hidden/><span>Chọn 7 tỉnh</span></a><button id="host-btn-copy">Sao chép</button><span id="dashboard-qr-feedback" role="status"></span></div></section>
        </header>
        <nav class="dashboard-toolbar" aria-label="Điều hướng dashboard"><span id="dashboard-connection" role="status">Đang kết nối…</span><div><a href="/">Chọn 7 tỉnh / Vào chơi</a><a id="dashboard-room-link" href="/play/${encodeURIComponent(this.roomCode)}">Vào phòng đang xem</a><a href="/${mode === 'host' ? 'projector' : 'host'}/${encodeURIComponent(this.roomCode)}">${mode === 'host' ? 'Chế độ trình chiếu' : 'Điều khiển Host'}</a><button id="dashboard-fullscreen">Toàn màn hình</button></div></nav>
        <section class="dashboard-scoreboard dashboard-panel" aria-labelledby="dashboard-board-title">
          <div class="dashboard-panel-heading"><h2 id="dashboard-board-title">BẢNG ĐIỂM 7 TỈNH THÀNH</h2><span>Hạng theo điểm · đồng điểm đồng hạng</span></div>
          <div class="dashboard-table-scroll"><div role="table" aria-label="Bảng điểm các phòng tỉnh thành"><div class="dashboard-score-head" role="row"><span role="columnheader">Hạng</span><span role="columnheader">Tỉnh / Phòng</span><span role="columnheader">Điểm</span><span role="columnheader">Tiến độ theo điểm</span><span role="columnheader">Trạng thái / Nhiệm vụ</span></div><div id="dashboard-score-rows" role="rowgroup"></div></div></div>
        </section>
        <div class="dashboard-bottom">
          <section class="dashboard-panel dashboard-events"><div class="dashboard-panel-heading"><h2>📣 SỰ KIỆN TRỰC TIẾP</h2></div><ul id="dashboard-event-feed"></ul></section>
          <section class="dashboard-panel dashboard-featured"><div class="dashboard-panel-heading"><h2>◎ NHIỆM VỤ NỔI BẬT</h2><span>Phòng đang xem</span></div><div id="dashboard-featured-mission"></div></section>
          <section class="dashboard-panel dashboard-controls"><div class="dashboard-panel-heading"><h2>⚙ ĐIỀU KHIỂN TRẬN ĐẤU</h2></div><div id="dashboard-match-controls"></div></section>
        </div>
        <footer class="dashboard-footer">Mỗi tỉnh là một phòng độc lập · Điều khiển chỉ áp dụng cho phòng đang xem · Điểm tối đa 100</footer>
      </main>`;
    document.body.append(this.container);
    this.scoreboard = new ScoreboardPanel(this.element('#dashboard-score-rows'), mode);
    this.controls = new MatchControlsPanel(this.element('#dashboard-match-controls'), socket, mode === 'host');
    this.element<HTMLButtonElement>('#dashboard-fullscreen').onclick = () => {
      void (document.fullscreenElement ? document.exitFullscreen() : this.container.requestFullscreen())
        .catch(() => { this.element('#dashboard-connection').textContent = 'Trình duyệt chưa hỗ trợ toàn màn hình.'; });
    };
    this.unsubscribe.push(socket.onSnapshot(snapshot => this.update(snapshot)), socket.onConnectionStatusChange(status => {
      this.status = status; this.render();
    }));
  }

  private element<T extends HTMLElement = HTMLElement>(selector: string): T { return this.container.querySelector<T>(selector)!; }

  show(): void {
    this.visible = true; this.container.classList.remove('hidden'); this.render();
    if (!this.poll) this.poll = setInterval(() => void this.refreshOverview(), 1000);
    void this.refreshOverview(); void this.loadQr();
  }
  hide(): void { this.visible = false; this.container.classList.add('hidden'); clearInterval(this.poll); this.poll = undefined; }
  dispose(): void { this.hide(); this.unsubscribe.forEach(off => off()); this.container.remove(); }
  update(snapshot: GameSnapshot): void {
    if (snapshot.roomCode !== this.roomCode) return;
    this.active = selectDashboardRoom(snapshot); this.render();
  }

  private async refreshOverview(): Promise<void> {
    if (!this.visible || this.refreshing) return;
    this.refreshing = true;
    try {
      const response = await fetch(`/api/dashboard?room=${encodeURIComponent(this.roomCode)}`, { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw Error('overview');
      const data: DashboardOverview = await response.json();
      this.overview = data.rooms; this.overviewAvailable = true;
    } catch { this.overviewAvailable = false; }
    finally { this.refreshing = false; this.render(); }
  }

  private render(): void {
    if (!this.visible) return;
    const model = selectDashboardModel(this.overview, this.active);
    this.element('#dashboard-clock').textContent = this.active ? clock(this.active.remainingMs) : '--:--';
    this.element('#dashboard-clock-context').textContent = this.active ? `${getGameMap(this.active.mapId).name} · ${roomStatus(this.active)}` : 'Đang kết nối phòng…';
    this.element('#dashboard-online').textContent = model.rows.length ? `${model.online} / ${model.participants}` : '—';
    const connected = this.status === 'CONNECTED';
    this.element('#dashboard-connection').textContent = !connected ? 'Mất kết nối · đang nối lại…'
      : this.overviewAvailable ? '● Trực tiếp · 7 phòng tỉnh thành' : 'Chưa cập nhật được bảng 7 tỉnh · đang thử lại…';
    this.scoreboard.update(model);
    renderEventFeed(this.element('#dashboard-event-feed'), model);
    renderFeaturedMission(this.element('#dashboard-featured-mission'), this.active);
    this.controls.update(this.active, connected);
  }

  private async loadQr(): Promise<void> {
    const feedback = this.element('#dashboard-qr-feedback');
    try {
      const response = await fetch('/api/qr', { signal: AbortSignal.timeout(5000) });
      if (!response.ok) throw Error('qr');
      const data: { joinUrl: string; qrDataUrl: string } = await response.json();
      const img = this.element<HTMLImageElement>('#dashboard-qr'); img.src = data.qrDataUrl; img.hidden = false;
      const link = this.element<HTMLAnchorElement>('#dashboard-join-url'); link.href = data.joinUrl; link.title = data.joinUrl;
      this.element<HTMLButtonElement>('#host-btn-copy').onclick = async () => {
        try { await navigator.clipboard.writeText(data.joinUrl); feedback.textContent = 'Đã sao chép'; }
        catch { feedback.textContent = 'Chọn liên kết để mở sảnh.'; }
      };
    } catch { feedback.textContent = 'QR chưa tải được · mở sảnh bằng liên kết.'; }
  }
}
