import {FastifyInstance} from "fastify";
import {JWTHandler} from "./JWTHandler";

export function firewall(server: FastifyInstance) {
    server.addHook("onRequest", async (request, reply) => {
        console.log("Request received", request.url, request.method, JSON.stringify(request.body));
        //If the node env is not production, we allow all the requests

        // If endpoint start with /auth, we check the token
        if (request.url.startsWith("/auth") && JWTHandler.checkJWTAvailability(request)) {
            try {
                const token = JWTHandler.extractJwtFromRequest(request);
                if (JWTHandler.verifyJwt(token)) {
                    request.jwt = JWTHandler.decodeJwt(token); // Attach the decoded user to the request object
                } else {
                    reply.status(401);
                    reply.send({message: "Unauthorized"});
                }
            } catch (e) {
                reply.status(401);
                reply.send({message: "Unauthorized"});
            }
        }
    });

}



