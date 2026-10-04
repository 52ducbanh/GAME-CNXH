import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
const dir='client/dist-character-qa/qa';
const read=async name=>JSON.parse(await readFile(`${dir}/${name}.json`,'utf8'));
const before=await read('before-remote'),after=await read('after-remote');
assert.equal(before.checks.find(c=>c.case==='idle190ms').animation,true,'Baseline must reproduce the animation tail');
assert.equal(after.checks.find(c=>c.case==='idle190ms').animation,false);
assert.equal(after.checks.find(c=>c.case==='idle190ms').error,0);
const correction=after.checks.find(c=>c.case==='correction');assert.equal(correction.depth,correction.footY);
const oldMask=await read('before-occlusion'),newMask=await read('after-occlusion');
const canopy=(report,x,y)=>report.checks.find(c=>c.x===x&&c.y===y).layers.find(l=>l.key==='hn-layer-west-canopy').alpha;
assert.equal(canopy(oldMask,433,440),1);assert.ok(canopy(newMask,433,440)<.45);
assert.equal(canopy(oldMask,298,490),.38);assert.equal(canopy(newMask,298,490),1);
assert.ok(oldMask.checks.every(c=>c.bodyBottom===-2));
assert.ok(newMask.checks.every(c=>c.bodyBottom===0&&c.depth===c.y&&c.nameLayer===3001));
const mobile=await read('mobile-camera');
assert.equal(mobile.camera.roundPixels,false);assert.equal(mobile.camera.followOffsetY,39.5);
assert.ok(Math.abs(mobile.camera.screenFootY-461.5)<2);
for(const id of ['hai-phong','quang-ninh','ninh-binh','thanh-hoa','nghe-an','ha-tinh']) {
  const smoke=await read(`${id}-smoke`);
  assert.equal(smoke.map,id);assert.ok(smoke.checks.length>0);
  assert.ok(smoke.checks.every(c=>c.bodyBottom===0&&c.depth===c.y&&c.nameLayer===3001));
}
const report={pass:true,method:'Assertions on saved browser fixture traces; separate real socket report',checks:[
  'Baseline reproduces remote animation tail; fixed client stops at the received position',
  'Authoritative correction updates depth immediately',
  'Canopy edge fades when the body intersects; transparent crop corner stays opaque',
  'Foot baseline is exact, labels remain above foreground',
  '390x844 camera follows at the center of the unobstructed play area',
  'Six regional scenes: native foot anchor, depth and separate name layer at fixture positions',
]};
await writeFile(`${dir}/evidence.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
