import { readIntentEnvelope, readPayload, readString } from 'shared';
import { createProvinceRuntime } from './gameplay/registry.js';
import type { ProvinceRuntime } from './gameplay/core/contracts.js';
import type { GameplayPorts } from './gameplay/core/ports.js';
import { startTask, releaseTask } from './gameplay/core/tasks.js';
import { ItemCapability } from './gameplay/core/items.js';
import { VotingCapability } from './gameplay/core/voting.js';
import { deductResource } from './gameplay/core/resources.js';
import type { RoomPhase, Player, PlayerRole, Crate, ResourceLedger, ManpowerPool, AuditEvent, PersonalContribution, GameSnapshot, ClientIntent, ServerAck, MapId, WorldMap, MapPoint, CollisionState } from 'shared';
import { getGameMap, isWalkableForMap, isMovementSegmentClear, safeSpawn, MOVEMENT_CONFIG, MATCH_DURATION_MS, BRIEFING_DURATION_MS, PRACTICE_DURATION_MS, DISCONNECT_GRACE_MS, INITIAL_BUDGET, INITIAL_CRATES, TOTAL_MANPOWER_UNITS } from 'shared';
const distance=(x1:number,y1:number,x2:number,y2:number)=>Math.hypot(x2-x1,y2-y1);

export class GameEngine {
  public roomCode:string;
  public phase:RoomPhase='LOBBY';
  public phaseTimerRemainingMs=0;
  public isPaused=false;
  public totalRunningTimeMs=0;
  public players=new Map<string,Player>();
  public crates=new Map<string,Crate>();
  public manpower:ManpowerPool={total:TOTAL_MANPOWER_UNITS,busy:0};
  public resources:ResourceLedger;
  public recentAuditEvents:AuditEvent[]=[];
  public personalContributions=new Map<string,PersonalContribution>();
  public practiceCompleted=false;
  public practiceCrateDelivered=false;
  public ruleVersion=1;
  public readonly map:WorldMap;
  private province:ProvinceRuntime;
  private itemsCapability:ItemCapability;
  private votingCapability:VotingCapability;
  private processedActionIds=new Map<string,{fingerprint:string;ack:ServerAck}>();
  private hostToken:string;
  // Detached compatibility readers for existing integrations; never authoritative writers.
  public get m1(){return this.province.projection().m1;}
  public get m2(){return this.province.projection().m2;}
  public get m3(){return this.province.projection().m3;}
  public get citizens(){return this.province.projection().citizens;}
  public get hatinhState(){return this.province.projection().hatinhState;}
  public get ninhBinhState(){return this.province.projection().ninhBinhState;}
  public get quangNinhState(){return this.province.projection().quangNinhState;}
  public get haiPhongState(){return this.province.projection().haiPhongState;}
  public get thanhHoaState(){return this.province.projection().thanhHoaState;}
  public get ngheAnState(){return this.province.projection().ngheAnState;}
  public get voting(){return this.votingCapability.state;}
  public get totalScore(){return this.province.totalScore();}

  constructor(roomCode: string, hostToken: string, mapId:MapId='hanoi', runtimeFactory:typeof createProvinceRuntime=createProvinceRuntime) {
    this.map=getGameMap(mapId);
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

    this.itemsCapability = new ItemCapability({map:this.map,crates:this.crates,resources:this.resources,paused:()=>this.isPaused,contribution:id=>this.personalContributions.get(id),audit:this.addAuditEvent.bind(this)});
    this.votingCapability = new VotingCapability({players:this.players,onlineCount:()=>this.getOnlinePlayerCount(),contribution:id=>this.personalContributions.get(id),audit:this.addAuditEvent.bind(this),commit:(missionId,plan)=>this.province.commitVote(missionId,plan)});
    this.province = runtimeFactory(mapId, this.gameplayPorts());
    this.initCrates();
  }

  private initCrates(){this.itemsCapability.reset();}
  private collisionContext():CollisionState{return this.province.worldState();}
  private handleCancelJob(player:Player,actionId:string):ServerAck {
    if(!player.activeJob)return {actionId,success:false,reason:'Không có công việc đang chạy để hủy.'};
    releaseTask(player,this.manpower);return {actionId,success:true};
  }
  private completeJob(player:Player){const job=releaseTask(player,this.manpower);if(job)this.province.completeTask(player,job);}

