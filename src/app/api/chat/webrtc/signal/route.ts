import { NextRequest, NextResponse } from 'next/server';
import { sendSSEEvent } from '../../notifications/sse/route';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { type, from, to, offer, answer, candidate } = data;

    // Validate required fields
    if (!type || !from || !to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Forward the signal to the target character via SSE
    await sendSSEEvent(to, `rtc_${type}`, {
      from,
      to,
      ...(offer && { offer }),
      ...(answer && { answer }),
      ...(candidate && { candidate })
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error handling WebRTC signal:', error);
    return NextResponse.json({ error: 'Failed to process WebRTC signal' }, { status: 500 });
  }
}
