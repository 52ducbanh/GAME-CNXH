// Fault injection against the actual bundled SoundManager; not a listening test.
import {build} from 'esbuild';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const storage=new Map(),listeners=new Map();
const target={addEventListener:(name,fn)=>{const set=listeners.get(name)??new Set();set.add(fn);listeners.set(name,set);},removeEventListener:(name,fn)=>listeners.get(name)?.delete(fn)};
globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)};
globalThis.document={...target,hidden:false,hasFocus:()=>true};
globalThis.window={...target,AudioContext:class{state='running';async resume(){this.state='running';}async suspend(){this.state='suspended';}async decodeAudioData(){throw Error('decode unavailable');}}};
globalThis.fetch=async()=>{throw Error('intentional missing asset');};
const bundle=await build({entryPoints:['client/src/game/soundManager.ts'],bundle:true,platform:'node',format:'esm',write:false,define:{'import.meta.env.BASE_URL':'"/"'}});
const {SoundManager}=await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].text).toString('base64')}`);
const s=new SoundManager();s.beginMovement();s.beginMovement();await s.unlock();await new Promise(resolve=>setTimeout(resolve,0));
for(let i=0;i<60;i++)s.movementFrame(3,'stone',false,1000/60);
assert.equal(s.movementStatus().cachedSamples,0);assert.equal(s.movementStatus().playedSteps,0);
s.setVolume(.2);s.toggleMute();assert.equal(new SoundManager().getVolume(),.2);assert.equal(new SoundManager().isMuted(),true);
s.endMovement();assert.equal([...listeners.values()].reduce((n,set)=>n+set.size,0),0);
const report={method:'actual SoundManager bundle with mocked DOM/AudioContext and failing fetch; no human listening',missingAssetDoesNotThrow:true,duplicateBeginDoesNotDuplicateListeners:true,volumeMutePersist:true,listenersRemoved:true,pass:true};
await writeFile('docs/movement-audio-qa.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
