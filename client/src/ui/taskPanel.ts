import { GameSnapshot, POINTS_OF_INTEREST } from 'shared';

export class TaskPanel {
  private container: HTMLElement;
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
    let nextStepText = '';
    let targetPoi: { x: number; y: number; name: string } | null = null;
    let taskListHtml = '';

    if (snapshot.phase === 'PRACTICE') {
      nextStepText = 'Đến Kho lấy 1 kiện vật tư mẫu rồi giao vào Điểm tập kết mẫu.';
      targetPoi = { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y, name: 'Kho vật tư' };
      taskListHtml = `
        <div class="space-y-2 mt-2">
          <div class="flex items-center justify-between p-2 rounded bg-slate-800">
            <span>1. Lấy kiện mẫu tại Kho</span>
            <span class="${snapshot.practiceCrateDelivered ? 'text-emerald-400 font-bold' : 'text-amber-400'}">${snapshot.practiceCrateDelivered ? '✓ Xong' : 'Chưa giao'}</span>
          </div>
        </div>
      `;
    } else if (snapshot.phase === 'RUNNING') {
      if (snapshot.m1.status === 'ACTIVE') {
        const hasSurveys = snapshot.m1.surveys.A && snapshot.m1.surveys.B && snapshot.m1.surveys.C;
        if (!hasSurveys) {
          if (!snapshot.m1.surveys.A) {
            nextStepText = 'Khảo sát nhu cầu y tế tại Khu dân cư A.';
            targetPoi = { x: POINTS_OF_INTEREST.ZONE_A.x, y: POINTS_OF_INTEREST.ZONE_A.y, name: 'Khu A' };
          } else if (!snapshot.m1.surveys.B) {
            nextStepText = 'Khảo sát nhu cầu y tế tại Khu dân cư B (phía Đông).';
            targetPoi = { x: POINTS_OF_INTEREST.ZONE_B.x, y: POINTS_OF_INTEREST.ZONE_B.y, name: 'Khu B' };
          } else {
            nextStepText = 'Khảo sát nhu cầu y tế tại Khu dân cư C (phía Nam).';
            targetPoi = { x: POINTS_OF_INTEREST.ZONE_C.x, y: POINTS_OF_INTEREST.ZONE_C.y, name: 'Khu C' };
          }
        } else if (snapshot.m1.planCommitted === 'NONE') {
          nextStepText = 'Đến Trụ sở chính quyền để đề xuất & biểu quyết kế hoạch dịch vụ y tế.';
          targetPoi = { x: POINTS_OF_INTEREST.HEADQUARTERS.x, y: POINTS_OF_INTEREST.HEADQUARTERS.y, name: 'Trụ sở' };
        } else if (snapshot.m1.planCommitted === 'FIXED') {
          if (snapshot.m1.deliveredCratesFixed < 2) {
            nextStepText = `Lấy vật tư từ Kho và giao đến Trạm y tế cố định (${snapshot.m1.deliveredCratesFixed}/2 kiện).`;
            targetPoi = { x: POINTS_OF_INTEREST.CLINIC_FIXED.x, y: POINTS_OF_INTEREST.CLINIC_FIXED.y, name: 'Trạm cố định' };
          } else if (!snapshot.m1.fixedDeployed) {
            nextStepText = 'Đến Trạm y tế cố định và bắt đầu thi công (8 giây).';
            targetPoi = { x: POINTS_OF_INTEREST.CLINIC_FIXED.x, y: POINTS_OF_INTEREST.CLINIC_FIXED.y, name: 'Trạm cố định' };
          } else if (!snapshot.m1.verifiedA) {
            nextStepText = 'Kiểm tra và xác minh kết quả phục vụ dân cư tại Trạm y tế cố định.';
            targetPoi = { x: POINTS_OF_INTEREST.CLINIC_FIXED.x, y: POINTS_OF_INTEREST.CLINIC_FIXED.y, name: 'Trạm cố định' };
          } else if (!snapshot.m1.noticePublished) {
            nextStepText = 'Đến Bảng công khai để niêm yết kết quả ngân sách M1.';
            targetPoi = { x: POINTS_OF_INTEREST.NOTICE_BOARD.x, y: POINTS_OF_INTEREST.NOTICE_BOARD.y, name: 'Bảng công khai' };
          }
        } else if (snapshot.m1.planCommitted === 'MOBILE') {
          if (snapshot.m1.deliveredCratesMobileB < 2 || snapshot.m1.deliveredCratesMobileC < 2) {
            nextStepText = 'Lấy vật tư từ Kho giao đến Điểm lưu động B và C.';
            targetPoi = { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y, name: 'Kho vật tư' };
          } else if (!snapshot.m1.mobileBDeployed || !snapshot.m1.mobileCDeployed) {
            nextStepText = 'Triển khai tổ y tế lưu động tại các điểm B và C.';
            targetPoi = { x: POINTS_OF_INTEREST.CLINIC_MOBILE_B.x, y: POINTS_OF_INTEREST.CLINIC_MOBILE_B.y, name: 'Điểm B' };
          } else if (!snapshot.m1.verifiedB || !snapshot.m1.verifiedC) {
            nextStepText = 'Kiểm tra và nghiệm thu dịch vụ tại Điểm B và C.';
            targetPoi = { x: POINTS_OF_INTEREST.CLINIC_MOBILE_B.x, y: POINTS_OF_INTEREST.CLINIC_MOBILE_B.y, name: 'Điểm B' };
          } else if (!snapshot.m1.noticePublished) {
            nextStepText = 'Đến Bảng công khai để niêm yết kết quả M1.';
            targetPoi = { x: POINTS_OF_INTEREST.NOTICE_BOARD.x, y: POINTS_OF_INTEREST.NOTICE_BOARD.y, name: 'Bảng công khai' };
          }
        }

        taskListHtml = `
          <div class="space-y-1.5 mt-2">
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>1. Khảo sát 3 khu dân cư (A, B, C)</span>
              <span class="${hasSurveys ? 'text-emerald-400 font-bold' : 'text-amber-400'}">${hasSurveys ? '✓ 6/6đ' : 'Đang làm'}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>2. Biểu quyết phương án tại Trụ sở</span>
              <span class="${snapshot.m1.planCommitted !== 'NONE' ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${snapshot.m1.planCommitted !== 'NONE' ? `✓ ${snapshot.m1.planCommitted}` : 'Chưa'}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>3. Giao vật tư & triển khai</span>
              <span class="${(snapshot.m1.fixedDeployed || (snapshot.m1.mobileBDeployed && snapshot.m1.mobileCDeployed)) ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${(snapshot.m1.fixedDeployed || (snapshot.m1.mobileBDeployed && snapshot.m1.mobileCDeployed)) ? '✓ 10/10đ' : 'Chưa'}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>4. Nghiệm thu kết quả phục vụ</span>
              <span class="${(snapshot.m1.verifiedA || (snapshot.m1.verifiedB && snapshot.m1.verifiedC)) ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${(snapshot.m1.verifiedA || (snapshot.m1.verifiedB && snapshot.m1.verifiedC)) ? '✓ 8/8đ' : 'Chưa'}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>5. Niêm yết Bảng công khai</span>
              <span class="${snapshot.m1.noticePublished ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${snapshot.m1.noticePublished ? '✓ 6/6đ' : 'Chưa'}</span>
            </div>
          </div>
        `;
      } else if (snapshot.m2.status === 'ACTIVE') {
        if (!snapshot.m2.surveyDone) {
          nextStepText = 'Đến hiện trường Cầu qua kênh để khảo sát sự cố sụt lún.';
          targetPoi = { x: POINTS_OF_INTEREST.BRIDGE.x, y: POINTS_OF_INTEREST.BRIDGE.y, name: 'Cầu qua kênh' };
        } else if (snapshot.m2.planCommitted === 'NONE') {
          nextStepText = 'Đến Trụ sở chính quyền để đề xuất & biểu quyết phương án M2 (Sửa cầu hoặc Đi tuyến vòng).';
          targetPoi = { x: POINTS_OF_INTEREST.HEADQUARTERS.x, y: POINTS_OF_INTEREST.HEADQUARTERS.y, name: 'Trụ sở' };
        } else if (snapshot.m2.planCommitted === 'REPAIR' && !snapshot.m2.bridgeRepaired) {
          if (snapshot.m2.bridgeCratesDelivered < 2) {
            nextStepText = `Chuyển vật tư từ Kho đến Cầu (${snapshot.m2.bridgeCratesDelivered}/2 kiện).`;
            targetPoi = { x: POINTS_OF_INTEREST.BRIDGE.x, y: POINTS_OF_INTEREST.BRIDGE.y, name: 'Cầu qua kênh' };
          } else {
            nextStepText = 'Thực hiện 2 công tác sửa mố Tây và dầm Đông của cầu.';
            targetPoi = { x: POINTS_OF_INTEREST.BRIDGE.x, y: POINTS_OF_INTEREST.BRIDGE.y, name: 'Cầu qua kênh' };
          }
        } else if (snapshot.m2.reliefCratesDeliveredB < 2) {
          nextStepText = `Vận chuyển kiện cứu trợ khẩn cấp đến Khu dân cư B (${snapshot.m2.reliefCratesDeliveredB}/2 kiện).`;
          targetPoi = { x: POINTS_OF_INTEREST.ZONE_B.x, y: POINTS_OF_INTEREST.ZONE_B.y, name: 'Khu B' };
        } else if (!snapshot.m2.verifiedB) {
          nextStepText = 'Kiểm tra và xác minh bàn giao cứu trợ tại Khu B.';
          targetPoi = { x: POINTS_OF_INTEREST.ZONE_B.x, y: POINTS_OF_INTEREST.ZONE_B.y, name: 'Khu B' };
        } else if (!snapshot.m2.noticePublished) {
          nextStepText = 'Đến Bảng công khai để niêm yết kết quả xử lý sự cố M2.';
          targetPoi = { x: POINTS_OF_INTEREST.NOTICE_BOARD.x, y: POINTS_OF_INTEREST.NOTICE_BOARD.y, name: 'Bảng công khai' };
        }

        taskListHtml = `
          <div class="space-y-1.5 mt-2">
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>1. Khảo sát hiện trường cầu</span>
              <span class="${snapshot.m2.surveyDone ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${snapshot.m2.surveyDone ? '✓ 5/5đ' : 'Chưa'}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>2. Biểu quyết phương án tại Trụ sở</span>
              <span class="${snapshot.m2.planCommitted !== 'NONE' ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${snapshot.m2.planCommitted !== 'NONE' ? `✓ ${snapshot.m2.planCommitted}` : 'Chưa'}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>3. Giao 2 kiện cứu trợ đến Khu B</span>
              <span class="${snapshot.m2.reliefCratesDeliveredB >= 2 ? 'text-emerald-400 font-bold' : 'text-amber-400'}">${snapshot.m2.reliefCratesDeliveredB}/2 kiện</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>4. Nghiệm thu cứu trợ tại Khu B</span>
              <span class="${snapshot.m2.verifiedB ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${snapshot.m2.verifiedB ? '✓ 4/4đ' : 'Chưa'}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>5. Niêm yết Bảng công khai M2</span>
              <span class="${snapshot.m2.noticePublished ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${snapshot.m2.noticePublished ? '✓ 5/5đ' : 'Chưa'}</span>
            </div>
          </div>
        `;
      } else if (snapshot.m3.status === 'ACTIVE') {
        if (!snapshot.m3.receivedFeedbackC) {
          nextStepText = 'Đến Khu C gặp đại diện tiếp nhận phản ánh về Cụ C1, C2.';
          targetPoi = { x: POINTS_OF_INTEREST.ZONE_C.x, y: POINTS_OF_INTEREST.ZONE_C.y, name: 'Khu C' };
        } else if (!snapshot.m3.crossCheckedList) {
          nextStepText = 'Đến Trạm y tế để đối chiếu danh sách đối tượng chưa được phục vụ.';
          targetPoi = { x: POINTS_OF_INTEREST.CLINIC_FIXED.x, y: POINTS_OF_INTEREST.CLINIC_FIXED.y, name: 'Trạm y tế' };
        } else if (!snapshot.m3.planConfirmed) {
          nextStepText = 'Đến Trụ sở xác nhận phương án hỗ trợ tận nơi cho C1 và C2.';
          targetPoi = { x: POINTS_OF_INTEREST.HEADQUARTERS.x, y: POINTS_OF_INTEREST.HEADQUARTERS.y, name: 'Trụ sở' };
        } else if (!snapshot.m3.deployedC1 || !snapshot.m3.deployedC2) {
          nextStepText = 'Lấy vật tư từ Kho đến tận nhà chăm sóc y tế cho Cụ C1 và C2.';
          targetPoi = { x: POINTS_OF_INTEREST.CITIZEN_C1.x, y: POINTS_OF_INTEREST.CITIZEN_C1.y, name: 'Hộ C1' };
        } else if (!snapshot.m3.lossAuditDone) {
          nextStepText = 'Đến Kho vật tư đối chiếu sổ sách để làm rõ phản ánh thất thoát.';
          targetPoi = { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y, name: 'Kho vật tư' };
        } else if (!snapshot.m3.noticePublished) {
          nextStepText = 'Đến Bảng công khai niêm yết bản tổng hợp M3.';
          targetPoi = { x: POINTS_OF_INTEREST.NOTICE_BOARD.x, y: POINTS_OF_INTEREST.NOTICE_BOARD.y, name: 'Bảng công khai' };
        }

        taskListHtml = `
          <div class="space-y-1.5 mt-2">
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>1. Nhận phản ánh & đối chiếu danh sách</span>
              <span class="${snapshot.m3.crossCheckedList ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${snapshot.m3.crossCheckedList ? '✓ 10/10đ' : 'Chưa'}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>2. Xác nhận kế hoạch tại Trụ sở</span>
              <span class="${snapshot.m3.planConfirmed ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${snapshot.m3.planConfirmed ? '✓ Đã trừ 20đ' : 'Chưa'}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>3. Chăm sóc tận nhà Cụ C1, C2</span>
              <span class="${(snapshot.m3.deployedC1 && snapshot.m3.deployedC2) ? 'text-emerald-400 font-bold' : 'text-amber-400'}">${(snapshot.m3.deployedC1 && snapshot.m3.deployedC2) ? '✓ 14/14đ' : 'Chưa'}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>4. Đối chiếu sổ sách Kho vật tư</span>
              <span class="${snapshot.m3.lossAuditDone ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${snapshot.m3.lossAuditDone ? '✓ 5/5đ' : 'Chưa'}</span>
            </div>
            <div class="flex items-center justify-between p-2 rounded bg-slate-800/80">
              <span>5. Niêm yết Bảng công khai M3</span>
              <span class="${snapshot.m3.noticePublished ? 'text-emerald-400 font-bold' : 'text-slate-400'}">${snapshot.m3.noticePublished ? '✓ 6/6đ' : 'Chưa'}</span>
            </div>
          </div>
        `;
      }
    }

