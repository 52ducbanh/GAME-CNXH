import {
  RoomPhase,
  Player,
  PlayerRole,
  JobType,
  ActiveJob,
  Crate,
  Citizen,
  ResourceLedger,
  ManpowerPool,
  Mission1State,
  Mission2State,
  Mission3State,
  VoteState,
  AuditEvent,
  PersonalContribution,
  GameSnapshot,
  ClientIntent,
  ServerAck,
  M1Plan,
  M2Plan
} from 'shared';

import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PLAYER_SPEED,
  INTERACTION_RADIUS,
  MATCH_DURATION_MS,
  BRIEFING_DURATION_MS,
  PRACTICE_DURATION_MS,
  VOTE_DURATION_MS,
  CLAIM_RESERVATION_MS,
  DISCONNECT_GRACE_MS,
  JOB_DURATION,
  INITIAL_BUDGET,
  INITIAL_CRATES,
  TOTAL_MANPOWER_UNITS,
  PLAN_COSTS,
  SCORES,
  INITIAL_CITIZENS
} from 'shared';

import {
  STATIC_COLLIDERS,
  BRIDGE_COLLIDER,
  POINTS_OF_INTEREST,
  Rect
} from 'shared';

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

function checkRectOverlap(x: number, y: number, radius: number, rect: Rect): boolean {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.height));
  const dist = Math.hypot(x - closestX, y - closestY);
  return dist < radius;
}

export class GameEngine {
  public roomCode: string;
  public phase: RoomPhase = 'LOBBY';
  public phaseTimerRemainingMs: number = 0;
  public isPaused: boolean = false;
  public totalRunningTimeMs: number = 0;

  public players: Map<string, Player> = new Map();
  public crates: Map<string, Crate> = new Map();
  public manpower: ManpowerPool = { total: TOTAL_MANPOWER_UNITS, busy: 0 };
  public resources: ResourceLedger;
  public citizens: Citizen[] = [];

  public m1: Mission1State;
  public m2: Mission2State;
  public m3: Mission3State;
  public voting: VoteState | null = null;
  public totalScore: number = 0;
  public recentAuditEvents: AuditEvent[] = [];
  public personalContributions: Map<string, PersonalContribution> = new Map();

  public practiceCompleted: boolean = false;
  public practiceCrateDelivered: boolean = false;
  public ruleVersion: number = 1;

  private processedActionIds: Set<string> = new Set();
  private hostToken: string;

  constructor(roomCode: string, hostToken: string) {
    this.roomCode = roomCode;
    this.hostToken = hostToken;

    this.resources = {
      initialBudget: INITIAL_BUDGET,
      currentBudget: INITIAL_BUDGET,
      totalCrates: INITIAL_CRATES,
      availableCrates: INITIAL_CRATES,
      entries: [
        {
          id: 'init',
          timestamp: Date.now(),
          missionId: 'INIT',
          description: 'Cấp phát ngân sách và vật tư ban đầu của thành phố',
          amount: 0,
          balanceAfter: INITIAL_BUDGET
        }
      ],
      version: 1
    };

    this.initCitizens();
    this.m1 = this.initM1();
    this.m2 = this.initM2();
    this.m3 = this.initM3();
    this.initCrates();
  }

  public getHostToken(): string {
    return this.hostToken;
  }

  private initCitizens() {
    this.citizens = [];
    // Zone A: 12
    for (let i = 1; i <= INITIAL_CITIZENS.ZONE_A; i++) {
      this.citizens.push({
        id: `A${i}`,
        name: `Người dân A-${i}`,
        zone: 'A',
        served: false
      });
    }
    // Zone B: 10
    for (let i = 1; i <= INITIAL_CITIZENS.ZONE_B; i++) {
      this.citizens.push({
        id: `B${i}`,
        name: `Người dân B-${i}`,
        zone: 'B',
        served: false
      });
    }
    // Zone C: 8 (C1 & C2 special needs)
    this.citizens.push({
      id: 'C1',
      name: 'Cụ C1 (Khó khăn vận động)',
      zone: 'C',
      isSpecialNeeds: true,
      served: false
    });
    this.citizens.push({
      id: 'C2',
      name: 'Cụ C2 (Người cao tuổi neo đơn)',
      zone: 'C',
      isSpecialNeeds: true,
      served: false
    });
    for (let i = 3; i <= INITIAL_CITIZENS.ZONE_C; i++) {
      this.citizens.push({
        id: `C${i}`,
        name: `Người dân C-${i}`,
        zone: 'C',
        served: false
      });
    }
  }

  private initM1(): Mission1State {
    return {
      status: 'LOCKED',
      surveys: { A: false, B: false, C: false },
      surveyAssignedTo: {},
      planProposed: 'NONE',
      planCommitted: 'NONE',
      planVersion: 1,
      requiredCrates: 0,
      deliveredCratesFixed: 0,
      deliveredCratesMobileB: 0,
      deliveredCratesMobileC: 0,
      fixedDeployed: false,
      mobileBDeployed: false,
      mobileCDeployed: false,
      verifiedA: false,
      verifiedB: false,
      verifiedC: false,
      noticePublished: false,
      score: 0
    };
  }

  private initM2(): Mission2State {
    return {
      status: 'LOCKED',
      bridgeBroken: false,
      bridgeRepaired: false,
      surveyDone: false,
      planProposed: 'NONE',
      planCommitted: 'NONE',
      planVersion: 1,
      bridgeCratesDelivered: 0,
      bridgeRepairTask1: false,
      bridgeRepairTask2: false,
      reliefCratesDeliveredB: 0,
      verifiedB: false,
      noticePublished: false,
      score: 0
    };
  }

  private initM3(): Mission3State {
    return {
      status: 'LOCKED',
      receivedFeedbackC: false,
      crossCheckedList: false,
      planConfirmed: false,
      deliveredC1: false,
      deployedC1: false,
      deliveredC2: false,
      deployedC2: false,
      lossAuditDone: false,
      lossAuditConclusion: 'Chưa đối chiếu sổ sách',
      noticePublished: false,
      score: 0
    };
  }

  private initCrates() {
    this.crates.clear();
    for (let i = 1; i <= INITIAL_CRATES; i++) {
      const id = `CRATE_${i}`;
      this.crates.set(id, {
        id,
        state: 'WAREHOUSE',
        x: POINTS_OF_INTEREST.WAREHOUSE.x,
        y: POINTS_OF_INTEREST.WAREHOUSE.y,
        carriedByPlayerId: null,
        missionContext: 'M1',
        purpose: 'Vật tư công',
        deliveredSlotId: null
      });
    }
  }

  public addPlayer(id: string, name: string, isHost: boolean = false): Player {
    let p = this.players.get(id);
    if (p) {
      p.isOnline = true;
      p.lastHeartbeat = Date.now();
      p.disconnectedAt = undefined;
      return p;
    }

    const colors = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea', '#0891b2', '#e11d48', '#4b5563'];
    const color = colors[this.players.size % colors.length];

    p = {
      id,
      name,
      roomCode: this.roomCode,
      color,
      x: POINTS_OF_INTEREST.HEADQUARTERS.x + (Math.random() * 40 - 20),
      y: POINTS_OF_INTEREST.HEADQUARTERS.y + 40 + (Math.random() * 30),
      direction: 'down',
      isMoving: false,
      role: 'SURVEY',
      carriedCrateId: null,
      activeJob: null,
      isOnline: true,
      lastHeartbeat: Date.now(),
      isHost
    };

    this.players.set(id, p);

    if (!this.personalContributions.has(id)) {
      this.personalContributions.set(id, {
        playerId: id,
        playerName: name,
        surveys: 0,
        deliveries: 0,
        deployments: 0,
        audits: 0,
        plansProposed: 0,
        votesParticipated: 0
      });
    }

    this.addAuditEvent('PLAYER', `${name} đã tham gia phòng chơi.`);
    return p;
  }

  public removeOrDisconnectPlayer(id: string) {
    const p = this.players.get(id);
    if (!p) return;
    p.isOnline = false;
    p.disconnectedAt = Date.now();
  }