  private gameplayPorts():GameplayPorts {
    return {
      read:{map:this.map,phase:()=>this.phase,paused:()=>this.isPaused,snapshot:()=>this.getSnapshot()},
      team:{contribution:id=>this.personalContributions.get(id),onlineCount:()=>this.getOnlinePlayerCount(),audit:this.addAuditEvent.bind(this)},
      tasks:{manpower:this.manpower,start:(player,spec,id)=>startTask(player,spec,this.manpower,id)},
      items:{get:id=>this.crates.get(id),deliver:(player,id)=>this.itemsCapability.deliver(player,id)},
      resources:{ledger:this.resources,deduct:(id,text,amount)=>deductResource(this.resources,id,text,amount,this.addAuditEvent.bind(this))},
      votes:{active:()=>!!this.voting?.active,start:(id,plan,player)=>this.votingCapability.start(id,plan,player)},
      lifecycle:{end:this.endMatch.bind(this),recoverWorld:reason=>{
        for(const player of this.players.values())if(!isWalkableForMap(this.map.id,player.x,player.y,this.collisionContext())){
          const point=safeSpawn(this.map.id,player,this.collisionContext());player.x=point.x;player.y=point.y;
          this.addAuditEvent('PLAYER',reason(player),player.id);
        }
      }},
      practice:{complete:()=>{this.practiceCompleted=true;},deliver:()=>{this.practiceCrateDelivered=true;}},
    };
  }

  public getHostToken(): string {
    return this.hostToken;
  }

  private recoverCollisionOverlaps(){
    for(const p of this.players.values())if(!isWalkableForMap(this.map.id,p.x,p.y,this.collisionContext())){
      const q=safeSpawn(this.map.id,p,this.collisionContext());p.x=q.x;p.y=q.y;
      this.addAuditEvent('PLAYER',`${p.name} được đưa ra khỏi footprint công trình mới.`,p.id);
    }
  }

