import { NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const settings = await request.json();

    const alliance = await prisma.alliance.update({
      where: { id: params.id },
      data: settings
    });

    return NextResponse.json(alliance);
  } catch (error) {
    console.error('Error updating alliance settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