  public addAuditEvent(category: AuditEvent['category'], message: string, playerId?: string) {
    const playerName = playerId ? this.players.get(playerId)?.name : undefined;
    const event: AuditEvent = {
      id: `EVT_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      playerId,
      playerName,
      category,
      message
    };
    this.recentAuditEvents.unshift(event);
    if (this.recentAuditEvents.length > 50) {
      this.recentAuditEvents.pop();
    }
  }

  public getOnlinePlayerCount(): number {
    let count = 0;
    for (const p of this.players.values()) {
      if (p.isOnline) count++;
    }
    return count;
  }

  public tick(dtMs: number) {
    const onlineCount = this.getOnlinePlayerCount();

    // Auto-pause when no one is online during RUNNING
    if (onlineCount === 0 && this.phase === 'RUNNING' && !this.isPaused) {
      this.isPaused = true;
      this.addAuditEvent('MISSION', 'Hệ thống tự động tạm dừng vì không có người chơi nào trực tuyến.');
    }

    // Handle disconnected players grace period
    const now = Date.now();
    for (const p of this.players.values()) {
      if (!p.isOnline && p.disconnectedAt && (now - p.disconnectedAt > DISCONNECT_GRACE_MS)) {
        // Release job & manpower
        if (p.activeJob) {
          if (p.activeJob.requiresManpower && this.manpower.busy > 0) {
            this.manpower.busy--;
          }
          p.activeJob = null;
        }
        // Drop carried crate
        if (p.carriedCrateId) {
          const crate = this.crates.get(p.carriedCrateId);
          if (crate && crate.state === 'CARRIED') {
            crate.state = 'DROPPED';
            crate.carriedByPlayerId = null;
            crate.x = p.x;
            crate.y = p.y;
            this.addAuditEvent('RESOURCE', `Kiện ${crate.id} đã được đặt an toàn xuống đất do người chơi mất kết nối.`);
          }
          p.carriedCrateId = null;
        }
      }
    }

    if (this.isPaused) return;

    // Phase timers
    if (this.phaseTimerRemainingMs > 0) {
      this.phaseTimerRemainingMs = Math.max(0, this.phaseTimerRemainingMs - dtMs);
      if (this.phase === 'RUNNING') {
        this.totalRunningTimeMs += dtMs;
      }

      if (this.phaseTimerRemainingMs === 0) {
        this.handlePhaseTimeout();
      }
    }

    // Active Jobs ticking
    for (const p of this.players.values()) {
      if (p.activeJob) {
        p.activeJob.elapsedMs += dtMs;
        p.activeJob.progress = Math.min(1, p.activeJob.elapsedMs / p.activeJob.durationMs);
        if (p.activeJob.progress >= 1) {
          this.completeJob(p);
        }
      }
    }

    // Active Voting ticking
    if (this.voting && this.voting.active) {
      this.voting.remainingMs = Math.max(0, this.voting.remainingMs - dtMs);
      if (this.voting.remainingMs <= 0 || now >= this.voting.endsAt) {
        this.resolveVote();
      }
    }
  }

  private handlePhaseTimeout() {
    if (this.phase === 'BRIEFING') {
      this.startPractice();
    } else if (this.phase === 'PRACTICE') {
      this.startRunning();
    } else if (this.phase === 'RUNNING') {
      this.endMatch('Hết thời gian trận đấu (600s)! Chốt kết quả công tác.');
    }
  }

  public hostAction(command: string, token: string): ServerAck {
    if (token !== this.hostToken) {
      return { actionId: 'host', success: false, reason: 'Không có quyền host!' };
    }

    switch (command) {
      case 'START':
        if (this.phase === 'LOBBY') {
          this.phase = 'BRIEFING';
          this.phaseTimerRemainingMs = BRIEFING_DURATION_MS;
          this.addAuditEvent('MISSION', 'Host bắt đầu dẫn nhập lý luận (60s).');
          return { actionId: 'host', success: true };
        }
        break;

      case 'SKIP_BRIEFING':
        if (this.phase === 'BRIEFING') {
          this.startPractice();
          return { actionId: 'host', success: true };
        }
        break;

      case 'SKIP_PRACTICE':
        if (this.phase === 'PRACTICE') {
          this.startRunning();
          return { actionId: 'host', success: true };
        }
        break;

      case 'PAUSE':
        this.isPaused = true;
        this.addAuditEvent('MISSION', 'Host đã tạm dừng trận đấu.');
        return { actionId: 'host', success: true };

      case 'RESUME':
        this.isPaused = false;
        this.addAuditEvent('MISSION', 'Host đã tiếp tục trận đấu.');
        return { actionId: 'host', success: true };

      case 'ADD_60S':
        this.phaseTimerRemainingMs += 60000;
        this.addAuditEvent('MISSION', 'Host đã cộng thêm 60 giây vào đồng hồ.');
        return { actionId: 'host', success: true };

      case 'END':
        this.endMatch('Host kết thúc trận đấu sớm.');
        return { actionId: 'host', success: true };

      case 'RESET':
        this.resetToLobby();
        return { actionId: 'host', success: true };
    }

    return { actionId: 'host', success: false, reason: 'Lệnh không hợp lệ trong trạng thái hiện tại.' };
  }

  public startPractice() {
    this.phase = 'PRACTICE';
    this.phaseTimerRemainingMs = PRACTICE_DURATION_MS;
    this.addAuditEvent('MISSION', 'Bắt đầu giai đoạn thực hành (60s): Tập di chuyển, lấy và giao kiện mẫu.');
  }

  public startRunning() {
    // Reset any practice artifacts
    this.phase = 'RUNNING';
    this.phaseTimerRemainingMs = MATCH_DURATION_MS;
    this.totalRunningTimeMs = 0;
    this.isPaused = false;

    // Reset crates cleanly
    this.initCrates();
    this.resources.availableCrates = INITIAL_CRATES;
    this.resources.currentBudget = INITIAL_BUDGET;

    // Reset players job & crates
    for (const p of this.players.values()) {
      p.activeJob = null;
      p.carriedCrateId = null;
    }
    this.manpower.busy = 0;

    // Activate M1
    this.m1.status = 'ACTIVE';
    this.addAuditEvent('MISSION', 'TRẬN ĐẤU CHÍNH THỨC BẮT ĐẦU! Nhiệm vụ 1: Mở dịch vụ y tế cho nhân dân.');
  }

  public endMatch(reason: string) {
    this.phase = 'RESULTS';
    this.phaseTimerRemainingMs = 0;
    this.isPaused = false;
    this.addAuditEvent('MISSION', `KẾT THÚC TRẬN ĐẤU: ${reason}. Tổng điểm: ${this.totalScore}/100.`);
  }

  public resetToLobby() {
    this.phase = 'LOBBY';
    this.phaseTimerRemainingMs = 0;
    this.isPaused = false;
    this.totalRunningTimeMs = 0;
    this.totalScore = 0;
    this.voting = null;
    this.practiceCompleted = false;
    this.practiceCrateDelivered = false;
    this.processedActionIds.clear();

    this.resources.currentBudget = INITIAL_BUDGET;
    this.resources.availableCrates = INITIAL_CRATES;
    this.resources.entries = [
      {
        id: 'reset',
        timestamp: Date.now(),
        missionId: 'INIT',
        description: 'Thiết lập lại phòng chơi về sảnh ban đầu',
        amount: 0,
        balanceAfter: INITIAL_BUDGET
      }
    ];

    this.manpower.busy = 0;
    this.initCitizens();
    this.m1 = this.initM1();
    this.m2 = this.initM2();
    this.m3 = this.initM3();
    this.initCrates();

    for (const p of this.players.values()) {
      p.x = POINTS_OF_INTEREST.HEADQUARTERS.x;
      p.y = POINTS_OF_INTEREST.HEADQUARTERS.y + 40;
      p.activeJob = null;
      p.carriedCrateId = null;
    }

    this.addAuditEvent('MISSION', 'Phòng chơi đã được thiết lập lại về Sảnh đón.');
  }

  public handleIntent(playerId: string, intent: ClientIntent): ServerAck {
    if (this.processedActionIds.has(intent.actionId)) {
      return { actionId: intent.actionId, success: true, reason: 'Thao tác đã được ghi nhận.' };
    }

    const player = this.players.get(playerId);
    if (!player) {
      return { actionId: intent.actionId, success: false, reason: 'Người chơi không tồn tại trong phòng.' };
    }

    let result: ServerAck;

    switch (intent.type) {
      case 'MOVE':
        result = this.handleMove(player, intent.payload, intent.actionId);
        break;

      case 'SET_ROLE':
        result = this.handleSetRole(player, intent.payload?.role, intent.actionId);
        break;

      case 'START_JOB':
        result = this.handleStartJob(player, intent.payload, intent.actionId);
        break;

      case 'CANCEL_JOB':
        result = this.handleCancelJob(player, intent.actionId);
        break;

      case 'PICK_CRATE':
        result = this.handlePickCrate(player, intent.payload?.crateId, intent.actionId);
        break;

      case 'DROP_CRATE':
        result = this.handleDropCrate(player, intent.actionId);
        break;

      case 'DELIVER_CRATE':
        result = this.handleDeliverCrate(player, intent.payload?.targetId, intent.actionId);
        break;

      case 'RETURN_CRATE':
        result = this.handleReturnCrate(player, intent.actionId);
        break;

      case 'PROPOSE_PLAN':
        result = this.handleProposePlan(player, intent.payload?.missionId, intent.payload?.plan, intent.actionId);
        break;

      case 'CAST_VOTE':
        result = this.handleCastVote(player, intent.payload?.plan, intent.actionId);
        break;

      case 'PUBLISH_NOTICE':
        result = this.handlePublishNotice(player, intent.payload?.missionId, intent.actionId);
        break;

      case 'CONFIRM_M3_PLAN':
        result = this.handleConfirmM3Plan(player, intent.actionId);
        break;

      default:
        result = { actionId: intent.actionId, success: false, reason: 'Lệnh không xác định.' };
    }

    if (result.success) {
      this.processedActionIds.add(intent.actionId);
      // Keep processed action IDs bounded
      if (this.processedActionIds.size > 2000) {
        const first = this.processedActionIds.values().next().value;
        if (first) this.processedActionIds.delete(first);
      }
    }

    return result;
  }

  private handleMove(player: Player, payload: { x: number; y: number; dir?: 'up' | 'down' | 'left' | 'right' }, actionId: string): ServerAck {
    if (this.isPaused) {
      return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    }

    const newX = Math.max(25, Math.min(WORLD_WIDTH - 25, payload.x));
    const newY = Math.max(25, Math.min(WORLD_HEIGHT - 25, payload.y));

    // Collision check
    const isBridgeBlocked = this.m2.status === 'ACTIVE' && this.m2.bridgeBroken && !this.m2.bridgeRepaired;
    if (isBridgeBlocked && checkRectOverlap(newX, newY, 14, BRIDGE_COLLIDER)) {
      return { actionId, success: false, reason: 'Cầu đang bị hỏng, không thể qua!' };
    }

    for (const rect of STATIC_COLLIDERS) {
      if (checkRectOverlap(newX, newY, 14, rect)) {
        return { actionId, success: false, reason: 'Vướng vật cản!' };
      }
    }

    // Cancel in-place job if player moved significantly (> 10 units)
    if (player.activeJob && distance(player.x, player.y, newX, newY) > 10) {
      if (player.activeJob.requiresManpower && this.manpower.busy > 0) {
        this.manpower.busy--;
      }
      player.activeJob = null;
      this.addAuditEvent('MISSION', `${player.name} đã hủy công việc do di chuyển khỏi vị trí.`, player.id);
    }

    player.x = newX;
    player.y = newY;
    if (payload.dir) player.direction = payload.dir;
    player.isMoving = true;

    // Sync carried crate position
    if (player.carriedCrateId) {
      const crate = this.crates.get(player.carriedCrateId);
      if (crate) {
        crate.x = newX;
        crate.y = newY;
      }
    }

    return { actionId, success: true };
  }

  private handleSetRole(player: Player, role: PlayerRole, actionId: string): ServerAck {
    player.role = role;
    const roleNames: Record<PlayerRole, string> = {
      SURVEY: 'Tiếp nhận nhu cầu',
      PLANNER: 'Lập phương án',
      LOGISTICS: 'Tổ chức thực hiện',
      AUDIT: 'Giám sát',
      RIGHTS: 'Bảo vệ quyền'
    };
    this.addAuditEvent('PLAYER', `${player.name} đã chọn gợi ý vai trò: ${roleNames[role]}.`, player.id);
    return { actionId, success: true };
  }

  private handleStartJob(player: Player, payload: { type: JobType; targetId: string }, actionId: string): ServerAck {
    if (this.isPaused) {
      return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    }

    if (player.activeJob) {
      return { actionId, success: false, reason: 'Bạn đang thực hiện một công việc khác.' };
    }

    const { type, targetId } = payload;
    const poi = POINTS_OF_INTEREST[targetId];
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
      if (this.phase !== 'PRACTICE') return { actionId, success: false, reason: 'Chỉ thực hiện trong giai đoạn thực hành.' };
      durationMs = JOB_DURATION.PRACTICE_SAMPLE;
    } else if (type === 'SURVEY_ZONE') {
      if (this.phase !== 'RUNNING' || this.m1.status !== 'ACTIVE') {
        return { actionId, success: false, reason: 'Nhiệm vụ 1 chưa kích hoạt.' };
      }
      if (targetId === 'ZONE_A' && this.m1.surveys.A) return { actionId, success: false, reason: 'Khu A đã được khảo sát.' };
      if (targetId === 'ZONE_B' && this.m1.surveys.B) return { actionId, success: false, reason: 'Khu B đã được khảo sát.' };
      if (targetId === 'ZONE_C' && this.m1.surveys.C) return { actionId, success: false, reason: 'Khu C đã được khảo sát.' };
      durationMs = JOB_DURATION.SURVEY;
    } else if (type === 'DEPLOY_FIXED_CLINIC') {
      if (this.m1.planCommitted !== 'FIXED') return { actionId, success: false, reason: 'Chưa cam kết phương án Trạm cố định.' };
      if (this.m1.deliveredCratesFixed < 2) return { actionId, success: false, reason: 'Cần chuyển đủ 2 kiện vật tư trước khi thi công.' };
      if (this.m1.fixedDeployed) return { actionId, success: false, reason: 'Trạm cố định đã hoàn thành thi công.' };
      if (this.manpower.busy >= this.manpower.total) return { actionId, success: false, reason: 'Cả 3 đơn vị công tác đều đang bận thực địa.' };
      requiresManpower = true;
      durationMs = JOB_DURATION.DEPLOY_FIXED;
    } else if (type === 'DEPLOY_MOBILE_CLINIC') {
      if (this.m1.planCommitted !== 'MOBILE') return { actionId, success: false, reason: 'Chưa cam kết phương án Điểm lưu động.' };
      if (targetId === 'CLINIC_MOBILE_B') {
        if (this.m1.deliveredCratesMobileB < 2) return { actionId, success: false, reason: 'Cần giao đủ 2 kiện vật tư tại điểm B.' };
        if (this.m1.mobileBDeployed) return { actionId, success: false, reason: 'Điểm lưu động B đã hoàn tất triển khai.' };
      } else if (targetId === 'CLINIC_MOBILE_C') {
        if (this.m1.deliveredCratesMobileC < 2) return { actionId, success: false, reason: 'Cần giao đủ 2 kiện vật tư tại điểm C.' };
        if (this.m1.mobileCDeployed) return { actionId, success: false, reason: 'Điểm lưu động C đã hoàn tất triển khai.' };
      }
      if (this.manpower.busy >= this.manpower.total) return { actionId, success: false, reason: 'Cả 3 đơn vị công tác đều đang bận thực địa.' };
      requiresManpower = true;
      durationMs = JOB_DURATION.DEPLOY_MOBILE;
    } else if (type === 'REPAIR_BRIDGE_1') {
      if (this.m2.status !== 'ACTIVE' || this.m2.planCommitted !== 'REPAIR') return { actionId, success: false, reason: 'Phương án sửa cầu chưa được cam kết.' };
      if (this.m2.bridgeCratesDelivered < 2) return { actionId, success: false, reason: 'Cần vận chuyển đủ 2 kiện vật tư sửa cầu trước.' };
      if (this.m2.bridgeRepairTask1) return { actionId, success: false, reason: 'Mố cầu phía Tây đã được sửa xong.' };
      if (this.manpower.busy >= this.manpower.total) return { actionId, success: false, reason: 'Cả 3 đơn vị công tác đều đang bận thực địa.' };
      requiresManpower = true;
      durationMs = JOB_DURATION.REPAIR_BRIDGE;
    } else if (type === 'REPAIR_BRIDGE_2') {
      if (this.m2.status !== 'ACTIVE' || this.m2.planCommitted !== 'REPAIR') return { actionId, success: false, reason: 'Phương án sửa cầu chưa được cam kết.' };
      if (this.m2.bridgeCratesDelivered < 2) return { actionId, success: false, reason: 'Cần vận chuyển đủ 2 kiện vật tư sửa cầu trước.' };
      if (this.m2.bridgeRepairTask2) return { actionId, success: false, reason: 'Dầm cầu phía Đông đã được sửa xong.' };
      if (this.manpower.busy >= this.manpower.total) return { actionId, success: false, reason: 'Cả 3 đơn vị công tác đều đang bận thực địa.' };
      requiresManpower = true;
      durationMs = JOB_DURATION.REPAIR_BRIDGE;
    } else if (type === 'SUPPORT_CITIZEN') {
      if (this.m3.status !== 'ACTIVE' || !this.m3.planConfirmed) return { actionId, success: false, reason: 'Kế hoạch hỗ trợ M3 chưa được xác nhận.' };
      if (targetId === 'CITIZEN_C1') {
        if (!this.m3.deliveredC1) return { actionId, success: false, reason: 'Cần giao 1 kiện vật tư y tế đến Cụ C1 trước.' };
        if (this.m3.deployedC1) return { actionId, success: false, reason: 'Cụ C1 đã được cán bộ y tế hỗ trợ hoàn tất.' };
      } else if (targetId === 'CITIZEN_C2') {
        if (!this.m3.deliveredC2) return { actionId, success: false, reason: 'Cần giao 1 kiện vật tư y tế đến Cụ C2 trước.' };
        if (this.m3.deployedC2) return { actionId, success: false, reason: 'Cụ C2 đã được cán bộ y tế hỗ trợ hoàn tất.' };
      }
      if (this.manpower.busy >= this.manpower.total) return { actionId, success: false, reason: 'Cả 3 đơn vị công tác đều đang bận thực địa.' };
      requiresManpower = true;
      durationMs = JOB_DURATION.SUPPORT_CITIZEN;
    } else if (type === 'AUDIT_RESULT') {
      durationMs = JOB_DURATION.AUDIT_RESULT;
    } else if (type === 'AUDIT_LEDGER') {
      if (this.m3.status !== 'ACTIVE') return { actionId, success: false, reason: 'Nhiệm vụ 3 chưa kích hoạt.' };
      durationMs = JOB_DURATION.AUDIT_LEDGER;
    }

    if (requiresManpower) {
      this.manpower.busy++;
    }

    player.activeJob = {
      jobId: `JOB_${Date.now()}`,
      type,
      targetId,
      progress: 0,
      elapsedMs: 0,
      durationMs,
      startedAt: Date.now(),
      requiresManpower
    };

    return { actionId, success: true };
  }

  private handleCancelJob(player: Player, actionId: string): ServerAck {
    if (!player.activeJob) {
      return { actionId, success: false, reason: 'Không có công việc đang chạy để hủy.' };
    }
    if (player.activeJob.requiresManpower && this.manpower.busy > 0) {
      this.manpower.busy--;
    }
    player.activeJob = null;
    return { actionId, success: true };
  }

  private completeJob(player: Player) {
    const job = player.activeJob;
    if (!job) return;

    if (job.requiresManpower && this.manpower.busy > 0) {
      this.manpower.busy--;
    }
    player.activeJob = null;

    const contrib = this.personalContributions.get(player.id);

    // Job completions
    if (job.type === 'PRACTICE_SAMPLE_JOB') {
      this.practiceCompleted = true;
      this.addAuditEvent('MISSION', `${player.name} hoàn thành thao tác mẫu thực hành.`, player.id);
    } else if (job.type === 'SURVEY_ZONE') {
      if (job.targetId === 'ZONE_A' && !this.m1.surveys.A) {
        this.m1.surveys.A = true;
        this.totalScore += SCORES.M1.SURVEY_PER_ZONE;
        this.m1.score += SCORES.M1.SURVEY_PER_ZONE;
      } else if (job.targetId === 'ZONE_B' && !this.m1.surveys.B) {
        this.m1.surveys.B = true;
        this.totalScore += SCORES.M1.SURVEY_PER_ZONE;
        this.m1.score += SCORES.M1.SURVEY_PER_ZONE;
      } else if (job.targetId === 'ZONE_C' && !this.m1.surveys.C) {
        this.m1.surveys.C = true;
        this.totalScore += SCORES.M1.SURVEY_PER_ZONE;
        this.m1.score += SCORES.M1.SURVEY_PER_ZONE;
      }
      if (contrib) contrib.surveys++;
      this.addAuditEvent('MISSION', `${player.name} hoàn thành khảo sát nhu cầu tại ${POINTS_OF_INTEREST[job.targetId]?.name}.`, player.id);
    } else if (job.type === 'DEPLOY_FIXED_CLINIC') {
      this.m1.fixedDeployed = true;
      this.totalScore += SCORES.M1.DEPLOY_TOTAL;
      this.m1.score += SCORES.M1.DEPLOY_TOTAL;
      if (contrib) contrib.deployments++;
      this.addAuditEvent('MISSION', `${player.name} đã thi công hoàn tất Trạm y tế cố định.`, player.id);
    } else if (job.type === 'DEPLOY_MOBILE_CLINIC') {
      if (job.targetId === 'CLINIC_MOBILE_B') {
        this.m1.mobileBDeployed = true;
        this.totalScore += 5;
        this.m1.score += 5;
      } else if (job.targetId === 'CLINIC_MOBILE_C') {
        this.m1.mobileCDeployed = true;
        this.totalScore += 5;
        this.m1.score += 5;
      }
      if (contrib) contrib.deployments++;
      this.addAuditEvent('MISSION', `${player.name} đã triển khai thành công ${POINTS_OF_INTEREST[job.targetId]?.name}.`, player.id);
    } else if (job.type === 'REPAIR_BRIDGE_1') {
      this.m2.bridgeRepairTask1 = true;
      if (contrib) contrib.deployments++;
      this.addAuditEvent('MISSION', `${player.name} sửa xong mố cầu phía Tây.`, player.id);
      this.checkBridgeStatus();
    } else if (job.type === 'REPAIR_BRIDGE_2') {
      this.m2.bridgeRepairTask2 = true;
      if (contrib) contrib.deployments++;
      this.addAuditEvent('MISSION', `${player.name} sửa xong dầm cầu phía Đông.`, player.id);
      this.checkBridgeStatus();
    } else if (job.type === 'SUPPORT_CITIZEN') {
      if (job.targetId === 'CITIZEN_C1') {
        this.m3.deployedC1 = true;
        const c1 = this.citizens.find(c => c.id === 'C1');
        if (c1) { c1.served = true; c1.servedByMission = 'M3'; }
        this.totalScore += SCORES.M3.SUPPORT_PER_CITIZEN;
        this.m3.score += SCORES.M3.SUPPORT_PER_CITIZEN;
      } else if (job.targetId === 'CITIZEN_C2') {
        this.m3.deployedC2 = true;
        const c2 = this.citizens.find(c => c.id === 'C2');
        if (c2) { c2.served = true; c2.servedByMission = 'M3'; }
        this.totalScore += SCORES.M3.SUPPORT_PER_CITIZEN;
        this.m3.score += SCORES.M3.SUPPORT_PER_CITIZEN;
      }
      if (contrib) contrib.deployments++;
      this.addAuditEvent('SERVICE', `${player.name} đã hoàn thành chăm sóc y tế tận nhà cho ${POINTS_OF_INTEREST[job.targetId]?.name}.`, player.id);
    } else if (job.type === 'AUDIT_LEDGER') {
      this.m3.lossAuditDone = true;
      this.m3.lossAuditConclusion = 'Khớp 100% với thực tế, chưa có căn cứ xác định thất thoát vật tư.';
      this.totalScore += SCORES.M3.AUDIT_LEDGER_RUMOR;
      this.m3.score += SCORES.M3.AUDIT_LEDGER_RUMOR;
      if (contrib) contrib.audits++;
      this.addAuditEvent('RESOURCE', `${player.name} đối chiếu sổ sách Kho vật tư: Kết luận minh bạch, không phát hiện hao hụt.`, player.id);
    } else if (job.type === 'AUDIT_RESULT') {
      if (this.m1.status === 'ACTIVE') {
        if (this.m1.planCommitted === 'FIXED') {
          this.m1.verifiedA = true;
          this.m1.verifiedB = true;
          this.totalScore += SCORES.M1.VERIFY_TOTAL;
          this.m1.score += SCORES.M1.VERIFY_TOTAL;
          this.serveCitizensM1Fixed();
        } else if (this.m1.planCommitted === 'MOBILE') {
          if (job.targetId === 'CLINIC_MOBILE_B' && !this.m1.verifiedB) {
            this.m1.verifiedB = true;
            this.totalScore += 4;
            this.m1.score += 4;
          } else if (job.targetId === 'CLINIC_MOBILE_C' && !this.m1.verifiedC) {
            this.m1.verifiedC = true;
            this.totalScore += 4;
            this.m1.score += 4;
          }
          if (this.m1.verifiedB && this.m1.verifiedC) {
            this.serveCitizensM1Mobile();
          }
        }
      } else if (this.m2.status === 'ACTIVE') {
        if (!this.m2.verifiedB) {
          this.m2.verifiedB = true;
          this.totalScore += SCORES.M2.VERIFY_DELIVERY;
          this.m2.score += SCORES.M2.VERIFY_DELIVERY;
        }
      }
      if (contrib) contrib.audits++;
      this.addAuditEvent('MISSION', `${player.name} hoàn thành kiểm tra kết quả tại ${POINTS_OF_INTEREST[job.targetId]?.name}.`, player.id);
    }
  }

  private checkBridgeStatus() {
    if (this.m2.bridgeRepairTask1 && this.m2.bridgeRepairTask2) {
      this.m2.bridgeRepaired = true;
      this.addAuditEvent('MISSION', 'CẦU QUA KÊNH ĐÃ ĐƯỢC KHÔI PHỤC HOÀN TOÀN! Tuyến đường ngắn sang Khu B đã thông suốt.');
    }
  }

  private serveCitizensM1Fixed() {
    // A12, B10, C0
    for (const c of this.citizens) {
      if (c.zone === 'A' || c.zone === 'B') {
        c.served = true;
        c.servedByMission = 'M1';
      }
    }
    this.addAuditEvent('SERVICE', 'Trạm cố định đã phục vụ 22 công dân (12 dân Khu A và 10 dân Khu B). Khu C chưa tiếp cận được.');
  }

  private serveCitizensM1Mobile() {
    // A10, B8, C6 (excluding C1 & C2)
    let aCount = 0;
    let bCount = 0;
    let cCount = 0;
    for (const c of this.citizens) {
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
    this.addAuditEvent('SERVICE', 'Điểm lưu động đã phục vụ 24 công dân (10 dân A, 8 dân B, 6 dân C). Hai công dân đặc biệt C1, C2 cần hỗ trợ riêng.');
  }

  private handlePickCrate(player: Player, crateId: string | undefined, actionId: string): ServerAck {
    if (this.isPaused) return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    if (player.carriedCrateId) return { actionId, success: false, reason: 'Bạn đang mang một kiện vật tư rồi.' };

    // 1. Check if picking a DROPPED crate on the ground nearby
    let droppedCrate: Crate | undefined;
    if (crateId) {
      const c = this.crates.get(crateId);
      if (c && c.state === 'DROPPED' && distance(player.x, player.y, c.x, c.y) <= INTERACTION_RADIUS) {
        droppedCrate = c;
      }
    }
    if (!droppedCrate) {
      for (const c of this.crates.values()) {
        if (c.state === 'DROPPED' && distance(player.x, player.y, c.x, c.y) <= INTERACTION_RADIUS) {
          droppedCrate = c;
          break;
        }
      }
    }

    if (droppedCrate) {
      droppedCrate.state = 'CARRIED';
      droppedCrate.carriedByPlayerId = player.id;
      droppedCrate.x = player.x;
      droppedCrate.y = player.y;
      player.carriedCrateId = droppedCrate.id;

      this.addAuditEvent('RESOURCE', `${player.name} đã nhặt lại kiện ${droppedCrate.id} từ mặt đất.`, player.id);
      return { actionId, success: true };
    }

    // 2. Otherwise pick from Warehouse stock if at Warehouse
    const warehousePoi = POINTS_OF_INTEREST.WAREHOUSE;
    const isAtWarehouse = distance(player.x, player.y, warehousePoi.x, warehousePoi.y) <= INTERACTION_RADIUS;

    if (isAtWarehouse) {
      if (this.resources.availableCrates <= 0) {
        return { actionId, success: false, reason: 'Kho đã hết kiện vật tư sẵn có!' };
      }

      // Find first WAREHOUSE crate
      let targetCrate: Crate | undefined;
      for (const c of this.crates.values()) {
        if (c.state === 'WAREHOUSE') {
          targetCrate = c;
          break;
        }
      }

      if (!targetCrate) {
        return { actionId, success: false, reason: 'Không tìm thấy kiện vật tư trong kho.' };
      }

      targetCrate.state = 'CARRIED';
      targetCrate.carriedByPlayerId = player.id;
      targetCrate.x = player.x;
      targetCrate.y = player.y;
      player.carriedCrateId = targetCrate.id;
      this.resources.availableCrates--;

      const contrib = this.personalContributions.get(player.id);
      if (contrib) contrib.deliveries++;

      this.addAuditEvent('RESOURCE', `${player.name} đã lấy kiện ${targetCrate.id} từ Kho vật tư.`, player.id);
      return { actionId, success: true };
    }

    return { actionId, success: false, reason: 'Bạn cần ở gần Kho vật tư hoặc kiện rơi trên đất để lấy vật tư.' };
  }

  private handleDropCrate(player: Player, actionId: string): ServerAck {
    if (!player.carriedCrateId) {
      return { actionId, success: false, reason: 'Bạn không mang kiện vật tư nào.' };
    }

    const crate = this.crates.get(player.carriedCrateId);
    if (!crate) {
      player.carriedCrateId = null;
      return { actionId, success: false, reason: 'Kiện vật tư không tồn tại.' };
    }

    crate.state = 'DROPPED';
    crate.carriedByPlayerId = null;
    crate.x = player.x;
    crate.y = player.y;
    player.carriedCrateId = null;

    this.addAuditEvent('RESOURCE', `${player.name} đã đặt kiện ${crate.id} xuống đất tại vị trí an toàn.`, player.id);
    return { actionId, success: true };
  }

  private handleReturnCrate(player: Player, actionId: string): ServerAck {
    if (!player.carriedCrateId) {
      return { actionId, success: false, reason: 'Bạn không mang kiện vật tư nào.' };
    }

    const warehousePoi = POINTS_OF_INTEREST.WAREHOUSE;
    if (distance(player.x, player.y, warehousePoi.x, warehousePoi.y) > INTERACTION_RADIUS) {
      return { actionId, success: false, reason: 'Cần đến gần Kho vật tư để hoàn trả.' };
    }

    const crate = this.crates.get(player.carriedCrateId);
    if (crate) {
      crate.state = 'WAREHOUSE';
      crate.carriedByPlayerId = null;
      crate.x = warehousePoi.x;
      crate.y = warehousePoi.y;
      this.resources.availableCrates++;
    }
    player.carriedCrateId = null;

    this.addAuditEvent('RESOURCE', `${player.name} đã hoàn trả an toàn kiện vật tư về Kho.`, player.id);
    return { actionId, success: true };
  }

  private handleDeliverCrate(player: Player, targetId: string, actionId: string): ServerAck {
    if (this.isPaused) return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    if (!player.carriedCrateId) return { actionId, success: false, reason: 'Bạn không mang kiện vật tư nào để giao.' };

    const poi = POINTS_OF_INTEREST[targetId];
    if (!poi) return { actionId, success: false, reason: 'Điểm giao không hợp lệ.' };
    if (distance(player.x, player.y, poi.x, poi.y) > INTERACTION_RADIUS) {
      return { actionId, success: false, reason: `Bạn cần đến gần ${poi.name} để giao kiện.` };
    }

    const crate = this.crates.get(player.carriedCrateId);
    if (!crate) return { actionId, success: false, reason: 'Kiện vật tư không tồn tại.' };

    const contrib = this.personalContributions.get(player.id);

    // Practice deliver
    if (this.phase === 'PRACTICE' && targetId === 'PRACTICE_TARGET') {
      crate.state = 'DELIVERED';
      crate.carriedByPlayerId = null;
      player.carriedCrateId = null;
      this.practiceCrateDelivered = true;
      this.addAuditEvent('MISSION', `${player.name} đã giao thành công kiện mẫu trong thực hành.`, player.id);
      return { actionId, success: true };
    }

    // M1 Deliveries
    if (this.m1.status === 'ACTIVE') {
      if (this.m1.planCommitted === 'FIXED' && targetId === 'CLINIC_FIXED') {
        if (this.m1.deliveredCratesFixed >= 2) return { actionId, success: false, reason: 'Trạm cố định đã nhận đủ 2 kiện vật tư.' };
        this.m1.deliveredCratesFixed++;
        crate.state = 'DELIVERED';
        crate.carriedByPlayerId = null;
        player.carriedCrateId = null;
        if (contrib) contrib.deliveries++;
        this.addAuditEvent('RESOURCE', `${player.name} đã giao kiện cho Trạm cố định (${this.m1.deliveredCratesFixed}/2 kiện).`, player.id);
        return { actionId, success: true };
      } else if (this.m1.planCommitted === 'MOBILE') {
        if (targetId === 'CLINIC_MOBILE_B') {
          if (this.m1.deliveredCratesMobileB >= 2) return { actionId, success: false, reason: 'Điểm B đã nhận đủ 2 kiện.' };
          this.m1.deliveredCratesMobileB++;
          crate.state = 'DELIVERED';
          crate.carriedByPlayerId = null;
          player.carriedCrateId = null;
          if (contrib) contrib.deliveries++;
          this.addAuditEvent('RESOURCE', `${player.name} đã giao kiện cho Điểm B (${this.m1.deliveredCratesMobileB}/2 kiện).`, player.id);
          return { actionId, success: true };
        } else if (targetId === 'CLINIC_MOBILE_C') {
          if (this.m1.deliveredCratesMobileC >= 2) return { actionId, success: false, reason: 'Điểm C đã nhận đủ 2 kiện.' };
          this.m1.deliveredCratesMobileC++;
          crate.state = 'DELIVERED';
          crate.carriedByPlayerId = null;
          player.carriedCrateId = null;
          if (contrib) contrib.deliveries++;
          this.addAuditEvent('RESOURCE', `${player.name} đã giao kiện cho Điểm C (${this.m1.deliveredCratesMobileC}/2 kiện).`, player.id);
          return { actionId, success: true };
        }
      }
    }

    // M2 Deliveries
    if (this.m2.status === 'ACTIVE') {
      if (this.m2.planCommitted === 'REPAIR' && targetId === 'BRIDGE') {
        if (this.m2.bridgeCratesDelivered >= 2) return { actionId, success: false, reason: 'Cầu đã nhận đủ 2 kiện vật tư sửa chữa.' };
        this.m2.bridgeCratesDelivered++;
        crate.state = 'DELIVERED';
        crate.carriedByPlayerId = null;
        player.carriedCrateId = null;
        if (contrib) contrib.deliveries++;
        this.addAuditEvent('RESOURCE', `${player.name} đã giao kiện sửa cầu (${this.m2.bridgeCratesDelivered}/2 kiện).`, player.id);
        return { actionId, success: true };
      } else if (targetId === 'ZONE_B') {
        if (this.m2.reliefCratesDeliveredB >= 2) return { actionId, success: false, reason: 'Khu B đã nhận đủ 2 kiện cứu trợ khẩn cấp.' };
        this.m2.reliefCratesDeliveredB++;
        this.totalScore += SCORES.M2.DELIVER_RELIEF_PER_CRATE;
        this.m2.score += SCORES.M2.DELIVER_RELIEF_PER_CRATE;
        crate.state = 'DELIVERED';
        crate.carriedByPlayerId = null;
        player.carriedCrateId = null;
        if (contrib) contrib.deliveries++;
        this.addAuditEvent('RESOURCE', `${player.name} đã giao kiện cứu trợ khẩn cấp đến Khu B (${this.m2.reliefCratesDeliveredB}/2 kiện). +8 điểm.`, player.id);
        return { actionId, success: true };
      }
    }

    // M3 Deliveries
    if (this.m3.status === 'ACTIVE' && this.m3.planConfirmed) {
      if (targetId === 'CITIZEN_C1') {
        if (this.m3.deliveredC1) return { actionId, success: false, reason: 'Cụ C1 đã nhận được kiện vật tư y tế.' };
        this.m3.deliveredC1 = true;
        crate.state = 'DELIVERED';
        crate.carriedByPlayerId = null;
        player.carriedCrateId = null;
        if (contrib) contrib.deliveries++;
        this.addAuditEvent('SERVICE', `${player.name} đã giao tận tay kiện vật tư y tế đến Cụ C1.`, player.id);
        return { actionId, success: true };
      } else if (targetId === 'CITIZEN_C2') {
        if (this.m3.deliveredC2) return { actionId, success: false, reason: 'Cụ C2 đã nhận được kiện vật tư y tế.' };
        this.m3.deliveredC2 = true;
        crate.state = 'DELIVERED';
        crate.carriedByPlayerId = null;
        player.carriedCrateId = null;
        if (contrib) contrib.deliveries++;
        this.addAuditEvent('SERVICE', `${player.name} đã giao tận tay kiện vật tư y tế đến Cụ C2.`, player.id);
        return { actionId, success: true };
      }
    }

    return { actionId, success: false, reason: 'Điểm giao hiện tại không yêu cầu vật tư hoặc điều kiện chưa thỏa.' };
  }

  private handleProposePlan(player: Player, missionId: 'M1' | 'M2', plan: string, actionId: string): ServerAck {
    if (this.isPaused) return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    const hq = POINTS_OF_INTEREST.HEADQUARTERS;
    if (distance(player.x, player.y, hq.x, hq.y) > INTERACTION_RADIUS) {
      return { actionId, success: false, reason: 'Cần đến Trụ sở chính quyền để đề xuất kế hoạch.' };
    }

    if (this.voting && this.voting.active) {
      return { actionId, success: false, reason: 'Đang có một cuộc biểu quyết đang diễn ra.' };
    }

    if (missionId === 'M1') {
      if (this.m1.status !== 'ACTIVE') return { actionId, success: false, reason: 'Nhiệm vụ 1 chưa kích hoạt.' };
      if (!this.m1.surveys.A || !this.m1.surveys.B || !this.m1.surveys.C) {
        return { actionId, success: false, reason: 'Cần thu thập đủ 3 hồ sơ khảo sát A, B, C trước khi lập kế hoạch.' };
      }
      if (this.m1.planCommitted !== 'NONE') {
        return { actionId, success: false, reason: 'Phương án M1 đã được cam kết, không thể thay đổi.' };
      }

      const cost = plan === 'FIXED' ? PLAN_COSTS.M1_FIXED.budget : PLAN_COSTS.M1_MOBILE.budget;
      if (this.resources.currentBudget < cost) {
        return { actionId, success: false, reason: `Không đủ ngân sách (cần ${cost} đơn vị).` };
      }

      this.startVote('M1', plan, player);
      return { actionId, success: true };
    } else if (missionId === 'M2') {
      if (this.m2.status !== 'ACTIVE') return { actionId, success: false, reason: 'Nhiệm vụ 2 chưa kích hoạt.' };
      if (!this.m2.surveyDone) return { actionId, success: false, reason: 'Cần ghi nhận hồ sơ sự cố cầu hỏng trước.' };
      if (this.m2.planCommitted !== 'NONE') {
        return { actionId, success: false, reason: 'Phương án M2 đã được cam kết.' };
      }

      const cost = plan === 'REPAIR' ? PLAN_COSTS.M2_REPAIR.budget : PLAN_COSTS.M2_DETOUR.budget;
      if (this.resources.currentBudget < cost) {
        return { actionId, success: false, reason: `Không đủ ngân sách (cần ${cost} đơn vị).` };
      }

      this.startVote('M2', plan, player);
      return { actionId, success: true };
    }

    return { actionId, success: false, reason: 'Nhiệm vụ không hợp lệ.' };
  }

  private startVote(missionId: 'M1' | 'M2', plan: string, proposer: Player) {
    const onlineCount = this.getOnlinePlayerCount();
    const votes: Record<string, string> = { [proposer.id]: plan };

    this.voting = {
      active: true,
      missionId,
      proposedPlan: plan,
      proposerId: proposer.id,
      proposerName: proposer.name,
      remainingMs: VOTE_DURATION_MS,
      endsAt: Date.now() + VOTE_DURATION_MS,
      totalOnlineVoters: onlineCount,
      votes
    };

    const contrib = this.personalContributions.get(proposer.id);
    if (contrib) {
      contrib.plansProposed++;
      contrib.votesParticipated++;
    }

    this.addAuditEvent('VOTE', `${proposer.name} đã đề xuất phương án ${plan} cho ${missionId}. Mở biểu quyết tập thể (15s).`, proposer.id);

    // Solo instant pass
    if (onlineCount <= 1) {
      this.resolveVote();
    }
  }

  private handleCastVote(player: Player, plan: string, actionId: string): ServerAck {
    if (!this.voting || !this.voting.active) {
      return { actionId, success: false, reason: 'Không có phiên biểu quyết nào đang mở.' };
    }

    this.voting.votes[player.id] = plan;
    const contrib = this.personalContributions.get(player.id);
    if (contrib) contrib.votesParticipated++;

    this.addAuditEvent('VOTE', `${player.name} đã bỏ phiếu cho phương án: ${plan}.`, player.id);

    // If all online players have voted, close vote early!
    let allVoted = true;
    for (const p of this.players.values()) {
      if (p.isOnline && !this.voting.votes[p.id]) {
        allVoted = false;
        break;
      }
    }

    if (allVoted) {
      this.resolveVote();
    }

    return { actionId, success: true };
  }

  private resolveVote() {
    if (!this.voting || !this.voting.active) return;
    this.voting.active = false;

    const { missionId, proposedPlan, proposerId, votes } = this.voting;
    const tallies: Record<string, number> = {};

    for (const chosen of Object.values(votes)) {
      tallies[chosen] = (tallies[chosen] || 0) + 1;
    }

    let winningPlan = proposedPlan;
    let maxVotes = -1;

    for (const [p, count] of Object.entries(tallies)) {
      if (count > maxVotes) {
        maxVotes = count;
        winningPlan = p;
      } else if (count === maxVotes) {
        // Tie-breaker: prioritize proposer's choice
        const proposerVote = votes[proposerId];
        if (proposerVote) winningPlan = proposerVote;
      }
    }

    // Commit winning plan
    if (missionId === 'M1') {
      const plan = winningPlan as M1Plan;
      const cost = plan === 'FIXED' ? PLAN_COSTS.M1_FIXED.budget : PLAN_COSTS.M1_MOBILE.budget;
      const cratesReq = plan === 'FIXED' ? PLAN_COSTS.M1_FIXED.crates : PLAN_COSTS.M1_MOBILE.crates;

      this.deductBudget('M1', `Cam kết phương án dịch vụ y tế ${plan}`, cost);
      this.m1.planCommitted = plan;
      this.m1.requiredCrates = cratesReq;
      this.m1.planVersion++;

      this.addAuditEvent('PLAN', `BIỂU QUYẾT THÀNH CÔNG: Chốt phương án ${plan} cho Nhiệm vụ 1. Ngân sách trừ ${cost} đơn vị.`);
    } else if (missionId === 'M2') {
      const plan = winningPlan as M2Plan;
      const cost = plan === 'REPAIR' ? PLAN_COSTS.M2_REPAIR.budget : PLAN_COSTS.M2_DETOUR.budget;

      this.deductBudget('M2', `Cam kết phương án ứng phó sự cố cầu B: ${plan}`, cost);
      this.m2.planCommitted = plan;
      this.m2.planVersion++;
      this.totalScore += SCORES.M2.COMMIT_PLAN;
      this.m2.score += SCORES.M2.COMMIT_PLAN;

      this.addAuditEvent('PLAN', `BIỂU QUYẾT THÀNH CÔNG: Chốt phương án ${plan} cho Nhiệm vụ 2. Ngân sách trừ ${cost} đơn vị. +5 điểm.`);
    }

    this.voting = null;
  }

  private deductBudget(missionId: 'M1' | 'M2' | 'M3', description: string, amount: number) {
    this.resources.currentBudget -= amount;
    this.resources.version++;
    const entry = {
      id: `LEDGER_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      missionId,
      description,
      amount,
      balanceAfter: this.resources.currentBudget
    };
    this.resources.entries.unshift(entry);
    this.addAuditEvent('RESOURCE', `SỔ SÁCH CÔNG: -${amount} đơn vị. Số dư ngân sách còn: ${this.resources.currentBudget}.`);
  }

