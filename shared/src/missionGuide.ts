import { GameSnapshot } from './types.js';
import { PointOfInterest } from './mapData.js';
import { getGameMap } from './worldMaps.js';

export interface MissionGuide { title: string; step: string; target: PointOfInterest | null; checks: { text: string; done: boolean }[] }
export function getMissionGuide(s: GameSnapshot, playerId: string): MissionGuide {
  const map=getGameMap(s.mapId),POINTS_OF_INTEREST=map.points;
  const carrying = !!s.players[playerId]?.carriedCrateId;
  const guide: MissionGuide = { title: 'CÙNG XÂY DỰNG THÀNH PHỐ', step: 'Chờ chủ phòng bắt đầu. Bạn có thể khám phá bản đồ.', target: null, checks: [] };
  const to=(id:string,step:string) => {guide.target=POINTS_OF_INTEREST[id];guide.step=step;};
  const deliver=(id:string,text:string) => to(carrying?id:'WAREHOUSE',carrying?text:'Đến kho lấy một kiện vật tư.');
  if(s.phase==='PRACTICE') {
    guide.title='TẬP DƯỢT VẬN CHUYỂN';
    if(!s.practiceCrateDelivered)deliver('PRACTICE_TARGET','Mang kiện mẫu đến điểm tập dượt.');
    else guide.step='Đã giao kiện mẫu. Hoàn thành thao tác thực hành tại điểm tập dượt.';
    guide.checks=[{text:'Giao kiện vật tư mẫu',done:s.practiceCrateDelivered}];
  } else if(s.phase==='BRIEFING') {guide.title=`CHÀO MỪNG ĐẾN ${map.name.toLocaleUpperCase('vi')}`;guide.step='Đọc phần dẫn nhập để bắt đầu nhiệm vụ cùng đồng đội.';}
  else if(s.phase==='RESULTS') {guide.title='THÀNH PHỐ CỦA CHÚNG TA';guide.step=`Đã phục vụ ${s.citizensServedCount}/${s.totalCitizensCount} người dân.`;}
  else if(s.phase==='RUNNING' && s.mapId==='ha-tinh' && s.hatinhState) {
    const ht=s.hatinhState, {va,dg,dl}=ht;
    if(ht.currentQuest===1 || va.status==='ACTIVE') {
      guide.title='LỬA ĐỎ TUYẾN VŨNG ÁNG';
      guide.checks=[
        {text:'Tiếp nhận phản ánh (Tuấn)',done:va.tuanReported},
        {text:'Dọn vật liệu & Triển khai camera',done:va.spillCleaned&&va.cameraDeployed},
        {text:'Phân luồng & Cân tải trọng xe',done:va.trafficDiverted&&va.weighed},
        {text:'Lập biên bản vi phạm & Doanh nghiệp',done:va.dossierPrepared&&va.negotiatedDoan},
        {text:'Mở lại tuyến đường an toàn',done:va.routeReopened}
      ];
      if(!va.tuanReported)to('WORKER_TUAN','Gặp công nhân Tuấn tiếp nhận phản ánh sự cố.');
      else if(!va.cameraDeployed)to('CAMERA','Triển khai camera giám sát luồng xe cảng.');
      else if(!va.spillCleaned)to('SPILL','Thu dọn vật liệu rơi vãi trên luồng xe chạy.');
      else if(!va.trafficDiverted)to('TRAFFIC_VA','Phân luồng xe quá tải tránh ùn tắc cảng.');
      else if(!va.weighed)to('WEIGH_STATION','Vận hành trạm cân kiểm tra tải trọng xe.');
      else if(!va.inspectedBang)to('INSPECTION_BANG','Phối hợp với đ/c Bàng kiểm tra xe vi phạm.');
      else if(!va.dossierPrepared)to('INSPECTION_BANG','Lập biên bản vi phạm tải trọng đường bộ.');
      else if(!va.negotiatedDoan)to('DOSSIER_DOAN','Làm việc với chủ hàng / doanh nghiệp Doãn.');
      else if(!va.routeReopened)to('TRAFFIC_VA','Mở lại tuyến đường an toàn cho xe lưu thông.');
      return guide;
    }
    if(ht.currentQuest===2 || dg.status==='ACTIVE' || dg.status==='GATHERING' || dg.status==='COUNTDOWN') {
      guide.title='MÂY TRẮNG ĐÈO NGANG';
      guide.checks=[
        {text:'Tập kết & Sẵn sàng ứng cứu',done:dg.status==='ACTIVE'||dg.status==='RESOLVED'},
        {text:'Chốt chặn giao thông (A & B)',done:dg.barrierA&&dg.barrierB},
        {text:'Đèn pha, Điểm neo & Dây cứu hộ',done:dg.roadLight&&dg.ravineLight&&dg.anchorReady&&dg.ropeReady&&dg.winchReady},
        {text:'Tiếp cận, Sơ cứu & Nẹp đùi Nam',done:dg.firstAidGiven&&dg.namSplinted&&dg.bikeHazardSecured},
        {text:'Kéo tời & Bàn giao y tế',done:dg.namLifted&&dg.medicalReceived}
      ];
      if(dg.status==='NOT_STARTED')to('DEO_GATHER','Tiếp cận Đèo Ngang kích hoạt cảnh báo cứu hộ.');
      else if(dg.status==='GATHERING')to('RESCUE_STAGING','Tập kết tại Staging và nhấn Sẵn sàng.');
      else if(dg.status==='COUNTDOWN')to('RESCUE_STAGING',`Đang đếm ngược vào chiến dịch cứu nạn (${Math.ceil(dg.countdownRemaining)}s)...`);
      else if(!dg.barrierA)to('RESCUE_TRAFFIC_A','Chốt chặn phía Bắc (Traffic A).');
      else if(!dg.barrierB)to('RESCUE_TRAFFIC_B','Chốt chặn phía Nam (Traffic B).');
      else if(!dg.roadLight)to('RESCUE_TECH','Bật đèn pha chiếu sáng mặt đường.');
      else if(!dg.ravineLight)to('RESCUE_TECH','Rọi đèn pha xuống lòng vực.');
      else if(!dg.anchorReady)to('RESCUE_TECH','Đóng điểm neo chịu lực (Anchor).');
      else if(!dg.ropeReady)to('RESCUE_TECH','Thả dây cứu hộ xuống vực (Rope).');
      else if(!dg.winchReady)to('RESCUE_WINCH','Kiểm tra và chuẩn bị tời cứu nạn (Winch).');
      else if(!dg.rescuerDown)to('RESCUE_WINCH','Cứu nạn viên đu dây tiếp cận nạn nhân dưới vực.');
      else if(!dg.namComforted)to('RESCUE_NAM','Trấn an tinh thần nạn nhân Nam.');
      else if(!dg.bikeHazardSecured)to('RESCUE_NAM','Ngắt điện và khóa van xăng xe máy.');
      else if(!dg.firstAidGiven)to('RESCUE_NAM','Băng bó sơ cứu vết thương cho Nam.');
      else if(!dg.namSplinted)to('RESCUE_NAM','Cố định nẹp đùi và mặc đai cứu hộ.');
      else if(!dg.readyToWinch)to('RESCUE_NAM','Phát tín hiệu sẵn sàng kéo tời.');
      else if(!dg.receptionReady)to('RESCUE_MEDICAL','Chuẩn bị cáng và điểm đón tiếp y tế.');
      else if(!dg.namLifted)to('RESCUE_WINCH',`Vận hành tời đưa Nam lên đỉnh đèo (${dg.winchProgress}%).`);
      else if(!dg.medicalReceived)to('RESCUE_MEDICAL','Bàn giao Nam cho đội ngũ y tế.');
      else if(!dg.rescuerSafe)to('RESCUE_WINCH','Kéo cứu nạn viên lên đỉnh đèo an toàn.');
      else if(!dg.bikeRecovered)to('RESCUE_WINCH','Trục vớt xe máy khỏi lòng vực.');
      return guide;
    }
    if(ht.currentQuest===3 || dl.status==='ACTIVE') {
      guide.title='NÉN HƯƠNG TRƯỚC CHUÔNG ĐỒNG';
      guide.checks=[
        {text:'Gặp Bác Tùng nhận nhiệm vụ',done:dl.tungBriefed},
        {text:'Xử lý ấn phẩm mê tín & đổi tiền lẻ',done:dl.sauVerified&&dl.teoVerified&&dl.dossierFiled},
        {text:'Phân luồng & Đón tiếp cựu chiến binh',done:dl.flowOrganized&&dl.haiAssisted},
        {text:'Phát hương hoa miễn phí',done:dl.incenseSupplied},
        {text:'Chấn chỉnh TikToker livestream',done:dl.tiktokerCorrected}
      ];
      if(!dl.tungBriefed)to('DONG_LOC_TUNG','Gặp Bác Tùng tiếp nhận nhiệm vụ quản lý di tích.');
      else if(!dl.sauVerified)to('DONG_LOC_SAU','Nhắc nhở Mụ Sáu và thu ấn phẩm mê tín dị đoan.');
      else if(!dl.teoVerified)to('DONG_LOC_TEO','Ngăn chặn Tèo đổi tiền lẻ 30% trái phép.');
      else if(!dl.dossierFiled)to('DONG_LOC_TUNG','Bàn giao tang vật và lập biên bản xử lý.');
      else if(!dl.flowOrganized)to('DONG_LOC_FLOW','Phân luồng dòng người dâng hương trật tự.');
      else if(!dl.haiAssisted)to('DONG_LOC_HAI','Hỗ trợ Bác Hải đón đoàn cựu chiến binh.');
      else if(!dl.incenseSupplied)to('DONG_LOC_ALTAR','Phát hương hoa miễn phí và hướng dẫn dâng hương.');
      else if(!dl.tiktokerCorrected)to('DONG_LOC_TIKTOKER','Chấn chỉnh TikToker livestream sai lệch lịch sử.');
      else to('DONG_LOC_TUNG','Báo cáo Bác Tùng hoàn thành xuất sắc nhiệm vụ.');
      return guide;
    }
  } else if(s.phase==='RUNNING' && s.m1.status==='ACTIVE') {
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
  } else if(s.phase==='RUNNING' && s.m2.status==='ACTIVE') {
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
  } else if(s.phase==='RUNNING' && s.m3.status==='ACTIVE') {
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
