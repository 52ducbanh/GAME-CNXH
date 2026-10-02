import { PointOfInterest, GameSnapshot, ClientIntent, ServerAck } from 'shared';
import { SocketClient } from '../network/socketClient.js';
import { PLAN_COSTS, SCORES } from 'shared';

export class ActionPanel {
  private container: HTMLElement;
  private socketClient: SocketClient;
  private currentPoi: PointOfInterest | null = null;
  private currentSnapshot: GameSnapshot | null = null;

  constructor(socketClient: SocketClient) {
    this.socketClient = socketClient;
    this.container = document.createElement('div');
    this.container.id = 'action-panel';
    this.container.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm hidden';
    document.body.appendChild(this.container);
  }

  public updateSnapshot(snapshot: GameSnapshot) {
    this.currentSnapshot = snapshot;
    if (this.currentPoi && !this.container.classList.contains('hidden')) {
      this.render();
    }
  }

  public show(poi: PointOfInterest) {
    this.currentPoi = poi;
    this.container.classList.remove('hidden');
    this.render();
  }

  public hide() {
    this.container.classList.add('hidden');
    this.currentPoi = null;
  }

  private render() {
    if (!this.currentPoi || !this.currentSnapshot) return;
    const poi = this.currentPoi;
    const snap = this.currentSnapshot;
    const myId = this.socketClient.getPlayerId();
    const myPlayer = snap.players[myId];
    const isCarrying = !!myPlayer?.carriedCrateId;
    const activeJob = myPlayer?.activeJob;

    let actionButtonHtml = '';
    let costOutcomeHtml = '';
    let extraControlsHtml = '';
    let statusNotice = '';

    // If currently performing a job here
    if (activeJob) {
      statusNotice = `
        <div class="mb-4 p-3 bg-blue-900/50 border border-blue-500 rounded-lg text-blue-200">
          <div class="flex justify-between items-center mb-1 text-sm font-semibold">
            <span>Đang thực hiện công tác...</span>
            <span>${Math.round(activeJob.progress * 100)}%</span>
          </div>
          <div class="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div class="bg-blue-500 h-2.5 rounded-full transition-all duration-200" style="width: ${activeJob.progress * 100}%"></div>
          </div>
          <p class="text-xs text-slate-300 mt-2">Di chuyển khỏi vị trí sẽ hủy công việc hiện tại.</p>
        </div>
      `;
      actionButtonHtml = `
        <button id="btn-cancel-job" class="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition">
          Hủy công việc đang làm
        </button>
      `;
    } else {
      // Generate contextual action for this POI
      switch (poi.id) {
        case 'PRACTICE_TARGET':
          if (snap.phase === 'PRACTICE') {
            if (isCarrying) {
              actionButtonHtml = `<button id="btn-deliver-practice" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">Giao kiện mẫu (Thực hành)</button>`;
            } else {
              statusNotice = `<p class="text-amber-300 text-sm">Bạn cần đến Kho lấy kiện mẫu trước khi giao tới đây.</p>`;
            }
          }
          break;

        case 'WAREHOUSE':
          if (isCarrying) {
            actionButtonHtml = `
              <div class="grid grid-cols-2 gap-2">
                <button id="btn-return-crate" class="py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition">Trả kiện về kho</button>
                <button id="btn-drop-crate" class="py-2.5 bg-slate-600 hover:bg-slate-700 text-white font-bold rounded-lg transition">Đặt xuống đất</button>
              </div>
            `;
          } else {
            actionButtonHtml = `
              <button id="btn-pick-crate" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition ${snap.resources.availableCrates <= 0 ? 'opacity-50 cursor-not-allowed' : ''}">
                Lấy 1 kiện vật tư (Còn ${snap.resources.availableCrates} kiện)
              </button>
            `;
          }

          if (snap.m3.status === 'ACTIVE' && !snap.m3.lossAuditDone) {
            extraControlsHtml += `
              <div class="mt-3 pt-3 border-t border-slate-700">
                <p class="text-xs text-amber-300 mb-2">Nhiệm vụ 3: Đối chiếu sổ sách kho với hiện trường để làm rõ phản ánh thất thoát.</p>
                <button id="btn-audit-ledger" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition">
                  Kiểm tra đối chiếu sổ sách kho (4s)
                </button>
              </div>
            `;
          }
          break;

        case 'ZONE_A':
        case 'ZONE_B':
        case 'ZONE_C':
          const zoneKey = poi.id.replace('ZONE_', '') as 'A' | 'B' | 'C';
          const surveyDone = snap.m1.surveys[zoneKey];

          if (snap.m1.status === 'ACTIVE') {
            if (!surveyDone) {
              actionButtonHtml = `
                <button id="btn-survey-zone" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">
                  Khảo sát nhu cầu y tế (4s, +2 điểm)
                </button>
              `;
            } else {
              statusNotice = `<p class="text-emerald-400 text-sm">Hồ sơ nhu cầu ${poi.name} đã được thu thập hoàn tất.</p>`;
            }
          }

          // M2 delivery & verify for Zone B
          if (poi.id === 'ZONE_B' && snap.m2.status === 'ACTIVE') {
            if (isCarrying && snap.m2.reliefCratesDeliveredB < 2) {
              extraControlsHtml += `
                <button id="btn-deliver-relief-b" class="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition mt-2">
                  Giao kiện cứu trợ khẩn cấp (${snap.m2.reliefCratesDeliveredB}/2 kiện, +8 điểm)
                </button>
              `;
            }
            if (snap.m2.reliefCratesDeliveredB >= 2 && !snap.m2.verifiedB) {
              extraControlsHtml += `
                <button id="btn-verify-b" class="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition mt-2">
                  Xác minh bàn giao tại Khu B (4s, +4 điểm)
                </button>
              `;
            }
          }

          // M3 feedback for Zone C
          if (poi.id === 'ZONE_C' && snap.m3.status === 'ACTIVE' && !snap.m3.receivedFeedbackC) {
            extraControlsHtml += `
              <button id="btn-m3-feedback" class="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition mt-2">
                Tiếp nhận phản ánh từ đại diện Khu C (+5 điểm)
              </button>
            `;
          }
          break;

        case 'HEADQUARTERS':
          // Headquarters: Planning & Voting
          if (snap.m1.status === 'ACTIVE' && snap.m1.planCommitted === 'NONE') {
            const has3Surveys = snap.m1.surveys.A && snap.m1.surveys.B && snap.m1.surveys.C;
            if (!has3Surveys) {
              statusNotice = `<p class="text-amber-300 text-sm">Cần thu thập đủ 3 hồ sơ khảo sát (A, B, C) trước khi mở lập kế hoạch.</p>`;
            } else {
              extraControlsHtml = `
                <div class="space-y-3">
                  <div class="p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div class="flex justify-between items-center mb-1">
                      <span class="font-bold text-amber-400">Phương án 1: Trạm cố định (Gần A)</span>
                      <span class="text-xs px-2 py-0.5 bg-amber-900 text-amber-200 rounded">Tập trung</span>
                    </div>
                    <p class="text-xs text-slate-300">Chi phí: 40 ngân sách, 2 kiện vật tư. Phục vụ 22 dân (A12, B10, C0). Ít chuyến đi, nhưng Khu C chưa tiếp cận.</p>
                    <button id="btn-propose-m1-fixed" class="mt-2 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded transition">
                      Đề xuất phương án Trạm cố định
                    </button>
                  </div>

                  <div class="p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div class="flex justify-between items-center mb-1">
                      <span class="font-bold text-sky-400">Phương án 2: Điểm lưu động (B & C)</span>
                      <span class="text-xs px-2 py-0.5 bg-sky-900 text-sky-200 rounded">Phân tán</span>
                    </div>
                    <p class="text-xs text-slate-300">Chi phí: 30 ngân sách, 4 kiện vật tư. Phục vụ 24 dân (A10, B8, C6). Ngân sách thấp hơn, độ phủ rộng hơn nhưng cần nhiều vận chuyển.</p>
                    <button id="btn-propose-m1-mobile" class="mt-2 w-full py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded transition">
                      Đề xuất phương án Điểm lưu động
                    </button>
                  </div>
                </div>
              `;
            }
          } else if (snap.m2.status === 'ACTIVE' && snap.m2.planCommitted === 'NONE') {
            if (!snap.m2.surveyDone) {
              statusNotice = `<p class="text-amber-300 text-sm">Cần ra hiện trường Cầu để khảo sát sự cố trước khi lập phương án.</p>`;
            } else {
              extraControlsHtml = `
                <div class="space-y-3">
                  <div class="p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <span class="font-bold text-emerald-400">Phương án REPAIR: Sửa cầu</span>
                    <p class="text-xs text-slate-300 mt-1">Chi phí: 25 ngân sách, 2 kiện sửa + 2 kiện cứu trợ = 4 kiện. Khôi phục hoàn toàn huyết mạch ngắn sang Khu B.</p>
                    <button id="btn-propose-m2-repair" class="mt-2 w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded transition">
                      Đề xuất phương án Sửa cầu (REPAIR)
                    </button>
                  </div>

                  <div class="p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <span class="font-bold text-amber-400">Phương án DETOUR: Tuyến đường vòng</span>
                    <p class="text-xs text-slate-300 mt-1">Chi phí: 10 ngân sách, 2 kiện cứu trợ. Tiết kiệm ngân sách, nhưng cầu vẫn hỏng, đường đi dài hơn gấp đôi.</p>
                    <button id="btn-propose-m2-detour" class="mt-2 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded transition">
                      Đề xuất phương án Tuyến vòng (DETOUR)
                    </button>
                  </div>
                </div>
              `;
            }
          } else if (snap.m3.status === 'ACTIVE' && !snap.m3.planConfirmed) {
            if (!snap.m3.receivedFeedbackC || !snap.m3.crossCheckedList) {
              statusNotice = `<p class="text-amber-300 text-sm">Cần nhận phản ánh tại C và đối chiếu danh sách y tế trước khi xác nhận kế hoạch hỗ trợ.</p>`;
            } else {
              extraControlsHtml = `
                <div class="p-3 bg-slate-800 rounded-lg border border-indigo-500">
                  <span class="font-bold text-indigo-400">Biện pháp khắc phục tận nơi Cụ C1, C2</span>
                  <p class="text-xs text-slate-300 mt-1">Chi phí: 20 ngân sách, 2 kiện vật tư. Căn cứ quy tắc bảo đảm quyền con người, không cần mở biểu quyết.</p>
                  <button id="btn-confirm-m3-plan" class="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded transition">
                    Xác nhận cam kết phương án hỗ trợ tận nhà
                  </button>
                </div>
              `;
            }
          } else {
            statusNotice = `<p class="text-slate-300 text-sm">Các kế hoạch chính quyền hiện tại đã được thông qua và đang trong giai đoạn triển khai.</p>`;
          }
          break;

        case 'CLINIC_FIXED':
          if (snap.m1.planCommitted === 'FIXED') {
            if (isCarrying && snap.m1.deliveredCratesFixed < 2) {
              actionButtonHtml = `
                <button id="btn-deliver-fixed" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">
                  Giao kiện cho Trạm cố định (${snap.m1.deliveredCratesFixed}/2 kiện)
                </button>
              `;
            } else if (snap.m1.deliveredCratesFixed >= 2 && !snap.m1.fixedDeployed) {
              actionButtonHtml = `
                <button id="btn-deploy-fixed" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">
                  Bắt đầu thi công Trạm y tế cố định (8s, cần 1 đơn vị công tác)
                </button>
              `;
            } else if (snap.m1.fixedDeployed && !snap.m1.verifiedA) {
              actionButtonHtml = `
                <button id="btn-verify-fixed" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">
                  Kiểm tra kết quả phục vụ dân cư (4s, +8 điểm)
                </button>
              `;
            } else if (snap.m3.status === 'ACTIVE' && !snap.m3.crossCheckedList) {
              actionButtonHtml = `
                <button id="btn-crosscheck-fixed" class="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition">
                  Đối chiếu danh sách phục vụ công dân C1, C2 (+5 điểm)
                </button>
              `;
            } else {
              statusNotice = `<p class="text-emerald-400 text-sm">Trạm y tế cố định đang vận hành phục vụ nhân dân ổn định.</p>`;
            }
          }
          break;

        case 'CLINIC_MOBILE_B':
          if (snap.m1.planCommitted === 'MOBILE') {
            if (isCarrying && snap.m1.deliveredCratesMobileB < 2) {
              actionButtonHtml = `
                <button id="btn-deliver-mobile-b" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">
                  Giao kiện cho Điểm B (${snap.m1.deliveredCratesMobileB}/2 kiện)
                </button>
              `;
            } else if (snap.m1.deliveredCratesMobileB >= 2 && !snap.m1.mobileBDeployed) {
              actionButtonHtml = `
                <button id="btn-deploy-mobile-b" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">
                  Triển khai tổ y tế lưu động B (6s, 1 đơn vị công tác)
                </button>
              `;
            } else if (snap.m1.mobileBDeployed && !snap.m1.verifiedB) {
              actionButtonHtml = `
                <button id="btn-verify-mobile-b" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">
                  Kiểm tra kết quả tại Điểm B (4s, +4 điểm)
                </button>
              `;
            }
          }
          break;

        case 'CLINIC_MOBILE_C':
          if (snap.m1.planCommitted === 'MOBILE') {
            if (isCarrying && snap.m1.deliveredCratesMobileC < 2) {
              actionButtonHtml = `
                <button id="btn-deliver-mobile-c" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">
                  Giao kiện cho Điểm C (${snap.m1.deliveredCratesMobileC}/2 kiện)
                </button>
              `;
            } else if (snap.m1.deliveredCratesMobileC >= 2 && !snap.m1.mobileCDeployed) {
              actionButtonHtml = `
                <button id="btn-deploy-mobile-c" class="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">
                  Triển khai tổ y tế lưu động C (6s, 1 đơn vị công tác)
                </button>
              `;
            } else if (snap.m1.mobileCDeployed && !snap.m1.verifiedC) {
              actionButtonHtml = `
                <button id="btn-verify-mobile-c" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">
                  Kiểm tra kết quả tại Điểm C (4s, +4 điểm)
                </button>
              `;
            } else if (snap.m3.status === 'ACTIVE' && !snap.m3.crossCheckedList) {
              actionButtonHtml = `
                <button id="btn-crosscheck-mobile-c" class="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition">
                  Đối chiếu danh sách phục vụ công dân C1, C2 (+5 điểm)
                </button>
              `;
            }
          }
          break;

        case 'BRIDGE':
        case 'BRIDGE_TASK_1':
        case 'BRIDGE_TASK_2':
          if (snap.m2.status === 'ACTIVE') {
            if (!snap.m2.surveyDone) {
              actionButtonHtml = `
                <button id="btn-survey-bridge" class="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg transition">
                  Khảo sát hiện trường sụt lún cầu (Lập hồ sơ, +5 điểm)
                </button>
              `;
            } else if (snap.m2.planCommitted === 'REPAIR') {
              if (isCarrying && snap.m2.bridgeCratesDelivered < 2) {
                actionButtonHtml = `
                  <button id="btn-deliver-bridge-repair" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">
                    Giao vật tư sửa cầu (${snap.m2.bridgeCratesDelivered}/2 kiện)
                  </button>
                `;
              } else if (snap.m2.bridgeCratesDelivered >= 2) {
                let repairBtns = '';
                if (!snap.m2.bridgeRepairTask1) {
                  repairBtns += `<button id="btn-repair-t1" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition mb-2">Sửa mố cầu phía Tây (8s, 1 đơn vị công tác)</button>`;
                }
                if (!snap.m2.bridgeRepairTask2) {
                  repairBtns += `<button id="btn-repair-t2" class="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition">Sửa dầm cầu phía Đông (8s, 1 đơn vị công tác)</button>`;
                }
                actionButtonHtml = repairBtns || `<p class="text-emerald-400 text-sm">Cầu đã sửa xong!</p>`;
              }
            } else if (snap.m2.planCommitted === 'DETOUR') {
              statusNotice = `<p class="text-amber-300 text-sm">Đội đã chọn phương án Tuyến vòng. Cầu này được phong tỏa để đi vòng phía Bắc.</p>`;
            }
          }
          break;

        case 'CITIZEN_C1':
          if (snap.m3.status === 'ACTIVE' && snap.m3.planConfirmed) {
            if (isCarrying && !snap.m3.deliveredC1) {
              actionButtonHtml = `<button id="btn-deliver-c1" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">Giao kiện vật tư y tế cho Cụ C1</button>`;
            } else if (snap.m3.deliveredC1 && !snap.m3.deployedC1) {
              actionButtonHtml = `<button id="btn-deploy-c1" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">Hỗ trợ chăm sóc y tế tận nơi (5s, +7 điểm)</button>`;
            } else if (snap.m3.deployedC1) {
              statusNotice = `<p class="text-emerald-400 text-sm">Cụ C1 đã được cán bộ y tế chăm sóc chu đáo tại nhà.</p>`;
            }
          }
          break;

        case 'CITIZEN_C2':
          if (snap.m3.status === 'ACTIVE' && snap.m3.planConfirmed) {
            if (isCarrying && !snap.m3.deliveredC2) {
              actionButtonHtml = `<button id="btn-deliver-c2" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">Giao kiện vật tư y tế cho Cụ C2</button>`;
            } else if (snap.m3.deliveredC2 && !snap.m3.deployedC2) {
              actionButtonHtml = `<button id="btn-deploy-c2" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition">Hỗ trợ chăm sóc y tế tận nơi (5s, +7 điểm)</button>`;
            } else if (snap.m3.deployedC2) {
              statusNotice = `<p class="text-emerald-400 text-sm">Cụ C2 đã được cán bộ y tế chăm sóc chu đáo tại nhà.</p>`;
            }
          }
          break;

        case 'NOTICE_BOARD':
          if (snap.m1.status === 'ACTIVE' && !snap.m1.noticePublished) {
            actionButtonHtml = `<button id="btn-publish-m1" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">Niêm yết công khai kết quả M1 (+6 điểm, hoàn thành M1)</button>`;
          } else if (snap.m2.status === 'ACTIVE' && !snap.m2.noticePublished) {
            actionButtonHtml = `<button id="btn-publish-m2" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">Niêm yết công khai kết quả M2 (+5 điểm, hoàn thành M2)</button>`;
          } else if (snap.m3.status === 'ACTIVE' && !snap.m3.noticePublished) {
            actionButtonHtml = `<button id="btn-publish-m3" class="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">Niêm yết bản tổng hợp M3 (+6 điểm, kết thúc trận)</button>`;
          } else {
            statusNotice = `<p class="text-slate-300 text-sm">Mọi thông tin tài chính và kết quả công tác đều được niêm yết minh bạch.</p>`;
          }
          break;
      }
    }

    this.container.innerHTML = `
      <div class="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-white animate-fade-in mx-4">
        <!-- Close button -->
        <button id="btn-close-action-panel" class="absolute top-4 right-4 text-slate-400 hover:text-white transition">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
        </button>

        <div class="flex items-center space-x-3 mb-4">
          <div class="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400 flex items-center justify-center font-bold text-blue-400">
            ★
          </div>
          <div>
            <h2 class="text-lg font-bold text-white">${poi.name}</h2>
            <p class="text-xs text-slate-400">${poi.vietnameseLabel}</p>
          </div>
        </div>

        <p class="text-sm text-slate-300 mb-4 bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
          ${poi.description}
        </p>

        ${statusNotice}
        ${actionButtonHtml}
        ${extraControlsHtml}
      </div>
    `;

    this.attachEventListeners();
  }

