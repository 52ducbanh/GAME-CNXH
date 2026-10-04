import { getInteractionActions, INTERACTION_RADIUS, JOB_DURATION, PLAN_COSTS, SCORES } from 'shared';
import type { ActiveJob, Player, JobType, ServerAck, M1Plan, M2Plan, ClientIntent, CollisionState } from 'shared';
import type { ProvinceRuntime, GameplayProjection } from '../../core/contracts.js';
import type { GameplayPorts } from '../../core/ports.js';
import { createPublicServiceState } from './state.js';
const distance=(x1:number,y1:number,x2:number,y2:number)=>Math.hypot(x2-x1,y2-y1);

export class PublicServiceRuntime implements ProvinceRuntime {
  public state = createPublicServiceState();
  constructor(protected readonly ports: GameplayPorts) {}
  start(){this.state.medicalService.status='ACTIVE';this.ports.team.audit('MISSION','TRẬN ĐẤU CHÍNH THỨC BẮT ĐẦU! Nhiệm vụ 1: Mở dịch vụ y tế cho nhân dân.');}
  reset(){this.state=createPublicServiceState();}
  tick(_dtMs:number){}
  projection():GameplayProjection{return {citizens:this.state.citizens,m1:this.state.medicalService,m2:this.state.bridgeResponse,m3:this.state.citizenRights};}
  totalScore(){return this.state.medicalService.score+this.state.bridgeResponse.score+this.state.citizenRights.score;}
  worldState():CollisionState{return {bridgeBlocked:this.state.bridgeResponse.bridgeBroken&&!this.state.bridgeResponse.bridgeRepaired,fixedDeployed:this.state.medicalService.fixedDeployed,mobileBDeployed:this.state.medicalService.mobileBDeployed,mobileCDeployed:this.state.medicalService.mobileCDeployed};}
  dispatch(player:Player,intent:ClientIntent):ServerAck {
    const {actionId,payload}=intent;
    switch(intent.type){
      case 'START_JOB':return this.handleStartJob(player,payload,actionId);
      case 'DELIVER_CRATE':return this.handleDeliverCrate(player,payload?.targetId,actionId);
      case 'PROPOSE_PLAN':return this.handleProposePlan(player,payload?.missionId,payload?.plan,actionId);
      case 'PUBLISH_NOTICE':return this.handlePublishNotice(player,payload?.missionId,actionId);
      case 'CONFIRM_M3_PLAN':return this.handleConfirmM3Plan(player,actionId);
      case 'HATINH_ACTION':return {actionId,success:false,reason:'Bản đồ hiện tại không phải Hà Tĩnh.'};
      default:return {actionId,success:false,reason:'Lệnh không xác định.'};
    }
  }
  commitVote(missionId:'M1'|'M2'|null,winningPlan:string){
    // Commit winning plan
    if (missionId === 'M1') {
      const plan = winningPlan as M1Plan;
      const cost = plan === 'FIXED' ? PLAN_COSTS.M1_FIXED.budget : PLAN_COSTS.M1_MOBILE.budget;
      const cratesReq = plan === 'FIXED' ? PLAN_COSTS.M1_FIXED.crates : PLAN_COSTS.M1_MOBILE.crates;

      this.ports.resources.deduct('M1', `Cam kết phương án dịch vụ y tế ${plan}`, cost);
      this.state.medicalService.planCommitted = plan;
      this.state.medicalService.requiredCrates = cratesReq;
      this.state.medicalService.planVersion++;

      this.ports.team.audit('PLAN', `BIỂU QUYẾT THÀNH CÔNG: Chốt phương án ${plan} cho Nhiệm vụ 1. Ngân sách trừ ${cost} đơn vị.`);
    } else if (missionId === 'M2') {
      const plan = winningPlan as M2Plan;
      const cost = plan === 'REPAIR' ? PLAN_COSTS.M2_REPAIR.budget : PLAN_COSTS.M2_DETOUR.budget;

      this.ports.resources.deduct('M2', `Cam kết phương án ứng phó sự cố cầu B: ${plan}`, cost);
      this.state.bridgeResponse.planCommitted = plan;
      this.state.bridgeResponse.planVersion++;

      this.state.bridgeResponse.score += SCORES.M2.COMMIT_PLAN;

      this.ports.team.audit('PLAN', `BIỂU QUYẾT THÀNH CÔNG: Chốt phương án ${plan} cho Nhiệm vụ 2. Ngân sách trừ ${cost} đơn vị. +5 điểm.`);
    }

  }

