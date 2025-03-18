import { prisma } from '../prisma';
import { Character } from '@/types/player';

export class AllianceService {
  // Create a new alliance
  static async createAlliance(name: string, tag: string, leaderId: string): Promise<any> {
    return prisma.alliance.create({
      data: {
        name,
        tag,
        leaderId
      },
      include: {
        leader: true,
        members: true
      }
    });
  }

  // Get alliance by ID
  static async getAllianceById(id: string): Promise<any> {
    return prisma.alliance.findUnique({
      where: { id },
      include: {
        leader: true,
        members: true
      }
    });
  }

  // Get alliance by tag
  static async getAllianceByTag(tag: string): Promise<any> {
    return prisma.alliance.findUnique({
      where: { tag },
      include: {
        leader: true,
        members: true
      }
    });
  }

  // Update alliance name
  static async updateAllianceName(id: string, name: string): Promise<any> {
    return prisma.alliance.update({
      where: { id },
      data: { name }
    });
  }

  // Update alliance tag
  static async updateAllianceTag(id: string, tag: string): Promise<any> {
    return prisma.alliance.update({
      where: { id },
      data: { tag }
    });
  }

  // Update alliance leader
  static async updateAllianceLeader(id: string, leaderId: string): Promise<any> {
    return prisma.alliance.update({
      where: { id },
      data: { leaderId }
    });
  }

  // Add member to alliance
  static async addMemberToAlliance(allianceId: string, characterId: string): Promise<Character> {
    return prisma.character.update({
      where: { id: characterId },
      data: {
        allianceId,
        allianceTag: (await this.getAllianceById(allianceId))?.tag
      }
    });
  }

  // Remove member from alliance
  static async removeMemberFromAlliance(characterId: string): Promise<Character> {
    return prisma.character.update({
      where: { id: characterId },
      data: {
        allianceId: null,
        allianceTag: null
      }
    });
  }

  // Delete alliance
  static async deleteAlliance(id: string): Promise<any> {
    // First, remove all members from the alliance
    await prisma.character.updateMany({
      where: { allianceId: id },
      data: {
        allianceId: null,
        allianceTag: null
      }
    });

    // Then delete the alliance
    return prisma.alliance.delete({
      where: { id }
    });
  }

  // Get all alliances
  static async getAllAlliances(): Promise<any[]> {
    return prisma.alliance.findMany({
      include: {
        leader: true,
        members: true
      }
    });
  }

  // Get alliance members
  static async getAllianceMembers(allianceId: string): Promise<Character[]> {
    return prisma.character.findMany({
      where: { allianceId },
      include: {
        profile: true
      }
    });
  }

  // Get alliance power
  static async getAlliancePower(allianceId: string): Promise<number> {
    const members = await this.getAllianceMembers(allianceId);
    return members.reduce((total, member) => total + (member.profile?.power || 0), 0);
  }
}
