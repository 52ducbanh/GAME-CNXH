import { describe, it, expect } from 'vitest';
import { GameEngine } from '../gameEngine.js';
import { startTask, releaseTask } from '../gameplay/core/tasks.js';
import { deductResource } from '../gameplay/core/resources.js';
import { VotingCapability } from '../gameplay/core/voting.js';
import { ItemCapability } from '../gameplay/core/items.js';
import { PublicServiceRuntime } from '../gameplay/presets/public-service/runtime.js';
import type { GameplayPorts } from '../gameplay/core/ports.js';

describe('Extracted gameplay capabilities', () => {
  it('reserves/releases manpower exactly once for a timed task', () => {
    const engine = new GameEngine('TASK', 'host'), player = engine.addPlayer('p', 'P');
    startTask(player, { type: 'DEPLOY_FIXED_CLINIC', targetId: 'CLINIC_FIXED', durationMs: 8000, requiresManpower: true }, engine.manpower, 'job');
    expect(engine.manpower.busy).toBe(1);
    expect(releaseTask(player, engine.manpower)?.durationMs).toBe(8000);
    expect(releaseTask(player, engine.manpower)).toBeNull();
    expect(engine.manpower.busy).toBe(0);
  });
  it('keeps the budget, ledger balance and audit in one transaction', () => {
    const engine = new GameEngine('LEDGER', 'host');
    deductResource(engine.resources, 'M1', 'Trạm y tế', 40, engine.addAuditEvent.bind(engine));
    expect(engine.resources.currentBudget).toBe(60);
    expect(engine.resources.entries[0].balanceAfter).toBe(60);
    expect(engine.resources.version).toBe(2);
    expect(engine.recentAuditEvents[0].category).toBe('RESOURCE');
  });
  it('keeps solo auto-commit and multiplayer proposer tie-break semantics', () => {
    const engine = new GameEngine('VOTE', 'host'), p = engine.addPlayer('p', 'P');
    const commits: string[] = [];
    const voting = new VotingCapability({ players: engine.players, onlineCount: () => engine.getOnlinePlayerCount(), contribution: id => engine.personalContributions.get(id), audit: engine.addAuditEvent.bind(engine), commit: (_, plan) => commits.push(plan) });
    voting.start('M1', 'MOBILE', p);
    expect(commits).toEqual(['MOBILE']);
    const q = engine.addPlayer('q', 'Q');
    voting.start('M1', 'FIXED', p); voting.cast(q, 'MOBILE', 'q-vote');
    expect(commits).toEqual(['MOBILE', 'FIXED']);
    expect(voting.state).toBeNull();
  });
  it('preserves explicit-crate races, ownership and returning stock', () => {
    const engine = new GameEngine('ITEM', 'host'), p = engine.addPlayer('p', 'P'), q = engine.addPlayer('q', 'Q');
    const items = new ItemCapability({ map: engine.map, crates: engine.crates, resources: engine.resources, paused: () => engine.isPaused, contribution: id => engine.personalContributions.get(id), audit: engine.addAuditEvent.bind(engine) });
    Object.assign(p, engine.map.points.WAREHOUSE); Object.assign(q, engine.map.points.WAREHOUSE);
    expect(items.pick(p, undefined, 'pick').success).toBe(true);
    const id = p.carriedCrateId!; items.drop(p, 'drop');
    expect(items.pick(q, id, 'q').success).toBe(true);
    expect(items.pick(p, id, 'race').success).toBe(false);
    items.returnToStock(q, 'return'); expect(engine.resources.availableCrates).toBe(12);
  });
  it('creates independent semantic state and derives the public-service score', () => {
    const engine = new GameEngine('PRESET', 'host');
    const ports: GameplayPorts = {
      read: { map: engine.map, phase: () => engine.phase, paused: () => engine.isPaused, snapshot: () => engine.getSnapshot() },
      team: { contribution: id => engine.personalContributions.get(id), onlineCount: () => engine.getOnlinePlayerCount(), audit: engine.addAuditEvent.bind(engine) },
      tasks: { manpower: engine.manpower, start: (p, spec, id) => startTask(p, spec, engine.manpower, id) },
      items: { get: id => engine.crates.get(id) },
      resources: { ledger: engine.resources, deduct: (id, text, amount) => deductResource(engine.resources, id, text, amount, engine.addAuditEvent.bind(engine)) },
      votes: { active: () => false, start: () => {} },
      lifecycle: { end: engine.endMatch.bind(engine), recoverWorld: () => {} },
      practice: { complete: () => {}, deliver: () => {} },
    };
    const a = new PublicServiceRuntime(ports), b = new PublicServiceRuntime(ports);
    a.state.medicalService.score = 8;
    expect(a.totalScore()).toBe(8); expect(b.totalScore()).toBe(0);
    expect(a.state.citizens).not.toBe(b.state.citizens);
    a.reset(); expect(a.totalScore()).toBe(0);
  });
});
