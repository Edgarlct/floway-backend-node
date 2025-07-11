import * as path from "path";
import {server} from "./webServer/server";
import {MongoHandler} from "./handler/dbs/MongoHandler";
import {MqttServer} from "./mqttServer/MqttServer";
import {MqttClient} from "./services/MqttClient";

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

    const mqttServer = new MqttServer(
        +(process.env.MQTT_PORT || 8888),
        +(process.env.MQTT_WS_PORT || 8883),
        +(process.env.MQTT_WSS_PORT || 8884)
    );
    await mqttServer.start();

    const mqttClient = new MqttClient();
    await mqttClient.connect();
    mqttClient.subscribe(['server/status', 'mobile/+']);

    await server(); // Lancer le serveur web
}

start();
