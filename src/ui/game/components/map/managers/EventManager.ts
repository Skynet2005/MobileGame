import * as THREE from 'three';

export interface EventCallbacks {
  onMouseMove: (event: MouseEvent) => void;
  onMouseClick: (event: MouseEvent) => void;
  onTouchStart: (event: TouchEvent) => void;
  onTouchMove: (event: TouchEvent) => void;
  onTouchEnd: (event: TouchEvent) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onWindowResize: (event: UIEvent) => void;
}

export class EventManager {
  private isDragging = false;
  private mouseDownTime = 0;
  private readonly CLICK_TIME_THRESHOLD = 200; // ms
  private readonly DRAG_DISTANCE_THRESHOLD = 5; // pixels
  private mouseDownPosition = { x: 0, y: 0 };
  private raycaster: THREE.Raycaster;
  private camera: THREE.Camera;
  private groundPlane: THREE.Plane;

  constructor(
    private rendererDomElement: HTMLElement,
    private callbacks: EventCallbacks,
    camera: THREE.Camera
  ) {
    this.raycaster = new THREE.Raycaster();
    this.camera = camera;
    // Create a plane at y=0 for raycasting
    this.groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  }

  private getMapCoordinates(event: MouseEvent): { x: number, y: number } | null {
    // Get normalized device coordinates
    const rect = this.rendererDomElement.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Set up raycaster
    this.raycaster.setFromCamera(new THREE.Vector2(x, y), this.camera);

    // Get intersection point with ground plane
    const intersectionPoint = new THREE.Vector3();
    const intersected = this.raycaster.ray.intersectPlane(this.groundPlane, intersectionPoint);

    if (intersected) {
      // Return the coordinates, rounded to integers
      return {
        x: Math.round(intersectionPoint.x),
        y: Math.round(intersectionPoint.z)
      };
    }

    return null;
  }

  public setup(): void {
    // Mouse down with time tracking
    this.rendererDomElement.addEventListener('mousedown', (e: MouseEvent) => {
      this.isDragging = false;
      this.mouseDownTime = Date.now();
      this.mouseDownPosition = { x: e.clientX, y: e.clientY };
    }, { passive: true });

    // Mouse move tracking
    this.rendererDomElement.addEventListener('mousemove', (e: MouseEvent) => {
      // Handle dragging detection
      if (this.mouseDownTime > 0) {
        const dx = e.clientX - this.mouseDownPosition.x;
        const dy = e.clientY - this.mouseDownPosition.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > this.DRAG_DISTANCE_THRESHOLD) {
          this.isDragging = true;
        }
      }

      // Get and dispatch coordinates
      const coords = this.getMapCoordinates(e);
      if (coords) {
        window.dispatchEvent(new CustomEvent('mapCoordinateUpdate', {
          detail: coords
        }));
      }

      this.callbacks.onMouseMove(e);
    }, { passive: true });

    // Mouse up with click detection
    this.rendererDomElement.addEventListener('mouseup', (e: MouseEvent) => {
      const clickDuration = Date.now() - this.mouseDownTime;
      if (!this.isDragging && clickDuration < this.CLICK_TIME_THRESHOLD) {
        const coords = this.getMapCoordinates(e);
        if (coords) {
          // Dispatch coordinates for click
          window.dispatchEvent(new CustomEvent('mapCoordinateUpdate', {
            detail: coords
          }));
          this.callbacks.onMouseClick(e);
        }
      }
      this.mouseDownTime = 0;
      setTimeout(() => {
        this.isDragging = false;
      }, 10);
    }, { passive: true });

    // Touch events for mobile
    this.rendererDomElement.addEventListener('touchstart', this.callbacks.onTouchStart, { passive: false });
    this.rendererDomElement.addEventListener('touchmove', this.callbacks.onTouchMove, { passive: false });
    this.rendererDomElement.addEventListener('touchend', this.callbacks.onTouchEnd, { passive: true });

    // Keyboard events
    window.addEventListener('keydown', this.callbacks.onKeyDown, { passive: true });

    // Window resize
    window.addEventListener('resize', this.callbacks.onWindowResize);
  }

  public dispose(): void {
    this.rendererDomElement.removeEventListener('mousemove', this.callbacks.onMouseMove);
    this.rendererDomElement.removeEventListener('touchstart', this.callbacks.onTouchStart);
    this.rendererDomElement.removeEventListener('touchmove', this.callbacks.onTouchMove);
    this.rendererDomElement.removeEventListener('touchend', this.callbacks.onTouchEnd);
    window.removeEventListener('keydown', this.callbacks.onKeyDown);
    window.removeEventListener('resize', this.callbacks.onWindowResize);
  }
}
