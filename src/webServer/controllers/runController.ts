import {FastifyInstance} from "fastify";
import {MongoHandler} from "../../handler/dbs/MongoHandler";

export function runControllers(server: FastifyInstance) {

  server.post<{Body: {date:string, start_time:string, end_time:string, position: any[][], run_id?: number}}>('/api/save/position', async (request, reply) => {
    const { date, start_time, end_time, position, run_id } = request.body;
    const user_id = server.jwt.decode(request.headers.authorization.split("Bearer ")[1]).id;
    const collection = MongoHandler.getUserPositionCollection();

    // check if the user has already a position for this day
    const userPosition = await collection.aggregate([
      {
        $match: {
          user_id: user_id,
          reference_day: new Date(date)
        }
      },
      {
        $project: {
          _id: 1
        }
      }
    ]).toArray();

    // if the user have run for today we push the new run
    if(userPosition.length > 0) {
      await collection.updateOne(
        { _id: userPosition[0]._id },
        {
          $push: {
            positions: {
              start_time: start_time,
              end_time: end_time,
              position: position,
              run_id: run_id || null
            }
          }
        }
      );
    } else {
      await collection.insertOne({
        user_id: user_id,
        reference_day: new Date(date),
        positions: [{
          start_time: start_time,
          end_time: end_time,
          position: position,
          run_id: run_id || null
        }]
      });
    }
  })

  server.get<{Querystring: {start_date?: string, end_date?:string}}>('/api/get/position', async (request, reply) => {
    const {start_date, end_date} = request.query;
    const user_id = server.jwt.decode(request.headers.authorization.split("Bearer ")[1]).id;
    const collection = MongoHandler.getUserPositionCollection();
    let query : { user_id : number, reference_day? : any } = {
      user_id: user_id
    };

    if (start_date && end_date) {
      query.reference_day = {
        $gte: new Date(start_date),
        $lte: new Date(end_date)
      }
    }

    const userPosition = await collection.aggregate([
      {
        $match: query
      },
      {
        $project: {
          _id: 0,
          user_id: 0
        }
      }
    ]).toArray();

    reply.send({userPosition});
  })

  server.get<{Querystring: {run_id: number}}>('/api/get/position/run', async (request, reply) => {
    const {run_id} = request.query;
    const user_id = server.jwt.decode(request.headers.authorization.split("Bearer ")[1]).id;
    const collection = MongoHandler.getUserPositionCollection();

    const userPosition = await collection.aggregate([
      {
        $match: {
          user_id: user_id,
          "positions.run_id": run_id
        }
      },
      {
        $project: {
          _id: 0,
          user_id: 0
        }
      }
    ]).toArray();

    reply.send({userPosition});
  })

}
