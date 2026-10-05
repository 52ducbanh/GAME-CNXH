import {describe,it,expect} from 'vitest';
import {GAME_MAPS, getGameMap, resolveMovement, isMovementSegmentClear, inputDisplacement, isWalkableForMap, safeSpawn, findWalkingRoute, surfaceAt, MovementFeedback} from 'shared';
import {GameEngine} from '../gameEngine.js';
describe('Movement safety and real-map regressions',()=>{
  it('reaches the tree contact instead of discarding the last 0.5px',()=>{
    const r=resolveMovement('hanoi',{x:452.5,y:345},{x:6,y:0});
    expect(r.position.x).toBeCloseTo(453,3);expect(r.position.y).toBe(345);
    expect(r.contacts[0].rect).toEqual({x:467,y:337,width:16,height:16});
  });
  it('preserves both horizontal sliding directions at a horizontal tree edge',()=>{
    for(const x of [-12,12]){const r=resolveMovement('hanoi',{x:475,y:367.5},{x,y:-12});expect(Math.sign(r.position.x-475)).toBe(Math.sign(x));expect(Math.abs(r.position.x-475)).toBeGreaterThan(11);expect(r.position.y).toBeGreaterThan(365);expect(r.distance).toBeLessThanOrEqual(Math.hypot(x,12)+0.01);}
  });
  it('slides upward at a vertical tree edge and idles into a closed corner',()=>{
    const r=resolveMovement('hanoi',{x:452.5,y:345},{x:12,y:-12});expect(r.position.y).toBeLessThan(334);expect(r.position.x).toBeLessThan(454);
    const map=getGameMap('hanoi'),count=map.colliders.length;
    try{map.colliders.push({x:500,y:350,width:40,height:120},{x:450,y:350,width:100,height:35});let p={x:485.8,y:400};for(let i=0;i<30;i++)p=resolveMovement('hanoi',p,{x:3,y:-3}).position;expect(p.x).toBeCloseTo(486,2);expect(p.y).toBeCloseTo(399,2);expect(isWalkableForMap('hanoi',p.x,p.y)).toBe(true);}finally{map.colliders.splice(count);}
  });
  it('normalizes all diagonals and integrates equally at 30/60/120 FPS',()=>{
    for(const input of [{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1},{x:1,y:1},{x:1,y:-1},{x:-1,y:1},{x:-1,y:-1}])expect(Math.hypot(...Object.values(inputDisplacement(input,1000)))).toBeCloseTo(180,6);
    const endpoints=[15,30,60,120].map(fps=>{let p={x:155,y:270};for(let i=0;i<fps;i++)p=resolveMovement('hanoi',p,inputDisplacement({x:1,y:1},1000/fps)).position;return p;});
    for(const p of endpoints)expect(Math.hypot(p.x-155,p.y-270)).toBeCloseTo(180,3);
  });
  it('sweeps long steps and follows the curved shore without entering water',()=>{
    const start={x:486,y:535},r=resolveMovement('hanoi',start,{x:15,y:-15});
    expect(r.position.y).toBeLessThan(start.y);expect(r.contacts.some(c=>c.layer==='water')).toBe(true);
    let last=start;for(const p of r.path){expect(isMovementSegmentClear('hanoi',last,p)).toBe(true);last=p;}
    const long=resolveMovement('hanoi',{x:452.5,y:345},{x:100,y:0});expect(long.position.x).toBeLessThanOrEqual(453.01);
  });
  it('server rejects a valid endpoint reached through a tree, accepts the actual slide path',()=>{
    const e=new GameEngine('MOVE_QA','host'),p=e.addPlayer('p','QA');p.x=452.5;p.y=345;
    expect(isWalkableForMap('hanoi',498,345)).toBe(true);
    expect(e.handleIntent(p.id,{actionId:'tunnel',type:'MOVE',payload:{x:498,y:345}}).success).toBe(false);
    const r=resolveMovement('hanoi',p,{x:12,y:-12});const ack=e.handleIntent(p.id,{actionId:'slide',type:'MOVE',payload:{...r.position,path:r.path}});
    expect(ack.success).toBe(true);expect({x:p.x,y:p.y}).toEqual(r.position);
    expect(e.handleIntent(p.id,{actionId:'nan',type:'MOVE',payload:{x:NaN,y:345}}).success).toBe(false);
  });
  it('all map spawns and jitter are valid; the authoritative recovery is safe',()=>{
    for(const m of GAME_MAPS){for(const x of [-20,0,20])for(const y of [-15,0,15])expect(isWalkableForMap(m.id,m.spawn.x+x,m.spawn.y+y)).toBe(true);const r=safeSpawn(m.id,{x:0,y:0});expect(isWalkableForMap(m.id,r.x,r.y)).toBe(true);}
  });
  it('actual solver reaches every POI in seven maps with intact/broken bridges',()=>{
    for(const map of GAME_MAPS)for(const blocked of [false,true])for(const poi of Object.values(map.points)){
      if(blocked&&poi.id==='BRIDGE')continue;
      const route=findWalkingRoute(map.spawn,poi,blocked,map.id);expect(route.length,`${map.id}/${poi.id}`).toBeGreaterThan(0);
      let p=map.spawn;
      for(const end of route.slice(1)){let guard=0;while(Math.hypot(end.x-p.x,end.y-p.y)>.05&&guard++<200){const dx=end.x-p.x,dy=end.y-p.y,d=Math.hypot(dx,dy),step=Math.min(3,d);const r=resolveMovement(map.id,p,{x:dx/d*step,y:dy/d*step},blocked);expect(r.distance,`${map.id}/${poi.id}@${p.x},${p.y}`).toBeGreaterThan(0.001);p=r.position;}expect(guard).toBeLessThan(200);}
      expect(Math.hypot(p.x-poi.x,p.y-poi.y)).toBeLessThan(poi.radius);
    }
  },30000);
  it('surface metadata selects wood bridge, traced lawn and stone fallback',()=>{
    expect(surfaceAt('thanh-hoa',{x:850,y:582})).toBe('wood');expect(surfaceAt('thanh-hoa',{x:560,y:430})).toBe('grass');expect(surfaceAt('hanoi',{x:490,y:400})).toBe('stone');
  });
  it('footsteps count input movement, not resets/corrections; bump latches per contact',()=>{
    const f=new MovementFeedback();expect(f.frame(24,'stone',false,16).steps).toHaveLength(0);f.resetDistance();expect(f.frame(24,'wood',false,16).steps).toHaveLength(0);expect(f.frame(24,'wood',false,16).steps).toEqual(['wood']);
    expect(f.frame(0,'stone',true,16).bump).toBe(true);for(let i=0;i<300;i++){const e=f.frame(0,'stone',true,16);expect(e.bump).toBe(false);expect(e.steps).toHaveLength(0);}
    f.frame(0,'stone',false,160);expect(f.frame(0,'stone',true,16).bump).toBe(true);f.reset();expect(f.frame(0,'stone',false,16).steps).toHaveLength(0);
  });
  it('navigation generates valid route even for POIs near building footprints or slightly offset',()=>{
    for(const map of GAME_MAPS){
      for(const poi of Object.values(map.points)){
        const route=findWalkingRoute(map.spawn,poi,false,map.id);
        expect(route.length,`Route to ${poi.id} on ${map.id}`).toBeGreaterThan(0);
      }
    }
  });
  it('server accepts multi-step sliding paths around obstacles without false rejections',()=>{
    const e=new GameEngine('SLIDE_QA','host'),p=e.addPlayer('p1','Tester');
    p.x=452.5;p.y=345;
    let cur={x:p.x,y:p.y};
    for(let step=0;step<5;step++){
      const r=resolveMovement('hanoi',cur,{x:6,y:-6});
      const ack=e.handleIntent(p.id,{actionId:`slide_${step}`,type:'MOVE',payload:{...r.position,path:r.path}});
      expect(ack.success,`Step ${step} failed: ${ack.reason}`).toBe(true);
      expect({x:p.x,y:p.y}).toEqual(r.position);
      cur=r.position;
    }
  });
});
