import { describe, it, expect } from 'vitest';
import { GameEngine } from '../gameEngine.js';
import { GAME_MAPS, getInteractionActions, resolveInteraction } from 'shared';

describe('Shared input interaction eligibility and authority', () => {
  const at = (p:{x:number;y:number}, point:{x:number;y:number}) => {p.x=point.x;p.y=point.y;};
  const setup = () => { const e = new GameEngine('INPUT_TEST', 'host'); const p = e.addPlayer('p1', 'Một', true); e.startRunning(); return {e,p}; };
  it('every map offers the same survey, pick and planning behavior', () => {
    for (const map of GAME_MAPS.filter(m => m.id !== 'ha-tinh')) {
      const e = new GameEngine('MAP_TEST', 'host', map.id), p = e.addPlayer('p1', 'Một'); e.startRunning();
      at(p,map.points.ZONE_A);
      const action = resolveInteraction(e.getSnapshot(), p.id).primary!;
      expect(action.intent.payload).toEqual({type:'SURVEY_ZONE',targetId:'ZONE_A'});
      expect(e.handleIntent(p.id,{...action.intent,actionId:'survey'}).success).toBe(true);
      e.tick(4100); expect(e.m1.surveys.A).toBe(true);
    }
  });
  it('hides out-of-range, paused, offline and completed actions', () => {
    const {e,p}=setup(); at(p,e.map.points.ZONE_A);
    expect(resolveInteraction(e.getSnapshot(),p.id,{x:0,y:0}).primary).toBeNull();
    e.m1.surveys.A=true;
    expect(getInteractionActions(e.getSnapshot(),p.id).some(a=>a.targetId==='ZONE_A')).toBe(false);
    e.isPaused=true;expect(resolveInteraction(e.getSnapshot(),p.id).secondary).toBeNull();
    e.isPaused=false;e.removeOrDisconnectPlayer(p.id);expect(getInteractionActions(e.getSnapshot(),p.id)).toEqual([]);
  });
  it('one claimant per objective, released on cancel, completed audits cannot score twice', () => {
    const {e,p}=setup(), peer=e.addPlayer('p2','Hai');
    e.m1.planCommitted='FIXED';e.m1.deliveredCratesFixed=2;e.m1.fixedDeployed=true;
    at(p,e.map.points.CLINIC_FIXED);at(peer,e.map.points.CLINIC_FIXED);
    const job={type:'START_JOB' as const,payload:{type:'AUDIT_RESULT',targetId:'CLINIC_FIXED'}};
    expect(e.handleIntent(p.id,{...job,actionId:'audit'}).success).toBe(true);
    expect(e.handleIntent(peer.id,{...job,actionId:'audit'}).success).toBe(false);
    e.handleIntent(p.id,{actionId:'cancel',type:'CANCEL_JOB'});
    expect(e.handleIntent(peer.id,{...job,actionId:'retry'}).success).toBe(true);
    e.tick(4100);const score=e.totalScore;
    expect(e.handleIntent(p.id,{...job,actionId:'late'}).success).toBe(false);e.tick(4100);expect(e.totalScore).toBe(score);
  });
  it('two players cannot pick the same named dropped item or silently pick a different one', () => {
    const {e,p}=setup(),peer=e.addPlayer('p2','Hai');at(p,e.map.points.WAREHOUSE);at(peer,e.map.points.WAREHOUSE);
    e.handleIntent(p.id,{actionId:'stock',type:'PICK_CRATE'});const id=p.carriedCrateId!;
    e.handleIntent(p.id,{actionId:'drop',type:'DROP_CRATE'});
    const pick={type:'PICK_CRATE' as const,payload:{crateId:id}};
    expect(e.handleIntent(peer.id,{...pick,actionId:'claim'}).success).toBe(true);
    const remaining=e.resources.availableCrates;
    expect(e.handleIntent(p.id,{...pick,actionId:'claim'}).success).toBe(false);
    expect(p.carriedCrateId).toBeNull();expect(e.resources.availableCrates).toBe(remaining);
  });
  it('receipts replay once per player and reject changed payloads', () => {
    const {e,p}=setup(),peer=e.addPlayer('p2','Hai');at(p,e.map.points.WAREHOUSE);at(peer,e.map.points.WAREHOUSE);
    const pick={actionId:'same',type:'PICK_CRATE' as const};const first=e.handleIntent(p.id,pick);
    expect(e.handleIntent(p.id,pick)).toEqual(first);expect(e.resources.availableCrates).toBe(11);
    expect(e.handleIntent(peer.id,pick).success).toBe(true);expect(e.resources.availableCrates).toBe(10);
    expect(e.handleIntent(p.id,{actionId:'same',type:'DROP_CRATE'}).success).toBe(false);expect(p.carriedCrateId).not.toBeNull();
  });
  it('G context is cancel, then drop, then ping; cargo survives reconnect grace', () => {
    const {e,p}=setup();at(p,e.map.points.WAREHOUSE);e.handleIntent(p.id,{actionId:'pick',type:'PICK_CRATE'});
    const cargo=p.carriedCrateId;expect(resolveInteraction(e.getSnapshot(),p.id).secondary?.intent.type).toBe('DROP_CRATE');
    e.removeOrDisconnectPlayer(p.id);e.addPlayer(p.id,p.name);expect(p.carriedCrateId).toBe(cargo);
    e.handleIntent(p.id,{actionId:'drop',type:'DROP_CRATE'});expect(resolveInteraction(e.getSnapshot(),p.id).secondary?.intent.type).toBe('PING_LOCATION');
    at(p,e.map.points.ZONE_A);e.handleIntent(p.id,{actionId:'survey',type:'START_JOB',payload:{type:'SURVEY_ZONE',targetId:'ZONE_A'}});
    expect(resolveInteraction(e.getSnapshot(),p.id).secondary?.intent.type).toBe('CANCEL_JOB');
  });
  it('helper inquiries use actionId receipts, phase/range/pause and reject invalid job targets', () => {
    const {e,p}=setup();e.m2.status='ACTIVE';at(p,e.map.points.BRIDGE);
    const ask={actionId:'ask',type:'START_JOB' as const,payload:{type:'SURVEY_BRIDGE',targetId:'BRIDGE'}};
    const first=e.handleIntent(p.id,ask);expect(first).toEqual({actionId:'ask',success:true});const score=e.totalScore;
    expect(e.handleIntent(p.id,ask)).toEqual(first);expect(e.totalScore).toBe(score);
    expect(e.handleIntent(p.id,{actionId:'bad',type:'START_JOB',payload:{type:'AUDIT_RESULT',targetId:'WAREHOUSE'}}).success).toBe(false);
    e.isPaused=true;expect(e.handleIntent(p.id,{actionId:'paused',type:'PING_LOCATION'}).success).toBe(false);
  });
});

