import type { GuideContext, MissionGuide } from '../../core/guide.js';

export function ngheAnGuide({ s, guide, to }: GuideContext): MissionGuide {
  if (!s.ngheAnState) return guide;
  const na = s.ngheAnState;
  const { chaoLuon, luaDaoDat, quyKhuyenHoc } = na;

  // Quest 1
  if (na.currentQuest === 1 || chaoLuon.status === 'ACTIVE') {
    guide.title = 'LẬP LẠI TRẬT TỰ KHU PHỐ CHÁO LƯƠN';
    guide.checks = [
      { text: 'Lắng nghe phản ánh Dì Hoa', done: chaoLuon.meetHoa },
      { text: 'Lắng nghe Chú Tuấn & người đi bộ', done: chaoLuon.meetTuan },
      { text: 'Kẻ vạch sơn 1.5m dành lối vỉa hè', done: chaoLuon.measureBoundary },
      { text: 'Ký cam kết văn minh kinh doanh', done: chaoLuon.signCommitment },
    ];
    if (!chaoLuon.meetHoa) to('NA_CH_HOA_SHOP', 'Đến gặp Dì Hoa quán cháo lươn tiếp nhận thông tin.');
    else if (!chaoLuon.meetTuan) to('NA_CH_TUAN_SHOP', 'Đến quán Chú Tuấn lắng nghe nguyện vọng và phản ánh lối đi bộ.');
    else if (!chaoLuon.measureBoundary) to('NA_CH_SIDEWALK', 'Kẻ vạch sơn 1.5m trên vỉa hè phân định ranh giới kinh doanh rõ ràng.');
    else if (!chaoLuon.signCommitment) to('NA_CH_HOA_SHOP', 'Ký cam kết chấp hành quy định trật tự đô thị và an toàn thực phẩm.');
    return guide;
  }

  // Quest 2
  if (na.currentQuest === 2 || luaDaoDat.status === 'ACTIVE') {
    guide.title = 'VÂY BẮT ĐỐI TƯỢNG LỪA ĐẢO HỒ SƠ ĐẤT ĐAI';
    guide.checks = [
      { text: 'Tiếp nhận Mệ Bảy tại Nhà văn hóa', done: luaDaoDat.interviewVictim },
      { text: 'Hỏi chị bán nhút & bác xích lô', done: luaDaoDat.askMarket },
      { text: 'Chốt chặn lối tắt quán chè', done: luaDaoDat.blockShortcut },
      { text: 'Bắt giữ đối tượng tại ngách cụt', done: luaDaoDat.captureSuspect },
    ];
    if (!luaDaoDat.interviewVictim) to('NA_CULTURE_HOUSE', 'Đến Nhà văn hóa tiếp nhận lời trình báo của Mệ Bảy.');
    else if (!luaDaoDat.askMarket) to('NA_MARKET_ALLEY', 'Vào ngõ chợ hỏi thăm bà con tìm hướng tẩu thoát của nghi phạm.');
    else if (!luaDaoDat.blockShortcut) to('NA_SHORTCUT_BLOCK', 'Chạy đón đầu chốt chặn lối tắt quán chè khóa đường rút lui.');
    else if (!luaDaoDat.captureSuspect) to('NA_DEAD_END', 'Áp sát ngách cụt khống chế đối tượng, thu hồi giấy tờ và tiền.');
    return guide;
  }

  // Quest 3
  if (na.currentQuest === 3 || quyKhuyenHoc.status === 'ACTIVE') {
    guide.title = 'PHÁ ÁN MẤT TRỘM QUỸ KHUYẾN HỌC KHỐI PHỐ';
    guide.checks = [
      { text: 'Ổn định đám đông, ngăn chặn định kiến', done: quyKhuyenHoc.calmCrowd },
      { text: 'Khám nghiệm hộc tủ: thu vải vàng', done: quyKhuyenHoc.inspectCabinet },
      { text: 'Khám nghiệm cửa sổ: dấu bùn đất đỏ', done: quyKhuyenHoc.inspectWindow },
      { text: 'Lấy lời khai Tèo - Hùng - Dũng', done: quyKhuyenHoc.interrogate },
      { text: 'Đối chất khoa học, thu hồi 10 triệu quỹ', done: quyKhuyenHoc.solveCase },
    ];
    if (!quyKhuyenHoc.calmCrowd) to('NA_CULTURE_HOUSE', 'Đến sảnh Nhà văn hóa giải thích pháp luật, ổn định đám đông bức xúc.');
    else if (!quyKhuyenHoc.inspectCabinet) to('NA_CABINET_EVIDENCE', 'Khám nghiệm hiện trường hộc tủ bị cạy lấy mẫu vải vàng tang vật.');
    else if (!quyKhuyenHoc.inspectWindow) to('NA_WINDOW_EVIDENCE', 'Khám nghiệm bậu cửa sổ thu thập dấu vết bùn đất đỏ.');
    else if (!quyKhuyenHoc.interrogate) to('NA_SUSPECTS_LINEUP', 'Lấy lời khai đối chiếu chứng cứ với ba người Tèo, Hùng, Dũng.');
    else if (!quyKhuyenHoc.solveCase) to('NA_CULTURE_HOUSE', 'Đưa chứng cứ buộc Dũng nhận tội, thu hồi phong bì 10 triệu tại bụi chuối.');
    return guide;
  }

  return guide;
}
