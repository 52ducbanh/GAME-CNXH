import { GameSnapshot, generateRecap, KNOWLEDGE_SOURCES } from 'shared';
import { SocketClient } from '../network/socketClient.js';

export class ResultsModal {
  private container: HTMLElement;
  private socketClient: SocketClient;

  constructor(socketClient: SocketClient) {
    this.socketClient = socketClient;
    this.container = document.createElement('div');
    this.container.id = 'results-modal';
    this.container.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 hidden';
    document.body.appendChild(this.container);
  }

  public update(snapshot: GameSnapshot) {
    if (snapshot.phase !== 'RESULTS') {
      this.container.classList.add('hidden');
      return;
    }

    this.container.classList.remove('hidden');

    const myId = this.socketClient.getPlayerId();
    const isHost = this.socketClient.getHostToken() !== '';

    const recapData = generateRecap(
      snapshot.m1.planCommitted,
      snapshot.m2.planCommitted,
      snapshot.m3.status === 'RESOLVED',
      snapshot.citizensServedCount,
      snapshot.totalCitizensCount,
      snapshot.resources.currentBudget,
      snapshot.resources.availableCrates
    );

    let recapsHtml = recapData.recaps.map(r => `
      <div class="p-4 bg-slate-800/80 border border-slate-700 rounded-xl space-y-2">
        <div class="flex justify-between items-center">
          <span class="text-xs uppercase font-extrabold text-blue-400 tracking-wider">${r.mission}</span>
          <span class="font-bold text-amber-400 text-sm">${r.title}</span>
        </div>
        <p class="text-xs text-slate-300 leading-relaxed">${r.narrative}</p>
        <div class="p-2.5 bg-slate-900/60 rounded-lg border border-slate-800 text-xs text-emerald-300/90">
          <strong>Ý nghĩa lý luận:</strong> ${r.theoryLesson}
        </div>
      </div>
    `).join('');

    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl p-6 sm:p-8 shadow-2xl text-white animate-fade-in max-h-[92vh] overflow-y-auto">
        <!-- Header -->
        <div class="text-center pb-5 border-b border-slate-800">
          <span class="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full text-xs font-bold uppercase tracking-widest">
            Báo cáo tổng kết công tác thành phố
          </span>
          <h1 class="text-2xl sm:text-3xl font-black text-white mt-2">KẾT QUẢ TRẬN ĐẤU: HÀ NỘI</h1>
          <p class="text-xs sm:text-sm text-slate-400 mt-1">Trò chơi học tập Chủ nghĩa Xã hội Khoa học & Nhà nước pháp quyền XHCN Việt Nam</p>
        </div>

        <!-- Big Score and Stats Grid -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
          <div class="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
            <div class="text-[11px] text-slate-400 uppercase font-semibold">Tổng điểm</div>
            <div class="text-2xl font-black text-emerald-400 mt-1">${snapshot.totalScore} <span class="text-xs text-slate-400">/100</span></div>
            <div class="text-[10px] text-slate-400 mt-0.5">M1:${snapshot.m1.score} | M2:${snapshot.m2.score} | M3:${snapshot.m3.score}</div>
          </div>

          <div class="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
            <div class="text-[11px] text-slate-400 uppercase font-semibold">Dân được phục vụ</div>
            <div class="text-2xl font-black text-sky-400 mt-1">${snapshot.citizensServedCount} <span class="text-xs text-slate-400">/${snapshot.totalCitizensCount}</span></div>
            <div class="text-[10px] text-slate-400 mt-0.5">Đạt ${Math.round((snapshot.citizensServedCount / snapshot.totalCitizensCount) * 100)}% độ phủ</div>
          </div>

          <div class="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
            <div class="text-[11px] text-slate-400 uppercase font-semibold">Ngân sách còn lại</div>
            <div class="text-2xl font-black text-amber-400 mt-1">${snapshot.resources.currentBudget} <span class="text-xs text-slate-400">/100</span></div>
            <div class="text-[10px] text-slate-400 mt-0.5">Đã chi: ${100 - snapshot.resources.currentBudget} đơn vị</div>
          </div>

          <div class="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-center">
            <div class="text-[11px] text-slate-400 uppercase font-semibold">Hạ tầng Cầu B</div>
            <div class="text-lg font-bold ${snapshot.m2.bridgeRepaired ? 'text-emerald-400' : 'text-amber-400'} mt-2">
              ${snapshot.m2.bridgeRepaired ? 'Đã sửa chữa' : 'Dùng tuyến vòng'}
            </div>
            <div class="text-[10px] text-slate-400 mt-0.5">${snapshot.m2.planCommitted}</div>
          </div>
        </div>

        <!-- Academic Recaps based on actual decisions -->
        <div class="space-y-3 my-6">
          <h3 class="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
            <span>📚</span>
            <span>Tổng kết chính sách & Đối chiếu lý luận</span>
          </h3>
          ${recapsHtml}
        </div>

        <!-- Academic Citations & Notes -->
        <div class="p-4 bg-slate-800/50 border border-slate-800 rounded-xl text-xs text-slate-400 space-y-2 mb-6">
          <h4 class="font-bold text-slate-300 uppercase text-[11px]">Nguồn tham khảo & Khuyến nghị học tập:</h4>
          <ul class="list-disc list-inside space-y-1">
            ${KNOWLEDGE_SOURCES.map(s => `
              <li><strong>${s.name}:</strong> ${s.note}</li>
            `).join('')}
          </ul>
          <p class="text-[11px] text-slate-500 italic mt-2">Lưu ý: Nhóm học tập cần đối chiếu số trang và thuật ngữ cụ thể theo giáo trình CNXHKH của lớp trước khi hoàn thiện bài thu hoạch.</p>
        </div>

        <!-- Action Footer -->
        <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
          <span class="text-xs text-slate-400">Cảm ơn bạn đã tham gia trải nghiệm thực hành chính sách công!</span>
          ${isHost ? `
            <button id="btn-reset-match" class="w-full sm:w-auto px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition shadow-lg">
              Thiết lập lại phòng chơi (Reset)
            </button>
          ` : '<span class="text-xs text-slate-500 italic">Chờ Host điều khiển trận mới...</span>'}
        </div>
      </div>
    `;

    const btnReset = this.container.querySelector('#btn-reset-match');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.socketClient.sendHostCommand('RESET');
      });
    }
  }
}
