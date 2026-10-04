import { ClientIntent, GameSnapshot } from './types.js';
import { INTERACTION_RADIUS, PLAN_COSTS } from './constants.js';
import { getGameMap } from './worldMaps.js';

export type InteractionType = 'NPC' | 'ITEM' | 'DEVICE' | 'OBJECTIVE' | 'CARRYABLE' | 'GENERIC';
export interface InteractionAction {
  id: string;
  targetId: string;
  label: string;
  description?: string;
  type: InteractionType;
  x: number;
  y: number;
  range: number;
  priority: number;
  available: boolean;
  serverValidation: true;
  intent: Omit<ClientIntent, 'actionId'>;
}
export interface InteractionContext { primary: InteractionAction | null; secondary: InteractionAction | null; choices: InteractionAction[] }

// One catalogue for prompts, drawer choices and server eligibility. Only available
// actions are returned; snapshots never replace authoritative validation on arrival.
export function getInteractionActions(s: GameSnapshot, playerId: string): InteractionAction[] {
  const p = s.players[playerId], map = getGameMap(s.mapId), actions: InteractionAction[] = [];
  if (!p?.isOnline || p.roomCode !== s.roomCode || s.isPaused) return actions;
  const add = (targetId: string, label: string, intent: InteractionAction['intent'], priority = 80, type: InteractionType = 'OBJECTIVE', point = map.points[targetId]) => {
    if (!point) return;
    actions.push({ id: `${targetId}:${intent.type}:${JSON.stringify(intent.payload ?? {})}`, targetId, label, intent, priority, type: targetId.startsWith('ZONE_') || targetId.startsWith('CITIZEN_') ? 'NPC' : type,
      description: intent.type === 'PROPOSE_PLAN' ? ({
        FIXED: 'Phục vụ 22 dân (A12, B10, C0). Ít chuyến đi; Khu C chưa tiếp cận.',
        MOBILE: 'Phục vụ 24 dân (A10, B8, C6). Ngân sách thấp hơn, cần nhiều chuyến vận chuyển.',
        REPAIR: 'Khôi phục cầu và tuyến ngắn sang Khu B; vật tư gồm 2 kiện sửa và 2 kiện cứu trợ.',
        DETOUR: 'Tiết kiệm ngân sách; cầu vẫn hỏng, đi tuyến vòng dài hơn và giao 2 kiện cứu trợ.'
      } as Record<string,string>)[intent.payload.plan] : undefined,
      x: point.x, y: point.y, range: INTERACTION_RADIUS, available: true, serverValidation: true });
  };
  const job = (target: string, type: string, label: string, manpower = false) => {
    if (manpower && s.manpower.busy >= s.manpower.total) return;
    if (Object.values(s.players).some(peer => peer.activeJob?.type === type && peer.activeJob.targetId === target)) return;
    add(target, label, { type: 'START_JOB', payload: { type, targetId: target } });
  };
  const carry = p.carriedCrateId && s.crates[p.carriedCrateId];
  const ownsCarry = !!carry && carry.state === 'CARRIED' && carry.carriedByPlayerId === p.id;
  const deliver = (target: string) => { if (ownsCarry) add(target, 'Giao vật tư', { type: 'DELIVER_CRATE', payload: { targetId: target } }, 100, 'CARRYABLE'); };
  if (p.activeJob) return actions;
  if (ownsCarry) add('WAREHOUSE', 'Trả vật tư về kho', { type: 'RETURN_CRATE' }, 90, 'CARRYABLE');
  else if (!p.carriedCrateId) {
    if (s.resources.availableCrates > 0 && Object.values(s.crates).some(c => c.state === 'WAREHOUSE')) add('WAREHOUSE', 'Lấy vật tư', { type: 'PICK_CRATE' }, 60, 'ITEM');
    for (const c of Object.values(s.crates)) if (c.state === 'DROPPED' && !c.carriedByPlayerId)
      add(c.id, 'Nhặt vật tư', { type: 'PICK_CRATE', payload: { crateId: c.id } }, 90, 'ITEM', { ...map.points.WAREHOUSE, x: c.x, y: c.y });
  }
  if (s.phase === 'PRACTICE') {
    if (!s.practiceCrateDelivered) deliver('PRACTICE_TARGET');
    else if (!s.practiceCompleted) job('PRACTICE_TARGET', 'PRACTICE_SAMPLE_JOB', 'Thực hành thao tác');
    return actions;
  }
  if (s.phase !== 'RUNNING') return actions;
  if (s.mapId === 'ha-tinh' && s.hatinhState) {
    addHatinhActions(s, playerId, actions, add);
    if (s.m1.planCommitted !== 'NONE') {
      const clinics: [string, number, boolean, boolean, string][] = s.m1.planCommitted === 'FIXED'
        ? [['CLINIC_FIXED', s.m1.deliveredCratesFixed, s.m1.fixedDeployed, s.m1.verifiedA, 'DEPLOY_FIXED_CLINIC']]
        : s.m1.planCommitted === 'MOBILE' ? [['CLINIC_MOBILE_B', s.m1.deliveredCratesMobileB, s.m1.mobileBDeployed, s.m1.verifiedB, 'DEPLOY_MOBILE_CLINIC'], ['CLINIC_MOBILE_C', s.m1.deliveredCratesMobileC, s.m1.mobileCDeployed, s.m1.verifiedC, 'DEPLOY_MOBILE_CLINIC']] : [];
      for (const [id, count, deployed, verified, type] of clinics) {
        if (count < 2) deliver(id);
        else if (!deployed) job(id, type, 'Triển khai trạm y tế', true);
        else if (!verified) job(id, 'AUDIT_RESULT', 'Nghiệm thu kết quả');
      }
    }
    return actions;
  }
  const { m1, m2, m3 } = s;
  const propose = (missionId: 'M1' | 'M2', plans: [string, number, string][]) => {
    if (s.voting?.active) return;
    for (const [plan, cost, label] of plans) if (s.resources.currentBudget >= cost)
      add('HEADQUARTERS', label, { type: 'PROPOSE_PLAN', payload: { missionId, plan } }, 70);
  };
  if (m1.status === 'ACTIVE') {
    for (const z of ['A', 'B', 'C'] as const) if (!m1.surveys[z]) job(`ZONE_${z}`, 'SURVEY_ZONE', 'Khảo sát nhu cầu');
    if (m1.planCommitted === 'NONE' && m1.surveys.A && m1.surveys.B && m1.surveys.C)
      propose('M1', [['FIXED', PLAN_COSTS.M1_FIXED.budget, 'Đề xuất trạm cố định (40 ngân sách, 2 kiện)'], ['MOBILE', PLAN_COSTS.M1_MOBILE.budget, 'Đề xuất điểm lưu động (30 ngân sách, 4 kiện)']]);
    const clinics: [string, number, boolean, boolean, string][] = m1.planCommitted === 'FIXED'
      ? [['CLINIC_FIXED', m1.deliveredCratesFixed, m1.fixedDeployed, m1.verifiedA, 'DEPLOY_FIXED_CLINIC']]
      : m1.planCommitted === 'MOBILE' ? [['CLINIC_MOBILE_B', m1.deliveredCratesMobileB, m1.mobileBDeployed, m1.verifiedB, 'DEPLOY_MOBILE_CLINIC'], ['CLINIC_MOBILE_C', m1.deliveredCratesMobileC, m1.mobileCDeployed, m1.verifiedC, 'DEPLOY_MOBILE_CLINIC']] : [];
    for (const [id, count, deployed, verified, type] of clinics) {
      if (count < 2) deliver(id);
      else if (!deployed) job(id, type, 'Triển khai trạm y tế', true);
      else if (!verified) job(id, 'AUDIT_RESULT', 'Nghiệm thu kết quả');
    }
    const ready = m1.planCommitted === 'FIXED' ? m1.fixedDeployed && m1.verifiedA : m1.planCommitted === 'MOBILE' && m1.mobileBDeployed && m1.mobileCDeployed && m1.verifiedB && m1.verifiedC;
    if (ready && !m1.noticePublished) add('NOTICE_BOARD', 'Công khai kết quả', { type: 'PUBLISH_NOTICE', payload: { missionId: 'M1' } });
  }
  if (m2.status === 'ACTIVE') {
    if (!m2.surveyDone) job('BRIDGE', 'SURVEY_BRIDGE', 'Khảo sát sự cố cầu');
    if (m2.surveyDone && m2.planCommitted === 'NONE') propose('M2', [['REPAIR', PLAN_COSTS.M2_REPAIR.budget, 'Đề xuất sửa cầu (25 ngân sách, 4 kiện)'], ['DETOUR', PLAN_COSTS.M2_DETOUR.budget, 'Đề xuất tuyến vòng (10 ngân sách, 2 kiện)']]);
    if (m2.planCommitted === 'REPAIR') {
      if (m2.bridgeCratesDelivered < 2) deliver('BRIDGE');
      else {
        if (!m2.bridgeRepairTask1) job('BRIDGE_TASK_1', 'REPAIR_BRIDGE_1', 'Sửa mố cầu', true);
        if (!m2.bridgeRepairTask2) job('BRIDGE_TASK_2', 'REPAIR_BRIDGE_2', 'Gia cố dầm cầu', true);
      }
    }
    if (m2.reliefCratesDeliveredB < 2) deliver('ZONE_B');
    else if (!m2.verifiedB) job('ZONE_B', 'AUDIT_RESULT', 'Xác minh bàn giao');
    if (m2.reliefCratesDeliveredB >= 2 && m2.verifiedB && (m2.planCommitted !== 'REPAIR' || m2.bridgeRepaired) && !m2.noticePublished)
      add('NOTICE_BOARD', 'Công khai kết quả', { type: 'PUBLISH_NOTICE', payload: { missionId: 'M2' } });
  }
  if (m3.status === 'ACTIVE') {
    if (!m3.receivedFeedbackC) job('ZONE_C', 'RECEIVE_FEEDBACK_C', 'Tiếp nhận phản ánh');
    else if (!m3.crossCheckedList) job(m1.planCommitted === 'MOBILE' ? 'CLINIC_MOBILE_C' : 'CLINIC_FIXED', 'CROSS_CHECK_CLINIC', 'Đối chiếu danh sách');
    if (m3.receivedFeedbackC && m3.crossCheckedList && !m3.planConfirmed && s.resources.currentBudget >= PLAN_COSTS.M3_CONFIRM.budget)
      add('HEADQUARTERS', 'Xác nhận hỗ trợ (20 ngân sách)', { type: 'CONFIRM_M3_PLAN' });
    if (m3.planConfirmed) for (const [id, delivered, deployed] of [['CITIZEN_C1', m3.deliveredC1, m3.deployedC1], ['CITIZEN_C2', m3.deliveredC2, m3.deployedC2]] as const) {
      if (!delivered) deliver(id);
      else if (!deployed) job(id, 'SUPPORT_CITIZEN', 'Chăm sóc tại nhà', true);
    }
    if (!m3.lossAuditDone) job('WAREHOUSE', 'AUDIT_LEDGER', 'Đối chiếu sổ kho');
    if (m3.deployedC1 && m3.deployedC2 && m3.lossAuditDone && !m3.noticePublished)
      add('NOTICE_BOARD', 'Công khai kết quả', { type: 'PUBLISH_NOTICE', payload: { missionId: 'M3' } });
  }
  return actions;
}

