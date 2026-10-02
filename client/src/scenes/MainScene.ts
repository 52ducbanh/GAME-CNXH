import Phaser from 'phaser';
import { GameSnapshot, Player, Crate, PointOfInterest } from 'shared';
import {
  WORLD_WIDTH,
  WORLD_HEIGHT,
  PLAYER_SPEED,
  INTERACTION_RADIUS,
  POINTS_OF_INTEREST
} from 'shared';
import { SocketClient } from '../network/socketClient.js';

export class MainScene extends Phaser.Scene {
  private socketClient!: SocketClient;
  private currentSnapshot: GameSnapshot | null = null;

  // Local player state
  private localPlayerId: string = '';
  private localPlayerSprite: Phaser.GameObjects.Container | null = null;
  private otherPlayerSprites: Map<string, Phaser.GameObjects.Container> = new Map();
  private crateSprites: Map<string, Phaser.GameObjects.Container> = new Map();

  // Landmarks & POI sprites
  private bridgeSprite: Phaser.GameObjects.Sprite | null = null;
  private clinicFixedSprite: Phaser.GameObjects.Sprite | null = null;
  private clinicMobileBSprite: Phaser.GameObjects.Sprite | null = null;
  private clinicMobileCSprite: Phaser.GameObjects.Sprite | null = null;

