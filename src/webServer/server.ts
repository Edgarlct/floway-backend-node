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

                    console.log("Cron job executed every 10 seconds");

                    const data = {
                        id: "12",
                        latitude: 45.66,
                        longitude: 23.22,
                        timestamp: "2024-09-10T10:00:00Z"
                    };

                    // Faire un appel à l'endpoint `/location` pour envoyer les données
                    const response = await server.inject({
                        method: 'POST',
                        url: '/location',
                        payload: data
                    });


                    console.log('Location data sent', response.payload);

                    // clear variables data
                    delete data.id;
                    delete data.latitude;
                    delete data.longitude;
                    delete data.timestamp;
                    console.log(data);
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