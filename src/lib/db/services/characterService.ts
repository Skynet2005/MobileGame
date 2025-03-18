import { prisma } from '../prisma';
import { Character, PlayerProfile } from '@/types/player';

export class CharacterService {
  // Create a new character
  static async createCharacter(accountId: string, name: string, imageUrl?: string): Promise<Character> {
    const character = await prisma.character.create({
      data: {
        accountId,
        name,
        imageUrl,
        profile: {
          create: {
            power: 0,
            kills: 0,
            furnaceLevel: 1,
            state: 0,
            worldLocationX: 0,
            worldLocationY: 0,
            troops: {
              infantry: { total: 0, level: 1, injured: 0 },
              lancer: { total: 0, level: 1, injured: 0 },
              marksman: { total: 0, level: 1, injured: 0 },
              marchQueue: 0
            }
          }
        }
      },
      include: {
        profile: true
      }
    });

    return character;
  }

  // Get character by ID
  static async getCharacterById(id: string): Promise<Character | null> {
    return prisma.character.findUnique({
      where: { id },
      include: {
        profile: true,
        alliance: true
      }
    });
  }

  // Get characters by account ID
  static async getCharactersByAccountId(accountId: string): Promise<Character[]> {
    return prisma.character.findMany({
      where: { accountId },
      include: {
        profile: true,
        alliance: true
      }
    });
  }

  // Update character
  static async updateCharacter(id: string, data: Partial<Character>): Promise<Character> {
    return prisma.character.update({
      where: { id },
      data: {
        ...data,
        lastSeen: new Date()
      },
      include: {
        profile: true,
        alliance: true
      }
    });
  }

  // Update character profile
  static async updateCharacterProfile(id: string, profile: Partial<PlayerProfile>): Promise<Character> {
    return prisma.character.update({
      where: { id },
      data: {
        profile: {
          update: profile
        }
      },
      include: {
        profile: true
      }
    });
  }

  // Update character location
  static async updateCharacterLocation(id: string, x: number, y: number): Promise<Character> {
    return prisma.character.update({
      where: { id },
      data: {
        profile: {
          update: {
            worldLocationX: x,
            worldLocationY: y
          }
        }
      },
      include: {
        profile: true
      }
    });
  }

  // Update character online status
  static async updateCharacterOnlineStatus(id: string, isOnline: boolean): Promise<Character> {
    return prisma.character.update({
      where: { id },
      data: {
        isOnline,
        lastSeen: isOnline ? null : new Date()
      }
    });
  }

  // Update character alliance
  static async updateCharacterAlliance(id: string, allianceId: string | null, allianceTag: string | null): Promise<Character> {
    return prisma.character.update({
      where: { id },
      data: {
        allianceId,
        allianceTag
      }
    });
  }

  // Delete character
  static async deleteCharacter(id: string): Promise<Character> {
    return prisma.character.delete({
      where: { id }
    });
  }

  // Get characters in range
  static async getCharactersInRange(x: number, y: number, range: number): Promise<Character[]> {
    return prisma.character.findMany({
      where: {
        profile: {
          worldLocationX: {
            gte: x - range,
            lte: x + range
          },
          worldLocationY: {
            gte: y - range,
            lte: y + range
          }
        }
      },
      include: {
        profile: true,
        alliance: true
      }
    });
  }

  // Update character level
  static async updateCharacterLevel(id: string, level: number): Promise<Character> {
    return prisma.character.update({
      where: { id },
      data: { level }
    });
  }
}
