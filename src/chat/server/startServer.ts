import { startWebSocketServer } from './wsServer';

// This script will be called by the app on startup
// to ensure the WebSocket server is running alongside the Next.js server

// Get port from environment variable or use default
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT, 10) : 3001;

// Start the WebSocket server
console.log(`Starting WebSocket server on port ${WS_PORT}...`);
const stopServer = startWebSocketServer(WS_PORT);

// Handle process termination signals to gracefully shut down server
process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Shutting down WebSocket server...');
  stopServer();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Received SIGTERM signal. Shutting down WebSocket server...');
  stopServer();
  process.exit(0);
});

console.log('WebSocket server startup complete.');
