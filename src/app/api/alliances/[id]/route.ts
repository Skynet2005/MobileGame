import { NextResponse } from 'next/server';
import { AllianceService } from '@/services/allianceService';
import { prisma } from '@/database/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const allianceId = params.id;
    await AllianceService.deleteAlliance(allianceId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alliance:', error);
    return NextResponse.json(
      { error: 'Failed to delete alliance' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First try to find alliance by ID
    let alliance = await prisma.alliance.findUnique({
      where: { id: params.id },
      include: {
        members: {
          include: {
            character: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    });

    // If not found, try to find alliance by character ID
    if (!alliance) {
      const character = await prisma.character.findUnique({
        where: { id: params.id },
        include: {
          alliance: {
            include: {
              members: {
                include: {
                  character: {
                    include: {
                      profile: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!character?.alliance) {
        return NextResponse.json({ error: 'Alliance not found' }, { status: 404 });
      }

      alliance = character.alliance;
    }

    // Format the response to match the expected structure
    const formattedAlliance = {
      id: alliance.id,
      name: alliance.name,
      tag: alliance.tag,
      leaderId: alliance.leaderId,
      leaderName: alliance.members.find(m => m.rank === 'R5')?.character.name || '',
      members: alliance.members.map(m => ({
        characterId: m.characterId,
        characterName: m.character.name,
        rank: m.rank,
        power: m.character.profile?.power || 0,
        joinedAt: m.joinedAt
      })),
      banner: JSON.parse(alliance.banner),
      recruitingSetting: alliance.recruitingSetting,
      preferredLanguage: alliance.preferredLanguage,
      createdAt: alliance.createdAt,
      updatedAt: alliance.updatedAt,
      totalPower: alliance.members.reduce((sum, m) => sum + (m.character.profile?.power || 0), 0),
      maxMembers: alliance.maxMembers
    };

    return NextResponse.json(formattedAlliance);
  } catch (error) {
    console.error('Error fetching alliance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
