import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create an account first
  const account = await prisma.account.create({
    data: {
      email: 'dev@example.com',
      passwordHash: 'dev',
      settings: '{}',
      isActive: true
    }
  });

  // Create a character
  const character = await prisma.character.create({
    data: {
      id: 'Dev',
      name: 'Dev',
      accountId: account.id,
      level: 30,
      isOnline: true,
      profile: {
        create: {
          power: 10000,
          kills: 1000000000,
          furnaceLevel: 30,
          state: 1,
          worldLocationX: 0,
          worldLocationY: 0,
          troops: '[]'
        }
      }
    }
  });

  // Create an alliance
  const alliance = await prisma.alliance.create({
    data: {
      name: 'Dev Squad',
      tag: 'DEV',
      leaderId: character.id,
      banner: JSON.stringify({
        color: '#1a1a1a',
        badge: 'shield',
        badgeIcon: 'star',
        trimColor: '#gold',
        innerColor: '#2a2a2a',
        shape: 'circle'
      }),
      recruitingSetting: 'application',
      preferredLanguage: 'en',
      maxMembers: 100,
      members: {
        create: {
          characterId: character.id,
          rank: 'R5',
          joinedAt: new Date()
        }
      }
    }
  });

  // Update character with alliance information
  await prisma.character.update({
    where: { id: character.id },
    data: {
      allianceId: alliance.id,
      allianceTag: alliance.tag
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
