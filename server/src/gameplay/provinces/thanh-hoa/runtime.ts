import { readPayload, readString } from 'shared';
import { INTERACTION_RADIUS, getProvinceDefinition, getProvinceModule, THANH_HOA_POIS, selectThanhHoaScore } from 'shared';
import type { Player, ServerAck, UntrustedIntent, ActiveJob, CollisionState } from 'shared';
import type { ProvinceRuntime, GameplayProjection } from '../../core/contracts.js';
import type { GameplayPorts } from '../../core/ports.js';
import { PublicServiceRuntime } from '../../presets/public-service/runtime.js';
import { createThanhHoaState } from './state.js';

const distance = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1);

export class ThanhHoaRuntime implements ProvinceRuntime {
  public state = createThanhHoaState();
  public readonly service: PublicServiceRuntime;

  constructor(private readonly ports: GameplayPorts) {
    this.service = new PublicServiceRuntime(ports, getProvinceDefinition('thanh-hoa'), getProvinceModule('thanh-hoa'));
  }

  start() {
    this.state = createThanhHoaState();
    this.ports.team.audit('MISSION', 'TRẬN ĐẤU BẮT ĐẦU! Nhiệm vụ 1: Tranh chấp bí quyết & thương hiệu Nem chua Thành Nhà Hồ.');
  }

  reset() {
    this.state = createThanhHoaState();
    this.service.reset();
  }

  tick(_dtMs: number) {}

