import type { GameSnapshot } from '../../../types.js';
import type { MissionGuide } from '../../core/guide.js';
import type { ProvinceView } from '../../core/contracts.js';
import { publicServiceView } from '../../presets/public-service/view.js';
import { ninhBinh } from './definition.js';
import { selectNinhBinhScore } from './state.js';

export function ninhBinhView(s: GameSnapshot, guide: MissionGuide): ProvinceView {
  const view = publicServiceView(s, ninhBinh, guide);
  const nb = s.ninhBinhState;
  if (!nb) return view;

  const score = selectNinhBinhScore(nb);
  view.totalScore = score.total;

  view.quests = [
    { ...ninhBinh.quests[0], score: score.baiDinh, status: nb.baiDinh.status },
    { ...ninhBinh.quests[1], score: score.cucPhuong, status: nb.cucPhuong.status },
    { ...ninhBinh.quests[2], score: score.tamCoc, status: nb.tamCoc.status },
  ];
  view.activeQuestId = ninhBinh.quests[nb.currentQuest - 1].id;
  view.activeQuestNumber = nb.currentQuest;

  const marker = (pointId: string, color: string, size = 16) => view.markers.push({ pointId, done: color === '#22c55e', color, size });

  if (nb.currentQuest === 1) {
    marker('NB_BQL_CHU', nb.baiDinh.bqlMet ? '#22c55e' : '#f59e0b', 18);
    marker('NB_BAI_DINH_GATE', nb.baiDinh.boxInspected ? '#22c55e' : '#ef4444');
    marker('NB_LIVESTREAM_GROUP', nb.baiDinh.livestreamResolved ? '#22c55e' : '#ec4899');
    marker('NB_RULE_BOARD', nb.baiDinh.rulesPublished ? '#22c55e' : '#3b82f6');
  } else if (nb.currentQuest === 2) {
    marker('NB_RANGERS_POST', nb.cucPhuong.patrolStarted ? '#22c55e' : '#f59e0b', 18);
    marker('NB_ANIMAL_TRAP', nb.cucPhuong.trapDisarmed ? '#22c55e' : '#ef4444');
    marker('NB_WILDLIFE_RELEASE', nb.cucPhuong.animalRescued ? '#22c55e' : '#10b981');
    marker('NB_TIMBER_ZONE', nb.cucPhuong.timberSecured ? '#22c55e' : '#3b82f6');
  } else if (nb.currentQuest === 3) {
    marker('NB_BOATMAN_REP', nb.tamCoc.boatmanMet ? '#22c55e' : '#f59e0b', 18);
    marker('NB_TICKET_BOARD', nb.tamCoc.pricesPosted ? '#22c55e' : '#3b82f6');
    marker('NB_LIFEJACKET_STATION', nb.tamCoc.lifejacketsEquipped ? '#22c55e' : '#10b981');
    marker('NB_DISPATCH_POST', nb.tamCoc.boatsDispatched ? '#22c55e' : '#8b5cf6');
  }

  // Visual lighting for Cuc Phuong night patrol
  const isNight = nb.cucPhuong.isNight;
  view.visual.rescue = {
    sceneAlpha: 0,
    duskAlpha: isNight ? 0.45 : 0,
    fogAlpha: isNight ? 0.2 : 0,
  };

  view.results.recap = [
    {
      mission: 'Nhiệm vụ 1',
      title: 'Bảo vệ tín ngưỡng Chùa Bái Đính',
      narrative: 'Đã phối hợp BQL chấn chỉnh hòm công đức tự phát và nhóm livestream câu view, phổ biến nếp sống văn minh tín ngưỡng.',
      theoryLesson: 'Nhà nước pháp quyền XHCN bảo đảm quyền tự do tín ngưỡng, tôn giáo chính đáng của nhân dân, đồng thời kiên quyết bài trừ mê tín dị đoan và thương mại hóa chốn tôn nghiêm.'
    },
    {
      mission: 'Nhiệm vụ 2',
      title: 'Tuần tra đêm Rừng Cúc Phương',
      narrative: 'Tổ chức tuần tra đêm, tháo gỡ bẫy thú, cứu hộ cá thể động vật hoang dã và thu giữ tang vật khai thác gỗ quý trái phép.',
      theoryLesson: 'Bảo vệ tài nguyên rừng và đa dạng sinh học là trách nhiệm pháp lý và đạo đức, thể hiện mục tiêu phát triển bền vững của chế độ XHCN vì lợi ích thế hệ mai sau.'
    },
    {
      mission: 'Nhiệm vụ 3',
      title: 'Giải tỏa ách tắc bến Tam Cốc',
      narrative: 'Niêm yết công khai giá vé, trang bị áo phao cứu sinh và điều phối xuất bến công bằng, chấm dứt nạn chèo kéo và xin tiền tip.',
      theoryLesson: 'Minh bạch quy chế, phục vụ bình đẳng và văn minh thương mại bảo đảm quyền lợi của người dân và du khách, nâng cao hình ảnh du lịch quốc gia.'
    }
  ];

  return view;
}
