import { GameSnapshot, PlayerRole } from 'shared';
import { SocketClient } from '../network/socketClient.js';

export class HudView {
  private container: HTMLElement;
  private socketClient: SocketClient;
  private onToggleTasks: () => void;
  private onToggleLedger: () => void;

  constructor(socketClient: SocketClient, onToggleTasks: () => void, onToggleLedger: () => void) {
    this.socketClient = socketClient;
    this.onToggleTasks = onToggleTasks;
    this.onToggleLedger = onToggleLedger;

    this.container = document.createElement('div');
    this.container.id = 'hud-view';
    this.container.className = 'fixed top-0 left-0 right-0 z-40 pointer-events-none p-2 sm:p-4';
    document.body.appendChild(this.container);
  }

  public update(snapshot: GameSnapshot) {
    const myId = this.socketClient.getPlayerId();
    const myPlayer = snapshot.players[myId];

    // Format time
    const totalSecs = Math.floor(snapshot.phaseTimerRemainingMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

    // Mission text
    let missionTitle = 'Sảnh chờ trận đấu';
    let missionBadge = 'CHỜ';
    if (snapshot.phase === 'BRIEFING') {
      missionTitle = 'Dẫn nhập lý luận Nhà nước & Pháp quyền XHCN';
      missionBadge = 'LÝ LUẬN';
    } else if (snapshot.phase === 'PRACTICE') {
      missionTitle = 'Thực hành thao tác vận chuyển mẫu';
      missionBadge = 'TẬP DƯỢT';
    } else if (snapshot.phase === 'RUNNING') {
      if (snapshot.m1.status === 'ACTIVE') {
        missionTitle = `Nhiệm vụ 1: Mở dịch vụ y tế (${snapshot.m1.score}/30 điểm)`;
        missionBadge = 'NHIỆM VỤ 1';
      } else if (snapshot.m2.status === 'ACTIVE') {
        missionTitle = `Nhiệm vụ 2: Cầu hỏng & Ứng phó sự cố B (${snapshot.m2.score}/35 điểm)`;
        missionBadge = 'NHIỆM VỤ 2';
      } else if (snapshot.m3.status === 'ACTIVE') {
        missionTitle = `Nhiệm vụ 3: Bảo đảm quyền & Hỗ trợ C1, C2 (${snapshot.m3.score}/35 điểm)`;
        missionBadge = 'NHIỆM VỤ 3';
      }
    } else if (snapshot.phase === 'RESULTS') {
      missionTitle = 'Tổng kết kết quả công tác & Bài học lý luận';
      missionBadge = 'KẾT THÚC';
    }

    const freeManpower = snapshot.manpower.total - snapshot.manpower.busy;

    this.container.innerHTML = `
      <div class="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
        <!-- Left: City, Mission & Clock -->
        <div class="pointer-events-auto flex items-center space-x-2 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-2 rounded-xl shadow-lg text-white">
          <div class="flex flex-col">
            <div class="flex items-center space-x-2">
              <span class="px-1.5 py-0.5 text-[10px] font-extrabold uppercase rounded bg-rose-600 text-white tracking-wider">Hà Nội</span>
              <span class="text-xs font-semibold text-slate-300">${missionTitle}</span>
              ${snapshot.isPaused ? '<span class="px-1.5 py-0.5 text-[10px] bg-amber-500 text-black font-black rounded animate-pulse">TẠM DỪNG</span>' : ''}
            </div>
            <div class="flex items-center space-x-3 mt-0.5 text-xs text-slate-400">
              <span class="font-mono text-amber-400 font-bold text-sm">⏱ ${timeStr}</span>
              <span>Điểm: <strong class="text-emerald-400 text-sm">${snapshot.totalScore}</strong>/100</span>
              <span>Dân đã phục vụ: <strong class="text-sky-400">${snapshot.citizensServedCount}</strong>/${snapshot.totalCitizensCount}</span>
            </div>
          </div>
        </div>

        <!-- Center: Resource meters -->
        <div class="pointer-events-auto flex items-center space-x-2 bg-slate-900/90 backdrop-blur border border-slate-700/80 px-3 py-2 rounded-xl shadow-lg text-white text-xs">
          <!-- Budget -->
          <div class="flex items-center space-x-1.5 px-2 py-1 bg-slate-800/80 rounded-lg cursor-pointer hover:bg-slate-700/80 transition" id="btn-open-ledger" title="Bấm để xem sổ sách thu chi chi tiết">
            <span class="text-amber-400 font-bold text-sm">💰</span>
            <div>
              <div class="text-[10px] text-slate-400">Ngân sách</div>
              <div class="font-bold text-amber-400">${snapshot.resources.currentBudget} <span class="text-[10px] text-slate-400">/100</span></div>
            </div>
          </div>

          <!-- Crates -->
          <div class="flex items-center space-x-1.5 px-2 py-1 bg-slate-800/80 rounded-lg cursor-pointer hover:bg-slate-700/80 transition" id="btn-open-crates" title="Bấm để xem phân bổ vật tư">
            <span class="text-amber-500 font-bold text-sm">📦</span>
            <div>
              <div class="text-[10px] text-slate-400">Kho vật tư</div>
              <div class="font-bold text-amber-300">${snapshot.resources.availableCrates} <span class="text-[10px] text-slate-400">kiện</span></div>
            </div>
          </div>

          <!-- Manpower Pool -->
          <div class="flex items-center space-x-1.5 px-2 py-1 bg-slate-800/80 rounded-lg">
            <span class="text-blue-400 font-bold text-sm">👥</span>
            <div>
              <div class="text-[10px] text-slate-400">Nhân lực</div>
              <div class="font-bold ${freeManpower > 0 ? 'text-blue-300' : 'text-rose-400'}">${freeManpower}/3 rảnh</div>
            </div>
          </div>

          ${myPlayer?.carriedCrateId ? `
            <div class="flex items-center space-x-1 px-2 py-1 bg-emerald-900/80 border border-emerald-500 rounded-lg text-emerald-200 animate-pulse">
              <span>Đang mang kiện</span>
            </div>
          ` : ''}
        </div>

        <!-- Right: Role & Task button -->
        <div class="pointer-events-auto flex items-center space-x-2">
          <!-- Role selector -->
          <select id="select-role" class="bg-slate-900/90 text-slate-200 border border-slate-700 text-xs rounded-xl px-2.5 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer">
            <option value="SURVEY" ${myPlayer?.role === 'SURVEY' ? 'selected' : ''}>Vai trò: Tiếp nhận</option>
            <option value="PLANNER" ${myPlayer?.role === 'PLANNER' ? 'selected' : ''}>Vai trò: Lập phương án</option>
            <option value="LOGISTICS" ${myPlayer?.role === 'LOGISTICS' ? 'selected' : ''}>Vai trò: Tổ chức thực hiện</option>
            <option value="AUDIT" ${myPlayer?.role === 'AUDIT' ? 'selected' : ''}>Vai trò: Giám sát</option>
            <option value="RIGHTS" ${myPlayer?.role === 'RIGHTS' ? 'selected' : ''}>Vai trò: Bảo vệ quyền</option>
          </select>

          <!-- Toggle Tasks button -->
          <button id="btn-toggle-tasks" class="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-lg flex items-center space-x-1 transition">
            <span>📋</span>
            <span class="hidden sm:inline">Nhiệm vụ</span>
          </button>
        </div>
      </div>
    `;

    // Bind events
    const selectRole = this.container.querySelector('#select-role') as HTMLSelectElement;
    if (selectRole) {
      selectRole.addEventListener('change', (e) => {
        const newRole = (e.target as HTMLSelectElement).value as PlayerRole;
        this.socketClient.sendIntent({
          actionId: `role_${Date.now()}`,
          type: 'SET_ROLE',
          payload: { role: newRole }
        });
      });
    }

    const btnTasks = this.container.querySelector('#btn-toggle-tasks');
    if (btnTasks) btnTasks.addEventListener('click', () => this.onToggleTasks());

    const btnLedger = this.container.querySelector('#btn-open-ledger');
    if (btnLedger) btnLedger.addEventListener('click', () => this.onToggleLedger());

    const btnCrates = this.container.querySelector('#btn-open-crates');
    if (btnCrates) btnCrates.addEventListener('click', () => this.onToggleLedger());
  }
}
