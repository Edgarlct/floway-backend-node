import {FastifyInstance} from "fastify";
import User from "../../entity/User";



/**
 * controllers have to be registered in server.ts
 * @param server
 */
export function userControllers(server: FastifyInstance) {

    server.post<{Body: {first_name: string, last_name: string, email: string, password: string}}>('/register', async (request, reply) => {
        const { first_name, last_name, email, password } = request.body;
        try {
            const user = await User.getInstance().createUser(first_name, last_name, email, password);
            reply.send({ message: 'User registered successfully', "data": {"user_id": user} });
        } catch (e) {
            if (e?.message && e.message.startsWith('User error:')) {
                reply.status(400)
                reply.send({ message: e.message });
                return;
            }
            return e;
        }
    });

    server.post<{Body: {email: string, password: string}}>('/login', async (request, reply) => {
        const { email, password } = request.body;
        try {
            const user = await User.getInstance().login(email, password);
            console.log(user)
            const token = server.jwt.sign(user);
            console.log(token)
            reply.send({ token });
        } catch (e) {
            if (e?.message && e.message.startsWith('User error:')) {
                reply.status(400)
                reply.send({ message: e.message });
                return;
            }
        }
    });

    server.get('/api/users', async (request, reply) => {
        let  id = request.query.id ;
        const users = await User.getInstance().getUserById(id);
        reply.send({ users });
    });
}
