import { io } from "socket.io-client";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  // Create Socket.io client instance
  const socket = io(config.public.wsUrl, {
    autoConnect: true,
    transports: ["polling", "websocket"],
  });

  socket.on("connect", () => {
    console.log("🔌 Connected to WebSocket backend server");
    (window as any).socketConnected = true;
    window.dispatchEvent(new CustomEvent("ws-status", { detail: true }));
  });

  socket.on("disconnect", () => {
    console.log("🔌 Disconnected from WebSocket backend server");
    (window as any).socketConnected = false;
    window.dispatchEvent(new CustomEvent("ws-status", { detail: false }));
  });

  // Inject socket into Nuxt application context
  return {
    provide: {
      socket,
    },
  };
});
