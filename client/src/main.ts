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
import { HostView } from './ui/hostView.js';
import { ProjectorView } from './ui/projectorView.js';
import { PointOfInterest } from 'shared';

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

function initApp() {
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

  if (route.path === 'host') {
    const roomCode = (route.param || 'HANOI_01').toUpperCase();
    const hostView = new HostView(socketClient, roomCode);
    hostView.show();
    socketClient.joinRoom(roomCode, 'Host Thủ đô', true, true);
    return;
  }

  if (route.path === 'projector') {
    const roomCode = (route.param || 'HANOI_01').toUpperCase();
    const projectorView = new ProjectorView(socketClient, roomCode);
    projectorView.show();
    socketClient.joinRoom(roomCode, 'Máy chiếu Projector', false, true);
    return;
  }

  // Play route: /play/:roomCode
  const roomCode = (route.param || 'HANOI_01').toUpperCase();
  const playerName = localStorage.getItem('player_name') || 'Chiến sĩ Thủ đô';

  const phaserGame = createGame('game-container', socketClient);

  // Initialize UI components
  const taskPanel = new TaskPanel((x, y, name) => {
    const scene = phaserGame.scene.getScene('MainScene') as MainScene;
    if (scene) {
      scene.cameras.main.pan(x, y, 1000, 'Power2');
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
    () => ledgerModal.toggle()
  );

  const touchControls = new TouchControls();

  // Connect Phaser Scene events to UI
  phaserGame.events.on('ready', () => {
    const scene = phaserGame.scene.getScene('MainScene') as MainScene;
    if (scene) {
      // Connect touch controls
      touchControls.onJoystickMove = (delta) => {
        scene.joystickDelta = delta;
      };
      touchControls.onInteractPress = () => {
        scene.triggerInteraction();
      };

      // Connect POI interactions
      scene.onInteractTriggered = (poi: PointOfInterest) => {
        actionPanel.show(poi);
      };

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
    taskPanel.update(snapshot);
    actionPanel.updateSnapshot(snapshot);
    votingModal.update(snapshot);
    briefingModal.update(snapshot);
    practiceModal.update(snapshot);
    resultsModal.update(snapshot);
    ledgerModal.update(snapshot);
  });

  // Join the room
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
