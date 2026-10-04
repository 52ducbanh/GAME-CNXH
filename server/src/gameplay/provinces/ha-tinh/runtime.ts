import { INTERACTION_RADIUS, getProvinceDefinition, getProvinceModule, selectHatinhScore, selectHatinhStatuses } from 'shared';
import type { Player, ServerAck, ClientIntent, ActiveJob, CollisionState } from 'shared';
import type { ProvinceRuntime, GameplayProjection } from '../../core/contracts.js';
import type { GameplayPorts } from '../../core/ports.js';
import { PublicServiceRuntime } from '../../presets/public-service/runtime.js';
import { createHatinhState } from './state.js';
const distance=(x1:number,y1:number,x2:number,y2:number)=>Math.hypot(x2-x1,y2-y1);
export class HatinhRuntime implements ProvinceRuntime {
  public state=createHatinhState();
  public readonly service:PublicServiceRuntime;
  constructor(private readonly ports:GameplayPorts){
    this.service=new PublicServiceRuntime(ports,getProvinceDefinition('ha-tinh'),getProvinceModule('ha-tinh'),()=>selectHatinhStatuses(this.state));
  }
  start(){this.state=createHatinhState();this.normalizeScores();this.ports.team.audit('MISSION','TRẬN ĐẤU BẮT ĐẦU! Nhiệm vụ 1: Lửa đỏ tuyến Vũng Áng - Kiểm soát trật tự cảng biển và tải trọng.');}
  reset(){this.state=createHatinhState();this.service.reset();}
  dispatch(player:Player,intent:ClientIntent):ServerAck{
    return intent.type==='HATINH_ACTION'?this.handleAction(player,intent.payload,intent.actionId):this.service.dispatch(player,intent);
  }
  completeTask(player:Player,task:ActiveJob){this.service.completeTask(player,task);}
  commitVote(missionId:'M1'|'M2'|null,plan:string){this.service.commitVote(missionId,plan);}
  totalScore(){return selectHatinhScore(this.state).total+this.service.totalScore();}
  worldState():CollisionState{return this.service.worldState();}
  projection():GameplayProjection{
    const service=this.service.projection(),score=selectHatinhScore(this.state),status=selectHatinhStatuses(this.state);
    return {...service,
      m1:{...service.m1,score:score.va+service.m1.score,status:status.medicalService},
      m2:{...service.m2,score:score.dg+service.m2.score,status:status.bridgeResponse},
      m3:{...service.m3,score:score.dl+service.m3.score,status:status.citizenRights},
      hatinhState:JSON.parse(JSON.stringify(this.state)),
    };
  }
  private normalizeScores(){
    const score=selectHatinhScore(this.state);
    this.state.va.score=score.va;this.state.dg.score=score.dg;this.state.dl.score=score.dl;
    // Existing rescue actions supersede rewards from the legacy clinic capability.
    // This is clearing separate compatibility rewards, never mirroring rescue scores.
    this.service.clearCompatibilityRewards();
  }
  tick(dtMs:number){
    // Hà Tĩnh Đèo Ngang countdown ticking and scene transition
    if (this.state && this.state.dg.status === 'COUNTDOWN') {
      this.state.dg.countdownRemaining = Math.max(0, this.state.dg.countdownRemaining - dtMs / 1000);
      if (this.state.dg.countdownRemaining <= 1.5 && this.state.dg.timeOfDay !== 'afternoon') {
        this.state.dg.timeOfDay = 'afternoon';
      }
      if (this.state.dg.countdownRemaining <= 0) {
        this.state.dg.countdownRemaining = 0;
        this.state.dg.status = 'ACTIVE';
        this.state.activeScene = 'rescue';
        this.state.dg.timeOfDay = 'dusk';
        this.normalizeScores();
        this.ports.team.audit('MISSION', 'BẮT ĐẦU CHIẾN DỊCH CỨU HỘ ĐÈO NGANG! Trời chập tối, sương mù dày đặc.');
      }
    }
  }
  private handleAction(player: Player, payload: { action?: string } | undefined, actionId: string): ServerAck {
    if (!this.state) {
      return { actionId, success: false, reason: 'Bản đồ hiện tại không phải Hà Tĩnh.' };
    }
    const action = payload?.action;
    if (!action) {
      return { actionId, success: false, reason: 'Không có mã hành động Hà Tĩnh.' };
    }

    const { va, dg, dl } = this.state;
    const contrib = this.ports.team.contribution(player.id);
    const checkNear = (poiKey: string) => {
      const p = this.ports.read.map.points[poiKey];
      if (!p) return false;
      return distance(player.x, player.y, p.x, p.y) <= INTERACTION_RADIUS + 35;
    };

    switch (action) {
      // ===== QUEST 1: VŨNG ÁNG =====
      case 'VA_REPORT_TUAN': {
        if (!checkNear('WORKER_TUAN')) return { actionId, success: false, reason: 'Cần đến gặp công nhân Tuấn.' };
        if (va.tuanReported) return { actionId, success: true };
        va.tuanReported = true;
        va.score += 3;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} tiếp nhận phản ánh từ anh Tuấn về sự cố xe quá tải và đá dăm rơi vãi tại cảng. +3 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'VA_DEPLOY_CAMERA': {
        if (!checkNear('CAMERA')) return { actionId, success: false, reason: 'Cần đến vị trí cột camera.' };
        if (!va.tuanReported) return { actionId, success: false, reason: 'Cần tiếp nhận phản ánh trước.' };
        if (va.cameraDeployed) return { actionId, success: true };
        va.cameraDeployed = true;
        va.score += 4;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} đã kích hoạt hệ thống camera giám sát tự động luồng xe. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'VA_CLEAN_SPILL': {
        if (!checkNear('SPILL')) return { actionId, success: false, reason: 'Cần đến khu vực vật liệu rơi vãi.' };
        if (!va.tuanReported) return { actionId, success: false, reason: 'Cần tiếp nhận phản ánh trước.' };
        if (va.spillCleaned) return { actionId, success: true };
        va.spillCleaned = true;
        va.score += 4;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} đã thu dọn toàn bộ vật liệu đá dăm rơi vãi, bảo đảm mặt đường an toàn. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'VA_DIVERT_TRAFFIC': {
        if (!checkNear('TRAFFIC_VA')) return { actionId, success: false, reason: 'Cần đến chốt phân luồng Vũng Áng.' };
        if (!va.tuanReported) return { actionId, success: false, reason: 'Cần tiếp nhận phản ánh trước.' };
        if (va.trafficDiverted) return { actionId, success: true };
        va.trafficDiverted = true;
        va.score += 4;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} đã phân luồng xe tải nặng vào làn kiểm tra, giải tỏa ùn tắc cảng Vũng Áng. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'VA_WEIGH_TRUCK': {
        if (!checkNear('WEIGH_STATION')) return { actionId, success: false, reason: 'Cần đến trạm cân tải trọng.' };
        if (!va.trafficDiverted) return { actionId, success: false, reason: 'Cần phân luồng xe vào trạm cân trước.' };
        if (va.weighed) return { actionId, success: true };
        va.weighed = true;
        va.score += 4;
        if (contrib) contrib.audits++;
        this.ports.team.audit('AUDIT', `${player.name} vận hành trạm cân: Phát hiện xe tải vượt 45% tải trọng cho phép. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'VA_INSPECT_BANG': {
        if (!checkNear('INSPECTION_BANG')) return { actionId, success: false, reason: 'Cần đến chốt kiểm tra của đ/c Bàng.' };
        if (!va.weighed) return { actionId, success: false, reason: 'Cần cân tải trọng trước.' };
        if (va.inspectedBang) return { actionId, success: true };
        va.inspectedBang = true;
        va.score += 4;
        if (contrib) contrib.audits++;
        this.ports.team.audit('AUDIT', `${player.name} phối hợp cùng đ/c Bàng kiểm tra giấy tờ vận tải và tem kiểm định xe. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'VA_PREPARE_DOSSIER': {
        if (!checkNear('INSPECTION_BANG')) return { actionId, success: false, reason: 'Cần đến chốt kiểm tra để lập biên bản.' };
        if (!va.inspectedBang) return { actionId, success: false, reason: 'Cần hoàn thành kiểm tra xe trước.' };
        if (va.dossierPrepared) return { actionId, success: true };
        va.dossierPrepared = true;
        va.score += 3;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('PLAN', `${player.name} lập biên bản vi phạm hành chính, ghi nhận cam kết hạ tải trước khi lưu thông. +3 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'VA_NEGOTIATE_DOAN': {
        if (!checkNear('DOSSIER_DOAN')) return { actionId, success: false, reason: 'Cần đến gặp ông Doãn (chủ xe/doanh nghiệp).' };
        if (!va.dossierPrepared) return { actionId, success: false, reason: 'Cần lập hồ sơ biên bản trước.' };
        if (va.negotiatedDoan) return { actionId, success: true };
        va.negotiatedDoan = true;
        va.score += 2;
        if (contrib) contrib.audits++;
        this.ports.team.audit('SERVICE', `${player.name} làm việc với ông Doãn: Doanh nghiệp chấp hành phương án sang tải an toàn. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'VA_REOPEN_ROUTE': {
        if (!checkNear('TRAFFIC_VA')) return { actionId, success: false, reason: 'Cần đến chốt điều tiết Vũng Áng.' };
        if (!va.negotiatedDoan || !va.spillCleaned || !va.cameraDeployed) {
          return { actionId, success: false, reason: 'Cần hoàn tất dọn vật liệu, camera và xử lý vi phạm trước khi thông tuyến.' };
        }
        if (va.routeReopened) return { actionId, success: true };
        va.routeReopened = true;
        va.status = 'RESOLVED';
        va.score += 2;
        this.state.currentQuest = 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 1! Tuyến đường Vũng Áng đã thông suốt, an toàn và đúng quy chuẩn. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      // ===== QUEST 2: ĐÈO NGANG =====
      case 'DG_TRIGGER_ALERT': {
        if (!checkNear('DEO_GATHER')) return { actionId, success: false, reason: 'Cần đến khu vực Đèo Ngang để quan sát hiện trường.' };
        if (dg.status !== 'NOT_STARTED') return { actionId, success: true };
        dg.status = 'GATHERING';
        dg.gatherTimeStarted = Date.now();
        dg.readyPlayers = [player.id];
        dg.score += 2;
        this.ports.team.audit('MISSION', `CẢNH BÁO KHẨN CẤP: Tai nạn tại Đèo Ngang! Toàn đội mau chóng tập kết tại Trạm chỉ huy (RESCUE_STAGING). +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_READY_CHECK': {
        if (!checkNear('RESCUE_STAGING')) return { actionId, success: false, reason: 'Cần tập kết tại Trạm chỉ huy (RESCUE_STAGING).' };
        if (dg.status !== 'GATHERING') return { actionId, success: false, reason: 'Chưa trong trạng thái tập kết.' };
        if (!dg.readyPlayers.includes(player.id)) {
          dg.readyPlayers.push(player.id);
          this.ports.team.audit('PLAYER', `${player.name} đã sẵn sàng ứng cứu tại trạm chỉ huy!`, player.id);
        }
        const onlineCount = this.ports.team.onlineCount();
        const minRequired = onlineCount <= 1 ? 1 : Math.min(onlineCount, 4);
        if (dg.readyPlayers.length >= minRequired) {
          dg.status = 'COUNTDOWN';
          dg.countdownRemaining = 3;
          dg.timeOfDay = 'afternoon';
          dg.score += 2;
          this.ports.team.audit('MISSION', `Tất cả vị trí đã sẵn sàng (${dg.readyPlayers.length} người)! Bắt đầu đếm ngược cứu hộ 3 giây... +2 điểm.`);
        }
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_CANCEL_READY': {
        if (dg.status !== 'GATHERING') return { actionId, success: true };
        dg.readyPlayers = dg.readyPlayers.filter(id => id !== player.id);
        this.ports.team.audit('PLAYER', `${player.name} đã hủy trạng thái sẵn sàng.`, player.id);
        return { actionId, success: true };
      }

      case 'DG_SUMMON_TEAM': {
        this.ports.team.audit('PLAYER', `HIỆU LỆNH TẬP HỢP: ${player.name} yêu cầu tất cả đồng đội khẩn trương về Trạm chỉ huy Đèo Ngang!`, player.id);
        return { actionId, success: true };
      }

      case 'DG_SET_BARRIER_A': {
        if (!checkNear('RESCUE_TRAFFIC_A')) return { actionId, success: false, reason: 'Cần đến chốt phía Bắc đèo (Traffic A).' };
        if (dg.status !== 'ACTIVE') return { actionId, success: false, reason: 'Chiến dịch cứu hộ chưa bắt đầu.' };
        if (dg.barrierA) return { actionId, success: true };
        dg.barrierA = true;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} thiết lập chốt chặn an toàn phía Bắc đèo (Traffic A). +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_SET_BARRIER_B': {
        if (!checkNear('RESCUE_TRAFFIC_B')) return { actionId, success: false, reason: 'Cần đến chốt phía Nam đèo (Traffic B).' };
        if (dg.status !== 'ACTIVE') return { actionId, success: false, reason: 'Chiến dịch cứu hộ chưa bắt đầu.' };
        if (dg.barrierB) return { actionId, success: true };
        dg.barrierB = true;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} thiết lập chốt chặn an toàn phía Nam đèo (Traffic B). +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_TURN_ROAD_LIGHT': {
        if (!checkNear('RESCUE_TECH')) return { actionId, success: false, reason: 'Cần đến khu vực kỹ thuật thiết bị.' };
        if (dg.status !== 'ACTIVE') return { actionId, success: false, reason: 'Chiến dịch cứu hộ chưa bắt đầu.' };
        if (dg.roadLight) return { actionId, success: true };
        dg.roadLight = true;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} bật đèn pha dải rộng chiếu sáng toàn tuyến đường đèo. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_TURN_RAVINE_LIGHT': {
        if (!checkNear('RESCUE_TECH')) return { actionId, success: false, reason: 'Cần đến khu vực kỹ thuật thiết bị.' };
        if (!dg.roadLight) return { actionId, success: false, reason: 'Cần bật đèn mặt đường trước.' };
        if (dg.ravineLight) return { actionId, success: true };
        dg.ravineLight = true;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} điều chỉnh đèn pha công suất cao rọi thẳng xuống lòng vực. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_SET_ANCHOR': {
        if (!checkNear('RESCUE_TECH')) return { actionId, success: false, reason: 'Cần đến khu vực mỏm neo kỹ thuật.' };
        if (dg.status !== 'ACTIVE') return { actionId, success: false, reason: 'Chiến dịch cứu hộ chưa bắt đầu.' };
        if (dg.anchorReady) return { actionId, success: true };
        dg.anchorReady = true;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} đóng điểm neo chịu lực an toàn tại mỏm đá kỹ thuật. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_SET_ROPE': {
        if (!checkNear('RESCUE_TECH')) return { actionId, success: false, reason: 'Cần đến khu vực mỏm neo kỹ thuật.' };
        if (!dg.anchorReady) return { actionId, success: false, reason: 'Cần chuẩn bị điểm neo trước.' };
        if (dg.ropeReady) return { actionId, success: true };
        dg.ropeReady = true;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} thả dây cứu nạn chuyên dụng kết nối điểm neo xuống vực. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_CHECK_WINCH': {
        if (!checkNear('RESCUE_WINCH')) return { actionId, success: false, reason: 'Cần đến vị trí tời cứu hộ (Winch).' };
        if (dg.status !== 'ACTIVE') return { actionId, success: false, reason: 'Chiến dịch cứu hộ chưa bắt đầu.' };
        if (dg.winchReady) return { actionId, success: true };
        dg.winchReady = true;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} kiểm tra tải trọng và bộ hãm tời cơ khí (Winch). +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_DESCEND_RESCUER': {
        if (!checkNear('RESCUE_WINCH') && !checkNear('RESCUE_TECH')) return { actionId, success: false, reason: 'Cần đến vị trí đu dây cứu hộ.' };
        const safeReady = dg.barrierA && dg.barrierB && dg.roadLight && dg.ravineLight && dg.anchorReady && dg.ropeReady && dg.winchReady;
        if (!safeReady) {
          return { actionId, success: false, reason: 'Chưa đủ an toàn: Cần chốt chặn 2 đầu, bật đèn, neo cáp và tời sẵn sàng trước khi xuống vực!' };
        }
        if (dg.rescuerDown) return { actionId, success: true };
        dg.rescuerDown = true;
        dg.rescuerPlayerId = player.id;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} đu dây tiếp cận hiện trường đáy vực an toàn! +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_COMFORT_NAM': {
        if (!checkNear('RESCUE_NAM')) return { actionId, success: false, reason: 'Cần tiếp cận vị trí nạn nhân Nam dưới lòng vực.' };
        if (!dg.rescuerDown) return { actionId, success: false, reason: 'Cứu nạn viên chưa xuống tới hiện trường.' };
        if (dg.namComforted) return { actionId, success: true };
        dg.namComforted = true;
        dg.score += 2;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} trấn an tinh thần và đánh giá tri giác nạn nhân Nam. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_SECURE_BIKE': {
        if (!checkNear('RESCUE_NAM')) return { actionId, success: false, reason: 'Cần tiếp cận vị trí xe máy dưới lòng vực.' };
        if (!dg.rescuerDown) return { actionId, success: false, reason: 'Cứu nạn viên chưa xuống tới hiện trường.' };
        if (dg.bikeHazardSecured) return { actionId, success: true };
        dg.bikeHazardSecured = true;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} đã ngắt khóa điện và khóa van xăng xe máy, loại trừ nguy cơ cháy nổ. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_FIRST_AID': {
        if (!checkNear('RESCUE_NAM')) return { actionId, success: false, reason: 'Cần ở cạnh nạn nhân Nam.' };
        if (!dg.namComforted) return { actionId, success: false, reason: 'Cần trấn an và kiểm tra tri giác nạn nhân trước.' };
        if (dg.firstAidGiven) return { actionId, success: true };
        dg.firstAidGiven = true;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('SERVICE', `${player.name} sơ cứu, sát khuẩn và băng ép vết thương hở cho Nam. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_SPLINT_NAM': {
        if (!checkNear('RESCUE_NAM')) return { actionId, success: false, reason: 'Cần ở cạnh nạn nhân Nam.' };
        if (!dg.firstAidGiven) return { actionId, success: false, reason: 'Cần sơ cứu vết thương trước.' };
        if (dg.namSplinted) return { actionId, success: true };
        dg.namSplinted = true;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('SERVICE', `${player.name} cố định nẹp xương đùi và mặc đai cứu hộ an toàn cho Nam. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_SIGNAL_READY_WINCH': {
        if (!checkNear('RESCUE_NAM')) return { actionId, success: false, reason: 'Cần ở vị trí cứu nạn dưới vực để phát tín hiệu.' };
        if (!dg.namSplinted || !dg.bikeHazardSecured) {
          return { actionId, success: false, reason: 'Cần cố định nẹp đùi và xử lý nguy cơ xăng xe an toàn trước khi kéo tời.' };
        }
        if (dg.readyToWinch) return { actionId, success: true };
        dg.readyToWinch = true;
        dg.winchSignal = 'PULL';
        dg.score += 1;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} phát tín hiệu: Nạn nhân đã nẹp cố định an toàn, sẵn sàng kéo tời! +1 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_PREP_RECEPTION': {
        if (!checkNear('RESCUE_MEDICAL')) return { actionId, success: false, reason: 'Cần đến trạm y tế đón tiếp (Medical).' };
        if (dg.status !== 'ACTIVE') return { actionId, success: false, reason: 'Chiến dịch chưa bắt đầu.' };
        if (dg.receptionReady) return { actionId, success: true };
        dg.receptionReady = true;
        dg.score += 2;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('SERVICE', `${player.name} chuẩn bị cáng cứu thương và trang thiết bị hồi sức tại điểm y tế. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_OPERATE_WINCH': {
        if (!checkNear('RESCUE_WINCH')) return { actionId, success: false, reason: 'Cần đứng tại máy tời (Winch).' };
        if (!dg.readyToWinch) {
          return { actionId, success: false, reason: 'Chưa có tín hiệu sẵn sàng từ dưới vực (cần nẹp đùi và xử lý nguy cơ xăng xe).' };
        }
        if (dg.namLifted) return { actionId, success: true };
        dg.winchProgress = Math.min(100, dg.winchProgress + 50);
        if (dg.winchProgress >= 100) {
          dg.namLifted = true;
          dg.score += 2;
          if (contrib) contrib.deployments++;
          this.ports.team.audit('MISSION', `${player.name} đã vận hành tời kéo cáng đưa Nam lên mặt đường đèo an toàn! +2 điểm.`, player.id);
        } else {
          this.ports.team.audit('MISSION', `${player.name} vận hành tời cứu hộ: Tiến độ nâng cáng đạt ${dg.winchProgress}%.`, player.id);
        }
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_HANDOVER_MEDICAL': {
        if (!checkNear('RESCUE_MEDICAL')) return { actionId, success: false, reason: 'Cần ở trạm y tế tiếp nhận (Medical).' };
        if (!dg.namLifted || !dg.receptionReady) {
          return { actionId, success: false, reason: 'Cần đưa Nam lên đỉnh đèo và chuẩn bị điểm đón tiếp y tế.' };
        }
        if (dg.medicalReceived) return { actionId, success: true };
        dg.medicalReceived = true;
        dg.score += 2;
        if (contrib) contrib.audits++;
        this.ports.team.audit('SERVICE', `${player.name} bàn giao Nam cho đội ngũ y tế, chuyển lên xe cứu thương cấp cứu kịp thời. +2 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_RECOVER_RESCUER': {
        if (!checkNear('RESCUE_WINCH')) return { actionId, success: false, reason: 'Cần ở vị trí máy tời.' };
        if (!dg.medicalReceived) return { actionId, success: false, reason: 'Cần bàn giao nạn nhân an toàn cho y tế trước.' };
        if (dg.rescuerSafe) return { actionId, success: true };
        dg.rescuerSafe = true;
        dg.score += 1;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} hỗ trợ kéo cứu nạn viên và thu hồi dây cáp an toàn. +1 điểm.`, player.id);
        if (dg.rescuerSafe && dg.bikeRecovered) {
          dg.status = 'RESOLVED';
          this.state.currentQuest = 3;
          this.ports.team.audit('MISSION', `HOÀN THÀNH XUẤT SẮC CHIẾN DỊCH CỨU HỘ ĐÈO NGANG!`);
        }
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DG_RECOVER_BIKE': {
        if (!checkNear('RESCUE_WINCH')) return { actionId, success: false, reason: 'Cần ở vị trí máy tời.' };
        if (!dg.medicalReceived) return { actionId, success: false, reason: 'Cần bàn giao nạn nhân an toàn cho y tế trước.' };
        if (dg.bikeRecovered) return { actionId, success: true };
        dg.bikeRecovered = true;
        dg.score += 1;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} trục vớt xe máy khỏi lòng vực, hoàn tất dọn dẹp hiện trường. +1 điểm.`, player.id);
        if (dg.rescuerSafe && dg.bikeRecovered) {
          dg.status = 'RESOLVED';
          this.state.currentQuest = 3;
          this.ports.team.audit('MISSION', `HOÀN THÀNH XUẤT SẮC CHIẾN DỊCH CỨU HỘ ĐÈO NGANG!`);
        }
        this.normalizeScores();
        return { actionId, success: true };
      }

      // ===== QUEST 3: ĐỒNG LỘC =====
      case 'DL_BRIEF_TUNG': {
        if (!checkNear('DONG_LOC_TUNG')) return { actionId, success: false, reason: 'Cần đến gặp Bác Tùng tại Ban Quản lý di tích.' };
        if (dl.tungBriefed) return { actionId, success: true };
        dl.status = 'ACTIVE';
        dl.tungBriefed = true;
        dl.score += 3;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} gặp Bác Tùng tiếp nhận nhiệm vụ: Giữ gìn trật tự, văn minh tại Khu di tích Ngã ba Đồng Lộc. +3 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DL_VERIFY_SAU': {
        if (!checkNear('DONG_LOC_SAU')) return { actionId, success: false, reason: 'Cần đến vị trí Mụ Sáu.' };
        if (!dl.tungBriefed) return { actionId, success: false, reason: 'Cần gặp Bác Tùng tiếp nhận nhiệm vụ trước.' };
        if (dl.sauVerified) return { actionId, success: true };
        dl.sauVerified = true;
        dl.score += 4;
        if (contrib) contrib.audits++;
        this.ports.team.audit('AUDIT', `${player.name} tuyên truyền, nhắc nhở và thu giữ các ấn phẩm bói toán, mê tín dị đoan của Mụ Sáu. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DL_VERIFY_TEO': {
        if (!checkNear('DONG_LOC_TEO')) return { actionId, success: false, reason: 'Cần đến vị trí Tèo.' };
        if (!dl.tungBriefed) return { actionId, success: false, reason: 'Cần gặp Bác Tùng tiếp nhận nhiệm vụ trước.' };
        if (dl.teoVerified) return { actionId, success: true };
        dl.teoVerified = true;
        dl.score += 4;
        if (contrib) contrib.audits++;
        this.ports.team.audit('AUDIT', `${player.name} lập biên bản xử lý hành vi đổi tiền lẻ hưởng chênh lệch 30% trái phép của Tèo. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DL_FILE_DOSSIER': {
        if (!checkNear('DONG_LOC_TUNG')) return { actionId, success: false, reason: 'Cần đến gặp Bác Tùng để bàn giao tang vật.' };
        if (!dl.sauVerified || !dl.teoVerified) {
          return { actionId, success: false, reason: 'Cần xử lý xong cả 2 trường hợp Mụ Sáu và Tèo trước.' };
        }
        if (dl.dossierFiled) return { actionId, success: true };
        dl.dossierFiled = true;
        dl.score += 4;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('PLAN', `${player.name} bàn giao tang vật vi phạm văn hóa cho Ban Quản lý lập hồ sơ xử lý. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DL_ORGANIZE_FLOW': {
        if (!checkNear('DONG_LOC_FLOW')) return { actionId, success: false, reason: 'Cần đến khu vực phân luồng du khách.' };
        if (!dl.tungBriefed) return { actionId, success: false, reason: 'Cần gặp Bác Tùng tiếp nhận nhiệm vụ trước.' };
        if (dl.flowOrganized) return { actionId, success: true };
        dl.flowOrganized = true;
        dl.score += 4;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('MISSION', `${player.name} phân luồng lối đi một chiều cho các đoàn khách viếng, chấm dứt chen lấn xô đẩy. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DL_ASSIST_HAI': {
        if (!checkNear('DONG_LOC_HAI')) return { actionId, success: false, reason: 'Cần đến gặp Bác Hải tại khu đón tiếp.' };
        if (!dl.tungBriefed) return { actionId, success: false, reason: 'Cần gặp Bác Tùng tiếp nhận nhiệm vụ trước.' };
        if (dl.haiAssisted) return { actionId, success: true };
        dl.haiAssisted = true;
        dl.score += 4;
        if (contrib) contrib.surveys++;
        this.ports.team.audit('SERVICE', `${player.name} đón tiếp và hỗ trợ đoàn cựu chiến binh của Bác Hải dâng hương tưởng niệm. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DL_SUPPLY_INCENSE': {
        if (!checkNear('DONG_LOC_ALTAR')) return { actionId, success: false, reason: 'Cần đến khu vực bàn dâng hương tưởng niệm.' };
        if (!dl.tungBriefed) return { actionId, success: false, reason: 'Cần gặp Bác Tùng tiếp nhận nhiệm vụ trước.' };
        if (dl.incenseSupplied) return { actionId, success: true };
        dl.incenseSupplied = true;
        dl.score += 4;
        if (contrib) contrib.deployments++;
        this.ports.team.audit('SERVICE', `${player.name} cấp phát hương hoa miễn phí và hướng dẫn du khách thắp một nén tâm hương. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DL_CORRECT_TIKTOKER': {
        if (!checkNear('DONG_LOC_TIKTOKER')) return { actionId, success: false, reason: 'Cần đến vị trí TikToker đang phát sóng.' };
        if (!dl.tungBriefed) return { actionId, success: false, reason: 'Cần gặp Bác Tùng tiếp nhận nhiệm vụ trước.' };
        if (dl.tiktokerCorrected) return { actionId, success: true };
        dl.tiktokerCorrected = true;
        dl.score += 4;
        if (contrib) contrib.audits++;
        this.ports.team.audit('AUDIT', `${player.name} chấn chỉnh hành vi quay phim thiếu tôn nghiêm, giải thích đúng lịch sử 10 Nữ liệt sĩ cho TikToker. +4 điểm.`, player.id);
        this.normalizeScores();
        return { actionId, success: true };
      }

      case 'DL_COMPLETE_MISSION': {
        if (!checkNear('DONG_LOC_TUNG')) return { actionId, success: false, reason: 'Cần đến báo cáo Bác Tùng.' };
        const allBranchesDone = dl.dossierFiled && dl.flowOrganized && dl.haiAssisted && dl.incenseSupplied && dl.tiktokerCorrected;
        if (!allBranchesDone) {
          return { actionId, success: false, reason: 'Chưa hoàn thành đủ 3 nhánh công việc tại Ngã ba Đồng Lộc.' };
        }
        if (dl.status === 'RESOLVED') return { actionId, success: true };
        dl.status = 'RESOLVED';
        dl.score += 4;
        if (contrib) contrib.plansProposed++;
        this.ports.team.audit('MISSION', `HOÀN THÀNH XUẤT SẮC TOÀN BỘ NHIỆM VỤ TẠI HÀ TĨNH! Tổng kết thành tích và trao thưởng. +4 điểm.`, player.id);
        this.normalizeScores();
        this.ports.lifecycle.end('Hoàn thành xuất sắc nhiệm vụ tại Hà Tĩnh');
        return { actionId, success: true };
      }

      default:
        return { actionId, success: false, reason: `Hành động ${action} không xác định.` };
    }
  }
}
