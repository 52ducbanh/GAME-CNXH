import { GameSnapshot, getGameMap } from 'shared';
import { SocketClient } from '../network/socketClient.js';

export class ProjectorView {
  private container: HTMLElement;
  private socketClient: SocketClient;
  private roomCode: string;

  constructor(socketClient: SocketClient, roomCode: string) {
    this.socketClient = socketClient;
    this.roomCode = roomCode.toUpperCase();
    this.container = document.createElement('div');
    this.container.id = 'projector-view';
    this.container.className = 'fixed inset-0 z-50 bg-slate-950 p-6 sm:p-10 text-white overflow-y-auto hidden';
    document.body.appendChild(this.container);

    this.socketClient.onSnapshot((snapshot) => {
      this.update(snapshot);
    });
  }

  public show() {
    this.container.classList.remove('hidden');
  }

  public hide() {
    this.container.classList.add('hidden');
  }

  public update(snapshot: GameSnapshot) {
    if (this.container.classList.contains('hidden')) return;

    const totalSecs = Math.floor(snapshot.phaseTimerRemainingMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    let recentEventsHtml = snapshot.recentAuditEvents.slice(0, 8).map(e => `
      <div class="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${e.category === 'SERVICE' ? 'bg-emerald-900 text-emerald-300' : e.category === 'PLAN' ? 'bg-amber-900 text-amber-300' : 'bg-blue-900 text-blue-300'}">
            ${e.category}
          </span>
          <span class="text-slate-300">${e.message}</span>
        </div>
        <span class="text-[10px] font-mono text-slate-500">${new Date(e.timestamp).toLocaleTimeString('vi-VN')}</span>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto h-full flex flex-col justify-between">
        <!-- Top Title Bar -->
        <div class="flex justify-between items-center pb-6 border-b border-slate-800">
          <div>
            <div class="flex items-center space-x-3">
              <span class="px-3 py-1 rounded-full bg-rose-600 text-white text-xs font-black uppercase tracking-widest">
                Màn hình máy chiếu (Projector View)
              </span>
              <span class="text-sm font-bold text-amber-400 font-mono">PHÒNG: ${this.roomCode}</span>
              ${snapshot.isPaused ? '<span class="px-2 py-0.5 rounded bg-amber-500 text-black font-black text-xs animate-pulse">TẠM DỪNG</span>' : ''}
            </div>
            <h1 class="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              QUÊ MÌNH ĐỨNG ĐẦU! / ${getGameMap(snapshot.mapId).name.toLocaleUpperCase('vi')}
            </h1>
          </div>
          <div class="text-right">
            <div class="text-xs text-slate-400 uppercase font-semibold">Thời gian còn lại</div>
            <div class="text-4xl sm:text-5xl font-mono font-black text-amber-400 mt-1">${timeStr}</div>
          </div>
        </div>

        <!-- Big 4 Metrics -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6 my-8">
          <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-center">
            <div class="text-xs uppercase font-bold text-slate-400">Điểm số thành phố</div>
            <div class="text-5xl font-black text-emerald-400 mt-2">${snapshot.totalScore} <span class="text-lg text-slate-500">/100</span></div>
            <div class="text-xs text-slate-400 mt-1">M1: ${snapshot.m1.score} | M2: ${snapshot.m2.score} | M3: ${snapshot.m3.score}</div>
          </div>

          <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-center">
            <div class="text-xs uppercase font-bold text-slate-400">Dân đã tiếp cận</div>
            <div class="text-5xl font-black text-sky-400 mt-2">${snapshot.citizensServedCount} <span class="text-lg text-slate-500">/${snapshot.totalCitizensCount}</span></div>
            <div class="text-xs text-slate-400 mt-1">Bao phủ ${Math.round((snapshot.citizensServedCount / snapshot.totalCitizensCount) * 100)}% toàn thành phố</div>
          </div>

          <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-center">
            <div class="text-xs uppercase font-bold text-slate-400">Ngân sách công</div>
            <div class="text-5xl font-black text-amber-400 mt-2">${snapshot.resources.currentBudget} <span class="text-lg text-slate-500">/100</span></div>
            <div class="text-xs text-slate-400 mt-1">Đã giải ngân ${100 - snapshot.resources.currentBudget} đơn vị</div>
          </div>

          <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl text-center">
            <div class="text-xs uppercase font-bold text-slate-400">Vật tư công</div>
            <div class="text-5xl font-black text-amber-300 mt-2">${snapshot.resources.availableCrates} <span class="text-lg text-slate-500">/12</span></div>
            <div class="text-xs text-slate-400 mt-1">Nhân lực: ${snapshot.manpower.total - snapshot.manpower.busy}/3 rảnh</div>
          </div>
        </div>

        <!-- Real-time Activity Feed -->
        <div class="p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex-1 flex flex-col">
          <div class="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
            <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-2">
              <span>📡</span>
              <span>Nhật ký hoạt động công vụ thực địa (Audit Log)</span>
            </h3>
            <span class="text-xs text-slate-500">Tự động đồng bộ theo thời gian thực</span>
          </div>

          <div class="space-y-2 flex-1 overflow-y-auto pr-2">
            ${recentEventsHtml || '<p class="text-xs text-slate-500">Chưa có sự kiện nào.</p>'}
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-6 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
          <span>Hệ thống mô phỏng thực hành Nhà nước pháp quyền Xã hội Chủ nghĩa Việt Nam</span>
          <span>${getGameMap(snapshot.mapId).name}: 30 người dân mô phỏng (A: 12, B: 10, C: 8)</span>
        </div>
      </div>
    `;
  }
}