  private handleConfirmM3Plan(player: Player, actionId: string): ServerAck {
    if (this.isPaused) return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    const hq = POINTS_OF_INTEREST.HEADQUARTERS;
    if (distance(player.x, player.y, hq.x, hq.y) > INTERACTION_RADIUS) {
      return { actionId, success: false, reason: 'Cần đến Trụ sở để xác nhận kế hoạch hỗ trợ.' };
    }

    if (this.m3.status !== 'ACTIVE') return { actionId, success: false, reason: 'Nhiệm vụ 3 chưa kích hoạt.' };
    if (!this.m3.receivedFeedbackC) return { actionId, success: false, reason: 'Cần đến Khu C gặp đại diện tiếp nhận phản ánh trước.' };
    if (!this.m3.crossCheckedList) return { actionId, success: false, reason: 'Cần đối chiếu danh sách tại Trạm/Điểm y tế trước.' };
    if (this.m3.planConfirmed) return { actionId, success: false, reason: 'Phương án hỗ trợ đã được xác nhận trước đó.' };

    const cost = PLAN_COSTS.M3_CONFIRM.budget;
    if (this.resources.currentBudget < cost) {
      return { actionId, success: false, reason: `Không đủ ngân sách (cần ${cost} đơn vị).` };
    }

    this.deductBudget('M3', 'Chi phí hỗ trợ y tế tận nhà cho hai công dân cao tuổi C1 và C2', cost);
    this.m3.planConfirmed = true;

    this.addAuditEvent('PLAN', `${player.name} xác nhận phương án hỗ trợ tận nơi cho C1 và C2 theo quy tắc căn cứ thực tế. Ngân sách trừ ${cost} đơn vị.`, player.id);
    return { actionId, success: true };
  }

