import { getProvinceView } from 'shared';
import { InteractionContext } from 'shared';
import { GameSnapshot, PlayerRole, WORLD_WIDTH, WORLD_HEIGHT, MapId, getGameMap } from 'shared';
import { SocketClient } from '../network/socketClient.js';
import { getMissionGuide } from 'shared';
import { soundManager } from '../game/soundManager.js';

const sun='<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="7" fill="#f0b52c"/><path d="M16 1V5 M16 27V31 M1 16H5 M27 16H31 M5 5L8 8 M24 24L27 27 M5 27L8 24 M24 8L27 5" stroke="#d99b20" stroke-width="2"/></svg>';
const coin='<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="12" fill="#d79b24" stroke="#71552b" stroke-width="2"/><circle cx="16" cy="16" r="9" fill="#ffe287" stroke="#b17a1a"/><path d="M16 8V24 M21 11H13Q9 15 16 16Q23 17 19 21H11" fill="none" stroke="#c59428" stroke-width="2"/></svg>';
const people='<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="13" cy="9" r="5" fill="#4c89b3" stroke="#294755"/><circle cx="23" cy="12" r="4" fill="#76acc2" stroke="#294755"/><path d="M4 28V20Q13 10 22 20V28Z M22 19Q30 17 30 26V28H23Z" fill="#4381a5" stroke="#294755" stroke-width="2"/></svg>';

export class HudView {
  private container:HTMLElement;
  private canvas:HTMLCanvasElement;
  private toastContainer:HTMLElement;
  private mapImage=new Image();
  public onToggleMap?:()=>void;
  public onMenu?:()=>void;
  public onInteract?:()=>void;
  public onSecondary?:()=>void;
  public onLocateTarget?:(x:number,y:number,name:string)=>void;
  private target:{x:number;y:number;name:string}|null=null;
  private map=getGameMap();
  private lastEventId='';
  private isFirstSnapshot=true;

