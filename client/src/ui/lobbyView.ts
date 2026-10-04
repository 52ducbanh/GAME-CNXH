import { GAME_MAPS, MapId, getGameMap } from 'shared';

export class LobbyView {
 private container:HTMLElement;
 private selected:MapId='hanoi';
 private qrVersion=0;
 constructor(private onJoinRoom:(room:string,name:string,isHost?:boolean)=>void){
  this.container=document.createElement('div');this.container.id='lobby-view';this.container.className='region-lobby';document.body.appendChild(this.container);
  this.render();this.select('hanoi');
 }
 private render(){
  this.container.innerHTML=`<main class="lobby-shell">
   <header class="lobby-heading"><span class="lobby-kicker">CÙNG NHAU XÂY DỰNG QUÊ HƯƠNG</span><h1>Quê mình đứng đầu!</h1><p>Khám phá những vùng đất Việt Nam. Cùng đồng đội mở trạm y tế, khôi phục kết nối và chăm sóc người dân.</p></header>
   <div class="lobby-content"><section class="region-selection"><h2>Chọn quê mình <span>7 vùng đất</span></h2><div class="region-grid" role="group" aria-label="Chọn bản đồ">${GAME_MAPS.map(m=>`<button class="region-card" data-map="${m.id}" aria-pressed="false"><img src="${m.minimapUrl}" alt="Bản đồ ${m.name}"/><span class="region-card-caption"><strong>${m.name}</strong><small>${m.landmark}</small></span><i aria-hidden="true">✓</i></button>`).join('')}</div></section>
   <aside class="lobby-join parchment"><span class="lobby-kicker">BẮT ĐẦU HÀNH TRÌNH</span><h2 id="selected-region-name">Hà Nội</h2><p id="selected-region-landmark">Hồ Gươm</p>
    <label for="input-player-name">Tên người chơi</label><input id="input-player-name" maxlength="40" autocomplete="nickname" placeholder="Tên hoặc bí danh của bạn"/>
    <button id="btn-explore-region" class="blue-button">Khám phá vùng này <span>→</span></button>
    <button id="btn-solo-region" class="lobby-solo">Chơi một mình</button><button id="btn-create-room" class="lobby-team">Tạo phòng cho đội</button>
    <p id="lobby-error" role="alert" hidden></p>
    <div class="lobby-room-join"><label for="input-room-code">Đã có mã phòng?</label><div><input id="input-room-code" maxlength="32" aria-label="Mã phòng"/><button id="btn-join-room">Vào phòng</button></div></div>
    <div id="qr-section" class="lobby-qr"></div><nav class="lobby-navigation"><a id="lobby-host-link">Điều khiển phòng</a><a id="lobby-projector-link">Máy chiếu</a></nav>
   </aside></div><footer class="lobby-footer">Trò chơi học tập · Chủ nghĩa xã hội khoa học & Nhà nước pháp quyền XHCN Việt Nam <a href="/assets/credits.html" target="_blank" rel="noopener">Nguồn đồ họa</a></footer>
  </main>`;
  (this.container.querySelector('#input-player-name') as HTMLInputElement).value=localStorage.getItem('player_name')||'Người chơi';
  for(const button of this.container.querySelectorAll<HTMLButtonElement>('[data-map]'))button.addEventListener('click',()=>this.select(button.dataset.map as MapId));
  this.container.querySelector('#btn-explore-region')!.addEventListener('click',()=>this.join(getGameMap(this.selected).defaultRoom));
  this.container.querySelector('#btn-join-room')!.addEventListener('click',()=>{
   const room=(this.container.querySelector('#input-room-code') as HTMLInputElement).value.trim().toUpperCase();
   if(!/^[A-Z0-9_-]{1,32}$/.test(room)){this.error('Nhập mã phòng bằng chữ, số, dấu gạch dưới hoặc gạch ngang.');return;}
   this.join(room);
  });
  this.container.querySelector('#btn-solo-region')!.addEventListener('click',()=>this.createRoom(true));
  this.container.querySelector('#btn-create-room')!.addEventListener('click',()=>this.createRoom(false));
 }
 private name(){const name=(this.container.querySelector('#input-player-name') as HTMLInputElement).value.trim()||'Người chơi';localStorage.setItem('player_name',name);return name;}
 private join(room:string){this.hide();this.onJoinRoom(room,this.name(),false);}
 private error(message:string){const el=this.container.querySelector('#lobby-error') as HTMLElement;el.textContent=message;el.hidden=false;}
 private select(id:MapId){
  this.selected=id;const map=getGameMap(id);
  for(const button of this.container.querySelectorAll<HTMLButtonElement>('[data-map]'))button.setAttribute('aria-pressed',String(button.dataset.map===id));
  this.container.querySelector('#selected-region-name')!.textContent=map.name;
  this.container.querySelector('#selected-region-landmark')!.textContent=map.landmark;
  (this.container.querySelector('#input-room-code') as HTMLInputElement).value=map.defaultRoom;
  (this.container.querySelector('#lobby-host-link') as HTMLAnchorElement).href=`/host/${map.defaultRoom}`;
  (this.container.querySelector('#lobby-projector-link') as HTMLAnchorElement).href=`/projector/${map.defaultRoom}`;
  void this.loadQr(map.defaultRoom);
 }
 private async createRoom(solo:boolean){
  const buttons=[...this.container.querySelectorAll<HTMLButtonElement>('#btn-solo-region,#btn-create-room')];buttons.forEach(b=>b.disabled=true);
  try{
   const response=await fetch('/api/rooms/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({mapId:this.selected})});
   if(!response.ok)throw new Error('Không thể tạo phòng. Vui lòng thử lại.');
   const data=await response.json();sessionStorage.setItem(`host_token_${data.roomCode}`,data.hostToken);
   if(solo)sessionStorage.setItem('start_solo_room',data.roomCode);
   this.hide();this.onJoinRoom(data.roomCode,this.name(),!solo);
  }catch(e){this.error(e instanceof Error?e.message:'Không thể kết nối máy chủ.');buttons.forEach(b=>b.disabled=false);}
 }
 private async loadQr(room:string){
  const version=++this.qrVersion,target=this.container.querySelector('#qr-section')!;target.textContent='Đang chuẩn bị mã QR…';
  try{
   const response=await fetch(`/api/qr/${room}`);if(!response.ok)throw new Error('QR');const data=await response.json();if(version!==this.qrVersion)return;
   target.replaceChildren();const img=document.createElement('img');img.src=data.qrDataUrl;img.alt=`QR vào phòng ${room}`;
   const text=document.createElement('div');text.textContent='Mời đồng đội vào chơi trên điện thoại';const copy=document.createElement('button');copy.textContent='Sao chép liên kết';
   copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(data.joinUrl);copy.textContent='Đã sao chép';}catch{copy.textContent='Không thể sao chép';}});text.appendChild(copy);target.append(img,text);
  }catch{if(version===this.qrVersion)target.textContent='Mã QR chưa tải được. Bạn vẫn có thể vào phòng bằng mã.';}
 }
 public hide(){this.container.hidden=true;}
 public show(){this.container.hidden=false;}
}