  private handlePublishNotice(player: Player, missionId: 'M1' | 'M2' | 'M3', actionId: string): ServerAck {
    if (this.isPaused) return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    const board = POINTS_OF_INTEREST.NOTICE_BOARD;
    if (distance(player.x, player.y, board.x, board.y) > INTERACTION_RADIUS) {
      return { actionId, success: false, reason: 'Cần đến Bảng công khai kết quả để niêm yết.' };
    }

    const contrib = this.personalContributions.get(player.id);

    if (missionId === 'M1') {
      if (this.m1.status !== 'ACTIVE') return { actionId, success: false, reason: 'M1 chưa kích hoạt.' };
      const deployed = this.m1.planCommitted === 'FIXED' ? this.m1.fixedDeployed : (this.m1.mobileBDeployed && this.m1.mobileCDeployed);
      const verified = this.m1.planCommitted === 'FIXED' ? this.m1.verifiedA : (this.m1.verifiedB && this.m1.verifiedC);
      if (!deployed || !verified) {
        return { actionId, success: false, reason: 'Cần hoàn tất triển khai và kiểm tra kết quả trước khi công khai.' };
      }
      if (this.m1.noticePublished) return { actionId, success: false, reason: 'Đã niêm yết kết quả M1.' };

      this.m1.noticePublished = true;
      this.totalScore += SCORES.M1.PUBLISH_NOTICE;
      this.m1.score += SCORES.M1.PUBLISH_NOTICE;
      if (contrib) contrib.audits++;
      this.addAuditEvent('AUDIT', `${player.name} đã niêm yết công khai ngân sách & kết quả M1 lên Bảng công khai. +6 điểm.`, player.id);

      // RESOLVE M1, Trigger M2!
      this.resolveM1();
      return { actionId, success: true };
    } else if (missionId === 'M2') {
      if (this.m2.status !== 'ACTIVE') return { actionId, success: false, reason: 'M2 chưa kích hoạt.' };
      if (this.m2.reliefCratesDeliveredB < 2 || !this.m2.verifiedB) {
        return { actionId, success: false, reason: 'Cần giao đủ 2 kiện cứu trợ và kiểm tra kết quả tại B trước.' };
      }
      if (this.m2.noticePublished) return { actionId, success: false, reason: 'Đã niêm yết kết quả M2.' };

      this.m2.noticePublished = true;
      this.totalScore += SCORES.M2.PUBLISH_NOTICE;
      this.m2.score += SCORES.M2.PUBLISH_NOTICE;
      if (contrib) contrib.audits++;
      this.addAuditEvent('AUDIT', `${player.name} đã niêm yết công khai kết quả ứng phó và tuyến đường M2. +5 điểm.`, player.id);

      // RESOLVE M2, Trigger M3!
      this.resolveM2();
      return { actionId, success: true };
    } else if (missionId === 'M3') {
      if (this.m3.status !== 'ACTIVE') return { actionId, success: false, reason: 'M3 chưa kích hoạt.' };
      if (!this.m3.deployedC1 || !this.m3.deployedC2 || !this.m3.lossAuditDone) {
        return { actionId, success: false, reason: 'Cần hoàn tất hỗ trợ C1, C2 và đối chiếu sổ sách trước.' };
      }
      if (this.m3.noticePublished) return { actionId, success: false, reason: 'Đã niêm yết kết quả M3.' };

      this.m3.noticePublished = true;
      this.totalScore += SCORES.M3.PUBLISH_NOTICE;
      this.m3.score += SCORES.M3.PUBLISH_NOTICE;
      if (contrib) contrib.audits++;
      this.addAuditEvent('AUDIT', `${player.name} đã niêm yết bản tổng hợp khắc phục M3 (bảo mật thông tin riêng). +6 điểm.`, player.id);

      // RESOLVE M3, Finish Match!
      this.resolveM3();
      return { actionId, success: true };
    }

    return { actionId, success: false, reason: 'Nhiệm vụ không hợp lệ.' };
  }

