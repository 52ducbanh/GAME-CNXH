import type { GuideContext, MissionGuide } from '../../core/guide.js';

export function ninhBinhGuide({ s, guide, to }: GuideContext): MissionGuide {
  if (!s.ninhBinhState) return guide;
  const nb = s.ninhBinhState;
  const { baiDinh, cucPhuong, tamCoc } = nb;

  // Quest 1: Bái Đính
  if (nb.currentQuest === 1 || baiDinh.status === 'ACTIVE') {
    guide.title = 'BẢO VỆ TÍN NGƯỠNG BÁI ĐÍNH';
    guide.checks = [
      { text: 'Tiếp nhận phản ánh BQL Chùa Bái Đính', done: baiDinh.bqlMet },
      { text: 'Kiểm tra & niêm phong hòm công đức tự phát', done: baiDinh.boxInspected },
      { text: 'Chấn chỉnh nhóm livestream mê tín dị đoan', done: baiDinh.livestreamResolved },
      { text: 'Niêm yết nội quy văn minh tín ngưỡng', done: baiDinh.rulesPublished },
    ];
    if (!baiDinh.bqlMet) to('NB_BQL_CHU', 'Đến gặp Bác Chúc - Ban Quản lý Chùa Bái Đính tiếp nhận phản ánh.');
    else if (!baiDinh.boxInspected) to('NB_BAI_DINH_GATE', 'Đến cổng chùa kiểm tra và niêm phong hòm công đức tự phát.');
    else if (!baiDinh.livestreamResolved) to('NB_LIVESTREAM_GROUP', 'Nhắc nhở, chấn chỉnh nhóm livestream mê tín dị đoan.');
    else if (!baiDinh.rulesPublished) to('NB_RULE_BOARD', 'Đến bảng công khai niêm yết quy định văn minh tín ngưỡng.');
    return guide;
  }

  // Quest 2: Cúc Phương
  if (nb.currentQuest === 2 || cucPhuong.status === 'ACTIVE') {
    guide.title = 'TUẦN TRA ĐÊM RỪNG CÚC PHƯƠNG';
    guide.checks = [
      { text: 'Kích hoạt tuần tra đêm rừng Cúc Phương', done: cucPhuong.patrolStarted },
      { text: 'Dò tìm & tháo gỡ bẫy thú rừng', done: cucPhuong.trapDisarmed },
      { text: 'Sơ cứu & thả động vật về rừng', done: cucPhuong.animalRescued },
      { text: 'Thu giữ cưa gỗ & cắm biển bảo vệ rừng', done: cucPhuong.timberSecured },
    ];
    if (!cucPhuong.patrolStarted) to('NB_RANGERS_POST', 'Gặp Bác Hải - Kiểm lâm Cúc Phương kích hoạt tuần tra đêm.');
    else if (!cucPhuong.trapDisarmed) to('NB_ANIMAL_TRAP', 'Tuần tra sâu trong rừng, dò tìm và vô hiệu hóa bẫy thú.');
    else if (!cucPhuong.animalRescued) to('NB_WILDLIFE_RELEASE', 'Sơ cứu và thả động vật quý về tự nhiên an toàn.');
    else if (!cucPhuong.timberSecured) to('NB_TIMBER_ZONE', 'Kiểm tra hiện trường gỗ quý, thu tang vật và cắm biển bảo vệ.');
    return guide;
  }

  // Quest 3: Tam Cốc
  if (nb.currentQuest === 3 || tamCoc.status === 'ACTIVE') {
    guide.title = 'GIẢI TỎA ÁCH TẮC BẾN TAM CỐC';
    guide.checks = [
      { text: 'Lắng nghe phản ánh đại diện người chèo đò', done: tamCoc.boatmanMet },
      { text: 'Niêm yết bảng giá vé & số thứ tự xuất bến', done: tamCoc.pricesPosted },
      { text: 'Cấp phát áo phao an toàn cho du khách', done: tamCoc.lifejacketsEquipped },
      { text: 'Phân luồng thuyền xuất bến văn minh', done: tamCoc.boatsDispatched },
    ];
    if (!tamCoc.boatmanMet) to('NB_BOATMAN_REP', 'Gặp Cô Thắm - đại diện người chèo đò lắng nghe tâm tư nguyện vọng.');
    else if (!tamCoc.pricesPosted) to('NB_TICKET_BOARD', 'Niêm yết công khai bảng giá vé và số thứ tự xuất bến.');
    else if (!tamCoc.lifejacketsEquipped) to('NB_LIFEJACKET_STATION', 'Kiểm tra và cấp phát đủ áo phao cứu sinh đạt chuẩn.');
    else if (!tamCoc.boatsDispatched) to('NB_DISPATCH_POST', 'Điều phối phân luồng xuất bến, ký cam kết không vòi tiền tip.');
    return guide;
  }

  return guide;
}
