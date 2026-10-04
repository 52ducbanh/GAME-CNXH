import { escapeHtml } from './utils.js';
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
              <span class="font-bold text-amber-400 text-sm">Tráº¡m Cá»‘ Ä‘á»‹nh (Gáº§n A)</span>
              ${myVote === 'FIXED' ? '<span class="text-xs bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded">Phiáº¿u cá»§a báº¡n</span>' : ''}
            </div>
            <p class="text-xs text-slate-300">40 ngÃ¢n sÃ¡ch, 2 kiá»‡n váº­t tÆ°. Phá»¥c vá»¥ 22 dÃ¢n (A12, B10). Ãt chuyáº¿n Ä‘i nhÆ°ng Khu C chÆ°a tiáº¿p cáº­n.</p>
          </button>

          <button id="vote-opt-mobile" class="p-4 rounded-xl border text-left transition ${myVote === 'MOBILE' ? 'bg-sky-600/30 border-sky-400 ring-2 ring-sky-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-sky-400 text-sm">Äiá»ƒm LÆ°u Ä‘á»™ng (B & C)</span>
              ${myVote === 'MOBILE' ? '<span class="text-xs bg-sky-500 text-black font-extrabold px-1.5 py-0.5 rounded">Phiáº¿u cá»§a báº¡n</span>' : ''}
            </div>
            <p class="text-xs text-slate-300">30 ngÃ¢n sÃ¡ch, 4 kiá»‡n váº­t tÆ°. Phá»¥c vá»¥ 24 dÃ¢n (A10, B8, C6). NgÃ¢n sÃ¡ch tháº¥p hÆ¡n, bao phá»§ rá»™ng hÆ¡n.</p>
          </button>
        </div>
      `;
    } else if (voting.missionId === 'M2') {
      optionsHtml = `
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
          <button id="vote-opt-repair" class="p-4 rounded-xl border text-left transition ${myVote === 'REPAIR' ? 'bg-emerald-600/30 border-emerald-400 ring-2 ring-emerald-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-emerald-400 text-sm">Sá»­a cáº§u (REPAIR)</span>
              ${myVote === 'REPAIR' ? '<span class="text-xs bg-emerald-500 text-black font-extrabold px-1.5 py-0.5 rounded">Phiáº¿u cá»§a báº¡n</span>' : ''}
            </div>
            <p class="text-xs text-slate-300">25 ngÃ¢n sÃ¡ch, 4 kiá»‡n váº­t tÆ° (2 sá»­a + 2 cá»©u trá»£). KhÃ´i phá»¥c lÃ¢u dÃ i háº¡ táº§ng giao thÃ´ng sang Khu B.</p>
          </button>

          <button id="vote-opt-detour" class="p-4 rounded-xl border text-left transition ${myVote === 'DETOUR' ? 'bg-amber-600/30 border-amber-400 ring-2 ring-amber-400' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}">
            <div class="flex justify-between items-center mb-1">
              <span class="font-bold text-amber-400 text-sm">Tuyáº¿n vÃ²ng (DETOUR)</span>
              ${myVote === 'DETOUR' ? '<span class="text-xs bg-amber-500 text-black font-extrabold px-1.5 py-0.5 rounded">Phiáº¿u cá»§a báº¡n</span>' : ''}
            </div>
            <p class="text-xs text-slate-300">10 ngÃ¢n sÃ¡ch, 2 kiá»‡n cá»©u trá»£. Tiáº¿t kiá»‡m 15 ngÃ¢n sÃ¡ch nhÆ°ng cáº§u váº«n há»ng, Ä‘Æ°á»ng Ä‘i dÃ i hÆ¡n gáº¥p Ä‘Ã´i.</p>
          </button>
        </div>
      `;
    }

    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-white animate-fade-in mx-4">
        <div class="flex justify-between items-center mb-2">
          <div class="flex items-center space-x-2">
            <span class="text-xl">ðŸ—³ï¸</span>
            <h2 class="text-lg font-bold text-white tracking-wide">BIá»‚U QUYáº¾T Táº¬P THá»‚</h2>
          </div>
          <span class="px-2 py-0.5 rounded bg-blue-600/40 text-blue-300 border border-blue-500/50 text-xs font-mono font-bold">
            ${remainingSecs}s cÃ²n láº¡i
          </span>
        </div>

        <p class="text-xs text-slate-400">
          Äá»“ng chÃ­ <strong class="text-amber-400">${escapeHtml(voting.proposerName)}</strong> Ä‘Ã£ Ä‘á» xuáº¥t phÆ°Æ¡ng Ã¡n cho <strong>${voting.missionId}</strong>.
          Má»i thÃ nh viÃªn Ä‘á»u cÃ³ quyá»n bá» phiáº¿u vÃ  thay Ä‘á»•i phiáº¿u trÆ°á»›c khi háº¿t giá».
        </p>

        <!-- Progress bar -->
        <div class="w-full bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
          <div class="bg-amber-500 h-2 rounded-full transition-all duration-300" style="width: ${progressPercent}%"></div>
        </div>

        ${optionsHtml}

        <div class="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Tiáº¿n Ä‘á»™ biá»ƒu quyáº¿t: <strong class="text-white">${totalVotes}/${voting.totalOnlineVoters}</strong> ngÆ°á»i</span>
          <span class="italic text-[11px]">NguyÃªn táº¯c Táº­p trung dÃ¢n chá»§</span>
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