  private resolveM1() {
    this.m1.status = 'RESOLVED';
    this.addAuditEvent('MISSION', `HOÀN THÀNH NHIỆM VỤ 1! Điểm M1: ${this.m1.score}/30.`);

    // Trigger M2
    this.m2.status = 'ACTIVE';
    this.m2.bridgeBroken = true;
    this.addAuditEvent('MISSION', 'SỰ KIỆN KHẨN CẤP: Cầu qua kênh sang Khu B bị sự cố sụt lún! Tuyến ngắn bị chặn. Bắt đầu Nhiệm vụ 2.');
  }

  private resolveM2() {
    this.m2.status = 'RESOLVED';
    this.addAuditEvent('MISSION', `HOÀN THÀNH NHIỆM VỤ 2! Điểm M2: ${this.m2.score}/35.`);

    // Trigger M3
    this.m3.status = 'ACTIVE';
    this.addAuditEvent('MISSION', 'BẮT ĐẦU NHIỆM VỤ 3: Tiếp nhận phản ánh từ Khu C (Cụ C1, C2 khó khăn tiếp cận) và xác minh thông tin sổ sách kho.');
  }

  private resolveM3() {
    this.m3.status = 'RESOLVED';
    this.addAuditEvent('MISSION', `HOÀN THÀNH NHIỆM VỤ 3! Điểm M3: ${this.m3.score}/35.`);
    this.endMatch('TẤT CẢ 3 NHIỆM VỤ ĐÃ HOÀN THÀNH XUẤT SẮC!');
  }

