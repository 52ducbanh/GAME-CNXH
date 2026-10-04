// Generate disposable browser fixtures, optionally from a Git baseline without
// checking out/resetting files. Production assets and the MainScene stay real.
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { GameEngine } from '../server/dist/gameEngine.js';
const baseline=process.env.CHARACTER_QA_BASELINE;
const variant=baseline?'before':'after';
const out=path.resolve('client/dist-character-qa/qa',variant);
await mkdir(out,{recursive:true});
const fixtures={};
for(const id of ['hanoi','hai-phong','quang-ninh','ninh-binh','thanh-hoa','nghe-an','ha-tinh']){
  const engine=new GameEngine('CHARACTER_QA','fixture',id);
  const a=engine.addPlayer('local','QA · chân/bóng'),b=engine.addPlayer('remote','QA · nội suy');
  a.x=engine.map.spawn.x;a.y=engine.map.spawn.y;b.x=a.x+40;b.y=a.y+20;
  fixtures[id]=engine.getSnapshot();
}
const bundle=await build({entryPoints:['scripts/character-qa.fixture.ts'],bundle:true,platform:'browser',format:'iife',write:false,
  define:{QA_FIXTURES:JSON.stringify(fixtures),QA_VARIANT:JSON.stringify(variant)},
  plugins:baseline?[{name:'baseline-client',setup(b){b.onLoad({filter:/[/\\]client[/\\]src[/\\].*\.ts$/},({path:file})=>({
    contents:execFileSync('git',['show',`${baseline}:${path.relative(process.cwd(),file).replaceAll('\\','/')}`],{encoding:'utf8'}),loader:'ts'}));}}]:[]});
await writeFile(path.join(out,'fixture.js'),bundle.outputFiles[0].text);
await writeFile(path.join(out,'index.html'),`<!doctype html><meta charset="utf-8"><title>Character QA ${variant}</title>
<style>body{margin:0;background:#16392e;color:white;font:13px Arial}#game-container{position:fixed;inset:0}#qa-controls{position:fixed;z-index:100;top:8px;left:8px;background:#152f29e8;padding:8px;max-width:calc(100vw - 32px)}button,select{margin:3px;padding:6px}pre{margin:4px 0;max-height:110px;width:360px;max-width:calc(100vw - 36px);overflow:auto;font-size:11px}.compact pre{display:none}#movement-debug{display:none}</style>
<div id="game-container"></div><div id="qa-controls"><b>QA ${variant} — snapshot mô phỏng, renderer/input thật</b><br>
<select id="map">${Object.keys(fixtures).map(id=>`<option>${id}</option>`).join('')}</select>
<button id="route">Đi / chéo / sprint / dừng</button><button id="remote">Nội suy + đổi hướng</button>
<button id="occlusion">Che khuất</button><button id="map-toggle">M / overview</button><button id="record">Quay canvas</button><button id="compact">Ẩn/hiện số đo</button>
<span id="status">Đang tải</span><pre id="metrics"></pre><pre id="results"></pre></div><script src="fixture.js"></script>`);
console.log(`${variant}: ${out}`);