  dispatch(player: Player, intent: UntrustedIntent): ServerAck {
    if (intent.type === 'THANHHOA_ACTION') {
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
    return selectThanhHoaScore(this.state).total;
  }

  worldState(): CollisionState {
    return this.service.worldState();
  }

  projection(): GameplayProjection {
    const service = this.service.projection();
    const score = selectThanhHoaScore(this.state);
    return {
      ...service,
      m1: { ...service.m1, score: score.nemChua, status: this.state.nemChua.status },
      m2: { ...service.m2, score: score.duongRay, status: this.state.duongRay.status },
      m3: { ...service.m3, score: score.valiMuoiToi, status: this.state.valiMuoiToi.status },
      thanhHoaState: JSON.parse(JSON.stringify(this.state)),
    };
  }

  private handleAction(player: Player, action: string | undefined, actionId: string): ServerAck {
    if (!action) return { actionId, success: false, reason: 'Thiếu mã hành động Thanh Hóa.' };
    const { nemChua, duongRay, valiMuoiToi } = this.state;
    const contrib = this.ports.team.contribution(player.id);

    const checkNear = (poiKey: string) => {
      const p = THANH_HOA_POIS[poiKey] ?? (this.ports.read.map.points[poiKey] ? [this.ports.read.map.points[poiKey].x, this.ports.read.map.points[poiKey].y] : undefined);
      if (!p) return false;
      return distance(player.x, player.y, p[0], p[1]) <= INTERACTION_RADIUS + 35;
    };

    switch (action) {
      // ===== QUEST 1: NEM CHUA (30đ) =====
      case 'TH_NM_MEET_DISPUTE': {
        if (!checkNear('TH_ARCH_GATE')) return { actionId, success: false, reason: 'Cần đến trước Cửa Vòm Thành Nhà Hồ.' };
        if (nemChua.meetDispute) return { actionId, success: true };
        nemChua.meetDispute = true;
        nemChua.score += 5;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} can thiệp chia tách xô xát, tiếp nhận lời khai giữa Ông Bảy và Anh Tư. +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'TH_NM_INSPECT_SHOP_C': {
        if (!checkNear('TH_NEM_C_SHOP')) return { actionId, success: false, reason: 'Cần đến cơ sở nem Khu C.' };
        if (!nemChua.meetDispute) return { actionId, success: false, reason: 'Cần can thiệp phân giải trước Cửa Vòm trước.' };
        if (nemChua.inspectShopC) return { actionId, success: true };
        nemChua.inspectShopC = true;
        nemChua.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `${player.name} thu giữ mẫu nem và hóa đơn in nhãn mác tại cơ sở Khu C để giám định. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'TH_NM_COLLECT_KIT': {
        if (!checkNear('TH_SUPPLY_WAREHOUSE')) return { actionId, success: false, reason: 'Cần đến Kho vật tư.' };
        if (!nemChua.meetDispute) return { actionId, success: false, reason: 'Cần can thiệp phân giải trước Cửa Vòm trước.' };
        if (nemChua.collectKit) return { actionId, success: true };
        nemChua.collectKit = true;
        nemChua.score += 10;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('SERVICE', `${player.name} nhận bộ kit đối chiếu tiêu chuẩn bảo hộ nhãn hiệu OCOP xã. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'TH_NM_RESOLVE_DISPUTE': {
        if (!checkNear('TH_NEM_B_SHOP')) return { actionId, success: false, reason: 'Cần đến cơ sở nem Khu B.' };
        if (!nemChua.inspectShopC || !nemChua.collectKit) {
          return { actionId, success: false, reason: 'Cần thu giữ mẫu thử và lấy bộ kit đối chiếu trước.' };
        }
        if (nemChua.resolveDispute) return { actionId, success: true };
        nemChua.resolveDispute = true;
        nemChua.score += 5;
        nemChua.status = 'RESOLVED';
        duongRay.status = 'ACTIVE';
        this.state.currentQuest = 2;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 1! ${player.name} đối chứng khoa học, lập biên bản hòa giải bảo vệ làng nghề. Mở Nhiệm vụ 2: Bắt kẻ cạy ốc đường ray! +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      // ===== QUEST 2: ĐƯỜNG RAY VEN KÊNH (35đ) =====
      case 'TH_DR_APPROACH_SCENE': {
        if (!checkNear('TH_RAIL_CORRIDOR')) return { actionId, success: false, reason: 'Cần đến hiện trường đường ray ven kênh.' };
        if (duongRay.approachScene) return { actionId, success: true };
        duongRay.approachScene = true;
        duongRay.score += 10;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('MISSION', `${player.name} tiếp nhận báo án từ Bác Tuần Đường, mật phục dọc tuyến ray ven kênh. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'TH_DR_SUBDUE_GUARD': {
        if (!checkNear('TH_RAIL_GUARD')) return { actionId, success: false, reason: 'Cần đến vị trí đối tượng canh gác.' };
        if (!duongRay.approachScene) return { actionId, success: false, reason: 'Cần tiếp cận hiện trường trước.' };
        if (duongRay.subdueGuard) return { actionId, success: true };
        duongRay.subdueGuard = true;
        duongRay.score += 10;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} áp sát khống chế đối tượng canh gác, thu hồi bao tải bu-lông đường ray. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'TH_DR_BLOCK_ESCAPE': {
        if (!checkNear('TH_BRIDGE_ESCAPE')) return { actionId, success: false, reason: 'Cần đến cầu gỗ qua kênh.' };
        if (!duongRay.approachScene) return { actionId, success: false, reason: 'Cần tiếp cận hiện trường trước.' };
        if (duongRay.blockEscape) return { actionId, success: true };
        duongRay.blockEscape = true;
        duongRay.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `${player.name} chốt chặn cầu qua kênh, khống chế đối tượng cầm xà-beng tẩu thoát. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'TH_DR_HANDOVER_EVIDENCE': {
        if (!checkNear('TH_SUPPLY_WAREHOUSE')) return { actionId, success: false, reason: 'Cần về Kho vật tư.' };
        if (!duongRay.subdueGuard || !duongRay.blockEscape) {
          return { actionId, success: false, reason: 'Cần bắt gọn hai đối tượng và thu tang vật trước.' };
        }
        if (duongRay.handoverEvidence) return { actionId, success: true };
        duongRay.handoverEvidence = true;
        duongRay.score += 5;
        duongRay.status = 'RESOLVED';
        valiMuoiToi.status = 'ACTIVE';
        this.state.currentQuest = 3;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 2! ${player.name} bàn giao toàn bộ tang vật bu-lông, bảo đảm tuyệt đối an toàn đường sắt. Mở Nhiệm vụ 3: Vali Mười Tỏi! +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      // ===== QUEST 3: VALI MƯỜI TỎI DƯỚI CHÂN ĐỒI (35đ) =====
      case 'TH_VT_MEET_BRIBE': {
        if (!checkNear('TH_OFFICE_LOBBY')) return { actionId, success: false, reason: 'Cần đến phòng tiếp dân Trụ sở.' };
        if (valiMuoiToi.meetBribe) return { actionId, success: true };
        valiMuoiToi.meetBribe = true;
        valiMuoiToi.score += 10;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} tiếp nhận đại diện Đơn vị V; đối tượng hé lộ vali 10 tỷ đòi ký duyệt xẻ đồi di tích. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'TH_VT_ACCEPT_BRIBE': {
        if (!valiMuoiToi.meetBribe) return { actionId, success: false, reason: 'Cần gặp đối tượng trước.' };
        valiMuoiToi.choice = 'BRIBE_ACCEPTED';
        this.ports.team.audit('MISSION', `CẢNH BÁO LIÊM CHÍNH: ${player.name} khước từ dứt khoát hành vi nhận hối lộ, giữ vững danh dự công an nhân dân!`, player.id);
        return { actionId, success: false, reason: 'Hành vi vi phạm nghiêm trọng liêm chính công vụ! Bạn không thể nhận tiền hối lộ.' };
      }

      case 'TH_VT_REJECT_ROUGH': {
        if (!valiMuoiToi.meetBribe) return { actionId, success: false, reason: 'Cần gặp đối tượng trước.' };
        valiMuoiToi.choice = 'REJECT_ROUGH';
        valiMuoiToi.retryCount++;
        this.ports.team.audit('MISSION', `${player.name} đập bàn quát tháo khiến đối tượng ôm vali bỏ chạy! Thiếu chứng cứ buộc tội, cần sử dụng biện pháp nghiệp vụ.`, player.id);
        return { actionId, success: false, reason: 'Đối tượng ôm vali bỏ chạy vì bị động! Hãy dùng nghiệp vụ bình tĩnh ghi âm chứng cứ.' };
      }

      case 'TH_VT_RECORD_EVIDENCE': {
        if (!checkNear('TH_BRIEFCASE_TABLE')) return { actionId, success: false, reason: 'Cần đến bàn tiếp dân đối chất.' };
        if (!valiMuoiToi.meetBribe) return { actionId, success: false, reason: 'Cần tiếp nhận đối tượng trước.' };
        if (valiMuoiToi.recordEvidence) return { actionId, success: true };
        valiMuoiToi.choice = 'RECORD_PROFESSIONAL';
        valiMuoiToi.recordEvidence = true;
        valiMuoiToi.score += 15;
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `${player.name} bình tĩnh đấu trí nghiệp vụ, ghi âm bí mật hành vi hối lộ và yêu cầu ký hồ sơ xác nhận. +15 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'TH_VT_TRIGGER_ALARM': {
        if (!checkNear('TH_ALARM_BUTTON')) return { actionId, success: false, reason: 'Cần đến nút báo động ngầm.' };
        if (!valiMuoiToi.recordEvidence) {
          return { actionId, success: false, reason: 'Cần thu thập đủ chứng cứ nghiệp vụ trước khi báo động.' };
        }
        if (valiMuoiToi.triggerAlarm) return { actionId, success: true };
        valiMuoiToi.triggerAlarm = true;
        valiMuoiToi.score += 10;
        valiMuoiToi.status = 'RESOLVED';
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH TOÀN DIỆN THANH HÓA! ${player.name} bấm báo động ngầm bắt quả tang hành vi đưa hối lộ, bảo vệ nguyên vẹn di tích Thành Nhà Hồ! +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      default:
        return { actionId, success: false, reason: `Không nhận diện hành động Thanh Hóa: ${action}` };
    }
  }
}
