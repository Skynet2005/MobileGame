import { NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { banner } = await request.json();

    const alliance = await prisma.alliance.update({
      where: { id: params.id },
      data: { banner: JSON.stringify(banner) }
    });

    return NextResponse.json(alliance);
  } catch (error) {
    console.error('Error updating alliance banner:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
