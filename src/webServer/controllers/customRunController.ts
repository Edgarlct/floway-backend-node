import {FastifyInstance} from "fastify";
import {MongoHandler} from "../../handler/dbs/MongoHandler";
import * as path from "node:path";
import * as fs from "fs";
import {Readable} from "node:stream";
import Audio from "../../entity/Audio";
import {parseBuffer} from "music-metadata";

export function customRunControllers(server: FastifyInstance) {

  // this route use multipart formdata to upload a file want get a payload
  server.post('/api/create/custom/run', async (request, reply) => {
    // for each element in the body check if the element is a file
    const formData = await request.formData()
    const payload = JSON.parse(formData.get('payload'))
    const audioInstance = Audio.getInstance()
    const user_id = server.jwt.decode(request.headers.authorization.split("Bearer ")[1]).id;

    let audioHelper: { [key:string]: string }
    for (const [key, value] of formData) {
      if (value instanceof File) {
        const params = payload.audio[key];
        if (!params) {
          reply.status(400)
          reply.send({message: "Missing audio params"})
          return
        }
        // rejet if this is not an audio file
        if (!value.type.startsWith('audio/')) {
          reply.status(400)
          reply.send({message: "Invalid audio file"})
          return
        }

        console.log(payload)
        // get duration of the audio file
        let aBuffer = await value.arrayBuffer()
        const buffer = Buffer.from(aBuffer)
        const metadata = await parseBuffer(buffer, params.type);
        const duration = metadata.format.duration;
        console.log(duration)

        const id = await audioInstance.createAudio(params.title, params.type, duration, user_id, buffer)
        audioHelper[key] = id
      }
    }
    reply.send({message: "Run created successfully", data: audioHelper})
  })
}