  // Quick helper for M2 and M3 field inquiries
  public surveyBridgeM2(player: Player): ServerAck {
    if (this.m2.status !== 'ACTIVE') return { actionId: 'bridge_survey', success: false, reason: 'M2 chưa kích hoạt.' };
    const bridgePoi = POINTS_OF_INTEREST.BRIDGE;
    if (distance(player.x, player.y, bridgePoi.x, bridgePoi.y) > INTERACTION_RADIUS) {
      return { actionId: 'bridge_survey', success: false, reason: 'Cần đến gần Cầu để khảo sát.' };
    }
    if (this.m2.surveyDone) return { actionId: 'bridge_survey', success: true };

    this.m2.surveyDone = true;
    this.totalScore += SCORES.M2.SURVEY;
    this.m2.score += SCORES.M2.SURVEY;
    const contrib = this.personalContributions.get(player.id);
    if (contrib) contrib.surveys++;

    this.addAuditEvent('MISSION', `${player.name} đã khảo sát hiện trường sụt lún cầu. Lập hồ sơ kỹ thuật. +5 điểm.`, player.id);
    return { actionId: 'bridge_survey', success: true };
  }

  public receiveFeedbackM3(player: Player): ServerAck {
    if (this.m3.status !== 'ACTIVE') return { actionId: 'm3_feedback', success: false, reason: 'M3 chưa kích hoạt.' };
    const zoneC = POINTS_OF_INTEREST.ZONE_C;
    if (distance(player.x, player.y, zoneC.x, zoneC.y) > INTERACTION_RADIUS) {
      return { actionId: 'm3_feedback', success: false, reason: 'Cần đến Khu C gặp đại diện.' };
    }
    if (this.m3.receivedFeedbackC) return { actionId: 'm3_feedback', success: true };

    this.m3.receivedFeedbackC = true;
    this.totalScore += SCORES.M3.RECEIVE_FEEDBACK;
    this.m3.score += SCORES.M3.RECEIVE_FEEDBACK;
    const contrib = this.personalContributions.get(player.id);
    if (contrib) contrib.surveys++;

    this.addAuditEvent('SERVICE', `${player.name} đã tiếp nhận phản ánh chính thức về hoàn cảnh Cụ C1, C2 tại Khu C. +5 điểm.`, player.id);
    return { actionId: 'm3_feedback', success: true };
  }

