import type { StartTaskType } from '../../core/commands.js';
import type { CatalogueContext } from '../../core/interactions.js';

export function appendThanhHoaActions(context: CatalogueContext) {
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
  const th = s.thanhHoaState;
  if (!th) return;

  const { nemChua, duongRay, valiMuoiToi } = th;

  // Quest 1: Nem chua
  if (th.currentQuest === 1 || nemChua.status === 'ACTIVE') {
    if (!nemChua.meetDispute) {
      add('TH_ARCH_GATE', 'Chia tách đám đông, lắng nghe Ông Bảy & Anh Tư tranh chấp', { type: 'THANHHOA_ACTION', payload: { action: 'TH_NM_MEET_DISPUTE' } }, 95, 'NPC');
    } else {
      if (!nemChua.inspectShopC) {
        add('TH_NEM_C_SHOP', 'Thu giữ mẫu nem và hóa đơn in nhãn mác tại cơ sở Khu C', { type: 'THANHHOA_ACTION', payload: { action: 'TH_NM_INSPECT_SHOP_C' } }, 90, 'OBJECTIVE');
      }
      if (!nemChua.collectKit) {
        add('TH_SUPPLY_WAREHOUSE', 'Lấy bộ kit đối chiếu đăng ký bảo hộ nhãn hiệu OCOP', { type: 'THANHHOA_ACTION', payload: { action: 'TH_NM_COLLECT_KIT' } }, 90, 'ITEM');
      }
      if (nemChua.inspectShopC && nemChua.collectKit && !nemChua.resolveDispute) {
        add('TH_NEM_B_SHOP', 'Đối chiếu bằng chứng, lập biên bản hòa giải & bảo vệ làng nghề', { type: 'THANHHOA_ACTION', payload: { action: 'TH_NM_RESOLVE_DISPUTE' } }, 95, 'NPC');
      }
    }
  }

  // Quest 2: Đường ray
  if (th.currentQuest === 2 || duongRay.status === 'ACTIVE') {
    if (!duongRay.approachScene) {
      add('TH_RAIL_CORRIDOR', 'Tiếp nhận báo án Bác Tuần Đường, mật phục tuyến ray ven kênh', { type: 'THANHHOA_ACTION', payload: { action: 'TH_DR_APPROACH_SCENE' } }, 95, 'NPC');
    } else {
      if (!duongRay.subdueGuard) {
        add('TH_RAIL_GUARD', 'Áp sát khống chế đối tượng canh gác, thu bao bu-lông đường sắt', { type: 'THANHHOA_ACTION', payload: { action: 'TH_DR_SUBDUE_GUARD' } }, 90, 'OBJECTIVE');
      }
      if (!duongRay.blockEscape) {
        add('TH_BRIDGE_ESCAPE', 'Chốt chặn cầu qua kênh, vây bắt đối tượng xà-beng bỏ chạy', { type: 'THANHHOA_ACTION', payload: { action: 'TH_DR_BLOCK_ESCAPE' } }, 90, 'OBJECTIVE');
      }
      if (duongRay.subdueGuard && duongRay.blockEscape && !duongRay.handoverEvidence) {
        add('TH_SUPPLY_WAREHOUSE', 'Bàn giao tang vật bu-lông, bảo đảm tuyệt đối an toàn chạy tàu', { type: 'THANHHOA_ACTION', payload: { action: 'TH_DR_HANDOVER_EVIDENCE' } }, 95, 'ITEM');
      }
    }
  }

  // Quest 3: Vali mười tỏi
  if (th.currentQuest === 3 || valiMuoiToi.status === 'ACTIVE') {
    if (!valiMuoiToi.meetBribe) {
      add('TH_OFFICE_LOBBY', 'Tiếp đại diện Đơn vị V tại phòng tiếp dân, ghi nhận tình huống', { type: 'THANHHOA_ACTION', payload: { action: 'TH_VT_MEET_BRIBE' } }, 95, 'NPC');
    } else {
      if (!valiMuoiToi.recordEvidence) {
        add('TH_BRIEFCASE_TABLE', 'Đấu trí nghiệp vụ: Bật ghi âm bí mật & yêu cầu ký cam kết', { type: 'THANHHOA_ACTION', payload: { action: 'TH_VT_RECORD_EVIDENCE' } }, 90, 'DEVICE');
        add('TH_OFFICE_LOBBY', 'Từ chối thô bạo (đối tượng ôm tiền bỏ chạy, thiếu chứng cứ)', { type: 'THANHHOA_ACTION', payload: { action: 'TH_VT_REJECT_ROUGH' } }, 80, 'NPC');
        add('TH_OFFICE_LOBBY', 'Nhận vali tiền & ký bừa (vi phạm liêm chính công vụ)', { type: 'THANHHOA_ACTION', payload: { action: 'TH_VT_ACCEPT_BRIBE' } }, 70, 'NPC');
      } else if (!valiMuoiToi.triggerAlarm) {
        add('TH_ALARM_BUTTON', 'Bấm nút báo động ngầm: Lực lượng ập vào bắt quả tang đưa hối lộ', { type: 'THANHHOA_ACTION', payload: { action: 'TH_VT_TRIGGER_ALARM' } }, 95, 'DEVICE');
      }
    }
  }
}
