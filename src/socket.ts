import { Server, Socket } from "socket.io";
import { Server as httpServer } from "http";

interface PeerSocket {
    peer1?: Socket;
    peer2?: Socket;
}

export function setupSocket(server: httpServer) {
    const io = new Server(server);

    const peerSockets: Map<string, PeerSocket> = new Map();
    const lookup: Map<string, string> = new Map();

    io.on("connection", (socket: Socket) => {
        console.log("A user connected:", socket.id);

        socket.on("join", (room: string) => {
            if (!peerSockets.has(room)) {
                peerSockets.set(room, { peer1: socket });
                lookup.set(socket.id, room); // Store the room for this socket
            } else {
                const currentPeers = peerSockets.get(room);
                if (currentPeers?.peer1 && !currentPeers.peer2) {
                    currentPeers.peer2 = socket; // Assign the second peer
                    lookup.set(socket.id, room); // Store the room for this socket
                    currentPeers.peer1.emit("A user joined", socket.id); // Notify peer1 that peer2 has joined
                    console.log(`Peer2 joined room: ${room}`);
                } else {
                    console.log(
                        `Room ${room} is already full or has two peers.`
                    );
                    socket.emit("roomFull", room);
                }
            }
            console.log(`User ${socket.id} joined room: ${room}`);
            socket.join(room);
        });

        socket.on("message", (msg: string) => {
            console.log("Message received:", msg);
            io.emit("message", msg); // Broadcast the message to all connected clients
        });

        socket.on("offer", (offer: string) => {
            console.log("Offer received:", offer);
            const room = lookup.get(socket.id);
            if (room) {
                const currentPeers = peerSockets.get(room);
                if (currentPeers?.peer2?.id === socket.id) {
                    currentPeers.peer1?.emit("offer", offer);
                } else if (currentPeers?.peer1?.id === socket.id) {
                    currentPeers.peer2?.emit("offer", offer);
                }
            }
        });

        socket.on("candidate", (candidate: string) => {
            console.log("Candidate received:", socket.id, candidate);
            const room = lookup.get(socket.id);
            if (room) {
                const currentPeers = peerSockets.get(room);
                if (currentPeers?.peer2?.id === socket.id) {
                    currentPeers.peer1?.emit("candidate", candidate);
                } else if (currentPeers?.peer1?.id === socket.id) {
                    currentPeers.peer2?.emit("candidate", candidate);
                }
            }
        });

        socket.on("disconnect", () => {
            console.log("User disconnected:", socket.id);
            const room = lookup.get(socket.id);
            if (room) {
                const currentPeers = peerSockets.get(room);
                if (currentPeers) {
                    if (currentPeers.peer1?.id === socket.id) {
                        currentPeers.peer2?.emit(
                            "peerDisconnected",
                            "Peer1 has disconnected"
                        );
                        peerSockets.delete(room); // Remove the room if peer1 disconnects
                        lookup.delete(socket.id); // Remove the socket from the lookup
                        lookup.delete(currentPeers.peer2?.id || ""); // Remove peer2 from lookup if it exists
                        io.to(room).emit("roomClosed", room); // Notify remaining peer that the room is closed
                        console.log(
                            `Room ${room} removed due to peer1 disconnection.`
                        );
                    } else if (currentPeers.peer2?.id === socket.id) {
                        currentPeers.peer2 = undefined; // Clear peer2
                        lookup.delete(socket.id); // Remove the socket from the lookup
                        currentPeers.peer1?.emit(
                            "peerDisconnected",
                            "Peer2 has disconnected"
                        );
                    }
                }
                lookup.delete(socket.id); // Remove the socket from the lookup
            }
        });
    });

    return io;
}
