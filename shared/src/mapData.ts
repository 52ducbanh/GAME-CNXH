export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PointOfInterest {
  id: string;
  name: string;
  type: 
    | 'HEADQUARTERS' 
    | 'WAREHOUSE' 
    | 'ZONE_A' 
    | 'ZONE_B' 
    | 'ZONE_C' 
    | 'CLINIC_FIXED' 
    | 'CLINIC_MOBILE_B' 
    | 'CLINIC_MOBILE_C' 
    | 'BRIDGE' 
    | 'BRIDGE_TASK_1' 
    | 'BRIDGE_TASK_2' 
    | 'NOTICE_BOARD' 
    | 'CITIZEN_C1' 
    | 'CITIZEN_C2' 
    | 'PRACTICE_TARGET';
  x: number;
  y: number;
  radius: number;
  description: string;
  vietnameseLabel: string;
}

import { MOVEMENT_CONFIG } from './constants.js';
import { COLLISION_LAYOUT } from './collisionLayout.js';
// Reference scene coordinates are native pixels (1672 × 941).
// Server collision, guidance and minimap share the traced paths and shorelines.
export const MAP_CONFIG = { width:1672, height:941, spawn:{x:490,y:400} };
export interface MapPoint { x:number; y:number }
const points=(pairs:number[][]):MapPoint[]=>pairs.map(([x,y])=>({x,y}));
export const LAKE={x:900,y:475,rx:401,ry:246};
export const LAKE_OUTLINE=points([
 [790,234],[880,230],[975,249],[1044,270],[1100,295],[1175,317],
 [1230,355],[1280,409],[1293,498],[1270,587],[1225,640],[1150,666],
 [1070,679],[952,674],[844,654],[721,653],[607,653],[527,627],
 [500,543],[505,472],[546,413],[548,363],[589,310],[661,279],[736,276]
]);
export const CANAL:Rect={x:1280,y:120,width:200,height:821};
export const CANAL_OUTLINE=points([
 [1230,0],[1260,190],[1300,310],[1328,420],[1386,645],[1380,723],
 [1332,850],[1233,941],[1672,941],[1672,880],[1608,750],[1562,600],
 [1510,450],[1425,340],[1386,200],[1330,0]
]);
export const NORTH_CROSSING:Rect={x:1225,y:17,width:213,height:76};
export const BRIDGE_CROSSING:Rect={x:1298,y:377,width:225,height:74};
export const BRIDGE_COLLIDER:Rect={x:1354,y:377,width:112,height:74};
export const PROMENADE_OUTLINE=points([
 [560,300],[665,246],[780,215],[940,215],[1050,250],[1175,290],
 [1250,370],[1310,500],[1295,610],[1215,690],[1090,735],[975,745],
 [880,703],[735,697],[605,680],[485,670],[454,580],[457,475],
 [498,421],[573,369],[560,300]
]);
export const WALKWAYS:{points:MapPoint[];width:number}[]=[
 {points:PROMENADE_OUTLINE,width:78},
 {points:points([[1144,729],[1070,770],[1092,815],[1040,835],[997,842]]),width:58},
 {points:points([[155,255],[400,245],[550,235],[630,248],[760,232]]),width:80},
 {points:points([[490,400],[470,365],[445,245],[442,152],[618,147],[726,65],[1055,67],[1185,126],[1247,51],[1330,52],[1408,51],[1435,149],[1455,250],[1515,389]]),width:66},
 {points:points([[292,390],[333,354],[434,376],[490,400]]),width:58},
 {points:points([[155,749],[321,746],[400,685],[454,580],[450,450],[490,400]]),width:82},
 {points:points([[321,746],[339,779],[313,809],[346,876]]),width:58},
 {points:points([[1215,690],[1144,729],[1030,790],[997,842],[883,880],[817,865],[775,890]]),width:62},
 {points:points([[1215,690],[1307,646],[1320,530],[1320,448],[1338,414],[1406,414],[1483,414],[1555,455],[1606,539]]),width:62},
 {points:points([[1305,370],[1338,414]]),width:54},
 {points:points([[1515,389],[1558,387],[1595,380],[1609,413],[1555,455]]),width:78},
 {points:points([[997,842],[1040,835],[1092,870],[1120,914]]),width:58},
 {points:points([[445,245],[441,300],[490,400]]),width:68},
 {points:points([[155,255],[220,320],[292,390]]),width:80},
 {points:points([[292,390],[310,560],[321,746]]),width:80}
];
// Dry approaches around constructed clinics; lake/canal and building checks still apply.
for(const [x,y] of [[630,248],[1555,480],[1144,729]])WALKWAYS.push({points:points([[x,y-105],[x-82,y-105],[x-82,y+25],[x,y+25],[x,y]]),width:64});
// The east house/canal leave a dry approach on the tent's east side.
WALKWAYS.push({points:points([[1595,380],[1625,385],[1625,485],[1555,480],[1555,455]]),width:48});
export function distanceToSegment(p:MapPoint,a:MapPoint,b:MapPoint){
 const dx=b.x-a.x,dy=b.y-a.y;
 const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));
 return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
}
function inPolygon(x:number,y:number,polygon:MapPoint[],radius=0){
 let inside=false;
 for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){
  const a=polygon[i],b=polygon[j];
  if(((a.y>y)!==(b.y>y))&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  if(radius>0&&distanceToSegment({x,y},a,b)<radius)return true;
 }
 return inside;
}
export function isInLake(x:number,y:number,radius=0){return inPolygon(x,y,LAKE_OUTLINE,radius);}
export function isOnWalkway(x:number,y:number,margin=0){
 return WALKWAYS.some(path=>path.points.slice(1).some((b,i)=>distanceToSegment({x,y},path.points[i],b)<path.width/2+margin));
}
const inRect=(x:number,y:number,r:Rect,margin=0)=>x>=r.x+margin&&x<=r.x+r.width-margin&&y>=r.y+margin&&y<=r.y+r.height-margin;
export function isInCanal(x:number,y:number,radius=0){
 return ![NORTH_CROSSING,BRIDGE_CROSSING].some(r=>inRect(x,y,{...r,y:r.y+radius,height:r.height-radius*2}))&&inPolygon(x,y,CANAL_OUTLINE,radius);
}
export const BUILDINGS=[
 {key:'headquarters',x:164,y:231,width:328,height:231},
 {key:'warehouse',x:155,y:710,width:304,height:178},
 {key:'house_a',x:108,y:530,width:216,height:273},
 {key:'house_c',x:545,y:890,width:348,height:194},
 {key:'house_a',x:759,y:833,width:174,height:102},
 {key:'house_b',x:1141,y:856,width:124,height:113},
 {key:'house_c',x:1567,y:365,width:210,height:344},
 {key:'house_b',x:1658,y:681,width:126,height:261}
];
export const STATIC_COLLIDERS:Rect[]=[
 {x:0,y:0,width:1672,height:20},{x:0,y:921,width:1672,height:20},
 {x:0,y:0,width:20,height:941},{x:1652,y:0,width:20,height:941},
 ...BUILDINGS.map(b=>({x:b.x-b.width*(b.x>1500?.3:.43),y:b.y-48,width:b.width*(b.x>1500?.6:.86),height:42})),
 // Trunks occupy the ground; overhanging foliage is a foreground layer.
 ...[[475,345],[513,632],[575,665],[724,219],[1109,279],[960,709],[1032,778],[1325,686]].map(([x,y])=>({x:x-8,y:y-8,width:16,height:16}))
];
// Explicit dry plazas supplement path tubes; water and solid checks still run below.
export function isOnGroundArea(x:number,y:number,radius:number=MOVEMENT_CONFIG.footRadius):boolean {
 const p={x,y};
 return COLLISION_LAYOUT.hanoi.groundAreas.some(poly=>{
  const outline=poly.map(([px,py])=>({x:px,y:py}));
  return inPolygon(x,y,outline)&&outline.every((a,i)=>distanceToSegment(p,a,outline[(i+1)%outline.length])>=radius-1e-6);
 });
}
export function isWalkable(x:number,y:number,bridgeBlocked=false,radius:number=MOVEMENT_CONFIG.footRadius):boolean{
 return (isOnWalkway(x,y,0)||isOnGroundArea(x,y,radius))&&!isInLake(x,y,radius)&&!isInCanal(x,y,radius)&&
 ![...STATIC_COLLIDERS,...(bridgeBlocked?[BRIDGE_COLLIDER]:[])].some(rect=>{
  const cx=Math.max(rect.x,Math.min(x,rect.x+rect.width)),cy=Math.max(rect.y,Math.min(y,rect.y+rect.height));
  return Math.hypot(x-cx,y-cy)<radius-1e-5;
 });
}

