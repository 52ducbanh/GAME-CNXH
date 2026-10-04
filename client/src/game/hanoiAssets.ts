import Phaser from 'phaser';
import { SCENE_LAYERS } from './hanoiSceneLayers.js';
export const HANOI_ASSETS = ['clinic','mobile-clinic'] as const;
export const PROP = {lamp:0,bench:1,board:2,crate:3,shrub:4,flowers:5,pot:6,flag:7};
export const CHARACTER_ROWS = {down:0,left:1,right:2,up:3};
// All raster files have native game dimensions, trimmed alpha and foot anchors.
export function preloadHanoi(scene:Phaser.Scene,includeScene=true){
 if(includeScene){
  scene.load.image('hn-scene','/assets/hanoi/v3/scene.webp');
  for(const layer of SCENE_LAYERS)scene.load.image(`hn-layer-${layer.key}`,`/assets/hanoi/v3/${layer.key}.webp`);
 }
 for(const key of HANOI_ASSETS)scene.load.image(`hn-${key}`,`/assets/hanoi/v2/${key}.png`);
 scene.load.spritesheet('hn-props','/assets/hanoi/v2/props.png',{frameWidth:64,frameHeight:96});
 scene.load.spritesheet('hn-bridge','/assets/hanoi/v3/bridge.png',{frameWidth:216,frameHeight:80});
 for(const key of ['volunteer','citizen','doctor'])scene.load.spritesheet(`hn-${key}`,`/assets/hanoi/v2/${key}.png`,{frameWidth:32,frameHeight:48});
}
export function createCharacterAnimations(scene:Phaser.Scene){
 for(const key of ['hn-volunteer','hn-citizen','hn-doctor'])for(const [direction,row] of Object.entries(CHARACTER_ROWS)){
  scene.anims.create({key:`${key}-${direction}`,frames:[0,1,2,3].map(i=>({key,frame:row*4+i})),frameRate:8,repeat:-1});
 }
}
