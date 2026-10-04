import { PLAN_COSTS } from '../../../constants.js';
import type { CatalogueContext, InteractionAction } from '../../core/interactions.js';
const PLAN_DESCRIPTIONS:Record<string,string>={
        FIXED: 'Phục vụ 22 dân (A12, B10, C0). Ít chuyến đi; Khu C chưa tiếp cận.',
        MOBILE: 'Phục vụ 24 dân (A10, B8, C6). Ngân sách thấp hơn, cần nhiều chuyến vận chuyển.',
        REPAIR: 'Khôi phục cầu và tuyến ngắn sang Khu B; vật tư gồm 2 kiện sửa và 2 kiện cứu trợ.',
        DETOUR: 'Tiết kiệm ngân sách; cầu vẫn hỏng, đi tuyến vòng dài hơn và giao 2 kiện cứu trợ.'
      };
export function describePublicServiceAction(intent:InteractionAction['intent']){return intent.type==='PROPOSE_PLAN'?PLAN_DESCRIPTIONS[intent.payload.plan]:undefined;}
export function appendPublicServiceActions({s,add,job,deliver}:CatalogueContext){
  const { m1, m2, m3 } = s;
  const propose = (missionId: 'M1' | 'M2', plans: [string, number, string][]) => {
    if (s.voting?.active) return;
    for (const [plan, cost, label] of plans) if (s.resources.currentBudget >= cost)
      add('HEADQUARTERS', label, { type: 'PROPOSE_PLAN', payload: { missionId, plan } }, 70);
  };
  if (m1.status === 'ACTIVE') {
    for (const z of ['A', 'B', 'C'] as const) if (!m1.surveys[z]) job(`ZONE_${z}`, 'SURVEY_ZONE', 'Khảo sát nhu cầu');
    if (m1.planCommitted === 'NONE' && m1.surveys.A && m1.surveys.B && m1.surveys.C)
      propose('M1', [['FIXED', PLAN_COSTS.M1_FIXED.budget, 'Đề xuất trạm cố định (40 ngân sách, 2 kiện)'], ['MOBILE', PLAN_COSTS.M1_MOBILE.budget, 'Đề xuất điểm lưu động (30 ngân sách, 4 kiện)']]);
    const clinics: [string, number, boolean, boolean, string][] = m1.planCommitted === 'FIXED'
      ? [['CLINIC_FIXED', m1.deliveredCratesFixed, m1.fixedDeployed, m1.verifiedA, 'DEPLOY_FIXED_CLINIC']]
      : m1.planCommitted === 'MOBILE' ? [['CLINIC_MOBILE_B', m1.deliveredCratesMobileB, m1.mobileBDeployed, m1.verifiedB, 'DEPLOY_MOBILE_CLINIC'], ['CLINIC_MOBILE_C', m1.deliveredCratesMobileC, m1.mobileCDeployed, m1.verifiedC, 'DEPLOY_MOBILE_CLINIC']] : [];
    for (const [id, count, deployed, verified, type] of clinics) {
      if (count < 2) deliver(id);
      else if (!deployed) job(id, type, 'Triển khai trạm y tế', true);
      else if (!verified) job(id, 'AUDIT_RESULT', 'Nghiệm thu kết quả');
    }
    const ready = m1.planCommitted === 'FIXED' ? m1.fixedDeployed && m1.verifiedA : m1.planCommitted === 'MOBILE' && m1.mobileBDeployed && m1.mobileCDeployed && m1.verifiedB && m1.verifiedC;
    if (ready && !m1.noticePublished) add('NOTICE_BOARD', 'Công khai kết quả', { type: 'PUBLISH_NOTICE', payload: { missionId: 'M1' } });
  }
  if (m2.status === 'ACTIVE') {
    if (!m2.surveyDone) job('BRIDGE', 'SURVEY_BRIDGE', 'Khảo sát sự cố cầu');
    if (m2.surveyDone && m2.planCommitted === 'NONE') propose('M2', [['REPAIR', PLAN_COSTS.M2_REPAIR.budget, 'Đề xuất sửa cầu (25 ngân sách, 4 kiện)'], ['DETOUR', PLAN_COSTS.M2_DETOUR.budget, 'Đề xuất tuyến vòng (10 ngân sách, 2 kiện)']]);
    if (m2.planCommitted === 'REPAIR') {
      if (m2.bridgeCratesDelivered < 2) deliver('BRIDGE');
      else {
        if (!m2.bridgeRepairTask1) job('BRIDGE_TASK_1', 'REPAIR_BRIDGE_1', 'Sửa mố cầu', true);
        if (!m2.bridgeRepairTask2) job('BRIDGE_TASK_2', 'REPAIR_BRIDGE_2', 'Gia cố dầm cầu', true);
      }
    }
    if (m2.reliefCratesDeliveredB < 2) deliver('ZONE_B');
    else if (!m2.verifiedB) job('ZONE_B', 'AUDIT_RESULT', 'Xác minh bàn giao');
    if (m2.reliefCratesDeliveredB >= 2 && m2.verifiedB && (m2.planCommitted !== 'REPAIR' || m2.bridgeRepaired) && !m2.noticePublished)
      add('NOTICE_BOARD', 'Công khai kết quả', { type: 'PUBLISH_NOTICE', payload: { missionId: 'M2' } });
  }
  if (m3.status === 'ACTIVE') {
    if (!m3.receivedFeedbackC) job('ZONE_C', 'RECEIVE_FEEDBACK_C', 'Tiếp nhận phản ánh');
    else if (!m3.crossCheckedList) job(m1.planCommitted === 'MOBILE' ? 'CLINIC_MOBILE_C' : 'CLINIC_FIXED', 'CROSS_CHECK_CLINIC', 'Đối chiếu danh sách');
    if (m3.receivedFeedbackC && m3.crossCheckedList && !m3.planConfirmed && s.resources.currentBudget >= PLAN_COSTS.M3_CONFIRM.budget)
      add('HEADQUARTERS', 'Xác nhận hỗ trợ (20 ngân sách)', { type: 'CONFIRM_M3_PLAN' });
    if (m3.planConfirmed) for (const [id, delivered, deployed] of [['CITIZEN_C1', m3.deliveredC1, m3.deployedC1], ['CITIZEN_C2', m3.deliveredC2, m3.deployedC2]] as const) {
      if (!delivered) deliver(id);
      else if (!deployed) job(id, 'SUPPORT_CITIZEN', 'Chăm sóc tại nhà', true);
    }
    if (!m3.lossAuditDone) job('WAREHOUSE', 'AUDIT_LEDGER', 'Đối chiếu sổ kho');
    if (m3.deployedC1 && m3.deployedC2 && m3.lossAuditDone && !m3.noticePublished)
      add('NOTICE_BOARD', 'Công khai kết quả', { type: 'PUBLISH_NOTICE', payload: { missionId: 'M3' } });
  }
}
