import * as THREE from 'three';
import { GridCell } from '@/types/world';

export class CastleManager {
  constructor(
    public width: number,
    public height: number,
    public castleSize: number,      // Center castle size (4x4)
    public turretSize: number,      // Turret size (2x2)
    public castleAreaSize: number,  // Total castle area (12x12)
    public castleColor: number,
    public turretColor: number
  ) { }

  public addCastle(scene: THREE.Scene, grid: GridCell[][]): void {
    // Calculate central coordinates and offsets
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const castleAreaOffset = Math.floor(this.castleAreaSize / 2);
    const redZoneSize = 28;
    const redZoneOffset = Math.floor(redZoneSize / 2);
    // Calculate maximum turret offset to place turrets at the absolute corners of the 12x12 area
    const turretOffset = this.castleAreaSize / 2;  // Now exactly 6 units (half of 12) to reach the edges

    // 1. Create the base platform for the castle area
    this.createBasePlatform(scene, centerX, centerY);

    // 2. Create the target pattern (concentric rings and crossing lines)
    this.createTargetPattern(scene, centerX, centerY);

    // 3. Build the main castle structure: layers, decorative rings and crown
    const mainCastleGroup = this.buildMainCastleStructure();
    mainCastleGroup.position.set(centerX, 0, centerY);
    scene.add(mainCastleGroup);

    // 4. Add turrets at the castle corners
    this.addTurrets(scene, grid, centerX, centerY, turretOffset);

    // 5. Overlay red zones for cells outside the castle area
    this.applyRedZoneOverlay(scene, grid, centerX, centerY, redZoneOffset, castleAreaOffset);

    // 6. Mark grid cells for the castle area
    this.markCastleArea(grid, centerX, centerY, castleAreaOffset);
  }

