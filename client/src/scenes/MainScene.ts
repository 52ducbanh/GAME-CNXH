import { InputController, InputAction } from '../game/inputController.js';
import { InteractionAction, InteractionContext, resolveInteraction, getInteractionActions } from 'shared';
import Phaser from 'phaser';
import { GameSnapshot, Player, PointOfInterest, WORLD_WIDTH, WORLD_HEIGHT, PLAYER_SPEED, INTERACTION_RADIUS, MapId, getGameMap, isWalkableForMap } from 'shared';
import { SocketClient, newActionId } from '../network/socketClient.js';
import { preloadHanoi, createCharacterAnimations, drawHanoi } from '../game/hanoiMap.js';
import { getMissionGuide } from 'shared';
import { findWalkingRoute } from 'shared';
import { CHARACTER_ROWS, PROP } from '../game/hanoiAssets.js';
import { preloadRegion, drawRegion } from '../game/regionalScene.js';
import { soundManager } from '../game/soundManager.js';
import { MOVEMENT_CONFIG, MapPoint, inputDisplacement, resolveMovement, collisionContact, surfaceAt } from 'shared';
import { MovementDebug } from '../game/movementDebug.js';

export class MainScene extends Phaser.Scene {
  private socketClient!: SocketClient;
  private currentSnapshot: GameSnapshot | null = null;
  private localPlayerId = '';
  private localPlayerSprite: Phaser.GameObjects.Container | null = null;
  private otherPlayerSprites = new Map<string, Phaser.GameObjects.Container>();
  private crateSprites = new Map<string, Phaser.GameObjects.Container>();
  private landmarks!: Pick<ReturnType<typeof drawHanoi>,'practiceLabel'|'updateState'|'updateOcclusion'>;
  private map = getGameMap();
  public controls!: InputController;
  private interaction: InteractionContext = {primary:null,secondary:null,choices:[]};
  private actionPending = false;
  private drainingMovement = false;
  private actionCooldown = 0;
  private inputLocked = false;
  public onControlsReset?: () => void;
  public onControlsChanged?: (context:InteractionContext,pending:boolean,locked:boolean) => void;
  public onActionFeedback?: (message:string,success:boolean) => void;
  public onActionPending?: (pending:boolean) => void;
  public onMenu?: () => void;
  private lastMoveSent = 0;
  private nearestPoi: PointOfInterest | null = null;
  private routeGraphics!: Phaser.GameObjects.Graphics;
  private groundHotspotsGraphics!: Phaser.GameObjects.Graphics;
  private marker!: Phaser.GameObjects.Container;
  private waypoint: {x:number;y:number;name:string}|null = null;
  private lastRoute = 0;
  private manualWaypoint = false;
  private overview = window.innerWidth > 1000 && window.innerHeight > 550;
  private unsubscribe?: () => void;
  private loadingLabel?: Phaser.GameObjects.Text;
  private previousScore = 0;
  private movementDebug!: MovementDebug;
  private movePath:MapPoint[]=[];
  private moveInFlight=false;
  private moveEpoch=0;
  private reconcileNext=true;
  private lastCorrection:unknown=null;
  private resetInput=()=>{this.controls?.reset();soundManager.resetMovement();};
  public onNearestPoiChanged?: (poi: PointOfInterest | null) => void;
  public onInteractTriggered?: (poi: PointOfInterest) => void;

