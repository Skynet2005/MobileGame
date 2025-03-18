import { NextApiRequest } from 'next';
import { createWebSocketHandler } from '@/chat/server/wsServer';

// This file creates the WebSocket endpoint that clients connect to
const wsHandler = createWebSocketHandler();

// In Next.js App Router, we need to export GET function to handle WebSocket upgrade
export async function GET(request: NextApiRequest, response: any) {
  return wsHandler(request, response);
}

// No need for config export in App Router as it uses a different configuration approach