  constructor(private socketClient:SocketClient,onToggleTasks:()=>void,onToggleLedger:()=>void,mapId:MapId='hanoi'){
    this.map=getGameMap(mapId);
    document.title=`${this.map.name} · Quê mình đứng đầu!`;
    this.container=document.createElement('div');this.container.id='hud-view';
    this.container.innerHTML=`
      <header class="city-bar parchment">
        <div class="city-brand"><img src="${this.map.iconUrl}" alt=""/><div><strong>${this.map.name.toLocaleUpperCase('vi')}</strong><small>Bản đồ mô phỏng</small></div></div>
        <div class="city-stat time-stat">${sun}<div><small>Thời gian</small><b id="hud-time">00:00</b></div></div>
        <button class="city-stat" id="btn-open-ledger" title="Xem sổ ngân sách">${coin}<div><small>Ngân sách</small><b id="hud-budget">100</b></div></button>
        <button class="city-stat" id="btn-open-crates" title="Xem sổ vật tư"><img src="/assets/hanoi/v2/crate.png" alt=""/><div><small>Trong kho</small><b id="hud-crates">12</b></div></button>
        <div class="city-stat score-stat"><span class="score-icon">✓</span><div><small>Điểm</small><b><span id="hud-score">0</span><em>/100</em></b></div></div>
        <div class="city-stat people-stat">${people}<div><small>Đồng đội</small><b><span id="hud-players">1</span><em> người</em></b></div></div>
      </header>
      <div class="player-strip"><span id="hud-room"></span><select id="select-role" aria-label="Vai trò gợi ý"><option value="SURVEY">Tiếp nhận</option><option value="PLANNER">Lập phương án</option><option value="LOGISTICS">Tổ chức thực hiện</option><option value="AUDIT">Giám sát</option><option value="RIGHTS">Bảo vệ quyền</option></select><span id="hud-carry" hidden>▣ Đang mang vật tư</span><span id="hud-paused" hidden>TẠM DỪNG</span><button id="btn-toggle-sound" style="background:transparent;border:0;color:#fff4d9;cursor:pointer;font-size:12px;padding:2px 4px;display:flex;align-items:center" title="Bật/Tắt âm thanh"><span id="hud-sound-icon">${soundManager.isMuted()?'🔇':'🔊'}</span></button><input id="sfx-volume" type="range" min="0" max="1" step="0.05" value="${soundManager.getVolume()}" aria-label="Âm lượng bước chân" title="Âm lượng bước chân" style="width:64px"/></div>
      <div id="hud-toast" class="hud-toast-container" aria-live="polite"></div>
      <aside class="mission-card parchment" aria-label="Nhiệm vụ hiện tại">
        <small class="eyebrow" id="mission-phase">THÀNH PHỐ CỦA CHÚNG TA</small>
        <h1 id="mission-title">CÙNG XÂY DỰNG THÀNH PHỐ</h1>
        <div id="mission-checks"></div>
        <button id="btn-waypoint" class="next-step"><span class="waypoint-dot">◆</span><span id="mission-step">Chờ chủ phòng bắt đầu.</span></button>
        <button id="btn-toggle-tasks" class="blue-button">Xem nhiệm vụ <span>→</span></button>
        <div class="service-count"><span id="hud-served">0/30</span> người dân đã phục vụ · <span id="hud-manpower">3/3</span> nhân lực rảnh</div>
      </aside>
      <button id="btn-map" class="minimap parchment" aria-label="Mở hoặc đóng toàn cảnh bản đồ" aria-pressed="false"><canvas width="256" height="144" aria-label="Bản đồ nhỏ"></canvas><span class="minimap-north">N ↑</span><span class="minimap-caption">${this.map.landmark.toLocaleUpperCase('vi')} <kbd>M</kbd></span></button>
      <div class="keyboard-hints"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd><span>Đi</span><kbd>Shift</kbd><span>Chạy</span><kbd>E</kbd><span>Tương tác</span><kbd>G</kbd><span>Hành động</span><kbd>M</kbd><span>Bản đồ</span><kbd>Esc</kbd><span>Menu</span></div>
      <div class="top-controls"><button id="btn-map-icon" aria-label="Bản đồ">⌖ Map</button><button id="btn-menu" aria-label="Mở menu">☰ Menu</button></div>
      <div class="interaction-prompts"><button id="interaction-hint" hidden><kbd>E</kbd><span></span></button><button id="secondary-hint" hidden><kbd>G</kbd><span></span></button></div>
      <section id="game-menu" hidden role="dialog" aria-modal="true" aria-labelledby="game-menu-title">
        <div class="parchment"><h2 id="game-menu-title">Menu / Cài đặt</h2><p>Phòng vẫn chạy khi bạn mở menu.</p><p>WASD / ↑↓←→: đi · Shift: chạy<br>E: tương tác · G: hành động phụ<br>M: bản đồ · Esc: đóng menu</p><p>Mobile: đẩy nhẹ joystick để đi, hết biên để chạy.</p><label>Âm lượng <input id="menu-volume" type="range" min="0" max="1" step=".05" value="${soundManager.getVolume()}"></label><button id="menu-mute" class="blue-button">Bật/tắt âm thanh</button><button id="menu-close" class="blue-button">Tiếp tục</button></div>
      </section>
    `;
    document.body.appendChild(this.container);
    this.canvas=this.container.querySelector('canvas')!;
    this.toastContainer=this.container.querySelector('#hud-toast')!;
    this.mapImage.src=this.map.minimapUrl;
    this.container.querySelector('#btn-toggle-tasks')!.addEventListener('click',onToggleTasks);
    for(const id of ['#btn-open-ledger','#btn-open-crates'])this.container.querySelector(id)!.addEventListener('click',onToggleLedger);
    this.container.querySelector('#select-role')!.addEventListener('change',e=>this.socketClient.sendIntent({actionId:`role_${Date.now()}`,type:'SET_ROLE',payload:{role:(e.target as HTMLSelectElement).value as PlayerRole}}));
    for(const id of ['#btn-map','#btn-map-icon'])this.container.querySelector(id)!.addEventListener('click',()=>this.onToggleMap?.());
    this.container.querySelector('#btn-menu')!.addEventListener('click',()=>this.onMenu?.());
    this.container.querySelector('#menu-close')!.addEventListener('click',()=>this.onMenu?.());
    this.container.querySelector('#interaction-hint')!.addEventListener('click',()=>this.onInteract?.());
    this.container.querySelector('#secondary-hint')!.addEventListener('click',()=>this.onSecondary?.());
    this.container.querySelector('#menu-volume')!.addEventListener('input',e=>{
      soundManager.setVolume(Number((e.target as HTMLInputElement).value));
      (this.container.querySelector('#sfx-volume') as HTMLInputElement).value=String(soundManager.getVolume());
    });
    this.container.querySelector('#menu-mute')!.addEventListener('click',()=>{
      soundManager.toggleMute();this.container.querySelector('#hud-sound-icon')!.textContent=soundManager.isMuted()?'🔇':'🔊';
    });
    this.container.querySelector('#btn-waypoint')!.addEventListener('click',()=>{if(this.target)this.onLocateTarget?.(this.target.x,this.target.y,this.target.name);});
    this.container.querySelector('#btn-toggle-sound')?.addEventListener('click',()=>{
      const muted=soundManager.toggleMute();
      this.container.querySelector('#hud-sound-icon')!.textContent=muted?'🔇':'🔊';
    });
    this.container.querySelector('#sfx-volume')?.addEventListener('input',e=>soundManager.setVolume(Number((e.target as HTMLInputElement).value)));
    this.socketClient.onConnectionStatusChange(status=>{this.container.dataset.connection=status;});
  }

