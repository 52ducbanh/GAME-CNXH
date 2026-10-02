import { GameSnapshot, KNOWLEDGE_INTRO } from 'shared';
import { SocketClient } from '../network/socketClient.js';

export class BriefingModal {
  private container: HTMLElement;
  private socketClient: SocketClient;

  constructor(socketClient: SocketClient) {
    this.socketClient = socketClient;
    this.container = document.createElement('div');
    this.container.id = 'briefing-modal';
    this.container.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 hidden';
    document.body.appendChild(this.container);
  }

  public update(snapshot: GameSnapshot) {
    if (snapshot.phase !== 'BRIEFING') {
      this.container.classList.add('hidden');
      return;
    }

    this.container.classList.remove('hidden');

    const totalSecs = Math.max(0, Math.ceil(snapshot.phaseTimerRemainingMs / 1000));
    const isHost = this.socketClient.getHostToken() !== '';

    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl text-white animate-fade-in max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <span class="text-xs font-bold text-amber-400 uppercase tracking-widest">Dẫn nhập lý luận khoa học</span>
            <h1 class="text-xl sm:text-2xl font-black text-white mt-1">QUÊ MÌNH ĐỨNG ĐẦU! / HÀ NỘI</h1>
          </div>
          <div class="px-3 py-1 bg-amber-500/20 border border-amber-500/50 rounded-xl text-amber-400 font-mono font-bold text-sm">
            ⏱ ${totalSecs}s
          </div>
        </div>

        <div class="mt-4 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <div class="p-3.5 bg-slate-800/70 border border-slate-700/60 rounded-xl">
            <h3 class="font-bold text-amber-400 mb-1">1. Nguồn gốc & Bản chất Nhà nước (Quan điểm Mác – Lênin)</h3>
            <p>${KNOWLEDGE_INTRO.marxistTheory.originOfState}</p>
          </div>

          <div class="p-3.5 bg-slate-800/70 border border-slate-700/60 rounded-xl">
            <h3 class="font-bold text-sky-400 mb-1">2. Bản chất Nhà nước Xã hội Chủ nghĩa</h3>
            <p>${KNOWLEDGE_INTRO.marxistTheory.socialistState}</p>
          </div>

          <div class="p-3.5 bg-slate-800/70 border border-slate-700/60 rounded-xl">
            <h3 class="font-bold text-rose-400 mb-1">3. Đặc điểm Nhà nước pháp quyền XHCN Việt Nam</h3>
            <p>${KNOWLEDGE_INTRO.marxistTheory.vietnamContext}</p>
          </div>

          <div class="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-amber-200/90 text-xs">
            <strong>⚠️ LƯU Ý MÔ PHỎNG:</strong> ${KNOWLEDGE_INTRO.principlesNotice}
          </div>
        </div>

        <div class="mt-6 pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span class="text-xs text-slate-400">Trận đấu sẽ tự động chuyển sang Thực hành sau khi đếm ngược kết thúc.</span>
          ${isHost ? `
            <button id="btn-skip-briefing" class="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-lg">
              Bỏ qua dẫn nhập (Host) ➔
            </button>
          ` : '<span class="text-xs text-slate-400 italic">Chờ Host hoặc hết giờ...</span>'}
        </div>
      </div>
    `;

    const btnSkip = this.container.querySelector('#btn-skip-briefing');
    if (btnSkip) {
      btnSkip.addEventListener('click', () => {
        this.socketClient.sendHostCommand('SKIP_BRIEFING');
      });
    }
  }
}
