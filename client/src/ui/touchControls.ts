import { InteractionContext } from 'shared';
import { InputController } from '../game/inputController.js';
export class TouchControls {
  private container: HTMLElement;
  private pointer: number | null = null;
  private input?: InputController;
  private thumb: HTMLElement;
  constructor() {
    this.container = document.createElement('div'); this.container.id = 'touch-controls';
    this.container.innerHTML = '<div id="joystick-zone" aria-label="Di chuyển: đẩy nhẹ để đi, hết biên để chạy"><div id="joystick-base"><div id="joystick-thumb"></div></div></div><button id="btn-touch-secondary" disabled><span>G</span><b>Hành động</b></button><button id="btn-touch-interact" disabled><span>E</span><b>Tương tác</b></button>';
    document.body.appendChild(this.container);
    const zone = this.container.querySelector('#joystick-zone') as HTMLElement;
    this.thumb = this.container.querySelector('#joystick-thumb') as HTMLElement;
    const move = (event: PointerEvent) => {
      const r = zone.getBoundingClientRect(), radius = Math.min(36, r.width * .32);
      const dx = event.clientX - r.left - r.width / 2, dy = event.clientY - r.top - r.height / 2;
      const d = Math.hypot(dx, dy), scale = Math.min(1, radius / Math.max(1, d));
      this.thumb.style.transform = `translate(${dx * scale}px,${dy * scale}px)`;
      this.input?.setTouchMove({ x: d > 6 ? dx * scale / radius : 0, y: d > 6 ? dy * scale / radius : 0 });
    };
    zone.addEventListener('pointerdown', event => { if (this.pointer !== null) return; this.pointer = event.pointerId; zone.setPointerCapture(this.pointer); move(event); });
    zone.addEventListener('pointermove', event => { if (event.pointerId === this.pointer) move(event); });
    for (const name of ['pointerup', 'pointercancel', 'lostpointercapture']) zone.addEventListener(name, event => { if ((event as PointerEvent).pointerId === this.pointer) this.reset(); });
    for (const [id, action] of [['btn-touch-interact', 'INTERACT'], ['btn-touch-secondary', 'SECONDARY_ACTION']] as const)
      this.container.querySelector(`#${id}`)!.addEventListener('click', () => this.input?.request(action));
  }
  public connect(input: InputController) { this.input = input; }
  public reset() { this.pointer = null; this.thumb.style.transform = 'translate(0,0)'; this.input?.setTouchMove({ x: 0, y: 0 }); }
  public update(context: InteractionContext, pending: boolean, locked: boolean) {
    for (const [id, action] of [['btn-touch-interact', context.primary], ['btn-touch-secondary', context.secondary]] as const) {
      const btn = this.container.querySelector(`#${id}`) as HTMLButtonElement;
      btn.disabled = !action || pending || locked; btn.setAttribute('aria-busy', String(pending));
      const label = pending ? 'Đang gửi…' : id === 'btn-touch-interact' && context.choices.length ? 'Chọn phương án' : action?.label ?? (id === 'btn-touch-interact' ? 'Tương tác' : 'Hành động');
      if (btn.querySelector('b')!.textContent !== label) btn.querySelector('b')!.textContent = label;
    }
  }
}
