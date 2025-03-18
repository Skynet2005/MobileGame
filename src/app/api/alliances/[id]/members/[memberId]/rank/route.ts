import { NextResponse } from 'next/server';
import { prisma } from '@/database/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string; memberId: string } }
) {
  try {
    const { rank } = await request.json();

    const member = await prisma.allianceMember.update({
      where: {
        allianceId_characterId: {
          allianceId: params.id,
          characterId: params.memberId
        }
      },
      data: { rank }
    });

    return NextResponse.json(member);
  } catch (error) {
    console.error('Error updating member rank:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
