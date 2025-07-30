import {MongoHandler} from '../../handler/dbs/MongoHandler';
import {calculateAverageSpeed, calculateTotalDistance, calculateTotalDuration} from "../../tools/calculData";
import {DateTime} from "luxon";
import SQLHandler from "../../handler/dbs/SQLHandler";
import {fetchFriendIds} from "../../tools/FriendTools";
import notificationService from "../../tools/NotificationService";

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

        // Validation des champs obligatoires
        if (!payload.user_id || !payload.tps || payload.tps.length === 0) {
            return reply.status(400).send({ message: "Invalid data: user_id and tps are required" });
        }

        if (payload.session_type && payload.session_type !== "run" && payload.session_type !== "distance" && payload.session_type !== "time" && payload.session_type !== "free") {
            return reply.status(400).send({ message: "Invalid data, session type must be 'run', 'distance', 'time' or 'free'" });
        }

        // Validation conditionnelle selon le type de session
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
            // check if the tps contains valid objects
            if (!Array.isArray(payload.tps) || payload.tps.length === 0 || !payload.tps.every(t => Array.isArray(t) && t.length === 3)) {
                return reply.status(400).send({ message: "Invalid data, tps must be an array of [latitude, longitude, timestamp] arrays" });
            }

            // filter all tps that are not valid, and where the timestamp is a valid unix timestamp
            console.log("Before filtering tps:", payload.tps.length);
            payload.tps = payload.tps.filter(t => Array.isArray(t) && t.length === 3 && !isNaN(t[2]) && t[2] > 0 && (t[2]).toString().length === 10);
            console.log("After filtering tps:", payload.tps.length);


            // Calcul du dernier timestamp depuis le payload
            const lastTpsFromPayload = payload.tps[payload.tps.length - 1][payload.tps[payload.tps.length - 1].length - 1];

            // Recherche de la session la plus récente pour cet utilisateur à cette date
            const existingSession = await sessionCollection.findOne(
              {
                  user_id: payload.user_id,
                  reference_day: day
              },
              {
                  sort: { last_tps_unix: -1 }
              }
            );


            let shouldUpdate = false;

            if (existingSession && existingSession.last_tps_unix) {
                // Calcul de l'écart en secondes entre le dernier tps existant et le nouveau
                const timeDifferenceSeconds = Math.abs(lastTpsFromPayload - existingSession.last_tps_unix);
                const fiveMinutesInSeconds = 1.2 * 60;
                console.log("Time difference in seconds:", timeDifferenceSeconds);
                console.log("Last TPS from payload:", lastTpsFromPayload);
                console.log("Existing session last TPS:", existingSession.last_tps_unix);

                shouldUpdate = timeDifferenceSeconds <= fiveMinutesInSeconds;
                console.log("Should update:", shouldUpdate);
            }

            if (!shouldUpdate) {
                const friendIds = await fetchFriendIds(payload.user_id.toString());
                if (friendIds.length > 0) {
                    const sqlInstance = SQLHandler.getInstance();

                    let expoTokens = await sqlInstance.query(`SELECT expo_token FROM user WHERE id IN ${SQLHandler.genQMS(friendIds.length)}`, friendIds);
                    if (expoTokens.length > 0) {
                        let user = await sqlInstance.query(`SELECT first_name, last_name FROM user WHERE id = ?`, [payload.user_id]);
                        expoTokens = expoTokens.map(token => token.expo_token).filter(token => token);
                        await notificationService.sendNotifications(expoTokens, {
                            title: `${user[0].first_name} est parti courir ! 🏃`,
                            body: `Balance lui une dose de motivation - ou une bonne vanne 🔊`,
                            data: {
                                type: "friendSession",
                                userId: payload.user_id,
                                firstName: user[0].first_name,
                            },
                        })
                    }
                }
            }

            if (shouldUpdate) {
                // UPDATE : Mise à jour de la session existante
                const setData: any = {
                    last_tps_unix: lastTpsFromPayload
                };

                // Ajouter seulement les champs présents dans le payload
                if (payload.session_type) setData.session_type = payload.session_type;
                if (payload.title) setData.title = payload.title;
                if (payload.distance !== undefined && payload.distance !== null) setData.distance = payload.distance;
                if (payload.calories !== undefined && payload.calories !== null) setData.calories = payload.calories;
                if (payload.allure !== undefined && payload.allure !== null) setData.allure = payload.allure;
                if (payload.time) setData.time = payload.time;
                if (payload.time_objective) setData.time_objective = payload.time_objective;
                if (payload.distance_objective) setData.distance_objective = payload.distance_objective;
                if (payload.run_id) setData.run_id = payload.run_id;

                const updateData = {
                    $set: setData,
                    $push: {
                        tps: { $each: payload.tps }
                    }
                };

                const result = await sessionCollection.updateOne(
                  { _id: existingSession._id },
                  updateData
                );

                reply.send({
                    message: "Session updated successfully",
                    data: {
                        sessionId: existingSession.id,
                        modified: result.modifiedCount > 0,
                        action: "update"
                    }
                });

            } else {
                // CREATE : Création d'une nouvelle session
                if (!payload.session_type || !payload.title || (payload.distance === undefined || payload.distance === null)
                  || (payload.calories === undefined || payload.calories === null) || (payload.allure === undefined || payload.allure === null)
                  || !payload.time) {
                    return reply.status(400).send({ message: "Invalid data: all fields are required for new session creation" });
                }

                const session = {
                    id: `${payload.user_id}-${now.toUnixInteger()}`,
                    reference_day: day,
                    session_type: payload.session_type,
                    user_id: +payload.user_id,
                    title: payload.title,
                    distance: payload.distance,
                    calories: payload.calories,
                    allure: payload.allure,
                    time: payload.time,
                    tps: payload.tps,
                    time_objective: payload.time_objective || null,
                    distance_objective: payload.distance_objective || null,
                    run_id: payload.run_id || null,
                    last_tps_unix: lastTpsFromPayload
                };

                const result = await sessionCollection.insertOne(session);

                reply.send({
                    message: "Session created successfully",
                    data: {
                        sessionId: session.id,
                        action: "create"
                    }
                });
            }

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

    server.get("/auth/friend/session", async (request, reply) => {
        const sqlInstance = SQLHandler.getInstance();

        try {
            await MongoHandler.init();
            const now = DateTime.now().minus({minute: 2}).toUnixInteger();
            const user_id = request.jwt.user_id;

            const user_ids = await fetchFriendIds(user_id);




            const sessionCollection = MongoHandler.getSessionCollection();

            console.log(now)
            const sessions = await sessionCollection.aggregate([
                {
                    $match: {
                        user_id: { $in: user_ids.map(id => parseInt(id)) },
                        // last_tps_unix not null and greater than now - 5 minutes
                        last_tps_unix: { $gt: now }

                    }
                },
                {
                    $sort: { reference_day: -1 }
                },
                {
                    $project: {
                        user_id: 1,
                        id: 1
                    }
                }
            ]).toArray();

            return reply.send(sessions);

        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: "Internal Server Error" });
        }
    })

    server.get("/last/user/session/:user_id", async (request, reply) => {
        const { user_id } = request.params;
        if (!user_id) {
            return reply.status(400).send({ message: "Invalid data" });
        }

        try {
            await MongoHandler.init();

            const sessionCollection = MongoHandler.getSessionCollection();

            const lastSession = await sessionCollection.findOne(
                { user_id: parseInt(user_id) },
                { sort: { last_tps_unix: -1 } }
            );

            if (!lastSession) {
                return reply.status(404).send({ message: "No session found for this user" });
            }

            return reply.send(lastSession);

        } catch (error) {
            console.error(error);
            reply.status(500).send({ message: "Internal Server Error" });
        }
    })
}
