import { GameEngine } from '../../gameEngine.js';
import { createProvinceRuntime } from '../../gameplay/registry.js';
import { PublicServiceRuntime } from '../../gameplay/presets/public-service/runtime.js';
import { HatinhRuntime } from '../../gameplay/provinces/ha-tinh/runtime.js';
import type { ProvinceRuntime } from '../../gameplay/core/contracts.js';
import type { MapId } from 'shared';

const runtimes = new WeakMap<GameEngine, ProvinceRuntime>();
export function createTestEngine(roomCode: string, hostToken: string, mapId: MapId = 'hanoi') {
  let runtime!: ProvinceRuntime;
  const engine = new GameEngine(roomCode, hostToken, mapId, (id, ports) => {
    runtime = createProvinceRuntime(id, ports); return runtime;
  });
  runtimes.set(engine, runtime); return engine;
}
/** Rule/geometry fixtures edit the owning module, never transport projections. */
export function serviceStateOf(engine: GameEngine) {
  const runtime = runtimes.get(engine);
  if (runtime instanceof PublicServiceRuntime) return runtime.state;
  if (runtime instanceof HatinhRuntime) return runtime.service.state;
  throw new Error('Engine was not created by the fixture factory');
}
export function rescueStateOf(engine: GameEngine) {
  const runtime = runtimes.get(engine);
  if (runtime instanceof HatinhRuntime) return runtime.state;
  throw new Error('Expected Hà Tĩnh fixture');
}
