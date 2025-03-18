import * as THREE from 'three';
import { GridManager } from './managers/GridManager';
import { CastleManager } from './managers/CastleManager';
import { ResourceManager } from './managers/ResourceManager';
import { ControlsManager } from './managers/ControlsManager';
import { EventManager, EventCallbacks } from './managers/EventManager';
import { GridCell, Zone, PlayerFurnace, WorldResource } from '@/types/world';

// Define view modes for the map
export enum ViewMode {
  DEFAULT = 'default',
  EXPLORATION = 'exploration',
  STRATEGIC = 'strategic'
}

export class ThreeWorldMap {
  public width: number = 1200;
  public height: number = 1200;
  public cellSize: number = 1;
  public scene: THREE.Scene | null = null;
  public camera: THREE.PerspectiveCamera | null = null;
  public renderer: THREE.WebGLRenderer | null = null;
  public gridManager: GridManager;
  public castleManager: CastleManager;
  public resourceManager: ResourceManager;
  public controlsManager: ControlsManager | null = null;
  public eventManager: EventManager | null = null;
  public cellMeshes: { [key: string]: THREE.Mesh | THREE.Group } = {};
  public zones: Zone[] = [
    { name: 'ruins', color: 0x2c3e50 },    // Dark blue-gray for the ruins
    { name: 'tundra', color: 0x34495e },         // Medium blue-gray for tundra
    { name: 'ice-fields', color: 0xb2d6ff },     // Light ice blue for the outer ice fields
  ];
  public zoneBoundaries: number[] = [0.33, 0.66, 1.0];
  public castleSize: number = 4;  // Center castle size (4x4)
  public turretSize: number = 2;  // Turret size (2x2)
  public castleAreaSize: number = 12; // Total castle area size (12x12)
  public castleColor: number = 0xFFD700;
  public turretColor: number = 0x786fa6;
  public playerFurnace: PlayerFurnace = { x: 600, y: 600, size: 2, color: 0xffaa00 };
  public is3DMode: boolean = false;
  public containerElement: HTMLElement | null = null;
  public raycaster: THREE.Raycaster = new THREE.Raycaster();
  public mouse: THREE.Vector2 = new THREE.Vector2();
  public selectedCell: GridCell | null = null;
  public coordinateDisplay: HTMLDivElement | null;
  public coordinateTimeout: number | null = null;
  private frameId: number | null = null;
  // Track if we've already added the coordinate display to avoid duplicate additions/removals
  private coordinateDisplayAdded: boolean = false;
  private directionalLight: THREE.DirectionalLight | null = null;
  private lightAngle: number = 0;
  private readonly LIGHT_ROTATION_SPEED: number = 0.0001; // Radians per frame

  constructor() {
    // Initialize managers that do not need scene/camera immediately.
    this.gridManager = new GridManager(this.width, this.height, this.zones, this.zoneBoundaries);
    this.castleManager = new CastleManager(
      this.width,
      this.height,
      this.castleSize,
      this.turretSize,
      this.castleAreaSize,
      this.castleColor,
      this.turretColor
    );
    this.resourceManager = new ResourceManager();

    // Create the coordinate display element but DO NOT add it to document yet
    // We'll create a new element during init to avoid any issues with React
    this.coordinateDisplay = document.createElement('div');
    // No need to set properties now, we'll recreate it during init
  }

  public init(container: HTMLElement): boolean {
    if (!container) {
      console.error('No container element provided for ThreeWorldMap');
      return false;
    }
    this.containerElement = container;
    this.is3DMode = true;

    try {
      console.log('ThreeWorldMap.init - Container dimensions:', container.clientWidth, 'x', container.clientHeight);

      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x222222);

      const aspect = container.clientWidth / container.clientHeight || 1;
      this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 5000);

      // Created Logic for review:
      // Start camera centered above player furnace with good viewing distance
      const furnaceX = this.playerFurnace.x;
      const furnaceY = this.playerFurnace.y;
      const MIN_DISTANCE = 8;  // Match ControlsManager
      const ANGLE = Math.PI / 3; // 60 degrees
      const height = MIN_DISTANCE * Math.sin(ANGLE);

