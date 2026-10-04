import { GameSnapshot, getProvinceView } from 'shared';

export class TaskPanel {
  private container: HTMLElement;
  private renderKey = '';
  public playerId = '';
  private isVisible: boolean = false;
  private onLocateTarget?: (x: number, y: number, name: string) => void;

  constructor(onLocateTarget?: (x: number, y: number, name: string) => void) {
    this.onLocateTarget = onLocateTarget;
    this.container = document.createElement('div');
    this.container.id = 'task-panel';
    this.container.className = 'fixed right-4 top-16 sm:top-20 z-40 w-80 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl shadow-2xl p-4 text-white hidden animate-fade-in text-xs max-h-[80vh] overflow-y-auto';
    document.body.appendChild(this.container);
  }

  public toggle() {
    this.isVisible = !this.isVisible;
    if (this.isVisible) {
      this.container.classList.remove('hidden');
    } else {
      this.container.classList.add('hidden');
    }
  }

  public update(snapshot: GameSnapshot) {
    const view = getProvinceView(snapshot, this.playerId), guide = view.guide;
    const nextStepText = guide.step;
    const targetPoi = guide.target;

    const phaseTitle = snapshot.phase === 'RUNNING'
      ? `NHIỆM VỤ ${view.activeQuestNumber} / ${view.quests.length}: ${guide.title}`
      : guide.title;

    const taskItemsHtml = guide.checks.map((item, index) => `
      <div class="flex items-center justify-between p-2.5 rounded-lg ${item.done ? 'bg-emerald-950/40 border border-emerald-600/40' : 'bg-slate-800/80 border border-slate-700/60'}">
        <div class="flex items-center space-x-2">
          <span class="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[11px] ${item.done ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}">
            ${item.done ? '✓' : String(index + 1)}
          </span>
          <span class="${item.done ? 'text-emerald-200 line-through opacity-85' : 'text-slate-100 font-medium'}">${item.text}</span>
        </div>
        <span class="text-[10px] font-bold px-2 py-0.5 rounded ${item.done ? 'bg-emerald-800/60 text-emerald-300' : 'bg-amber-900/60 text-amber-300'}">
          ${item.done ? 'ĐÃ XONG' : 'CẦN LÀM'}
        </span>
      </div>
    `).join('');

    const renderKey = JSON.stringify([nextStepText, targetPoi?.name, guide.checks, snapshot.phase]);
    if (renderKey === this.renderKey) return;
    this.renderKey = renderKey;

    this.container.innerHTML = `
      <div class="flex justify-between items-center pb-2 border-b border-slate-700">
        <div>
          <span class="text-[9px] uppercase tracking-wider font-bold text-amber-400">Tiến độ chi tiết</span>
          <h3 class="font-bold text-white text-sm flex items-center space-x-1.5 mt-0.5">
            <span>📋</span>
            <span>${phaseTitle}</span>
          </h3>
        </div>
        <button id="btn-close-task-panel" class="text-slate-400 hover:text-white transition p-1 text-base leading-none">✕</button>
      </div>

      <!-- Gợi ý bước tiếp theo -->
      <div class="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/40">
        <div class="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Việc bạn cần làm ngay:</div>
        <p class="font-semibold text-white mt-1 text-xs leading-relaxed">${nextStepText || 'Đang chờ cập nhật...'}</p>
        ${targetPoi ? `
          <button id="btn-locate-target" class="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center space-x-1 shadow">
            <span>🎯</span>
            <span>Định vị đường đi đến: ${targetPoi.name}</span>
          </button>
        ` : ''}
      </div>

      <!-- Danh sách chỉ tiêu cần đạt -->
      <div class="mt-3">
        <div class="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider">Các chỉ tiêu nhiệm vụ:</div>
        <div class="space-y-1.5">
          ${taskItemsHtml || '<p class="text-slate-400 italic">Không có nhiệm vụ nào.</p>'}
        </div>
      </div>
    `;

    const btnClose = this.container.querySelector('#btn-close-task-panel');
    if (btnClose) btnClose.addEventListener('click', () => this.toggle());

    const btnLocate = this.container.querySelector('#btn-locate-target');
    if (btnLocate && targetPoi && this.onLocateTarget) {
      btnLocate.addEventListener('click', () => {
        this.onLocateTarget!(targetPoi!.x, targetPoi!.y, targetPoi!.name);
        this.toggle(); // Auto-close to view map
      });
    }
  }
}