// Points of Interest for gameplay interaction
export const POINTS_OF_INTEREST: Record<string, PointOfInterest> = {
  HEADQUARTERS: {
    id: 'HEADQUARTERS',
    name: 'Trụ sở chính quyền',
    type: 'HEADQUARTERS',
    x: 155,
    y: 255,
    radius: 72,
    description: 'Nơi tiếp nhận hồ sơ, lập và biểu quyết kế hoạch dịch vụ công',
    vietnameseLabel: 'TRỤ SỞ CHÍNH'
  },
  NOTICE_BOARD: {
    id: 'NOTICE_BOARD',
    name: 'Bảng công khai kết quả',
    type: 'NOTICE_BOARD',
    x: 400,
    y: 245,
    radius: 72,
    description: 'Nơi niêm yết công khai ngân sách, chi tiêu và kết quả phục vụ nhân dân',
    vietnameseLabel: 'BẢNG CÔNG KHAI'
  },
  WAREHOUSE: {
    id: 'WAREHOUSE',
    name: 'Kho vật tư thành phố',
    type: 'WAREHOUSE',
    x: 155,
    y: 749,
    radius: 72,
    description: 'Nơi xuất cấp, trả và kiểm tra sổ sách vật tư công',
    vietnameseLabel: 'KHO VẬT TƯ'
  },
  ZONE_A: {
    id: 'ZONE_A',
    name: 'Khu dân cư A',
    type: 'ZONE_A',
    x: 292,
    y: 390,
    radius: 72,
    description: '12 người dân mô phỏng - khảo sát nhu cầu y tế ban đầu',
    vietnameseLabel: 'KHU DÂN CƯ A (12 dân)'
  },
  ZONE_B: {
    id: 'ZONE_B',
    name: 'Khu dân cư B',
    type: 'ZONE_B',
    x: 1558,
    y: 387,
    radius: 72,
    description: '10 người dân mô phỏng - phía Đông thành phố',
    vietnameseLabel: 'KHU DÂN CƯ B (10 dân)'
  },
  ZONE_C: {
    id: 'ZONE_C',
    name: 'Khu dân cư C',
    type: 'ZONE_C',
    x: 883,
    y: 880,
    radius: 72,
    description: '8 người dân mô phỏng - gồm đại diện và hai người cao tuổi C1, C2',
    vietnameseLabel: 'KHU DÂN CƯ C (8 dân)'
  },
  CLINIC_FIXED: {
    id: 'CLINIC_FIXED',
    name: 'Điểm đặt Trạm y tế cố định',
    type: 'CLINIC_FIXED',
    x: 630,
    y: 248,
    radius: 72,
    description: 'Vị trí xây dựng Trạm y tế cố định theo phương án tập trung gần Khu A',
    vietnameseLabel: 'TRẠM Y TẾ CỐ ĐỊNH'
  },
  CLINIC_MOBILE_B: {
    id: 'CLINIC_MOBILE_B',
    name: 'Điểm lưu động B',
    type: 'CLINIC_MOBILE_B',
    x: 1555,
    y: 480,
    radius: 72,
    description: 'Điểm tiếp nhận và triển khai tổ y tế lưu động phục vụ Khu B',
    vietnameseLabel: 'ĐIỂM LƯU ĐỘNG B'
  },
  CLINIC_MOBILE_C: {
    id: 'CLINIC_MOBILE_C',
    name: 'Điểm lưu động C',
    type: 'CLINIC_MOBILE_C',
    x: 1144,
    y: 729,
    radius: 72,
    description: 'Điểm tiếp nhận và triển khai tổ y tế lưu động phục vụ Khu C',
    vietnameseLabel: 'ĐIỂM LƯU ĐỘNG C'
  },
  BRIDGE: {
    id: 'BRIDGE',
    name: 'Cầu qua kênh sang Khu B',
    type: 'BRIDGE',
    x: 1406,
    y: 414,
    radius: 72,
    description: 'Cầu nối huyết mạch sang khu Đông. Khi hỏng cần sửa hoặc đi tuyến vòng.',
    vietnameseLabel: 'CẦU QUA KÊNH'
  },
  BRIDGE_TASK_1: {
    id: 'BRIDGE_TASK_1',
    name: 'Điểm sửa mố cầu phía Tây',
    type: 'BRIDGE_TASK_1',
    x: 1338,
    y: 393,
    radius: 72,
    description: 'Công tác sửa chữa mố cầu phía Tây (Cần 1 kiện vật tư & nhân lực)',
    vietnameseLabel: 'SỬA MỐ CẦU TÂY'
  },
  BRIDGE_TASK_2: {
    id: 'BRIDGE_TASK_2',
    name: 'Điểm sửa dầm cầu',
    type: 'BRIDGE_TASK_2',
    x: 1338,
    y: 435,
    radius: 72,
    description: 'Công tác gia cố dầm cầu (Cần 1 kiện vật tư & nhân lực)',
    vietnameseLabel: 'SỬA DẦM CẦU'
  },
  CITIZEN_C1: {
    id: 'CITIZEN_C1',
    name: 'Hộ gia đình Cụ C1',
    type: 'CITIZEN_C1',
    x: 817,
    y: 865,
    radius: 72,
    description: 'Người cao tuổi khó khăn vận động tại Khu C cần hỗ trợ y tế tận nhà',
    vietnameseLabel: 'HỘ DÂN C1'
  },
  CITIZEN_C2: {
    id: 'CITIZEN_C2',
    name: 'Hộ gia đình Cụ C2',
    type: 'CITIZEN_C2',
    x: 1040,
    y: 835,
    radius: 72,
    description: 'Người cao tuổi neo đơn tại Khu C cần hỗ trợ y tế tận nơi',
    vietnameseLabel: 'HỘ DÂN C2'
  },
  PRACTICE_TARGET: {
    id: 'PRACTICE_TARGET',
    name: 'Điểm tập kết mẫu thực hành',
    type: 'PRACTICE_TARGET',
    x: 441,
    y: 300,
    radius: 72,
    description: 'Điểm giao kiện vật tư mẫu trong 60 giây tập dượt ban đầu',
    vietnameseLabel: 'ĐIỂM TẬP GIAO MẪU'
  }
};
