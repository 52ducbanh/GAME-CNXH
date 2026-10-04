import type { GameSnapshot } from '../../../types.js';
import type { MissionGuide } from '../../core/guide.js';
import type { ProvinceView } from '../../core/contracts.js';
import { publicServiceView } from '../../presets/public-service/view.js';
import { haTinh } from './definition.js';
export function hatinhView(s:GameSnapshot,guide:MissionGuide):ProvinceView {
  const view=publicServiceView(s,haTinh,guide),ht=s.hatinhState;
  if(!ht)return view;
  const marker=(pointId:string,color:string,size=16)=>view.markers.push({pointId,done:color==='#22c55e',color,size});
      if(ht.currentQuest===1){
        marker('WORKER_TUAN',ht.va.tuanReported?'#22c55e':'#f59e0b');
        marker('CAMERA',ht.va.cameraDeployed?'#22c55e':'#3b82f6');
        marker('SPILL',ht.va.spillCleaned?'#22c55e':'#ef4444');
        marker('TRAFFIC_VA',ht.va.trafficDiverted?'#22c55e':'#f59e0b');
        marker('WEIGH_STATION',ht.va.weighed?'#22c55e':'#8b5cf6');
      } else if(ht.currentQuest===2){
        marker('RESCUE_STAGING',ht.dg.status==='ACTIVE'?'#22c55e':'#ef4444',20);
        marker('RESCUE_TRAFFIC_A',ht.dg.barrierA?'#22c55e':'#f59e0b');
        marker('RESCUE_TRAFFIC_B',ht.dg.barrierB?'#22c55e':'#f59e0b');
        marker('RESCUE_TECH',ht.dg.ropeReady?'#22c55e':'#3b82f6');
        marker('RESCUE_WINCH',ht.dg.namLifted?'#22c55e':'#8b5cf6');
        marker('RESCUE_NAM',ht.dg.firstAidGiven?'#22c55e':'#ef4444');
        marker('RESCUE_MEDICAL',ht.dg.medicalReceived?'#22c55e':'#10b981');
      } else if(ht.currentQuest===3){
        marker('DONG_LOC_TUNG',ht.dl.tungBriefed?'#22c55e':'#f59e0b',20);
        marker('DONG_LOC_SAU',ht.dl.sauVerified?'#22c55e':'#ef4444');
        marker('DONG_LOC_TEO',ht.dl.teoVerified?'#22c55e':'#ef4444');
        marker('DONG_LOC_FLOW',ht.dl.flowOrganized?'#22c55e':'#3b82f6');
        marker('DONG_LOC_HAI',ht.dl.haiAssisted?'#22c55e':'#10b981');
        marker('DONG_LOC_ALTAR',ht.dl.incenseSupplied?'#22c55e':'#ec4899');
        marker('DONG_LOC_TIKTOKER',ht.dl.tiktokerCorrected?'#22c55e':'#8b5cf6');
      }
  const isRescue=ht.activeScene==='rescue'||ht.dg.status==='ACTIVE';
  const isDusk=isRescue||ht.dg.timeOfDay==='dusk';
  const isCountdown=ht.dg.status==='COUNTDOWN'||ht.dg.timeOfDay==='afternoon';
  view.minimapUrl=isRescue?'/assets/regions/ha-tinh/rescue-minimap.webp':'/assets/regions/ha-tinh/minimap.webp';
  view.visual.rescue={sceneAlpha:isRescue?1:isCountdown?.4:0,duskAlpha:isDusk?.35:isCountdown?.2:0,fogAlpha:isDusk?.18:isCountdown?.08:0};
  return view;
}