  public crossCheckClinicM3(player: Player, targetId: string): ServerAck {
    if (this.m3.status !== 'ACTIVE') return { actionId: 'm3_cross_check', success: false, reason: 'M3 chưa kích hoạt.' };
    const poi = POINTS_OF_INTEREST[targetId];
    if (!poi) return { actionId: 'm3_cross_check', success: false, reason: 'Địa điểm không hợp lệ.' };
    if (distance(player.x, player.y, poi.x, poi.y) > INTERACTION_RADIUS) {
      return { actionId: 'm3_cross_check', success: false, reason: `Cần đến ${poi.name} để đối chiếu danh sách.` };
    }
    if (this.m3.crossCheckedList) return { actionId: 'm3_cross_check', success: true };

    this.m3.crossCheckedList = true;
    this.totalScore += SCORES.M3.CROSS_CHECK_CLINIC;
    this.m3.score += SCORES.M3.CROSS_CHECK_CLINIC;
    const contrib = this.personalContributions.get(player.id);
    if (contrib) contrib.audits++;

    this.addAuditEvent('AUDIT', `${player.name} đối chiếu danh sách phục vụ: Xác nhận C1 và C2 chưa nằm trong diện phục vụ trước đây. +5 điểm.`, player.id);
    return { actionId: 'm3_cross_check', success: true };
  }

