import type { GameSnapshot } from '../../../types.js';
import type { MissionGuide } from '../../core/guide.js';
import type { ProvinceView } from '../../core/contracts.js';
import { publicServiceView } from '../../presets/public-service/view.js';
import { haiPhong } from './definition.js';
import { selectHaiPhongScore } from './state.js';

export function haiPhongView(s: GameSnapshot, guide: MissionGuide): ProvinceView {
  const view = publicServiceView(s, haiPhong, guide);
  const hp = s.haiPhongState;
  if (!hp) return view;

  const score = selectHaiPhongScore(hp);
  view.totalScore = score.total;

  view.quests = [
    { ...haiPhong.quests[0], score: score.foodtour, status: hp.foodtour.status },
    { ...haiPhong.quests[1], score: score.cheLo, status: hp.cheLo.status },
    { ...haiPhong.quests[2], score: score.doSon, status: hp.doSon.status },
  ];
  view.activeQuestId = haiPhong.quests[hp.currentQuest - 1].id;
  view.activeQuestNumber = hp.currentQuest;

  const marker = (pointId: string, color: string, size = 16) => view.markers.push({ pointId, done: color === '#22c55e', color, size });

  if (hp.currentQuest === 1) {
    marker('HP_HOA_CRAB_NOODLE', hp.foodtour.hoaMet ? '#22c55e' : '#f59e0b', 18);
    marker('HP_SIDEWALK_BARRIER', hp.foodtour.sidewalkSetup ? '#22c55e' : '#ef4444');
    marker('HP_PARKING_ZONE', hp.foodtour.parkingOrganized ? '#22c55e' : '#3b82f6');
    marker('HP_PRICE_LIST', hp.foodtour.pricesPosted ? '#22c55e' : '#10b981');
  } else if (hp.currentQuest === 2) {
    marker('HP_CHE_LO_FURNACE', hp.cheLo.furnaceInspected ? '#22c55e' : '#f59e0b', 18);
    marker('HP_SAMPLE_POINT', hp.cheLo.sampleTaken ? '#22c55e' : '#ef4444');
    marker('HP_FILTER_INSPECTION', hp.cheLo.filterChecked ? '#22c55e' : '#3b82f6');
    marker('HP_DOSSIER_STATION', hp.cheLo.dossierSigned ? '#22c55e' : '#10b981');
  } else if (hp.currentQuest === 3) {
    marker('HP_DO_SON_RESIDENTS', hp.doSon.residentsMet ? '#22c55e' : '#f59e0b', 18);
    marker('HP_PLANNING_BOARD', hp.doSon.planningPosted ? '#22c55e' : '#ef4444');
    marker('HP_COMPENSATION_DESK', hp.doSon.compensationResolved ? '#22c55e' : '#8b5cf6');
    marker('HP_EXCAVATOR_SITE', hp.doSon.excavatorSecured ? '#22c55e' : '#10b981');
  }

  view.results.recap = [
    {
      mission: 'Nhiệm vụ 1',
      title: 'Văn minh Foodtour & Trật tự đô thị',
      narrative: 'Sắp xếp trật tự các hàng quán ẩm thực Hải Phòng, chừa lối đi bộ cho người dân, kẻ vạch bãi giữ xe cạnh Nhà hát và niêm yết giá minh bạch.',
      theoryLesson: 'Quản lý đô thị văn minh hài hòa giữa phát triển kinh tế dịch vụ và giữ gìn trật tự an toàn, quyền tiếp cận không gian công cộng của nhân dân.'
    },
    {
      mission: 'Nhiệm vụ 2',
      title: 'Quản lý môi trường làng nghề lò đúc Chè Lò',
      narrative: 'Kiểm tra khí thải xưởng đúc kim loại, lấy mẫu quan trắc bảo vệ nguồn nước và ký lộ trình chuyển đổi công nghệ xanh cho làng nghề truyền thống.',
      theoryLesson: 'Gắn liền bảo tồn làng nghề truyền thống với tiêu chuẩn sinh thái hiện đại; không đánh đổi môi trường lấy tăng trưởng kinh tế đơn thuần.'
    },
    {
      mission: 'Nhiệm vụ 3',
      title: 'Dự án mở đường & Đồng thuận Đồ Sơn',
      narrative: 'Lắng nghe tâm tư nguyện vọng nhân dân Đồ Sơn, công khai minh bạch bản đồ quy hoạch và chi trả bồi thường thỏa đáng trước khi thi công cơ giới.',
      theoryLesson: 'Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng; sự đồng thuận của nhân dân là chìa khóa thành công của mọi công trình công cộng.'
    }
  ];

  return view;
}
