import { Surface } from './movement.js';
export const MOVEMENT_AUDIO_CONFIG={stepDistance:48,volume:0.35,pitchVariation:0.035,volumeVariation:0.06,contactReleaseMs:150};
// Only solver distance enters this state machine. Corrections/reset never count.
export class MovementFeedback {
  private distance=0;
  private contactLatched=false;
  private clearMs=0;
  resetDistance(){this.distance=0;}
  reset(){this.distance=0;this.contactLatched=false;this.clearMs=0;}
  frame(distance:number,surface:Surface,blocked:boolean,dt:number):{steps:Surface[];bump:boolean}{
    let bump=false;const steps:Surface[]=[];
    if(blocked){this.clearMs=0;if(!this.contactLatched){bump=true;this.contactLatched=true;}}
    else{this.clearMs+=dt;if(this.clearMs>=MOVEMENT_AUDIO_CONFIG.contactReleaseMs)this.contactLatched=false;}
    if(distance<=0.02){this.distance=0;return {steps,bump};}
    this.distance+=distance;
    while(this.distance>=MOVEMENT_AUDIO_CONFIG.stepDistance){this.distance-=MOVEMENT_AUDIO_CONFIG.stepDistance;steps.push(surface);}
    return {steps,bump};
  }
}
