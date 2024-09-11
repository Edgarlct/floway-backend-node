import { MongoHandler } from '../../handler/dbs/MongoHandler';
import {calculateAverageSpeed, calculateTotalDistance, calculateTotalDuration} from "../../tools/calculData";

export function locationController(server) {

    server.post('/location', async (request, reply) => {
        const { id, latitude, longitude, timestamp } = request.body;

        if (!id || !latitude || !longitude || !timestamp) {
            return reply.status(400).send({ message: 'Invalid data' });
        }

        try {
            await MongoHandler.init();

            const userPositionCollection = MongoHandler.getUserPositionCollection();

            const last_tps_unix = Math.floor(new Date(timestamp).getTime() / 1000);
            const newPosition = {
                position: [latitude, longitude, last_tps_unix]
            };

            const result = await userPositionCollection.updateOne(
                { id },
                {
                    $push: {
                        positions: [latitude, longitude, last_tps_unix]
                    },
                    $setOnInsert: { id }
                },
                { upsert: true }
            );

            console.log(result);
            reply.send({ message: 'Location saved successfully', result });

        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: 'Internal Server Error' });
        }
    });

    server.get('/location/:id', async (request, reply) => {
        const {id} = request.params;
        if (!id) {
            return reply.status(400).send({message: 'Invalid data'});
        }

        try {
            await MongoHandler.init();

            const userPositionCollection = MongoHandler.getUserPositionCollection();

            const user = await userPositionCollection.findOne({id});
            console.log(user);
            const userSerialized = {
                id: user.id,
                positions: user.positions.map((position) => {
                    return {
                        latitude: position[0],
                        longitude: position[1],
                        timestamp: new Date(position[2] * 1000).toISOString()
                    };
                }),
                totalDistance: calculateTotalDistance(user.positions),
                averageSpeed: calculateAverageSpeed(user.positions),
                totalDuration: calculateTotalDuration(user.positions)
            };

            console.log(userSerialized);

            if (!user) {
                return reply.status(404).send({message: 'User not found'});
            }

            reply.send(userSerialized);

        } catch (error) {
            console.error(error);
            reply.status(500).send({message: 'Internal Server Error'});
        }
    }
    );
}