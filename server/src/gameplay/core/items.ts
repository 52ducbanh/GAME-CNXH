import { INITIAL_CRATES, INTERACTION_RADIUS } from 'shared';
import type { Crate, Player, ServerAck, WorldMap, ResourceLedger, PersonalContribution, AuditEvent } from 'shared';
interface ItemPorts {
  map:WorldMap; crates:Map<string,Crate>; resources:ResourceLedger;
  paused():boolean;
  contribution(id:string):PersonalContribution|undefined;
  audit(category:AuditEvent['category'],message:string,playerId?:string):void;
}
const distance=(x1:number,y1:number,x2:number,y2:number)=>Math.hypot(x2-x1,y2-y1);
export class ItemCapability {
  constructor(private readonly ports:ItemPorts){}
  public deliver(player: Player, crateId: string) {
    const crate = this.ports.crates.get(crateId);
    if (!crate) return;
    crate.state = 'DELIVERED';
    crate.carriedByPlayerId = null;
    player.carriedCrateId = null;
  }
  public reset() {
    this.ports.crates.clear();
    for (let i = 1; i <= INITIAL_CRATES; i++) {
      const id = `CRATE_${i}`;
      this.ports.crates.set(id, {
        id,
        state: 'WAREHOUSE',
        x: this.ports.map.points.WAREHOUSE.x,
        y: this.ports.map.points.WAREHOUSE.y,
        carriedByPlayerId: null,
        missionContext: 'M1',
        purpose: 'Vật tư công',
        deliveredSlotId: null
      });
    }
  }

  public pick(player: Player, crateId: string | undefined, actionId: string): ServerAck {
    if (this.ports.paused()) return { actionId, success: false, reason: 'Trận đấu đang tạm dừng.' };
    if (player.carriedCrateId) return { actionId, success: false, reason: 'Bạn đang mang một kiện vật tư rồi.' };

    // 1. Check if picking a DROPPED crate on the ground nearby
    let droppedCrate: Crate | undefined;
    if (crateId) {
      const c = this.ports.crates.get(crateId);
      if (c && c.state === 'DROPPED' && distance(player.x, player.y, c.x, c.y) <= INTERACTION_RADIUS) {
        droppedCrate = c;
      }
    }
    if (crateId && !droppedCrate) return { actionId, success: false, reason: 'Kiện này đã được nhặt hoặc không còn trong phạm vi.' };
    if (!droppedCrate) {
      for (const c of this.ports.crates.values()) {
        if (c.state === 'DROPPED' && distance(player.x, player.y, c.x, c.y) <= INTERACTION_RADIUS) {
          droppedCrate = c;
          break;
        }
      }
    }

    if (droppedCrate) {
      droppedCrate.state = 'CARRIED';
      droppedCrate.carriedByPlayerId = player.id;
      droppedCrate.x = player.x;
      droppedCrate.y = player.y;
      player.carriedCrateId = droppedCrate.id;

      this.ports.audit('RESOURCE', `${player.name} đã nhặt lại kiện ${droppedCrate.id} từ mặt đất.`, player.id);
      return { actionId, success: true };
    }

    // 2. Otherwise pick from Warehouse stock if at Warehouse
    const warehousePoi = this.ports.map.points.WAREHOUSE;
    const isAtWarehouse = distance(player.x, player.y, warehousePoi.x, warehousePoi.y) <= INTERACTION_RADIUS;

    if (isAtWarehouse) {
      if (this.ports.resources.availableCrates <= 0) {
        return { actionId, success: false, reason: 'Kho đã hết kiện vật tư sẵn có!' };
      }

      // Find first WAREHOUSE crate
      let targetCrate: Crate | undefined;
      for (const c of this.ports.crates.values()) {
        if (c.state === 'WAREHOUSE') {
          targetCrate = c;
          break;
        }
      }

      if (!targetCrate) {
        return { actionId, success: false, reason: 'Không tìm thấy kiện vật tư trong kho.' };
      }

      targetCrate.state = 'CARRIED';
      targetCrate.carriedByPlayerId = player.id;
      targetCrate.x = player.x;
      targetCrate.y = player.y;
      player.carriedCrateId = targetCrate.id;
      this.ports.resources.availableCrates--;

      const contrib = this.ports.contribution(player.id);
      if (contrib) contrib.deliveries++;

      this.ports.audit('RESOURCE', `${player.name} đã lấy kiện ${targetCrate.id} từ Kho vật tư.`, player.id);
      return { actionId, success: true };
    }

    return { actionId, success: false, reason: 'Bạn cần ở gần Kho vật tư hoặc kiện rơi trên đất để lấy vật tư.' };
  }

  public drop(player: Player, actionId: string): ServerAck {
    if (!player.carriedCrateId) {
      return { actionId, success: false, reason: 'Bạn không mang kiện vật tư nào.' };
    }

    const crate = this.ports.crates.get(player.carriedCrateId);
    if (!crate) {
      player.carriedCrateId = null;
      return { actionId, success: false, reason: 'Kiện vật tư không tồn tại.' };
    }

    crate.state = 'DROPPED';
    crate.carriedByPlayerId = null;
    crate.x = player.x;
    crate.y = player.y;
    player.carriedCrateId = null;

    this.ports.audit('RESOURCE', `${player.name} đã đặt kiện ${crate.id} xuống đất tại vị trí an toàn.`, player.id);
    return { actionId, success: true };
  }

  public returnToStock(player: Player, actionId: string): ServerAck {
    if (!player.carriedCrateId) {
      return { actionId, success: false, reason: 'Bạn không mang kiện vật tư nào.' };
    }

    const warehousePoi = this.ports.map.points.WAREHOUSE;
    if (distance(player.x, player.y, warehousePoi.x, warehousePoi.y) > INTERACTION_RADIUS) {
      return { actionId, success: false, reason: 'Cần đến gần Kho vật tư để hoàn trả.' };
    }

    const crate = this.ports.crates.get(player.carriedCrateId);
    if (crate) {
      crate.state = 'WAREHOUSE';
      crate.carriedByPlayerId = null;
      crate.x = warehousePoi.x;
      crate.y = warehousePoi.y;
      this.ports.resources.availableCrates++;
    }
    player.carriedCrateId = null;

    this.ports.audit('RESOURCE', `${player.name} đã hoàn trả an toàn kiện vật tư về Kho.`, player.id);
    return { actionId, success: true };
  }
}
