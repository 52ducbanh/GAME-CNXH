import Phaser from 'phaser';
import { WorldMap, GameSnapshot, isWalkableForMap, getProvinceDefinition, getProvinceView } from 'shared';
import { preloadHanoi, PROP, CHARACTER_ORIGIN_Y } from '../../game/hanoiAssets.js';
import { bodyIntersectsMask, fadeOccluder, fadeDynamicOccluder } from './occlusion.js';
import { REGIONAL_LAYERS } from '../../game/regionalLayers.js';

export function preloadRegion(scene:Phaser.Scene,map:WorldMap){
 const presentation=getProvinceDefinition(map.id).presentation;
 preloadHanoi(scene,false);
 scene.load.image('region-scene',map.sceneUrl);
 if(presentation.rescueSceneUrl)scene.load.image('province-rescue-scene',presentation.rescueSceneUrl);
 for(const layer of REGIONAL_LAYERS[map.id]??[])scene.load.image(`region-${layer.key}`,`/assets/regions/${map.id}/${layer.key}.webp`);
 for(const kind of ['stone','wood','steel'])scene.load.spritesheet(`region-bridge-${kind}`,`/assets/regions/shared/bridge-${kind}.png`,{frameWidth:512,frameHeight:192});
 scene.load.spritesheet('region-boats','/assets/regions/shared/boats.png',{frameWidth:192,frameHeight:104});
 scene.load.spritesheet('sevarihk-palm','/assets/regions/shared/palm-sevarihk.png',{frameWidth:210,frameHeight:150});
 scene.load.spritesheet('sevarihk-waterfall','/assets/regions/shared/waterfall.png',{frameWidth:64,frameHeight:128});
}

