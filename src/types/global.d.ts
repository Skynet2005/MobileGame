import { WebSocketServer } from 'ws';

declare global {
  var wss: WebSocketServer;
  namespace NodeJS {
    interface Global {
      wss: WebSocketServer;
    }
  }
}
