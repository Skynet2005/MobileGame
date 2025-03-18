import { prisma } from '@/database/prisma';
import { Alliance, AllianceMember, AllianceApplication, AllianceSettings, AllianceBanner, AllianceRank } from '../types/alliance';
import { Prisma } from '@prisma/client';
import { ApplicationStatus } from '@prisma/client';

export class AllianceService {
  // Create a new alliance
  static async createAlliance(
    characterId: string,
    characterName: string,
    allianceName: string,
    allianceTag: string,
    banner: AllianceBanner,
    settings: AllianceSettings
  ): Promise<Alliance> {
    // Check if character is already in an alliance
    const existingCharacter = await prisma.character.findUnique({
      where: { id: characterId },
      include: { alliance: true }
    });

    if (existingCharacter?.alliance) {
      throw new Error('Character is already in an alliance');
    }

    // Check if alliance tag is already taken
    const existingAlliance = await prisma.alliance.findUnique({
      where: { tag: allianceTag }
    });

    if (existingAlliance) {
      throw new Error('Alliance tag is already taken');
    }

    // Create the alliance with the character as leader (R5)
    const alliance = await prisma.alliance.create({
      data: {
        name: allianceName,
        tag: allianceTag,
        leaderId: characterId,
        banner: JSON.stringify(banner),
        recruitingSetting: settings.recruitingSetting,
        preferredLanguage: settings.preferredLanguage,
        maxMembers: settings.maxMembers,
        members: {
          create: {
            characterId,
            rank: 'R5',
            joinedAt: new Date()
          }
        }
      },
      include: {
        members: {
          include: {
            character: true
          }
        }
      }
    });

    // Update character's alliance reference
    await prisma.character.update({
      where: { id: characterId },
      data: {
        allianceId: alliance.id,
        allianceTag: alliance.tag
      }
    });

    // Create alliance chat channel
    const allianceChannel = await prisma.chatChannel.create({
      data: {
        name: 'Alliance',
        type: 'alliance',
        description: `Official chat channel for ${allianceName}`,
        isPrivate: true,
        allianceId: alliance.id,
        members: {
          create: {
            characterId,
            joinedAt: new Date()
          }
        }
      }
    });

    return this.formatAllianceResponse(alliance);
  }

