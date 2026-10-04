import type { GameSnapshot } from '../../../types.js';
import type { GuideContext, MissionGuide } from '../../core/guide.js';
export function hatinhGuide({s,guide,to}:GuideContext):MissionGuide {
    if(!s.hatinhState)return guide;
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
  return guide;
}
