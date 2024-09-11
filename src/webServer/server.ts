import { mainController } from "./controllers/mainController";
import { firewall } from "./security/firewall";
import { locationController } from "./controllers/LocationController";
import { readFileSync } from "node:fs";
import * as path from "node:path";
import fastifyCron from 'fastify-cron';

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

    fastify.register(jwt, {
        secret: {
            private: {
                key: readFileSync(`${path.join(__dirname, '../certs')}/private.pem`, 'utf8'),
                passphrase: process.env.JWT_PASSPHRASE
            },
            public: readFileSync(`${path.join(__dirname, '../certs')}/public.pem`, 'utf8')
        },
        sign: { algorithm: 'RS256', expiresIn: '3h' }
    });

    // Register fastify-cron
    fastify.register(fastifyCron, {
        jobs: [
            {
                cronTime: '*/15 * * * * *',
                onTick: async function (server) {

                    const a = {
                        id: "2",
                        latitude: 48.8566,
                        longitude: 2.3522,
                        timestamp: "2024-09-10T10:00:00Z"
                    };



                    const data = {
                        id: "2",
                        latitude: 48.8575,
                        longitude: 2.3540,
                        timestamp: "2024-09-10T10:02:00Z"
                    };

                    const response = await server.inject({
                        method: 'POST',
                        url: '/location',
                        payload: data
                    });
                    delete data.id;
                    delete data.latitude;
                    delete data.longitude;
                    delete data.timestamp;

                },
                start: true,
            }
        ]
    });

    mainController(fastify);
    locationController(fastify);
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