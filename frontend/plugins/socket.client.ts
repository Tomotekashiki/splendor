import { io } from "socket.io-client";

export default defineNuxtPlugin((nuxtApp) => {
  const config = useRuntimeConfig();

  const wsUrl = config.public.wsUrl || "";
  const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
  const isVercelBackend = wsUrl.includes("vercel.app") || wsUrl === "" || wsUrl === "/" || (currentHost && wsUrl.includes(currentHost));

  let socket: any;

  if (isVercelBackend) {
    console.warn("⚠️ WebSockets are not supported on Vercel. Socket.io connection bypassed; falling back to secure HTTP polling.");
    // Create a mock socket object to prevent client-side runtime errors
    socket = {
      connected: false,
      on: () => {},
      off: () => {},
      emit: () => {},
      connect: () => {},
      disconnect: () => {}
    };
  } else {
    // Create Socket.io client instance for persistent environments (e.g. Render, Railway, Localhost)
    socket = io(wsUrl, {
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
  }

  // Inject socket into Nuxt application context
  return {
    provide: {
      socket,
    },
  };
});