  public handleStartJob(player: Player, payload: { type: JobType; targetId: string }, actionId: string): ServerAck {
    if (this.ports.read.paused()) {
      return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    }

    if (player.activeJob) {
      return { actionId, success: false, reason: 'Bạn đang thực hiện một công việc khác.' };
    }

    if (!payload || typeof payload.type !== 'string' || typeof payload.targetId !== 'string')
      return { actionId, success: false, reason: 'Hành động hoặc địa điểm không hợp lệ.' };
    const eligible = getInteractionActions(this.ports.read.snapshot(), player.id).some(a =>
      a.intent.type === 'START_JOB' && a.intent.payload.type === payload.type && a.intent.payload.targetId === payload.targetId);
    if (!eligible) return { actionId, success: false, reason: 'Hành động chưa hợp lệ, đã hoàn thành hoặc đang có đồng đội thực hiện.' };
    const helperType = payload.type as string;
    if (helperType === 'SURVEY_BRIDGE') return { ...this.surveyBridgeM2(player), actionId };
    if (helperType === 'RECEIVE_FEEDBACK_C') return { ...this.receiveFeedbackM3(player), actionId };
    if (helperType === 'CROSS_CHECK_CLINIC') return { ...this.crossCheckClinicM3(player, payload.targetId), actionId };

    const { type, targetId } = payload;
    const poi = this.ports.read.map.points[targetId];
    if (!poi) {
      return { actionId, success: false, reason: 'Địa điểm không hợp lệ.' };
    }

    if (distance(player.x, player.y, poi.x, poi.y) > INTERACTION_RADIUS) {
      return { actionId, success: false, reason: `Bạn cần đến gần ${poi.name} (khoảng cách <= 72 đơn vị).` };
    }

    let durationMs = 4000;
    let requiresManpower = false;

    // Validate preconditions per job type
    if (type === 'PRACTICE_SAMPLE_JOB') {
      if (this.ports.read.phase() !== 'PRACTICE') return { actionId, success: false, reason: 'Chỉ thực hiện trong giai đoạn thực hành.' };
      durationMs = JOB_DURATION.PRACTICE_SAMPLE;
    } else if (type === 'SURVEY_ZONE') {
      if (this.ports.read.phase() !== 'RUNNING' || this.state.medicalService.status !== 'ACTIVE') {
        return { actionId, success: false, reason: 'Nhiệm vụ 1 chưa kích hoạt.' };
      }
      if (targetId === 'ZONE_A' && this.state.medicalService.surveys.A) return { actionId, success: false, reason: 'Khu A đã được khảo sát.' };
      if (targetId === 'ZONE_B' && this.state.medicalService.surveys.B) return { actionId, success: false, reason: 'Khu B đã được khảo sát.' };
      if (targetId === 'ZONE_C' && this.state.medicalService.surveys.C) return { actionId, success: false, reason: 'Khu C đã được khảo sát.' };
      durationMs = JOB_DURATION.SURVEY;
    } else if (type === 'DEPLOY_FIXED_CLINIC') {
      if (this.state.medicalService.planCommitted !== 'FIXED') return { actionId, success: false, reason: 'Chưa cam kết phương án Trạm cố định.' };
      if (this.state.medicalService.deliveredCratesFixed < 2) return { actionId, success: false, reason: 'Cần chuyển đủ 2 kiện vật tư trước khi thi công.' };
      if (this.state.medicalService.fixedDeployed) return { actionId, success: false, reason: 'Trạm cố định đã hoàn thành thi công.' };
      if (this.ports.tasks.manpower.busy >= this.ports.tasks.manpower.total) return { actionId, success: false, reason: 'Cả 3 đơn vị công tác đều đang bận thực địa.' };
      requiresManpower = true;
      durationMs = JOB_DURATION.DEPLOY_FIXED;
    } else if (type === 'DEPLOY_MOBILE_CLINIC') {
      if (this.state.medicalService.planCommitted !== 'MOBILE') return { actionId, success: false, reason: 'Chưa cam kết phương án Điểm lưu động.' };
      if (targetId === 'CLINIC_MOBILE_B') {
        if (this.state.medicalService.deliveredCratesMobileB < 2) return { actionId, success: false, reason: 'Cần giao đủ 2 kiện vật tư tại điểm B.' };
        if (this.state.medicalService.mobileBDeployed) return { actionId, success: false, reason: 'Điểm lưu động B đã hoàn tất triển khai.' };
      } else if (targetId === 'CLINIC_MOBILE_C') {
        if (this.state.medicalService.deliveredCratesMobileC < 2) return { actionId, success: false, reason: 'Cần giao đủ 2 kiện vật tư tại điểm C.' };
        if (this.state.medicalService.mobileCDeployed) return { actionId, success: false, reason: 'Điểm lưu động C đã hoàn tất triển khai.' };
      }
      if (this.ports.tasks.manpower.busy >= this.ports.tasks.manpower.total) return { actionId, success: false, reason: 'Cả 3 đơn vị công tác đều đang bận thực địa.' };
      requiresManpower = true;
      durationMs = JOB_DURATION.DEPLOY_MOBILE;
    } else if (type === 'REPAIR_BRIDGE_1') {
      if (this.state.bridgeResponse.status !== 'ACTIVE' || this.state.bridgeResponse.planCommitted !== 'REPAIR') return { actionId, success: false, reason: 'Phương án sửa cầu chưa được cam kết.' };
      if (this.state.bridgeResponse.bridgeCratesDelivered < 2) return { actionId, success: false, reason: 'Cần vận chuyển đủ 2 kiện vật tư sửa cầu trước.' };
      if (this.state.bridgeResponse.bridgeRepairTask1) return { actionId, success: false, reason: 'Mố cầu phía Tây đã được sửa xong.' };
      if (this.ports.tasks.manpower.busy >= this.ports.tasks.manpower.total) return { actionId, success: false, reason: 'Cả 3 đơn vị công tác đều đang bận thực địa.' };
      requiresManpower = true;
      durationMs = JOB_DURATION.REPAIR_BRIDGE;
    } else if (type === 'REPAIR_BRIDGE_2') {
      if (this.state.bridgeResponse.status !== 'ACTIVE' || this.state.bridgeResponse.planCommitted !== 'REPAIR') return { actionId, success: false, reason: 'Phương án sửa cầu chưa được cam kết.' };
      if (this.state.bridgeResponse.bridgeCratesDelivered < 2) return { actionId, success: false, reason: 'Cần vận chuyển đủ 2 kiện vật tư sửa cầu trước.' };
      if (this.state.bridgeResponse.bridgeRepairTask2) return { actionId, success: false, reason: 'Dầm cầu phía Đông đã được sửa xong.' };
      if (this.ports.tasks.manpower.busy >= this.ports.tasks.manpower.total) return { actionId, success: false, reason: 'Cả 3 đơn vị công tác đều đang bận thực địa.' };
      requiresManpower = true;
      durationMs = JOB_DURATION.REPAIR_BRIDGE;
    } else if (type === 'SUPPORT_CITIZEN') {
      if (this.state.citizenRights.status !== 'ACTIVE' || !this.state.citizenRights.planConfirmed) return { actionId, success: false, reason: 'Kế hoạch hỗ trợ M3 chưa được xác nhận.' };
      if (targetId === 'CITIZEN_C1') {
        if (!this.state.citizenRights.deliveredC1) return { actionId, success: false, reason: 'Cần giao 1 kiện vật tư y tế đến Cụ C1 trước.' };
        if (this.state.citizenRights.deployedC1) return { actionId, success: false, reason: 'Cụ C1 đã được cán bộ y tế hỗ trợ hoàn tất.' };
      } else if (targetId === 'CITIZEN_C2') {
        if (!this.state.citizenRights.deliveredC2) return { actionId, success: false, reason: 'Cần giao 1 kiện vật tư y tế đến Cụ C2 trước.' };
        if (this.state.citizenRights.deployedC2) return { actionId, success: false, reason: 'Cụ C2 đã được cán bộ y tế hỗ trợ hoàn tất.' };
      }
      if (this.ports.tasks.manpower.busy >= this.ports.tasks.manpower.total) return { actionId, success: false, reason: 'Cả 3 đơn vị công tác đều đang bận thực địa.' };
      requiresManpower = true;
      durationMs = JOB_DURATION.SUPPORT_CITIZEN;
    } else if (type === 'AUDIT_RESULT') {
      durationMs = JOB_DURATION.AUDIT_RESULT;
    } else if (type === 'AUDIT_LEDGER') {
      if (this.state.citizenRights.status !== 'ACTIVE') return { actionId, success: false, reason: 'Nhiệm vụ 3 chưa kích hoạt.' };
      durationMs = JOB_DURATION.AUDIT_LEDGER;
    }

    return this.ports.tasks.start(player, {type, targetId, durationMs, requiresManpower}, actionId);
  }

