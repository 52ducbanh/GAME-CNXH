import type { GameSnapshot } from '../../../types.js';
import type { MissionGuide } from '../../core/guide.js';
import type { ProvinceView } from '../../core/contracts.js';
import { publicServiceView } from '../../presets/public-service/view.js';
import { quangNinh } from './definition.js';
import { selectQuangNinhScore } from './state.js';

export function quangNinhView(s: GameSnapshot, guide: MissionGuide): ProvinceView {
  const view = publicServiceView(s, quangNinh, guide);
  const qn = s.quangNinhState;
  if (!qn) return view;

  const score = selectQuangNinhScore(qn);
  view.totalScore = score.total;

  view.quests = [
    { ...quangNinh.quests[0], score: score.toRoi, status: qn.toRoi.status },
    { ...quangNinh.quests[1], score: score.congTruong, status: qn.congTruong.status },
    { ...quangNinh.quests[2], score: score.thanXuat, status: qn.thanXuat.status },
  ];
  view.activeQuestId = quangNinh.quests[qn.currentQuest - 1].id;
  view.activeQuestNumber = qn.currentQuest;

  const marker = (pointId: string, color: string, size = 16) => view.markers.push({ pointId, done: color === '#22c55e', color, size });

  if (qn.currentQuest === 1) {
    marker('QN_CITIZEN_HOANG', qn.toRoi.hoangMet ? '#22c55e' : '#f59e0b', 18);
    marker('QN_FLIER_WALL', qn.toRoi.fliersPeeled ? '#22c55e' : '#ef4444');
    marker('QN_ALLEY_POST', qn.toRoi.digitalGuided ? '#22c55e' : '#3b82f6');
    marker('QN_PUBLIC_BOARD', qn.toRoi.boardPublished ? '#22c55e' : '#10b981');
  } else if (qn.currentQuest === 2) {
    marker('QN_CONSTRUCTION_SITE', qn.congTruong.siteInspected ? '#22c55e' : '#f59e0b', 18);
    marker('QN_TRUCK_CHECK', qn.congTruong.trucksChecked ? '#22c55e' : '#ef4444');
    marker('QN_ENVIRONMENT_OFFICE', qn.congTruong.waterMonitored ? '#22c55e' : '#3b82f6');
    marker('QN_WAREHOUSE_SITE', qn.congTruong.commitmentSigned ? '#22c55e' : '#10b981');
  } else if (qn.currentQuest === 3) {
    marker('QN_HIDDEN_DEPOT', qn.thanXuat.depotDiscovered ? '#22c55e' : '#f59e0b', 18);
    marker('QN_BARGE_DOCK', qn.thanXuat.bargeInspected ? '#22c55e' : '#ef4444');
    marker('QN_SEAL_STATION', qn.thanXuat.violationSealed ? '#22c55e' : '#8b5cf6');
    marker('QN_BRIDGE_CHECKPOINT', qn.thanXuat.bridgeSecured ? '#22c55e' : '#10b981');
  }

  view.results.recap = [
    {
      mission: 'Nhiệm vụ 1',
      title: 'Dẹp tờ rơi đen & Tuyên truyền pháp luật',
      narrative: 'Bóc gỡ các biển quảng cáo tín dụng đen, lừa đảo ngõ phố; công khai đường dây nóng và số hóa thông tin dịch vụ công.',
      theoryLesson: 'Bảo vệ quyền lợi hợp pháp của người dân trước các bẫy tín dụng đen; phát huy vai trò chính quyền cơ sở phục vụ nhân dân minh bạch, kịp thời.'
    },
    {
      mission: 'Nhiệm vụ 2',
      title: 'Quản lý công trường san lấp & Bảo vệ môi trường Vịnh',
      narrative: 'Kiểm soát khắt khe bụi bặm, bắt buộc xe tải che bạt và rửa lốp, quan trắc chỉ số nước ven bờ Di sản Vịnh Hạ Long.',
      theoryLesson: 'Phát triển kinh tế phải đi đôi với bảo vệ môi trường sinh thái; Nhà nước quản lý bằng pháp luật để giữ gìn di sản cho muôn đời sau.'
    },
    {
      mission: 'Nhiệm vụ 3',
      title: 'Xử lý kho khoáng sản lậu & Bảo vệ cầu',
      narrative: 'Phát hiện bãi than trái phép ven nước, niêm phong xà lan vi phạm nguồn gốc và bảo vệ tuyệt đối an toàn các tuyến cầu huyết mạch.',
      theoryLesson: 'Tài nguyên khoáng sản là tài sản công thuộc sở hữu toàn dân; kiên quyết đấu tranh chống khai thác, vận chuyển khoáng sản lậu và bảo vệ hạ tầng quốc gia.'
    }
  ];

  return view;
}
