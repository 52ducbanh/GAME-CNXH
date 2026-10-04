import {build} from 'esbuild';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
// Unit-level event harness, not a browser/device playtest.
class Element extends EventTarget {
  style={}; disabled=false; textContent=''; attrs={}; children={}; pointerId=null;
  setAttribute(k,v){this.attrs[k]=v;}
  querySelector(key){return this.children[key]??(this.children[key]=new Element());}
  getBoundingClientRect(){return {left:20,top:200,width:112,height:112};}
  setPointerCapture(id){this.pointerId=id;}
}
const body=new Element();body.appendChild=()=>{};
globalThis.window=new EventTarget();
globalThis.document=Object.assign(new EventTarget(),{body,hidden:false,activeElement:null,createElement:()=>new Element()});
const bundle=await build({entryPoints:['client/src/game/inputController.ts','client/src/ui/touchControls.ts'],bundle:true,platform:'node',format:'esm',write:false,outdir:'unused'});
const load=async i=>import('data:text/javascript;base64,'+Buffer.from(bundle.outputFiles[i].text).toString('base64'));
const {InputController}=await load(0),{TouchControls}=await load(1);
const input=new InputController(),touch=new TouchControls();touch.connect(input);input.onReset=()=>touch.reset();
let actions=[];input.onAction=a=>actions.push(a);
const fire=(target,type,data={})=>{const event=Object.assign(new Event(type,{cancelable:true}),data);target.dispatchEvent(event);};
const key=(code,down=true,repeat=false)=>fire(window,down?'keydown':'keyup',{code,repeat});
let checks=[];
const check=(name,run)=>{run();checks.push(name);};
check('WASD / arrows / opposing keys / diagonal normalization',()=>{
 key('KeyW');key('KeyD');assert.equal(Math.hypot(input.read().move.x,input.read().move.y),1);
 key('ArrowUp');assert.equal(input.read().move.x,input.read().move.y*-1);
 key('KeyS');assert.equal(input.read().move.y,0);input.reset();
 for(const [code,x,y] of [['ArrowLeft',-1,0],['ArrowRight',1,0],['ArrowUp',0,-1],['ArrowDown',0,1]]){key(code);assert.deepEqual(input.read().move,{x,y});key(code,false);}
});
check('Shift sprint and release',()=>{key('ShiftLeft');assert.equal(input.read().sprint,true);key('ShiftLeft',false);assert.equal(input.read().sprint,false);});
check('E/G/M/Esc abstraction and repeat suppression',()=>{
 for(const code of ['KeyE','KeyG','KeyM','Escape']){key(code);key(code,true,true);key(code,false);}
 assert.deepEqual(actions,['INTERACT','SECONDARY_ACTION','MAP','MENU']);
});
check('typing excludes gameplay shortcuts',()=>{document.activeElement={tagName:'INPUT'};key('KeyE');assert.equal(actions.length,4);document.activeElement=null;input.reset();});
check('MAP preserves held movement; Menu lock clears held/touch; fresh press after closing',()=>{
 key('KeyD');key('KeyM');assert.equal(input.read().move.x,1);
 input.setLocked(true);assert.equal(input.read().move.x,0);key('KeyE');assert.equal(actions.filter(a=>a==='INTERACT').length,1);
 key('Escape');assert.equal(actions.at(-1),'MENU');input.setLocked(false);assert.equal(input.read().move.x,0);key('KeyD');assert.equal(input.read().move.x,1);input.reset();
});
check('joystick analog movement and full-stick sprint',()=>{
 const zone=touch.container.querySelector('#joystick-zone');
 fire(zone,'pointerdown',{pointerId:1,clientX:94,clientY:256});assert.ok(input.read().move.x>0&&input.read().move.x<1);assert.equal(input.read().sprint,false);
 fire(zone,'pointermove',{pointerId:1,clientX:120,clientY:256});assert.equal(input.read().sprint,true);
 fire(zone,'pointerup',{pointerId:1});assert.deepEqual(input.read().move,{x:0,y:0});
});
check('two pointers: joystick + E/G, unrelated pointer release does not reset left hand',()=>{
 const zone=touch.container.querySelector('#joystick-zone'),e=touch.container.querySelector('#btn-touch-interact'),g=touch.container.querySelector('#btn-touch-secondary');
 fire(zone,'pointerdown',{pointerId:1,clientX:120,clientY:256});
 fire(e,'click');assert.equal(actions.at(-1),'INTERACT');assert.equal(input.read().move.x,1);
 fire(g,'click');assert.equal(actions.at(-1),'SECONDARY_ACTION');assert.equal(input.read().move.x,1);
 fire(zone,'pointerup',{pointerId:2});assert.equal(input.read().move.x,1);
 fire(zone,'pointercancel',{pointerId:1});assert.equal(input.read().move.x,0);
});
check('blur / hidden tab / lost capture resets without stuck movement',()=>{
 const zone=touch.container.querySelector('#joystick-zone');
 fire(zone,'pointerdown',{pointerId:3,clientX:120,clientY:256});fire(zone,'lostpointercapture',{pointerId:3});assert.equal(input.read().move.x,0);
 key('KeyD');fire(window,'blur');assert.equal(input.read().move.x,0);
 key('KeyW');document.hidden=true;fire(document,'visibilitychange');assert.equal(input.read().move.y,0);document.hidden=false;
});
input.destroy();const count=actions.length;key('KeyE');assert.equal(actions.length,count);
const report={method:'Bundled production InputController/TouchControls with EventTarget and mock DOM; no real device or human held-key test',checks,pass:true};
await writeFile(process.env.QA_REPORT_PATH || 'docs/input-controls-unit-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
