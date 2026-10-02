import { VoteState, GameSnapshot } from 'shared';
import { SocketClient } from '../network/socketClient.js';

export class VotingModal {
  private container: HTMLElement;
  private socketClient: SocketClient;

  constructor(socketClient: SocketClient) {
    this.socketClient = socketClient;
    this.container = document.createElement('div');
    this.container.id = 'voting-modal';
    this.container.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md hidden';
    document.body.appendChild(this.container);
  }

  public update(snapshot: GameSnapshot) {
    const voting = snapshot.voting;
    if (!voting || !voting.active) {
      this.container.classList.add('hidden');
      return;
    }

    this.container.classList.remove('hidden');

    const myId = this.socketClient.getPlayerId();
    const myVote = voting.votes[myId];
    const totalVotes = Object.keys(voting.votes).length;

    const remainingSecs = Math.max(0, Math.ceil(voting.remainingMs / 1000));
    const progressPercent = Math.min(100, Math.max(0, (voting.remainingMs / 15000) * 100));

    let optionsHtml = '';
    if (voting.missionId === 'M1') {
      optionsHtml = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <button id="vote-opt-fixed" class="p-4 rounded-xl border text-left transition ${myVote === 'FIXED' ? 'bg-amber-600/30 border-amber-400 ring-2 ring-amber-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-amber-400 text-sm">Trạm Cố định (Gần A)</span>
              ${myVote === 'FIXED' ? '<span class="text-xs bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded">Phiếu của bạn</span>' : ''}
            </div>
            <p class="text-xs text-slate-300">40 ngân sách, 2 kiện vật tư. Phục vụ 22 dân (A12, B10). Ít chuyến đi nhưng Khu C chưa tiếp cận.</p>
          </button>

          <button id="vote-opt-mobile" class="p-4 rounded-xl border text-left transition ${myVote === 'MOBILE' ? 'bg-sky-600/30 border-sky-400 ring-2 ring-sky-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-sky-400 text-sm">Điểm Lưu động (B & C)</span>
              ${myVote === 'MOBILE' ? '<span class="text-xs bg-sky-500 text-black font-extrabold px-1.5 py-0.5 rounded">Phiếu của bạn</span>' : ''}
            </div>
            <p class="text-xs text-slate-300">30 ngân sách, 4 kiện vật tư. Phục vụ 24 dân (A10, B8, C6). Ngân sách thấp hơn, bao phủ rộng hơn.</p>
          </button>
        </div>
      `;
    } else if (voting.missionId === 'M2') {
      optionsHtml = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <button id="vote-opt-repair" class="p-4 rounded-xl border text-left transition ${myVote === 'REPAIR' ? 'bg-emerald-600/30 border-emerald-400 ring-2 ring-emerald-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-emerald-400 text-sm">Sửa cầu (REPAIR)</span>
              ${myVote === 'REPAIR' ? '<span class="text-xs bg-emerald-500 text-black font-extrabold px-1.5 py-0.5 rounded">Phiếu của bạn</span>' : ''}
            </div>
            <p class="text-xs text-slate-300">25 ngân sách, 4 kiện vật tư (2 sửa + 2 cứu trợ). Khôi phục lâu dài hạ tầng giao thông sang Khu B.</p>
          </button>

          <button id="vote-opt-detour" class="p-4 rounded-xl border text-left transition ${myVote === 'DETOUR' ? 'bg-amber-600/30 border-amber-400 ring-2 ring-amber-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-amber-400 text-sm">Tuyến vòng (DETOUR)</span>
              ${myVote === 'DETOUR' ? '<span class="text-xs bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded">Phiếu của bạn</span>' : ''}
            </div>
            <p class="text-xs text-slate-300">10 ngân sách, 2 kiện cứu trợ. Tiết kiệm 15 ngân sách nhưng cầu vẫn hỏng, đường đi dài hơn gấp đôi.</p>
          </button>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-white animate-fade-in mx-4">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center space-x-2">
            <span class="text-xl">🗳️</span>
            <h2 class="text-lg font-bold text-white tracking-wide">BIỂU QUYẾT TẬP THỂ</h2>
          </div>
          <span class="px-2 py-0.5 rounded bg-blue-600/40 text-blue-300 border border-blue-500/50 text-xs font-mono font-bold">
            ${remainingSecs}s còn lại
          </span>
        </div>

        <p class="text-xs text-slate-400">
          Đồng chí <strong class="text-amber-400">${voting.proposerName}</strong> đã đề xuất phương án cho <strong>${voting.missionId}</strong>.
          Mọi thành viên đều có quyền bỏ phiếu và thay đổi phiếu trước khi hết giờ.
        </p>

        <!-- Progress bar -->
        <div class="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
          <div class="bg-amber-500 h-2 rounded-full transition-all duration-300" style="width: ${progressPercent}%"></div>
        </div>

        ${optionsHtml}

        <div class="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Tiến độ biểu quyết: <strong class="text-white">${totalVotes}/${voting.totalOnlineVoters}</strong> người</span>
          <span class="italic text-[11px]">Nguyên tắc Tập trung dân chủ</span>
        </div>
      </div>
    `;

    // Bind voting buttons
    const bindVote = (btnId: string, plan: string) => {
      const btn = this.container.querySelector(`#${btnId}`);
      if (btn) {
        btn.addEventListener('click', () => {
          this.socketClient.sendIntent({
            actionId: `vote_${Date.now()}`,
            type: 'CAST_VOTE',
            payload: { plan }
          });
        });
      }
    };

    bindVote('vote-opt-fixed', 'FIXED');
    bindVote('vote-opt-mobile', 'MOBILE');
    bindVote('vote-opt-repair', 'REPAIR');
    bindVote('vote-opt-detour', 'DETOUR');
  }
}