  // Get alliance by ID
  static async getAllianceById(allianceId: string): Promise<Alliance | null> {
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId },
      include: {
        members: {
          include: {
            character: true
          }
        }
      }
    });

    return alliance ? this.formatAllianceResponse(alliance) : null;
  }

  // Get alliance by tag
  static async getAllianceByTag(tag: string): Promise<Alliance | null> {
    const alliance = await prisma.alliance.findUnique({
      where: { tag },
      include: {
        members: {
          include: {
            character: true
          }
        }
      }
    });

    return alliance ? this.formatAllianceResponse(alliance) : null;
  }

  // Apply to join an alliance
  static async applyToAlliance(allianceId: string, characterId: string, characterName: string, power: number): Promise<AllianceApplication> {
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId },
      include: { members: true }
    });

    if (!alliance) {
      throw new Error('Alliance not found');
    }

    if (alliance.members.length >= alliance.maxMembers) {
      throw new Error('Alliance is full');
    }

    if (alliance.recruitingSetting === 'instant') {
      // Auto-accept for instant join
      return this.acceptApplication(allianceId, characterId, characterName, power, alliance.leaderId);
    }

    // Create application
    const application = await prisma.allianceApplication.create({
      data: {
        allianceId,
        characterId,
        characterName,
        power,
        status: ApplicationStatus.pending,
        appliedAt: new Date()
      }
    });

    return application;
  }

  // Accept an application
  static async acceptApplication(
    allianceId: string,
    characterId: string,
    characterName: string,
    power: number,
    processedBy: string
  ): Promise<AllianceApplication> {
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId },
      include: { members: true }
    });

    if (!alliance) {
      throw new Error('Alliance not found');
    }

    if (alliance.members.length >= alliance.maxMembers) {
      throw new Error('Alliance is full');
    }

    // Create or update application
    const application = await prisma.allianceApplication.upsert({
      where: {
        allianceId_characterId: {
          allianceId,
          characterId
        }
      },
      create: {
        allianceId,
        characterId,
        characterName,
        power,
        status: ApplicationStatus.accepted,
        appliedAt: new Date(),
        processedAt: new Date(),
        processedBy
      },
      update: {
        status: ApplicationStatus.accepted,
        processedAt: new Date(),
        processedBy
      }
    });

    // Add member to alliance
    await prisma.allianceMember.create({
      data: {
        allianceId,
        characterId,
        rank: 'R1',
        joinedAt: new Date()
      }
    });

    // Update character's alliance reference
    await prisma.character.update({
      where: { id: characterId },
      data: {
        allianceId,
        allianceTag: alliance.tag
      }
    });

    return application;
  }

  // Update member rank
  static async updateMemberRank(
    allianceId: string,
    characterId: string,
    newRank: AllianceRank,
    updatedBy: string
  ): Promise<void> {
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId },
      include: { members: true }
    });

    if (!alliance) {
      throw new Error('Alliance not found');
    }

    const updater = alliance.members.find(m => m.characterId === updatedBy);
    if (!updater) {
      throw new Error('Updater not found in alliance');
    }

    const updaterRank = updater.rank as AllianceRank;
    if (!['R4', 'R5'].includes(updaterRank)) {
      throw new Error('Insufficient permissions to change ranks');
    }

    await prisma.allianceMember.update({
      where: {
        allianceId_characterId: {
          allianceId,
          characterId
        }
      },
      data: { rank: newRank }
    });
  }

  // Update alliance settings
  static async updateAllianceSettings(
    allianceId: string,
    settings: Partial<AllianceSettings>,
    updatedBy: string
  ): Promise<void> {
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId },
      include: { members: true }
    });

    if (!alliance) {
      throw new Error('Alliance not found');
    }

    const updater = alliance.members.find(m => m.characterId === updatedBy);
    if (!updater) {
      throw new Error('Updater not found in alliance');
    }

    const updaterRank = updater.rank as AllianceRank;
    if (!['R4', 'R5'].includes(updaterRank)) {
      throw new Error('Insufficient permissions to update settings');
    }

    await prisma.alliance.update({
      where: { id: allianceId },
      data: settings
    });
  }

  // Update alliance banner
  static async updateAllianceBanner(
    allianceId: string,
    banner: AllianceBanner,
    updatedBy: string
  ): Promise<void> {
    const alliance = await prisma.alliance.findUnique({
      where: { id: allianceId },
      include: { members: true }
    });

    if (!alliance) {
      throw new Error('Alliance not found');
    }

    const updater = alliance.members.find(m => m.characterId === updatedBy);
    if (!updater) {
      throw new Error('Updater not found in alliance');
    }

    if (updater.rank !== 'R5') {
      throw new Error('Only the alliance leader can modify the banner');
    }

    await prisma.alliance.update({
      where: { id: allianceId },
      data: { banner: JSON.stringify(banner) }
    });
  }

  // Delete alliance
  static async deleteAlliance(allianceId: string): Promise<void> {
    // First, remove all members from the alliance
    await prisma.character.updateMany({
      where: { allianceId },
      data: {
        allianceId: null,
        allianceTag: null
      }
    });

    // Delete all alliance members
    await prisma.allianceMember.deleteMany({
      where: { allianceId }
    });

    // Delete all alliance applications
    await prisma.allianceApplication.deleteMany({
      where: { allianceId }
    });

    // Delete the alliance chat channel
    await prisma.chatChannel.deleteMany({
      where: { allianceId }
    });

    // Finally, delete the alliance
    await prisma.alliance.delete({
      where: { id: allianceId }
    });
  }

  // Helper function to format alliance response
  private static formatAllianceResponse(alliance: any): Alliance {
    const members = alliance.members.map((m: any) => ({
      characterId: m.characterId,
      characterName: m.character.name,
      rank: m.rank,
      power: m.character.profile?.power || 0,
      joinedAt: m.joinedAt
    }));

    const totalPower = members.reduce((sum: number, m: any) => sum + m.power, 0);

    return {
      id: alliance.id,
      name: alliance.name,
      tag: alliance.tag,
      leaderId: alliance.leaderId,
      leaderName: members.find((m: any) => m.rank === 'R5')?.characterName || '',
      members,
      banner: JSON.parse(alliance.banner),
      recruitingSetting: alliance.recruitingSetting,
      preferredLanguage: alliance.preferredLanguage,
      createdAt: alliance.createdAt,
      updatedAt: alliance.updatedAt,
      totalPower,
      maxMembers: alliance.maxMembers
    };
  }
}
