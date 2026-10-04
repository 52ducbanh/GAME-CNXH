import type { StartTaskType } from '../../core/commands.js';
import type { CatalogueContext } from '../../core/interactions.js';

export function appendHaiPhongActions(context: CatalogueContext) {
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
  const hp = s.haiPhongState;
  if (!hp) return;

  const { foodtour, cheLo, doSon } = hp;

  // Quest 1: Foodtour
  if (hp.currentQuest === 1 || foodtour.status === 'ACTIVE') {
    if (!foodtour.hoaMet) {
      add('HP_HOA_CRAB_NOODLE', 'Gặp Cô Hoa tiếp nhận tình hình Foodtour & bãi đỗ xe', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_FD_MEET_HOA' } }, 95, 'NPC');
    } else {
      if (!foodtour.sidewalkSetup) {
        add('HP_SIDEWALK_BARRIER', 'Kẻ vạch sơn & bố trí bàn ghế dành lối đi cho người đi bộ', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_FD_SETUP_SIDEWALK' } }, 90, 'OBJECTIVE');
      }
      if (!foodtour.parkingOrganized) {
        add('HP_PARKING_ZONE', 'Sắp xếp bãi đỗ xe trật tự cạnh Nhà hát, không lấn lòng đường', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_FD_ORGANIZE_PARKING' } }, 90, 'OBJECTIVE');
      }
      if (foodtour.sidewalkSetup && foodtour.parkingOrganized && !foodtour.pricesPosted) {
        add('HP_PRICE_LIST', 'Niêm yết giá công khai & cam kết an toàn vệ sinh thực phẩm', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_FD_POST_PRICES' } }, 95, 'DEVICE');
      }
    }
  }

  // Quest 2: Chè Lò
  if (hp.currentQuest === 2 || cheLo.status === 'ACTIVE') {
    if (!cheLo.furnaceInspected) {
      add('HP_CHE_LO_FURNACE', 'Kiểm tra quy trình vận hành lò đúc thủ công Chè Lò', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_CL_INSPECT_FURNACE' } }, 95, 'NPC');
    } else {
      if (!cheLo.sampleTaken) {
        add('HP_SAMPLE_POINT', 'Lấy mẫu nước & khí thải quan trắc trên bờ ven xưởng đúc', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_CL_TAKE_SAMPLE' } }, 90, 'OBJECTIVE');
      }
      if (!cheLo.filterChecked) {
        add('HP_FILTER_INSPECTION', 'Kiểm tra hệ thống hút bụi và màng lọc khói lò đúc', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_CL_CHECK_FILTER' } }, 90, 'DEVICE');
      }
      if (cheLo.sampleTaken && cheLo.filterChecked && !cheLo.dossierSigned) {
        add('HP_DOSSIER_STATION', 'Ký biên bản chuyển đổi công nghệ xanh & bảo vệ môi trường', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_CL_SIGN_DOSSIER' } }, 95, 'OBJECTIVE');
      }
    }
  }

  // Quest 3: Đồ Sơn
  if (hp.currentQuest === 3 || doSon.status === 'ACTIVE') {
    if (!doSon.residentsMet) {
      add('HP_DO_SON_RESIDENTS', 'Tổ chức đối thoại & lắng nghe ý kiến nhân dân Đồ Sơn', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_DS_MEET_RESIDENTS' } }, 95, 'NPC');
    } else {
      if (!doSon.planningPosted) {
        add('HP_PLANNING_BOARD', 'Công khai bản đồ quy hoạch mở đường & mốc giới giải tỏa', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_DS_POST_PLANNING' } }, 90, 'DEVICE');
      }
      if (!doSon.compensationResolved) {
        add('HP_COMPENSATION_DESK', 'Giải quyết thỏa đáng chính sách tái định cư & bồi thường', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_DS_RESOLVE_COMPENSATION' } }, 90, 'OBJECTIVE');
      }
      if (doSon.planningPosted && doSon.compensationResolved && !doSon.excavatorSecured) {
        add('HP_EXCAVATOR_SITE', 'Điều phối máy xúc thi công đúng phân đoạn bảo đảm an toàn', { type: 'HAIPHONG_ACTION', payload: { action: 'HP_DS_SECURE_EXCAVATOR' } }, 95, 'OBJECTIVE');
      }
    }
  }
}
