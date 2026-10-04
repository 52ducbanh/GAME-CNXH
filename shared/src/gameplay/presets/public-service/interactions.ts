import type { StartTaskType } from '../../core/commands.js';
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
  const { m1:medicalService, m2:bridgeResponse, m3:citizenRights } = s;
  const propose = (options:{missionId:'M1';plans:['FIXED'|'MOBILE',number,string][]}|{missionId:'M2';plans:['REPAIR'|'DETOUR',number,string][]}) => {
    if(s.voting?.active)return;
    if(options.missionId==='M1')for(const [plan,cost,label] of options.plans){
      if(s.resources.currentBudget>=cost)add('HEADQUARTERS',label,{type:'PROPOSE_PLAN',payload:{missionId:'M1',plan}},70);
    } else for(const [plan,cost,label] of options.plans){
      if(s.resources.currentBudget>=cost)add('HEADQUARTERS',label,{type:'PROPOSE_PLAN',payload:{missionId:'M2',plan}},70);
    }
  };
  if (medicalService.status === 'ACTIVE') {
    for (const z of ['A', 'B', 'C'] as const) if (!medicalService.surveys[z]) job(`ZONE_${z}`, 'SURVEY_ZONE', 'Khảo sát nhu cầu');
    if (medicalService.planCommitted === 'NONE' && medicalService.surveys.A && medicalService.surveys.B && medicalService.surveys.C)
      propose({missionId:'M1',plans:[['FIXED', PLAN_COSTS.M1_FIXED.budget, 'Đề xuất trạm cố định (40 ngân sách, 2 kiện)'], ['MOBILE', PLAN_COSTS.M1_MOBILE.budget, 'Đề xuất điểm lưu động (30 ngân sách, 4 kiện)']]});
    const clinics: [string, number, boolean, boolean, StartTaskType][] = medicalService.planCommitted === 'FIXED'
      ? [['CLINIC_FIXED', medicalService.deliveredCratesFixed, medicalService.fixedDeployed, medicalService.verifiedA, 'DEPLOY_FIXED_CLINIC']]
      : medicalService.planCommitted === 'MOBILE' ? [['CLINIC_MOBILE_B', medicalService.deliveredCratesMobileB, medicalService.mobileBDeployed, medicalService.verifiedB, 'DEPLOY_MOBILE_CLINIC'], ['CLINIC_MOBILE_C', medicalService.deliveredCratesMobileC, medicalService.mobileCDeployed, medicalService.verifiedC, 'DEPLOY_MOBILE_CLINIC']] : [];
    for (const [id, count, deployed, verified, type] of clinics) {
      if (count < 2) deliver(id);
      else if (!deployed) job(id, type, 'Triển khai trạm y tế', true);
      else if (!verified) job(id, 'AUDIT_RESULT', 'Nghiệm thu kết quả');
    }
    const ready = medicalService.planCommitted === 'FIXED' ? medicalService.fixedDeployed && medicalService.verifiedA : medicalService.planCommitted === 'MOBILE' && medicalService.mobileBDeployed && medicalService.mobileCDeployed && medicalService.verifiedB && medicalService.verifiedC;
    if (ready && !medicalService.noticePublished) add('NOTICE_BOARD', 'Công khai kết quả', { type: 'PUBLISH_NOTICE', payload: { missionId: 'M1' } });
  }
  if (bridgeResponse.status === 'ACTIVE') {
    if (!bridgeResponse.surveyDone) job('BRIDGE', 'SURVEY_BRIDGE', 'Khảo sát sự cố cầu');
    if (bridgeResponse.surveyDone && bridgeResponse.planCommitted === 'NONE') propose({missionId:'M2',plans:[['REPAIR', PLAN_COSTS.M2_REPAIR.budget, 'Đề xuất sửa cầu (25 ngân sách, 4 kiện)'], ['DETOUR', PLAN_COSTS.M2_DETOUR.budget, 'Đề xuất tuyến vòng (10 ngân sách, 2 kiện)']]});
    if (bridgeResponse.planCommitted === 'REPAIR') {
      if (bridgeResponse.bridgeCratesDelivered < 2) deliver('BRIDGE');
      else {
        if (!bridgeResponse.bridgeRepairTask1) job('BRIDGE_TASK_1', 'REPAIR_BRIDGE_1', 'Sửa mố cầu', true);
        if (!bridgeResponse.bridgeRepairTask2) job('BRIDGE_TASK_2', 'REPAIR_BRIDGE_2', 'Gia cố dầm cầu', true);
      }
    }
    if (bridgeResponse.reliefCratesDeliveredB < 2) deliver('ZONE_B');
    else if (!bridgeResponse.verifiedB) job('ZONE_B', 'AUDIT_RESULT', 'Xác minh bàn giao');
    if (bridgeResponse.reliefCratesDeliveredB >= 2 && bridgeResponse.verifiedB && (bridgeResponse.planCommitted !== 'REPAIR' || bridgeResponse.bridgeRepaired) && !bridgeResponse.noticePublished)
      add('NOTICE_BOARD', 'Công khai kết quả', { type: 'PUBLISH_NOTICE', payload: { missionId: 'M2' } });
  }
  if (citizenRights.status === 'ACTIVE') {
    if (!citizenRights.receivedFeedbackC) job('ZONE_C', 'RECEIVE_FEEDBACK_C', 'Tiếp nhận phản ánh');
    else if (!citizenRights.crossCheckedList) job(medicalService.planCommitted === 'MOBILE' ? 'CLINIC_MOBILE_C' : 'CLINIC_FIXED', 'CROSS_CHECK_CLINIC', 'Đối chiếu danh sách');
    if (citizenRights.receivedFeedbackC && citizenRights.crossCheckedList && !citizenRights.planConfirmed && s.resources.currentBudget >= PLAN_COSTS.M3_CONFIRM.budget)
      add('HEADQUARTERS', 'Xác nhận hỗ trợ (20 ngân sách)', { type: 'CONFIRM_M3_PLAN' });
    if (citizenRights.planConfirmed) for (const [id, delivered, deployed] of [['CITIZEN_C1', citizenRights.deliveredC1, citizenRights.deployedC1], ['CITIZEN_C2', citizenRights.deliveredC2, citizenRights.deployedC2]] as const) {
      if (!delivered) deliver(id);
      else if (!deployed) job(id, 'SUPPORT_CITIZEN', 'Chăm sóc tại nhà', true);
    }
    if (!citizenRights.lossAuditDone) job('WAREHOUSE', 'AUDIT_LEDGER', 'Đối chiếu sổ kho');
    if (citizenRights.deployedC1 && citizenRights.deployedC2 && citizenRights.lossAuditDone && !citizenRights.noticePublished)
      add('NOTICE_BOARD', 'Công khai kết quả', { type: 'PUBLISH_NOTICE', payload: { missionId: 'M3' } });
  }
}