  private attachEventListeners() {
    const bindBtn = (id: string, action: () => void) => {
      const btn = this.container.querySelector(`#${id}`);
      if (btn) btn.addEventListener('click', action);
    };

    bindBtn('btn-close-action-panel', () => this.hide());

    bindBtn('btn-cancel-job', () => {
      this.socketClient.sendIntent({ actionId: `c_${Date.now()}`, type: 'CANCEL_JOB' });
    });

    bindBtn('btn-pick-crate', () => {
      this.socketClient.sendIntent({ actionId: `p_${Date.now()}`, type: 'PICK_CRATE' });
    });

    bindBtn('btn-return-crate', () => {
      this.socketClient.sendIntent({ actionId: `r_${Date.now()}`, type: 'RETURN_CRATE' });
    });

    bindBtn('btn-drop-crate', () => {
      this.socketClient.sendIntent({ actionId: `d_${Date.now()}`, type: 'DROP_CRATE' });
    });

    bindBtn('btn-deliver-practice', () => {
      this.socketClient.sendIntent({ actionId: `del_p_${Date.now()}`, type: 'DELIVER_CRATE', payload: { targetId: 'PRACTICE_TARGET' } });
    });

    bindBtn('btn-survey-zone', () => {
      if (!this.currentPoi) return;
      this.socketClient.sendIntent({
        actionId: `sv_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'SURVEY_ZONE', targetId: this.currentPoi.id }
      });
    });

    bindBtn('btn-propose-m1-fixed', () => {
      this.socketClient.sendIntent({
        actionId: `prop_m1_${Date.now()}`,
        type: 'PROPOSE_PLAN',
        payload: { missionId: 'M1', plan: 'FIXED' }
      });
      this.hide();
    });

    bindBtn('btn-propose-m1-mobile', () => {
      this.socketClient.sendIntent({
        actionId: `prop_m1_${Date.now()}`,
        type: 'PROPOSE_PLAN',
        payload: { missionId: 'M1', plan: 'MOBILE' }
      });
      this.hide();
    });

    bindBtn('btn-propose-m2-repair', () => {
      this.socketClient.sendIntent({
        actionId: `prop_m2_${Date.now()}`,
        type: 'PROPOSE_PLAN',
        payload: { missionId: 'M2', plan: 'REPAIR' }
      });
      this.hide();
    });

    bindBtn('btn-propose-m2-detour', () => {
      this.socketClient.sendIntent({
        actionId: `prop_m2_${Date.now()}`,
        type: 'PROPOSE_PLAN',
        payload: { missionId: 'M2', plan: 'DETOUR' }
      });
      this.hide();
    });

    bindBtn('btn-deliver-fixed', () => {
      this.socketClient.sendIntent({
        actionId: `del_fix_${Date.now()}`,
        type: 'DELIVER_CRATE',
        payload: { targetId: 'CLINIC_FIXED' }
      });
    });

    bindBtn('btn-deploy-fixed', () => {
      this.socketClient.sendIntent({
        actionId: `dep_fix_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'DEPLOY_FIXED_CLINIC', targetId: 'CLINIC_FIXED' }
      });
    });

