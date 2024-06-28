import {FastifyInstance} from "fastify";
import User from "../../entity/user";



/**
 * controllers have to be registered in server.ts
 * @param server
 */
export function userControllers(server: FastifyInstance) {

    /**
     * [GET] /health
     * This method is always required to check that the server is up and running
     */

    server.post('/register', async (request, reply) => {
        console.log("ere");
        const { name, email, password } = request.body;
        const user = await User.getInstance().createUser(name, email, password);
        reply.send({ message: 'User registered successfully', user });
    });

    server.get('/users', async (request, reply) => {
        let  id = request.query.id ;
        const users = await User.getInstance().getUserById(id);
        reply.send({ users });
    });

    server.get('/health', async (request, reply) => {
        return {message: "OK"};
    });

}
