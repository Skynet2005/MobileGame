import { prisma } from '@/database/prisma';
import { NextRequest, NextResponse } from 'next/server';

// GET all channels or a specific channel
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const id = searchParams.get('id');

  try {
    // Fetch a specific channel by ID
    if (id) {
      const channel = await prisma.chatChannel.findUnique({
        where: { id },
      });

      if (!channel) {
        return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
      }

      return NextResponse.json(channel);
    }

    // Fetch channels by type or all channels
    const channels = await prisma.chatChannel.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(channels);
  } catch (error) {
    console.error('Error fetching channels:', error);
    return NextResponse.json({ error: 'Failed to fetch channels' }, { status: 500 });
  }
}

// POST a new channel
export async function POST(request: NextRequest) {
  try {
    const { name, type, id } = await request.json();

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    // Check if a channel with the same name already exists
    const existingChannel = await prisma.chatChannel.findFirst({
      where: { name },
    });

    if (existingChannel) {
      return NextResponse.json({ error: 'A channel with this name already exists' }, { status: 409 });
    }

    // Check if a channel with the specified ID already exists (if ID is provided)
    if (id) {
      const existingChannelById = await prisma.chatChannel.findUnique({
        where: { id },
      });

      if (existingChannelById) {
        return NextResponse.json({ error: 'A channel with this ID already exists' }, { status: 409 });
      }
    }

    // Create the channel with or without a custom ID
    const newChannel = await prisma.chatChannel.create({
      data: {
        ...(id && { id }), // Only include ID if provided
        name,
        type
      },
    });

    console.log('Created new channel:', newChannel);
    return NextResponse.json(newChannel);
  } catch (error) {
    console.error('Error creating channel:', error);
    return NextResponse.json({ error: 'Failed to create channel' }, { status: 500 });
  }
}

// Default channels seeder function
export async function seedDefaultChannels() {
  try {
    const defaultChannels = [
      { name: 'World', type: 'world' }
    ];

    // For each default channel
    for (const channel of defaultChannels) {
      // Check if it already exists
      const existing = await prisma.chatChannel.findFirst({
        where: { name: channel.name },
      });

      // If it doesn't exist, create it
      if (!existing) {
        await prisma.chatChannel.create({
          data: channel,
        });
        console.log(`Created default channel: ${channel.name}`);
      }
    }
  } catch (error) {
    console.error('Error seeding default channels:', error);
  }
}