    bindBtn('btn-verify-fixed', () => {
      this.socketClient.sendIntent({
        actionId: `ver_fix_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'AUDIT_RESULT', targetId: 'CLINIC_FIXED' }
      });
    });

    bindBtn('btn-deliver-mobile-b', () => {
      this.socketClient.sendIntent({
        actionId: `del_mb_${Date.now()}`,
        type: 'DELIVER_CRATE',
        payload: { targetId: 'CLINIC_MOBILE_B' }
      });
    });

    bindBtn('btn-deploy-mobile-b', () => {
      this.socketClient.sendIntent({
        actionId: `dep_mb_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'DEPLOY_MOBILE_CLINIC', targetId: 'CLINIC_MOBILE_B' }
      });
    });

    bindBtn('btn-verify-mobile-b', () => {
      this.socketClient.sendIntent({
        actionId: `ver_mb_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'AUDIT_RESULT', targetId: 'CLINIC_MOBILE_B' }
      });
    });

    bindBtn('btn-deliver-mobile-c', () => {
      this.socketClient.sendIntent({
        actionId: `del_mc_${Date.now()}`,
        type: 'DELIVER_CRATE',
        payload: { targetId: 'CLINIC_MOBILE_C' }
      });
    });

    bindBtn('btn-deploy-mobile-c', () => {
      this.socketClient.sendIntent({
        actionId: `dep_mc_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'DEPLOY_MOBILE_CLINIC', targetId: 'CLINIC_MOBILE_C' }
      });
    });

    bindBtn('btn-verify-mobile-c', () => {
      this.socketClient.sendIntent({
        actionId: `ver_mc_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'AUDIT_RESULT', targetId: 'CLINIC_MOBILE_C' }
      });
    });

    bindBtn('btn-survey-bridge', () => {
      this.socketClient.sendIntent({
        actionId: `sv_br_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'SURVEY_BRIDGE', targetId: 'BRIDGE' }
      });
    });

    bindBtn('btn-deliver-bridge-repair', () => {
      this.socketClient.sendIntent({
        actionId: `del_br_${Date.now()}`,
        type: 'DELIVER_CRATE',
        payload: { targetId: 'BRIDGE' }
      });
    });

    bindBtn('btn-repair-t1', () => {
      this.socketClient.sendIntent({
        actionId: `rep_t1_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'REPAIR_BRIDGE_1', targetId: 'BRIDGE_TASK_1' }
      });
    });

    bindBtn('btn-repair-t2', () => {
      this.socketClient.sendIntent({
        actionId: `rep_t2_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'REPAIR_BRIDGE_2', targetId: 'BRIDGE_TASK_2' }
      });
    });

    bindBtn('btn-deliver-relief-b', () => {
      this.socketClient.sendIntent({
        actionId: `del_rlf_${Date.now()}`,
        type: 'DELIVER_CRATE',
        payload: { targetId: 'ZONE_B' }
      });
    });

    bindBtn('btn-verify-b', () => {
      this.socketClient.sendIntent({
        actionId: `ver_b_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'AUDIT_RESULT', targetId: 'ZONE_B' }
      });
    });

    bindBtn('btn-m3-feedback', () => {
      this.socketClient.sendIntent({
        actionId: `m3_fb_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'RECEIVE_FEEDBACK_C', targetId: 'ZONE_C' }
      });
    });

    bindBtn('btn-crosscheck-fixed', () => {
      this.socketClient.sendIntent({
        actionId: `cc_fix_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'CROSS_CHECK_CLINIC', targetId: 'CLINIC_FIXED' }
      });
    });

    bindBtn('btn-crosscheck-mobile-c', () => {
      this.socketClient.sendIntent({
        actionId: `cc_mc_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'CROSS_CHECK_CLINIC', targetId: 'CLINIC_MOBILE_C' }
      });
    });

    bindBtn('btn-confirm-m3-plan', () => {
      this.socketClient.sendIntent({
        actionId: `conf_m3_${Date.now()}`,
        type: 'CONFIRM_M3_PLAN'
      });
    });

    bindBtn('btn-deliver-c1', () => {
      this.socketClient.sendIntent({
        actionId: `del_c1_${Date.now()}`,
        type: 'DELIVER_CRATE',
        payload: { targetId: 'CITIZEN_C1' }
      });
    });

    bindBtn('btn-deploy-c1', () => {
      this.socketClient.sendIntent({
        actionId: `dep_c1_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'SUPPORT_CITIZEN', targetId: 'CITIZEN_C1' }
      });
    });

    bindBtn('btn-deliver-c2', () => {
      this.socketClient.sendIntent({
        actionId: `del_c2_${Date.now()}`,
        type: 'DELIVER_CRATE',
        payload: { targetId: 'CITIZEN_C2' }
      });
    });

    bindBtn('btn-deploy-c2', () => {
      this.socketClient.sendIntent({
        actionId: `dep_c2_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'SUPPORT_CITIZEN', targetId: 'CITIZEN_C2' }
      });
    });

    bindBtn('btn-audit-ledger', () => {
      this.socketClient.sendIntent({
        actionId: `aud_led_${Date.now()}`,
        type: 'START_JOB',
        payload: { type: 'AUDIT_LEDGER', targetId: 'WAREHOUSE' }
      });
    });

    bindBtn('btn-publish-m1', () => {
      this.socketClient.sendIntent({
        actionId: `pub_m1_${Date.now()}`,
        type: 'PUBLISH_NOTICE',
        payload: { missionId: 'M1' }
      });
      this.hide();
    });

    bindBtn('btn-publish-m2', () => {
      this.socketClient.sendIntent({
        actionId: `pub_m2_${Date.now()}`,
        type: 'PUBLISH_NOTICE',
        payload: { missionId: 'M2' }
      });
      this.hide();
    });

    bindBtn('btn-publish-m3', () => {
      this.socketClient.sendIntent({
        actionId: `pub_m3_${Date.now()}`,
        type: 'PUBLISH_NOTICE',
        payload: { missionId: 'M3' }
      });
      this.hide();
    });
  }
}