  public addPlayer(id: string, name: string, isHost: boolean = false): Player {
    let p = this.players.get(id);
    if (p) {
      p.isOnline = true;
      p.lastHeartbeat = Date.now();
      p.disconnectedAt = undefined;
      const valid = safeSpawn(this.map.id,p,this.collisionContext());
      p.x=valid.x;p.y=valid.y;
      return p;
    }

    const colors = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#9333ea', '#0891b2', '#e11d48', '#4b5563'];
    const color = colors[this.players.size % colors.length];

    p = {
      id,
      name,
      roomCode: this.roomCode,
      color,
      x: this.map.spawn.x + (Math.random() * 40 - 20),
      y: this.map.spawn.y + (Math.random() * 30 - 15),
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
    const validSpawn=safeSpawn(this.map.id,p,this.collisionContext());
    p.x=validSpawn.x;p.y=validSpawn.y;

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
    this.updateManpowerTotal();
    return p;
  }

  public removeOrDisconnectPlayer(id: string) {
    const p = this.players.get(id);
    if (!p) return;
    p.isOnline = false;
    p.disconnectedAt = Date.now();
    this.updateManpowerTotal();
    this.updateManpowerTotal();
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

  private updateManpowerTotal() {
    const online = this.getOnlinePlayerCount();
    this.manpower.total = Math.max(TOTAL_MANPOWER_UNITS, Math.min(8, online));
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

    // Active Voting ticking � paused when game is paused (guard above returns early)
    if (this.voting && this.voting.active) {
      this.voting.remainingMs = Math.max(0, this.voting.remainingMs - dtMs);
      if (this.voting.remainingMs <= 0) {
        this.votingCapability.resolve();
      }
    }

    this.province.tick(dtMs);

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

    this.province.start();
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
    this.votingCapability.state = null;
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
    this.province.reset();
    this.initCrates();

    for (const p of this.players.values()) {
      p.x = this.map.spawn.x;
      p.y = this.map.spawn.y;
      p.activeJob = null;
      p.carriedCrateId = null;
    }

    this.addAuditEvent('MISSION', 'Phòng chơi đã được thiết lập lại về Sảnh đón.');
  }

  public handleIntent(playerId: string, value: unknown): ServerAck {
    const intent=readIntentEnvelope(value);
    if(!intent)return {actionId:'',success:false,reason:'Hành động hoặc payload không hợp lệ.'};
    const payload=readPayload(intent.payload);
    const player = this.players.get(playerId);
    if (!player || !player.isOnline) return { actionId: intent.actionId, success: false, reason: 'Người chơi không tồn tại hoặc đã mất kết nối.' };
    const actionKey = `${playerId}:${intent.actionId}`;
    const fingerprint = JSON.stringify([intent.type, intent.payload ?? null]);
    const previous = this.processedActionIds.get(actionKey);
    if (previous) return previous.fingerprint === fingerprint ? {...previous.ack}
      : {actionId:intent.actionId,success:false,reason:'actionId đã được dùng cho hành động khác.'};
    if (this.isPaused && !['SET_ROLE','HOST_COMMAND'].includes(intent.type))
      return {actionId:intent.actionId,success:false,reason:'Trận đấu đang tạm dừng.'};

    let result: ServerAck;

    switch (intent.type) {
      case 'MOVE':
        result = this.handleMove(player, intent.payload, intent.actionId);
        break;

      case 'SET_ROLE':
        result = this.handleSetRole(player, readString(payload?.role) as PlayerRole, intent.actionId);
        break;

      case 'CANCEL_JOB':
        result = this.handleCancelJob(player, intent.actionId); break;
      case 'PICK_CRATE':
        result = payload?.crateId !== undefined && typeof payload.crateId !== 'string'
          ? {actionId:intent.actionId,success:false,reason:'Kiện này đã được nhặt hoặc không còn trong phạm vi.'}
          : this.itemsCapability.pick(player, readString(payload?.crateId), intent.actionId); break;
      case 'DROP_CRATE':
        result = this.itemsCapability.drop(player, intent.actionId); break;
      case 'RETURN_CRATE':
        result = this.itemsCapability.returnToStock(player, intent.actionId); break;
      case 'CAST_VOTE':
        result = this.votingCapability.cast(player, readString(payload?.plan) ?? '', intent.actionId); break;

      case 'PING_LOCATION':
        result = this.handlePingLocation(player, intent.payload, intent.actionId);
        break;

      default:
        result = this.province.dispatch(player, intent);
    }

    this.processedActionIds.set(actionKey, {fingerprint,ack:{...result}});
    // Bounded per-room receipts, scoped by player; repeat failures are stable too.
    if (this.processedActionIds.size > 2000) {
      const first = this.processedActionIds.keys().next().value;
      if (first) this.processedActionIds.delete(first);
    }

    return result;
  }

  private handleMove(player: Player, value: unknown, actionId: string): ServerAck {
    if (this.isPaused) {
      return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    }

    const payload=readPayload(value);
    if(!payload||typeof payload.x!=='number'||typeof payload.y!=='number'||!Number.isFinite(payload.x)||!Number.isFinite(payload.y))return {actionId,success:false,reason:'MOVE: tọa độ không hợp lệ.'};
    const newX=payload.x,newY=payload.y;

    // Collision check
    const isBridgeBlocked = this.collisionContext();
    if (!isWalkableForMap(this.map.id,newX,newY,isBridgeBlocked)) {
      return { actionId, success:false, reason:'Vướng vật cản!' };
    }
    if(payload.path!==undefined&&(!Array.isArray(payload.path)||payload.path.length>MOVEMENT_CONFIG.maxPacketPoints))return {actionId,success:false,reason:'MOVE: đường đi không hợp lệ.'};
    const path:unknown[]=[...((payload.path??[]) as unknown[]),{x:newX,y:newY}];
    let from:MapPoint=player;
    for(const rawPoint of path){
      const point=readPayload(rawPoint);
      if(!point||typeof point.x!=='number'||typeof point.y!=='number'||!Number.isFinite(point.x)||!Number.isFinite(point.y)||!isMovementSegmentClear(this.map.id,from,{x:point.x,y:point.y},isBridgeBlocked))return {actionId,success:false,reason:'MOVE: đoạn di chuyển đi qua vật cản.'};
      from={x:point.x,y:point.y};
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
    if (payload.dir) player.direction = payload.dir as Player['direction'];
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

  private handlePingLocation(player: Player, value: unknown, actionId: string): ServerAck {
    const payload=readPayload(value);
    const x = Math.round(Number(payload?.x ?? player.x));
    const y = Math.round(Number(payload?.y ?? player.y));
    const poi = Object.values(this.map.points).find(p => distance(x, y, p.x, p.y) <= 100);
    const locationName = poi ? poi.name : `vị trí (${x}, ${y})`;
    this.addAuditEvent('PLAYER', `${player.name} 📍 đã phát tín hiệu tại ${locationName}!`, player.id);
    return { actionId, success: true };
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

    const projection=this.province.projection();
    const servedCount = projection.citizens.filter(c => c.served).length;

    return {
      objectiveProgress:projection.objectiveProgress,
      roomCode: this.roomCode,
      mapId: this.map.id,
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
      citizens: projection.citizens,
      citizensServedCount: servedCount,
      totalCitizensCount: projection.citizens.length,
      m1: projection.m1,
      m2: projection.m2,
      m3: projection.m3,
      voting: this.voting ? { ...this.voting } : null,
      totalScore: this.totalScore,
      recentAuditEvents: [...this.recentAuditEvents.slice(0, 20)],
      practiceCompleted: this.practiceCompleted,
      practiceCrateDelivered: this.practiceCrateDelivered,
      ruleVersion: this.ruleVersion,
      hatinhState: projection.hatinhState,
      ninhBinhState: projection.ninhBinhState,
      quangNinhState: projection.quangNinhState,
      haiPhongState: projection.haiPhongState,
      thanhHoaState: projection.thanhHoaState,
      ngheAnState: projection.ngheAnState
    };
  }
}
