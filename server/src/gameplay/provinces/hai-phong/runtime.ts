import { readPayload, readString } from 'shared';
import { INTERACTION_RADIUS, getProvinceDefinition, getProvinceModule, HAI_PHONG_POIS, selectHaiPhongScore } from 'shared';
import type { Player, ServerAck, UntrustedIntent, ActiveJob, CollisionState } from 'shared';
import type { ProvinceRuntime, GameplayProjection } from '../../core/contracts.js';
import type { GameplayPorts } from '../../core/ports.js';
import { PublicServiceRuntime } from '../../presets/public-service/runtime.js';
import { createHaiPhongState } from './state.js';

const distance = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1);

export class HaiPhongRuntime implements ProvinceRuntime {
  public state = createHaiPhongState();
  public readonly service: PublicServiceRuntime;

  constructor(private readonly ports: GameplayPorts) {
    this.service = new PublicServiceRuntime(ports, getProvinceDefinition('hai-phong'), getProvinceModule('hai-phong'));
  }

  start() {
    this.state = createHaiPhongState();
    this.ports.team.audit('MISSION', 'TRẬN ĐẤU BẮT ĐẦU! Nhiệm vụ 1: Văn minh Foodtour & Trật tự đô thị tại Hải Phòng.');
  }

  reset() {
    this.state = createHaiPhongState();
    this.service.reset();
  }

  tick(_dtMs: number) {}

