export type InputAction = 'INTERACT' | 'SECONDARY_ACTION' | 'MAP' | 'MENU';
export const KEY_BINDINGS: Record<string, InputAction> = { KeyE: 'INTERACT', KeyG: 'SECONDARY_ACTION', KeyM: 'MAP', Escape: 'MENU' };
export class InputController {
  private held = new Set<string>();
  private touch = { x: 0, y: 0 };
  private locked = false;
  public onAction?: (action: InputAction) => void;
  public onReset?: () => void;
  public isTyping() { const el = document.activeElement as HTMLElement | null; return !!el && (['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName) || el.isContentEditable); }
  private keydown = (event: KeyboardEvent) => {
    if (this.isTyping()) { if (event.code === 'Escape' && !event.repeat) this.request('MENU'); return; }
    if (!['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'].includes(event.code) && !(event.code in KEY_BINDINGS)) return;
    event.preventDefault();
    if (event.repeat || this.held.has(event.code)) return;
    this.held.add(event.code);
    const action = KEY_BINDINGS[event.code]; if (action) this.request(action);
  };
  private keyup = (event: KeyboardEvent) => { this.held.delete(event.code); };
  private visibility = () => { if (document.hidden) this.reset(); };
  constructor() {
    window.addEventListener('keydown', this.keydown); window.addEventListener('keyup', this.keyup);
    window.addEventListener('blur', this.reset); document.addEventListener('visibilitychange', this.visibility);
    window.addEventListener('contextmenu', this.reset); window.addEventListener('pagehide', this.reset);
  }
  public request(action: InputAction) { if (action === 'MENU' || (!this.locked && !this.isTyping())) this.onAction?.(action); }
  public setTouchMove(value: { x: number; y: number }) { this.touch = this.locked ? { x: 0, y: 0 } : value; }
  public setLocked(locked: boolean) { if (locked !== this.locked) { this.locked = locked; this.reset(); } }
  public read() {
    if (this.locked || this.isTyping()) return { move: { x: 0, y: 0 }, sprint: false };
    const down = (...keys: string[]) => keys.some(k => this.held.has(k)) ? 1 : 0;
    const x = down('KeyD', 'ArrowRight') - down('KeyA', 'ArrowLeft') + this.touch.x;
    const y = down('KeyS', 'ArrowDown') - down('KeyW', 'ArrowUp') + this.touch.y;
    const length = Math.hypot(x, y), scale = length > 1 ? 1 / length : 1;
    return { move: { x: x * scale, y: y * scale }, sprint: this.held.has('ShiftLeft') || this.held.has('ShiftRight') || Math.hypot(this.touch.x, this.touch.y) >= .92 };
  }
  public reset = () => { this.held.clear(); this.touch = { x: 0, y: 0 }; this.onReset?.(); };
  public destroy() { this.reset(); window.removeEventListener('keydown', this.keydown); window.removeEventListener('keyup', this.keyup); window.removeEventListener('blur', this.reset); document.removeEventListener('visibilitychange', this.visibility); window.removeEventListener('contextmenu', this.reset); window.removeEventListener('pagehide', this.reset); }
}
