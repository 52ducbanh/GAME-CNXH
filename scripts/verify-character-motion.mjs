import { build } from 'esbuild';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
const bundle = await build({ entryPoints: ['client/src/game/characterMotion.ts'], bundle:true, platform:'node', format:'esm', write:false });
const { RemoteMotion, movementFacing, smoothingFactor } = await import('data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].text).toString('base64'));
const checks=[];
const player=(x,y=400,direction='right')=>({x,y,direction});
for(const hz of [30,60,144]) {
  const motion=new RemoteMotion(player(490),0);
  for(let t=100;t<=1000;t+=100)motion.push(player(490+t*.18),t);
  // Identical timed samples regardless of render cadence; no sawtooth easing.
  for(let frame=0;frame<=hz;frame++){
    const time=frame*1000/hz;
    const pose=motion.sample(time);
    assert.ok(Math.abs(pose.x-(490+Math.max(0,time-100)*.18))<1e-8);
  }
  assert.deepEqual(motion.sample(1200),{x:670,y:400,direction:'right',speed:0});
  checks.push(`${hz}Hz: uniform movement and exact stop`);
}
const turn=new RemoteMotion(player(0,0,'right'),0);
turn.push(player(18,0,'right'),100);turn.push(player(18,18,'down'),200);
assert.equal(turn.sample(150).direction,'right');
assert.equal(turn.sample(250).direction,'down');
assert.deepEqual(turn.sample(300),{x:18,y:18,direction:'down',speed:0});
checks.push('Turn follows the displayed segment; no premature turn or idle tail');
turn.push(player(490,400,'left'),300);
assert.deepEqual(turn.sample(300),{x:490,y:400,direction:'left',speed:0});
turn.push(player(500,400,'right'),1000);
assert.equal(turn.sample(1000).speed,0);
turn.reset(player(100,100,'up'),1100);
assert.deepEqual(turn.sample(1100),{x:100,y:100,direction:'up',speed:0});
checks.push('Reset, long gap and teleport do not create walking animations');
assert.equal(movementFacing(1,1.05,'right'),'right');
assert.equal(movementFacing(1,1.2,'right'),'down');
assert.equal(movementFacing(0,-1,'right'),'up');
assert.equal(movementFacing(0,0,'left'),'left');
checks.push('Diagonal hysteresis, wall slide and retained idle facing');
for(const hz of [30,60,144]){
  let value=0;
  for(let i=0;i<hz;i++)value+=(1-value)*smoothingFactor(1000/hz,84);
  assert.ok(Math.abs(value-(1-Math.exp(-1000/84)))<1e-12);
}
checks.push('Camera/fade smoothing has the same response at 30/60/144Hz');
const output=process.env.QA_REPORT_PATH||'client/dist-character-qa/qa/motion.json';
await mkdir(path.dirname(output),{recursive:true});
await writeFile(output,JSON.stringify({pass:true,method:'Timed presentation regression; no server movement changes',checks},null,2));
console.log(JSON.stringify({pass:true,checks},null,2));