  constructor(){super('MainScene');}
  public init(data:{socketClient:SocketClient;mapId?:MapId}){this.socketClient=data.socketClient;this.map=getGameMap(data.mapId);}
  public preload(){
    this.loadingLabel=this.add.text(this.scale.width/2,this.scale.height/2,`Đang mở bản đồ ${this.map.name}…`,{fontFamily:'Arial, sans-serif',fontSize:'16px',color:'#314c3c',backgroundColor:'#f5e8cb',padding:{x:18,y:12}}).setOrigin(.5).setDepth(10000);
    this.load.on('progress',(value:number)=>this.loadingLabel?.setText(`Đang mở bản đồ ${this.map.name}… ${Math.round(value*100)}%`));
    if(this.map.id==='hanoi')preloadHanoi(this);else preloadRegion(this,this.map);
  }
  public create(){
    this.loadingLabel?.destroy();
    createCharacterAnimations(this);
    this.landmarks=this.map.id==='hanoi'?drawHanoi(this):drawRegion(this,this.map);
    this.groundHotspotsGraphics = this.add.graphics().setDepth(0);
    this.routeGraphics=this.add.graphics().setDepth(1);
    const circle=this.add.graphics();circle.lineStyle(3,0xffedb5,.9).strokeEllipse(0,0,40,22);
    const pin=this.add.text(0,-20,'◆',{fontSize:'18px',color:'#ffe6a2',stroke:'#6c5b39',strokeThickness:2}).setOrigin(.5);
    this.marker=this.add.container(0,0,[circle,pin]).setDepth(2).setVisible(false);
    this.tweens.add({targets:pin,y:-26,duration:700,yoyo:true,repeat:-1,ease:'Sine.easeInOut'});
    this.controls = new InputController();
    this.controls.onAction = action => this.handleControlAction(action);
    this.controls.onReset = () => {soundManager.resetMovement();this.onControlsReset?.();};
    this.movementDebug=new MovementDebug(this,this.map.id);
    this.input.keyboard!.addKey('F2').on('down',()=>{if(!this.isTyping())this.movementDebug.toggle();});
    window.addEventListener('blur',this.resetInput);
    document.addEventListener('visibilitychange',this.resetInput);
    this.events.on('resume',this.resetInput);
    soundManager.beginMovement();
    const offJoined=this.socketClient.onJoined(()=>{this.reconcileNext=true;this.moveEpoch++;this.movePath=[];this.moveInFlight=false;this.resetInput();});
    const offStatus=this.socketClient.onConnectionStatusChange(status=>{if(status!=='CONNECTED'){this.reconcileNext=true;this.moveEpoch++;this.movePath=[];this.moveInFlight=false;this.resetInput();}});
    this.cameras.main.setBounds(0,0,WORLD_WIDTH,WORLD_HEIGHT).setBackgroundColor('#52773f');
    this.resizeCamera();
    this.scale.on('resize',this.resizeCamera,this);
    this.unsubscribe=this.socketClient.onSnapshot(s=>this.updateFromSnapshot(s));
    this.events.once('shutdown',()=>{this.unsubscribe?.();offJoined();offStatus();this.scale.off('resize',this.resizeCamera,this);window.removeEventListener('blur',this.resetInput);document.removeEventListener('visibilitychange',this.resetInput);this.controls.destroy();soundManager.endMovement();this.movementDebug.destroy();});
    this.game.events.emit('hanoi-ready');
  }
  private resizeCamera(){
    const camera=this.cameras.main,w=this.scale.width,h=this.scale.height;
    const phone=w<=700,landscape=h<550;
    const top=phone?195:landscape?78:0,bottom=phone?116:landscape?100:0;
    const right=landscape&&!phone?200:0;
    camera.setViewport(0,0,w,h);
    camera.setBackgroundColor('#176f69');
    if(this.overview){
      camera.stopFollow();camera.useBounds=false;
      camera.setZoom(phone||landscape?Math.min(camera.width/WORLD_WIDTH,camera.height/WORLD_HEIGHT):Math.max(camera.width/WORLD_WIDTH,camera.height/WORLD_HEIGHT));
      camera.centerOn(WORLD_WIDTH/2,WORLD_HEIGHT/2);
    }else{
      camera.setBounds(0,-top,WORLD_WIDTH+right,WORLD_HEIGHT+top+bottom);
      camera.setZoom(1);
      if(this.localPlayerSprite)camera.startFollow(this.localPlayerSprite,true,.18,.18);
      camera.setFollowOffset(-right/2,0);
    }
    document.querySelectorAll('#btn-map,#btn-map-icon').forEach(el=>el.setAttribute('aria-pressed',String(this.overview)));
  }
  public toggleOverview(){
    this.overview=!this.overview;
    if(this.overview)this.cameras.main.stopFollow();
    else if(this.localPlayerSprite)this.cameras.main.startFollow(this.localPlayerSprite,true,.14,.14);
    this.resizeCamera();
    document.querySelectorAll('#btn-map,#btn-map-icon').forEach(el=>el.setAttribute('aria-pressed',String(this.overview)));
  }
  public setWaypoint(x:number,y:number,name:string){
    this.waypoint={x,y,name};this.manualWaypoint=true;this.lastRoute=0;
    if(this.overview)this.toggleOverview();
  }
  private isTyping(){return this.controls?.isTyping()??false;}
  private collisionContext(){const s=this.currentSnapshot;return {bridgeBlocked:this.blockedBridge(),fixedDeployed:!!s?.m1.fixedDeployed,mobileBDeployed:!!s?.m1.mobileBDeployed,mobileCDeployed:!!s?.m1.mobileCDeployed};}
  private blockedBridge(){const s=this.currentSnapshot;return !!s&&s.m2.bridgeBroken&&!s.m2.bridgeRepaired;}

