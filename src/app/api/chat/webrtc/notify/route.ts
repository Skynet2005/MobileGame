import { NextRequest, NextResponse } from 'next/server';
import { sendSSEEvent } from '../../notifications/sse/route';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { type, from, to } = data;

    // Validate required fields
    if (!type || !from || !to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send notification to the target character via SSE
    await sendSSEEvent(to, `rtc_${type}`, {
      from,
      to,
      ...data
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending WebRTC notification:', error);
    return NextResponse.json({ error: 'Failed to send WebRTC notification' }, { status: 500 });
  }
}
