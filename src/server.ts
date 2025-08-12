import { createServer } from "https";
import app from "./app";
import { setupSocket } from "./socket";
import * as dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables from .env
dotenv.config();

// Load SSL key and certificate
const PORT = Number(process.env.PORT || 3000);
const keyPath = process.env.SSL_KEY_PATH || path.resolve(process.cwd(), "server.key");
const certPath = process.env.SSL_CERT_PATH || path.resolve(process.cwd(), "server.cert");

const options = {
  key: fs.readFileSync(keyPath), // private key
  cert: fs.readFileSync(certPath), // certificate
};

const server = createServer(options, app);
setupSocket(server);
server.listen(PORT, () => {
  console.log(`HTTPS server listening at https://127.0.0.1:${PORT}`);
});
