import {mainController} from "./controllers/mainController";
import {firewall} from "./security/firewall";
import {userControllers} from "./controllers/userControllers";
import {readFileSync} from "node:fs";
import * as path from "node:path";
import {runControllers} from "./controllers/runController";
import customRun from "../entity/CustomRun";
import {customRunControllers} from "./controllers/customRunController";

export async function server() {

    const fastify = require('fastify')({
        logger: false,
        bodyLimit: 1048576 * 10,
    })
    const jwt = require('@fastify/jwt');

    //Register the plugins @fastify/cors
    fastify.register(require('@fastify/cors'), {
        origin: "*",
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    });

    fastify.register(require('@fastify/multipart'), { attachFieldsToBody: true })

    fastify.register(jwt, {
        secret: {
            private: {
                key: readFileSync(`${path.join(__dirname, '../certs')}/private.pem`, 'utf8'),
                passphrase: process.env.JWT_PASSPHRASE
            },
            public: readFileSync(`${path.join(__dirname, '../certs')}/public.pem`, 'utf8')
        },
        sign: { algorithm: 'RS256', expiresIn: '3h' }
    })


    //Register the controllers below
    mainController(fastify);
    userControllers(fastify);
    runControllers(fastify);
    customRunControllers(fastify);
    firewall(fastify);

    //Change host to 0.0.0.0 to allow connections from other computers
    fastify.listen({port: +process.env.APP_PORT, host: "0.0.0.0"}, (err, address) => {
        if (err) {
            console.log(err)
            process.exit(1)
        }
        console.log(`server listening on ${address}`)
    })


}
