import { readPayload, readString } from 'shared';
import { INTERACTION_RADIUS, getProvinceDefinition, getProvinceModule, QUANG_NINH_POIS, selectQuangNinhScore } from 'shared';
import type { Player, ServerAck, UntrustedIntent, ActiveJob, CollisionState } from 'shared';
import type { ProvinceRuntime, GameplayProjection } from '../../core/contracts.js';
import type { GameplayPorts } from '../../core/ports.js';
import { PublicServiceRuntime } from '../../presets/public-service/runtime.js';
import { createQuangNinhState } from './state.js';

const distance = (x1: number, y1: number, x2: number, y2: number) => Math.hypot(x2 - x1, y2 - y1);

export class QuangNinhRuntime implements ProvinceRuntime {
  public state = createQuangNinhState();
  public readonly service: PublicServiceRuntime;

  constructor(private readonly ports: GameplayPorts) {
    this.service = new PublicServiceRuntime(ports, getProvinceDefinition('quang-ninh'), getProvinceModule('quang-ninh'));
  }

  start() {
    this.state = createQuangNinhState();
    this.ports.team.audit('MISSION', 'TRẬN ĐẤU BẮT ĐẦU! Nhiệm vụ 1: Dẹp tờ rơi đen & Tuyên truyền pháp luật tại ngõ phố.');
  }

  reset() {
    this.state = createQuangNinhState();
    this.service.reset();
  }

  tick(_dtMs: number) {}

