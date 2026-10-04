import './utilities.css';
import './game.css';
import './regions.css';
import './ui/dashboard/dashboard.css';
import { createGame } from './game/phaserGame.js';
import { MainScene } from './scenes/MainScene.js';
import { SocketClient } from './network/socketClient.js';
import { HudView } from './ui/hudView.js';
import { ActionPanel } from './ui/actionPanel.js';
import { TaskPanel } from './ui/taskPanel.js';
import { VotingModal } from './ui/votingModal.js';
import { BriefingModal } from './ui/briefingModal.js';
import { PracticeModal } from './ui/practiceModal.js';
import { ResultsModal } from './ui/resultsModal.js';
import { LedgerModal } from './ui/ledgerModal.js';
import { TouchControls } from './ui/touchControls.js';
import { LobbyView } from './ui/lobbyView.js';
import { ProjectorDashboard } from './ui/dashboard/projectorDashboard.js';
import { PointOfInterest, MapId, isMapId } from 'shared';

function parseRoute(): { path: string; param?: string } {
  const pathname = window.location.pathname;
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0) {
    return { path: 'lobby' };
  }

  const [route, param] = parts;
  if (route === 'play') return { path: 'play', param };
  if (route === 'host') return { path: 'host', param };
  if (route === 'projector') return { path: 'projector', param };

  return { path: 'lobby' };
}

async function initApp() {
  const route = parseRoute();
  const socketClient = new SocketClient();

  if (route.path === 'lobby') {
    new LobbyView((roomCode, playerName, isHost) => {
      const nextPath = isHost ? `/host/${roomCode}` : `/play/${roomCode}`;
      window.history.pushState({}, '', nextPath);
      window.location.reload();
    });
    return;
  }

  if (route.path === 'host' || route.path === 'projector') {
    const roomCode = (route.param || 'HANOI_01').toUpperCase();
    const mode = route.path;
    const dashboard = new ProjectorDashboard(socketClient, roomCode, mode);
    dashboard.show();
    socketClient.joinRoom(roomCode, mode === 'host' ? 'Host' : 'Máy chiếu', mode === 'host', true);
    return;
  }

  // Play route: /play/:roomCode
  const roomCode = (route.param || 'HANOI_01').toUpperCase();
  const playerName = localStorage.getItem('player_name') || 'Chiến sĩ Thủ đô';

  // Select the immutable room map before Phaser loads any scene assets.
  let mapId:MapId='hanoi';
  try {
    const response=await fetch(`/api/rooms/${encodeURIComponent(roomCode)}`);
    if(response.ok){const room=await response.json();if(isMapId(room.mapId))mapId=room.mapId;}
    else if(response.status!==404)throw new Error('Không thể tải thông tin phòng.');
  }catch(e){
    const error=document.createElement('div');error.className='map-load-error';error.textContent='Không thể kết nối máy chủ. Hãy tải lại trang để mở đúng bản đồ phòng.';document.body.appendChild(error);socketClient.disconnect();return;
  }
  const phaserGame = createGame('game-container', socketClient,mapId);

  // Initialize UI components
  const taskPanel = new TaskPanel((x, y, name) => {
    const scene = phaserGame.scene.getScene('MainScene') as MainScene;
    if (scene) {
      scene.setWaypoint(x, y, name);
    }
  });

  const ledgerModal = new LedgerModal();
  const actionPanel = new ActionPanel(socketClient);
  const votingModal = new VotingModal(socketClient);
  const briefingModal = new BriefingModal(socketClient);
  const practiceModal = new PracticeModal(socketClient);
  const resultsModal = new ResultsModal(socketClient);

  const hudView = new HudView(
    socketClient,
    () => taskPanel.toggle(),
    () => ledgerModal.toggle(),
    mapId
  );

  const touchControls = new TouchControls();

  // Connect Phaser Scene events to UI
  phaserGame.events.once('hanoi-ready', () => {
    const scene = phaserGame.scene.getScene('MainScene') as MainScene;
    if (scene) {
      touchControls.connect(scene.controls);
      scene.onControlsReset = () => touchControls.reset();
      scene.onControlsChanged = (context,pending,locked) => {hudView.updateControls(context,pending,locked);touchControls.update(context,pending,locked);};
      scene.onActionPending = pending => actionPanel.setPending(pending);
      scene.onActionFeedback = (message,success) => {hudView.showToast(message,success?'RESOURCE':'MISSION');};
      actionPanel.onExecute = action => void scene.executeAction(action);
      scene.onInteractTriggered = (poi:PointOfInterest) => actionPanel.show(poi);
      hudView.onInteract = () => scene.controls.request('INTERACT');
      hudView.onSecondary = () => scene.controls.request('SECONDARY_ACTION');
      hudView.onToggleMap = () => scene.controls.request('MAP');
      const menu = () => {
        if(hudView.isMenuOpen()){hudView.toggleMenu();return;}
        if(actionPanel.isOpen()){actionPanel.hide();return;}
        const ledger=document.querySelector('#ledger-modal') as HTMLElement|null;
        if(ledger&&!ledger.classList.contains('hidden')){ledgerModal.toggle();return;}
        const tasks=document.querySelector('#task-panel') as HTMLElement|null;
        if(tasks&&!tasks.classList.contains('hidden')){taskPanel.toggle();return;}
        hudView.toggleMenu();
      };
      scene.onMenu = menu;
      hudView.onMenu = () => scene.controls.request('MENU');
      hudView.onLocateTarget = (x, y, name) => scene.setWaypoint(x, y, name);
      scene.onNearestPoiChanged = (poi) => {
        // If action panel is open and player walks away, hide it
        if (!poi) {
          actionPanel.hide();
        }
      };
    }
  });

  // Snapshot updates across all UI components
  socketClient.onSnapshot((snapshot) => {
    hudView.update(snapshot);
    taskPanel.playerId = socketClient.getPlayerId();
    taskPanel.update(snapshot);
    actionPanel.updateSnapshot(snapshot);
    votingModal.update(snapshot);
    briefingModal.update(snapshot);
    practiceModal.update(snapshot);
    resultsModal.update(snapshot);
    ledgerModal.update(snapshot);
  });

  const credits = document.createElement('a');
  credits.id = 'asset-credits';
  credits.href = '/assets/credits.html';
  credits.target = '_blank';
  credits.rel = 'noopener';
  credits.textContent = 'Nguồn đồ họa';
  document.body.appendChild(credits);

  // Join the room
  socketClient.onJoined(async()=>{
    if(sessionStorage.getItem('start_solo_room')===roomCode){
      sessionStorage.removeItem('start_solo_room');
      await socketClient.sendHostCommand('START');
    }
  });
  const storedHostToken = sessionStorage.getItem(`host_token_${roomCode}`);
  socketClient.joinRoom(roomCode, playerName, !!storedHostToken, false);
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', () => {
    initApp();
  });
} else {
  initApp();
}
