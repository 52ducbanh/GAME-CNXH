import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {GameEngine} from '../server/dist/gameEngine.js';
import {getInteractionActions} from '../shared/dist/index.js';
import {writeFile} from 'node:fs/promises';
globalThis.window={innerWidth:1440,innerHeight:900};
globalThis.document={hidden:false,hasFocus:()=>true,activeElement:null,querySelector:()=>null};
const mocks={
 'phaser':"export default {Scene:class{}};",
 'hanoiMap':"export const preloadHanoi=()=>{},createCharacterAnimations=()=>{},drawHanoi=()=>{};",
 'hanoiAssets':"export const CHARACTER_ROWS={},PROP={};",
 'regionalScene':"export const preloadRegion=()=>{},drawRegion=()=>{};",
 'soundManager':"export const soundManager={resetMovement(){}};",
 'movementDebug':"export class MovementDebug{}",
 'socketClient':"export class SocketClient{};let serial=0;export const newActionId=()=> 'ack-test-'+(++serial);"
};
const bundle=await build({entryPoints:['client/src/scenes/MainScene.ts'],bundle:true,platform:'node',format:'esm',write:false,plugins:[{name:'headless-render-mocks',setup(b){
 b.onResolve({filter:/^(phaser)$|\/(hanoiMap|hanoiAssets|regionalScene|soundManager|movementDebug|socketClient)\.js$/},args=>{
   const key=args.path==='phaser'?'phaser':args.path.split('/').at(-1).replace('.js','');
   return {path:key,namespace:'qa-mock'};
 });
 b.onLoad({filter:/.*/,namespace:'qa-mock'},args=>({contents:mocks[args.path],loader:'js'}));
}}]});
const {MainScene}=await import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const e=new GameEngine('ACK_TEST','host'),p=e.addPlayer('p1','QA');p.x=e.map.points.WAREHOUSE.x;p.y=e.map.points.WAREHOUSE.y;
const scene=new MainScene();scene.currentSnapshot=e.getSnapshot();scene.localPlayerId=p.id;scene.localPlayerSprite={x:p.x,y:p.y};
let reply,sends=0,pending=[],feedback=[];
scene.socketClient={getStatus:()=> 'CONNECTED',sendIntent:()=>{sends++;return new Promise(r=>reply=r);}};
scene.onActionPending=v=>pending.push(v);scene.onActionFeedback=(message,success)=>feedback.push({message,success});
const action=getInteractionActions(scene.currentSnapshot,p.id).find(a=>a.intent.type==='PICK_CRATE');
const first=scene.executeAction(action);await scene.executeAction(action);
assert.equal(sends,1);assert.deepEqual(pending,[true]);assert.equal(feedback.length,0);
assert.equal(scene.currentSnapshot.players[p.id].carriedCrateId,null);
await new Promise(r=>setTimeout(r,350));reply({actionId:'ack-test-1',success:false,reason:'Kiện đã được đồng đội nhặt.'});await first;
assert.deepEqual(pending,[true,false]);assert.deepEqual(feedback,[{message:'Kiện đã được đồng đội nhặt.',success:false}]);
assert.equal(scene.currentSnapshot.players[p.id].carriedCrateId,null);
scene.actionCooldown=0;const second=scene.executeAction(action);reply({actionId:'ack-test-2',success:true});await second;
assert.equal(feedback.at(-1).success,true);assert.equal(scene.currentSnapshot.players[p.id].carriedCrateId,null);
const report={method:'Actual bundled MainScene.executeAction with mocked renderer/socket and 350ms delayed ACK; no browser-network interception',pendingUntilAck:true,spamSuppressed:true,rejectReasonWithoutSuccess:true,noClientCargoMutation:true,successOnlyAfterAck:true,pass:true};
await writeFile('docs/input-ack-unit-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
