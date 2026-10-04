/// <reference types="vite/client" />
import { Surface, MovementFeedback, MOVEMENT_AUDIO_CONFIG } from 'shared';
const movementFiles={stone:['footstep_concrete_000.ogg','footstep_concrete_001.ogg','footstep_concrete_002.ogg'],grass:['footstep_grass_000.ogg','footstep_grass_001.ogg','footstep_grass_002.ogg'],wood:['footstep_wood_000.ogg','footstep_wood_001.ogg','footstep_wood_002.ogg'],bump:['impactGeneric_light_000.ogg']};
// Existing procedural quest/UI feedback is preserved. Movement uses cached CC0 samples.
export class SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastStepTime: number = 0;
  private volume=Number(localStorage.getItem('sfx_volume')??MOVEMENT_AUDIO_CONFIG.volume);
  private feedback=new MovementFeedback();
  private buffers=new Map<string,AudioBuffer>();
  private lastVariant=new Map<string,number>();
  private sources=new Set<AudioBufferSourceNode>();
  private active=false;
  private playedSteps=0;
  private playedBumps=0;
  private unlocked=false;
  private loading:Promise<void>|null=null;
  private master:GainNode|null=null;
  private unlockListener=()=>{void this.unlock();};
  private silenceListener=()=>{this.stopMovementSources();this.feedback.reset();};

  constructor() {
    this.muted = localStorage.getItem('sound_muted') === 'true';
    if(!Number.isFinite(this.volume))this.volume=MOVEMENT_AUDIO_CONFIG.volume;
    this.volume=Math.max(0,Math.min(1,this.volume));
  }
  public getVolume(){return this.volume;}
  public movementStatus(){return {active:this.active,unlocked:this.unlocked,state:this.ctx?.state??'not-created',cachedSamples:this.buffers.size,activeSources:this.sources.size,playedSteps:this.playedSteps,playedBumps:this.playedBumps,muted:this.muted,volume:this.volume};}
  public setVolume(value:number){this.volume=Math.max(0,Math.min(1,value));localStorage.setItem('sfx_volume',String(this.volume));if(this.master)this.master.gain.value=this.muted?0:this.volume;}
  public beginMovement(){
    if(this.active)return;this.active=true;this.feedback.reset();
    document.addEventListener('pointerdown',this.unlockListener);
    document.addEventListener('keydown',this.unlockListener);
    window.addEventListener('blur',this.silenceListener);
    document.addEventListener('visibilitychange',this.silenceListener);
  }
  public endMovement(){
    this.active=false;this.silenceListener();
    document.removeEventListener('pointerdown',this.unlockListener);document.removeEventListener('keydown',this.unlockListener);
    window.removeEventListener('blur',this.silenceListener);document.removeEventListener('visibilitychange',this.silenceListener);
  }
  public async unlock(){
    const ctx=this.getContext();if(!ctx)return;
    try{await ctx.resume();this.unlocked=ctx.state==='running';}catch{return;}
    if(!this.loading)this.loading=this.loadMovement(ctx);
  }
  private async loadMovement(ctx:AudioContext){
    await Promise.all(Object.values(movementFiles).flat().map(async file=>{
      try{const response=await fetch(`${import.meta.env.BASE_URL}assets/audio/movement/${file}`);if(!response.ok)throw Error(String(response.status));const buffer=await ctx.decodeAudioData(await response.arrayBuffer());this.buffers.set(file,buffer);}catch(error){console.warn(`Movement audio unavailable: ${file}`,String(error));}
    }));
  }
  private stopMovementSources(){for(const source of this.sources){try{source.stop();}catch{}source.disconnect();}this.sources.clear();}
  public resetMovement(){this.feedback.resetDistance();this.stopMovementSources();}
  public idleMovement(dt:number){this.feedback.frame(0,'stone',false,dt);}
  public movementFrame(distance:number,surface:Surface,blocked:boolean,dt:number){
    if(!this.active||document.hidden||!document.hasFocus()){this.silenceListener();return;}
    const events=this.feedback.frame(distance,surface,blocked,dt);
    if(events.bump)this.playMovement('bump');
    for(const step of events.steps)this.playMovement(step);
  }
  private playMovement(kind:keyof typeof movementFiles){
    const ctx=this.ctx;if(!ctx||!this.unlocked||this.muted||ctx.state!=='running')return;
    const available=movementFiles[kind].filter(file=>this.buffers.has(file));if(!available.length)return;
    const last=this.lastVariant.get(kind)??-1;
    const variants=available.map((_,i)=>i).filter(i=>i!==last||available.length===1),index=variants[Math.floor(Math.random()*variants.length)];this.lastVariant.set(kind,index);
    const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=this.buffers.get(available[index])!;
    if(kind==='bump')this.playedBumps++;else this.playedSteps++;
    source.playbackRate.value=1+(Math.random()*2-1)*MOVEMENT_AUDIO_CONFIG.pitchVariation;
    gain.gain.value=(kind==='bump'?0.35:0.7)*(1+(Math.random()*2-1)*MOVEMENT_AUDIO_CONFIG.volumeVariation);
    source.connect(gain);gain.connect(this.output(ctx));this.sources.add(source);
    source.onended=()=>{this.sources.delete(source);source.disconnect();gain.disconnect();};source.start();
  }
  private output(ctx:AudioContext){if(!this.master){this.master=ctx.createGain();this.master.gain.value=this.muted?0:this.volume;this.master.connect(ctx.destination);}return this.master;}

  private getContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try{this.ctx = new AudioCtx();}catch(error){console.warn('Audio context unavailable',String(error));return null;}
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    localStorage.setItem('sound_muted', String(this.muted));
    if(this.master)this.master.gain.value=this.muted?0:this.volume;
    if(this.muted)this.stopMovementSources();else void this.unlock();
    if (this.ctx && this.muted && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
    return this.muted;
  }

  public playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.06);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.06);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.06);
  }

  public playPick() {
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.12);
    gain.gain.setValueAtTime(0.25, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playDeliver() {
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [659.25, 880]; // E5 -> A5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + idx * 0.08;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.22);
    });
  }

  public playScore() {
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + idx * 0.07;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    });
  }

  public playAlert() {
    const ctx = this.getContext();
    if (!ctx) return;
    const notes = [440, 554.37]; // A4 -> C#5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const t = ctx.currentTime + idx * 0.1;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
  }

  public playStep() {
    const now = Date.now();
    if (now - this.lastStepTime < 320) return;
    this.lastStepTime = now;
    const ctx = this.getContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = ctx.currentTime;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110 + Math.random() * 20, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.04);
    gain.gain.setValueAtTime(0.04, t);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }
}

export const soundManager = new SoundManager();
