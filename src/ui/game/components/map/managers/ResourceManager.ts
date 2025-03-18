import * as THREE from 'three';
import { GridCell } from '@/types/world';

export class ResourceManager {
  // Define the resource types and counts (reduced by 25%)
  private resourceTypes: Array<{ type: string; color: number; count: number; isCollectible: boolean }> = [
    { type: 'meat', color: 0xB22222, count: 375, isCollectible: false }, // Reduced from 500
    { type: 'wood', color: 0x8b5a2b, count: 600, isCollectible: false }, // Reduced from 800
    { type: 'coal', color: 0x333333, count: 225, isCollectible: false }, // Reduced from 300
    { type: 'iron', color: 0xa5a5a5, count: 225, isCollectible: false }, // Reduced from 300
  ];

  public generateResources(
    scene: THREE.Scene,
    grid: GridCell[][],
    width: number,
    height: number,
    cellMeshes: { [key: string]: THREE.Mesh | THREE.Group }
  ): void {
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const centerTierRadius = Math.min(width, height) * 0.33; // Assuming center tier is roughly 1/3 of the map

    this.resourceTypes.forEach(resource => {
      let remaining = resource.count;
      let attempts = 0;
      const maxAttempts = remaining * 5;

      while (remaining > 0 && attempts < maxAttempts) {
        attempts++;
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);

        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );

        // Skip if trying to place meat or wood in center tier
        if ((resource.type === 'meat' || resource.type === 'wood') &&
          distanceFromCenter <= centerTierRadius) {
          continue;
        }

        if (grid[y][x].type === 'empty') {
          grid[y][x] = {
            ...grid[y][x],
            type: 'resource',
            resource: resource.type,
          };

          if (!resource.isCollectible) {
            this.createResourceMesh(scene, x, y, resource);
          } else {
            // Create a simple collectible resource marker
            this.createCollectibleMarker(scene, x, y, resource);
          }
          remaining--;
        }
      }
    });
  }

  private createCollectibleMarker(
    scene: THREE.Scene,
    x: number,
    y: number,
    resource: { type: string; color: number }
  ): void {
    // Created Logic for review
    const markerGroup = new THREE.Group();

    // Create a small glowing sphere for collectible resources
    const sphereGeometry = new THREE.SphereGeometry(0.3, 16, 16);
    const sphereMaterial = new THREE.MeshStandardMaterial({
      color: resource.color,
      emissive: resource.color,
      emissiveIntensity: 0.5,
      roughness: 0.3,
      metalness: 0.7
    });
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    sphere.position.y = 0.3;

    // Add subtle floating animation
    const floatingHeight = 0.2;
    const floatingSpeed = 0.002;
    const animate = () => {
      sphere.position.y = 0.3 + Math.sin(Date.now() * floatingSpeed) * floatingHeight;
      requestAnimationFrame(animate);
    };
    animate();

    markerGroup.add(sphere);
    markerGroup.position.set(x + 0.5, 0, y + 0.5);
    scene.add(markerGroup);
  }

  private createResourceMesh(
    scene: THREE.Scene,
    x: number,
    y: number,
    resource: { type: string; color: number }
  ): void {
    // Created Logic for review
    const buildingGroup = new THREE.Group();

    if (resource.type === 'meat') {
      // Create barn-shaped building for meat
      // Main barn body
      const barnBodyGeometry = new THREE.BoxGeometry(1, 0.8, 1);
      const barnMaterial = new THREE.MeshStandardMaterial({
        color: 0xc41e3a, // Barn red
        roughness: 0.7,
        metalness: 0.2
      });
      const barnBody = new THREE.Mesh(barnBodyGeometry, barnMaterial);
      barnBody.position.y = 0.4;
      buildingGroup.add(barnBody);

      // Barn roof (triangular prism shape)
      const roofHeight = 0.4;
      const roofGeometry = new THREE.BufferGeometry();
      const vertices = new Float32Array([
        // Front triangle
        -0.6, 0.8, 0.5,
        0.6, 0.8, 0.5,
        0, 1.2, 0.5,
        // Back triangle
        -0.6, 0.8, -0.5,
        0.6, 0.8, -0.5,
        0, 1.2, -0.5,
      ]);
      const indices = new Uint16Array([
        0, 1, 2, // front
        3, 4, 5, // back
        0, 2, 5, // left side
        0, 5, 3, // left side
        1, 4, 5, // right side
        1, 5, 2, // right side
      ]);
      roofGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
      roofGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
      roofGeometry.computeVertexNormals();

      const roofMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513, // Dark brown
        roughness: 0.8,
        metalness: 0.1
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      buildingGroup.add(roof);

      // Add barn doors (double door style)
      const doorGeometry = new THREE.BoxGeometry(0.2, 0.5, 0.05);
      const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.6,
        metalness: 0.2
      });

      // Left door
      const leftDoor = new THREE.Mesh(doorGeometry, doorMaterial);
      leftDoor.position.set(-0.15, 0.25, 0.5);
      buildingGroup.add(leftDoor);

      // Right door
      const rightDoor = new THREE.Mesh(doorGeometry, doorMaterial);
      rightDoor.position.set(0.15, 0.25, 0.5);
      buildingGroup.add(rightDoor);

      // Add cross beams on the front
      const beamGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.05);
      const beamMaterial = new THREE.MeshStandardMaterial({
        color: 0x8b4513,
        roughness: 0.7,
        metalness: 0.2
      });

      // Horizontal beam
      const horizontalBeam = new THREE.Mesh(beamGeometry, beamMaterial);
      horizontalBeam.position.set(0, 0.6, 0.5);
      buildingGroup.add(horizontalBeam);

    } else {
      // Regular warehouse for other resources
      // Main building body (1x1x1)
      const buildingGeometry = new THREE.BoxGeometry(1, 1, 1);
      const buildingMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.7,
        metalness: 0.2
      });
      const buildingMesh = new THREE.Mesh(buildingGeometry, buildingMaterial);
      buildingMesh.position.y = 0.5;
      buildingGroup.add(buildingMesh);

      // Roof (slightly larger than base)
      const roofGeometry = new THREE.BoxGeometry(1.1, 0.1, 1.1);
      const roofMaterial = new THREE.MeshStandardMaterial({
        color: resource.color,
        roughness: 0.5,
        metalness: 0.3
      });
      const roofMesh = new THREE.Mesh(roofGeometry, roofMaterial);
      roofMesh.position.y = 1.05;
      buildingGroup.add(roofMesh);

      // Add a small sign with resource color
      const signGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.05);
      const signMaterial = new THREE.MeshStandardMaterial({
        color: resource.color,
        roughness: 0.4,
        metalness: 0.4
      });
      const signMesh = new THREE.Mesh(signGeometry, signMaterial);
      signMesh.position.set(0, 0.7, 0.5);
      buildingGroup.add(signMesh);

      // Add door
      const doorGeometry = new THREE.BoxGeometry(0.3, 0.6, 0.05);
      const doorMaterial = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 0.6,
        metalness: 0.2
      });
      const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
      doorMesh.position.set(0, 0.3, 0.5);
      buildingGroup.add(doorMesh);
    }

    // Position the entire building
    buildingGroup.position.set(x + 0.5, 0, y + 0.5);
    scene.add(buildingGroup);
  }
}
