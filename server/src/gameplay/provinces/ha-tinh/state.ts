import type { HatinhState } from 'shared';
import { selectHatinhScore } from 'shared';
export function createHatinhState():HatinhState {
    const state:Omit<HatinhState,'score'> = {
      activeScene: 'main',
      currentQuest: 1,
      va: {
        status: 'ACTIVE',
        tuanReported: false,
        cameraDeployed: false,
        spillCleaned: false,
        trafficDiverted: false,
        weighed: false,
        inspectedBang: false,
        dossierPrepared: false,
        negotiatedDoan: false,
        routeReopened: false,
        score: 0
      },
      dg: {
        status: 'NOT_STARTED',
        readyPlayers: [],
        countdownRemaining: 0,
        timeOfDay: 'day',
        barrierA: false,
        barrierB: false,
        roadLight: false,
        ravineLight: false,
        anchorReady: false,
        ropeReady: false,
        winchReady: false,
        rescuerDown: false,
        namComforted: false,
        bikeHazardSecured: false,
        firstAidGiven: false,
        namSplinted: false,
        readyToWinch: false,
        winchOperating: false,
        winchProgress: 0,
        winchSignal: 'HOLD',
        namLifted: false,
        receptionReady: false,
        medicalReceived: false,
        rescuerSafe: false,
        bikeRecovered: false,
        score: 0
      },
      dl: {
        status: 'NOT_STARTED',
        tungBriefed: false,
        sauVerified: false,
        teoVerified: false,
        dossierFiled: false,
        flowOrganized: false,
        haiAssisted: false,
        incenseSupplied: false,
        tiktokerCorrected: false,
        score: 0
      },
    };
    return Object.defineProperty(state,'score',{enumerable:true,get:()=>selectHatinhScore(state)}) as HatinhState;
}
