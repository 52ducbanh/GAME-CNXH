import { GameSnapshot } from 'shared';

export class LedgerModal {
  private container: HTMLElement;
  private isVisible: boolean = false;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'ledger-modal';
    this.container.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 hidden';
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
    if (!this.isVisible) return;

    let entriesHtml = snapshot.resources.entries.map(e => `
      <tr class="border-b border-slate-800 text-xs hover:bg-slate-800/40">
        <td class="py-2.5 px-3 font-mono text-slate-400">${new Date(e.timestamp).toLocaleTimeString('vi-VN')}</td>
        <td class="py-2.5 px-3">
          <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${e.missionId === 'M1' ? 'bg-blue-900 text-blue-300' : e.missionId === 'M2' ? 'bg-amber-900 text-amber-300' : e.missionId === 'M3' ? 'bg-indigo-900 text-indigo-300' : 'bg-slate-700 text-slate-300'}">
            ${e.missionId}
          </span>
        </td>
        <td class="py-2.5 px-3 text-slate-200">${e.description}</td>
        <td class="py-2.5 px-3 text-right font-mono font-bold ${e.amount > 0 ? 'text-rose-400' : 'text-slate-400'}">
          ${e.amount > 0 ? `-${e.amount}` : '0'}
        </td>
        <td class="py-2.5 px-3 text-right font-mono font-bold text-amber-400">${e.balanceAfter}</td>
      </tr>
    `).join('');

    let cratesCarriedCount = 0;
    let cratesDeliveredCount = 0;
    for (const c of Object.values(snapshot.crates)) {
      if (c.state === 'CARRIED') cratesCarriedCount++;
      if (c.state === 'DELIVERED') cratesDeliveredCount++;
    }

    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 shadow-2xl text-white animate-fade-in max-h-[88vh] flex flex-col">
        <div class="flex justify-between items-center pb-3 border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="text-xl">📊</span>
            <div>
              <h2 class="text-base font-bold text-white">SỔ SÁCH & PHÂN BỔ NGUỒN LỰC CÔNG</h2>
              <p class="text-xs text-slate-400">Nguyên tắc công khai, minh bạch tài chính của Nhà nước pháp quyền</p>
            </div>
          </div>
          <button id="btn-close-ledger" class="text-slate-400 hover:text-white transition text-lg">✕</button>
        </div>

        <!-- Overview Cards -->
        <div class="grid grid-cols-3 gap-3 my-4">
          <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
            <div class="text-[10px] text-slate-400 uppercase">Ngân sách hiện còn</div>
            <div class="text-xl font-bold text-amber-400 mt-1">${snapshot.resources.currentBudget} <span class="text-xs text-slate-400">/100</span></div>
          </div>
          <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
            <div class="text-[10px] text-slate-400 uppercase">Vật tư trong kho</div>
            <div class="text-xl font-bold text-amber-300 mt-1">${snapshot.resources.availableCrates} <span class="text-xs text-slate-400">/12</span></div>
            <div class="text-[10px] text-slate-400 mt-0.5">Mang: ${cratesCarriedCount} | Giao: ${cratesDeliveredCount}</div>
          </div>
          <div class="p-3 bg-slate-800/80 rounded-xl border border-slate-700 text-center">
            <div class="text-[10px] text-slate-400 uppercase">Đơn vị công tác</div>
            <div class="text-xl font-bold text-blue-400 mt-1">${snapshot.manpower.total - snapshot.manpower.busy} <span class="text-xs text-slate-400">/3 rảnh</span></div>
            <div class="text-[10px] text-slate-400 mt-0.5">Đang làm: ${snapshot.manpower.busy}</div>
          </div>
        </div>

        <!-- Ledger Table -->
        <div class="flex-1 overflow-y-auto mt-2 border border-slate-800 rounded-xl">
          <table class="w-full text-left border-collapse">
            <thead class="bg-slate-800/90 text-slate-400 text-[10px] uppercase sticky top-0">
              <tr>
                <th class="py-2 px-3">Thời gian</th>
                <th class="py-2 px-3">Nhiệm vụ</th>
                <th class="py-2 px-3">Nội dung chi tiêu</th>
                <th class="py-2 px-3 text-right">Chi</th>
                <th class="py-2 px-3 text-right">Số dư</th>
              </tr>
            </thead>
            <tbody>
              ${entriesHtml}
            </tbody>
          </table>
        </div>
      </div>
    `;

    const btnClose = this.container.querySelector('#btn-close-ledger');
    if (btnClose) btnClose.addEventListener('click', () => this.toggle());
  }
}
