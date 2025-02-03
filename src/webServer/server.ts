import { mainController } from "./controllers/mainController";
import { firewall } from "./security/firewall";
import { locationController } from "./controllers/LocationController";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import fastifyCron from 'fastify-cron';
import {SessionController} from "./controllers/SessionController";

export async function server() {

    const fastify = require('fastify')({
        logger: false,
        bodyLimit: 1048576 * 10,
    });
    const jwt = require('@fastify/jwt');

    //Register the plugins @fastify/cors
    fastify.register(require('@fastify/cors'), {
        origin: "*",
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    });

    fastify.register(require('@fastify/multipart'), { attachFieldsToBody: true });

    mainController(fastify);
    SessionController(fastify);
    firewall(fastify);

    //Change host to 0.0.0.0 to allow connections from other computers
    fastify.listen({ port: +process.env.APP_PORT, host: "0.0.0.0" }, (err, address) => {
        if (err) {
            console.log(err);
            process.exit(1);
        }
        console.log(`server listening on ${address}`);
    });
}
