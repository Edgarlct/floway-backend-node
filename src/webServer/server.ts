import { mainController } from "./controllers/mainController";
import { firewall } from "./security/firewall";
import {SessionController} from "./controllers/SessionController";
import {EventController} from "./controllers/EventController";

export async function server() {

    const fastify = require('fastify')({
        logger: false,
        bodyLimit: 1048576 * 50,
    });

    //Register the plugins @fastify/cors
    fastify.register(require('@fastify/cors'), {
        origin: "*",
        methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
    });

    fastify.register(require('@fastify/multipart'), { attachFieldsToBody: true });

    mainController(fastify);
    SessionController(fastify);
    EventController(fastify);
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
