import type { StartTaskType } from '../../core/commands.js';
import type { CatalogueContext } from '../../core/interactions.js';
export function appendHatinhActions(context:CatalogueContext){
  const {s,add,job,deliver}=context;
  addHatinhActions(context);
    if (s.m1.planCommitted !== 'NONE') {
      const clinics: [string, number, boolean, boolean, StartTaskType][] = s.m1.planCommitted === 'FIXED'
        ? [['CLINIC_FIXED', s.m1.deliveredCratesFixed, s.m1.fixedDeployed, s.m1.verifiedA, 'DEPLOY_FIXED_CLINIC']]
        : s.m1.planCommitted === 'MOBILE' ? [['CLINIC_MOBILE_B', s.m1.deliveredCratesMobileB, s.m1.mobileBDeployed, s.m1.verifiedB, 'DEPLOY_MOBILE_CLINIC'], ['CLINIC_MOBILE_C', s.m1.deliveredCratesMobileC, s.m1.mobileCDeployed, s.m1.verifiedC, 'DEPLOY_MOBILE_CLINIC']] : [];
      for (const [id, count, deployed, verified, type] of clinics) {
        if (count < 2) deliver(id);
        else if (!deployed) job(id, type, 'Triển khai trạm y tế', true);
        else if (!verified) job(id, 'AUDIT_RESULT', 'Nghiệm thu kết quả');
      }
    }
}
function addHatinhActions({s,playerId,actions,add}:CatalogueContext) {
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

