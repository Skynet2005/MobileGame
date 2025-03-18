import { NextResponse } from 'next/server';
import { AccountService } from '@/lib/db/services/accountService';
import { AccountSettings } from '@/types/player';
import { prisma } from '@/database/prisma';
import { hash } from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingAccount = await prisma.account.findUnique({
      where: { email }
    });

    if (existingAccount) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await hash(password, 12);

    // Default account settings
    const defaultSettings: AccountSettings = {
      notifications: {
        email: false,
        push: false,
        inGame: true
      },
      privacy: {
        showOnlineStatus: true,
        allowFriendRequests: true,
        showLastSeen: true
      },
      display: {
        theme: 'dark',
        fontSize: 'medium',
        highContrast: false
      },
      gameplay: {
        autoSave: true,
        tutorialCompleted: false,
        graphicsQuality: 'Medium',
        soundEnabled: true,
        musicEnabled: true,
        frameRate: 60
      }
    };

    // Create account
    const account = await prisma.account.create({
      data: {
        email,
        passwordHash,
        settings: JSON.stringify(defaultSettings)
      }
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Failed to create account' },
        { status: 500 }
      );
    }

    // Get total character count and increment by 1 for new ID
    const characterCount = await prisma.character.count();
    const characterNumber = (characterCount + 1).toString().padStart(9, '0');
    const characterName = `lord${characterNumber}`;

    // Create initial character
    const character = await prisma.character.create({
      data: {
        name: characterName,
        level: 1,
        isOnline: true,
        allianceTag: '',
        accountId: account.id,
        profile: {
          create: {
            power: 0,
            kills: 0,
            furnaceLevel: 1,
            state: 1,
            worldLocationX: 0,
            worldLocationY: 0,
            troops: JSON.stringify({
              infantry: { total: 0, level: 1, injured: 0 },
              lancer: { total: 0, level: 1, injured: 0 },
              marksman: { total: 0, level: 1, injured: 0 },
              marchQueue: 0
            })
          }
        }
      },
      include: {
        alliance: true,
        profile: true
      }
    });

    if (!character) {
      return NextResponse.json(
        { error: 'Failed to create character' },
        { status: 500 }
      );
    }

    // Return account and character data
    return NextResponse.json({
      account: {
        id: account.id,
        email: account.email,
        settings: JSON.parse(account.settings)
      },
      character: {
        id: character.id,
        name: character.name,
        level: character.level,
        isOnline: character.isOnline,
        allianceId: character.allianceId,
        allianceTag: character.allianceTag,
        profile: character.profile
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to register account' },
      { status: 500 }
    );
  }
}