  public updateControls(context:InteractionContext,pending:boolean,locked:boolean){
    for(const [id,action,key] of [['interaction-hint',context.primary,'E'],['secondary-hint',context.secondary,'G']] as const){
      const button=this.container.querySelector('#'+id) as HTMLButtonElement;
      button.hidden=!action||locked;button.disabled=pending||locked;
      button.setAttribute('aria-busy',String(pending));
      const label=pending?'Đang chờ máy chủ…':key==='E'&&context.choices.length?'Chọn phương án':action?.label||'';
      if(button.querySelector('span')!.textContent!==label)button.querySelector('span')!.textContent=label;
    }
  }
  public isMenuOpen(){return !(this.container.querySelector('#game-menu') as HTMLElement).hidden;}
  public toggleMenu(){
    const menu=this.container.querySelector('#game-menu') as HTMLElement;menu.hidden=!menu.hidden;
    if(!menu.hidden){(this.container.querySelector('#menu-volume') as HTMLInputElement).value=String(soundManager.getVolume());(this.container.querySelector('#menu-close') as HTMLButtonElement).focus();}
    else (document.activeElement as HTMLElement)?.blur();
  }
  public showToast(message:string,category='MISSION'){
    soundManager.playAlert();
    const item=document.createElement('div');
    const catClass=category==='RESOURCE'?'toast-resource':category==='SERVICE'?'toast-service':category==='PLAN'||category==='VOTE'?'toast-plan':'toast-mission';
    const icon=category==='RESOURCE'?'📦':category==='SERVICE'?'🩺':category==='PLAN'||category==='VOTE'?'🗳️':category==='PLAYER'&&message.includes('📍')?'📍':'🎯';
    item.className=`hud-toast ${catClass}`;
    item.innerHTML='<span></span><span></span>';item.children[0].textContent=icon;item.children[1].textContent=message;
    this.toastContainer.prepend(item);
    while(this.toastContainer.children.length>3)this.toastContainer.lastElementChild?.remove();
    setTimeout(()=>{
      item.style.transition='opacity 0.4s ease, transform 0.4s ease';
      item.style.opacity='0';
      item.style.transform='translateY(-6px)';
      setTimeout(()=>item.remove(),400);
    },3600);
  }

