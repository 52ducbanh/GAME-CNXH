import type { GuideContext, MissionGuide } from '../../core/guide.js';

export function quangNinhGuide({ s, guide, to }: GuideContext): MissionGuide {
  if (!s.quangNinhState) return guide;
  const qn = s.quangNinhState;
  const { toRoi, congTruong, thanXuat } = qn;

  // Quest 1
  if (qn.currentQuest === 1 || toRoi.status === 'ACTIVE') {
    guide.title = 'DẸP TỜ RƠI ĐEN & TUYÊN TRUYỀN PHÁP LUẬT';
    guide.checks = [
      { text: 'Tiếp nhận phản ánh Bác Hoàng', done: toRoi.hoangMet },
      { text: 'Bóc gỡ & tiêu hủy tờ rơi tín dụng đen', done: toRoi.fliersPeeled },
      { text: 'Tuyên truyền pháp luật & dịch vụ số', done: toRoi.digitalGuided },
      { text: 'Công khai đường dây nóng tố giác tội phạm', done: toRoi.boardPublished },
    ];
    if (!toRoi.hoangMet) to('QN_CITIZEN_HOANG', 'Gặp Bác Hoàng tổ trưởng dân phố tiếp nhận thông tin phản ánh.');
    else if (!toRoi.fliersPeeled) to('QN_FLIER_WALL', 'Bóc gỡ, thu gom tờ rơi dán trộm tín dụng đen trên tường ngõ.');
    else if (!toRoi.digitalGuided) to('QN_ALLEY_POST', 'Tuyên truyền pháp luật, hướng dẫn người dân dịch vụ công số.');
    else if (!toRoi.boardPublished) to('QN_PUBLIC_BOARD', 'Đến bảng tin công khai đường dây nóng tiếp nhận tố giác.');
    return guide;
  }

  // Quest 2
  if (qn.currentQuest === 2 || congTruong.status === 'ACTIVE') {
    guide.title = 'QUẢN LÝ CÔNG TRƯỜNG & MÔI TRƯỜNG VỊNH';
    guide.checks = [
      { text: 'Kiểm tra hồ sơ môi trường công trường', done: congTruong.siteInspected },
      { text: 'Kiểm soát xe tải: che bạt & rửa lốp', done: congTruong.trucksChecked },
      { text: 'Đo đạc chỉ số môi trường nước bờ vịnh', done: congTruong.waterMonitored },
      { text: 'Ký cam kết bảo vệ môi trường vịnh Hạ Long', done: congTruong.commitmentSigned },
    ];
    if (!congTruong.siteInspected) to('QN_CONSTRUCTION_SITE', 'Đến công trường san lấp kiểm tra giấy phép và hồ sơ môi trường.');
    else if (!congTruong.trucksChecked) to('QN_TRUCK_CHECK', 'Kiểm tra đoàn xe tải: yêu cầu phủ bạt kín và rửa sạch lốp xe.');
    else if (!congTruong.waterMonitored) to('QN_ENVIRONMENT_OFFICE', 'Đo đạc độ đục và chỉ số nước ven vịnh bảo đảm an toàn.');
    else if (!congTruong.commitmentSigned) to('QN_WAREHOUSE_SITE', 'Làm việc với quản lý công trường ký cam kết môi trường.');
    return guide;
  }

  // Quest 3
  if (qn.currentQuest === 3 || thanXuat.status === 'ACTIVE') {
    guide.title = 'XỬ LÝ KHO KHOÁNG SẢN LẬU & BẢO VỆ CẦU';
    guide.checks = [
      { text: 'Tiếp cận bãi tập kết khoáng sản lậu', done: thanXuat.depotDiscovered },
      { text: 'Kiểm tra xà lan vận chuyển không rõ nguồn', done: thanXuat.bargeInspected },
      { text: 'Niêm phong tang vật & lập biên bản', done: thanXuat.violationSealed },
      { text: 'Chốt chặn bảo vệ an toàn 2 tuyến cầu', done: thanXuat.bridgeSecured },
    ];
    if (!thanXuat.depotDiscovered) to('QN_HIDDEN_DEPOT', 'Tiếp cận bãi than/khoáng sản tập kết trái phép ven nước.');
    else if (!thanXuat.bargeInspected) to('QN_BARGE_DOCK', 'Kiểm tra xà lan chở hàng không có hóa đơn chứng từ hợp pháp.');
    else if (!thanXuat.violationSealed) to('QN_SEAL_STATION', 'Dán tem niêm phong phương tiện, lập biên bản tịch thu than lậu.');
    else if (!thanXuat.bridgeSecured) to('QN_BRIDGE_CHECKPOINT', 'Triển khai lực lượng bảo vệ tuyệt đối an toàn 2 tuyến cầu vịnh.');
    return guide;
  }

  return guide;
}