  dispatch(player: Player, intent: UntrustedIntent): ServerAck {
    if (intent.type === 'HAIPHONG_ACTION') {
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
    return selectHaiPhongScore(this.state).total;
  }

  worldState(): CollisionState {
    return this.service.worldState();
  }

  projection(): GameplayProjection {
    const service = this.service.projection();
    const score = selectHaiPhongScore(this.state);
    return {
      ...service,
      m1: { ...service.m1, score: score.foodtour, status: this.state.foodtour.status },
      m2: { ...service.m2, score: score.cheLo, status: this.state.cheLo.status },
      m3: { ...service.m3, score: score.doSon, status: this.state.doSon.status },
      haiPhongState: JSON.parse(JSON.stringify(this.state)),
    };
  }

  private handleAction(player: Player, action: string | undefined, actionId: string): ServerAck {
    if (!action) return { actionId, success: false, reason: 'Thiếu mã hành động Hải Phòng.' };
    const { foodtour, cheLo, doSon } = this.state;
    const contrib = this.ports.team.contribution(player.id);

    const checkNear = (poiKey: string) => {
      const p = HAI_PHONG_POIS[poiKey] ?? (this.ports.read.map.points[poiKey] ? [this.ports.read.map.points[poiKey].x, this.ports.read.map.points[poiKey].y] : undefined);
      if (!p) return false;
      return distance(player.x, player.y, p[0], p[1]) <= INTERACTION_RADIUS + 35;
    };

    switch (action) {
      // ===== QUEST 1: FOODTOUR (30đ) =====
      case 'HP_FD_MEET_HOA': {
        if (!checkNear('HP_HOA_CRAB_NOODLE')) return { actionId, success: false, reason: 'Cần đến gặp Cô Hoa quán bánh đa cua.' };
        if (foodtour.hoaMet) return { actionId, success: true };
        foodtour.hoaMet = true;
        foodtour.score += 5;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} tiếp nhận ý kiến của Cô Hoa về việc đảm bảo trật tự hè phố Foodtour. +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'HP_FD_SETUP_SIDEWALK': {
        if (!checkNear('HP_SIDEWALK_BARRIER')) return { actionId, success: false, reason: 'Cần đến khu vực vỉa hè quán ăn.' };
        if (!foodtour.hoaMet) return { actionId, success: false, reason: 'Cần gặp Cô Hoa tiếp nhận tình hình trước.' };
        if (foodtour.sidewalkSetup) return { actionId, success: true };
        foodtour.sidewalkSetup = true;
        foodtour.score += 10;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} đã sắp xếp lại bàn ghế, kẻ vạch giữ lối đi bộ thông thoáng. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'HP_FD_ORGANIZE_PARKING': {
        if (!checkNear('HP_PARKING_ZONE')) return { actionId, success: false, reason: 'Cần đến bãi đỗ xe cạnh Nhà hát.' };
        if (!foodtour.hoaMet) return { actionId, success: false, reason: 'Cần gặp Cô Hoa tiếp nhận tình hình trước.' };
        if (foodtour.parkingOrganized) return { actionId, success: true };
        foodtour.parkingOrganized = true;
        foodtour.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('SERVICE', `${player.name} điều phối bãi trông giữ xe văn minh, ngăn chặn đỗ xe tràn lan dưới lòng đường. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'HP_FD_POST_PRICES': {
        if (!checkNear('HP_PRICE_LIST')) return { actionId, success: false, reason: 'Cần đến bảng niêm yết giá.' };
        if (!foodtour.sidewalkSetup || !foodtour.parkingOrganized) {
          return { actionId, success: false, reason: 'Cần sắp xếp vỉa hè và bãi xe trước.' };
        }
        if (foodtour.pricesPosted) return { actionId, success: true };
        foodtour.pricesPosted = true;
        foodtour.score += 5;
        foodtour.status = 'RESOLVED';
        cheLo.status = 'ACTIVE';
        this.state.currentQuest = 2;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 1! ${player.name} niêm yết giá và cam kết an toàn thực phẩm. Mở Nhiệm vụ 2: Lò đúc Chè Lò! +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      // ===== QUEST 2: CHÈ LÒ (35đ) =====
      case 'HP_CL_INSPECT_FURNACE': {
        if (!checkNear('HP_CHE_LO_FURNACE')) return { actionId, success: false, reason: 'Cần đến xưởng đúc Chè Lò.' };
        if (cheLo.furnaceInspected) return { actionId, success: true };
        cheLo.furnaceInspected = true;
        cheLo.score += 10;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('MISSION', `${player.name} kiểm tra lò đúc thủ công và đánh giá mức độ phát thải nhiệt, khí thải xưởng đúc. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'HP_CL_TAKE_SAMPLE': {
        if (!checkNear('HP_SAMPLE_POINT')) return { actionId, success: false, reason: 'Cần đến vị trí lấy mẫu quan trắc trên bờ ven xưởng.' };
        if (!cheLo.furnaceInspected) return { actionId, success: false, reason: 'Cần kiểm tra lò đúc trước.' };
        if (cheLo.sampleTaken) return { actionId, success: true };
        cheLo.sampleTaken = true;
        cheLo.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `${player.name} lấy mẫu nước và bụi lắng bờ xưởng đúc phục vụ phân tích môi trường. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'HP_CL_CHECK_FILTER': {
        if (!checkNear('HP_FILTER_INSPECTION')) return { actionId, success: false, reason: 'Cần đến hệ thống lọc khí lò đúc.' };
        if (!cheLo.furnaceInspected) return { actionId, success: false, reason: 'Cần kiểm tra lò đúc trước.' };
        if (cheLo.filterChecked) return { actionId, success: true };
        cheLo.filterChecked = true;
        cheLo.score += 10;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('SERVICE', `${player.name} kiểm tra hiệu quả màng lọc bụi tĩnh điện và bảo dưỡng ống khói xưởng đúc. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'HP_CL_SIGN_DOSSIER': {
        if (!checkNear('HP_DOSSIER_STATION')) return { actionId, success: false, reason: 'Cần đến bàn hoàn thiện hồ sơ môi trường.' };
        if (!cheLo.sampleTaken || !cheLo.filterChecked) {
          return { actionId, success: false, reason: 'Cần lấy mẫu quan trắc và kiểm tra màng lọc trước.' };
        }
        if (cheLo.dossierSigned) return { actionId, success: true };
        cheLo.dossierSigned = true;
        cheLo.score += 5;
        cheLo.status = 'RESOLVED';
        doSon.status = 'ACTIVE';
        this.state.currentQuest = 3;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 2! ${player.name} ký biên bản chuyển đổi công nghệ xanh làng nghề Chè Lò. Mở Nhiệm vụ 3: Dự án mở đường Đồ Sơn! +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      // ===== QUEST 3: ĐỒ SƠN (35đ) =====
      case 'HP_DS_MEET_RESIDENTS': {
        if (!checkNear('HP_DO_SON_RESIDENTS')) return { actionId, success: false, reason: 'Cần đến gặp nhân dân khu vực Đồ Sơn.' };
        if (doSon.residentsMet) return { actionId, success: true };
        doSon.residentsMet = true;
        doSon.score += 10;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} tổ chức đối thoại công khai, ghi nhận đầy đủ nguyện vọng bà con nhân dân Đồ Sơn. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'HP_DS_POST_PLANNING': {
        if (!checkNear('HP_PLANNING_BOARD')) return { actionId, success: false, reason: 'Cần đến bảng niêm yết quy hoạch.' };
        if (!doSon.residentsMet) return { actionId, success: false, reason: 'Cần đối thoại với nhân dân trước.' };
        if (doSon.planningPosted) return { actionId, success: true };
        doSon.planningPosted = true;
        doSon.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `${player.name} niêm yết công khai bản đồ mốc giới mở đường và dự án hạ tầng công cộng. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'HP_DS_RESOLVE_COMPENSATION': {
        if (!checkNear('HP_COMPENSATION_DESK')) return { actionId, success: false, reason: 'Cần đến bàn bồi thường & tái định cư.' };
        if (!doSon.residentsMet) return { actionId, success: false, reason: 'Cần đối thoại với nhân dân trước.' };
        if (doSon.compensationResolved) return { actionId, success: true };
        doSon.compensationResolved = true;
        doSon.score += 10;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} giải quyết bồi thường thỏa đáng, bảo đảm phương án an cư lạc nghiệp cho người dân. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'HP_DS_SECURE_EXCAVATOR': {
        if (!checkNear('HP_EXCAVATOR_SITE')) return { actionId, success: false, reason: 'Cần đến công trường máy xúc Đồ Sơn.' };
        if (!doSon.planningPosted || !doSon.compensationResolved) {
          return { actionId, success: false, reason: 'Cần công khai quy hoạch và giải quyết bồi thường trước.' };
        }
        if (doSon.excavatorSecured) return { actionId, success: true };
        doSon.excavatorSecured = true;
        doSon.score += 5;
        doSon.status = 'RESOLVED';
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH TOÀN DIỆN HẢI PHÒNG! ${player.name} điều phối an toàn công trường máy xúc mở đường. Đạt tuyệt đối điểm số tỉnh! +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      default:
        return { actionId, success: false, reason: `Không nhận diện hành động Hải Phòng: ${action}` };
    }
  }
}
