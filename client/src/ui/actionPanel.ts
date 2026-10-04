import { GameSnapshot, InteractionAction, PointOfInterest, getInteractionActions, INTERACTION_RADIUS } from 'shared';
import { SocketClient } from '../network/socketClient.js';
import { escapeHtml } from './utils.js';
// Existing non-modal drawer; choices share eligibility with E/G and the server.
export class ActionPanel {
  private container: HTMLElement;
  private currentPoi: PointOfInterest | null = null;
  private snapshot: GameSnapshot | null = null;
  private renderKey = '';
  public onExecute?: (action: InteractionAction) => void;
  constructor(private socketClient: SocketClient) {
    this.container = document.createElement('div'); this.container.id = 'action-panel'; this.container.className = 'hidden'; document.body.appendChild(this.container);
  }
  public updateSnapshot(snapshot: GameSnapshot) { this.snapshot = snapshot; this.render(); }
  public show(poi: PointOfInterest) { this.currentPoi = poi; this.renderKey = ''; this.container.classList.remove('hidden'); this.render(); }
  public hide() { this.container.classList.add('hidden'); this.currentPoi = null; }
  public isOpen() { return !this.container.classList.contains('hidden'); }
  public setPending(pending: boolean) { this.container.dataset.pending = String(pending); for (const button of this.container.querySelectorAll<HTMLButtonElement>('button[data-action]')) button.disabled = pending; }
  private render() {
    const poi = this.currentPoi, s = this.snapshot, id = this.socketClient.getPlayerId(); if (!poi || !s) return;
    const player = s.players[id];
    if (!player || Math.hypot(player.x - poi.x, player.y - poi.y) > INTERACTION_RADIUS) { this.hide(); return; }
    const actions = getInteractionActions(s, id).filter(a => a.targetId === poi.id);
    const key = JSON.stringify([actions.map(a => a.id), player.activeJob?.type, s.isPaused]); if (key === this.renderKey) return; this.renderKey = key;
    this.container.innerHTML = `<div class="p-5 relative"><button id="btn-close-action-panel" aria-label="Đóng lựa chọn">✕</button><h2>${escapeHtml(poi.name)}</h2><p>${escapeHtml(poi.description)}</p><div class="interaction-choices"></div></div>`;
    const choices = this.container.querySelector('.interaction-choices')!;
    if (!actions.length) choices.textContent = player.activeJob ? 'Đang thực hiện công việc. G để hủy.' : 'Chưa có hành động phù hợp tại đây.';
    for (const action of actions) {
      const button = document.createElement('button'); button.className = 'blue-button'; button.dataset.action = action.id; button.textContent = action.label;
      button.addEventListener('click', () => this.onExecute?.(action)); choices.appendChild(button);
      if(action.description){const copy=document.createElement('p');copy.textContent=action.description;choices.appendChild(copy);}
    }
    this.container.querySelector('#btn-close-action-panel')!.addEventListener('click', () => this.hide());
    this.setPending(this.container.dataset.pending === 'true');
  }
}
