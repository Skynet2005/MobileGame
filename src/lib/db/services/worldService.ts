import { prisma } from '../prisma';
import { WorldResource, PlayerFurnace } from '@/types/world';

export class WorldService {
  // Create world resource
  static async createWorldResource(x: number, y: number, type: string, value: number): Promise<WorldResource> {
    return prisma.worldResource.create({
      data: {
        x,
        y,
        type,
        value
      }
    });
  }

  // Get world resource at coordinates
  static async getWorldResource(x: number, y: number): Promise<WorldResource | null> {
    return prisma.worldResource.findUnique({
      where: {
        x_y: {
          x,
          y
        }
      }
    });
  }

  // Get world resources in range
  static async getWorldResourcesInRange(x: number, y: number, range: number): Promise<WorldResource[]> {
    return prisma.worldResource.findMany({
      where: {
        x: {
          gte: x - range,
          lte: x + range
        },
        y: {
          gte: y - range,
          lte: y + range
        }
      }
    });
  }

  // Update world resource value
  static async updateWorldResourceValue(x: number, y: number, value: number): Promise<WorldResource> {
    return prisma.worldResource.update({
      where: {
        x_y: {
          x,
          y
        }
      },
      data: { value }
    });
  }

  // Delete world resource
  static async deleteWorldResource(x: number, y: number): Promise<void> {
    await prisma.worldResource.delete({
      where: {
        x_y: {
          x,
          y
        }
      }
    });
  }

  // Create player furnace
  static async createPlayerFurnace(characterId: string, x: number, y: number, size: number, color: number): Promise<PlayerFurnace> {
    return prisma.playerFurnace.create({
      data: {
        characterId,
        x,
        y,
        size,
        color
      }
    });
  }

  // Get player furnace at coordinates
  static async getPlayerFurnace(x: number, y: number): Promise<PlayerFurnace | null> {
    return prisma.playerFurnace.findUnique({
      where: {
        x_y: {
          x,
          y
        }
      },
      include: {
        character: true
      }
    });
  }

  // Get character's furnaces
  static async getCharacterFurnaces(characterId: string): Promise<PlayerFurnace[]> {
    return prisma.playerFurnace.findMany({
      where: { characterId }
    });
  }

  // Get furnaces in range
  static async getFurnacesInRange(x: number, y: number, range: number): Promise<PlayerFurnace[]> {
    return prisma.playerFurnace.findMany({
      where: {
        x: {
          gte: x - range,
          lte: x + range
        },
        y: {
          gte: y - range,
          lte: y + range
        }
      },
      include: {
        character: true
      }
    });
  }

  // Update furnace size
  static async updateFurnaceSize(x: number, y: number, size: number): Promise<PlayerFurnace> {
    return prisma.playerFurnace.update({
      where: {
        x_y: {
          x,
          y
        }
      },
      data: { size }
    });
  }

  // Update furnace color
  static async updateFurnaceColor(x: number, y: number, color: number): Promise<PlayerFurnace> {
    return prisma.playerFurnace.update({
      where: {
        x_y: {
          x,
          y
        }
      },
      data: { color }
    });
  }

  // Delete furnace
  static async deleteFurnace(x: number, y: number): Promise<void> {
    await prisma.playerFurnace.delete({
      where: {
        x_y: {
          x,
          y
        }
      }
    });
  }

  // Check if coordinates are occupied
  static async isCoordinatesOccupied(x: number, y: number): Promise<boolean> {
    const [resource, furnace] = await Promise.all([
      this.getWorldResource(x, y),
      this.getPlayerFurnace(x, y)
    ]);
    return !!(resource || furnace);
  }

  // Get all resources and furnaces in range
  static async getWorldStateInRange(x: number, y: number, range: number): Promise<{
    resources: WorldResource[];
    furnaces: PlayerFurnace[];
  }> {
    const [resources, furnaces] = await Promise.all([
      this.getWorldResourcesInRange(x, y, range),
      this.getFurnacesInRange(x, y, range)
    ]);

    return { resources, furnaces };
  }
}
