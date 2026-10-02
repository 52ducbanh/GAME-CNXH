import { GameSnapshot } from 'shared';
import { SocketClient } from '../network/socketClient.js';

export class HostView {
  private container: HTMLElement;
  private socketClient: SocketClient;
  private roomCode: string;

  constructor(socketClient: SocketClient, roomCode: string) {
    this.socketClient = socketClient;
    this.roomCode = roomCode.toUpperCase();
    this.container = document.createElement('div');
    this.container.id = 'host-view';
    this.container.className = 'fixed inset-0 z-50 flex items-center justify-center bg-slate-950 p-4 overflow-y-auto text-white hidden';
    document.body.appendChild(this.container);

    this.socketClient.onSnapshot((snapshot) => {
      this.update(snapshot);
    });
  }

  public show() {
    this.container.classList.remove('hidden');
    // Fetch QR code
    this.fetchQrCode();
  }

  public hide() {
    this.container.classList.add('hidden');
  }

  private qrDataUrl: string = '';
  private joinUrl: string = '';

  private async fetchQrCode() {
    try {
      const res = await fetch(`/api/qr/${this.roomCode}`);
      if (res.ok) {
        const data = await res.json();
        this.qrDataUrl = data.qrDataUrl;
        this.joinUrl = data.joinUrl;
      }
    } catch (e) {
      console.error(e);
    }
  }