  public getSnapshot(): GameSnapshot {
    const playersObj: Record<string, Player> = {};
    for (const [id, p] of this.players.entries()) {
      playersObj[id] = { ...p };
    }

    const cratesObj: Record<string, Crate> = {};
    for (const [id, c] of this.crates.entries()) {
      cratesObj[id] = { ...c };
    }

    const servedCount = this.citizens.filter(c => c.served).length;

    return {
      roomCode: this.roomCode,
      phase: this.phase,
      phaseTimerRemainingMs: this.phaseTimerRemainingMs,
      isPaused: this.isPaused,
      totalRunningTimeMs: this.totalRunningTimeMs,
      players: playersObj,
      crates: cratesObj,
      manpower: { ...this.manpower },
      resources: {
        ...this.resources,
        entries: [...this.resources.entries.slice(0, 15)]
      },
      citizens: [...this.citizens],
      citizensServedCount: servedCount,
      totalCitizensCount: this.citizens.length,
      m1: { ...this.m1 },
      m2: { ...this.m2 },
      m3: { ...this.m3 },
      voting: this.voting ? { ...this.voting } : null,
      totalScore: this.totalScore,
      recentAuditEvents: [...this.recentAuditEvents.slice(0, 20)],
      practiceCompleted: this.practiceCompleted,
      practiceCrateDelivered: this.practiceCrateDelivered,
      ruleVersion: this.ruleVersion
    };
  }
}