  private handleControlAction(action:InputAction){
    if(action==='MENU'){this.onMenu?.();this.resetInput();return;}
    if(this.getInputLock())return;
    if(action==='MAP'){this.toggleOverview();return;}
    this.checkNearestPoi();
    if(action==='INTERACT')this.triggerInteraction();
    else if(this.interaction.secondary)void this.executeAction(this.interaction.secondary);
  }
  public async executeAction(action:InteractionAction){
    if(this.actionPending||Date.now()<this.actionCooldown||this.getInputLock())return;
    this.drainingMovement=true;this.actionPending=true;this.onActionPending?.(true);this.checkNearestPoi();
    try{
      // Drain prediction first so the server sees MOVE before the interaction.
      const deadline=Date.now()+2000;
      while((this.movePath.length||this.moveInFlight)&&Date.now()<deadline&&this.socketClient.getStatus()==='CONNECTED'){
        this.flushMovement();await new Promise(resolve=>setTimeout(resolve,20));
      }
      if(this.movePath.length||this.moveInFlight||this.getInputLock()||!this.currentSnapshot||!this.localPlayerSprite){this.onActionFeedback?.('Chưa đồng bộ vị trí. Hãy thử lại.',false);return;}
      const context=resolveInteraction(this.currentSnapshot,this.localPlayerId,this.localPlayerSprite);
      const valid=context.secondary?.id===action.id||getInteractionActions(this.currentSnapshot,this.localPlayerId).some(a=>a.id===action.id&&Math.hypot(this.localPlayerSprite!.x-a.x,this.localPlayerSprite!.y-a.y)<=a.range&&Math.hypot(this.currentSnapshot!.players[this.localPlayerId].x-a.x,this.currentSnapshot!.players[this.localPlayerId].y-a.y)<=a.range);
      if(!valid){this.onActionFeedback?.('Hành động đã thay đổi. Hãy thử lại.',false);return;}
      this.drainingMovement=false;
      const ack=await this.socketClient.sendIntent({...action.intent,actionId:newActionId()});
      this.onActionFeedback?.(ack.success?'Đã ghi nhận thao tác.':ack.reason||'Không thể thực hiện.',ack.success);
      if(ack.success&&action.intent.type==='PING_LOCATION')this.spawnPingEffect(action.x,action.y);
    }finally{this.drainingMovement=false;this.actionPending=false;this.actionCooldown=Date.now()+300;this.onActionPending?.(false);this.checkNearestPoi();}
  }
  private getInputLock():string|null{
    const modal=document.querySelector('#briefing-modal:not(.hidden), #voting-modal:not(.hidden), #results-modal:not(.hidden), #ledger-modal:not(.hidden), #game-menu:not([hidden])');
    return document.hidden?'hidden-tab':!document.hasFocus()?'focus':this.isTyping()?'typing':modal?'modal':this.currentSnapshot?.isPaused?'paused':this.socketClient.getStatus()!=='CONNECTED'?'network':null;
  }

  public spawnPingEffect(x:number,y:number){
    soundManager.playAlert();
    const ring=this.add.graphics().setDepth(2500);
    ring.lineStyle(3,0x38bdf8,1);
    ring.strokeCircle(x,y,14);
    this.tweens.add({
      targets:ring,
      scale:3,
      alpha:0,
      duration:900,
      ease:'Cubic.easeOut',
      onComplete:()=>ring.destroy()
    });
  }

  public showFloatingText(x:number,y:number,text:string,color='#facc15'){
    const txt=this.add.text(x,y,text,{
      fontFamily:'Arial, sans-serif',
      fontSize:'15px',
      fontStyle:'bold',
      color,
      stroke:'#1c382a',
      strokeThickness:3
    }).setOrigin(.5).setDepth(4000);
    this.tweens.add({
      targets:txt,
      y:y-46,
      alpha:0,
      duration:1300,
      ease:'Cubic.easeOut',
      onComplete:()=>txt.destroy()
    });
  }

