import type { StartTaskType } from '../../core/commands.js';
import type { CatalogueContext } from '../../core/interactions.js';

export function appendNgheAnActions(context: CatalogueContext) {
  const { s, add, job, deliver } = context;
  if (s.m1.planCommitted !== 'NONE') {
    const clinics: [string, number, boolean, boolean, StartTaskType][] = s.m1.planCommitted === 'FIXED'
      ? [['CLINIC_FIXED', s.m1.deliveredCratesFixed, s.m1.fixedDeployed, s.m1.verifiedA, 'DEPLOY_FIXED_CLINIC']]
      : s.m1.planCommitted === 'MOBILE' ? [['CLINIC_MOBILE_B', s.m1.deliveredCratesMobileB, s.m1.mobileBDeployed, s.m1.verifiedB, 'DEPLOY_MOBILE_CLINIC'], ['CLINIC_MOBILE_C', s.m1.deliveredCratesMobileC, s.m1.mobileCDeployed, s.m1.verifiedC, 'DEPLOY_MOBILE_CLINIC']] : [];
    for (const [id, count, deployed, verified, type] of clinics) {
      if (count < 2) deliver(id);
      else if (!deployed) job(id, type, 'Triển khai trạm y tế', true);
      else if (!verified) job(id, 'AUDIT_RESULT', 'Nghiệm thu kết quả');
    }
  }
  const na = s.ngheAnState;
  if (!na) return;

  const { chaoLuon, luaDaoDat, quyKhuyenHoc } = na;

  // Quest 1: Cháo lươn
  if (na.currentQuest === 1 || chaoLuon.status === 'ACTIVE') {
    if (!chaoLuon.meetHoa) {
      add('NA_CH_HOA_SHOP', 'Lắng nghe phản ánh Dì Hoa về kinh doanh & vỉa hè quán cháo', { type: 'NGHEAN_ACTION', payload: { action: 'NA_CH_MEET_HOA' } }, 95, 'NPC');
    } else if (!chaoLuon.meetTuan) {
      add('NA_CH_TUAN_SHOP', 'Lắng nghe Chú Tuấn & tiếp thu ý kiến người đi bộ bị lấn đường', { type: 'NGHEAN_ACTION', payload: { action: 'NA_CH_MEET_TUAN' } }, 90, 'NPC');
    } else if (!chaoLuon.measureBoundary) {
      add('NA_CH_SIDEWALK', 'Kẻ vạch sơn 1.5m phân định ranh giới, giữ lối thông thoáng', { type: 'NGHEAN_ACTION', payload: { action: 'NA_CH_MEASURE_BOUNDARY' } }, 90, 'OBJECTIVE');
    } else if (!chaoLuon.signCommitment) {
      add('NA_CH_HOA_SHOP', 'Ký cam kết văn minh thương mại & an toàn vệ sinh thực phẩm', { type: 'NGHEAN_ACTION', payload: { action: 'NA_CH_SIGN_COMMITMENT' } }, 95, 'NPC');
    }
  }

  // Quest 2: Lừa đảo đất
  if (na.currentQuest === 2 || luaDaoDat.status === 'ACTIVE') {
    if (!luaDaoDat.interviewVictim) {
      add('NA_CULTURE_HOUSE', 'Tiếp nhận Mệ Bảy tại Nhà văn hóa, nhận dạng kẻ lừa làm sổ đỏ', { type: 'NGHEAN_ACTION', payload: { action: 'NA_LD_INTERVIEW_VICTIM' } }, 95, 'NPC');
    } else if (!luaDaoDat.askMarket) {
      add('NA_MARKET_ALLEY', 'Hỏi chị bán nhút & bác xích lô ngõ chợ để lần theo dấu vết', { type: 'NGHEAN_ACTION', payload: { action: 'NA_LD_ASK_MARKET' } }, 90, 'NPC');
    } else if (!luaDaoDat.blockShortcut) {
      add('NA_SHORTCUT_BLOCK', 'Chốt chặn lối tắt quán chè, bao vây không cho đối tượng thoát', { type: 'NGHEAN_ACTION', payload: { action: 'NA_LD_BLOCK_SHORTCUT' } }, 90, 'OBJECTIVE');
    } else if (!luaDaoDat.captureSuspect) {
      add('NA_DEAD_END', 'Bắt giữ đối tượng tại ngách cụt, thu hồi giấy tờ & tiền trả Mệ Bảy', { type: 'NGHEAN_ACTION', payload: { action: 'NA_LD_CAPTURE_SUSPECT' } }, 95, 'OBJECTIVE');
    }
  }

  // Quest 3: Quỹ khuyến học
  if (na.currentQuest === 3 || quyKhuyenHoc.status === 'ACTIVE') {
    if (!quyKhuyenHoc.calmCrowd) {
      add('NA_CULTURE_HOUSE', 'Ổn định đám đông bà con, ngăn chặn định kiến khi chưa có chứng cứ', { type: 'NGHEAN_ACTION', payload: { action: 'NA_QK_CALM_CROWD' } }, 95, 'NPC');
    } else {
      if (!quyKhuyenHoc.inspectCabinet) {
        add('NA_CABINET_EVIDENCE', 'Khám nghiệm hộc tủ bị cạy: Thu giữ mẩu vải vàng vướng lại', { type: 'NGHEAN_ACTION', payload: { action: 'NA_QK_INSPECT_CABINET' } }, 90, 'OBJECTIVE');
      }
      if (!quyKhuyenHoc.inspectWindow) {
        add('NA_WINDOW_EVIDENCE', 'Khám nghiệm bậu cửa sổ: Ghi nhận dấu vết bùn đất đỏ đột nhập', { type: 'NGHEAN_ACTION', payload: { action: 'NA_QK_INSPECT_WINDOW' } }, 90, 'OBJECTIVE');
      }
      if (quyKhuyenHoc.inspectCabinet && quyKhuyenHoc.inspectWindow && !quyKhuyenHoc.interrogate) {
        add('NA_SUSPECTS_LINEUP', 'Lấy lời khai Tèo - Hùng - Dũng, đối chiếu áo rách và dấu bùn đỏ', { type: 'NGHEAN_ACTION', payload: { action: 'NA_QK_INTERROGATE' } }, 90, 'NPC');
      }
      if (quyKhuyenHoc.interrogate && !quyKhuyenHoc.solveCase) {
        add('NA_CULTURE_HOUSE', 'Đối chất khoa học buộc Dũng nhận tội, thu hồi 10 triệu Quỹ khuyến học', { type: 'NGHEAN_ACTION', payload: { action: 'NA_QK_SOLVE_CASE' } }, 95, 'NPC');
      }
    }
  }
}
