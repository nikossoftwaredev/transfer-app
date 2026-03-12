"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useSession } from "next-auth/react";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001";

export function useSocket() {
  const { data: session } = useSession();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!session?.wsToken) return;

    const socket = io(WS_URL, {
      auth: { token: session.wsToken },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on("connect", () => {
      console.log("WS connected:", socket.id);
    });

    socket.on("connect_error", (err) => {
      console.warn("WS connection error:", err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [session?.wsToken]);

  return socketRef;
}
