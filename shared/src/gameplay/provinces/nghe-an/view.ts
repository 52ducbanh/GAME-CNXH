import type { GameSnapshot } from '../../../types.js';
import type { MissionGuide } from '../../core/guide.js';
import type { ProvinceView } from '../../core/contracts.js';
import { publicServiceView } from '../../presets/public-service/view.js';
import { ngheAn } from './definition.js';
import { selectNgheAnScore } from './state.js';

export function ngheAnView(s: GameSnapshot, guide: MissionGuide): ProvinceView {
  const view = publicServiceView(s, ngheAn, guide);
  const na = s.ngheAnState;
  if (!na) return view;

  const score = selectNgheAnScore(na);
  view.totalScore = score.total;

  view.quests = [
    { ...ngheAn.quests[0], score: score.chaoLuon, status: na.chaoLuon.status },
    { ...ngheAn.quests[1], score: score.luaDaoDat, status: na.luaDaoDat.status },
    { ...ngheAn.quests[2], score: score.quyKhuyenHoc, status: na.quyKhuyenHoc.status },
  ];
  view.activeQuestId = ngheAn.quests[na.currentQuest - 1].id;
  view.activeQuestNumber = na.currentQuest;

  const marker = (pointId: string, color: string, size = 16) => view.markers.push({ pointId, done: color === '#22c55e', color, size });

  if (na.currentQuest === 1) {
    marker('NA_CH_HOA_SHOP', na.chaoLuon.meetHoa ? '#22c55e' : '#f59e0b', 18);
    marker('NA_CH_TUAN_SHOP', na.chaoLuon.meetTuan ? '#22c55e' : '#ef4444');
    marker('NA_CH_SIDEWALK', na.chaoLuon.measureBoundary ? '#22c55e' : '#3b82f6');
    marker('NA_CH_HOA_SHOP', na.chaoLuon.signCommitment ? '#22c55e' : '#10b981');
  } else if (na.currentQuest === 2) {
    marker('NA_CULTURE_HOUSE', na.luaDaoDat.interviewVictim ? '#22c55e' : '#f59e0b', 18);
    marker('NA_MARKET_ALLEY', na.luaDaoDat.askMarket ? '#22c55e' : '#ef4444');
    marker('NA_SHORTCUT_BLOCK', na.luaDaoDat.blockShortcut ? '#22c55e' : '#3b82f6');
    marker('NA_DEAD_END', na.luaDaoDat.captureSuspect ? '#22c55e' : '#10b981');
  } else if (na.currentQuest === 3) {
    marker('NA_CULTURE_HOUSE', na.quyKhuyenHoc.calmCrowd ? '#22c55e' : '#f59e0b', 18);
    marker('NA_CABINET_EVIDENCE', na.quyKhuyenHoc.inspectCabinet ? '#22c55e' : '#ef4444');
    marker('NA_WINDOW_EVIDENCE', na.quyKhuyenHoc.inspectWindow ? '#22c55e' : '#3b82f6');
    marker('NA_SUSPECTS_LINEUP', na.quyKhuyenHoc.interrogate ? '#22c55e' : '#8b5cf6');
    marker('NA_CULTURE_HOUSE', na.quyKhuyenHoc.solveCase ? '#22c55e' : '#10b981');
  }

  view.results.recap = [
    {
      mission: 'Nhiệm vụ 1',
      title: 'Lập lại trật tự khu phố cháo lươn',
      narrative: 'Kẻ vạch sơn 1.5m phân định ranh giới hè phố văn minh, giải quyết mâu thuẫn buôn bán giữa hai quán ăn và giữ thông thoáng lối đi bộ.',
      theoryLesson: 'Quản lý xã hội bằng pháp luật kết hợp vận động thuyết phục; tôn trọng quyền lợi chính đáng của hộ kinh doanh gắn với trật tự công cộng.'
    },
    {
      mission: 'Nhiệm vụ 2',
      title: 'Vây bắt đối tượng lừa đảo hồ sơ đất đai',
      narrative: 'Truy bắt đối tượng lợi dụng thủ tục hành chính lừa đảo tiền làm sổ đỏ của bà con, hoàn trả hồ sơ và tài sản nguyên vẹn cho nạn nhân.',
      theoryLesson: 'Bảo đảm tính minh bạch, công khai của bộ máy hành chính phục vụ nhân dân; phòng ngừa và nghiêm trị các hành vi lừa đảo trục lợi chính sách.'
    },
    {
      mission: 'Nhiệm vụ 3',
      title: 'Phá án mất trộm Quỹ khuyến học khối phố',
      narrative: 'Khám nghiệm hiện trường khách quan, thu thập mẩu vải vàng và dấu bùn đỏ cửa sổ, xóa tan nghi kỵ vô căn cứ và thu hồi toàn bộ 10 triệu Quỹ khuyến học.',
      theoryLesson: 'Trọng chứng hơn trọng cung, không suy đoán định kiến; bảo vệ công lý và củng cố khối đại đoàn kết toàn dân tại cơ sở.'
    }
  ];

  return view;
}
