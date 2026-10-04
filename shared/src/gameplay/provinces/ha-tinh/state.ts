export interface HatinhState {
  activeScene: 'main' | 'rescue';
  currentQuest: 1 | 2 | 3;
  va: {
    status: 'NOT_STARTED' | 'ACTIVE' | 'RESOLVED';
    tuanReported: boolean;
    cameraDeployed: boolean;
    spillCleaned: boolean;
    trafficDiverted: boolean;
    weighed: boolean;
    inspectedBang: boolean;
    dossierPrepared: boolean;
    negotiatedDoan: boolean;
    routeReopened: boolean;
    score: number;
  };
  dg: {
    status: 'NOT_STARTED' | 'GATHERING' | 'COUNTDOWN' | 'ACTIVE' | 'RESOLVED';
    gatherTimeStarted?: number;
    readyPlayers: string[];
    countdownRemaining: number;
    timeOfDay: 'day' | 'afternoon' | 'dusk';
    barrierA: boolean;
    barrierB: boolean;
    roadLight: boolean;
    ravineLight: boolean;
    anchorReady: boolean;
    ropeReady: boolean;
    winchReady: boolean;
    rescuerDown: boolean;
    rescuerPlayerId?: string;
    namComforted: boolean;
    bikeHazardSecured: boolean;
    firstAidGiven: boolean;
    namSplinted: boolean;
    readyToWinch: boolean;
    winchOperating: boolean;
    winchOperatorId?: string;
    winchProgress: number;
    winchSignal: 'PULL' | 'HOLD' | 'STOP';
    namLifted: boolean;
    receptionReady: boolean;
    medicalReceived: boolean;
    rescuerSafe: boolean;
    bikeRecovered: boolean;
    score: number;
  };
  dl: {
    status: 'NOT_STARTED' | 'ACTIVE' | 'RESOLVED';
    tungBriefed: boolean;
    sauVerified: boolean;
    teoVerified: boolean;
    dossierFiled: boolean;
    flowOrganized: boolean;
    haiAssisted: boolean;
    incenseSupplied: boolean;
    tiktokerCorrected: boolean;
    score: number;
  };
  readonly score: {
    va: number;
    dg: number;
    dl: number;
    total: number;
  };
}

export function selectHatinhScore(state:Pick<HatinhState,'va'|'dg'|'dl'>){
  const va=Math.min(30,Math.max(0,state.va.score)),dg=Math.min(35,Math.max(0,state.dg.score)),dl=Math.min(35,Math.max(0,state.dl.score));
  return {va,dg,dl,total:va+dg+dl};
}
export function selectHatinhStatuses(state:Pick<HatinhState,'va'|'dg'|'dl'>){
  type Status='LOCKED'|'ACTIVE'|'RESOLVED';
  return {
    medicalService:(state.va.status==='RESOLVED'?'RESOLVED':state.va.status==='ACTIVE'?'ACTIVE':'LOCKED') as Status,
    bridgeResponse:(state.dg.status==='RESOLVED'?'RESOLVED':['ACTIVE','GATHERING','COUNTDOWN'].includes(state.dg.status)?'ACTIVE':'LOCKED') as Status,
    citizenRights:(state.dl.status==='RESOLVED'?'RESOLVED':state.dl.status==='ACTIVE'?'ACTIVE':'LOCKED') as Status,
  };
}
