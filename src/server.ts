import { createServer } from "http";
import app from "./app";
import { setupSocket } from "./socket";

const server = createServer(app);
setupSocket(server);
server.listen(process.env.PORT || 3001, () => {
    console.log("Server is running on port ",process.env.PORT || 3000);
});