      // Position camera centered above furnace
      this.camera.position.set(
        furnaceX + 1,  // Center on furnace (+1 because furnace is 2x2)
        height,
        furnaceY + 1   // Center on furnace (+1 because furnace is 2x2)
      );
      this.camera.lookAt(furnaceX + 1, 0, furnaceY + 1);  // Look at center of furnace

      // Create renderer with explicit settings
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
      });
      this.renderer.setSize(container.clientWidth || 800, container.clientHeight || 600);
      this.renderer.setPixelRatio(window.devicePixelRatio);

      // Clear container and set up renderer canvas
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      this.renderer.domElement.style.display = 'block';
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.zIndex = '5';
      container.appendChild(this.renderer.domElement);

      // Initialize controls
      if (this.camera && this.renderer) {
        this.controlsManager = new ControlsManager(this.camera, this.renderer, container, this.width, this.height);
        const success = this.controlsManager.initializeControls();
        if (!success) {
          console.error('Failed to initialize controls');
          return false;
        }
      }

      // Add lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
      this.scene.add(ambientLight);

      this.directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
      this.directionalLight.position.set(100, 100, 100);
      this.scene.add(this.directionalLight);

      // Initialize grid and other components
      this.gridManager.initGrid();
      this.gridManager.createGroundPlane(this.scene);
      this.gridManager.createGridMesh(this.scene, this.cellMeshes);

      // Add castle
      this.castleManager.addCastle(this.scene, this.gridManager.grid);

      // Generate resources
      this.resourceManager.generateResources(this.scene, this.gridManager.grid, this.width, this.height, this.cellMeshes);

      // Set up event handlers
      this.onWindowResize = this.onWindowResize.bind(this);
      this.animate = this.animate.bind(this);
      this.onMouseMove = this.onMouseMove.bind(this);
      this.onMouseClick = this.onMouseClick.bind(this);
      this.onTouchStart = this.onTouchStart.bind(this);
      this.onTouchMove = this.onTouchMove.bind(this);
      this.onTouchEnd = this.onTouchEnd.bind(this);
      this.onKeyDown = this.onKeyDown.bind(this);

      window.addEventListener('resize', this.onWindowResize);

      // Set up event listeners
      if (this.renderer) {
        const callbacks: EventCallbacks = {
          onMouseMove: this.onMouseMove,
          onMouseClick: this.onMouseClick,
          onTouchStart: this.onTouchStart,
          onTouchMove: this.onTouchMove,
          onTouchEnd: this.onTouchEnd,
          onKeyDown: this.onKeyDown,
          onWindowResize: this.onWindowResize,
        };
        this.eventManager = new EventManager(this.renderer.domElement, callbacks, this.camera);
        this.eventManager.setup();
      }

      // Start animation loop
      this.animate();

      // Lock controls temporarily
      if (this.controlsManager && this.controlsManager.controls) {
        this.controlsManager.controls.enabled = false;
        setTimeout(() => {
          if (this.controlsManager && this.controlsManager.controls) {
            this.controlsManager.controls.enabled = true;
          }
        }, 1000);
      }

      // Force an initial render
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }

      return true;
    } catch (error) {
      console.error('Error initializing ThreeWorldMap:', error);
      return false;
    }
  }

  public placeFurnace(x: number, y: number, player: any): boolean {
    if (!this.canPlaceFurnace(x, y)) return false;
    this.playerFurnace.x = x;
    this.playerFurnace.y = y;
    if (!this.scene) return false;

    // Create a group for the furnace components
    const furnaceGroup = new THREE.Group();

    // Base platform (wider and flatter) - now circular
    const baseGeometry = new THREE.CylinderGeometry(1.0, 1.0, 0.3, 32);  // Radius 1.0 to fit in 2x2 area
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.8,
      metalness: 0.2
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(0, 0.15, 0);
    furnaceGroup.add(baseMesh);

    // Main building structure (central part) - now circular
    const buildingGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);  // Radius 0.8 for the main platform
    const buildingMaterial = new THREE.MeshStandardMaterial({
      color: this.playerFurnace.color,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0xc0c0c0,
      emissiveIntensity: 0.2
    });
    const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
    buildingMesh.position.set(0, 0.35, 0);
    furnaceGroup.add(buildingMesh);

    // Central tower
    const towerGeometry = new THREE.CylinderGeometry(0.25, 0.3, 0.75, 32);
    const towerMaterial = new THREE.MeshStandardMaterial({
      color: this.playerFurnace.color,
      roughness: 0.4,
      metalness: 0.6,
      emissive: 0xff4400,
      emissiveIntensity: 0.3
    });
    const towerMesh = new THREE.Mesh(towerGeometry, towerMaterial);
    towerMesh.position.set(0, 0.4, 0);  // Position adjusted to sit on main building (0.35 + 0.75/2)
    furnaceGroup.add(towerMesh);

    // Add black ring at tower base
    const baseRingGeometry = new THREE.TorusGeometry(0.3, 0.05, 16, 32);  // Increased radius to 0.4 and thickness to 0.05
    const baseRingMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.8
    });
    const baseRingMesh = new THREE.Mesh(baseRingGeometry, baseRingMaterial);
    baseRingMesh.rotation.x = Math.PI / 2;
    baseRingMesh.position.set(0, 0.42, 0);  // Raised to be more visible above the main building
    furnaceGroup.add(baseRingMesh);

    // Add four black rectangular pillars around the central tower
    const pillarBaseGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.15);
    const pillarTopGeometry = new THREE.BoxGeometry(0.12, 0.2, 0.12);
    const pillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.3,
      metalness: 0.7
    });

    // Position the pillars at 45-degree angles around the tower
    const radius = 0.35;
    const pillarPositions = [
      { angle: Math.PI / 4, x: radius * Math.cos(Math.PI / 4), z: radius * Math.sin(Math.PI / 4) },
      { angle: 3 * Math.PI / 4, x: radius * Math.cos(3 * Math.PI / 4), z: radius * Math.sin(3 * Math.PI / 4) },
      { angle: 5 * Math.PI / 4, x: radius * Math.cos(5 * Math.PI / 4), z: radius * Math.sin(5 * Math.PI / 4) },
      { angle: 7 * Math.PI / 4, x: radius * Math.cos(7 * Math.PI / 4), z: radius * Math.sin(7 * Math.PI / 4) }
    ];

    pillarPositions.forEach(pos => {
      // Create pillar base
      const pillarBase = new THREE.Mesh(pillarBaseGeometry, pillarMaterial);
      pillarBase.position.set(pos.x, 0.4, pos.z);  // Adjusted to match tower base height
      furnaceGroup.add(pillarBase);

      // Create pillar top (smaller section)
      const pillarTop = new THREE.Mesh(pillarTopGeometry, pillarMaterial);
      pillarTop.position.set(pos.x, 0.8, pos.z);  // Adjusted to match new pillar base height
      furnaceGroup.add(pillarTop);
    });

    // Tower top
    const towerTopGeometry = new THREE.CylinderGeometry(0.4, 0.3, 0.15, 8);
    const towerTopMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.5,
      metalness: 0.5
    });
    const towerTopMesh = new THREE.Mesh(towerTopGeometry, towerTopMaterial);
    towerTopMesh.position.set(0, 0.85, 0);  // Adjusted to sit on top of central tower
    furnaceGroup.add(towerTopMesh);

    // Add miniature tower on top
    const miniTowerGeometry = new THREE.CylinderGeometry(0.12, 0.15, 0.4, 32);
    const miniTowerMaterial = new THREE.MeshStandardMaterial({
      color: this.playerFurnace.color,
      roughness: 0.4,
      metalness: 0.6,
      emissive: 0xff4400,
      emissiveIntensity: 0.3
    });
    const miniTowerMesh = new THREE.Mesh(miniTowerGeometry, miniTowerMaterial);
    miniTowerMesh.position.set(0, 1.125, 0);  // Adjusted to sit on tower top
    furnaceGroup.add(miniTowerMesh);

    // Add decorative ring at mini tower base
    const miniTowerRingGeometry = new THREE.TorusGeometry(0.16, 0.02, 16, 32);  // Slightly larger than tower base
    const miniTowerRingMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.3,
      metalness: 0.8
    });
    const miniTowerRingMesh = new THREE.Mesh(miniTowerRingGeometry, miniTowerRingMaterial);
    miniTowerRingMesh.rotation.x = Math.PI / 2;
    miniTowerRingMesh.position.set(0, 0.95, 0);  // Just above the tower top platform
    furnaceGroup.add(miniTowerRingMesh);

    // Add small cylinder pillars around mini tower
    const miniPillarGeometry = new THREE.CylinderGeometry(0.04, 0.03, 0.5, 6);
    const miniPillarMaterial = new THREE.MeshStandardMaterial({
      color: 0x555555,
      roughness: 0.3,
      metalness: 0.7
    });

    // Position mini pillars around the mini tower
    const miniPillarRadius = 0.15;
    const numPillars = 4;
    for (let i = 0; i < numPillars; i++) {
      const angle = (i / numPillars) * Math.PI * 2;
      const pillar = new THREE.Mesh(miniPillarGeometry, miniPillarMaterial);
      pillar.position.set(
        Math.cos(angle) * miniPillarRadius,
        1.125,  // Same height as mini tower
        Math.sin(angle) * miniPillarRadius
      );
      furnaceGroup.add(pillar);
    }

    // Mini tower cap
    const miniTowerCapGeometry = new THREE.CylinderGeometry(0.175, 0.15, 0.08, 8);
    const miniTowerCapMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.5,
      metalness: 0.5
    });
    const miniTowerCapMesh = new THREE.Mesh(miniTowerCapGeometry, miniTowerCapMaterial);
    miniTowerCapMesh.position.set(0, 1.365, 0);  // Adjusted to sit on mini tower
    furnaceGroup.add(miniTowerCapMesh);

    // Add flat orange circle at the top of mini tower
    const topDiscGeometry = new THREE.CircleGeometry(0.1, 32);
    const topDiscMaterial = new THREE.MeshStandardMaterial({
      color: this.playerFurnace.color,
      roughness: 0.4,
      metalness: 0.6,
      emissive: 0xff4400,
      emissiveIntensity: 0.3,
      side: THREE.DoubleSide
    });
    const topDiscMesh = new THREE.Mesh(topDiscGeometry, topDiscMaterial);
    topDiscMesh.rotation.x = -Math.PI / 2;
    topDiscMesh.position.set(0, 1.505, 0);  // Adjusted to float above mini tower cap
    furnaceGroup.add(topDiscMesh);

    // Add small chimneys on the corners
    const chimneyPositions = [
      { x: 0.6, z: 0.6 },
      { x: -0.6, z: 0.6 },
      { x: 0.6, z: -0.6 },
      { x: -0.6, z: -0.6 }
    ];

    chimneyPositions.forEach(pos => {
      const smallChimneyGeometry = new THREE.CylinderGeometry(0.1, 0.15, 0.6, 8);
      const smallChimneyMaterial = new THREE.MeshStandardMaterial({
        color: 0x444444,
        roughness: 0.7,
        metalness: 0.3
      });
      const smallChimneyMesh = new THREE.Mesh(smallChimneyGeometry, smallChimneyMaterial);
      smallChimneyMesh.position.set(pos.x, 0.55, pos.z);  // Adjusted to sit on main building (0.35 + 0.1/2 + 0.6/2)
      furnaceGroup.add(smallChimneyMesh);
    });

    // Add glowing effect at the base
    const glowGeometry = new THREE.RingGeometry(0.8, 1.2, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xff6600,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.rotation.x = -Math.PI / 2; // Lay flat
    glowMesh.position.set(0, 0.05, 0); // Just above the ground
    furnaceGroup.add(glowMesh);

    // Position the entire furnace group
    furnaceGroup.position.set(x + 1, 0, y + 1);
    this.scene.add(furnaceGroup);

    const key = `furnace_${x}_${y}`;
    this.cellMeshes[key] = furnaceGroup;

    // Update grid cells for 2x2 area
    for (let dy = 0; dy < 2; dy++) {
      for (let dx = 0; dx < 2; dx++) {
        if (y + dy < this.gridManager.grid.length && x + dx < this.gridManager.grid[0].length) {
          this.gridManager.grid[y + dy][x + dx] = {
            ...this.gridManager.grid[y + dy][x + dx],
            type: 'furnace',
            resource: null,
            player: player,
            furnace: true,
            zone: this.gridManager.grid[y + dy][x + dx].zone,
            zoneColor: this.playerFurnace.color,
          };
        }
      }
    }
    return true;
  }

  public canPlaceFurnace(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x + this.playerFurnace.size > this.width || y + this.playerFurnace.size > this.height) {
      return false;
    }
    for (let dy = 0; dy < this.playerFurnace.size; dy++) {
      for (let dx = 0; dx < this.playerFurnace.size; dx++) {
        const cell = this.gridManager.grid[y + dy][x + dx];
        if (cell.type !== 'empty') {
          return false;
        }
      }
    }
    return true;
  }

  public onMouseMove(event: MouseEvent): void {
    if (!this.renderer || !this.renderer.domElement || !this.camera) return;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.mouse, this.camera);
  }

  public onMouseClick(event: MouseEvent): void {
    if (!this.camera || !this.scene) return;
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children);
    if (intersects.length > 0) {
      const position = intersects[0].point;
      const gridX = Math.floor(position.x);
      const gridY = Math.floor(position.z);
      this.showCoordinates(gridX, gridY);
      this.collectResourceAt(gridX, gridY);
    }
  }

  public onTouchStart(event: TouchEvent): void {
    event.preventDefault();
    if (event.touches.length === 1 && this.renderer && this.renderer.domElement) {
      const touch = event.touches[0];
      const rect = this.renderer.domElement.getBoundingClientRect();
      this.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
    }
  }

  public onTouchMove(event: TouchEvent): void {
    event.preventDefault();
  }

  public onTouchEnd(event: TouchEvent): void {
    // Trigger click handling after touch end.
    this.onMouseClick(new MouseEvent('click'));
  }

  public onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'r':
        if (this.controlsManager && this.scene) {
          this.controlsManager.resetCamera(this.scene);
        }
        break;
      case 't':
        if (this.controlsManager && this.scene) {
          this.controlsManager.toggleViewMode(this.scene);
        }
        break;
      case 'f':
        if (this.controlsManager && this.scene) {
          this.controlsManager.centerOnPlayerFurnace();
        }
        break;
      case 'c':
        if (this.controlsManager && this.scene) {
          this.controlsManager.centerOnCastle(this.scene);
        }
        break;
    }
  }

  public onWindowResize(event?: UIEvent): void {
    if (!this.camera || !this.renderer || !this.containerElement) return;
    const aspect = this.containerElement.clientWidth / this.containerElement.clientHeight;
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.containerElement.clientWidth, this.containerElement.clientHeight);
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  public collectResourceAt(x: number, y: number): string | null {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return null;
    const cell = this.gridManager.grid[y][x];
    if (cell.type !== 'resource') return null;
    const resourceType = cell.resource;
    cell.type = 'empty';
    cell.resource = null;
    const key = `resource_${x}_${y}`;
    if (this.cellMeshes[key] && this.scene) {
      this.scene.remove(this.cellMeshes[key]);
      delete this.cellMeshes[key];
    }
    return resourceType;
  }

  public showCoordinates(x: number, y: number): void {
    // Ensure we have a valid coordinate display element
    if (!this.coordinateDisplay) {
      console.warn('ThreeWorldMap: Coordinate display element not available');
      return;
    }

    try {
      // Update text content
      this.coordinateDisplay.textContent = `X: ${x}  Y: ${y}`;

      // Make visible
      this.coordinateDisplay.style.display = 'block';
      this.coordinateDisplay.classList.remove('hidden');

      // Clear any existing timeout
      if (this.coordinateTimeout) {
        clearTimeout(this.coordinateTimeout);
        this.coordinateTimeout = null;
      }

      // Set timeout to hide it again
      this.coordinateTimeout = window.setTimeout(() => {
        try {
          if (this.coordinateDisplay) {
            this.coordinateDisplay.style.display = 'none';
            this.coordinateDisplay.classList.add('hidden');
          }
        } catch (e) {
          console.warn('ThreeWorldMap: Error hiding coordinates:', e);
        }
      }, 3000);
    } catch (error) {
      console.warn('ThreeWorldMap: Error showing coordinates:', error);
    }
  }

  public animate(): void {
    this.frameId = requestAnimationFrame(this.animate.bind(this));
    if (!this.renderer || !this.scene || !this.camera) return;
    try {
      // Update light position
      if (this.directionalLight) {
        this.lightAngle += this.LIGHT_ROTATION_SPEED;
        const radius = 100;
        this.directionalLight.position.x = Math.cos(this.lightAngle) * radius;
        this.directionalLight.position.z = Math.sin(this.lightAngle) * radius;
        this.directionalLight.position.y = 100;
      }

      if (this.controlsManager && this.controlsManager.controls) {
        this.controlsManager.controls.update();
      }
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Error in animation loop:', error);
    }
  }

  // Method to manually trigger rendering
  public render(): void {
    if (!this.renderer || !this.scene || !this.camera) return;
    try {
      this.renderer.render(this.scene, this.camera);
    } catch (error) {
      console.error('Error in render method:', error);
    }
  }

  public dispose(): void {
    console.log('ThreeWorldMap: Starting dispose process');

    // First, clear any active timeouts
    try {
      if (this.coordinateTimeout) {
        clearTimeout(this.coordinateTimeout);
        this.coordinateTimeout = null;
        console.log('ThreeWorldMap: Cleared coordinate timeout');
      }
    } catch (e) {
      console.warn('ThreeWorldMap: Error clearing timeout:', e);
    }

    // Next, deal with the coordinate display ASAP
    try {
      if (this.coordinateDisplay) {
        console.log('ThreeWorldMap: Cleaning up coordinate display');
        // First check if the element is actually in the document
        if (document.contains(this.coordinateDisplay)) {
          console.log('ThreeWorldMap: Coordinate display is in the document');
          if (this.coordinateDisplay.parentNode) {
            try {
              console.log('ThreeWorldMap: Removing coordinate display from parent');
              this.coordinateDisplay.parentNode.removeChild(this.coordinateDisplay);
              console.log('ThreeWorldMap: Successfully removed coordinate display');
            } catch (removeError) {
              console.error('ThreeWorldMap: Error removing coordinate display from parent:', removeError);
            }
          } else {
            console.warn('ThreeWorldMap: Coordinate display has no parent node');
          }
        } else {
          console.log('ThreeWorldMap: Coordinate display is not in the document, no removal needed');
        }
        // Update tracking flag
        this.coordinateDisplayAdded = false;
        // Clear the reference
        this.coordinateDisplay = null;
      }
    } catch (e) {
      console.error('ThreeWorldMap: Error with coordinate display cleanup:', e);
    }

    // Clean up event listeners with extra safety
    try {
      window.removeEventListener('resize', this.onWindowResize);
      console.log('ThreeWorldMap: Removed resize event listener');

      // Clean up DOM event listeners if the container still exists
      if (this.containerElement) {
        try {
          if (document.contains(this.containerElement)) {
            console.log('ThreeWorldMap: Removing DOM event listeners from container');
            this.containerElement.removeEventListener('mousemove', this.onMouseMove);
            this.containerElement.removeEventListener('click', this.onMouseClick);
          }
        } catch (containerError) {
          console.error('ThreeWorldMap: Error removing event listeners from container:', containerError);
        }
      }
    } catch (e) {
      console.warn('ThreeWorldMap: Error removing event listeners:', e);
    }

    // Clean up animation frame
    try {
      if (this.frameId !== null) {
        cancelAnimationFrame(this.frameId);
        this.frameId = null;
        console.log('ThreeWorldMap: Cancelled animation frame');
      }
    } catch (e) {
      console.warn('ThreeWorldMap: Error cancelling animation frame:', e);
    }

    // Clean up event manager
    try {
      if (this.eventManager) {
        this.eventManager.dispose();
        console.log('ThreeWorldMap: Disposed event manager');
        this.eventManager = null;
      }
    } catch (e) {
      console.warn('ThreeWorldMap: Error disposing event manager:', e);
    }

    // Clean up Three.js resources to prevent memory leaks
    try {
      // Dispose of geometries and materials
      if (this.scene) {
        console.log('ThreeWorldMap: Cleaning up scene resources');
        this.scene.traverse((object) => {
          // Handle meshes
          if (object instanceof THREE.Mesh) {
            // Dispose of geometry
            if (object.geometry) {
              object.geometry.dispose();
            }

            // Dispose of materials
            if (object.material) {
              // Handle arrays of materials
              if (Array.isArray(object.material)) {
                object.material.forEach(material => material.dispose());
              } else {
                // Handle single material
                object.material.dispose();
              }
            }
          }
        });

        // Clear the scene
        while (this.scene.children.length > 0) {
          this.scene.remove(this.scene.children[0]);
        }

        console.log('ThreeWorldMap: Scene resources cleaned up');
      }
    } catch (e) {
      console.error('ThreeWorldMap: Error cleaning up scene resources:', e);
    }

    // Clean up controls
    try {
      if (this.controlsManager && this.controlsManager.controls) {
        this.controlsManager.controls.dispose();
        console.log('ThreeWorldMap: Disposed controls');
        this.controlsManager = null;
      }
    } catch (e) {
      console.warn('ThreeWorldMap: Error disposing controls:', e);
    }

    // Dispose of renderer
    try {
      if (this.renderer) {
        this.renderer.dispose();
        console.log('ThreeWorldMap: Disposed renderer');

        // Remove the renderer's DOM element if it exists
        if (this.renderer.domElement && this.renderer.domElement.parentNode) {
          try {
            this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            console.log('ThreeWorldMap: Removed renderer DOM element');
          } catch (domError) {
            console.error('ThreeWorldMap: Error removing renderer DOM element:', domError);
          }
        }

        this.renderer.forceContextLoss();
        this.renderer = null;
      }
    } catch (e) {
      console.warn('ThreeWorldMap: Error disposing renderer:', e);
    }

    // Clear other references
    this.containerElement = null;
    this.scene = null;
    this.camera = null;

    // Clear cell meshes reference
    this.cellMeshes = {};

    console.log('ThreeWorldMap: Dispose process completed');
  }

  // Method to set the view mode of the map
  public setViewMode(mode: ViewMode): void {
    if (!this.camera || !this.controlsManager) return;

    switch (mode) {
      case ViewMode.DEFAULT:
        // Default view - standard zoom level
        this.camera.position.set(this.width / 2, 800, this.height / 2 + 500);
        this.camera.lookAt(this.width / 2, 0, this.height / 2);
        break;

      case ViewMode.EXPLORATION:
        // Exploration mode - zoomed in for local exploration
        this.camera.position.set(
          this.playerFurnace.x,
          200,
          this.playerFurnace.y + 100
        );
        this.camera.lookAt(this.playerFurnace.x, 0, this.playerFurnace.y);
        break;

      case ViewMode.STRATEGIC:
        // Strategic view - high altitude overview
        this.camera.position.set(this.width / 2, 1200, this.height / 2 + 800);
        this.camera.lookAt(this.width / 2, 0, this.height / 2);
        break;
    }

    this.camera.updateProjectionMatrix();
    if (this.controlsManager.controls) {
      this.controlsManager.controls.update();
    }

    // Force a render after view mode change
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  // Add this function to center on the player's furnace
  public centerOnPlayerFurnace(): void {
    if (!this.controlsManager || !this.scene) {
      console.error('ControlsManager or scene not initialized, cannot center on player furnace');
      return;
    }

    try {
      console.log('Centering on player furnace at:', this.playerFurnace);
      this.controlsManager.centerOnPlayerFurnace();
    } catch (error) {
      console.error('Error in centerOnPlayerFurnace:', error);
    }
  }

  // Add function to reset the camera view
  public resetCamera(): void {
    if (!this.controlsManager || !this.scene) {
      console.error('ControlsManager or scene not initialized, cannot reset camera');
      return;
    }

    try {
      console.log('Resetting camera view');
      this.controlsManager.resetCamera(this.scene);
    } catch (error) {
      console.error('Error in resetCamera:', error);
    }
  }

  // Add function to toggle between 3D and top-down views
  public toggleViewMode(): void {
    if (!this.controlsManager || !this.scene) {
      console.error('ControlsManager or scene not initialized, cannot toggle view mode');
      return;
    }

    try {
      console.log('Toggling view mode');
      this.controlsManager.toggleViewMode(this.scene);
      this.is3DMode = this.controlsManager.is3DMode;
    } catch (error) {
      console.error('Error in toggleViewMode:', error);
    }
  }

  // Add function to set the view angle
  public setViewAngle(angle: number): void {
    if (!this.controlsManager || !this.scene) {
      console.error('ControlsManager or scene not initialized, cannot set view angle');
      return;
    }

    try {
      console.log(`Setting view angle to ${angle}°`);
      this.controlsManager.setViewAngle(this.scene, angle);
    } catch (error) {
      console.error('Error in setViewAngle:', error);
    }
  }

  public centerOnCastle(): void {
    if (!this.controlsManager || !this.scene) {
      console.error('ControlsManager or scene not initialized, cannot center on castle');
      return;
    }

    try {
      const centerX = Math.floor(this.width / 2);
      const centerZ = Math.floor(this.height / 2);

      // Calculate the current camera position and target
      const startDistance = this.camera?.position.distanceTo(new THREE.Vector3(centerX, 0, centerZ)) || 0;
      const MIN_DISTANCE = 15;  // Same as initial load
      const ANGLE = (70 * Math.PI) / 180; // 70 degrees from horizontal
      const height = MIN_DISTANCE * Math.sin(ANGLE);
      const horizontalDist = MIN_DISTANCE * Math.cos(ANGLE);
      const DIAGONAL_ANGLE = Math.PI / 4; // 45 degrees for diamond view
      const offsetX = horizontalDist * Math.cos(DIAGONAL_ANGLE);
      const offsetZ = horizontalDist * Math.sin(DIAGONAL_ANGLE);

      // Set the target to the castle position
      if (this.controlsManager.controls) {
        this.controlsManager.controls.target.set(centerX, 0, centerZ);
      }

      // Calculate the end position
      const endDistance = MIN_DISTANCE * 2.5; // Further out to see the whole castle area
      const direction = new THREE.Vector3(
        -(offsetX / MIN_DISTANCE),
        height / MIN_DISTANCE,
        -(offsetZ / MIN_DISTANCE)
      ).normalize();

      // Animate to the new position
      const duration = 2000; // 2 seconds, matching initial load
      const startTime = performance.now();

      const animateZoom = (currentTime: number) => {
        if (!this.controlsManager || !this.camera || !this.controlsManager.controls) return;

        const elapsed = currentTime - startTime;
        const t = Math.min(elapsed / duration, 1);
        // Use easing function for smoother animation
        const easeT = t < .5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        const currentDistance = startDistance + easeT * (endDistance - startDistance);

        // Update camera position
        this.camera.position.copy(this.controlsManager.controls.target)
          .add(direction.clone().multiplyScalar(currentDistance));

        this.controlsManager.controls.update();

        // Force a render
        if (this.renderer && this.scene && this.camera) {
          this.renderer.render(this.scene, this.camera);
        }

        if (t < 1) {
          requestAnimationFrame(animateZoom);
        }
      };

      requestAnimationFrame(animateZoom);

      console.log('Centering on castle at:', { centerX, centerZ });
    } catch (error) {
      console.error('Error in centerOnCastle:', error);
    }
  }
}
