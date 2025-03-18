import { NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

export async function GET() {
  try {
    const count = await prisma.character.count();
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error getting character count:', error);
    return NextResponse.json(
      { error: 'Failed to get character count' },
      { status: 500 }
    );
  }
}
