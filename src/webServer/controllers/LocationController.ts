import { MongoHandler } from '../../handler/dbs/MongoHandler';

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

}