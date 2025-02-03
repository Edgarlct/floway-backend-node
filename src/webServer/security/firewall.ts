import {FastifyInstance} from "fastify";

export function firewall(server: FastifyInstance) {
    server.addHook("onRequest", async (request, reply) => {
        console.log("Request received", request.url, request.method, JSON.stringify(request.body));
        //If the node env is not production, we allow all the requests

        // If endpoint start with /api, we check the token
        // if (request.url.startsWith("/api")) {
        //     try {
        //         await request.jwtVerify();
        //     } catch (e) {
        //         reply.status(401);
        //         reply.send({message: "Unauthorized"});
        //     }
        // }
    });

}



