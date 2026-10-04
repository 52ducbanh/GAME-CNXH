import type { GameSnapshot } from '../../../types.js';
import type { MissionGuide } from '../../core/guide.js';
import type { ProvinceView } from '../../core/contracts.js';
import { publicServiceView } from '../../presets/public-service/view.js';
import { thanhHoa } from './definition.js';
import { selectThanhHoaScore } from './state.js';

export function thanhHoaView(s: GameSnapshot, guide: MissionGuide): ProvinceView {
  const view = publicServiceView(s, thanhHoa, guide);
  const th = s.thanhHoaState;
  if (!th) return view;

  const score = selectThanhHoaScore(th);
  view.totalScore = score.total;

  view.quests = [
    { ...thanhHoa.quests[0], score: score.nemChua, status: th.nemChua.status },
    { ...thanhHoa.quests[1], score: score.duongRay, status: th.duongRay.status },
    { ...thanhHoa.quests[2], score: score.valiMuoiToi, status: th.valiMuoiToi.status },
  ];
  view.activeQuestId = thanhHoa.quests[th.currentQuest - 1].id;
  view.activeQuestNumber = th.currentQuest;

  const marker = (pointId: string, color: string, size = 16) => view.markers.push({ pointId, done: color === '#22c55e', color, size });

  if (th.currentQuest === 1) {
    marker('TH_ARCH_GATE', th.nemChua.meetDispute ? '#22c55e' : '#f59e0b', 18);
    marker('TH_NEM_C_SHOP', th.nemChua.inspectShopC ? '#22c55e' : '#ef4444');
    marker('TH_SUPPLY_WAREHOUSE', th.nemChua.collectKit ? '#22c55e' : '#3b82f6');
    marker('TH_NEM_B_SHOP', th.nemChua.resolveDispute ? '#22c55e' : '#10b981');
  } else if (th.currentQuest === 2) {
    marker('TH_RAIL_CORRIDOR', th.duongRay.approachScene ? '#22c55e' : '#f59e0b', 18);
    marker('TH_RAIL_GUARD', th.duongRay.subdueGuard ? '#22c55e' : '#ef4444');
    marker('TH_BRIDGE_ESCAPE', th.duongRay.blockEscape ? '#22c55e' : '#3b82f6');
    marker('TH_SUPPLY_WAREHOUSE', th.duongRay.handoverEvidence ? '#22c55e' : '#10b981');
  } else if (th.currentQuest === 3) {
    marker('TH_OFFICE_LOBBY', th.valiMuoiToi.meetBribe ? '#22c55e' : '#f59e0b', 18);
    marker('TH_BRIEFCASE_TABLE', th.valiMuoiToi.recordEvidence ? '#22c55e' : '#ef4444');
    marker('TH_ALARM_BUTTON', th.valiMuoiToi.triggerAlarm ? '#22c55e' : '#10b981');
  }

  view.results.recap = [
    {
      mission: 'Nhiệm vụ 1',
      title: 'Ai là kẻ ăn cắp bí quyết Nem chua',
      narrative: 'Hòa giải tranh chấp thương hiệu gia truyền trước Cửa Vòm Thành Nhà Hồ, thu thập mẫu thử kiểm chứng đối chiếu nhãn mác OCOP khoa học.',
      theoryLesson: 'Bảo hộ quyền sở hữu trí tuệ và thương hiệu làng nghề truyền thống; giải quyết mâu thuẫn trong nhân dân trên cơ sở thượng tôn pháp luật và thấu tình đạt lý.'
    },
    {
      mission: 'Nhiệm vụ 2',
      title: 'Bắt kẻ cạy ốc đường ray ven kênh',
      narrative: 'Mật phục bắt giữ hai đối tượng trộm cắp thanh tà vẹt và bu-lông đường sắt chở hàng, thu hồi tang vật bảo đảm an toàn hạ tầng huyết mạch.',
      theoryLesson: 'Bảo vệ an ninh trật tự và tài sản công; an toàn kết cấu hạ tầng giao thông quốc gia là tính mạng và lợi ích của toàn xã hội.'
    },
    {
      mission: 'Nhiệm vụ 3',
      title: 'Vali mười tỏi dưới chân đồi',
      narrative: 'Bản lĩnh đấu trí nghiệp vụ kiên cường trước cám dỗ hối lộ 10 tỷ đồng của doanh nghiệp bất động sản, giăng bẫy bắt quả tang bảo vệ di tích Thành Nhà Hồ.',
      theoryLesson: 'Liêm chính, chí công vô tư của người cán bộ công quyền; kiên quyết bài trừ tham nhũng, giữ gìn di sản lịch sử văn hóa trước mọi sự xâm hại.'
    }
  ];

  return view;
}
