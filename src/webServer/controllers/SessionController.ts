import {MongoHandler} from '../../handler/dbs/MongoHandler';
import {calculateAverageSpeed, calculateTotalDistance, calculateTotalDuration} from "../../tools/calculData";
import {DateTime} from "luxon";

export interface ISessionPayload {
    session_type : "run" | "distance" | "time" | "free",
    user_id : number,
    title : string,
    distance : number,
    calories : number,
    allure : number,
    time : number,
    tps: [number, number, number][],
    time_objective? : number,
    distance_objective? : number,
    run_id? : number,
}

export function SessionController(server) {

    server.post("/session", async (request, reply) => {
        const payload = request.body as ISessionPayload

        if (!payload.session_type || !payload.user_id || !payload.title || !payload.distance || !payload.calories || !payload.allure || !payload.time || !payload.tps) {
            return reply.status(400).send({ message: "Invalid data" });
        }

        if (payload.session_type !== "run" && payload.session_type !== "distance" && payload.session_type !== "time" && payload.session_type !== "free") {
            return reply.status(400).send({ message: "Invalid data, session type must be 'run', 'distance' or 'time'" });
        }

        // check if the session type is valid and if the objective is set
        if (payload.session_type === "distance" && !payload.distance_objective) {
            return reply.status(400).send({ message: "Invalid data, distance objective is required" });
        }
        if (payload.session_type === "time" && !payload.time_objective) {
            return reply.status(400).send({ message: "Invalid data, time objective is required" });
        }
        if (payload.session_type === "run" && !payload.run_id) {
            return reply.status(400).send({ message: "Invalid data, run id is required" });
        }

        try {
            await MongoHandler.init();

            const sessionCollection = MongoHandler.getSessionCollection();
            const now = DateTime.now();
            const day = now.toFormat("yyyy-LL-dd");

            const session = {
                id: `${payload.user_id}-${now.toUnixInteger()}`,
                reference_day: day,
                session_type: payload.session_type,
                user_id: payload.user_id,
                title: payload.title,
                distance: payload.distance,
                calories: payload.calories,
                allure: payload.allure,
                time: payload.time,
                tps: payload.tps,
                time_objective: payload.time_objective || null,
                distance_objective: payload.distance_objective || null,
                run_id: payload.run_id || null,
            };

            const result = await sessionCollection.insertOne(session);

            reply.send({ message: "Session saved successfully", data: {insertedId:session.id} });

        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: "Internal Server Error" });
        }
    })

    server.get("/session/:id", async (request, reply) => {
        const { id } = request.params;
        if (!id) {
            return reply.status(400).send({ message: "Invalid data" });
        }

        try {
            await MongoHandler.init();

            const sessionCollection = MongoHandler.getSessionCollection();

            const session = await sessionCollection.findOne({ id })


            return reply.send(session);

        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: "Internal Server Error" });
        }
    })

    server.get("/session/user/:user_id", async (request, reply) => {
        const { user_id } = request.params;
        const { from, to } = request.query;
        if (!user_id) {
            return reply.status(400).send({ message: "Invalid data" });
        }

        try {
            await MongoHandler.init();

            const sessionCollection = MongoHandler.getSessionCollection();

            let aggregation = [
                {
                    $match: {
                        user_id: parseInt(user_id),
                    }
                },
                {
                    $sort: { reference_day: 1 }
                }
            ]
            if (from && to) {
                aggregation[0].$match["reference_day"] = { $gte: from, $lte: to }
            }

            const sessions = await sessionCollection.aggregate(aggregation).toArray();

            return reply.send(sessions);

        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: "Internal Server Error" });
        }
    })


    // put route to update the title of a session
    server.put("/session/:id", async (request, reply) => {
        const { id } = request.params;
        const { title } = request.body;
        if (!id || !title) {
            return reply.status(400).send({ message: "Invalid data" });
        }

        try {
            await MongoHandler.init();

            const sessionCollection = MongoHandler.getSessionCollection();

            const result = await sessionCollection.updateOne(
                { id },
                { $set: { title } }
            );

            return reply.send({ message: "Session updated successfully", result });

        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: "Internal Server Error" });
        }
    })

    // delete route to delete a session
    server.delete("/session/:id", async (request, reply) => {
        const { id } = request.params;
        if (!id) {
            return reply.status(400).send({ message: "Invalid data" });
        }

        try {
            await MongoHandler.init();

            const sessionCollection = MongoHandler.getSessionCollection();

            const result = await sessionCollection.deleteOne({ id });

            return reply.send({ message: "Session deleted successfully", result });

        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: "Internal Server Error" });
        }
    })
}