  public completeTask(player: Player, job: ActiveJob) {
    const contrib = this.ports.team.contribution(player.id);

    // Job completions
    if (job.type === 'PRACTICE_SAMPLE_JOB') {
      this.ports.practice.complete(player);
      this.ports.team.audit('MISSION', `${player.name} hoàn thành thao tác mẫu thực hành.`, player.id);
    } else if (job.type === 'SURVEY_ZONE') {
      if (job.targetId === 'ZONE_A' && !this.state.medicalService.surveys.A) {
        this.state.medicalService.surveys.A = true;

        this.state.medicalService.score += SCORES.M1.SURVEY_PER_ZONE;
      } else if (job.targetId === 'ZONE_B' && !this.state.medicalService.surveys.B) {
        this.state.medicalService.surveys.B = true;

        this.state.medicalService.score += SCORES.M1.SURVEY_PER_ZONE;
      } else if (job.targetId === 'ZONE_C' && !this.state.medicalService.surveys.C) {
        this.state.medicalService.surveys.C = true;

        this.state.medicalService.score += SCORES.M1.SURVEY_PER_ZONE;
      }
      if (contrib) contrib.surveys++;
      this.ports.team.audit('MISSION', `${player.name} hoàn thành khảo sát nhu cầu tại ${this.ports.read.map.points[job.targetId]?.name}.`, player.id);
    } else if (job.type === 'DEPLOY_FIXED_CLINIC') {
      this.state.medicalService.fixedDeployed = true;

      this.state.medicalService.score += SCORES.M1.DEPLOY_TOTAL;
      if (contrib) contrib.deployments++;
      this.ports.lifecycle.recoverWorld(player => `${player.name} được đưa ra khỏi footprint công trình mới.`);
      this.ports.team.audit('MISSION', `${player.name} đã thi công hoàn tất Trạm y tế cố định.`, player.id);
    } else if (job.type === 'DEPLOY_MOBILE_CLINIC') {
      if (job.targetId === 'CLINIC_MOBILE_B') {
        this.state.medicalService.mobileBDeployed = true;

        this.state.medicalService.score += 5;
      } else if (job.targetId === 'CLINIC_MOBILE_C') {
        this.state.medicalService.mobileCDeployed = true;

        this.state.medicalService.score += 5;
      }
      if (contrib) contrib.deployments++;
      this.ports.lifecycle.recoverWorld(player => `${player.name} được đưa ra khỏi footprint công trình mới.`);
      this.ports.team.audit('MISSION', `${player.name} đã triển khai thành công ${this.ports.read.map.points[job.targetId]?.name}.`, player.id);
    } else if (job.type === 'REPAIR_BRIDGE_1') {
      this.state.bridgeResponse.bridgeRepairTask1 = true;
      if (contrib) contrib.deployments++;
      this.ports.team.audit('MISSION', `${player.name} sửa xong mố cầu phía Tây.`, player.id);
      this.checkBridgeStatus();
    } else if (job.type === 'REPAIR_BRIDGE_2') {
      this.state.bridgeResponse.bridgeRepairTask2 = true;
      if (contrib) contrib.deployments++;
      this.ports.team.audit('MISSION', `${player.name} sửa xong dầm cầu phía Đông.`, player.id);
      this.checkBridgeStatus();
    } else if (job.type === 'SUPPORT_CITIZEN') {
      if (job.targetId === 'CITIZEN_C1') {
        this.state.citizenRights.deployedC1 = true;
        const c1 = this.state.citizens.find(c => c.id === 'C1');
        if (c1) { c1.served = true; c1.servedByMission = 'M3'; }

        this.state.citizenRights.score += SCORES.M3.SUPPORT_PER_CITIZEN;
      } else if (job.targetId === 'CITIZEN_C2') {
        this.state.citizenRights.deployedC2 = true;
        const c2 = this.state.citizens.find(c => c.id === 'C2');
        if (c2) { c2.served = true; c2.servedByMission = 'M3'; }

        this.state.citizenRights.score += SCORES.M3.SUPPORT_PER_CITIZEN;
      }
      if (contrib) contrib.deployments++;
      this.ports.team.audit('SERVICE', `${player.name} đã hoàn thành chăm sóc y tế tận nhà cho ${this.ports.read.map.points[job.targetId]?.name}.`, player.id);
    } else if (job.type === 'AUDIT_LEDGER') {
      this.state.citizenRights.lossAuditDone = true;
      this.state.citizenRights.lossAuditConclusion = 'Khớp 100% với thực tế, chưa có căn cứ xác định thất thoát vật tư.';

      this.state.citizenRights.score += SCORES.M3.AUDIT_LEDGER_RUMOR;
      if (contrib) contrib.audits++;
      this.ports.team.audit('RESOURCE', `${player.name} đối chiếu sổ sách Kho vật tư: Kết luận minh bạch, không phát hiện hao hụt.`, player.id);
    } else if (job.type === 'AUDIT_RESULT') {
      if (this.state.medicalService.status === 'ACTIVE') {
        if (this.state.medicalService.planCommitted === 'FIXED') {
          this.state.medicalService.verifiedA = true;
          this.state.medicalService.verifiedB = true;

          this.state.medicalService.score += SCORES.M1.VERIFY_TOTAL;
          this.serveCitizensM1Fixed();
        } else if (this.state.medicalService.planCommitted === 'MOBILE') {
          if (job.targetId === 'CLINIC_MOBILE_B' && !this.state.medicalService.verifiedB) {
            this.state.medicalService.verifiedB = true;

            this.state.medicalService.score += 4;
          } else if (job.targetId === 'CLINIC_MOBILE_C' && !this.state.medicalService.verifiedC) {
            this.state.medicalService.verifiedC = true;

            this.state.medicalService.score += 4;
          }
          if (this.state.medicalService.verifiedB && this.state.medicalService.verifiedC) {
            this.serveCitizensM1Mobile();
          }
        }
      } else if (this.state.bridgeResponse.status === 'ACTIVE') {
        if (!this.state.bridgeResponse.verifiedB) {
          this.state.bridgeResponse.verifiedB = true;

          this.state.bridgeResponse.score += SCORES.M2.VERIFY_DELIVERY;
        }
      }
      if (contrib) contrib.audits++;
      this.ports.team.audit('MISSION', `${player.name} hoàn thành kiểm tra kết quả tại ${this.ports.read.map.points[job.targetId]?.name}.`, player.id);
    }
  }

