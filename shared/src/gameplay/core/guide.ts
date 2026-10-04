import { GameSnapshot } from '../../types.js';
import { PointOfInterest } from '../../mapData.js';
import { getGameMap } from '../../worldMaps.js';

export interface MissionGuide { title: string; step: string; target: PointOfInterest | null; checks: { text: string; done: boolean }[] }
export function buildMissionGuide(s: GameSnapshot, playerId: string, running:(context:GuideContext)=>MissionGuide): MissionGuide {
  const map=getGameMap(s.mapId),POINTS_OF_INTEREST=map.points;
  const carrying = !!s.players[playerId]?.carriedCrateId;
  const guide: MissionGuide = { title: 'CÙNG XÂY DỰNG THÀNH PHỐ', step: 'Chờ chủ phòng bắt đầu. Bạn có thể khám phá bản đồ.', target: null, checks: [] };
  const to=(id:string,step:string) => {guide.target=POINTS_OF_INTEREST[id];guide.step=step;};
  const deliver=(id:string,text:string) => to(carrying?id:'WAREHOUSE',carrying?text:'Đến kho lấy một kiện vật tư.');
  if(s.phase==='PRACTICE') {
    guide.title='TẬP DƯỢT VẬN CHUYỂN';
    if(!s.practiceCrateDelivered)deliver('PRACTICE_TARGET','Mang kiện mẫu đến điểm tập dượt.');
    else guide.step='Đã giao kiện mẫu. Hoàn thành thao tác thực hành tại điểm tập dượt.';
    guide.checks=[{text:'Giao kiện vật tư mẫu',done:s.practiceCrateDelivered}];
  } else if(s.phase==='BRIEFING') {guide.title=`CHÀO MỪNG ĐẾN ${map.name.toLocaleUpperCase('vi')}`;guide.step='Đọc phần dẫn nhập để bắt đầu nhiệm vụ cùng đồng đội.';}
  else if(s.phase==='RESULTS') {guide.title='THÀNH PHỐ CỦA CHÚNG TA';guide.step=`Đã phục vụ ${s.citizensServedCount}/${s.totalCitizensCount} người dân.`;}
  else if(s.phase==='RUNNING') return running({s,playerId,guide,to,deliver});
  return guide;
}

export interface GuideContext { s:GameSnapshot;playerId:string;guide:MissionGuide;to(id:string,step:string):void;deliver(id:string,text:string):void;}