  public update(snapshot: GameSnapshot) {
    if (this.container.classList.contains('hidden')) return;

    const totalSecs = Math.floor(snapshot.phaseTimerRemainingMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    let playersListHtml = Object.values(snapshot.players).map(p => `
      <div class="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs">
        <div class="flex items-center space-x-2">
          <span class="w-3 h-3 rounded-full" style="background-color: ${p.color}"></span>
          <span class="font-bold text-white">${p.name} ${p.isHost ? '(Host)' : ''}</span>
          <span class="text-[10px] text-slate-400">| ${p.role}</span>
        </div>
        <span class="${p.isOnline ? 'text-emerald-400 font-semibold' : 'text-slate-500'}">
          ${p.isOnline ? '● Online' : '○ Mất kết nối'}
        </span>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl p-6 sm:p-8 shadow-2xl animate-fade-in my-auto">
        <!-- Top bar -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 border-b border-slate-800 gap-3">
          <div>
            <div class="flex items-center space-x-2">
              <span class="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/40 text-xs font-bold uppercase">
                Bảng điều khiển Host
              </span>
              <span class="font-mono font-bold text-amber-300 text-lg">Mã phòng: ${this.roomCode}</span>
            </div>
            <h1 class="text-xl sm:text-2xl font-black text-white mt-1">QUÊ MÌNH ĐỨNG ĐẦU! / HÀ NỘI</h1>
          </div>

          <!-- Play as host button -->
          <a href="/play/${this.roomCode}" class="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center space-x-1.5">
            <span>🎮</span>
            <span>Tham gia chơi (Chơi Solo / Cùng đội)</span>
          </a>
        </div>

        <!-- Room Status & Clock -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
            <div class="text-[10px] text-slate-400 uppercase">Trạng thái phòng</div>
            <div class="text-base font-bold text-sky-400 mt-1">${snapshot.phase}</div>
            <div class="text-[10px] text-slate-400">${snapshot.isPaused ? 'ĐANG TẠM DỪNG' : 'Đang chạy'}</div>
          </div>
          <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
            <div class="text-[10px] text-slate-400 uppercase">Đồng hồ đếm ngược</div>
            <div class="text-xl font-mono font-bold text-amber-400 mt-1">${timeStr}</div>
            <div class="text-[10px] text-slate-400">Tổng chạy: ${Math.round(snapshot.totalRunningTimeMs / 1000)}s</div>
          </div>
          <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
            <div class="text-[10px] text-slate-400 uppercase">Tổng điểm thành phố</div>
            <div class="text-xl font-bold text-emerald-400 mt-1">${snapshot.totalScore} / 100</div>
            <div class="text-[10px] text-slate-400">Dân: ${snapshot.citizensServedCount}/30</div>
          </div>
          <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
            <div class="text-[10px] text-slate-400 uppercase">Nguồn lực hiện có</div>
            <div class="text-sm font-bold text-amber-300 mt-1">💰 ${snapshot.resources.currentBudget} | 📦 ${snapshot.resources.availableCrates}</div>
            <div class="text-[10px] text-slate-400">Nhân lực: ${snapshot.manpower.total - snapshot.manpower.busy}/3 rảnh</div>
          </div>
        </div>

        <!-- Host Command Buttons Grid -->
        <div class="my-6">
          <h3 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Lệnh điều khiển trận đấu (Host Actions):</h3>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button id="host-btn-start" class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 font-bold text-xs rounded-xl transition shadow">
              ▶ Bắt đầu trận
            </button>
            <button id="host-btn-skip-briefing" class="py-2.5 px-3 bg-blue-600 hover:bg-blue-700 font-bold text-xs rounded-xl transition shadow">
              ⏭ Bỏ qua dẫn nhập
            </button>
            <button id="host-btn-skip-practice" class="py-2.5 px-3 bg-sky-600 hover:bg-sky-700 font-bold text-xs rounded-xl transition shadow">
              ⏭ Bỏ qua thực hành
            </button>
            <button id="host-btn-toggle-pause" class="py-2.5 px-3 ${snapshot.isPaused ? 'bg-amber-600 hover:bg-amber-500' : 'bg-slate-700 hover:bg-slate-600'} font-bold text-xs rounded-xl transition shadow">
              ${snapshot.isPaused ? '▶ Tiếp tục (Resume)' : '⏸ Tạm dừng (Pause)'}
            </button>
            <button id="host-btn-add-60s" class="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs rounded-xl transition shadow">
              ⏱ +60 Giây
            </button>
            <button id="host-btn-end" class="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 font-bold text-xs rounded-xl transition shadow">
              🏁 Chốt & Kết thúc
            </button>
            <button id="host-btn-reset" class="py-2.5 px-3 bg-rose-600 hover:bg-rose-700 font-bold text-xs rounded-xl transition shadow col-span-2">
              🔄 Reset về Sảnh (Lobby)
            </button>
          </div>
        </div>

        <!-- Players List & Mobile QR Code -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
          <!-- Players -->
          <div>
            <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Danh sách thành viên (${Object.keys(snapshot.players).length}/10):</h4>
            <div class="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              ${playersListHtml || '<p class="text-xs text-slate-500">Chưa có người chơi tham gia.</p>'}
            </div>
          </div>

          <!-- QR code -->
          <div class="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center space-x-4">
            ${this.qrDataUrl ? `<img src="${this.qrDataUrl}" alt="QR Code" class="w-24 h-24 rounded-xl bg-white p-1 shadow" />` : ''}
            <div class="flex-1">
              <div class="text-xs font-bold text-slate-200">Mã QR cho điện thoại cùng mạng LAN:</div>
              <div class="text-[11px] font-mono text-amber-300 mt-1 truncate">${this.joinUrl}</div>
              <button id="host-btn-copy" class="mt-2 text-xs px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-200 font-semibold transition">
                Sao chép liên kết
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Bind Host Actions
    const bindHost = (id: string, cmd: string) => {
      const btn = this.container.querySelector(`#${id}`);
      if (btn) btn.addEventListener('click', () => this.socketClient.sendHostCommand(cmd));
    };

    bindHost('host-btn-start', 'START');
    bindHost('host-btn-skip-briefing', 'SKIP_BRIEFING');
    bindHost('host-btn-skip-practice', 'SKIP_PRACTICE');
    bindHost('host-btn-toggle-pause', snapshot.isPaused ? 'RESUME' : 'PAUSE');
    bindHost('host-btn-add-60s', 'ADD_60S');
    bindHost('host-btn-end', 'END');
    bindHost('host-btn-reset', 'RESET');

    const btnCopy = this.container.querySelector('#host-btn-copy');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(this.joinUrl);
        btnCopy.textContent = 'Đã sao chép!';
        setTimeout(() => { btnCopy.textContent = 'Sao chép liên kết'; }, 2000);
      });
    }
  }
}