  public update(_time:number,delta:number){
    if(!this.currentSnapshot||!this.localPlayerSprite)return;
    this.handleMovement(delta);
    this.flushMovement();
    for(const [id,c] of this.otherPlayerSprites){
      const p=this.currentSnapshot.players[id];if(!p)continue;
      const dx=p.x-c.x,dy=p.y-c.y,moving=Math.hypot(dx,dy)>1;
      c.x=Phaser.Math.Linear(c.x,p.x,Math.min(1,delta/90));c.y=Phaser.Math.Linear(c.y,p.y,Math.min(1,delta/90));c.setDepth(c.y);
      this.animate(c,p.direction,moving);
    }
    const actors:[string,Phaser.GameObjects.Container][]=[[this.localPlayerId,this.localPlayerSprite],...this.otherPlayerSprites];
    for(const [id,c] of actors){
      const group=actors.filter(([,a])=>Math.abs(a.x-c.x)<100&&Math.abs(a.y-c.y)<65)
        .sort(([a],[b])=>a===this.localPlayerId?-1:b===this.localPlayerId?1:a.localeCompare(b));
      const name=c.getByName('playerName') as Phaser.GameObjects.Text;
      name.setY(group.length>1?Math.min(...group.map(([,a])=>a.y))-c.y-57-15*group.findIndex(([a])=>a===id):-57);
    }
    this.landmarks.updateOcclusion(this.localPlayerSprite.x,this.localPlayerSprite.y);
    this.checkNearestPoi();
    this.drawGroundHotspots();
    if(Date.now()-this.lastRoute>1000){this.lastRoute=Date.now();this.drawRoute();}
  }

  private handleMovement(delta:number){
    const c=this.localPlayerSprite!,s=this.currentSnapshot!;
    const lock=this.getInputLock()||(delta>MOVEMENT_CONFIG.maxFrameMs?'resume-frame':null);
    this.inputLocked=!!lock;this.controls.setLocked(!!lock);
    const input=this.controls.read(),dx=input.move.x,dy=input.move.y;
    const length=Math.hypot(dx,dy);
    if(length===0||lock||this.drainingMovement){this.animate(c,c.getData('direction')||'down',false);soundManager.idleMovement(delta);this.movementDebug.update({position:c,input:{x:dx,y:dy},desired:{x:0,y:0},actual:{x:0,y:0},contacts:[],lock,authoritative:s.players[this.localPlayerId],correction:this.lastCorrection},delta,this.collisionContext());return;}
    const isShift=input.sprint;
    const localPlayer=s.players[this.localPlayerId];
    const isCarrying=!!localPlayer?.carriedCrateId;
    const desired=inputDisplacement({x:dx,y:dy},delta,isShift,isCarrying);
    const oldX=c.x,oldY=c.y;
    const result=resolveMovement(this.map.id,{x:oldX,y:oldY},desired,this.collisionContext());
    c.setPosition(result.position.x,result.position.y);
    this.movePath.push(...result.path);
    const movedDist=result.distance;
    const isMoving=movedDist>MOVEMENT_CONFIG.idleEpsilon;
    soundManager.movementFrame(movedDist,surfaceAt(this.map.id,c),result.contacts.length>0&&!isMoving,delta);
    this.movementDebug.update({position:c,input:{x:dx,y:dy},desired,actual:{x:c.x-oldX,y:c.y-oldY},contacts:result.contacts,lock,authoritative:s.players[this.localPlayerId],correction:this.lastCorrection},delta,this.collisionContext());
    const dir=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';
    this.animate(c,dir,isMoving);c.setDepth(c.y);
  }

  private flushMovement(){
    const c=this.localPlayerSprite;if(!c||this.socketClient.getStatus()!=='CONNECTED')return;
    const dir=c.getData('direction')||'down';
    const now=Date.now();
    if(now-this.lastMoveSent>66&&!this.moveInFlight&&this.movePath.length){
      this.lastMoveSent=now;
      const path=this.movePath.splice(0,MOVEMENT_CONFIG.maxPacketPoints);
      const end=path[path.length-1];this.moveInFlight=true;
      const epoch=this.moveEpoch;
      this.socketClient.sendIntent({actionId:`mv_${now}`,type:'MOVE',payload:{...end,path,dir}}).then(ack=>{
        if(epoch!==this.moveEpoch)return;
        this.moveInFlight=false;
        if(!ack.success&&this.currentSnapshot){const p=this.currentSnapshot.players[this.localPlayerId];if(p){this.lastCorrection={reason:ack.reason,from:{x:c.x,y:c.y},to:{x:p.x,y:p.y}};c.x=p.x;c.y=p.y;this.movePath=[];soundManager.resetMovement();}}
      });
    }
  }

