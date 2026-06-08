import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from './environment.js';

let io: SocketIOServer | null = null;

export function initWebSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: env.WS_CORS_ORIGIN,
      methods: ["GET", "POST", "PATCH"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`🔌 Client connected to WebSocket: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Broadcasts an event to all connected administrators.
 */
export function broadcastToAdmins(event: string, payload: any) {
  if (io) {
    console.log(`📡 Broadcasting event '${event}' to all clients`);
    io.emit(event, payload);
  } else {
    console.warn("⚠️ WebSocket server is not initialized yet. Skipping broadcast.");
  }
}