  private checkBridgeStatus() {
    if (this.state.bridgeResponse.bridgeRepairTask1 && this.state.bridgeResponse.bridgeRepairTask2) {
      this.state.bridgeResponse.bridgeRepaired = true;
      this.ports.team.audit('MISSION', 'CẦU QUA KÊNH ĐÃ ĐƯỢC KHÔI PHỤC HOÀN TOÀN! Tuyến đường ngắn sang Khu B đã thông suốt.');
    }
  }

  private serveCitizensM1Fixed() {
    // A12, B10, C0
    for (const c of this.state.citizens) {
      if (c.zone === 'A' || c.zone === 'B') {
        c.served = true;
        c.servedByMission = 'M1';
      }
    }
    this.ports.team.audit('SERVICE', 'Trạm cố định đã phục vụ 22 công dân (12 dân Khu A và 10 dân Khu B). Khu C chưa tiếp cận được.');
  }

  private serveCitizensM1Mobile() {
    // A10, B8, C6 (excluding C1 & C2)
    let aCount = 0;
    let bCount = 0;
    let cCount = 0;
    for (const c of this.state.citizens) {
      if (c.zone === 'A' && aCount < 10) {
        c.served = true;
        c.servedByMission = 'M1';
        aCount++;
      } else if (c.zone === 'B' && bCount < 8) {
        c.served = true;
        c.servedByMission = 'M1';
        bCount++;
      } else if (c.zone === 'C' && !c.isSpecialNeeds && cCount < 6) {
        c.served = true;
        c.servedByMission = 'M1';
        cCount++;
      }
    }
    this.ports.team.audit('SERVICE', 'Điểm lưu động đã phục vụ 24 công dân (10 dân A, 8 dân B, 6 dân C). Hai công dân đặc biệt C1, C2 cần hỗ trợ riêng.');
  }

