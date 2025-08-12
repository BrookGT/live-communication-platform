import { Server, Socket } from "socket.io";
import { Server as httpServer } from "http";

export function setupSocket(server: httpServer) {
    const io = new Server(server);

    io.on("connection", (socket: Socket) => {
        console.log("A user connected:", socket.id);

        socket.on("message", (msg: string) => {
            console.log("Message received:", msg);
            io.emit("message", msg); // Broadcast the message to all connected clients
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
}
