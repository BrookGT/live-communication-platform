import { createServer } from "http";
import app from "./app";
import { setupSocket } from "./socket";
import * as dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const server = createServer(app);
setupSocket(server);
server.listen(process.env.PORT || 3000, () => {
    console.log("Server is running on port ",process.env.PORT || 3000);
});