  // Controls
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
  };

  // Virtual Joystick input state from HTML overlay
  public joystickDelta: { x: number; y: number } = { x: 0, y: 0 };
  public interactRequested: boolean = false;

  private lastMoveSent: number = 0;
  private nearestPoi: PointOfInterest | null = null;

  // UI Callback hooks
  public onNearestPoiChanged?: (poi: PointOfInterest | null) => void;
  public onInteractTriggered?: (poi: PointOfInterest) => void;

  constructor() {
    super('MainScene');
  }

  public init(data: { socketClient: SocketClient }) {
    this.socketClient = data.socketClient;
  }

  public preload() {
    // Load SVGs
    this.load.svg('thap_rua', '/assets/thap_rua.svg', { width: 140, height: 140 });
    this.load.svg('headquarters', '/assets/headquarters.svg', { width: 110, height: 88 });
    this.load.svg('warehouse', '/assets/warehouse.svg', { width: 110, height: 88 });
    this.load.svg('clinic_fixed', '/assets/clinic_fixed.svg', { width: 95, height: 75 });
    this.load.svg('clinic_mobile', '/assets/clinic_mobile.svg', { width: 85, height: 65 });
    this.load.svg('bridge_intact', '/assets/bridge_intact.svg', { width: 45, height: 75 });
    this.load.svg('bridge_broken', '/assets/bridge_broken.svg', { width: 45, height: 75 });
    this.load.svg('notice_board', '/assets/notice_board.svg', { width: 75, height: 65 });
    this.load.svg('house_a', '/assets/house_a.svg', { width: 85, height: 65 });
    this.load.svg('house_b', '/assets/house_b.svg', { width: 85, height: 65 });
    this.load.svg('house_c', '/assets/house_c.svg', { width: 85, height: 65 });
    this.load.svg('crate', '/assets/crate.svg', { width: 28, height: 28 });
    this.load.svg('player_base', '/assets/player_base.svg', { width: 34, height: 34 });
    this.load.svg('npc_elder', '/assets/npc_elder.svg', { width: 34, height: 34 });
    this.load.svg('npc_rep', '/assets/npc_rep.svg', { width: 34, height: 34 });
  }

  public create() {
    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    this.drawHanoiMap();

    // Setup input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.wasdKeys = {
        W: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        E: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E)
      };

      this.wasdKeys.E.on('down', () => {
        this.triggerInteraction();
      });
    }

    // Camera
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setZoom(1.15);

    // Listen to network snapshot
    this.socketClient.onSnapshot((snapshot) => {
      this.updateFromSnapshot(snapshot);
    });
  }

  private drawHanoiMap() {
    // 1. Nền cỏ xanh mượt thủ đô
    const bg = this.add.graphics();
    bg.fillStyle(0x386641, 1);
    bg.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

    // Đường đi dạo lát đá quanh phố
    bg.fillStyle(0x9ca3af, 1);
    // Tuyến đường trục Tây-Đông
    bg.fillRect(80, 150, 1120, 36);
    // Tuyến đường trục Bắc-Nam qua Trụ sở
    bg.fillRect(340, 60, 36, 840);
    // Đường vòng quanh bờ hồ Hoàn Kiếm
    bg.lineStyle(40, 0xd1d5db, 1);
    bg.strokeRect(510, 330, 300, 280);

    // Tuyến đường nối sang Khu B qua cầu (đoạn ngắn)
    bg.fillRect(840, 435, 260, 40);

    // Tuyến Detour đi vòng phía Bắc kênh sang Khu B
    bg.fillRect(840, 150, 260, 36);
    bg.fillRect(1070, 150, 36, 300);

    // Tuyến đường xuống Kho vật tư và Khu C
    bg.fillRect(160, 740, 200, 36);
    bg.fillRect(340, 790, 480, 36);

    // 2. Kênh thoát nước phân cách phía Đông
    const canal = this.add.graphics();
    canal.fillStyle(0x0284c7, 0.85);
    canal.fillRect(870, 180, 30, 240); // Đoạn Bắc kênh
    canal.fillRect(870, 490, 30, 410); // Đoạn Nam kênh

    // 3. Hồ Gươm ở vị trí trung tâm
    const lake = this.add.graphics();
    lake.fillStyle(0x0284c7, 0.9);
    lake.fillRoundedRect(530, 350, 260, 240, 30);
    lake.lineStyle(6, 0x38bdf8, 0.8);
    lake.strokeRoundedRect(530, 350, 260, 240, 30);

    // Tháp Rùa và Đảo cỏ giữa hồ
    const thapRua = this.add.sprite(660, 465, 'thap_rua');
    thapRua.setDepth(470);

    // 4. Các công trình chính
    // Trụ sở chính quyền (Tây Bắc)
    const hq = this.add.sprite(POINTS_OF_INTEREST.HEADQUARTERS.x, POINTS_OF_INTEREST.HEADQUARTERS.y, 'headquarters');
    hq.setDepth(POINTS_OF_INTEREST.HEADQUARTERS.y);

    // Bảng công khai kết quả
    const notice = this.add.sprite(POINTS_OF_INTEREST.NOTICE_BOARD.x, POINTS_OF_INTEREST.NOTICE_BOARD.y, 'notice_board');
    notice.setDepth(POINTS_OF_INTEREST.NOTICE_BOARD.y);

    // Kho vật tư (Tây Nam)
    const wh = this.add.sprite(POINTS_OF_INTEREST.WAREHOUSE.x, POINTS_OF_INTEREST.WAREHOUSE.y, 'warehouse');
    wh.setDepth(POINTS_OF_INTEREST.WAREHOUSE.y);

    // Cầu đường bộ hư cấu qua kênh
    this.bridgeSprite = this.add.sprite(POINTS_OF_INTEREST.BRIDGE.x, POINTS_OF_INTEREST.BRIDGE.y, 'bridge_intact');
    this.bridgeSprite.setDepth(POINTS_OF_INTEREST.BRIDGE.y);

    // Khu dân cư A (Nhà A1, A2)
    const houseA1 = this.add.sprite(220, 210, 'house_a');
    houseA1.setDepth(210);
    const houseA2 = this.add.sprite(220, 300, 'house_a');
    houseA2.setDepth(300);

    // Khu dân cư B (Nhà B1, B2)
    const houseB1 = this.add.sprite(1085, 290, 'house_b');
    houseB1.setDepth(290);
    const houseB2 = this.add.sprite(1085, 380, 'house_b');
    houseB2.setDepth(380);

    // Khu dân cư C (Nhà C1, C2)
    const houseC1 = this.add.sprite(600, 865, 'house_c');
    houseC1.setDepth(865);
    const houseC2 = this.add.sprite(710, 865, 'house_c');
    houseC2.setDepth(865);

    // Đại diện NPC tại các khu
    this.add.sprite(POINTS_OF_INTEREST.ZONE_A.x, POINTS_OF_INTEREST.ZONE_A.y, 'npc_rep').setDepth(POINTS_OF_INTEREST.ZONE_A.y);
    this.add.sprite(POINTS_OF_INTEREST.ZONE_B.x, POINTS_OF_INTEREST.ZONE_B.y, 'npc_rep').setDepth(POINTS_OF_INTEREST.ZONE_B.y);
    this.add.sprite(POINTS_OF_INTEREST.ZONE_C.x, POINTS_OF_INTEREST.ZONE_C.y, 'npc_rep').setDepth(POINTS_OF_INTEREST.ZONE_C.y);

    // NPC Người cao tuổi C1 và C2
    this.add.sprite(POINTS_OF_INTEREST.CITIZEN_C1.x, POINTS_OF_INTEREST.CITIZEN_C1.y, 'npc_elder').setDepth(POINTS_OF_INTEREST.CITIZEN_C1.y);
    this.add.sprite(POINTS_OF_INTEREST.CITIZEN_C2.x, POINTS_OF_INTEREST.CITIZEN_C2.y, 'npc_elder').setDepth(POINTS_OF_INTEREST.CITIZEN_C2.y);

    // Các điểm trạm y tế
    this.clinicFixedSprite = this.add.sprite(POINTS_OF_INTEREST.CLINIC_FIXED.x, POINTS_OF_INTEREST.CLINIC_FIXED.y, 'clinic_fixed');
    this.clinicFixedSprite.setDepth(POINTS_OF_INTEREST.CLINIC_FIXED.y);
    this.clinicFixedSprite.setAlpha(0.4); // Mờ khi chưa xây

    this.clinicMobileBSprite = this.add.sprite(POINTS_OF_INTEREST.CLINIC_MOBILE_B.x, POINTS_OF_INTEREST.CLINIC_MOBILE_B.y, 'clinic_mobile');
    this.clinicMobileBSprite.setDepth(POINTS_OF_INTEREST.CLINIC_MOBILE_B.y);
    this.clinicMobileBSprite.setAlpha(0.4);

    this.clinicMobileCSprite = this.add.sprite(POINTS_OF_INTEREST.CLINIC_MOBILE_C.x, POINTS_OF_INTEREST.CLINIC_MOBILE_C.y, 'clinic_mobile');
    this.clinicMobileCSprite.setDepth(POINTS_OF_INTEREST.CLINIC_MOBILE_C.y);
    this.clinicMobileCSprite.setAlpha(0.4);

    // Vẽ nhãn địa danh trực quan trên bản đồ
    this.addPoiLabels();

    // Nhãn "Bản đồ mô phỏng"
    const labelSim = this.add.text(28, 20, 'BẢN ĐỒ MÔ PHỎNG — HÀ NỘI', {
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#0f172a',
      padding: { x: 8, y: 4 }
    });
    labelSim.setScrollFactor(0);
    labelSim.setDepth(2000);
  }

  private addPoiLabels() {
    for (const poi of Object.values(POINTS_OF_INTEREST)) {
      if (poi.id === 'PRACTICE_TARGET' || poi.id === 'BRIDGE_TASK_1' || poi.id === 'BRIDGE_TASK_2') continue;
      this.add.text(poi.x, poi.y + 24, poi.vietnameseLabel, {
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        color: '#f8fafc',
        backgroundColor: '#1e293bcc',
        padding: { x: 5, y: 2 }
      }).setOrigin(0.5, 0).setDepth(poi.y + 1);
    }
  }

  public update(time: number, delta: number) {
    this.handleMovement(delta);
    this.checkNearestPoi();

    if (this.interactRequested) {
      this.interactRequested = false;
      this.triggerInteraction();
    }
  }

  private handleMovement(delta: number) {
    if (!this.localPlayerSprite || !this.currentSnapshot) return;

    // Check if input element is focused in DOM
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');

    let dx = 0;
    let dy = 0;

    if (!isTyping) {
      if (this.cursors.left.isDown || this.wasdKeys.A.isDown) dx -= 1;
      if (this.cursors.right.isDown || this.wasdKeys.D.isDown) dx += 1;
      if (this.cursors.up.isDown || this.wasdKeys.W.isDown) dy -= 1;
      if (this.cursors.down.isDown || this.wasdKeys.S.isDown) dy += 1;
    }

    // Combine with virtual joystick
    if (this.joystickDelta.x !== 0 || this.joystickDelta.y !== 0) {
      dx += this.joystickDelta.x;
      dy += this.joystickDelta.y;
    }

    if (dx !== 0 || dy !== 0) {
      // Normalize diagonal
      const len = Math.hypot(dx, dy);
      const ndx = dx / len;
      const ndy = dy / len;

      const step = (PLAYER_SPEED * (delta / 1000));
      const targetX = this.localPlayerSprite.x + ndx * step;
      const targetY = this.localPlayerSprite.y + ndy * step;

      let dir: 'up' | 'down' | 'left' | 'right' = 'down';
      if (Math.abs(ndx) > Math.abs(ndy)) {
        dir = ndx > 0 ? 'right' : 'left';
      } else {
        dir = ndy > 0 ? 'down' : 'up';
      }

      this.localPlayerSprite.x = targetX;
      this.localPlayerSprite.y = targetY;
      this.localPlayerSprite.setDepth(targetY);

      // Send intent to server throttled (~15Hz = 66ms)
      const now = Date.now();
      if (now - this.lastMoveSent > 66) {
        this.lastMoveSent = now;
        this.socketClient.sendIntent({
          actionId: `mv_${now}`,
          type: 'MOVE',
          payload: { x: targetX, y: targetY, dir }
        });
      }
    }
  }

  private checkNearestPoi() {
    if (!this.localPlayerSprite) return;
    const px = this.localPlayerSprite.x;
    const py = this.localPlayerSprite.y;

    let closest: PointOfInterest | null = null;
    let minDist = Infinity;

    for (const poi of Object.values(POINTS_OF_INTEREST)) {
      const dist = Math.hypot(px - poi.x, py - poi.y);
      if (dist <= INTERACTION_RADIUS && dist < minDist) {
        minDist = dist;
        closest = poi;
      }
    }

    if (this.nearestPoi?.id !== closest?.id) {
      this.nearestPoi = closest;
      if (this.onNearestPoiChanged) {
        this.onNearestPoiChanged(closest);
      }
    }
  }

  public triggerInteraction() {
    if (this.nearestPoi && this.onInteractTriggered) {
      this.onInteractTriggered(this.nearestPoi);
    }
  }

  private updateFromSnapshot(snapshot: GameSnapshot) {
    this.currentSnapshot = snapshot;
    this.localPlayerId = this.socketClient.getPlayerId();

    // 1. Update Bridge visual
    if (this.bridgeSprite) {
      if (snapshot.m2.bridgeBroken && !snapshot.m2.bridgeRepaired) {
        this.bridgeSprite.setTexture('bridge_broken');
      } else {
        this.bridgeSprite.setTexture('bridge_intact');
      }
    }

    // 2. Update Clinic visuals
    if (this.clinicFixedSprite) {
      this.clinicFixedSprite.setAlpha(snapshot.m1.fixedDeployed ? 1.0 : 0.4);
    }
    if (this.clinicMobileBSprite) {
      this.clinicMobileBSprite.setAlpha(snapshot.m1.mobileBDeployed ? 1.0 : 0.4);
    }
    if (this.clinicMobileCSprite) {
      this.clinicMobileCSprite.setAlpha(snapshot.m1.mobileCDeployed ? 1.0 : 0.4);
    }

    // 3. Update Players
    const currentOnlinePlayerIds = new Set<string>();

    for (const [id, p] of Object.entries(snapshot.players)) {
      if (!p.isOnline) continue;
      currentOnlinePlayerIds.add(id);

      if (id === this.localPlayerId) {
        if (!this.localPlayerSprite) {
          this.localPlayerSprite = this.createPlayerContainer(p, true);
          this.cameras.main.startFollow(this.localPlayerSprite, true, 0.1, 0.1);
        } else {
          // Soft lerp if far from server position
          const dist = Math.hypot(this.localPlayerSprite.x - p.x, this.localPlayerSprite.y - p.y);
          if (dist > 60) {
            this.localPlayerSprite.x = p.x;
            this.localPlayerSprite.y = p.y;
          }
          this.updatePlayerCarriedIcon(this.localPlayerSprite, p);
        }
      } else {
        let otherContainer = this.otherPlayerSprites.get(id);
        if (!otherContainer) {
          otherContainer = this.createPlayerContainer(p, false);
          this.otherPlayerSprites.set(id, otherContainer);
        }
        // Smooth interpolate other players
        otherContainer.x = Phaser.Math.Linear(otherContainer.x, p.x, 0.3);
        otherContainer.y = Phaser.Math.Linear(otherContainer.y, p.y, 0.3);
        otherContainer.setDepth(otherContainer.y);
        this.updatePlayerCarriedIcon(otherContainer, p);
      }
    }

    // Remove disconnected players
    for (const [id, container] of this.otherPlayerSprites.entries()) {
      if (!currentOnlinePlayerIds.has(id)) {
        container.destroy();
        this.otherPlayerSprites.delete(id);
      }
    }

    // 4. Update Dropped Crates on the ground
    for (const [id, crate] of Object.entries(snapshot.crates)) {
      if (crate.state === 'DROPPED') {
        let crateContainer = this.crateSprites.get(id);
        if (!crateContainer) {
          crateContainer = this.add.container(crate.x, crate.y);
          const spr = this.add.sprite(0, 0, 'crate');
          const txt = this.add.text(0, 16, 'Vật tư', { fontSize: '10px', color: '#fef08a' }).setOrigin(0.5);
          crateContainer.add([spr, txt]);
          crateContainer.setDepth(crate.y);
          this.crateSprites.set(id, crateContainer);
        } else {
          crateContainer.x = crate.x;
          crateContainer.y = crate.y;
        }
      } else {
        const crateContainer = this.crateSprites.get(id);
        if (crateContainer) {
          crateContainer.destroy();
          this.crateSprites.delete(id);
        }
      }
    }
  }

  private createPlayerContainer(player: Player, isLocal: boolean): Phaser.GameObjects.Container {
    const container = this.add.container(player.x, player.y);

    // Indicator ring for local player
    if (isLocal) {
      const ring = this.add.graphics();
      ring.lineStyle(2, 0xfacc15, 0.9);
      ring.strokeCircle(0, 10, 18);
      container.add(ring);
    }

    const sprite = this.add.sprite(0, 0, 'player_base');
    const colorInt = parseInt(player.color.replace('#', '0x'), 16);
    sprite.setTint(colorInt);

    const nameText = this.add.text(0, -22, player.name + (isLocal ? ' (Bạn)' : ''), {
      fontFamily: 'Inter, sans-serif',
      fontSize: '11px',
      color: '#ffffff',
      backgroundColor: '#0f172acc',
      padding: { x: 4, y: 1 }
    }).setOrigin(0.5);

    // Job progress bar above player
    const progressBar = this.add.graphics();
    progressBar.setName('progressBar');

    // Carried crate icon
    const crateIcon = this.add.sprite(0, -36, 'crate');
    crateIcon.setScale(0.7);
    crateIcon.setName('crateIcon');
    crateIcon.setVisible(!!player.carriedCrateId);

    container.add([sprite, nameText, progressBar, crateIcon]);
    container.setDepth(player.y);
    return container;
  }

  private updatePlayerCarriedIcon(container: Phaser.GameObjects.Container, player: Player) {
    const crateIcon = container.getByName('crateIcon') as Phaser.GameObjects.Sprite;
    if (crateIcon) {
      crateIcon.setVisible(!!player.carriedCrateId);
    }

    const progressBar = container.getByName('progressBar') as Phaser.GameObjects.Graphics;
    if (progressBar) {
      progressBar.clear();
      if (player.activeJob && player.activeJob.progress > 0) {
        // Draw progress bar
        progressBar.fillStyle(0x0f172a, 0.8);
        progressBar.fillRect(-18, -12, 36, 6);
        progressBar.fillStyle(0x22c55e, 1);
        progressBar.fillRect(-17, -11, 34 * player.activeJob.progress, 4);
      }
    }
  }
}