  public handleDeliverCrate(player: Player, targetId: string, actionId: string): ServerAck {
    if (this.ports.read.paused()) return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    if (!player.carriedCrateId) return { actionId, success: false, reason: 'Bạn không mang kiện vật tư nào để giao.' };

    const poi = this.ports.read.map.points[targetId];
    if (!poi) return { actionId, success: false, reason: 'Điểm giao không hợp lệ.' };
    if (distance(player.x, player.y, poi.x, poi.y) > INTERACTION_RADIUS) {
      return { actionId, success: false, reason: `Bạn cần đến gần ${poi.name} để giao kiện.` };
    }

    const crate = this.ports.items.get(player.carriedCrateId);
    if (!crate) return { actionId, success: false, reason: 'Kiện vật tư không tồn tại.' };

    const contrib = this.ports.team.contribution(player.id);

    // Practice deliver
    if (this.ports.read.phase() === 'PRACTICE' && targetId === 'PRACTICE_TARGET') {
      crate.state = 'DELIVERED';
      crate.carriedByPlayerId = null;
      player.carriedCrateId = null;
      this.ports.practice.deliver(player);
      this.ports.team.audit('MISSION', `${player.name} đã giao thành công kiện mẫu trong thực hành.`, player.id);
      return { actionId, success: true };
    }

    // M1 Deliveries
    if (this.state.medicalService.status === 'ACTIVE') {
      if (this.state.medicalService.planCommitted === 'FIXED' && targetId === 'CLINIC_FIXED') {
        if (this.state.medicalService.deliveredCratesFixed >= 2) return { actionId, success: false, reason: 'Trạm cố định đã nhận đủ 2 kiện vật tư.' };
        this.state.medicalService.deliveredCratesFixed++;
        crate.state = 'DELIVERED';
        crate.carriedByPlayerId = null;
        player.carriedCrateId = null;
        if (contrib) contrib.deliveries++;
        this.ports.team.audit('RESOURCE', `${player.name} đã giao kiện cho Trạm cố định (${this.state.medicalService.deliveredCratesFixed}/2 kiện).`, player.id);
        return { actionId, success: true };
      } else if (this.state.medicalService.planCommitted === 'MOBILE') {
        if (targetId === 'CLINIC_MOBILE_B') {
          if (this.state.medicalService.deliveredCratesMobileB >= 2) return { actionId, success: false, reason: 'Điểm B đã nhận đủ 2 kiện.' };
          this.state.medicalService.deliveredCratesMobileB++;
          crate.state = 'DELIVERED';
          crate.carriedByPlayerId = null;
          player.carriedCrateId = null;
          if (contrib) contrib.deliveries++;
          this.ports.team.audit('RESOURCE', `${player.name} đã giao kiện cho Điểm B (${this.state.medicalService.deliveredCratesMobileB}/2 kiện).`, player.id);
          return { actionId, success: true };
        } else if (targetId === 'CLINIC_MOBILE_C') {
          if (this.state.medicalService.deliveredCratesMobileC >= 2) return { actionId, success: false, reason: 'Điểm C đã nhận đủ 2 kiện.' };
          this.state.medicalService.deliveredCratesMobileC++;
          crate.state = 'DELIVERED';
          crate.carriedByPlayerId = null;
          player.carriedCrateId = null;
          if (contrib) contrib.deliveries++;
          this.ports.team.audit('RESOURCE', `${player.name} đã giao kiện cho Điểm C (${this.state.medicalService.deliveredCratesMobileC}/2 kiện).`, player.id);
          return { actionId, success: true };
        }
      }
    }

    // M2 Deliveries
    if (this.state.bridgeResponse.status === 'ACTIVE') {
      if (this.state.bridgeResponse.planCommitted === 'REPAIR' && targetId === 'BRIDGE') {
        if (this.state.bridgeResponse.bridgeCratesDelivered >= 2) return { actionId, success: false, reason: 'Cầu đã nhận đủ 2 kiện vật tư sửa chữa.' };
        this.state.bridgeResponse.bridgeCratesDelivered++;
        crate.state = 'DELIVERED';
        crate.carriedByPlayerId = null;
        player.carriedCrateId = null;
        if (contrib) contrib.deliveries++;
        this.ports.team.audit('RESOURCE', `${player.name} đã giao kiện sửa cầu (${this.state.bridgeResponse.bridgeCratesDelivered}/2 kiện).`, player.id);
        return { actionId, success: true };
      } else if (targetId === 'ZONE_B') {
        if (this.state.bridgeResponse.reliefCratesDeliveredB >= 2) return { actionId, success: false, reason: 'Khu B đã nhận đủ 2 kiện cứu trợ khẩn cấp.' };
        this.state.bridgeResponse.reliefCratesDeliveredB++;

        this.state.bridgeResponse.score += SCORES.M2.DELIVER_RELIEF_PER_CRATE;
        crate.state = 'DELIVERED';
        crate.carriedByPlayerId = null;
        player.carriedCrateId = null;
        if (contrib) contrib.deliveries++;
        this.ports.team.audit('RESOURCE', `${player.name} đã giao kiện cứu trợ khẩn cấp đến Khu B (${this.state.bridgeResponse.reliefCratesDeliveredB}/2 kiện). +8 điểm.`, player.id);
        return { actionId, success: true };
      }
    }

    // M3 Deliveries
    if (this.state.citizenRights.status === 'ACTIVE' && this.state.citizenRights.planConfirmed) {
      if (targetId === 'CITIZEN_C1') {
        if (this.state.citizenRights.deliveredC1) return { actionId, success: false, reason: 'Cụ C1 đã nhận được kiện vật tư y tế.' };
        this.state.citizenRights.deliveredC1 = true;
        crate.state = 'DELIVERED';
        crate.carriedByPlayerId = null;
        player.carriedCrateId = null;
        if (contrib) contrib.deliveries++;
        this.ports.team.audit('SERVICE', `${player.name} đã giao tận tay kiện vật tư y tế đến Cụ C1.`, player.id);
        return { actionId, success: true };
      } else if (targetId === 'CITIZEN_C2') {
        if (this.state.citizenRights.deliveredC2) return { actionId, success: false, reason: 'Cụ C2 đã nhận được kiện vật tư y tế.' };
        this.state.citizenRights.deliveredC2 = true;
        crate.state = 'DELIVERED';
        crate.carriedByPlayerId = null;
        player.carriedCrateId = null;
        if (contrib) contrib.deliveries++;
        this.ports.team.audit('SERVICE', `${player.name} đã giao tận tay kiện vật tư y tế đến Cụ C2.`, player.id);
        return { actionId, success: true };
      }
    }

    return { actionId, success: false, reason: 'Điểm giao hiện tại không yêu cầu vật tư hoặc điều kiện chưa thỏa.' };
  }

