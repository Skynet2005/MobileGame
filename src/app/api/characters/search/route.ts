import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('accountId');

    if (!accountId) {
      return NextResponse.json(
        { error: 'Account ID is required' },
        { status: 400 }
      );
    }

    const characters = await prisma.character.findMany({
      where: {
        accountId: accountId
      },
      include: {
        profile: true,
        alliance: true
      }
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error('Error searching characters:', error);
    return NextResponse.json(
      { error: 'Failed to search characters' },
      { status: 500 }
    );
  }
}
