import Phaser from 'phaser';
import { POINTS_OF_INTEREST, GameSnapshot, getProvinceView, isInLake, isWalkable, NORTH_CROSSING } from 'shared';
import { PROP, CHARACTER_ORIGIN_Y } from '../../../game/hanoiAssets.js';
import { bodyIntersectsMask, fadeOccluder, fadeDynamicOccluder } from '../../core/occlusion.js';
import { SCENE_LAYERS } from '../../../game/hanoiSceneLayers.js';

export function drawHanoi(scene:Phaser.Scene){
 scene.add.image(0,0,'hn-scene').setOrigin(0).setDepth(-100);
 // Exact scene crops, masked to roofs/canopies and sorted at ground anchors.
 const foreground=SCENE_LAYERS.map(layer=>{
  const shape=scene.add.graphics().fillStyle(0xffffff).fillPoints(layer.polygon.map(([x,y])=>({x,y})),true).setVisible(false);
  const image=scene.add.image(layer.x,layer.y,`hn-layer-${layer.key}`).setOrigin(0).setDepth(layer.depth);
  image.setMask(shape.createGeometryMask());
  return {image,layer};
 });
 const prop=(x:number,y:number,frame:number)=>scene.add.image(x,y,'hn-props',frame).setOrigin(.5,1).setDepth(y);
 const label=(x:number,y:number,text:string,size=12)=>scene.add.text(x,y,text,{
  fontFamily:'Arial, sans-serif',fontSize:`${size}px`,fontStyle:'bold',color:'#28332f',
  backgroundColor:'#f7e9cd',padding:{x:5,y:2}
 }).setOrigin(.5).setDepth(3000);
 label(154,158,'TRỤ SỞ',17);label(129,620,'KHO VẬT TƯ',15);
 label(401,172,'BẢNG CÔNG KHAI',10);
 label(186,317,'KHU A',16);label(1610,302,'KHU B',16);label(836,780,'KHU C',15);
 // Permanent north detour is distinct from the mission bridge.
 scene.add.image(NORTH_CROSSING.x+NORTH_CROSSING.width/2,52,'hn-bridge',0)
  .setOrigin(.5,.6).setDisplaySize(213,80).setDepth(16);
 const bp=POINTS_OF_INTEREST.BRIDGE;
 const bridge=scene.add.image(bp.x,bp.y,'hn-bridge',0).setOrigin(.5,.6).setDepth(bp.y-100);
 const frontMask=scene.add.graphics().fillStyle(0xffffff).fillPoints([
  {x:1298,y:416},{x:1340,y:416},{x:1375,y:410},{x:1406,y:408},
  {x:1440,y:410},{x:1474,y:416},{x:1514,y:416},{x:1514,y:450},{x:1298,y:450}
 ],true).setVisible(false);
 const bridgeFront=scene.add.image(bp.x,bp.y,'hn-bridge',0).setOrigin(.5,.6).setDepth(bp.y+34).setMask(frontMask.createGeometryMask());
 let seed=39482;const random=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const ripples=scene.add.graphics().setDepth(-30);
 for(let i=0;i<90;i++){
  const x=510+random()*740,y=270+random()*370;
  if(isInLake(x,y)&&isInLake(x+22,y))ripples.lineStyle(1,0xb4e7cd,.2).lineBetween(x,y,x+7+random()*15,y);
 }
 scene.tweens.add({targets:ripples,alpha:.2,duration:2400,yoyo:true,repeat:-1});
 for(const [x,y] of [[683,413],[1120,471],[1173,495],[736,592]]){
  const duck=scene.add.graphics().setDepth(-20).setPosition(x,y);
  duck.fillStyle(0x104e4e,.35).fillEllipse(0,2,14,5);
  duck.fillStyle(0xfff7df).fillEllipse(0,0,8,4).fillRect(2,-5,3,5);
  duck.fillStyle(0xdcb36a).fillRect(5,-4,2,1);
  scene.tweens.add({targets:duck,x:x+22,y:y+4,duration:6500,yoyo:true,repeat:-1});
 }
 const dynamicOccluders:Phaser.GameObjects.Image[]=[];
 const clinic=(id:string,mobile:boolean)=>{
  const p=POINTS_OF_INTEREST[id],x=p.x,y=p.y-22;
  const image=scene.add.image(x,y,mobile?'hn-mobile-clinic':'hn-clinic').setOrigin(.5,1).setDepth(y).setVisible(false);
  dynamicOccluders.push(image);
  const base=scene.add.graphics().setDepth(-1);
  base.lineStyle(1,0x8a7858,.65).strokeRoundedRect(x-55,y-32,110,37,5);
  const supplies=[prop(x-53,y+10,PROP.crate).setVisible(false),prop(x+57,y+10,PROP.crate).setVisible(false)];
  const caption=label(x,y-17,mobile?'Y TẾ LƯU ĐỘNG':'TRẠM Y TẾ',10);
  const doctor=scene.add.sprite(x+38,y+24,'hn-doctor',0).setOrigin(.5,CHARACTER_ORIGIN_Y).setDepth(y+24).setVisible(false);
  return {image,base,supplies,caption,doctor};
 };
 const fixed=clinic('CLINIC_FIXED',false),mobileB=clinic('CLINIC_MOBILE_B',true),mobileC=clinic('CLINIC_MOBILE_C',true);
 function npc(id:string,name:string,key='hn-citizen',color='#fff0ca'){
  const p=POINTS_OF_INTEREST[id];
  scene.add.ellipse(p.x,p.y+1,21,8,0x253e37,.22).setDepth(p.y-1);
  scene.add.sprite(p.x,p.y,key,0).setOrigin(.5,CHARACTER_ORIGIN_Y).setDepth(p.y);
  scene.add.text(p.x,p.y-53,name,{fontFamily:'Arial',fontSize:'12px',fontStyle:'bold',color,stroke:'#20382e',strokeThickness:3}).setOrigin(.5).setDepth(3001);
  scene.add.text(p.x+22,p.y-45,'…',{fontSize:'14px',color:'#37493e',backgroundColor:'#fff0d5',padding:{x:3,y:0}}).setOrigin(.5).setDepth(3001);
 }
 npc('ZONE_A','Huyền','hn-citizen','#ed92d1');npc('ZONE_B','Ninh','hn-volunteer','#9cdb88');
 npc('ZONE_C','Tâm','hn-volunteer','#ffdc70');npc('CITIZEN_C1','Cụ Lan');npc('CITIZEN_C2','Cụ Bình');
 for(const [x,y] of [[453,271],[418,587],[764,698],[1198,713],[1532,407],[321,755]]){
  if(!isWalkable(x,y)||!isWalkable(x+18,y))continue;
  const person=scene.add.sprite(x,y,'hn-citizen',8).setOrigin(.5,CHARACTER_ORIGIN_Y).setDepth(y);person.play('hn-citizen-right');
  scene.tweens.add({targets:person,x:x+18,duration:3800,yoyo:true,repeat:-1,
   onYoyo:()=>person.play('hn-citizen-left'),onRepeat:()=>person.play('hn-citizen-right')});
 }
 const practice=POINTS_OF_INTEREST.PRACTICE_TARGET;
 const practiceLabel=label(practice.x,practice.y-26,'ĐIỂM THỰC HÀNH',10).setVisible(false);
 const updateClinic=(c:ReturnType<typeof clinic>,deployed:boolean,crates:number)=>{
  c.image.setVisible(deployed);c.base.setVisible(!deployed);c.doctor.setVisible(deployed);
  c.supplies.forEach((image,i)=>image.setVisible(crates>i));c.caption.setY(c.image.y-(deployed?56:17));
 };
 return {bridge,fixed,mobileB,mobileC,practiceLabel,
  updateState(s:GameSnapshot){
   const visual=getProvinceView(s).visual;
   bridge.setFrame(visual.bridgeFrame);
   bridgeFront.setFrame(bridge.frame.name);
   updateClinic(fixed,visual.clinics.fixed.deployed,visual.clinics.fixed.crates);
   updateClinic(mobileB,visual.clinics.mobileB.deployed,visual.clinics.mobileB.crates);
   updateClinic(mobileC,visual.clinics.mobileC.deployed,visual.clinics.mobileC.crates);
  },
  updateOcclusion(x:number,y:number,delta:number){
   for(const {image,layer} of foreground){
    fadeOccluder(image,bodyIntersectsMask(x,y,layer),delta,.38);
   }
   for(const image of dynamicOccluders)fadeDynamicOccluder(image,x,y,delta);
  }
 };
}
