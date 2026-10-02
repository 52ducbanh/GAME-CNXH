export class TouchControls {
  private container: HTMLElement;
  private joystickBase: HTMLElement | null = null;
  private joystickThumb: HTMLElement | null = null;
  private interactBtn: HTMLElement | null = null;

  private isDragging: boolean = false;
  private touchId: number | null = null;
  private baseCenter: { x: number; y: number } = { x: 0, y: 0 };
  private maxRadius: number = 44;

  public onJoystickMove?: (delta: { x: number; y: number }) => void;
  public onInteractPress?: () => void;

  constructor() {
    this.container = document.createElement('div');
    this.container.id = 'touch-controls';
    this.container.className = 'fixed inset-0 pointer-events-none z-30 select-none';
    document.body.appendChild(this.container);

    this.render();
    this.bindEvents();
  }

  private render() {
    this.container.innerHTML = `
      <!-- Virtual Joystick Zone (Bottom Left) -->
      <div id="joystick-zone" class="absolute bottom-6 left-6 w-36 h-36 rounded-full bg-slate-900/40 border border-slate-700/60 pointer-events-auto flex items-center justify-center backdrop-blur-sm touch-none">
        <div id="joystick-base" class="relative w-28 h-28 rounded-full bg-slate-800/60 border border-slate-600/80 flex items-center justify-center">
          <div id="joystick-thumb" class="w-14 h-14 rounded-full bg-blue-500/80 border-2 border-white shadow-lg pointer-events-none transform translate-x-0 translate-y-0 transition-transform duration-75"></div>
        </div>
      </div>

      <!-- Action Interact Button (Bottom Right) -->
      <div class="absolute bottom-6 right-6 pointer-events-auto flex flex-col items-center space-y-2">
        <button id="btn-touch-interact" class="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-600 to-amber-500 border-4 border-amber-300 shadow-2xl flex flex-col items-center justify-center text-white active:scale-95 transition-transform touch-manipulation">
          <span class="text-xs uppercase font-extrabold tracking-wider">TƯƠNG TÁC</span>
          <span class="text-[10px] opacity-80">[E]</span>
        </button>
      </div>
    `;

    this.joystickBase = this.container.querySelector('#joystick-base');
    this.joystickThumb = this.container.querySelector('#joystick-thumb');
    this.interactBtn = this.container.querySelector('#btn-touch-interact');
  }

  private bindEvents() {
    const zone = this.container.querySelector('#joystick-zone');
    if (zone && this.joystickBase && this.joystickThumb) {
      zone.addEventListener('touchstart', (e: any) => {
        const touch = e.changedTouches[0];
        this.touchId = touch.identifier;
        this.isDragging = true;
        const rect = this.joystickBase!.getBoundingClientRect();
        this.baseCenter = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
        this.handleTouchMove(touch.clientX, touch.clientY);
        e.preventDefault();
      }, { passive: false });

      window.addEventListener('touchmove', (e: any) => {
        if (!this.isDragging) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.touchId) {
            this.handleTouchMove(touch.clientX, touch.clientY);
            e.preventDefault();
            break;
          }
        }
      }, { passive: false });

      const endHandler = (e: any) => {
        if (!this.isDragging) return;
        for (let i = 0; i < e.changedTouches.length; i++) {
          if (e.changedTouches[i].identifier === this.touchId) {
            this.isDragging = false;
            this.touchId = null;
            if (this.joystickThumb) {
              this.joystickThumb.style.transform = `translate(0px, 0px)`;
            }
            if (this.onJoystickMove) {
              this.onJoystickMove({ x: 0, y: 0 });
            }
            break;
          }
        }
      };

      window.addEventListener('touchend', endHandler);
      window.addEventListener('touchcancel', endHandler);
    }

    if (this.interactBtn) {
      this.interactBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (this.onInteractPress) {
          this.onInteractPress();
        }
      });
    }
  }

  private handleTouchMove(clientX: number, clientY: number) {
    const rawDx = clientX - this.baseCenter.x;
    const rawDy = clientY - this.baseCenter.y;
    const dist = Math.hypot(rawDx, rawDy);

    const clampedDist = Math.min(this.maxRadius, dist);
    const angle = Math.atan2(rawDy, rawDx);

    const thumbX = Math.cos(angle) * clampedDist;
    const thumbY = Math.sin(angle) * clampedDist;

    if (this.joystickThumb) {
      this.joystickThumb.style.transform = `translate(${thumbX}px, ${thumbY}px)`;
    }

    const normalizedX = dist > 6 ? (thumbX / this.maxRadius) : 0;
    const normalizedY = dist > 6 ? (thumbY / this.maxRadius) : 0;

    if (this.onJoystickMove) {
      this.onJoystickMove({ x: normalizedX, y: normalizedY });
    }
  }
}
