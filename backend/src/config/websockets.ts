import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import { env, isOriginAllowed } from './environment.js';
import { verifyToken } from '../services/password.service.js';

let io: SocketIOServer | null = null;

export function initWebSocketServer(server: HttpServer): SocketIOServer {
  io = new SocketIOServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || isOriginAllowed(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST", "PATCH"],
      credentials: true,
    },
  });

  // Authenticate socket connections & assign to rooms
  io.use((socket: Socket, next) => {
    try {
      const rawToken = socket.handshake.auth?.token || socket.handshake.headers?.authorization;
      let token = typeof rawToken === "string" ? rawToken : "";
      if (token.startsWith("Bearer ")) {
        token = token.slice(7);
      }

      if (token) {
        const decoded = verifyToken(token);
        if (decoded) {
          socket.data.user = decoded;
          if (decoded.role === "admin" || decoded.role === "manager") {
            socket.join("admins");
            console.log(`🔐 Socket ${socket.id} authenticated as ${decoded.role}, joined 'admins' room.`);
          } else if (decoded.role === "customer" && decoded.customerId) {
            socket.join(`customer_${decoded.customerId}`);
            console.log(`👤 Socket ${socket.id} joined 'customer_${decoded.customerId}' room.`);
          }
        }
      }
    } catch (err) {
      console.warn("Socket authentication check failed:", err);
    }
    next();
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
 * Broadcasts an event strictly to authenticated administrators and managers.
 */
export function broadcastToAdmins(event: string, payload: any) {
  if (io) {
    console.log(`📡 Broadcasting event '${event}' to 'admins' room.`);
    io.to("admins").emit(event, payload);
  } else {
    console.warn("⚠️ WebSocket server is not initialized yet. Skipping broadcast.");
  }
}
