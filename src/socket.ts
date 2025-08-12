import { Server, Socket } from "socket.io";
import { Server as httpServer } from "http";

export function setupSocket(server: httpServer) {
    const io = new Server(server);

    io.on("connection", (socket: Socket) => {
        console.log("A user connected:", socket.id);

        socket.on("join", (room: string) => {
            console.log(`User ${socket.id} joined room: ${room}`);
            socket.join(room);
        });

        socket.on("message", (msg: string) => {
            console.log("Message received:", msg);
            io.emit("message", msg); // Broadcast the message to all connected clients
        });

        socket.on("offer", (offer: string) => {
            console.log("Offer received:", offer);
            socket.broadcast.emit("offer", offer); // Broadcast the offer to all other clients
        });

        socket.on("candidate", (candidate: string) => {
            console.log("Candidate received:", socket.id, candidate);
            socket.broadcast.emit("candidate", candidate); // Broadcast the ICE candidate to all other clients
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
        });
    });

    return io;
}
