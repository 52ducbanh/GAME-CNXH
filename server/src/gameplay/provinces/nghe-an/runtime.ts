import { readPayload, readString } from 'shared';
import { INTERACTION_RADIUS, getProvinceDefinition, getProvinceModule, NGHE_AN_POIS, selectNgheAnScore } from 'shared';
import type { Player, ServerAck, UntrustedIntent, ActiveJob, CollisionState } from 'shared';
import type { ProvinceRuntime, GameplayProjection } from '../../core/contracts.js';
import type { GameplayPorts } from '../../core/ports.js';
import { PublicServiceRuntime } from '../../presets/public-service/runtime.js';
import { createNgheAnState } from './state.js';

const distance = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1);

export class NgheAnRuntime implements ProvinceRuntime {
  public state = createNgheAnState();
  public readonly service: PublicServiceRuntime;

  constructor(private readonly ports: GameplayPorts) {
    this.service = new PublicServiceRuntime(ports, getProvinceDefinition('nghe-an'), getProvinceModule('nghe-an'));
  }

  start() {
    this.state = createNgheAnState();
    this.ports.team.audit('MISSION', 'TRẬN ĐẤU BẮT ĐẦU! Nhiệm vụ 1: Lập lại trật tự khu phố kinh doanh cháo lươn.');
  }

  reset() {
    this.state = createNgheAnState();
    this.service.reset();
  }

  tick(_dtMs: number) {}

  dispatch(player: Player, intent: UntrustedIntent): ServerAck {
    if (intent.type === 'NGHEAN_ACTION') {
      const payload = readPayload(intent.payload);
      return this.handleAction(player, readString(payload?.action), intent.actionId);
    }
    return this.service.dispatch(player, intent);
  }

  completeTask(player: Player, task: ActiveJob) {
    this.service.completeTask(player, task);
  }

  commitVote(missionId: 'M1' | 'M2' | null, plan: string) {
    this.service.commitVote(missionId, plan);
  }

  totalScore(): number {
    return selectNgheAnScore(this.state).total;
  }

  worldState(): CollisionState {
    return this.service.worldState();
  }

  projection(): GameplayProjection {
    const service = this.service.projection();
    const score = selectNgheAnScore(this.state);
    return {
      ...service,
      m1: { ...service.m1, score: score.chaoLuon, status: this.state.chaoLuon.status },
      m2: { ...service.m2, score: score.luaDaoDat, status: this.state.luaDaoDat.status },
      m3: { ...service.m3, score: score.quyKhuyenHoc, status: this.state.quyKhuyenHoc.status },
      ngheAnState: JSON.parse(JSON.stringify(this.state)),
    };
  }

