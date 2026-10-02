export class LobbyView {
  private container: HTMLElement;
  private onJoinRoom: (roomCode: string, playerName: string, isHost?: boolean) => void;

  constructor(onJoinRoom: (roomCode: string, playerName: string, isHost?: boolean) => void) {
    this.onJoinRoom = onJoinRoom;
    this.container = document.createElement('div');
    this.container.id = 'lobby-view';
    this.container.className = 'fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-4 overflow-y-auto text-white';
    document.body.appendChild(this.container);

    this.render();
    this.loadQr();
  }

  private render() {
    const savedName = localStorage.getItem('player_name') || 'Chiến sĩ Thủ đô';
    const joinUrl = `${window.location.origin}/play/HANOI_01`;

    this.container.innerHTML = `
      <div class="bg-slate-900/90 border border-slate-700/80 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl animate-fade-in my-auto">
        <!-- Logo & Header -->
        <div class="text-center pb-6 border-b border-slate-800">
          <div class="inline-flex items-center space-x-2 px-3 py-1 bg-rose-600/20 border border-rose-500/40 rounded-full text-rose-400 text-xs font-bold uppercase tracking-widest mb-3">
            <span>⭐</span>
            <span>Chủ nghĩa Xã hội Khoa học & Nhà nước Pháp quyền</span>
          </div>
          <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
            QUÊ MÌNH ĐỨNG ĐẦU!
          </h1>
          <h2 class="text-lg font-bold text-amber-400 mt-1">ĐỘI THỦ ĐÔ HÀ NỘI</h2>
          <p class="text-xs text-slate-400 mt-2 max-w-md mx-auto">
            Trải nghiệm phối hợp đồng đội, quản lý nguồn lực công và bảo đảm quyền nhân dân theo đặc điểm Nhà nước pháp quyền XHCN Việt Nam.
          </p>
        </div>

        <!-- Name Input -->
        <div class="mt-6">
          <label class="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">Tên người chơi / Đồng chí:</label>
          <input id="input-player-name" type="text" value="${savedName}" placeholder="Nhập họ tên hoặc bí danh..." class="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition" />
        </div>

        <!-- Actions -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          <!-- Vào phòng mặc định -->
          <div class="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex flex-col justify-between">
            <div>
              <div class="text-xs font-bold text-sky-400 uppercase">Vào phòng chơi</div>
              <div class="mt-2">
                <input id="input-room-code" type="text" value="HANOI_01" placeholder="Mã phòng..." class="w-full uppercase font-mono font-bold bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-amber-300 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
            </div>
            <button id="btn-join-room" class="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-lg flex items-center justify-center space-x-1">
              <span>Tham gia trận đấu</span>
              <span>➔</span>
            </button>
          </div>

          <!-- Tạo phòng mới -->
          <div class="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl flex flex-col justify-between">
            <div>
              <div class="text-xs font-bold text-amber-400 uppercase">Tạo phòng / Làm Host</div>
              <p class="text-[11px] text-slate-400 mt-1">Khởi tạo phòng mới, lấy mã Host điều khiển thời gian, dẫn nhập và kết quả cho nhóm.</p>
            </div>
            <button id="btn-create-room" class="mt-4 w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl text-xs transition shadow-lg">
              Tạo phòng mới (Làm Host)
            </button>
          </div>
        </div>

        <!-- LAN Mobile QR Code Preview Container -->
        <div id="qr-section"></div>

        <!-- Quick navigation to Host & Projector -->
        <div class="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <a href="/host/HANOI_01" class="hover:text-blue-400 underline">Bảng điều khiển Host</a>
          <a href="/projector/HANOI_01" class="hover:text-blue-400 underline">Màn hình Máy chiếu (Projector)</a>
        </div>
      </div>
    `;

    // Bind events
    const inputName = this.container.querySelector('#input-player-name') as HTMLInputElement;
    const inputRoom = this.container.querySelector('#input-room-code') as HTMLInputElement;

    const btnJoin = this.container.querySelector('#btn-join-room');
    if (btnJoin) {
      btnJoin.addEventListener('click', () => {
        const name = inputName.value.trim() || 'Chiến sĩ Thủ đô';
        const room = inputRoom.value.trim().toUpperCase() || 'HANOI_01';
        localStorage.setItem('player_name', name);
        this.hide();
        this.onJoinRoom(room, name, false);
      });
    }

    const btnCreate = this.container.querySelector('#btn-create-room');
    if (btnCreate) {
      btnCreate.addEventListener('click', async () => {
        const name = inputName.value.trim() || 'Host Thủ đô';
        localStorage.setItem('player_name', name);
        try {
          const res = await fetch('/api/rooms/create', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
          });
          if (res.ok) {
            const data = await res.json();
            sessionStorage.setItem(`host_token_${data.roomCode}`, data.hostToken);
            this.hide();
            this.onJoinRoom(data.roomCode, name, true);
          }
        } catch (e) {
          console.error('Create room error:', e);
        }
      });
    }

    const btnCopy = this.container.querySelector('#btn-copy-link');
    if (btnCopy) {
      btnCopy.addEventListener('click', () => {
        navigator.clipboard.writeText(joinUrl);
        btnCopy.textContent = 'Đã sao chép!';
        setTimeout(() => { btnCopy.textContent = 'Sao chép liên kết'; }, 2000);
      });
    }
  }

  public hide() {
    this.container.classList.add('hidden');
  }

  public show() {
    this.container.classList.remove('hidden');
  }

  private async loadQr() {
    const qrSection = this.container.querySelector('#qr-section');
    if (!qrSection) return;

    try {
      const qrRes = await fetch('/api/qr/HANOI_01');
      if (qrRes.ok) {
        const qrJson = await qrRes.json();
        qrSection.innerHTML = `
          <div class="mt-6 p-4 bg-slate-800/40 border border-slate-800 rounded-2xl flex items-center space-x-4 animate-fade-in">
            <img src="${qrJson.qrDataUrl}" alt="QR code" class="w-20 h-20 rounded-lg bg-white p-1 shadow" />
            <div class="flex-1">
              <div class="text-xs font-bold text-slate-200">Quét mã QR vào chơi trên Điện thoại:</div>
              <div class="text-[11px] font-mono text-amber-300 mt-0.5 truncate">${qrJson.joinUrl}</div>
              <button id="btn-copy-link" class="mt-2 text-[11px] px-2.5 py-1 bg-slate-700 hover:bg-slate-600 rounded-md text-slate-300 font-semibold transition">
                Sao chép liên kết
              </button>
            </div>
          </div>
        `;

        const btnCopy = qrSection.querySelector('#btn-copy-link');
        if (btnCopy) {
          btnCopy.addEventListener('click', () => {
            navigator.clipboard.writeText(qrJson.joinUrl);
            btnCopy.textContent = 'Đã sao chép!';
            setTimeout(() => { btnCopy.textContent = 'Sao chép liên kết'; }, 2000);
          });
        }
      }
    } catch (e) {
      console.warn('QR fetch error:', e);
    }
  }
}
