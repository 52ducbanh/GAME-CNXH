import type { GuideContext, MissionGuide } from '../../core/guide.js';

export function haiPhongGuide({ s, guide, to }: GuideContext): MissionGuide {
  if (!s.haiPhongState) return guide;
  const hp = s.haiPhongState;
  const { foodtour, cheLo, doSon } = hp;

  // Quest 1
  if (hp.currentQuest === 1 || foodtour.status === 'ACTIVE') {
    guide.title = 'VĂN MINH FOODTOUR & TRẬT TỰ ĐÔ THỊ';
    guide.checks = [
      { text: 'Gặp Cô Hoa tiếp nhận tình hình Foodtour', done: foodtour.hoaMet },
      { text: 'Sắp xếp bàn ghế dành vỉa hè cho người đi bộ', done: foodtour.sidewalkSetup },
      { text: 'Tổ chức bãi đỗ xe văn minh cạnh Nhà hát', done: foodtour.parkingOrganized },
      { text: 'Niêm yết giá & cam kết an toàn thực phẩm', done: foodtour.pricesPosted },
    ];
    if (!foodtour.hoaMet) to('HP_HOA_CRAB_NOODLE', 'Đến gặp Cô Hoa quán bánh đa cua tiếp nhận phản ánh về trật tự Foodtour.');
    else if (!foodtour.sidewalkSetup) to('HP_SIDEWALK_BARRIER', 'Kẻ vạch và sắp xếp lại bàn ghế, giữ thông thoáng vỉa hè.');
    else if (!foodtour.parkingOrganized) to('HP_PARKING_ZONE', 'Hướng dẫn phương tiện đỗ đúng bãi quy định cạnh Nhà hát.');
    else if (!foodtour.pricesPosted) to('HP_PRICE_LIST', 'Lắp đặt bảng niêm yết giá công khai, ngăn chặn chèo kéo ép giá.');
    return guide;
  }

  // Quest 2
  if (hp.currentQuest === 2 || cheLo.status === 'ACTIVE') {
    guide.title = 'QUẢN LÝ MÔI TRƯỜNG LÒ ĐÚC CHÈ LÒ';
    guide.checks = [
      { text: 'Kiểm tra quy trình vận hành lò đúc', done: cheLo.furnaceInspected },
      { text: 'Lấy mẫu nước & khí thải quan trắc trên bờ', done: cheLo.sampleTaken },
      { text: 'Kiểm tra hệ thống hút bụi và màng lọc khói', done: cheLo.filterChecked },
      { text: 'Ký biên bản chuyển đổi công nghệ xanh', done: cheLo.dossierSigned },
    ];
    if (!cheLo.furnaceInspected) to('HP_CHE_LO_FURNACE', 'Đến khu lò đúc Chè Lò kiểm tra quy trình công nghệ và khí thải.');
    else if (!cheLo.sampleTaken) to('HP_SAMPLE_POINT', 'Lấy mẫu quan trắc môi trường trên bờ ven xưởng đúc kim loại.');
    else if (!cheLo.filterChecked) to('HP_FILTER_INSPECTION', 'Kiểm tra hệ thống lọc bụi tĩnh điện và ống xả khói xưởng đúc.');
    else if (!cheLo.dossierSigned) to('HP_DOSSIER_STATION', 'Ký biên bản cam kết lộ trình hiện đại hóa công nghệ giảm thiểu ô nhiễm.');
    return guide;
  }

  // Quest 3
  if (hp.currentQuest === 3 || doSon.status === 'ACTIVE') {
    guide.title = 'DỰ ÁN MỞ ĐƯỜNG & ĐỒNG THUẬN ĐỒ SƠN';
    guide.checks = [
      { text: 'Đối thoại & lắng nghe ý kiến nhân dân', done: doSon.residentsMet },
      { text: 'Công khai bản đồ quy hoạch mở đường', done: doSon.planningPosted },
      { text: 'Giải quyết chính sách bồi thường thỏa đáng', done: doSon.compensationResolved },
      { text: 'Điều phối máy xúc thi công đúng phân đoạn', done: doSon.excavatorSecured },
    ];
    if (!doSon.residentsMet) to('HP_DO_SON_RESIDENTS', 'Gặp gỡ nhân dân khu vực Đồ Sơn đối thoại về phương án mở đường.');
    else if (!doSon.planningPosted) to('HP_PLANNING_BOARD', 'Niêm yết công khai bản đồ quy hoạch dự án và mốc giới chỉ giới đường đỏ.');
    else if (!doSon.compensationResolved) to('HP_COMPENSATION_DESK', 'Hoàn thiện hồ sơ chi trả bồi thường và bố trí tái định cư công bằng.');
    else if (!doSon.excavatorSecured) to('HP_EXCAVATOR_SITE', 'Điều phối máy xúc dừng chờ và thi công an toàn theo phân kỳ được duyệt.');
    return guide;
  }

  return guide;
}
