import { readPayload, readString } from 'shared';
import { INTERACTION_RADIUS, getProvinceDefinition, getProvinceModule, NINH_BINH_POIS, selectNinhBinhScore } from 'shared';
import type { Player, ServerAck, UntrustedIntent, ActiveJob, CollisionState } from 'shared';
import type { ProvinceRuntime, GameplayProjection } from '../../core/contracts.js';
import type { GameplayPorts } from '../../core/ports.js';
import { PublicServiceRuntime } from '../../presets/public-service/runtime.js';
import { createNinhBinhState } from './state.js';

const distance = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1);

export class NinhBinhRuntime implements ProvinceRuntime {
  public state = createNinhBinhState();
  public readonly service: PublicServiceRuntime;

  constructor(private readonly ports: GameplayPorts) {
    this.service = new PublicServiceRuntime(ports, getProvinceDefinition('ninh-binh'), getProvinceModule('ninh-binh'));
  }

  start() {
    this.state = createNinhBinhState();
    this.ports.team.audit('MISSION', 'TRẬN ĐẤU BẮT ĐẦU! Nhiệm vụ 1: Bảo vệ tín ngưỡng tại Chùa Bái Đính.');
  }

  reset() {
    this.state = createNinhBinhState();
    this.service.reset();
  }

  tick(_dtMs: number) {}