  public update(s:GameSnapshot){
    this.container.dataset.phase=s.phase;
    const set=(id:string,value:string)=>{const el=this.container.querySelector('#'+id)!;if(el.textContent!==value)el.textContent=value;};
    const id=this.socketClient.getPlayerId(),p=s.players[id],view=getProvinceView(s,id),guide=view.guide;
    const seconds=Math.max(0,Math.floor(s.phaseTimerRemainingMs/1000));
    set('hud-time',`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`);
    set('hud-budget',String(s.resources.currentBudget));set('hud-crates',String(s.resources.availableCrates));
    set('hud-score',String(s.totalScore));set('hud-players',String(Object.values(s.players).filter(p=>p.isOnline).length));
    set('hud-room',`PHÒNG ${s.roomCode}`);set('hud-served',`${s.citizensServedCount}/${s.totalCitizensCount}`);
    set('hud-manpower',`${s.manpower.total-s.manpower.busy}/${s.manpower.total}`);
    (this.container.querySelector('#hud-carry') as HTMLElement).hidden=!p?.carriedCrateId;
    (this.container.querySelector('#hud-paused') as HTMLElement).hidden=!s.isPaused;
    const role=this.container.querySelector('#select-role') as HTMLSelectElement;if(p&&document.activeElement!==role)role.value=p.role;
    set('mission-title',guide.title);set('mission-step',guide.step);
    set('mission-phase',s.phase==='RUNNING'?`NHIỆM VỤ ${view.activeQuestNumber} / ${view.quests.length}`:({LOBBY:'KHÁM PHÁ THÀNH PHỐ',BRIEFING:'DẪN NHẬP',PRACTICE:'LÀM QUEN THAO TÁC',RESULTS:'KẾT QUẢ',RUNNING:''})[s.phase]);
    const html=guide.checks.map(c=>`<div class="mission-check ${c.done?'done':''}"><i>${c.done?'✓':''}</i><span>${c.text}</span></div>`).join('');
    const checks=this.container.querySelector('#mission-checks')!;if(checks.innerHTML!==html)checks.innerHTML=html;
    this.target=guide.target;(this.container.querySelector('#btn-waypoint') as HTMLButtonElement).disabled=!this.target;

    // Live feedback toasts for recent events
    if(s.recentAuditEvents && s.recentAuditEvents.length > 0){
      const latest=s.recentAuditEvents[0];
      if(this.isFirstSnapshot){
        this.lastEventId=latest.id;
        this.isFirstSnapshot=false;
      } else if(latest.id !== this.lastEventId){
        this.lastEventId=latest.id;
        if(latest.category !== 'PLAYER' || latest.message.includes('📍') || s.phase === 'RUNNING'){
          this.showToast(latest.message, latest.category);
        }
      }
    }

    this.drawMinimap(s,id);
  }
  private drawMinimap(s:GameSnapshot,id:string){
    const view=getProvinceView(s,id);
    if(!this.mapImage.src.endsWith(view.minimapUrl))this.mapImage.src=view.minimapUrl;
    const ctx=this.canvas.getContext('2d')!;ctx.clearRect(0,0,256,144);
    if(this.mapImage.complete&&this.mapImage.naturalWidth)ctx.drawImage(this.mapImage,0,0,256,144);
    ctx.save();ctx.scale(256/WORLD_WIDTH,144/WORLD_HEIGHT);
    const POINTS_OF_INTEREST=this.map.points,{a,b}=this.map.bridge;
    ctx.strokeStyle=view.visual.world.bridgeBlocked?'#76523d':'#e1d3b1';ctx.lineWidth=34;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    for(const [key,active] of [['CLINIC_FIXED',view.visual.clinics.fixed.deployed],['CLINIC_MOBILE_B',view.visual.clinics.mobileB.deployed],['CLINIC_MOBILE_C',view.visual.clinics.mobileC.deployed]] as const){
      const p=POINTS_OF_INTEREST[key];
      if(!p)continue;
      ctx.fillStyle=active?'#f1eddb':'#9d9b74';ctx.fillRect(p.x-26,p.y-35,52,30);
      if(active){ctx.fillStyle='#b94437';ctx.fillRect(p.x-4,p.y-31,8,24);ctx.fillRect(p.x-12,p.y-23,24,8);}
    }
    for(const marker of view.markers){
      const pt=POINTS_OF_INTEREST[marker.pointId];if(!pt)continue;
      ctx.fillStyle=marker.color??(marker.done?'#22c55e':'#f59e0b');ctx.beginPath();ctx.arc(pt.x,pt.y,marker.size??16,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#ffffff';ctx.lineWidth=3;ctx.stroke();
    }
    if(this.target){ctx.strokeStyle='#fff3b5';ctx.lineWidth=7;ctx.beginPath();ctx.arc(this.target.x,this.target.y,24,0,Math.PI*2);ctx.stroke();}
    for(const p of Object.values(s.players))if(p.isOnline){ctx.fillStyle=p.id===id?'#fff0a9':p.color;ctx.strokeStyle=p.id===id?'#634d2c':'#fff9e9';ctx.lineWidth=6;ctx.beginPath();ctx.arc(p.x,p.y,p.id===id?23:18,0,Math.PI*2);ctx.fill();ctx.stroke();}
    ctx.restore();
  }
}
