import { MAP_CONFIG, POINTS_OF_INTEREST, isOnWalkway, isInLake, BUILDINGS } from 'shared';
// Curated garden pockets with deliberate openings, rather than tree rows.
const pockets:[number,number][] = [
 [32,145],[82,182],[45,255],[87,275],[34,365],[45,455],[83,486],[41,585],
 [302,278],[360,294],[335,340],[325,520],[305,565],[330,603],
 [630,93],[666,149],[702,83],[748,172],[782,108],[825,145],[869,91],
 [938,117],[976,174],[1018,81],[1060,126],[1110,165],[1150,97],[1195,127],
 [870,240],[940,225],[1040,260],[1120,285],[1180,315],
 [35,795],[82,825],[135,805],[300,840],[360,872],[290,950],
 [480,922],[555,938],[640,939],[952,936],[1040,930],[1140,905],
 [1167,565],[1190,590],[1180,665],[1135,690],
 [1540,240],[1570,315],[1535,400],[1558,550],[1550,625],[1555,747],[1530,850],
 [1320,110],[1388,122],[1470,130],[1530,125],
 [550,370],[500,405],[473,495],[505,580],[575,658],
 [1005,665],[1050,615],[1110,560],[1115,395],
 [90,95],[150,90],[360,112],[416,91],[440,162],[478,120],[540,147],[566,85],
 [245,584],[285,640],[338,666],[270,921],[335,950],
 [1080,814],[1145,869],[1160,930],[1280,730],[1350,710],[1390,800],
 [240,575],[220,610],[185,585],[247,790],[205,810],
 [1360,815],[1380,860],[1315,870],[1300,748],[1530,920]
];
export const TREE_LAYOUT=pockets.map(([x,y],i)=>({x,y,key:i%7===0?'hn-willow':'hn-tree'}));
export function canPlant(x:number,y:number,width:number,height:number){
 if(isInLake(x,y,8)||isOnWalkway(x,y,12))return false;
 // Also protect canopy coverage over the walkway rather than just the trunk.
 if(isOnWalkway(x,y-height*.6,width*.25))return false;
 if([MAP_CONFIG.spawn,...Object.values(POINTS_OF_INTEREST)].some(p=>Math.abs(x-p.x)<width/2+30&&p.y>y-height-35&&p.y<y+42))return false;
 return !BUILDINGS.some(b=>Math.abs(x-b.x)<b.width/2+width/2-8&&y>b.y-b.height&&y<b.y+35);
}
export const BENCHES=[{x:670,y:750},{x:950,y:748},{x:1180,y:340},{x:455,y:625},{x:925,y:246}];
export const LAMPS=[{x:430,y:290},{x:395,y:505},{x:420,y:700},{x:600,y:745},{x:1000,y:755},{x:1190,y:520},{x:1215,y:375},{x:1050,y:260},{x:1475,y:400},{x:1478,y:580}];
