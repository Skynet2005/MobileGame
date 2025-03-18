import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class ControlsManager {
  public controls: OrbitControls | null = null;
  public is3DMode = true;
  // Added property to ensure the initial zoom animation runs only once.
  private initialZoomDone: boolean = false;

  constructor(
    public camera: THREE.PerspectiveCamera,
    public renderer: THREE.WebGLRenderer,
    public container: HTMLElement,
    public width: number,
    public height: number
  ) { }

  // Helper method to log camera angle and zoom
  private logCameraDetails(): void {
    const cameraAngle = new THREE.Vector3(
      this.camera.rotation.x,
      this.camera.rotation.y,
      this.camera.rotation.z
    );
    const cameraZoom = this.camera.zoom;
    console.log('Camera angle:', cameraAngle);
    console.log('Camera zoom:', cameraZoom);
  }

  public initializeControls(): boolean {
    if (!this.camera || !this.renderer || !this.renderer.domElement) {
      console.error('Cannot initialize controls: camera or renderer not available');
      return false;
    }

    // Dispose of any existing controls
    if (this.controls) {
      this.controls.dispose();
    }

    // Create new OrbitControls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Get furnace position from global game state
    const furnaceX = window.game?.worldMap?.playerFurnace?.x ?? this.width / 2;
    const furnaceY = window.game?.worldMap?.playerFurnace?.y ?? this.height / 2;

    // Set initial camera position
    const MIN_DISTANCE = 5;
    const ANGLE = (70 * Math.PI) / 180;
    const height = MIN_DISTANCE * Math.sin(ANGLE);
    const horizontalDist = MIN_DISTANCE * Math.cos(ANGLE);
    const DIAGONAL_ANGLE = Math.PI / 4;
    const offsetX = horizontalDist * Math.cos(DIAGONAL_ANGLE);
    const offsetZ = horizontalDist * Math.sin(DIAGONAL_ANGLE);

    this.camera.position.set(
      furnaceX + 1 - offsetX,
      height,
      furnaceY + 1 - offsetZ
    );
    this.camera.lookAt(furnaceX + 1, 0, furnaceY + 1);

    // Set controls
    this.controls.target.set(furnaceX + 1, 0, furnaceY + 1);

    // Basic control setup
    this.controls.enableZoom = true;
    this.controls.enablePan = true;
    this.controls.enableRotate = true;
    this.controls.screenSpacePanning = false; // This ensures panning stays on the ground plane
    this.controls.rotateSpeed = 1.0; // Adjust rotation sensitivity

    // Allow full spherical rotation
    this.controls.minPolarAngle = 0; // Can look straight down
    this.controls.maxPolarAngle = Math.PI; // Can look straight up
    this.controls.minAzimuthAngle = -Infinity; // No horizontal rotation limits
    this.controls.maxAzimuthAngle = Infinity; // No horizontal rotation limits

    // Set mouse buttons
    this.controls.mouseButtons = {
      LEFT: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.ROTATE
    };

    // Touch controls
    this.controls.touches = {
      ONE: THREE.TOUCH.PAN,
      TWO: THREE.TOUCH.DOLLY_PAN
    };

    // Store initial state
    let lastHeight = this.camera.position.y;
    let lastDistance = this.camera.position.distanceTo(this.controls.target);
    let isWheelEvent = false;

    // Track wheel events
    if (this.renderer?.domElement) {
      this.renderer.domElement.addEventListener('wheel', (event) => {
        isWheelEvent = true;

        // Calculate new height and distance based on wheel delta
        const zoomFactor = 1 + event.deltaY * 0.001;

        // Calculate potential new height and enforce minimum
        const newHeight = Math.max(lastHeight * zoomFactor, 1); // Minimum height of 1 unit
        const newDistance = lastDistance * zoomFactor;

        // Only update if we're not going below minimum height
        if (newHeight >= 1 && this.controls) {
          lastHeight = newHeight;
          lastDistance = newDistance;

          // Update camera position maintaining direction but with new height/distance
          const direction = new THREE.Vector3()
            .subVectors(this.camera.position, this.controls.target)
            .normalize();

          // Set new position
          if (this.controls) {
            this.camera.position.copy(this.controls.target)
              .add(direction.multiplyScalar(lastDistance));
            this.camera.position.y = lastHeight;
          }
        }

        // Prevent default scroll behavior
        event.preventDefault();

        // Reset wheel flag after a short delay
        setTimeout(() => {
          isWheelEvent = false;
        }, 50);
      }, { passive: false });
    }

    // Handle all other camera changes
    this.controls.addEventListener('change', () => {
      if (!this.camera || !this.controls) return;

      if (!isWheelEvent) {
        // For non-wheel events, maintain the last height and distance
        const direction = new THREE.Vector3()
          .subVectors(this.camera.position, this.controls.target)
          .normalize();

        // Calculate new position maintaining distance but allowing full rotation
        this.camera.position.copy(this.controls.target)
          .add(direction.multiplyScalar(lastDistance));

        // Ensure we never go below minimum height
        this.camera.position.y = Math.max(this.camera.position.y, 1);
      }
    });

    // Initial update
    this.controls.update();

    // Initial zoom animation
    if (!this.initialZoomDone && this.controls) {
      this.initialZoomDone = true;
      const startDistance = this.camera.position.distanceTo(this.controls.target);
      const endDistance = 20; // Closer starting distance
      const startHeight = this.camera.position.y;
      const endHeight = 15; // Lower starting height
      const direction = new THREE.Vector3()
        .subVectors(this.camera.position, this.controls.target)
        .normalize();
      const duration = 2000;
      const startTime = performance.now();

      const animateZoom = (currentTime: number) => {
        if (!this.controls || !this.camera) return;

        const elapsed = currentTime - startTime;
        const t = Math.min(elapsed / duration, 1);
        const easeT = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;

        // Interpolate both distance and height
        const currentDistance = startDistance + easeT * (endDistance - startDistance);
        const currentHeight = Math.max(startHeight + easeT * (endHeight - startHeight), 1);

        // Update camera position
        this.camera.position.copy(this.controls.target)
          .add(direction.clone().multiplyScalar(currentDistance));
        this.camera.position.y = currentHeight;

        // Update stored values
        lastDistance = currentDistance;
        lastHeight = currentHeight;

        this.controls.update();

        if (t < 1) {
          requestAnimationFrame(animateZoom);
        }
      };

      requestAnimationFrame(animateZoom);
    }

    return true;
  }

  public toggleViewMode(scene: THREE.Scene): void {
    if (!this.camera || !this.controls || !this.renderer) {
      console.error('Required components not initialized for toggleViewMode');
      return;
    }

    this.is3DMode = !this.is3DMode;
    console.log(`Toggling view mode to: ${this.is3DMode ? '3D' : 'Top-Down'}`);

    const originalEnabled = this.controls.enabled;
    this.controls.enabled = false;

    if (this.is3DMode) {
      // 3D perspective view - no restrictions
      this.camera.position.set(this.width / 2, 400, this.height / 2 + 300);
      this.camera.lookAt(this.width / 2, 0, this.height / 2);
      this.controls.enableRotate = true;
      this.controls.minDistance = 0;
      this.controls.maxDistance = Infinity;
      this.controls.minPolarAngle = 0;
      this.controls.maxPolarAngle = Math.PI;
    } else {
      // Top-down view (2D-like) - no restrictions
      this.camera.position.set(this.width / 2, 800, this.height / 2);
      this.camera.lookAt(this.width / 2, 0, this.height / 2);
      this.controls.enableRotate = true;
      this.controls.minDistance = 0;
      this.controls.maxDistance = Infinity;
    }

    this.controls.target.set(this.width / 2, 0, this.height / 2);
    this.controls.update();
    this.controls.enabled = originalEnabled;

    // Force a render
    this.renderer.render(scene, this.camera);

    // Dispatch an event to notify other components of the change
    window.dispatchEvent(new CustomEvent('viewModeChanged', {
      detail: { is3DMode: this.is3DMode }
    }));

    // Log camera angle and zoom
    this.logCameraDetails();
  }

  public centerOnPlayerFurnace(): void {
    if (!this.camera || !this.controls || !window.game || !window.game.worldMap || !window.game.worldMap.playerFurnace) {
      console.error('Required components not initialized for centerOnPlayerFurnace');
      return;
    }

    const furnace = window.game.worldMap.playerFurnace;
    const x = furnace.x;
    const z = furnace.y;

    // First set the target to the furnace position
    this.controls.target.set(x + 1, 0, z + 1);  // Center on furnace (+1 because furnace is 2x2)

    // Calculate the current camera position and target
    const startDistance = this.camera.position.distanceTo(this.controls.target);
    const MIN_DISTANCE = 10;
    const ANGLE = (70 * Math.PI) / 180; // 70 degrees from horizontal
    const height = MIN_DISTANCE * Math.sin(ANGLE);
    const horizontalDist = MIN_DISTANCE * Math.cos(ANGLE);
    const DIAGONAL_ANGLE = Math.PI / 4; // 45 degrees for diamond view
    const offsetX = horizontalDist * Math.cos(DIAGONAL_ANGLE);
    const offsetZ = horizontalDist * Math.sin(DIAGONAL_ANGLE);

    // Calculate the end position
    const endDistance = MIN_DISTANCE * 1.30; // 30% further out, matching initial load
    const direction = new THREE.Vector3(
      -(offsetX / MIN_DISTANCE),
      height / MIN_DISTANCE,
      -(offsetZ / MIN_DISTANCE)
    ).normalize();

    // Animate to the new position
    const duration = 2000; // 2 seconds, matching initial load
    const startTime = performance.now();

    const animateZoom = (currentTime: number) => {
      if (!this.controls || !this.camera) return;

      const elapsed = currentTime - startTime;
      const t = Math.min(elapsed / duration, 1);
      const currentDistance = startDistance + t * (endDistance - startDistance);

      // Update camera position
      this.camera.position.copy(this.controls.target)
        .add(direction.clone().multiplyScalar(currentDistance));

      this.controls.update();

      if (t < 1) {
        requestAnimationFrame(animateZoom);
      }
    };

    requestAnimationFrame(animateZoom);

    // Log position for debugging
    console.log('Camera centered on furnace:', { x, z });
    console.log('New camera position:', this.camera.position);

    // Log camera angle and zoom
    this.logCameraDetails();
  }

  public centerOnCastle(scene: THREE.Scene): void {
    const centerX = Math.floor(this.width / 2);
    const centerZ = Math.floor(this.height / 2);
    if (this.controls) {
      this.controls.target.set(centerX, 0, centerZ);
    }
    if (this.is3DMode) {
      this.camera.position.set(centerX, 100, centerZ + 100);
    } else {
      this.camera.position.set(centerX, 200, centerZ);
    }
    this.camera.lookAt(centerX, 0, centerZ);

    // Log camera angle and zoom
    this.logCameraDetails();
  }

  public setViewAngle(scene: THREE.Scene, angle: number): void {
    if (!this.camera || !this.controls || !this.renderer) {
      console.error('Required components not initialized for setViewAngle');
      return;
    }

    console.log(`Setting view angle to: ${angle}°`);

    const angleRad = (angle * Math.PI) / 180;
    const mapSize = Math.max(this.width, this.height);
    const distance = mapSize * 0.5;    // Adjusted for better perspective
    const heightValue = mapSize * 0.25;  // Ensure proper height
    const centerX = this.width / 2;
    const centerZ = this.height / 2;

    // Calculate new camera position based on angle
    const x = centerX + Math.sin(angleRad) * distance;
    const z = centerZ + Math.cos(angleRad) * distance;

    // Temporarily disable controls to prevent interference
    const originalEnabled = this.controls.enabled;
    this.controls.enabled = false;

    // Set camera position and look at the center
    this.camera.position.set(x, heightValue, z);
    this.camera.lookAt(centerX, 0, centerZ);

    // Update control target and re-enable
    this.controls.target.set(centerX, 0, centerZ);
    this.controls.update();
    this.controls.enabled = originalEnabled;

    // Force a render
    this.renderer.render(scene, this.camera);

    console.log('View angle changed, new camera position:', this.camera.position);

    // Log camera angle and zoom
    this.logCameraDetails();
  }

  public resetCamera(scene: THREE.Scene): void {
    if (!this.camera || !this.controls || !this.renderer) {
      console.error('Camera or controls not initialized in resetCamera');
      return;
    }

    console.log('Resetting camera to default position');

    // Temporarily disable controls
    const originalEnabled = this.controls.enabled;
    // Reset control settings with no limitations
    this.controls.enableRotate = true;
    this.controls.enablePan = true;
    this.controls.enableZoom = true;
    this.controls.minDistance = 0;
    this.controls.maxDistance = Infinity;
    this.controls.minPolarAngle = 0;
    this.controls.maxPolarAngle = Math.PI;

    // Reset camera to default position
    this.camera.position.set(this.width / 2, 400, this.height / 2 + 300);
    this.camera.lookAt(this.width / 2, 0, this.height / 2);

    // Reset control target and update
    this.controls.target.set(this.width / 2, 0, this.height / 2);
    this.controls.update();

    // Re-enable controls
    this.controls.enabled = originalEnabled;

    // Force a render
    this.renderer.render(scene, this.camera);

    console.log('Camera reset complete');

    // Log camera angle and zoom
    this.logCameraDetails();
  }
}