  dispatch(player: Player, intent: UntrustedIntent): ServerAck {
    if (intent.type === 'NINHBINH_ACTION') {
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
    return selectNinhBinhScore(this.state).total;
  }

  worldState(): CollisionState {
    return this.service.worldState();
  }

  projection(): GameplayProjection {
    const service = this.service.projection();
    const score = selectNinhBinhScore(this.state);
    return {
      ...service,
      m1: { ...service.m1, score: score.baiDinh, status: this.state.baiDinh.status },
      m2: { ...service.m2, score: score.cucPhuong, status: this.state.cucPhuong.status },
      m3: { ...service.m3, score: score.tamCoc, status: this.state.tamCoc.status },
      ninhBinhState: JSON.parse(JSON.stringify(this.state)),
    };
  }

  private handleAction(player: Player, action: string | undefined, actionId: string): ServerAck {
    if (!action) return { actionId, success: false, reason: 'Thiếu mã hành động Ninh Bình.' };
    const { baiDinh, cucPhuong, tamCoc } = this.state;
    const contrib = this.ports.team.contribution(player.id);

    const checkNear = (poiKey: string) => {
      const p = NINH_BINH_POIS[poiKey] ?? (this.ports.read.map.points[poiKey] ? [this.ports.read.map.points[poiKey].x, this.ports.read.map.points[poiKey].y] : undefined);
      if (!p) return false;
      return distance(player.x, player.y, p[0], p[1]) <= INTERACTION_RADIUS + 35;
    };

    switch (action) {
      // ===== QUEST 1: BÁI ĐÍNH (30đ) =====
      case 'NB_BD_MEET_BQL': {
        if (!checkNear('NB_BQL_CHU')) return { actionId, success: false, reason: 'Cần đến gặp BQL Chùa Bái Đính.' };
        if (baiDinh.bqlMet) return { actionId, success: true };
        baiDinh.bqlMet = true;
        baiDinh.score += 5;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} tiếp nhận phản ánh từ Bác Chúc (BQL Bái Đính) về tình hình trật tự chùa. +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NB_BD_INSPECT_BOX': {
        if (!checkNear('NB_BAI_DINH_GATE')) return { actionId, success: false, reason: 'Cần đến cổng chùa Bái Đính.' };
        if (!baiDinh.bqlMet) return { actionId, success: false, reason: 'Cần gặp BQL tiếp nhận phản ánh trước.' };
        if (baiDinh.boxInspected) return { actionId, success: true };
        baiDinh.boxInspected = true;
        baiDinh.score += 10;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} đã kiểm tra và niêm phong hòm công đức tự phát trái phép. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NB_BD_RESOLVE_LIVESTREAM': {
        if (!checkNear('NB_LIVESTREAM_GROUP')) return { actionId, success: false, reason: 'Cần đến khu vực nhóm livestream.' };
        if (!baiDinh.bqlMet) return { actionId, success: false, reason: 'Cần gặp BQL tiếp nhận phản ánh trước.' };
        if (baiDinh.livestreamResolved) return { actionId, success: true };
        baiDinh.livestreamResolved = true;
        baiDinh.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `${player.name} nhắc nhở, chấn chỉnh nhóm livestream mê tín dị đoan câu view. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NB_BD_PUBLISH_RULES': {
        if (!checkNear('NB_RULE_BOARD')) return { actionId, success: false, reason: 'Cần đến bảng công khai nội quy.' };
        if (!baiDinh.boxInspected || !baiDinh.livestreamResolved) {
          return { actionId, success: false, reason: 'Cần niêm phong hòm công đức và chấn chỉnh livestream trước.' };
        }
        if (baiDinh.rulesPublished) return { actionId, success: true };
        baiDinh.rulesPublished = true;
        baiDinh.score += 5;
        baiDinh.status = 'RESOLVED';
        cucPhuong.status = 'ACTIVE';
        this.state.currentQuest = 2;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 1! ${player.name} niêm yết quy định văn minh tín ngưỡng. Mở Nhiệm vụ 2: Rừng Cúc Phương! +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      // ===== QUEST 2: CÚC PHƯƠNG (30đ) =====
      case 'NB_CP_START_PATROL': {
        if (!checkNear('NB_RANGERS_POST')) return { actionId, success: false, reason: 'Cần đến trạm kiểm lâm Cúc Phương.' };
        if (cucPhuong.patrolStarted) return { actionId, success: true };
        cucPhuong.patrolStarted = true;
        cucPhuong.isNight = true;
        cucPhuong.score += 10;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} gặp Bác Hải kiểm lâm, kích hoạt tuần tra đêm rừng Cúc Phương. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NB_CP_DISARM_TRAP': {
        if (!checkNear('NB_ANIMAL_TRAP')) return { actionId, success: false, reason: 'Cần đến vị trí bẫy thú rừng.' };
        if (!cucPhuong.patrolStarted) return { actionId, success: false, reason: 'Cần kích hoạt tuần tra trước.' };
        if (cucPhuong.trapDisarmed) return { actionId, success: true };
        cucPhuong.trapDisarmed = true;
        cucPhuong.score += 10;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} dò tìm và vô hiệu hóa thành công bẫy dây siết thú rừng. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NB_CP_RESCUE_ANIMAL': {
        if (!checkNear('NB_WILDLIFE_RELEASE')) return { actionId, success: false, reason: 'Cần đến điểm cứu hộ động vật.' };
        if (!cucPhuong.patrolStarted) return { actionId, success: false, reason: 'Cần kích hoạt tuần tra trước.' };
        if (cucPhuong.animalRescued) return { actionId, success: true };
        cucPhuong.animalRescued = true;
        cucPhuong.score += 10;
        if (contrib) contrib.deliveries++;
        this.ports.team.audit('SERVICE', `${player.name} sơ cứu và thả cá thể cu li quý hiếm về tự nhiên an toàn. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NB_CP_SECURE_TIMBER': {
        if (!checkNear('NB_TIMBER_ZONE')) return { actionId, success: false, reason: 'Cần đến hiện trường bảo vệ gỗ rừng.' };
        if (!cucPhuong.trapDisarmed || !cucPhuong.animalRescued) {
          return { actionId, success: false, reason: 'Cần tháo bẫy thú và cứu hộ động vật trước.' };
        }
        if (cucPhuong.timberSecured) return { actionId, success: true };
        cucPhuong.timberSecured = true;
        cucPhuong.score += 5;
        cucPhuong.status = 'RESOLVED';
        cucPhuong.isNight = false;
        tamCoc.status = 'ACTIVE';
        this.state.currentQuest = 3;
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 2! ${player.name} thu giữ tang vật cưa gỗ và cắm biển bảo tồn. Mở Nhiệm vụ 3: Tam Cốc! +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      // ===== QUEST 3: TAM CỐC (35đ) =====
      case 'NB_TC_MEET_BOATMAN': {
        if (!checkNear('NB_BOATMAN_REP')) return { actionId, success: false, reason: 'Cần đến gặp đại diện đò Tam Cốc.' };
        if (tamCoc.boatmanMet) return { actionId, success: true };
        tamCoc.boatmanMet = true;
        tamCoc.score += 10;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} lắng nghe tâm tư phản ánh của Cô Thắm và bà con chèo đò Tam Cốc. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NB_TC_POST_PRICES': {
        if (!checkNear('NB_TICKET_BOARD')) return { actionId, success: false, reason: 'Cần đến bảng niêm yết vé bến đò.' };
        if (!tamCoc.boatmanMet) return { actionId, success: false, reason: 'Cần gặp người chèo đò trước.' };
        if (tamCoc.pricesPosted) return { actionId, success: true };
        tamCoc.pricesPosted = true;
        tamCoc.score += 10;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `${player.name} niêm yết công khai bảng giá vé và số thứ tự xuất bến Tam Cốc. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NB_TC_EQUIP_LIFEJACKETS': {
        if (!checkNear('NB_LIFEJACKET_STATION')) return { actionId, success: false, reason: 'Cần đến trạm áo phao cứu sinh.' };
        if (!tamCoc.boatmanMet) return { actionId, success: false, reason: 'Cần gặp người chèo đò trước.' };
        if (tamCoc.lifejacketsEquipped) return { actionId, success: true };
        tamCoc.lifejacketsEquipped = true;
        tamCoc.score += 10;
        if (contrib) contrib.deliveries++;
        this.ports.team.audit('SERVICE', `${player.name} cấp phát đầy đủ áo phao cứu sinh đạt chuẩn cho du khách lên đò. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'NB_TC_DISPATCH_BOATS': {
        if (!checkNear('NB_DISPATCH_POST')) return { actionId, success: false, reason: 'Cần đến trạm điều phối xuất bến.' };
        if (!tamCoc.pricesPosted || !tamCoc.lifejacketsEquipped) {
          return { actionId, success: false, reason: 'Cần niêm yết giá vé và cấp phát đủ áo phao trước.' };
        }
        if (tamCoc.boatsDispatched) return { actionId, success: true };
        tamCoc.boatsDispatched = true;
        tamCoc.score += 5;
        tamCoc.status = 'RESOLVED';
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH XUẤT SẮC CẢ 3 NHIỆM VỤ NINH BÌNH! ${player.name} phân luồng thuyền xuất bến văn minh. +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      default:
        return { actionId, success: false, reason: `Hành động Ninh Bình không xác định: ${action}` };
    }
  }
}