export function drawRegion(scene:Phaser.Scene,map:WorldMap){
 const presentation=getProvinceDefinition(map.id).presentation;
 scene.add.image(0,0,'region-scene').setOrigin(0).setDepth(-100);
 const rescueScene=presentation.rescueSceneUrl?scene.add.image(0,0,'province-rescue-scene').setOrigin(0).setDepth(-99).setAlpha(0):null;
 const duskTint=presentation.rescueSceneUrl?scene.add.rectangle(0,0,1672,941,0x141a2e).setOrigin(0).setDepth(2000).setAlpha(0):null;
 const fogLayer=presentation.rescueSceneUrl?scene.add.rectangle(0,0,1672,941,0x8a9ba8).setOrigin(0).setDepth(2001).setAlpha(0):null;
 const foreground=(REGIONAL_LAYERS[map.id]??[]).map(layer=>{
  const shape=scene.add.graphics().fillStyle(0xffffff).fillPoints(layer.polygon.map(([x,y])=>({x,y})),true).setVisible(false);
  const image=scene.add.image(layer.x,layer.y,`region-${layer.key}`).setOrigin(0).setDepth(layer.depth).setMask(shape.createGeometryMask());
  return {image,layer};
 });
 const label=(x:number,y:number,text:string,size=12)=>scene.add.text(x,y,text,{fontFamily:'Arial, sans-serif',fontSize:`${size}px`,fontStyle:'bold',color:'#233c35',backgroundColor:'#f7e9cd',padding:{x:4,y:1},align:'center'}).setOrigin(.5).setDepth(3000);
 for(const l of map.labels)label(l.x,l.y,l.text,l.size);
 const {a,b}=map.bridge,length=Math.hypot(b.x-a.x,b.y-a.y),angle=Math.atan2(b.y-a.y,b.x-a.x);
 const bridge=scene.add.image((a.x+b.x)/2,(a.y+b.y)/2,`region-bridge-${map.bridge.kind}`,0).setDisplaySize(length+28,Math.max(78,Math.min(142,length*.26))).setRotation(angle).setDepth(-5);
 // Rails occupy the front of the real crossing and occlude people at its edge.
 const railMask=scene.add.graphics().fillStyle(0xffffff);
 const nx=-Math.sin(angle),ny=Math.cos(angle),w=map.bridge.width/2;
 railMask.fillPoints([{x:a.x+nx*w,y:a.y+ny*w},{x:b.x+nx*w,y:b.y+ny*w},{x:b.x+nx*(w+24),y:b.y+ny*(w+24)},{x:a.x+nx*(w+24),y:a.y+ny*(w+24)}],true).setVisible(false);
 const front=scene.add.image(bridge.x,bridge.y,bridge.texture.key,0).setDisplaySize(bridge.displayWidth,bridge.displayHeight).setRotation(angle).setDepth(Math.max(a.y,b.y)+26).setMask(railMask.createGeometryMask());
 let seed=731;const rand=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296;};
 const waves=scene.add.graphics().setDepth(-30);
 for(const poly of map.water){
  const xs=poly.map(p=>p[0]),ys=poly.map(p=>p[1]);
  for(let i=0;i<35;i++){
   const x=Math.min(...xs)+rand()*(Math.max(...xs)-Math.min(...xs)),y=Math.min(...ys)+rand()*(Math.max(...ys)-Math.min(...ys));
   if(Phaser.Geom.Polygon.Contains(new Phaser.Geom.Polygon(poly.map(([x,y])=>({x,y}))),x,y))waves.lineStyle(1,0xc7f4eb,.24).lineBetween(x,y,x+4+rand()*13,y);
  }
 }
 scene.tweens.add({targets:waves,alpha:.18,duration:2200,yoyo:true,repeat:-1});
 for(const boat of map.boats){
  const sprite=scene.add.image(boat.x,boat.y,'region-boats',boat.kind).setDepth(-20).setDisplaySize(boat.kind===2?74:boat.kind===1?100:143,boat.kind===2?40:boat.kind===1?55:77);
  scene.tweens.add({targets:sprite,x:boat.x+boat.dx,y:boat.y+boat.dy,duration:boat.kind===2?9500:14500,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
  const wake=scene.add.ellipse(boat.x,boat.y+13,sprite.displayWidth*.8,6).setStrokeStyle(1,0xc5eddf,.3).setDepth(-25);
  scene.tweens.add({targets:wake,x:boat.x+boat.dx,y:boat.y+boat.dy+13,duration:boat.kind===2?9500:14500,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
 }
 // Reused licensed palm animation, kept small so it belongs to the scene.
 if(!scene.anims.exists('palm-breeze'))scene.anims.create({key:'palm-breeze',frames:scene.anims.generateFrameNumbers('sevarihk-palm',{start:0,end:14}),frameRate:6,repeat:-1});
 for(const [x,y] of presentation.palms)scene.add.sprite(x,y,'sevarihk-palm').setOrigin(.5,1).setDisplaySize(116,83).setDepth(y).play('palm-breeze');
 if(!scene.anims.exists('stream-fall'))scene.anims.create({key:'stream-fall',frames:scene.anims.generateFrameNumbers('sevarihk-waterfall',{start:0,end:2}),frameRate:5,repeat:-1});
 if(presentation.waterfall)scene.add.sprite(presentation.waterfall[0],presentation.waterfall[1],'sevarihk-waterfall').setDisplaySize(28,58).setAlpha(.27).setDepth(-20).play('stream-fall');
 const dynamic:Phaser.GameObjects.Image[]=[];
 const prop=(x:number,y:number,frame:number)=>scene.add.image(x,y,'hn-props',frame).setOrigin(.5,1).setDepth(y);
 const clinic=(id:string,mobile:boolean)=>{
  const p=map.points[id];
  const image=mobile?scene.add.image(p.x,p.y-24,'hn-mobile-clinic').setOrigin(.5,1).setDepth(p.y-24).setVisible(false):null;
  if(image)dynamic.push(image);
  const caption=label(p.x,p.y-14,mobile?'ĐIỂM Y TẾ LƯU ĐỘNG':'CHỜ MỞ CỬA',9);
  const doctor=scene.add.sprite(p.x+32,p.y,'hn-doctor',0).setOrigin(.5,CHARACTER_ORIGIN_Y).setDepth(p.y).setVisible(false);
  const supplies=[prop(p.x-39,p.y+5,PROP.crate).setVisible(false),prop(p.x+49,p.y+5,PROP.crate).setVisible(false)];
  return {image,caption,doctor,supplies,mobile};
 };
 const fixed=clinic('CLINIC_FIXED',false),mobileB=clinic('CLINIC_MOBILE_B',true),mobileC=clinic('CLINIC_MOBILE_C',true);
 function npc(id:string,name:string,key='hn-citizen',color='#fff0ca'){
  const p=map.points[id];
  if(!p)return;
  scene.add.ellipse(p.x,p.y+1,21,8,0x253e37,.22).setDepth(p.y-1);
  scene.add.sprite(p.x,p.y,key,0).setOrigin(.5,CHARACTER_ORIGIN_Y).setDepth(p.y);
  scene.add.text(p.x,p.y-53,name,{fontFamily:'Arial',fontSize:'12px',fontStyle:'bold',color,stroke:'#20382e',strokeThickness:3}).setOrigin(.5).setDepth(3001);
  scene.add.text(p.x+20,p.y-40,'…',{fontSize:'13px',color:'#37493e',backgroundColor:'#fff0d5',padding:{x:3,y:0}}).setOrigin(.5).setDepth(3001);
 }
 for(const binding of presentation.npcs)npc(binding.pointId,binding.name,binding.texture,binding.color);
 const walkers=[map.points.HEADQUARTERS,map.points.WAREHOUSE,map.spawn,...map.paths.slice(0,4).map(p=>p.points[1])];
 for(const p of walkers){
  const x=p.x+20,y=p.y+12;if(!isWalkableForMap(map.id,x,y)||!isWalkableForMap(map.id,x+12,y))continue;
  const actor=scene.add.sprite(x,y,'hn-citizen',8).setOrigin(.5,CHARACTER_ORIGIN_Y).setDepth(y).play('hn-citizen-right');
  scene.tweens.add({targets:actor,x:x+12,duration:3000+rand()*1200,yoyo:true,repeat:-1,onYoyo:()=>actor.play('hn-citizen-left'),onRepeat:()=>actor.play('hn-citizen-right')});
 }
 const stock:Phaser.GameObjects.Image[]=[];const wh=map.points.WAREHOUSE;
 for(let i=0;i<6;i++)stock.push(prop(wh.x-72+(i%3)*34,wh.y-8-Math.floor(i/3)*21,PROP.crate).setScale(.68));
 const practiceLabel=label(map.points.PRACTICE_TARGET.x,map.points.PRACTICE_TARGET.y-26,'ĐIỂM THỰC HÀNH',10).setVisible(false);
 const updateClinic=(c:ReturnType<typeof clinic>,deployed:boolean,crates:number)=>{
  c.image?.setVisible(deployed);c.doctor.setVisible(deployed);c.supplies.forEach((s,i)=>s.setVisible(crates>i));
  c.caption.setText(c.mobile?(deployed?'Y TẾ LƯU ĐỘNG':'ĐIỂM Y TẾ LƯU ĐỘNG'):(deployed?'ĐÃ MỞ CỬA':'CHỜ MỞ CỬA')).setColor(deployed?'#287344':'#665d48');
  if(c.mobile)c.caption.setY(map.points[c===mobileB?'CLINIC_MOBILE_B':'CLINIC_MOBILE_C'].y-(deployed?75:14));
 };
 return {practiceLabel,updateState(s:GameSnapshot){
  const visual=getProvinceView(s).visual;
  bridge.setFrame(visual.bridgeFrame);front.setFrame(bridge.frame.name);
  updateClinic(fixed,visual.clinics.fixed.deployed,visual.clinics.fixed.crates);updateClinic(mobileB,visual.clinics.mobileB.deployed,visual.clinics.mobileB.crates);updateClinic(mobileC,visual.clinics.mobileC.deployed,visual.clinics.mobileC.crates);
  stock.forEach((p,i)=>p.setVisible(s.resources.availableCrates>i*2));
  rescueScene?.setAlpha(visual.rescue.sceneAlpha);
  duskTint?.setAlpha(visual.rescue.duskAlpha);
  fogLayer?.setAlpha(visual.rescue.fogAlpha);
 },updateOcclusion(x:number,y:number,delta:number){
  for(const {image,layer} of foreground)fadeOccluder(image,bodyIntersectsMask(x,y,layer),delta,.4);
  for(const image of dynamic)fadeDynamicOccluder(image,x,y,delta);
 }};
}