  private animate(c:Phaser.GameObjects.Container,dir:Player['direction'],moving:boolean){
    const sprite=c.getByName('body') as Phaser.GameObjects.Sprite;
    c.setData('direction',dir);
    if(moving)sprite.play(`${sprite.texture.key}-${dir}`,true);
    else {sprite.anims.stop();sprite.setFrame(CHARACTER_ROWS[dir]*4);}
  }

  private checkNearestPoi(){
    if(!this.currentSnapshot||!this.localPlayerSprite)return;
    const locked=!!this.getInputLock();this.inputLocked=locked;
    this.interaction=locked?{primary:null,secondary:null,choices:[]}:resolveInteraction(this.currentSnapshot,this.localPlayerId,this.localPlayerSprite,this.interaction.primary?.id);
    const closest=this.interaction.primary?this.map.points[this.interaction.primary.targetId]??null:null;
    if(this.nearestPoi?.id!==closest?.id){this.nearestPoi=closest;this.onNearestPoiChanged?.(closest);}
    this.onControlsChanged?.(this.interaction,this.actionPending,locked);
  }

  private drawGroundHotspots(){
    this.groundHotspotsGraphics.clear();
    const timeNow=Date.now();
    const pulse=0.45+0.25*Math.sin(timeNow/320);
    if(this.waypoint){
      this.groundHotspotsGraphics.lineStyle(2.5,0xf59e0b,pulse);
      this.groundHotspotsGraphics.fillStyle(0xfde047,0.1*pulse);
      this.groundHotspotsGraphics.fillCircle(this.waypoint.x,this.waypoint.y,38);
      this.groundHotspotsGraphics.strokeCircle(this.waypoint.x,this.waypoint.y,38);
    }
    const candidate=this.interaction.primary;
    if(candidate){
      this.groundHotspotsGraphics.lineStyle(3,0x34d399,0.85);
      this.groundHotspotsGraphics.fillStyle(0x10b981,0.16);
      this.groundHotspotsGraphics.fillCircle(candidate.x,candidate.y,46);
      this.groundHotspotsGraphics.strokeCircle(candidate.x,candidate.y,46);
    }
  }

  public triggerInteraction(){
    if(this.actionPending||this.getInputLock())return;
    this.checkNearestPoi();
    if(this.interaction.choices.length&&this.nearestPoi)this.onInteractTriggered?.(this.nearestPoi);
    else if(this.interaction.primary)void this.executeAction(this.interaction.primary);
  }

  private drawRoute(){
    if(!this.localPlayerSprite)return;
    const c=this.localPlayerSprite;
    if(this.waypoint&&Math.hypot(c.x-this.waypoint.x,c.y-this.waypoint.y)<45)this.manualWaypoint=false;
    if(!this.manualWaypoint&&this.currentSnapshot){const p=getMissionGuide(this.currentSnapshot,this.localPlayerId).target;this.waypoint=p?{x:p.x,y:p.y,name:p.name}:null;}
    this.routeGraphics.clear();this.marker.setVisible(!!this.waypoint);
    if(!this.waypoint)return;
    this.marker.setPosition(this.waypoint.x,this.waypoint.y);
    const route=findWalkingRoute({x:c.x,y:c.y},this.waypoint,this.collisionContext(),this.map.id);
    for(let i=1;i<route.length;i+=2){
      this.routeGraphics.fillStyle(0x496650,.65).fillCircle(route[i].x,route[i].y,4.3);
      this.routeGraphics.fillStyle(0xfff1c7,.95).fillCircle(route[i].x,route[i].y,3.1);
    }
  }

