import { GameSnapshot } from 'shared';
import { SocketClient } from '../network/socketClient.js';

export class PracticeModal {
  private container: HTMLElement;
  private socketClient: SocketClient;

  constructor(socketClient: SocketClient) {
    this.socketClient = socketClient;
    this.container = document.createElement('div');
    this.container.id = 'practice-modal';
    this.container.className = 'fixed top-16 left-1/2 -translate-x-1/2 z-40 w-11/12 max-w-lg bg-emerald-950/90 border border-emerald-500 rounded-2xl shadow-xl p-3 text-white hidden animate-fade-in text-xs';
    document.body.appendChild(this.container);
  }

  public update(snapshot: GameSnapshot) {
    if (snapshot.phase !== 'PRACTICE') {
      this.container.classList.add('hidden');
      return;
    }

    this.container.classList.remove('hidden');

    const totalSecs = Math.max(0, Math.ceil(snapshot.phaseTimerRemainingMs / 1000));
    const isHost = this.socketClient.getHostToken() !== '';

    this.container.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-2">
          <span class="text-lg">🎯</span>
          <div>
            <h4 class="font-bold text-emerald-300">GIAI ĐOẠN TẬP DƯỢT THỰC HÀNH</h4>
            <p class="text-[11px] text-slate-300 mt-0.5">
              ${snapshot.practiceCrateDelivered 
                ? '✓ Đã giao kiện mẫu thành công! Sẵn sàng vào trận thật.' 
                : 'Di chuyển đến Kho lấy 1 kiện mẫu rồi giao vào Điểm tập kết mẫu gần Trụ sở.'}
            </p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <span class="font-mono font-bold text-amber-300 bg-emerald-900/80 px-2 py-1 rounded-lg">⏱ ${totalSecs}s</span>
          ${isHost ? `
            <button id="btn-skip-practice" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition">
              Bắt đầu trận thật ➔
            </button>
          ` : ''}
        </div>
      </div>
    `;

    const btnSkip = this.container.querySelector('#btn-skip-practice');
    if (btnSkip) {
      btnSkip.addEventListener('click', () => {
        this.socketClient.sendHostCommand('SKIP_PRACTICE');
      });
    }
  }
}