  dispatch(player: Player, intent: UntrustedIntent): ServerAck {
    if (intent.type === 'QUANGNINH_ACTION') {
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
    return selectQuangNinhScore(this.state).total;
  }

  worldState(): CollisionState {
    return this.service.worldState();
  }

  projection(): GameplayProjection {
    const service = this.service.projection();
    const score = selectQuangNinhScore(this.state);
    return {
      ...service,
      m1: { ...service.m1, score: score.toRoi, status: this.state.toRoi.status },
      m2: { ...service.m2, score: score.congTruong, status: this.state.congTruong.status },
      m3: { ...service.m3, score: score.thanXuat, status: this.state.thanXuat.status },
      quangNinhState: JSON.parse(JSON.stringify(this.state)),
    };
  }

  private handleAction(player: Player, action: string | undefined, actionId: string): ServerAck {
    if (!action) return { actionId, success: false, reason: 'Thiếu mã hành động Quảng Ninh.' };
    const { toRoi, congTruong, thanXuat } = this.state;
    const contrib = this.ports.team.contribution(player.id);

    const checkNear = (poiKey: string) => {
      const p = QUANG_NINH_POIS[poiKey] ?? (this.ports.read.map.points[poiKey] ? [this.ports.read.map.points[poiKey].x, this.ports.read.map.points[poiKey].y] : undefined);
      if (!p) return false;
      return distance(player.x, player.y, p[0], p[1]) <= INTERACTION_RADIUS + 35;
    };

    switch (action) {
      // ===== QUEST 1: TỜ RƠI (30đ) =====
      case 'QN_TR_MEET_HOANG': {
        if (!checkNear('QN_CITIZEN_HOANG')) return { actionId, success: false, reason: 'Cần đến gặp Bác Hoàng tổ dân phố.' };
        if (toRoi.hoangMet) return { actionId, success: true };
        toRoi.hoangMet = true;
        toRoi.score += 5;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} tiếp nhận phản ánh của Bác Hoàng về nạn dán trộm tờ rơi tín dụng đen. +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'QN_TR_PEEL_FLIERS': {
        if (!checkNear('QN_FLIER_WALL')) return { actionId, success: false, reason: 'Cần đến khu vực tường dán tờ rơi.' };
        if (!toRoi.hoangMet) return { actionId, success: false, reason: 'Cần gặp Bác Hoàng tiếp nhận phản ánh trước.' };
        if (toRoi.fliersPeeled) return { actionId, success: true };
        toRoi.fliersPeeled = true;
        toRoi.score += 10;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} đã bóc gỡ và tiêu hủy toàn bộ tờ rơi tín dụng đen trên ngõ phố. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'QN_TR_DIGITAL_GUIDE': {
        if (!checkNear('QN_ALLEY_POST')) return { actionId, success: false, reason: 'Cần đến điểm tuyên truyền ngõ phố.' };
        if (!toRoi.hoangMet) return { actionId, success: false, reason: 'Cần gặp Bác Hoàng tiếp nhận phản ánh trước.' };
        if (toRoi.digitalGuided) return { actionId, success: true };
        toRoi.digitalGuided = true;
        toRoi.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('SERVICE', `${player.name} hướng dẫn nhân dân tra cứu thủ tục hành chính số hóa và phòng ngừa lừa đảo. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'QN_TR_PUBLISH_BOARD': {
        if (!checkNear('QN_PUBLIC_BOARD')) return { actionId, success: false, reason: 'Cần đến bảng tin công khai.' };
        if (!toRoi.fliersPeeled || !toRoi.digitalGuided) {
          return { actionId, success: false, reason: 'Cần bóc gỡ tờ rơi và tuyên truyền số hóa trước.' };
        }
        if (toRoi.boardPublished) return { actionId, success: true };
        toRoi.boardPublished = true;
        toRoi.score += 5;
        toRoi.status = 'RESOLVED';
        congTruong.status = 'ACTIVE';
        this.state.currentQuest = 2;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 1! ${player.name} công khai đường dây nóng tố giác tội phạm. Mở Nhiệm vụ 2: Công trường vịnh! +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      // ===== QUEST 2: CÔNG TRƯỜNG & MÔI TRƯỜNG VỊNH (35đ) =====
      case 'QN_CT_INSPECT_SITE': {
        if (!checkNear('QN_CONSTRUCTION_SITE')) return { actionId, success: false, reason: 'Cần đến công trường san lấp ven biển.' };
        if (congTruong.siteInspected) return { actionId, success: true };
        congTruong.siteInspected = true;
        congTruong.score += 10;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('MISSION', `${player.name} kiểm tra hồ sơ tác động môi trường và ranh giới san lấp công trường. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'QN_CT_CHECK_TRUCKS': {
        if (!checkNear('QN_TRUCK_CHECK')) return { actionId, success: false, reason: 'Cần đến chốt kiểm soát xe tải.' };
        if (!congTruong.siteInspected) return { actionId, success: false, reason: 'Cần kiểm tra hồ sơ công trường trước.' };
        if (congTruong.trucksChecked) return { actionId, success: true };
        congTruong.trucksChecked = true;
        congTruong.score += 10;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} yêu cầu xe tải phủ bạt kín chống rơi vãi và rửa sạch lốp trước khi ra đường. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'QN_CT_MONITOR_WATER': {
        if (!checkNear('QN_ENVIRONMENT_OFFICE')) return { actionId, success: false, reason: 'Cần đến trạm quan trắc môi trường.' };
        if (!congTruong.siteInspected) return { actionId, success: false, reason: 'Cần kiểm tra hồ sơ công trường trước.' };
        if (congTruong.waterMonitored) return { actionId, success: true };
        congTruong.waterMonitored = true;
        congTruong.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('SERVICE', `${player.name} lấy mẫu đo độ đục nước ven bờ Di sản Vịnh Hạ Long, đảm bảo trong ngưỡng an toàn. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'QN_CT_SIGN_COMMITMENT': {
        if (!checkNear('QN_WAREHOUSE_SITE')) return { actionId, success: false, reason: 'Cần đến kho/văn phòng điều hành công trường.' };
        if (!congTruong.trucksChecked || !congTruong.waterMonitored) {
          return { actionId, success: false, reason: 'Cần kiểm tra xe tải và lấy mẫu nước trước.' };
        }
        if (congTruong.commitmentSigned) return { actionId, success: true };
        congTruong.commitmentSigned = true;
        congTruong.score += 5;
        congTruong.status = 'RESOLVED';
        thanXuat.status = 'ACTIVE';
        this.state.currentQuest = 3;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 2! ${player.name} hoàn tất biên bản cam kết bảo vệ môi trường vịnh. Mở Nhiệm vụ 3: Khoáng sản ven nước! +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      // ===== QUEST 3: KHOÁNG SẢN LẬU & BẢO VỆ CẦU (35đ) =====
      case 'QN_TX_DISCOVER_DEPOT': {
        if (!checkNear('QN_HIDDEN_DEPOT')) return { actionId, success: false, reason: 'Cần tiếp cận bãi tập kết ven nước.' };
        if (thanXuat.depotDiscovered) return { actionId, success: true };
        thanXuat.depotDiscovered = true;
        thanXuat.score += 10;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('MISSION', `${player.name} phát hiện bãi tập kết than/khoáng sản lậu khuất ven luồng nước. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'QN_TX_INSPECT_BARGE': {
        if (!checkNear('QN_BARGE_DOCK')) return { actionId, success: false, reason: 'Cần đến bến xà lan trung chuyển.' };
        if (!thanXuat.depotDiscovered) return { actionId, success: false, reason: 'Cần tiếp cận bãi tập kết trước.' };
        if (thanXuat.bargeInspected) return { actionId, success: true };
        thanXuat.bargeInspected = true;
        thanXuat.score += 10;
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `${player.name} kiểm tra xà lan: phát hiện chở khoáng sản không có hóa đơn chứng từ hợp pháp. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'QN_TX_SEAL_VIOLATION': {
        if (!checkNear('QN_SEAL_STATION')) return { actionId, success: false, reason: 'Cần đến điểm niêm phong tang vật.' };
        if (!thanXuat.bargeInspected) return { actionId, success: false, reason: 'Cần kiểm tra xà lan trước.' };
        if (thanXuat.violationSealed) return { actionId, success: true };
        thanXuat.violationSealed = true;
        thanXuat.score += 10;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} niêm phong tang vật và lập biên bản tịch thu khoáng sản lậu theo quy định. +10 điểm.`, player.id);
        return { actionId, success: true };
      }

      case 'QN_TX_SECURE_BRIDGE': {
        if (!checkNear('QN_BRIDGE_CHECKPOINT')) return { actionId, success: false, reason: 'Cần đến chốt kiểm soát cầu.' };
        if (!thanXuat.violationSealed) return { actionId, success: false, reason: 'Cần niêm phong tang vật trước.' };
        if (thanXuat.bridgeSecured) return { actionId, success: true };
        thanXuat.bridgeSecured = true;
        thanXuat.score += 5;
        thanXuat.status = 'RESOLVED';
        if (contrib) contrib.audits++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH XUẤT SẮC CẢ 3 NHIỆM VỤ QUẢNG NINH! ${player.name} chốt chặn bảo vệ an toàn 2 tuyến cầu huyết mạch. +5 điểm.`, player.id);
        return { actionId, success: true };
      }

      default:
        return { actionId, success: false, reason: `Hành động Quảng Ninh không xác định: ${action}` };
    }
  }
}
