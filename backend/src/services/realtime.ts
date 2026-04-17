import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export const initializeRealtime = (server: HttpServer, frontendOrigin: string) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: frontendOrigin,
      credentials: true,
    },
  });

  io.on('connection', (socket: Socket) => {
    socket.on('register', (payload: { userId?: number | string }) => {
      if (!payload?.userId) return;
      const room = `user:${payload.userId}`;
      socket.join(room);
    });
  });

  return io;
};

export const emitToUser = (userId: number | string, event: string, payload: any) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};