  public handleProposePlan(player: Player, missionId: 'M1' | 'M2', plan: string, actionId: string): ServerAck {
    if (this.ports.read.paused()) return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    const hq = this.ports.read.map.points.HEADQUARTERS;
    if (distance(player.x, player.y, hq.x, hq.y) > INTERACTION_RADIUS) {
      return { actionId, success: false, reason: 'Cần đến Trụ sở chính quyền để đề xuất kế hoạch.' };
    }

    if (this.ports.votes.active()) {
      return { actionId, success: false, reason: 'Đang có một cuộc biểu quyết đang diễn ra.' };
    }

    if (missionId === 'M1') {
      if (this.state.medicalService.status !== 'ACTIVE') return { actionId, success: false, reason: 'Nhiệm vụ 1 chưa kích hoạt.' };
      if (!this.state.medicalService.surveys.A || !this.state.medicalService.surveys.B || !this.state.medicalService.surveys.C) {
        return { actionId, success: false, reason: 'Cần thu thập đủ 3 hồ sơ khảo sát A, B, C trước khi lập kế hoạch.' };
      }
      if (this.state.medicalService.planCommitted !== 'NONE') {
        return { actionId, success: false, reason: 'Phương án M1 đã được cam kết, không thể thay đổi.' };
      }

      const cost = plan === 'FIXED' ? PLAN_COSTS.M1_FIXED.budget : PLAN_COSTS.M1_MOBILE.budget;
      if (this.ports.resources.ledger.currentBudget < cost) {
        return { actionId, success: false, reason: `Không đủ ngân sách (cần ${cost} đơn vị).` };
      }

      this.ports.votes.start('M1', plan, player);
      return { actionId, success: true };
    } else if (missionId === 'M2') {
      if (this.state.bridgeResponse.status !== 'ACTIVE') return { actionId, success: false, reason: 'Nhiệm vụ 2 chưa kích hoạt.' };
      if (!this.state.bridgeResponse.surveyDone) return { actionId, success: false, reason: 'Cần ghi nhận hồ sơ sự cố cầu hỏng trước.' };
      if (this.state.bridgeResponse.planCommitted !== 'NONE') {
        return { actionId, success: false, reason: 'Phương án M2 đã được cam kết.' };
      }

      const cost = plan === 'REPAIR' ? PLAN_COSTS.M2_REPAIR.budget : PLAN_COSTS.M2_DETOUR.budget;
      if (this.ports.resources.ledger.currentBudget < cost) {
        return { actionId, success: false, reason: `Không đủ ngân sách (cần ${cost} đơn vị).` };
      }

      this.ports.votes.start('M2', plan, player);
      return { actionId, success: true };
    }

    return { actionId, success: false, reason: 'Nhiệm vụ không hợp lệ.' };
  }

  public handleConfirmM3Plan(player: Player, actionId: string): ServerAck {
    if (this.ports.read.paused()) return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    const hq = this.ports.read.map.points.HEADQUARTERS;
    if (distance(player.x, player.y, hq.x, hq.y) > INTERACTION_RADIUS) {
      return { actionId, success: false, reason: 'Cần đến Trụ sở để xác nhận kế hoạch hỗ trợ.' };
    }

    if (this.state.citizenRights.status !== 'ACTIVE') return { actionId, success: false, reason: 'Nhiệm vụ 3 chưa kích hoạt.' };
    if (!this.state.citizenRights.receivedFeedbackC) return { actionId, success: false, reason: 'Cần đến Khu C gặp đại diện tiếp nhận phản ánh trước.' };
    if (!this.state.citizenRights.crossCheckedList) return { actionId, success: false, reason: 'Cần đối chiếu danh sách tại Trạm/Điểm y tế trước.' };
    if (this.state.citizenRights.planConfirmed) return { actionId, success: false, reason: 'Phương án hỗ trợ đã được xác nhận trước đó.' };

    const cost = PLAN_COSTS.M3_CONFIRM.budget;
    if (this.ports.resources.ledger.currentBudget < cost) {
      return { actionId, success: false, reason: `Không đủ ngân sách (cần ${cost} đơn vị).` };
    }

    this.ports.resources.deduct('M3', 'Chi phí hỗ trợ y tế tận nhà cho hai công dân cao tuổi C1 và C2', cost);
    this.state.citizenRights.planConfirmed = true;

    this.ports.team.audit('PLAN', `${player.name} xác nhận phương án hỗ trợ tận nơi cho C1 và C2 theo quy tắc căn cứ thực tế. Ngân sách trừ ${cost} đơn vị.`, player.id);
    return { actionId, success: true };
  }

