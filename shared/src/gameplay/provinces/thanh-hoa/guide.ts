import type { GuideContext, MissionGuide } from '../../core/guide.js';

export function thanhHoaGuide({ s, guide, to }: GuideContext): MissionGuide {
  if (!s.thanhHoaState) return guide;
  const th = s.thanhHoaState;
  const { nemChua, duongRay, valiMuoiToi } = th;

  // Quest 1
  if (th.currentQuest === 1 || nemChua.status === 'ACTIVE') {
    guide.title = 'TRANH CHẤP BÍ QUYẾT & THƯƠNG HIỆU NEM CHUA';
    guide.checks = [
      { text: 'Chia tách đám đông, lắng nghe tranh chấp', done: nemChua.meetDispute },
      { text: 'Thu giữ mẫu nem & hóa đơn nhãn mác Khu C', done: nemChua.inspectShopC },
      { text: 'Lấy bộ kit đối chiếu bảo hộ nhãn hiệu OCOP', done: nemChua.collectKit },
      { text: 'Đối chiếu bằng chứng & hòa giải hai bên', done: nemChua.resolveDispute },
    ];
    if (!nemChua.meetDispute) to('TH_ARCH_GATE', 'Đến trước Cửa Vòm Thành Nhà Hồ giải tán xô xát, nghe lời khai hai hộ.');
    else if (!nemChua.inspectShopC) to('TH_NEM_C_SHOP', 'Đến cơ sở nem Khu C thu giữ mẫu nem và hóa đơn in nhãn.');
    else if (!nemChua.collectKit) to('TH_SUPPLY_WAREHOUSE', 'Đến Kho vật tư lấy bộ kit đối chiếu chứng nhận OCOP.');
    else if (!nemChua.resolveDispute) to('TH_NEM_B_SHOP', 'Đến cơ sở nem Khu B tiến hành đối chứng khoa học và hòa giải.');
    return guide;
  }

  // Quest 2
  if (th.currentQuest === 2 || duongRay.status === 'ACTIVE') {
    guide.title = 'BẮT KẺ CẠY ỐC ĐƯỜNG RAY VEN KÊNH';
    guide.checks = [
      { text: 'Tiếp nhận báo án, tiếp cận tuyến ray', done: duongRay.approachScene },
      { text: 'Khống chế đối tượng gác, thu bu-lông', done: duongRay.subdueGuard },
      { text: 'Chốt chặn cầu, bắt đối tượng xà-beng', done: duongRay.blockEscape },
      { text: 'Bàn giao tang vật, bảo đảm an toàn tàu', done: duongRay.handoverEvidence },
    ];
    if (!duongRay.approachScene) to('TH_RAIL_CORRIDOR', 'Gặp Bác Tuần Đường, tiếp cận bí mật hành lang ray ven kênh.');
    else if (!duongRay.subdueGuard) to('TH_RAIL_GUARD', 'Áp sát khống chế tên canh gác thu giữ bao tải ốc vít tà vẹt.');
    else if (!duongRay.blockEscape) to('TH_BRIDGE_ESCAPE', 'Chạy đón đầu chặn cầu gỗ qua kênh khống chế tên còn lại.');
    else if (!duongRay.handoverEvidence) to('TH_SUPPLY_WAREHOUSE', 'Đem toàn bộ tang vật bu-lông bàn giao kiểm kê kỹ thuật.');
    return guide;
  }

  // Quest 3
  if (th.currentQuest === 3 || valiMuoiToi.status === 'ACTIVE') {
    guide.title = 'BẢN LĨNH LIÊM CHÍNH & VALI MƯỜI TỎI';
    guide.checks = [
      { text: 'Tiếp nhận đối tượng đưa vali 10 tỷ', done: valiMuoiToi.meetBribe },
      { text: 'Đấu trí nghiệp vụ: ghi âm bí mật', done: valiMuoiToi.recordEvidence },
      { text: 'Báo động lực lượng ập vào bắt quả tang', done: valiMuoiToi.triggerAlarm },
    ];
    if (!valiMuoiToi.meetBribe) to('TH_OFFICE_LOBBY', 'Đến phòng tiếp dân Trụ sở tiếp nhận đại diện doanh nghiệp Đơn vị V.');
    else if (!valiMuoiToi.recordEvidence) to('TH_BRIEFCASE_TABLE', 'Bình tĩnh nghiệp vụ, bật máy ghi âm dưới bàn thu bằng chứng đưa hối lộ.');
    else if (!valiMuoiToi.triggerAlarm) to('TH_ALARM_BUTTON', 'Bấm nút báo động ngầm phối hợp lực lượng bắt quả tang tại trận.');
    return guide;
  }

  return guide;
}
