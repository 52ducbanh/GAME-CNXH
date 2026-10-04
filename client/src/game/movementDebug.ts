import Phaser from 'phaser';
import { Contact, MapId, MapPoint, MOVEMENT_CONFIG, getGameMap, surfaceAt, LAKE_OUTLINE, CANAL_OUTLINE, distanceToSegment, CollisionContext, getMapFootprints, floorPolygon } from 'shared';
import { soundManager } from './soundManager.js';
interface Sample {
  position:MapPoint; input:MapPoint; desired:MapPoint; actual:MapPoint;
  contacts:Contact[]; lock:string|null; authoritative?:MapPoint; correction:unknown;
}
export class MovementDebug {
  private enabled=false;
  private graphics:Phaser.GameObjects.Graphics;
  private panel:HTMLPreElement;
  private blockedMs=0;
  private lastSample='';
  private samples:unknown[]=[];
  constructor(private scene:Phaser.Scene,private mapId:MapId){
    this.graphics=scene.add.graphics().setDepth(9000).setVisible(false);
    this.panel=document.createElement('pre');this.panel.id='movement-debug';this.panel.hidden=true;
    this.panel.style.cssText='position:fixed;left:12px;top:115px;max-width:490px;max-height:65vh;overflow:auto;z-index:90;background:#142b25ee;color:#fff5df;font:11px monospace;padding:10px;pointer-events:none;white-space:pre-wrap';
    document.body.appendChild(this.panel);
  }
  toggle(){this.enabled=!this.enabled;this.panel.hidden=!this.enabled;this.graphics.setVisible(this.enabled);}
  update(s:Sample,dt:number,bridgeBlocked:CollisionContext){
    const position={x:s.position.x,y:s.position.y},auth=s.authoritative?{x:s.authoritative.x,y:s.authoritative.y}:null;
    if(Math.hypot(s.input.x,s.input.y)>0&&Math.hypot(s.actual.x,s.actual.y)<MOVEMENT_CONFIG.idleEpsilon){
      this.blockedMs+=Math.min(dt,100);
      const key=`${Math.round(position.x/8)},${Math.round(position.y/8)}:${s.lock??s.contacts.map(c=>c.id).join(',')}`;
      if(this.blockedMs>=300&&key!==this.lastSample){this.lastSample=key;this.samples.push({position,input:s.input,desired:s.desired,actual:s.actual,contacts:s.contacts,lock:s.lock,authoritative:auth,correction:s.correction});if(this.samples.length>12)this.samples.shift();}
    }else{this.blockedMs=0;this.lastSample='';}
    if(!this.enabled)return;
    this.panel.textContent=JSON.stringify({F2:'Ẩn/hiện collision',map:this.mapId,footRadius:MOVEMENT_CONFIG.footRadius,surface:surfaceAt(this.mapId,position),predicted:position,authoritative:auth,input:s.input,desired:s.desired,actual:s.actual,lock:s.lock,contacts:s.contacts,bridgeBlocked,correction:s.correction,audio:soundManager.movementStatus(),blockedSamples:this.samples},null,2);
    this.graphics.clear().lineStyle(1,0xffed88,1).strokeCircle(position.x,position.y,MOVEMENT_CONFIG.footRadius);
    const map=getGameMap(this.mapId);
    for(const path of map.paths)for(let i=1;i<path.points.length;i++)if(distanceToSegment(position,path.points[i-1],path.points[i])<150)this.graphics.lineStyle(path.width,0x77cfa9,.08).lineBetween(path.points[i-1].x,path.points[i-1].y,path.points[i].x,path.points[i].y);
    if(this.mapId==='hanoi')for(const polygon of [LAKE_OUTLINE,CANAL_OUTLINE])for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];if(distanceToSegment(position,a,b)<150)this.graphics.lineStyle(2,0x69aedd,.8).lineBetween(a.x,a.y,b.x,b.y);}
    for(const polygon of [...map.waterCollision,...map.groundAreas,...map.floors.map(floorPolygon)])for(let i=0;i<polygon.length;i++){const [x,y]=polygon[i],[bx,by]=polygon[(i+1)%polygon.length];if(distanceToSegment(position,{x,y},{x:bx,y:by})<150)this.graphics.lineStyle(2,0x69aedd,.8).lineBetween(x,y,bx,by);}
    for(const r of getMapFootprints(this.mapId,bridgeBlocked))if(position.x>r.x-150&&position.x<r.x+r.width+150&&position.y>r.y-150&&position.y<r.y+r.height+150)this.graphics.lineStyle(1,0xef7373,.8).strokeRect(r.x,r.y,r.width,r.height);
    this.graphics.lineStyle(2,0x69bdff,1).lineBetween(position.x,position.y,position.x+s.desired.x*6,position.y+s.desired.y*6);
    this.graphics.lineStyle(2,0x66f7ad,1).lineBetween(position.x,position.y,position.x+s.actual.x*6,position.y+s.actual.y*6);
    for(const contact of s.contacts){if(contact.rect)this.graphics.lineStyle(2,0xff6677).strokeRect(contact.rect.x,contact.rect.y,contact.rect.width,contact.rect.height);this.graphics.lineStyle(2,0xffffff).lineBetween(position.x,position.y,position.x+contact.normal.x*30,position.y+contact.normal.y*30);}
    if(auth)this.graphics.lineStyle(1,0x779bff).strokeCircle(auth.x,auth.y,4);
  }
  destroy(){this.graphics.destroy();this.panel.remove();}
}
