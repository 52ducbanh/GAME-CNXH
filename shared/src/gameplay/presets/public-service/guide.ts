import type { GameSnapshot } from '../../../types.js';
import type { GuideContext, MissionGuide } from '../../core/guide.js';
export function publicServiceGuide({s,guide,to,deliver}:GuideContext):MissionGuide {
  if(s.m1.status==='ACTIVE') {
    const m=s.m1, mobile=m.planCommitted==='MOBILE';
    guide.title='MỞ TRẠM Y TẾ';
    const n=Object.values(m.surveys).filter(Boolean).length;
    const delivered=mobile?m.deliveredCratesMobileB+m.deliveredCratesMobileC:m.deliveredCratesFixed;
    guide.checks=[{text:`Khảo sát: ${n}/3`,done:n===3},{text:'Thông qua phương án',done:m.planCommitted!=='NONE'},{text:`Vật tư tại trạm: ${delivered}/${mobile?4:2}`,done:delivered>=(mobile?4:2)},{text:'Triển khai & nghiệm thu',done:mobile?m.verifiedB&&m.verifiedC:m.verifiedA},{text:'Công khai kết quả',done:m.noticePublished}];
    const zone=['A','B','C'].find(z=>!m.surveys[z as 'A'|'B'|'C']);
    if(zone)to(`ZONE_${zone}`,`Gặp đại diện Khu ${zone} để khảo sát nhu cầu y tế.`);
    else if(m.planCommitted==='NONE')to('HEADQUARTERS','Về trụ sở đề xuất và biểu quyết phương án.');
    else if(!mobile) {
      if(m.deliveredCratesFixed<2)deliver('CLINIC_FIXED','Mang kiện vật tư đến trạm y tế.');
      else if(!m.fixedDeployed)to('CLINIC_FIXED','Triển khai trạm y tế (8 giây).');
      else if(!m.verifiedA)to('CLINIC_FIXED','Nghiệm thu kết quả phục vụ người dân.');
      else to('NOTICE_BOARD','Niêm yết kết quả tại bảng công khai.');
    } else {
      if(m.deliveredCratesMobileB<2)deliver('CLINIC_MOBILE_B','Giao vật tư đến điểm y tế B.');
      else if(m.deliveredCratesMobileC<2)deliver('CLINIC_MOBILE_C','Giao vật tư đến điểm y tế C.');
      else if(!m.mobileBDeployed)to('CLINIC_MOBILE_B','Triển khai tổ y tế tại B.');
      else if(!m.mobileCDeployed)to('CLINIC_MOBILE_C','Triển khai tổ y tế tại C.');
      else if(!m.verifiedB)to('CLINIC_MOBILE_B','Nghiệm thu dịch vụ tại B.');
      else if(!m.verifiedC)to('CLINIC_MOBILE_C','Nghiệm thu dịch vụ tại C.');
      else to('NOTICE_BOARD','Niêm yết kết quả tại bảng công khai.');
    }
  } else if(s.m2.status==='ACTIVE') {
    const m=s.m2;guide.title='KHÔI PHỤC KẾT NỐI';
    guide.checks=[{text:'Khảo sát sự cố cầu',done:m.surveyDone},{text:'Thông qua phương án',done:m.planCommitted!=='NONE'},{text:`Cứu trợ Khu B: ${m.reliefCratesDeliveredB}/2`,done:m.reliefCratesDeliveredB>=2},{text:'Nghiệm thu & công khai',done:m.noticePublished}];
    if(!m.surveyDone)to('BRIDGE_TASK_1','Khảo sát cầu từ bờ phía Tây.');
    else if(m.planCommitted==='NONE')to('HEADQUARTERS','Biểu quyết sửa cầu hoặc đi tuyến vòng.');
    else if(m.planCommitted==='REPAIR'&&!m.bridgeRepaired) {
      if(m.bridgeCratesDelivered<2)deliver('BRIDGE_TASK_1','Giao vật tư sửa cầu tại bờ Tây.');
      else to(!m.bridgeRepairTask1?'BRIDGE_TASK_1':'BRIDGE_TASK_2','Sửa mố cầu và gia cố dầm cầu.');
    } else if(m.reliefCratesDeliveredB<2)deliver('ZONE_B','Mang vật tư cứu trợ đến Khu B.');
    else if(!m.verifiedB)to('ZONE_B','Xác minh bàn giao cứu trợ.');
    else to('NOTICE_BOARD','Công khai kết quả xử lý sự cố.');
  } else if(s.m3.status==='ACTIVE') {
    const m=s.m3;guide.title='KHÔNG AI BỊ BỎ LẠI';
    guide.checks=[{text:'Tiếp nhận & đối chiếu',done:m.crossCheckedList},{text:'Xác nhận kế hoạch',done:m.planConfirmed},{text:'Chăm sóc Cụ C1, C2',done:m.deployedC1&&m.deployedC2},{text:'Đối chiếu sổ kho',done:m.lossAuditDone},{text:'Công khai kết quả',done:m.noticePublished}];
    if(!m.receivedFeedbackC)to('ZONE_C','Gặp đại diện Khu C để nhận phản ánh.');
    else if(!m.crossCheckedList)to(s.m1.planCommitted==='MOBILE'?'CLINIC_MOBILE_C':'CLINIC_FIXED','Đối chiếu danh sách tại điểm y tế.');
    else if(!m.planConfirmed)to('HEADQUARTERS','Xác nhận kế hoạch chăm sóc tận nhà.');
    else if(!m.deployedC1) {if(!m.deliveredC1)deliver('CITIZEN_C1','Giao vật tư cho Cụ C1.');else to('CITIZEN_C1','Chăm sóc Cụ C1 tại nhà.');}
    else if(!m.deployedC2) {if(!m.deliveredC2)deliver('CITIZEN_C2','Giao vật tư cho Cụ C2.');else to('CITIZEN_C2','Chăm sóc Cụ C2 tại nhà.');}
    else if(!m.lossAuditDone)to('WAREHOUSE','Đối chiếu sổ sách tại kho vật tư.');
    else to('NOTICE_BOARD','Công khai bản tổng hợp cuối cùng.');
  }
  return guide;
}