  public handlePublishNotice(player: Player, missionId: 'M1' | 'M2' | 'M3', actionId: string): ServerAck {
    if (this.ports.read.paused()) return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    const board = this.ports.read.map.points.NOTICE_BOARD;
    if (distance(player.x, player.y, board.x, board.y) > INTERACTION_RADIUS) {
      return { actionId, success: false, reason: 'Cần đến Bảng công khai kết quả để niêm yết.' };
    }

    const contrib = this.ports.team.contribution(player.id);

    if (missionId === 'M1') {
      if (this.state.medicalService.status !== 'ACTIVE') return { actionId, success: false, reason: 'M1 chưa kích hoạt.' };
      const deployed = this.state.medicalService.planCommitted === 'FIXED' ? this.state.medicalService.fixedDeployed : (this.state.medicalService.mobileBDeployed && this.state.medicalService.mobileCDeployed);
      const verified = this.state.medicalService.planCommitted === 'FIXED' ? this.state.medicalService.verifiedA : (this.state.medicalService.verifiedB && this.state.medicalService.verifiedC);
      if (!deployed || !verified) {
        return { actionId, success: false, reason: 'Cần hoàn tất triển khai và kiểm tra kết quả trước khi công khai.' };
      }
      if (this.state.medicalService.noticePublished) return { actionId, success: false, reason: 'Đã niêm yết kết quả M1.' };

      this.state.medicalService.noticePublished = true;

      this.state.medicalService.score += SCORES.M1.PUBLISH_NOTICE;
      if (contrib) contrib.audits++;
      this.ports.team.audit('AUDIT', `${player.name} đã niêm yết công khai ngân sách & kết quả M1 lên Bảng công khai. +6 điểm.`, player.id);

      // RESOLVE M1, Trigger M2!
      this.resolveM1();
      return { actionId, success: true };
    } else if (missionId === 'M2') {
      if (this.state.bridgeResponse.status !== 'ACTIVE') return { actionId, success: false, reason: 'M2 chưa kích hoạt.' };
      if (this.state.bridgeResponse.planCommitted === 'REPAIR' && !this.state.bridgeResponse.bridgeRepaired) { return { actionId, success: false, reason: 'Ph\u01b0\u01a1ng \u00e1n REPAIR c\u1ea7n ho\u00e0n t\u1ea5t s\u1eeda c\u1ea7u tr\u01b0\u1edbc khi ni\u00eam y\u1ebft.' }; }
      if (this.state.bridgeResponse.reliefCratesDeliveredB < 2 || !this.state.bridgeResponse.verifiedB) {
        return { actionId, success: false, reason: 'Cần giao đủ 2 kiện cứu trợ và kiểm tra kết quả tại B trước.' };
      }
      if (this.state.bridgeResponse.noticePublished) return { actionId, success: false, reason: 'Đã niêm yết kết quả M2.' };

      this.state.bridgeResponse.noticePublished = true;

      this.state.bridgeResponse.score += SCORES.M2.PUBLISH_NOTICE;
      if (contrib) contrib.audits++;
      this.ports.team.audit('AUDIT', `${player.name} đã niêm yết công khai kết quả ứng phó và tuyến đường M2. +5 điểm.`, player.id);

      // RESOLVE M2, Trigger M3!
      this.resolveM2();
      return { actionId, success: true };
    } else if (missionId === 'M3') {
      if (this.state.citizenRights.status !== 'ACTIVE') return { actionId, success: false, reason: 'M3 chưa kích hoạt.' };
      if (!this.state.citizenRights.deployedC1 || !this.state.citizenRights.deployedC2 || !this.state.citizenRights.lossAuditDone) {
        return { actionId, success: false, reason: 'Cần hoàn tất hỗ trợ C1, C2 và đối chiếu sổ sách trước.' };
      }
      if (this.state.citizenRights.noticePublished) return { actionId, success: false, reason: 'Đã niêm yết kết quả M3.' };

      this.state.citizenRights.noticePublished = true;

      this.state.citizenRights.score += SCORES.M3.PUBLISH_NOTICE;
      if (contrib) contrib.audits++;
      this.ports.team.audit('AUDIT', `${player.name} đã niêm yết bản tổng hợp khắc phục M3 (bảo mật thông tin riêng). +6 điểm.`, player.id);

      // RESOLVE M3, Finish Match!
      this.resolveM3();
      return { actionId, success: true };
    }

    return { actionId, success: false, reason: 'Nhiệm vụ không hợp lệ.' };
  }