  private updateFromSnapshot(s:GameSnapshot){
    if(this.currentSnapshot?.phase!==s.phase&&s.phase==='LOBBY')this.reconcileNext=true;
    if(this.previousScore!==undefined&&s.totalScore>this.previousScore){
      const diff=s.totalScore-this.previousScore;
      if(this.localPlayerSprite){
        this.showFloatingText(this.localPlayerSprite.x,this.localPlayerSprite.y-65,`+${diff} ĐIỂM!`);
      }
      soundManager.playScore();
    }
    this.previousScore=s.totalScore;

    this.currentSnapshot=s;this.localPlayerId=this.socketClient.getPlayerId();
    this.landmarks.practiceLabel.setVisible(s.phase==='PRACTICE');
    this.landmarks.updateState(s);
    const ids=new Set<string>();
    for(const p of Object.values(s.players)){
      if(!p.isOnline)continue;ids.add(p.id);
      if(p.id===this.localPlayerId){
        if(!this.localPlayerSprite){
          this.localPlayerSprite=this.createPlayerContainer(p,true);this.resizeCamera();
        } else if(this.reconcileNext||!isWalkableForMap(this.map.id,this.localPlayerSprite.x,this.localPlayerSprite.y,this.collisionContext())||(!this.moveInFlight&&!this.movePath.length&&Math.hypot(this.localPlayerSprite.x-p.x,this.localPlayerSprite.y-p.y)>55)){this.lastCorrection={reason:'authoritative-snapshot',from:{x:this.localPlayerSprite.x,y:this.localPlayerSprite.y},to:{x:p.x,y:p.y}};this.localPlayerSprite.setPosition(p.x,p.y);this.movePath=[];this.moveEpoch++;this.moveInFlight=false;soundManager.resetMovement();}
        this.reconcileNext=false;
        this.updatePlayerDetails(this.localPlayerSprite,p);
      } else {
        let c=this.otherPlayerSprites.get(p.id);
        if(!c){c=this.createPlayerContainer(p,false);this.otherPlayerSprites.set(p.id,c);}
        this.updatePlayerDetails(c,p);
      }
    }
    for(const [id,c] of this.otherPlayerSprites)if(!ids.has(id)){c.destroy();this.otherPlayerSprites.delete(id);}
    for(const [id,crate] of Object.entries(s.crates)){
      if(crate.state==='DROPPED'){
        if(!this.crateSprites.has(id)){
          const c=this.add.container(crate.x,crate.y,[this.add.sprite(0,0,'hn-props',PROP.crate).setOrigin(.5,1)]).setDepth(crate.y);this.crateSprites.set(id,c);
        }
      }else {this.crateSprites.get(id)?.destroy();this.crateSprites.delete(id);}
    }
  }

  private createPlayerContainer(p:Player,local:boolean){
    const c=this.add.container(p.x,p.y).setDepth(p.y);
    const shadow=this.add.ellipse(0,-1,23,9,0x274634,.3);
    const ring=this.add.ellipse(0,-1,32,17).setStrokeStyle(2,local?0xfff0c2:parseInt(p.color.slice(1),16),.95);
    const key='hn-volunteer';
    const sprite=this.add.sprite(0,0,key,0).setOrigin(.5,1).setName('body');
    const name=this.add.text(0,-57,p.name,{fontFamily:'Arial, sans-serif',fontSize:'12px',fontStyle:'bold',color:local?'#fff4c8':p.color,stroke:'#203c37',strokeThickness:3}).setOrigin(.5).setName('playerName');
    const progress=this.add.graphics().setName('progressBar');
    const crate=this.add.sprite(17,-14,'hn-props',PROP.crate).setOrigin(.5,1).setScale(.7).setName('crateIcon').setVisible(!!p.carriedCrateId);
    c.add([shadow,ring,sprite,name,progress,crate]);this.updatePlayerDetails(c,p);return c;
  }

  private updatePlayerDetails(c:Phaser.GameObjects.Container,p:Player){
    (c.getByName('crateIcon') as Phaser.GameObjects.Sprite).setVisible(!!p.carriedCrateId);
    (c.getByName('playerName') as Phaser.GameObjects.Text).setText(p.name);
    const bar=c.getByName('progressBar') as Phaser.GameObjects.Graphics;bar.clear();
    if(p.activeJob){bar.fillStyle(0x374b3f).fillRoundedRect(-20,-69,40,7,2);bar.fillStyle(0x95bf5c).fillRoundedRect(-18,-67,36*p.activeJob.progress,3,1);}
  }
}