function addHatinhActions(
  s: GameSnapshot,
  playerId: string,
  actions: InteractionAction[],
  add: (targetId: string, label: string, intent: InteractionAction['intent'], priority?: number, type?: InteractionType) => void
) {
  const ht = s.hatinhState;
  if (!ht) return;
  const { va, dg, dl } = ht;

  // Quest 1: Vũng Áng
  if (ht.currentQuest === 1 || va.status === 'ACTIVE') {
    if (!va.tuanReported) {
      add('WORKER_TUAN', 'Tiếp nhận phản ánh (Tuấn)', { type: 'HATINH_ACTION', payload: { action: 'VA_REPORT_TUAN' } }, 95, 'NPC');
    } else {
      if (!va.cameraDeployed) {
        add('CAMERA', 'Triển khai camera giám sát', { type: 'HATINH_ACTION', payload: { action: 'VA_DEPLOY_CAMERA' } }, 90, 'DEVICE');
      }
      if (!va.spillCleaned) {
        add('SPILL', 'Thu dọn vật liệu rơi vãi', { type: 'HATINH_ACTION', payload: { action: 'VA_CLEAN_SPILL' } }, 90, 'OBJECTIVE');
      }
      if (!va.trafficDiverted) {
        add('TRAFFIC_VA', 'Phân luồng xe quá tải', { type: 'HATINH_ACTION', payload: { action: 'VA_DIVERT_TRAFFIC' } }, 90, 'OBJECTIVE');
      } else {
        if (!va.weighed) {
          add('WEIGH_STATION', 'Vận hành trạm cân tải trọng', { type: 'HATINH_ACTION', payload: { action: 'VA_WEIGH_TRUCK' } }, 90, 'DEVICE');
        } else if (!va.inspectedBang) {
          add('INSPECTION_BANG', 'Kiểm tra tải trọng (Bàng)', { type: 'HATINH_ACTION', payload: { action: 'VA_INSPECT_BANG' } }, 90, 'NPC');
        } else if (!va.dossierPrepared) {
          add('INSPECTION_BANG', 'Lập biên bản vi phạm tải trọng', { type: 'HATINH_ACTION', payload: { action: 'VA_PREPARE_DOSSIER' } }, 90, 'OBJECTIVE');
        } else if (!va.negotiatedDoan) {
          add('DOSSIER_DOAN', 'Làm việc với chủ xe / doanh nghiệp (Doãn)', { type: 'HATINH_ACTION', payload: { action: 'VA_NEGOTIATE_DOAN' } }, 90, 'NPC');
        }
      }
      if (va.negotiatedDoan && va.spillCleaned && va.cameraDeployed && !va.routeReopened) {
        add('TRAFFIC_VA', 'Mở lại tuyến đường an toàn', { type: 'HATINH_ACTION', payload: { action: 'VA_REOPEN_ROUTE' } }, 95, 'OBJECTIVE');
      }
    }
  }

  // Quest 2: Đèo Ngang
  if (ht.currentQuest === 2 || dg.status === 'ACTIVE' || dg.status === 'GATHERING' || dg.status === 'COUNTDOWN') {
    if (dg.status === 'NOT_STARTED') {
      add('DEO_GATHER', 'Kích hoạt cảnh báo Đèo Ngang', { type: 'HATINH_ACTION', payload: { action: 'DG_TRIGGER_ALERT' } }, 95, 'OBJECTIVE');
    } else if (dg.status === 'GATHERING') {
      if (!dg.readyPlayers.includes(playerId)) {
        add('RESCUE_STAGING', 'Sẵn sàng ứng cứu (Ready)', { type: 'HATINH_ACTION', payload: { action: 'DG_READY_CHECK' } }, 95, 'OBJECTIVE');
      } else {
        add('RESCUE_STAGING', 'Hủy sẵn sàng', { type: 'HATINH_ACTION', payload: { action: 'DG_CANCEL_READY' } }, 80, 'OBJECTIVE');
      }
      add('RESCUE_STAGING', 'Báo hiệu tập hợp toàn đội', { type: 'HATINH_ACTION', payload: { action: 'DG_SUMMON_TEAM' } }, 70, 'GENERIC');
    } else if (dg.status === 'ACTIVE') {
      if (!dg.barrierA) {
        add('RESCUE_TRAFFIC_A', 'Chốt chặn phân luồng Bắc (Traffic A)', { type: 'HATINH_ACTION', payload: { action: 'DG_SET_BARRIER_A' } }, 90, 'OBJECTIVE');
      }
      if (!dg.barrierB) {
        add('RESCUE_TRAFFIC_B', 'Chốt chặn phân luồng Nam (Traffic B)', { type: 'HATINH_ACTION', payload: { action: 'DG_SET_BARRIER_B' } }, 90, 'OBJECTIVE');
      }
      if (!dg.roadLight) {
        add('RESCUE_TECH', 'Bật đèn pha chiếu sáng mặt đường', { type: 'HATINH_ACTION', payload: { action: 'DG_TURN_ROAD_LIGHT' } }, 90, 'DEVICE');
      } else if (!dg.ravineLight) {
        add('RESCUE_TECH', 'Rọi đèn pha xuống lòng vực', { type: 'HATINH_ACTION', payload: { action: 'DG_TURN_RAVINE_LIGHT' } }, 90, 'DEVICE');
      }
      if (!dg.anchorReady) {
        add('RESCUE_TECH', 'Đóng điểm neo chịu lực (Anchor)', { type: 'HATINH_ACTION', payload: { action: 'DG_SET_ANCHOR' } }, 90, 'OBJECTIVE');
      } else if (!dg.ropeReady) {
        add('RESCUE_TECH', 'Thả dây cứu hộ xuống vực (Rope)', { type: 'HATINH_ACTION', payload: { action: 'DG_SET_ROPE' } }, 90, 'ITEM');
      }
      if (!dg.winchReady) {
        add('RESCUE_WINCH', 'Kiểm tra & chuẩn bị tời cứu nạn (Winch)', { type: 'HATINH_ACTION', payload: { action: 'DG_CHECK_WINCH' } }, 90, 'DEVICE');
      }

      const canDescend = dg.barrierA && dg.barrierB && dg.roadLight && dg.ravineLight && dg.anchorReady && dg.ropeReady && dg.winchReady;
      if (canDescend && !dg.rescuerDown) {
        add('RESCUE_WINCH', 'Cứu nạn viên đu dây xuống vực', { type: 'HATINH_ACTION', payload: { action: 'DG_DESCEND_RESCUER' } }, 95, 'OBJECTIVE');
      }

      if (dg.rescuerDown) {
        if (!dg.namComforted) {
          add('RESCUE_NAM', 'Trấn an nạn nhân Nam', { type: 'HATINH_ACTION', payload: { action: 'DG_COMFORT_NAM' } }, 90, 'NPC');
        }
        if (!dg.bikeHazardSecured) {
          add('RESCUE_NAM', 'Ngắt điện & khóa van xăng xe máy', { type: 'HATINH_ACTION', payload: { action: 'DG_SECURE_BIKE' } }, 90, 'OBJECTIVE');
        }
        if (dg.namComforted && !dg.firstAidGiven) {
          add('RESCUE_NAM', 'Sơ cứu vết thương cho Nam', { type: 'HATINH_ACTION', payload: { action: 'DG_FIRST_AID' } }, 90, 'ITEM');
        }
        if (dg.firstAidGiven && !dg.namSplinted) {
          add('RESCUE_NAM', 'Cố định nẹp đùi & đeo đai cứu hộ', { type: 'HATINH_ACTION', payload: { action: 'DG_SPLINT_NAM' } }, 90, 'ITEM');
        }
        if (dg.namSplinted && dg.bikeHazardSecured && !dg.readyToWinch) {
          add('RESCUE_NAM', 'Phát tín hiệu sẵn sàng kéo tời', { type: 'HATINH_ACTION', payload: { action: 'DG_SIGNAL_READY_WINCH' } }, 95, 'OBJECTIVE');
        }
      }

      if (!dg.receptionReady) {
        add('RESCUE_MEDICAL', 'Chuẩn bị cáng & đón tiếp y tế', { type: 'HATINH_ACTION', payload: { action: 'DG_PREP_RECEPTION' } }, 90, 'OBJECTIVE');
      }
      if (dg.readyToWinch && !dg.namLifted) {
        add('RESCUE_WINCH', `Vận hành tời kéo cáng lên (${dg.winchProgress}%)`, { type: 'HATINH_ACTION', payload: { action: 'DG_OPERATE_WINCH' } }, 95, 'DEVICE');
      }
      if (dg.namLifted && dg.receptionReady && !dg.medicalReceived) {
        add('RESCUE_MEDICAL', 'Bàn giao Nam cho đội ngũ y tế', { type: 'HATINH_ACTION', payload: { action: 'DG_HANDOVER_MEDICAL' } }, 95, 'NPC');
      }
      if (dg.medicalReceived) {
        if (!dg.rescuerSafe) {
          add('RESCUE_WINCH', 'Kéo cứu nạn viên lên an toàn', { type: 'HATINH_ACTION', payload: { action: 'DG_RECOVER_RESCUER' } }, 90, 'OBJECTIVE');
        }
        if (!dg.bikeRecovered) {
          add('RESCUE_WINCH', 'Trục vớt xe máy khỏi lòng vực', { type: 'HATINH_ACTION', payload: { action: 'DG_RECOVER_BIKE' } }, 90, 'OBJECTIVE');
        }
      }
    }
  }

  // Quest 3: Đồng Lộc
  if (ht.currentQuest === 3 || dl.status === 'ACTIVE') {
    if (!dl.tungBriefed) {
      add('DONG_LOC_TUNG', 'Gặp Bác Tùng tiếp nhận nhiệm vụ di tích', { type: 'HATINH_ACTION', payload: { action: 'DL_BRIEF_TUNG' } }, 95, 'NPC');
    } else {
      if (!dl.sauVerified) {
        add('DONG_LOC_SAU', 'Nhắc nhở & thu ấn phẩm mê tín (Mụ Sáu)', { type: 'HATINH_ACTION', payload: { action: 'DL_VERIFY_SAU' } }, 90, 'NPC');
      }
      if (!dl.teoVerified) {
        add('DONG_LOC_TEO', 'Ngăn chặn đổi tiền lẻ trái phép 30% (Tèo)', { type: 'HATINH_ACTION', payload: { action: 'DL_VERIFY_TEO' } }, 90, 'NPC');
      }
      if (dl.sauVerified && dl.teoVerified && !dl.dossierFiled) {
        add('DONG_LOC_TUNG', 'Bàn giao tang vật và lập biên bản xử lý', { type: 'HATINH_ACTION', payload: { action: 'DL_FILE_DOSSIER' } }, 90, 'OBJECTIVE');
      }
      if (!dl.flowOrganized) {
        add('DONG_LOC_FLOW', 'Phân luồng dòng người viếng trật tự', { type: 'HATINH_ACTION', payload: { action: 'DL_ORGANIZE_FLOW' } }, 90, 'OBJECTIVE');
      }
      if (!dl.haiAssisted) {
        add('DONG_LOC_HAI', 'Hỗ trợ Bác Hải đón đoàn cựu chiến binh', { type: 'HATINH_ACTION', payload: { action: 'DL_ASSIST_HAI' } }, 90, 'NPC');
      }
      if (!dl.incenseSupplied) {
        add('DONG_LOC_ALTAR', 'Phát hương hoa & hướng dẫn dâng hương', { type: 'HATINH_ACTION', payload: { action: 'DL_SUPPLY_INCENSE' } }, 90, 'OBJECTIVE');
      }
      if (!dl.tiktokerCorrected) {
        add('DONG_LOC_TIKTOKER', 'Chấn chỉnh TikToker livestream sai lệch', { type: 'HATINH_ACTION', payload: { action: 'DL_CORRECT_TIKTOKER' } }, 90, 'NPC');
      }
      if (dl.dossierFiled && dl.flowOrganized && dl.haiAssisted && dl.incenseSupplied && dl.tiktokerCorrected) {
        add('DONG_LOC_TUNG', 'Báo cáo hoàn thành nhiệm vụ Đồng Lộc', { type: 'HATINH_ACTION', payload: { action: 'DL_COMPLETE_MISSION' } }, 98, 'NPC');
      }
    }
  }
}