  private handleAction(player: Player, action: string | undefined, actionId: string): ServerAck {
    if (!action) return { actionId, success: false, reason: 'Thiếu mã hành động Nghệ An.' };
    const { chaoLuon, luaDaoDat, quyKhuyenHoc } = this.state;
    const contrib = this.ports.team.contribution(player.id);

    const checkNear = (poiKey: string) => {
      const p = NGHE_AN_POIS[poiKey] ?? (this.ports.read.map.points[poiKey] ? [this.ports.read.map.points[poiKey].x, this.ports.read.map.points[poiKey].y] : undefined);
      if (!p) return false;
      return distance(player.x, player.y, p[0], p[1]) <= INTERACTION_RADIUS + 35;
    };

    switch (action) {
      // ===== QUEST 1: CHÁO LƯƠN (20đ) =====
      case 'NA_CH_MEET_HOA': {
        if (!checkNear('NA_CH_HOA_SHOP')) return { actionId, success: false, reason: 'Cần đến quán cháo Dì Hoa.' };
        if (chaoLuon.meetHoa) return { actionId, success: true };
        chaoLuon.meetHoa = true;
        chaoLuon.score += 5;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} tiếp nhận ý kiến của Dì Hoa về tình hình buôn bán hè phố. +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NA_CH_MEET_TUAN': {
        if (!checkNear('NA_CH_TUAN_SHOP')) return { actionId, success: false, reason: 'Cần đến quán Chú Tuấn.' };
        if (!chaoLuon.meetHoa) return { actionId, success: false, reason: 'Cần trao đổi với quán Dì Hoa trước.' };
        if (chaoLuon.meetTuan) return { actionId, success: true };
        chaoLuon.meetTuan = true;
        chaoLuon.score += 10;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} tiếp nhận ý kiến Chú Tuấn và phản ánh của người đi bộ bị lấn đường. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NA_CH_MEASURE_BOUNDARY': {
        if (!checkNear('NA_CH_SIDEWALK')) return { actionId, success: false, reason: 'Cần đến khu vực vỉa hè quán cháo.' };
        if (!chaoLuon.meetHoa || !chaoLuon.meetTuan) {
          return { actionId, success: false, reason: 'Cần trao đổi với cả hai hộ kinh doanh trước.' };
        }
        if (chaoLuon.measureBoundary) return { actionId, success: true };
        chaoLuon.measureBoundary = true;
        chaoLuon.score += 10;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} đã đo đạc và kẻ vạch sơn 1.5m, sắp xếp bàn ghế gọn gàng. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NA_CH_SIGN_COMMITMENT': {
        if (!checkNear('NA_CH_HOA_SHOP')) return { actionId, success: false, reason: 'Cần đến quán Dì Hoa ký cam kết.' };
        if (!chaoLuon.measureBoundary) return { actionId, success: false, reason: 'Cần kẻ vạch sơn phân định ranh giới trước.' };
        if (chaoLuon.signCommitment) return { actionId, success: true };
        chaoLuon.signCommitment = true;
        chaoLuon.score += 5;
        chaoLuon.status = 'RESOLVED';
        luaDaoDat.status = 'ACTIVE';
        this.state.currentQuest = 2;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 1! ${player.name} hoàn tất ký cam kết văn minh kinh doanh. Mở Nhiệm vụ 2: Vây bắt đối tượng lừa đảo đất đai! +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      // ===== QUEST 2: LỪA ĐẢO ĐẤT ĐAI (35đ) =====
      case 'NA_LD_INTERVIEW_VICTIM': {
        if (!checkNear('NA_CULTURE_HOUSE')) return { actionId, success: false, reason: 'Cần đến Nhà văn hóa gặp Mệ Bảy.' };
        if (luaDaoDat.interviewVictim) return { actionId, success: true };
        luaDaoDat.interviewVictim = true;
        luaDaoDat.score += 10;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} tiếp nhận lời trình báo của Mệ Bảy, ghi nhận đặc điểm đối tượng lừa đảo áo hoa kính râm. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NA_LD_ASK_MARKET': {
        if (!checkNear('NA_MARKET_ALLEY')) return { actionId, success: false, reason: 'Cần đến ngõ chợ.' };
        if (!luaDaoDat.interviewVictim) return { actionId, success: false, reason: 'Cần tiếp nhận trình báo Mệ Bảy trước.' };
        if (luaDaoDat.askMarket) return { actionId, success: true };
        luaDaoDat.askMarket = true;
        luaDaoDat.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `${player.name} hỏi thăm chị bán nhút và bác xích lô, xác định hướng đối tượng tháo chạy. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NA_LD_BLOCK_SHORTCUT': {
        if (!checkNear('NA_SHORTCUT_BLOCK')) return { actionId, success: false, reason: 'Cần đến chốt chặn lối tắt.' };
        if (!luaDaoDat.askMarket) return { actionId, success: false, reason: 'Cần nắm thông tin hướng chạy tại chợ trước.' };
        if (luaDaoDat.blockShortcut) return { actionId, success: true };
        luaDaoDat.blockShortcut = true;
        luaDaoDat.score += 5;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} đã đón đầu chốt chặn lối tắt quán chè, khóa đường rút lui của nghi phạm. +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NA_LD_CAPTURE_SUSPECT': {
        if (!checkNear('NA_DEAD_END')) return { actionId, success: false, reason: 'Cần đến ngách cụt truy bắt đối tượng.' };
        if (!luaDaoDat.blockShortcut) return { actionId, success: false, reason: 'Cần chốt chặn lối tắt trước.' };
        if (luaDaoDat.captureSuspect) return { actionId, success: true };
        luaDaoDat.captureSuspect = true;
        luaDaoDat.score += 10;
        luaDaoDat.status = 'RESOLVED';
        quyKhuyenHoc.status = 'ACTIVE';
        this.state.currentQuest = 3;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 2! ${player.name} khống chế đối tượng lừa đảo tại ngách cụt, thu hồi toàn bộ giấy tờ và tiền hoàn trả Mệ Bảy. Mở Nhiệm vụ 3: Phá án Quỹ khuyến học! +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      // ===== QUEST 3: PHÁ ÁN QUỸ KHUYẾN HỌC (35đ) =====
      case 'NA_QK_CALM_CROWD': {
        if (!checkNear('NA_CULTURE_HOUSE')) return { actionId, success: false, reason: 'Cần đến Nhà văn hóa.' };
        if (quyKhuyenHoc.calmCrowd) return { actionId, success: true };
        quyKhuyenHoc.calmCrowd = true;
        quyKhuyenHoc.score += 5;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} ổn định đám đông bà con nhân dân, kiên quyết không quy chụp định kiến khi chưa có chứng cứ. +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NA_QK_INSPECT_CABINET': {
        if (!checkNear('NA_CABINET_EVIDENCE')) return { actionId, success: false, reason: 'Cần đến vị trí hộc tủ Nhà văn hóa.' };
        if (!quyKhuyenHoc.calmCrowd) return { actionId, success: false, reason: 'Cần ổn định hiện trường trước.' };
        if (quyKhuyenHoc.inspectCabinet) return { actionId, success: true };
        quyKhuyenHoc.inspectCabinet = true;
        quyKhuyenHoc.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `${player.name} khám nghiệm hộc tủ bị cạy phá, thu giữ mẩu vải vàng tang vật mắc lại. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NA_QK_INSPECT_WINDOW': {
        if (!checkNear('NA_WINDOW_EVIDENCE')) return { actionId, success: false, reason: 'Cần đến bậu cửa sổ Nhà văn hóa.' };
        if (!quyKhuyenHoc.calmCrowd) return { actionId, success: false, reason: 'Cần ổn định hiện trường trước.' };
        if (quyKhuyenHoc.inspectWindow) return { actionId, success: true };
        quyKhuyenHoc.inspectWindow = true;
        quyKhuyenHoc.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `${player.name} khám nghiệm bậu cửa sổ, ghi nhận dấu vết đất đỏ bùn lầy của kẻ đột nhập. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NA_QK_INTERROGATE': {
        if (!checkNear('NA_SUSPECTS_LINEUP')) return { actionId, success: false, reason: 'Cần đến khu vực lấy lời khai.' };
        if (!quyKhuyenHoc.inspectCabinet || !quyKhuyenHoc.inspectWindow) {
          return { actionId, success: false, reason: 'Cần thu thập đủ chứng cứ hộc tủ và cửa sổ trước.' };
        }
        if (quyKhuyenHoc.interrogate) return { actionId, success: true };
        quyKhuyenHoc.interrogate = true;
        quyKhuyenHoc.score += 5;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('SERVICE', `${player.name} lấy lời khai Tèo, Hùng, Dũng; phát hiện vạt áo vàng của Dũng bị rách và giày dính bùn đất đỏ. +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NA_QK_SOLVE_CASE': {
        if (!checkNear('NA_CULTURE_HOUSE')) return { actionId, success: false, reason: 'Cần đến sảnh Nhà văn hóa kết luận vụ án.' };
        if (!quyKhuyenHoc.interrogate) return { actionId, success: false, reason: 'Cần đối chiếu lời khai trước.' };
        if (quyKhuyenHoc.solveCase) return { actionId, success: true };
        quyKhuyenHoc.solveCase = true;
        quyKhuyenHoc.score += 5;
        quyKhuyenHoc.status = 'RESOLVED';
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH TOÀN DIỆN NGHỆ AN! ${player.name} đối chất chứng cứ khách quan, buộc Dũng nhận tội và thu hồi nguyên vẹn 10 triệu Quỹ khuyến học! +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      default:
        return { actionId, success: false, reason: `Không nhận diện hành động Nghệ An: ${action}` };
    }
  }
}