  private resolveM1() {
    this.state.medicalService.status = 'RESOLVED';
    this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 1! Điểm M1: ${this.state.medicalService.score}/30.`);

    // Trigger M2
    this.state.bridgeResponse.status = 'ACTIVE';
    this.state.bridgeResponse.bridgeBroken = true;
    // A bridge can fail under a player. Recovery belongs to the server;
    // prediction must never try to escape an invalid origin through water.
    this.ports.lifecycle.recoverWorld(player => `${player.name} được đưa về vị trí an toàn khi cầu hỏng.`);
    this.ports.team.audit('MISSION', 'SỰ KIỆN KHẨN CẤP: Cầu qua kênh sang Khu B bị sự cố sụt lún! Tuyến ngắn bị chặn. Bắt đầu Nhiệm vụ 2.');
  }

  private resolveM2() {
    this.state.bridgeResponse.status = 'RESOLVED';
    this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 2! Điểm M2: ${this.state.bridgeResponse.score}/35.`);

    // Trigger M3
    this.state.citizenRights.status = 'ACTIVE';
    this.ports.team.audit('MISSION', 'BẮT ĐẦU NHIỆM VỤ 3: Tiếp nhận phản ánh từ Khu C (Cụ C1, C2 khó khăn tiếp cận) và xác minh thông tin sổ sách kho.');
  }

  private resolveM3() {
    this.state.citizenRights.status = 'RESOLVED';
    this.ports.team.audit('MISSION', `HOÀN THÀNH NHIỆM VỤ 3! Điểm M3: ${this.state.citizenRights.score}/35.`);
    this.ports.lifecycle.end('TẤT CẢ 3 NHIỆM VỤ ĐÃ HOÀN THÀNH XUẤT SẮC!');
  }

  // Quick helper for M2 and M3 field inquiries

  public surveyBridgeM2(player: Player): ServerAck {
    if (this.state.bridgeResponse.status !== 'ACTIVE') return { actionId: 'bridge_survey', success: false, reason: 'M2 chưa kích hoạt.' };
    const bridgePoi = this.ports.read.map.points.BRIDGE;
    if (distance(player.x, player.y, bridgePoi.x, bridgePoi.y) > INTERACTION_RADIUS) {
      return { actionId: 'bridge_survey', success: false, reason: 'Cần đến gần Cầu để khảo sát.' };
    }
    if (this.state.bridgeResponse.surveyDone) return { actionId: 'bridge_survey', success: true };

    this.state.bridgeResponse.surveyDone = true;

    this.state.bridgeResponse.score += SCORES.M2.SURVEY;
    const contrib = this.ports.team.contribution(player.id);
    if (contrib) contrib.surveys++;

    this.ports.team.audit('MISSION', `${player.name} đã khảo sát hiện trường sụt lún cầu. Lập hồ sơ kỹ thuật. +5 điểm.`, player.id);
    return { actionId: 'bridge_survey', success: true };
  }

  public receiveFeedbackM3(player: Player): ServerAck {
    if (this.state.citizenRights.status !== 'ACTIVE') return { actionId: 'm3_feedback', success: false, reason: 'M3 chưa kích hoạt.' };
    const zoneC = this.ports.read.map.points.ZONE_C;
    if (distance(player.x, player.y, zoneC.x, zoneC.y) > INTERACTION_RADIUS) {
      return { actionId: 'm3_feedback', success: false, reason: 'Cần đến Khu C gặp đại diện.' };
    }
    if (this.state.citizenRights.receivedFeedbackC) return { actionId: 'm3_feedback', success: true };

    this.state.citizenRights.receivedFeedbackC = true;

    this.state.citizenRights.score += SCORES.M3.RECEIVE_FEEDBACK;
    const contrib = this.ports.team.contribution(player.id);
    if (contrib) contrib.surveys++;

    this.ports.team.audit('SERVICE', `${player.name} đã tiếp nhận phản ánh chính thức về hoàn cảnh Cụ C1, C2 tại Khu C. +5 điểm.`, player.id);
    return { actionId: 'm3_feedback', success: true };
  }

  public crossCheckClinicM3(player: Player, targetId: string): ServerAck {
    if (this.state.citizenRights.status !== 'ACTIVE') return { actionId: 'm3_cross_check', success: false, reason: 'M3 chưa kích hoạt.' };
    const poi = this.ports.read.map.points[targetId];
    if (!poi) return { actionId: 'm3_cross_check', success: false, reason: 'Địa điểm không hợp lệ.' };
    if (distance(player.x, player.y, poi.x, poi.y) > INTERACTION_RADIUS) {
      return { actionId: 'm3_cross_check', success: false, reason: `Cần đến ${poi.name} để đối chiếu danh sách.` };
    }
    if (this.state.citizenRights.crossCheckedList) return { actionId: 'm3_cross_check', success: true };

    this.state.citizenRights.crossCheckedList = true;

    this.state.citizenRights.score += SCORES.M3.CROSS_CHECK_CLINIC;
    const contrib = this.ports.team.contribution(player.id);
    if (contrib) contrib.audits++;

    this.ports.team.audit('AUDIT', `${player.name} đối chiếu danh sách phục vụ: Xác nhận C1 và C2 chưa nằm trong diện phục vụ trước đây. +5 điểm.`, player.id);
    return { actionId: 'm3_cross_check', success: true };
  }
}