export function resolveInteraction(s: GameSnapshot, playerId: string, position: {x:number;y:number} = s.players[playerId], previousId?: string): InteractionContext {
  const p = s.players[playerId];
  if (!p?.isOnline || !position || s.isPaused) return { primary: null, secondary: null, choices: [] };
  const distance = (a: InteractionAction) => Math.hypot(position.x - a.x, position.y - a.y);
  const nearby = getInteractionActions(s, playerId).filter(a => distance(a) <= a.range && Math.hypot(p.x - a.x, p.y - a.y) <= a.range);
  nearby.sort((a, b) => b.priority - a.priority || distance(a) - distance(b) || a.id.localeCompare(b.id));
  let primary = nearby[0] ?? null;
  const previous = nearby.find(a => a.id === previousId);
  if (previous && primary && previous.priority === primary.priority && distance(previous) <= distance(primary) + 12) primary = previous;
  const choices = primary ? nearby.filter(a => a.targetId === primary.targetId && a.intent.type === 'PROPOSE_PLAN') : [];
  const carried = p.carriedCrateId && s.crates[p.carriedCrateId];
  const intent: InteractionAction['intent'] = p.activeJob ? { type: 'CANCEL_JOB' }
    : carried && carried.state === 'CARRIED' && carried.carriedByPlayerId === p.id ? { type: 'DROP_CRATE' }
    : { type: 'PING_LOCATION', payload: { x: p.x, y: p.y } };
  const secondary: InteractionAction = { id: `secondary:${intent.type}`, targetId: p.id, label: p.activeJob ? 'Hủy công việc' : intent.type === 'DROP_CRATE' ? 'Đặt vật tư' : 'Báo hiệu',
    type: 'GENERIC', x: p.x, y: p.y, range: 0, priority: 0, available: true, serverValidation: true, intent };
  return { primary, secondary, choices };
}
