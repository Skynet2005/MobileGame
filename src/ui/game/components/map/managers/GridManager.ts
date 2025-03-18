import * as THREE from 'three';
import { GridCell, Zone } from '@/types/world';

export class GridManager {
  public grid: GridCell[][] = [];

  constructor(
    public width: number,
    public height: number,
    public zones: Zone[],
    public zoneBoundaries: number[]
  ) { }

  public initGrid(): void {
    this.grid = new Array(this.height);
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    for (let y = 0; y < this.height; y++) {
      this.grid[y] = new Array(this.width);
      for (let x = 0; x < this.width; x++) {
        const dx = Math.abs(x - centerX) / centerX;
        const dy = Math.abs(y - centerY) / centerY;
        const distanceFromCenter = Math.max(dx, dy);
        let zoneIndex = this.zones.length - 1;
        for (let i = 0; i < this.zoneBoundaries.length; i++) {
          if (distanceFromCenter <= this.zoneBoundaries[i]) {
            zoneIndex = i;
            break;
          }
        }
        this.grid[y][x] = {
          type: 'empty',
          resource: null,
          player: null,
          furnace: false,
          zone: this.zones[zoneIndex].name,
          zoneColor: this.zones[zoneIndex].color,
        };
      }
    }
  }

  public createGroundPlane(scene: THREE.Scene): void {
    const planeGeometry = new THREE.PlaneGeometry(this.width, this.height);
    planeGeometry.rotateX(-Math.PI / 2);
    const planeMaterial = new THREE.MeshStandardMaterial({
      color: 0x1a2634, // Dark blue-gray base
      roughness: 0.7,
      metalness: 0.3,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.set(this.width / 2, -0.5, this.height / 2);
    plane.receiveShadow = true;
    scene.add(plane);
  }

  public createGridMesh(scene: THREE.Scene, cellMeshes: { [key: string]: THREE.Mesh | THREE.Group }): void {
    // Create a grid helper to visualize boundaries
    const gridHelper = new THREE.GridHelper(
      Math.max(this.width, this.height),
      Math.max(this.width, this.height) / 10,
      0x444444,
      0x222222
    );
    gridHelper.position.set(this.width / 2, 0, this.height / 2);
    scene.add(gridHelper);

    // Create cell meshes in batches for performance
    for (let y = 0; y < this.height; y += 10) {
      for (let x = 0; x < this.width; x += 10) {
        this.createZoneCell(scene, x, y, 10, cellMeshes);
      }
    }
  }

  public createZoneCell(
    scene: THREE.Scene,
    startX: number,
    startY: number,
    size: number,
    cellMeshes: { [key: string]: THREE.Mesh | THREE.Group }
  ): void {
    const cell = this.grid[startY][startX];
    const cellHeight = 0.1; // Set a minimal height for visual distinction

    // Create geometry for the cell
    const geometry = new THREE.BoxGeometry(size, cellHeight, size);

    // Create material with zone-specific ice properties
    const material = new THREE.MeshStandardMaterial({
      color: cell.zoneColor,
      roughness: cell.zone === 'frozen-core' ? 0.3 : cell.zone === 'tundra' ? 0.5 : 0.2,
      metalness: cell.zone === 'frozen-core' ? 0.6 : cell.zone === 'tundra' ? 0.4 : 0.8,
      envMapIntensity: 1.5,
      transparent: cell.zone === 'ice-fields',
      opacity: cell.zone === 'ice-fields' ? 0.8 : 1.0,
    });

    // Create the mesh
    const mesh = new THREE.Mesh(geometry, material);

    // Position the mesh with a slight elevation based on zone
    const baseElevation = cell.zone === 'frozen-core' ? 0.15 :
      cell.zone === 'tundra' ? 0.1 : 0;

    mesh.position.set(
      startX + size / 2,
      cellHeight / 2 + baseElevation,
      startY + size / 2
    );

    const key = `zone_${startX}_${startY}`;
    cellMeshes[key] = mesh;
    scene.add(mesh);
  }
}
