import {FastifyInstance} from "fastify";

export function firewall(server: FastifyInstance) {
    server.addHook("onRequest", async (request, reply) => {
        //If the node env is not production, we allow all the requests
        if (process.env.NODE_ENV !== "production") {
            return;
        }


        /**
         * You can add extra logic here.
         */
    });

}



