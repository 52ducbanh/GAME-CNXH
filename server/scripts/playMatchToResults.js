import { io } from 'socket.io-client';
import { POINTS_OF_INTEREST } from 'shared';

const socket = io('http://localhost:3000');

let latestSnapshot = null;
socket.on('room_snapshot', (snapshot) => {
  latestSnapshot = snapshot;
});

socket.on('connect', () => {
  socket.emit('join_room', {
    roomCode: 'HANOI_01',
    playerName: 'Đồng chí Đội trưởng',
    isHost: true
  });
});

socket.on('joined_room', async (data) => {
  latestSnapshot = data.snapshot;
  console.log('Player joined room, hostToken:', data.hostToken);

  let aid = 1;
  const send = (intent) => new Promise((resolve, reject) => {
    const actId = `act_${Date.now()}_${aid++}`;
    socket.emit('client_intent', { ...intent, actionId: actId }, (ack) => {
      if (!ack || !ack.success) {
        console.error(`Intent FAILED [${intent.type}]:`, ack?.reason);
        reject(new Error(ack?.reason || 'Intent failed'));
      } else {
        resolve(ack);
      }
    });
  });

  const sendHost = (command) => new Promise((resolve, reject) => {
    socket.emit('host_command', { command, hostToken: data.hostToken }, (ack) => {
      if (!ack || !ack.success) {
        console.error(`Host command FAILED [${command}]:`, ack?.reason);
        reject(new Error(ack?.reason || 'Host command failed'));
      } else {
        resolve(ack);
      }
    });
  });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const waitFor = (predicate, label, timeoutMs = 25000) => new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (latestSnapshot && predicate(latestSnapshot)) {
        return resolve(latestSnapshot);
      }
      if (Date.now() - start > timeoutMs) {
        return reject(new Error(`Timeout waiting for: ${label}`));
      }
      setTimeout(check, 100);
    };
    check();
  });

  // Reset then Start running
  await sendHost('RESET');
  await sleep(150);
  await sendHost('START');
  await sleep(150);
  await sendHost('SKIP_BRIEFING');
  await sleep(150);
  await sendHost('SKIP_PRACTICE');
  await sleep(150);
  await sendHost('RESUME');
  await waitFor((s) => s.phase === 'RUNNING', 'phase RUNNING');
  console.log('Game phase is RUNNING.');

  // M1: Survey A, B, C
  console.log('Starting M1 surveys...');
  await send({ actionId: 'm_a', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.ZONE_A.x, y: POINTS_OF_INTEREST.ZONE_A.y } });
  await send({ actionId: 's_a', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_A' } });
  await waitFor((s) => s.m1.surveys.A, 'Survey A complete');
  console.log('Survey A done.');

  await send({ actionId: 'm_b', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.ZONE_B.x, y: POINTS_OF_INTEREST.ZONE_B.y } });
  await send({ actionId: 's_b', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_B' } });
  await waitFor((s) => s.m1.surveys.B, 'Survey B complete');
  console.log('Survey B done.');

  await send({ actionId: 'm_c', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.ZONE_C.x, y: POINTS_OF_INTEREST.ZONE_C.y } });
  await send({ actionId: 's_c', type: 'START_JOB', payload: { type: 'SURVEY_ZONE', targetId: 'ZONE_C' } });
  await waitFor((s) => s.m1.surveys.C, 'Survey C complete');
  console.log('Survey C done.');

  // Propose & Commit FIXED at HQ
  await send({ actionId: 'm_hq', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.HEADQUARTERS.x, y: POINTS_OF_INTEREST.HEADQUARTERS.y } });
  await send({ actionId: 'p_m1', type: 'PROPOSE_PLAN', payload: { missionId: 'M1', plan: 'FIXED' } });
  await waitFor((s) => s.m1.planCommitted === 'FIXED', 'M1 plan FIXED committed');
  console.log('M1 Plan FIXED committed.');

  // Deliver 2 crates to Clinic Fixed
  await send({ actionId: 'm_wh1', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y } });
  await send({ actionId: 'pk_1', type: 'PICK_CRATE' });
  await send({ actionId: 'm_cf1', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.CLINIC_FIXED.x, y: POINTS_OF_INTEREST.CLINIC_FIXED.y } });
  await send({ actionId: 'del_1', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_FIXED' } });

  await send({ actionId: 'm_wh2', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y } });
  await send({ actionId: 'pk_2', type: 'PICK_CRATE' });
  await send({ actionId: 'm_cf2', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.CLINIC_FIXED.x, y: POINTS_OF_INTEREST.CLINIC_FIXED.y } });
  await send({ actionId: 'del_2', type: 'DELIVER_CRATE', payload: { targetId: 'CLINIC_FIXED' } });
  console.log('Delivered 2 crates to Clinic Fixed.');

  // Deploy Fixed
  await send({ actionId: 'dep_f', type: 'START_JOB', payload: { type: 'DEPLOY_FIXED_CLINIC', targetId: 'CLINIC_FIXED' } });
  await waitFor((s) => s.m1.fixedDeployed, 'Clinic Fixed deployed');
  console.log('Clinic Fixed deployed.');

  // Verify Fixed
  await send({ actionId: 'ver_f', type: 'START_JOB', payload: { type: 'AUDIT_RESULT', targetId: 'CLINIC_FIXED' } });
  await waitFor((s) => s.m1.verifiedA, 'Clinic Fixed verified');
  console.log('Clinic Fixed verified.');

  // Publish M1 Notice
  await send({ actionId: 'm_nb1', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.NOTICE_BOARD.x, y: POINTS_OF_INTEREST.NOTICE_BOARD.y } });
  await send({ actionId: 'pub_1', type: 'PUBLISH_NOTICE', payload: { missionId: 'M1' } });
  await waitFor((s) => s.m1.status === 'RESOLVED', 'M1 status RESOLVED');
  console.log('M1 Completed! M2 activated.');

  // M2: REPAIR
  await send({ actionId: 'm_br1', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.BRIDGE_TASK_1.x, y: POINTS_OF_INTEREST.BRIDGE_TASK_1.y } });
  await send({ actionId: 'sv_br', type: 'START_JOB', payload: { type: 'SURVEY_BRIDGE', targetId: 'BRIDGE' } });
  await waitFor((s) => s.m2.surveyDone, 'Bridge surveyed');
  console.log('Bridge surveyed.');

  // Propose REPAIR at HQ
  await send({ actionId: 'm_hq2', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.HEADQUARTERS.x, y: POINTS_OF_INTEREST.HEADQUARTERS.y } });
  await send({ actionId: 'p_m2', type: 'PROPOSE_PLAN', payload: { missionId: 'M2', plan: 'REPAIR' } });
  await waitFor((s) => s.m2.planCommitted === 'REPAIR', 'M2 plan REPAIR committed');
  console.log('M2 Plan REPAIR committed.');

  // Deliver 2 bridge repair crates
  await send({ actionId: 'm_wh3', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y } });
  await send({ actionId: 'pk_3', type: 'PICK_CRATE' });
  await send({ actionId: 'm_br2', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.BRIDGE_TASK_1.x, y: POINTS_OF_INTEREST.BRIDGE_TASK_1.y } });
  await send({ actionId: 'del_br1', type: 'DELIVER_CRATE', payload: { targetId: 'BRIDGE' } });

  await send({ actionId: 'm_wh4', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y } });
  await send({ actionId: 'pk_4', type: 'PICK_CRATE' });
  await send({ actionId: 'm_br3', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.BRIDGE_TASK_1.x, y: POINTS_OF_INTEREST.BRIDGE_TASK_1.y } });
  await send({ actionId: 'del_br2', type: 'DELIVER_CRATE', payload: { targetId: 'BRIDGE' } });
  console.log('Delivered 2 crates for bridge repair.');

  // Repair tasks
  await send({ actionId: 'm_bt1', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.BRIDGE_TASK_1.x, y: POINTS_OF_INTEREST.BRIDGE_TASK_1.y } });
  await send({ actionId: 'rep_1', type: 'START_JOB', payload: { type: 'REPAIR_BRIDGE_1', targetId: 'BRIDGE_TASK_1' } });
  await waitFor((s) => s.m2.bridgeRepairTask1, 'Bridge Task 1 repaired');
  console.log('Bridge Task 1 repaired.');

  await send({ actionId: 'm_bt2', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.BRIDGE_TASK_2.x, y: POINTS_OF_INTEREST.BRIDGE_TASK_2.y } });
  await send({ actionId: 'rep_2', type: 'START_JOB', payload: { type: 'REPAIR_BRIDGE_2', targetId: 'BRIDGE_TASK_2' } });
  await waitFor((s) => s.m2.bridgeRepaired, 'Bridge fully repaired');
  console.log('Bridge fully repaired! Path to Zone B is open.');

  // Deliver 2 relief crates to B across bridge
  await send({ actionId: 'm_wh5', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y } });
  await send({ actionId: 'pk_5', type: 'PICK_CRATE' });
  await send({ actionId: 'm_zb1', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.ZONE_B.x, y: POINTS_OF_INTEREST.ZONE_B.y } });
  await send({ actionId: 'del_zb1', type: 'DELIVER_CRATE', payload: { targetId: 'ZONE_B' } });

  await send({ actionId: 'm_wh6', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y } });
  await send({ actionId: 'pk_6', type: 'PICK_CRATE' });
  await send({ actionId: 'm_zb2', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.ZONE_B.x, y: POINTS_OF_INTEREST.ZONE_B.y } });
  await send({ actionId: 'del_zb2', type: 'DELIVER_CRATE', payload: { targetId: 'ZONE_B' } });
  console.log('Delivered 2 relief crates to Zone B.');

  // Verify B
  await send({ actionId: 'ver_zb', type: 'START_JOB', payload: { type: 'AUDIT_RESULT', targetId: 'ZONE_B' } });
  await waitFor((s) => s.m2.verifiedB, 'Zone B verified');
  console.log('Zone B verified.');

  // Publish M2 Notice
  await send({ actionId: 'm_nb2', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.NOTICE_BOARD.x, y: POINTS_OF_INTEREST.NOTICE_BOARD.y } });
  await send({ actionId: 'pub_2', type: 'PUBLISH_NOTICE', payload: { missionId: 'M2' } });
  await waitFor((s) => s.m2.status === 'RESOLVED', 'M2 status RESOLVED');
  console.log('M2 Completed! M3 activated.');

  // M3: Human Rights & Elderly Care
  // Receive feedback at C
  await send({ actionId: 'm_zc', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.ZONE_C.x, y: POINTS_OF_INTEREST.ZONE_C.y } });
  await send({ actionId: 'fb_c', type: 'START_JOB', payload: { type: 'RECEIVE_FEEDBACK_C', targetId: 'ZONE_C' } });
  await waitFor((s) => s.m3.receivedFeedbackC, 'Feedback C received');
  console.log('Feedback C received.');

  // Cross-check list at clinic
  await send({ actionId: 'm_cf3', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.CLINIC_FIXED.x, y: POINTS_OF_INTEREST.CLINIC_FIXED.y } });
  await send({ actionId: 'cc_cf', type: 'START_JOB', payload: { type: 'CROSS_CHECK_CLINIC', targetId: 'CLINIC_FIXED' } });
  await waitFor((s) => s.m3.crossCheckedList, 'Cross-checked list at clinic');
  console.log('Cross-checked list at clinic.');

  // Confirm M3 plan at HQ
  await send({ actionId: 'm_hq3', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.HEADQUARTERS.x, y: POINTS_OF_INTEREST.HEADQUARTERS.y } });
  await send({ actionId: 'conf_3', type: 'CONFIRM_M3_PLAN' });
  await waitFor((s) => s.m3.planConfirmed, 'M3 plan confirmed');
  console.log('M3 plan confirmed.');

  // Deliver & Deploy C1
  await send({ actionId: 'm_wh7', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y } });
  await send({ actionId: 'pk_7', type: 'PICK_CRATE' });
  await send({ actionId: 'm_c1', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.CITIZEN_C1.x, y: POINTS_OF_INTEREST.CITIZEN_C1.y } });
  await send({ actionId: 'del_c1', type: 'DELIVER_CRATE', payload: { targetId: 'CITIZEN_C1' } });
  await send({ actionId: 'dep_c1', type: 'START_JOB', payload: { type: 'SUPPORT_CITIZEN', targetId: 'CITIZEN_C1' } });
  await waitFor((s) => s.m3.deployedC1, 'Citizen C1 supported');
  console.log('Citizen C1 supported.');

  // Deliver & Deploy C2
  await send({ actionId: 'm_wh8', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y } });
  await send({ actionId: 'pk_8', type: 'PICK_CRATE' });
  await send({ actionId: 'm_c2', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.CITIZEN_C2.x, y: POINTS_OF_INTEREST.CITIZEN_C2.y } });
  await send({ actionId: 'del_c2', type: 'DELIVER_CRATE', payload: { targetId: 'CITIZEN_C2' } });
  await send({ actionId: 'dep_c2', type: 'START_JOB', payload: { type: 'SUPPORT_CITIZEN', targetId: 'CITIZEN_C2' } });
  await waitFor((s) => s.m3.deployedC2, 'Citizen C2 supported');
  console.log('Citizen C2 supported.');

  // Audit ledger at warehouse
  await send({ actionId: 'm_wh9', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.WAREHOUSE.x, y: POINTS_OF_INTEREST.WAREHOUSE.y } });
  await send({ actionId: 'aud_led', type: 'START_JOB', payload: { type: 'AUDIT_LEDGER', targetId: 'WAREHOUSE' } });
  await waitFor((s) => s.m3.lossAuditDone, 'Ledger loss audit completed');
  console.log('Ledger loss audit completed.');

  // Publish M3 Notice
  await send({ actionId: 'm_nb3', type: 'MOVE', payload: { x: POINTS_OF_INTEREST.NOTICE_BOARD.x, y: POINTS_OF_INTEREST.NOTICE_BOARD.y } });
  await send({ actionId: 'pub_3', type: 'PUBLISH_NOTICE', payload: { missionId: 'M3' } });
  await waitFor((s) => s.phase === 'RESULTS', 'Match reached phase RESULTS');

  console.log('========================================================');
  console.log(`ALL 3 MISSIONS COMPLETED! SCORE: ${latestSnapshot.totalScore}/100`);
  console.log('Citizens served:', latestSnapshot.citizensServedCount, '/', latestSnapshot.totalCitizensCount);
  console.log('Audit events recorded:', latestSnapshot.auditEvents.length);
  console.log('========================================================');
  console.log('Keeping room open at RESULTS phase for inspection/screenshots...');
  await sleep(90000);
  socket.disconnect();
  process.exit(0);
});
