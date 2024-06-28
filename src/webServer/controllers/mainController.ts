import {FastifyInstance} from "fastify";


/**
 * controllers have to be registered in server.ts
 * @param server
 */
export function mainController(server: FastifyInstance) {

    /**
     * [GET] /health
     * This method is always required to check that the server is up and running
     */
    server.get('/health', async (request, reply) => {
        return {message: "OK"};
    });

}