  public addTurret(scene: THREE.Scene, grid: GridCell[][], startX: number, startY: number): void {
    const turretGroup = new THREE.Group();
    const baseHeight = 1.0;

    // Turret Base Platform
    const originalTopRadius = this.turretSize / 1.3;
    const topRadius = originalTopRadius * 0.6;
    const baseGeometry = new THREE.CylinderGeometry(topRadius, topRadius, baseHeight, 16);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0xb2c7e6,
      roughness: 0.5,
      metalness: 0.4
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(0, baseHeight / 2, 0);
    turretGroup.add(baseMesh);

    // Turret Rim Detail
    const rimGeometry = new THREE.TorusGeometry(topRadius, 0.075, 8, 24);
    const rimMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0xffa500,
      emissiveIntensity: 0.2
    });
    const rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.set(0, 0.5, 0);
    turretGroup.add(rimMesh);

    // Set up Cannon for the Turret's Firing Mechanism
    const cannonGroup = new THREE.Group();
    const centerX = Math.floor(this.width / 2);
    const centerY = Math.floor(this.height / 2);
    const dx = centerX - (startX + this.turretSize / 2);
    const dz = centerY - (startY + this.turretSize / 2);
    const horizontalAngle = Math.atan2(dx, dz);
    const verticalAngle = (75 * Math.PI) / 180;  // 75° in radians

    // Create Cannon Barrel
    const barrelLength = 2.625;
    const backendReduction = 0.9;
    const barrelGeometry = new THREE.CylinderGeometry(0.1875, 0.225, barrelLength * backendReduction, 12);
    const cannonMaterial = new THREE.MeshStandardMaterial({
      color: 0x8a9bbd,
      roughness: 0.4,
      metalness: 0.8
    });
    const barrelMesh = new THREE.Mesh(barrelGeometry, cannonMaterial);

    // Position the Barrel at the inner corner of its mount
    const mountSize = this.turretSize / 2; // Reduced from 1.6 to 2 (making it 20% smaller)
    const cornerOffset = mountSize / 2;
    barrelMesh.position.set(
      Math.sign(dx) * cornerOffset,
      baseHeight + 0.2,
      Math.sign(dz) * cornerOffset
    );
    barrelMesh.rotation.order = 'YXZ';
    barrelMesh.rotation.y = horizontalAngle + Math.PI;
    barrelMesh.rotation.x = -verticalAngle;
    cannonGroup.add(barrelMesh);

    // Create Cannon Mount Platform
    const mountGeometry = new THREE.BoxGeometry(this.turretSize / 2, 0.2, this.turretSize / 2);
    const mountMesh = new THREE.Mesh(mountGeometry, cannonMaterial);
    mountMesh.position.set(0, baseHeight + 0.1, 0);
    cannonGroup.add(mountMesh);

    turretGroup.add(cannonGroup);

    // Position the Turret in the Scene
    turretGroup.position.set(startX + this.turretSize / 2, 0, startY + this.turretSize / 2);
    scene.add(turretGroup);

    // Mark grid cells for the turret area
    for (let y = startY; y < startY + this.turretSize; y++) {
      for (let x = startX; x < startX + this.turretSize; x++) {
        if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) {
          grid[y][x] = {
            ...grid[y][x],
            type: 'turret',
            resource: null,
            player: null,
            furnace: false,
            zone: 'castle',
            zoneColor: this.turretColor
          };
        }
      }
    }
  }

  // ---------------- Private Helper Methods ----------------

  private createBasePlatform(scene: THREE.Scene, centerX: number, centerY: number): void {
    const baseGeometry = new THREE.BoxGeometry(this.castleAreaSize, 0.12, this.castleAreaSize);
    const baseMaterial = new THREE.MeshStandardMaterial({
      color: 0x667788,
      roughness: 0.8,
      metalness: 0.2
    });
    const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
    baseMesh.position.set(centerX, 0.2, centerY);
    scene.add(baseMesh);
  }

  private createTargetPattern(scene: THREE.Scene, centerX: number, centerY: number): void {
    // Calculate the radius to reach the corners of the 12x12 area
    const circleRadius = (this.castleAreaSize / 2) * 0.95; // 95% of half the platform size to nearly touch the corners

    const targetGroup = new THREE.Group();

    // Concentric Rings
    const circleRadii = [circleRadius, circleRadius * 0.7, circleRadius * 0.4];
    const circleThicknesses = [0.15, 0.1, 0.05];
    circleRadii.forEach((radius, index) => {
      const ringGeometry = new THREE.RingGeometry(
        radius - circleThicknesses[index],
        radius + circleThicknesses[index],
        64
      );
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0x333333,
        roughness: 0.8,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = -Math.PI / 2;
      targetGroup.add(ring);
    });

    // Crossing Lines
    const lineLength = circleRadius * 2;
    const lineWidth = 0.15;
    const lineMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2,
      side: THREE.DoubleSide
    });
    const horizontalLineGeometry = new THREE.PlaneGeometry(lineLength, lineWidth);
    const horizontalLine = new THREE.Mesh(horizontalLineGeometry, lineMaterial);
    horizontalLine.rotation.x = -Math.PI / 2;
    targetGroup.add(horizontalLine);

    const verticalLineGeometry = new THREE.PlaneGeometry(lineWidth, lineLength);
    const verticalLine = new THREE.Mesh(verticalLineGeometry, lineMaterial);
    verticalLine.rotation.x = -Math.PI / 2;
    targetGroup.add(verticalLine);

    targetGroup.position.set(centerX, 0.3, centerY);
    scene.add(targetGroup);
  }

  private buildMainCastleStructure(): THREE.Group {
    const castleGroup = new THREE.Group();

    // Base Layer (Ground Level)
    const layer2Geometry = new THREE.CylinderGeometry(2.25, 2.4, 1, 32);
    const layer2Material = new THREE.MeshStandardMaterial({
      color: 0x5a6b9d,
      roughness: 0.5,
      metalness: 0.5
    });
    const layer2Mesh = new THREE.Mesh(layer2Geometry, layer2Material);
    layer2Mesh.position.set(0, 0.5, 0);
    castleGroup.add(layer2Mesh);

    // Middle Layer
    const layer3Geometry = new THREE.CylinderGeometry(1.875, 2.025, 0.8, 32);
    const layer3Material = new THREE.MeshStandardMaterial({
      color: 0x6a7bad,
      roughness: 0.4,
      metalness: 0.6
    });
    const layer3Mesh = new THREE.Mesh(layer3Geometry, layer3Material);
    layer3Mesh.position.set(0, 1.4, 0);
    castleGroup.add(layer3Mesh);

    // Top Layer
    const layer4Geometry = new THREE.CylinderGeometry(1.5, 1.65, 0.6, 32);
    const layer4Material = new THREE.MeshStandardMaterial({
      color: 0x7a8bbd,
      roughness: 0.3,
      metalness: 0.7
    });
    const layer4Mesh = new THREE.Mesh(layer4Geometry, layer4Material);
    layer4Mesh.position.set(0, 2.1, 0);
    castleGroup.add(layer4Mesh);

    // Decorative Rings Matching Each Layer's Top Diameter
    const ringRadii = [2.4, 2.025, 1.65];
    const ringHeights = [0.5, 1.4, 2.1];
    ringRadii.forEach((radius, index) => {
      const ringGeometry = new THREE.TorusGeometry(radius, 0.05, 16, 32);
      const ringMaterial = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        roughness: 0.3,
        metalness: 0.8,
        emissive: 0xffa500,
        emissiveIntensity: 0.2
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, ringHeights[index], 0);
      castleGroup.add(ring);
    });

    // Crown (Top of the Central Tower)
    const crownGroup = new THREE.Group();

    // Crown Base
    const crownBaseRadius = 1.575 * 1.03;
    const crownBaseGeometry = new THREE.CylinderGeometry(
      crownBaseRadius,
      crownBaseRadius * 0.905,
      0.5,
      16
    );
    const crownMaterial = new THREE.MeshStandardMaterial({
      color: 0xffd700,
      roughness: 0.3,
      metalness: 0.8,
      emissive: 0xffa500,
      emissiveIntensity: 0.3
    });
    const crownBaseMesh = new THREE.Mesh(crownBaseGeometry, crownMaterial);
    crownBaseMesh.position.set(0, 2.6, 0);
    crownGroup.add(crownBaseMesh);

    // Crown Spikes Around the Top
    const spikeMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.4,
      metalness: 0.9
    });
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const spikeGeometry = new THREE.ConeGeometry(0.15, 0.8, 4);
      const spikeMesh = new THREE.Mesh(spikeGeometry, spikeMaterial);
      spikeMesh.position.set(
        Math.cos(angle) * (1.35 * 1.03),
        3.0,
        Math.sin(angle) * (1.35 * 1.03)
      );
      crownGroup.add(spikeMesh);
    }
    castleGroup.add(crownGroup);

    return castleGroup;
  }

  private addTurrets(scene: THREE.Scene, grid: GridCell[][], centerX: number, centerY: number, turretOffset: number): void {
    // Top-left turret - place at absolute corner
    this.addTurret(scene, grid, centerX - turretOffset, centerY - turretOffset);
    // Top-right turret - place at absolute corner, accounting for turret size
    this.addTurret(scene, grid, centerX + turretOffset - this.turretSize, centerY - turretOffset);
    // Bottom-left turret - place at absolute corner, accounting for turret size
    this.addTurret(scene, grid, centerX - turretOffset, centerY + turretOffset - this.turretSize);
    // Bottom-right turret - place at absolute corner, accounting for turret size
    this.addTurret(scene, grid, centerX + turretOffset - this.turretSize, centerY + turretOffset - this.turretSize);
  }

  private applyRedZoneOverlay(
    scene: THREE.Scene,
    grid: GridCell[][],
    centerX: number,
    centerY: number,
    redZoneOffset: number,
    castleAreaOffset: number
  ): void {
    for (let y = centerY - redZoneOffset; y < centerY + redZoneOffset; y++) {
      for (let x = centerX - redZoneOffset; x < centerX + redZoneOffset; x++) {
        if (grid[y] && grid[y][x]) {
          const isCastleArea =
            x >= centerX - castleAreaOffset &&
            x < centerX + castleAreaOffset &&
            y >= centerY - castleAreaOffset &&
            y < centerY + castleAreaOffset;
          if (!isCastleArea) {
            const redZoneGeometry = new THREE.BoxGeometry(1, 0.1, 1);
            const redZoneMaterial = new THREE.MeshStandardMaterial({
              color: 0xff0000,
              transparent: true,
              opacity: 0.3,
              roughness: 0.7,
              metalness: 0.3
            });
            const redZoneMesh = new THREE.Mesh(redZoneGeometry, redZoneMaterial);
            redZoneMesh.position.set(x + 0.5, 0.3, y + 0.5);
            scene.add(redZoneMesh);

            grid[y][x] = {
              ...grid[y][x],
              type: 'redzone',
              resource: null,
              player: null,
              furnace: false,
              zone: 'redzone',
              zoneColor: 0xff0000
            };
          }
        }
      }
    }
  }

  private markCastleArea(grid: GridCell[][], centerX: number, centerY: number, castleAreaOffset: number): void {
    for (let y = centerY - castleAreaOffset; y < centerY + castleAreaOffset; y++) {
      for (let x = centerX - castleAreaOffset; x < centerX + castleAreaOffset; x++) {
        if (grid[y] && grid[y][x]) {
          grid[y][x] = {
            ...grid[y][x],
            type: 'castle',
            resource: null,
            player: null,
            furnace: false,
            zone: 'castle',
            zoneColor: this.castleColor
          };
        }
      }
    }
  }
}
