import type { StartTaskType } from '../../core/commands.js';
import type { CatalogueContext } from '../../core/interactions.js';

export function appendQuangNinhActions(context: CatalogueContext) {
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
  const qn = s.quangNinhState;
  if (!qn) return;

  const { toRoi, congTruong, thanXuat } = qn;

  // Quest 1: Tờ rơi
  if (qn.currentQuest === 1 || toRoi.status === 'ACTIVE') {
    if (!toRoi.hoangMet) {
      add('QN_CITIZEN_HOANG', 'Tiếp nhận phản ánh Bác Hoàng (Tổ dân phố)', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_TR_MEET_HOANG' } }, 95, 'NPC');
    } else {
      if (!toRoi.fliersPeeled) {
        add('QN_FLIER_WALL', 'Bóc gỡ & tiêu hủy tờ rơi tín dụng đen', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_TR_PEEL_FLIERS' } }, 90, 'OBJECTIVE');
      }
      if (!toRoi.digitalGuided) {
        add('QN_ALLEY_POST', 'Tuyên truyền pháp luật & hướng dẫn dịch vụ số', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_TR_DIGITAL_GUIDE' } }, 90, 'DEVICE');
      }
      if (toRoi.fliersPeeled && toRoi.digitalGuided && !toRoi.boardPublished) {
        add('QN_PUBLIC_BOARD', 'Công khai đường dây nóng & bảng Một Cửa', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_TR_PUBLISH_BOARD' } }, 95, 'DEVICE');
      }
    }
  }

  // Quest 2: Công trường
  if (qn.currentQuest === 2 || congTruong.status === 'ACTIVE') {
    if (!congTruong.siteInspected) {
      add('QN_CONSTRUCTION_SITE', 'Kiểm tra hồ sơ môi trường công trường', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_CT_INSPECT_SITE' } }, 95, 'OBJECTIVE');
    } else {
      if (!congTruong.trucksChecked) {
        add('QN_TRUCK_CHECK', 'Kiểm soát xe tải: che bạt & rửa lốp xe', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_CT_CHECK_TRUCKS' } }, 90, 'OBJECTIVE');
      }
      if (!congTruong.waterMonitored) {
        add('QN_ENVIRONMENT_OFFICE', 'Đo đạc chỉ số môi trường nước bờ vịnh', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_CT_MONITOR_WATER' } }, 90, 'DEVICE');
      }
      if (congTruong.trucksChecked && congTruong.waterMonitored && !congTruong.commitmentSigned) {
        add('QN_WAREHOUSE_SITE', 'Ký cam kết bảo vệ môi trường vịnh Hạ Long', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_CT_SIGN_COMMITMENT' } }, 95, 'NPC');
      }
    }
  }

  // Quest 3: Than xuất
  if (qn.currentQuest === 3 || thanXuat.status === 'ACTIVE') {
    if (!thanXuat.depotDiscovered) {
      add('QN_HIDDEN_DEPOT', 'Tiếp cận & kiểm tra bãi khoáng sản ven nước', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_TX_DISCOVER_DEPOT' } }, 95, 'OBJECTIVE');
    } else {
      if (!thanXuat.bargeInspected) {
        add('QN_BARGE_DOCK', 'Kiểm tra xà lan vận chuyển không rõ nguồn gốc', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_TX_INSPECT_BARGE' } }, 90, 'OBJECTIVE');
      }
      if (!thanXuat.violationSealed) {
        add('QN_SEAL_STATION', 'Niêm phong tang vật & lập biên bản tịch thu', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_TX_SEAL_VIOLATION' } }, 90, 'ITEM');
      }
      if (thanXuat.bargeInspected && thanXuat.violationSealed && !thanXuat.bridgeSecured) {
        add('QN_BRIDGE_CHECKPOINT', 'Chốt chặn bảo vệ an toàn 2 tuyến cầu vịnh', { type: 'QUANGNINH_ACTION', payload: { action: 'QN_TX_SECURE_BRIDGE' } }, 95, 'OBJECTIVE');
      }
    }
  }
}
