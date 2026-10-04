import type { StartTaskType } from '../../core/commands.js';
import type { CatalogueContext } from '../../core/interactions.js';
import { NINH_BINH_POIS } from './state.js';

export function appendNinhBinhActions(context: CatalogueContext) {
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
  const nb = s.ninhBinhState;
  if (!nb) return;

  const { baiDinh, cucPhuong, tamCoc } = nb;

  // Quest 1: Bái Đính
  if (nb.currentQuest === 1 || baiDinh.status === 'ACTIVE') {
    if (!baiDinh.bqlMet) {
      add('NB_BQL_CHU', 'Tiếp nhận phản ánh BQL Chùa Bái Đính', { type: 'NINHBINH_ACTION', payload: { action: 'NB_BD_MEET_BQL' } }, 95, 'NPC');
    } else {
      if (!baiDinh.boxInspected) {
        add('NB_BAI_DINH_GATE', 'Kiểm tra & niêm phong hòm công đức tự phát', { type: 'NINHBINH_ACTION', payload: { action: 'NB_BD_INSPECT_BOX' } }, 90, 'OBJECTIVE');
      }
      if (!baiDinh.livestreamResolved) {
        add('NB_LIVESTREAM_GROUP', 'Chấn chỉnh nhóm livestream mê tín dị đoan', { type: 'NINHBINH_ACTION', payload: { action: 'NB_BD_RESOLVE_LIVESTREAM' } }, 90, 'NPC');
      }
      if (baiDinh.boxInspected && baiDinh.livestreamResolved && !baiDinh.rulesPublished) {
        add('NB_RULE_BOARD', 'Niêm yết nội quy văn minh tín ngưỡng', { type: 'NINHBINH_ACTION', payload: { action: 'NB_BD_PUBLISH_RULES' } }, 95, 'DEVICE');
      }
    }
  }

  // Quest 2: Cúc Phương (Tuần tra đêm)
  if (nb.currentQuest === 2 || cucPhuong.status === 'ACTIVE') {
    if (!cucPhuong.patrolStarted) {
      add('NB_RANGERS_POST', 'Kích hoạt tuần tra đêm rừng Cúc Phương', { type: 'NINHBINH_ACTION', payload: { action: 'NB_CP_START_PATROL' } }, 95, 'NPC');
    } else {
      if (!cucPhuong.trapDisarmed) {
        add('NB_ANIMAL_TRAP', 'Dò tìm & tháo gỡ bẫy thú rừng', { type: 'NINHBINH_ACTION', payload: { action: 'NB_CP_DISARM_TRAP' } }, 90, 'OBJECTIVE');
      }
      if (!cucPhuong.animalRescued) {
        add('NB_WILDLIFE_RELEASE', 'Sơ cứu & thả động vật về rừng', { type: 'NINHBINH_ACTION', payload: { action: 'NB_CP_RESCUE_ANIMAL' } }, 90, 'ITEM');
      }
      if (cucPhuong.trapDisarmed && cucPhuong.animalRescued && !cucPhuong.timberSecured) {
        add('NB_TIMBER_ZONE', 'Thu giữ tang vật cưa gỗ & cắm biển bảo vệ', { type: 'NINHBINH_ACTION', payload: { action: 'NB_CP_SECURE_TIMBER' } }, 95, 'OBJECTIVE');
      }
    }
  }

  // Quest 3: Tam Cốc (Giải tỏa ách tắc bến đò)
  if (nb.currentQuest === 3 || tamCoc.status === 'ACTIVE') {
    if (!tamCoc.boatmanMet) {
      add('NB_BOATMAN_REP', 'Lắng nghe phản ánh người chèo đò Tam Cốc', { type: 'NINHBINH_ACTION', payload: { action: 'NB_TC_MEET_BOATMAN' } }, 95, 'NPC');
    } else {
      if (!tamCoc.pricesPosted) {
        add('NB_TICKET_BOARD', 'Niêm yết bảng giá vé & số thứ tự xuất bến', { type: 'NINHBINH_ACTION', payload: { action: 'NB_TC_POST_PRICES' } }, 90, 'DEVICE');
      }
      if (!tamCoc.lifejacketsEquipped) {
        add('NB_LIFEJACKET_STATION', 'Cấp phát áo phao an toàn cho du khách', { type: 'NINHBINH_ACTION', payload: { action: 'NB_TC_EQUIP_LIFEJACKETS' } }, 90, 'ITEM');
      }
      if (tamCoc.pricesPosted && tamCoc.lifejacketsEquipped && !tamCoc.boatsDispatched) {
        add('NB_DISPATCH_POST', 'Phân luồng thuyền xuất bến văn minh', { type: 'NINHBINH_ACTION', payload: { action: 'NB_TC_DISPATCH_BOATS' } }, 95, 'OBJECTIVE');
      }
    }
  }
}
