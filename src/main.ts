import * as path from "path";
import {server} from "./webServer/server";
import {MongoHandler} from "./handler/dbs/MongoHandler";
import {wsManager} from "./websocketServer/WebSocketServer";

require('source-map-support').install();
require('dotenv').config({
    path: process.env.NODE_ENV === "production" ? path.join(__dirname, '../.prod.env'): path.join(__dirname, '../.dev.env')
});

/**
 * This is the main function of the application.
 *
 * No core functionality should be added here, it is only the place to start items.
 */
const start = async () => {
    await MongoHandler.init();

    // Le serveur WebSocket est déjà démarré via le singleton
    console.log(`WebSocket server initialized on port ${process.env.WS_PORT || '8080'}`);

    await server(); // Lancer le serveur web
}

start();