    this.container.innerHTML = `
      <div class="flex justify-between items-center pb-2 border-b border-slate-700">
        <h3 class="font-bold text-white text-sm flex items-center space-x-1">
          <span>📋</span>
          <span>BẢNG PHÂN VIỆC & TIẾN ĐỘ</span>
        </h3>
        <button id="btn-close-task-panel" class="text-slate-400 hover:text-white transition">✕</button>
      </div>

      <!-- Gợi ý bước tiếp theo -->
      <div class="mt-3 p-2.5 rounded-xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 border border-blue-500/40">
        <div class="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Bạn có thể làm gì tiếp theo:</div>
        <p class="font-semibold text-white mt-1 text-xs leading-relaxed">${nextStepText || 'Đang chờ cập nhật...'}</p>
        ${targetPoi ? `
          <button id="btn-locate-target" class="mt-2 w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition flex items-center justify-center space-x-1">
            <span>🎯</span>
            <span>Định vị: ${targetPoi.name}</span>
          </button>
        ` : ''}
      </div>

      ${taskListHtml}
    `;

    const btnClose = this.container.querySelector('#btn-close-task-panel');
    if (btnClose) btnClose.addEventListener('click', () => this.toggle());

    const btnLocate = this.container.querySelector('#btn-locate-target');
    if (btnLocate && targetPoi && this.onLocateTarget) {
      btnLocate.addEventListener('click', () => {
        this.onLocateTarget!(targetPoi!.x, targetPoi!.y, targetPoi!.name);
      });
    }
  }
}
