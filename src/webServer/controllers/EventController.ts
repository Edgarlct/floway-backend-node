import {AudioHandler} from "../../handler/AudioHandler";
import {DateTime} from "luxon";
import {IEvent} from "../../interface/IEvent";
import {MongoHandler} from "../../handler/dbs/MongoHandler";
import {ReadableStream} from "node:stream/web";
import {MqttClient} from "../../handler/MqttClient";


export function EventController(server) {
  server.post("/auth/event", async (request, reply) => {
    const { event_type, audio_file, session_id } = request.body;
    if (!session_id || !session_id.value) {
      return reply.status(400).send({ message: "Session ID is required" });
    }

    if (!event_type || !["audio","internal","text"].includes(event_type?.value.toLowerCase())) {
      return reply.status(400).send({ message: "Event type is required and must be one of: audio, internal, text" });
    }

    if (event_type.value === "audio" && !audio_file) {
      return reply.status(400).send({ message: "Audio file is required for audio events" });
    }

    let event: IEvent = {
      type: event_type.value.toLowerCase(),
      friend_id: request.jwt.user_id,
      timestamp: DateTime.now().toUnixInteger()
    }

    if (audio_file) {
      // Handle audio file upload
      const file_name = await AudioHandler.saveAudioFile(audio_file);
      event.audio_name = file_name;
    }

    if (event_type.value === "text") {
      const { text_content } = request.body;
      if (!text_content || !text_content.value) {
        return reply.status(400).send({ message: "Text content is required for text events" });
      }
      event.text_content = text_content.value;
    }


    // update event array to include the new event
    const coll = MongoHandler.getSessionCollection();

    const session = await coll.findOne({ id: session_id.value });
    if (!session) {
      return reply.status(404).send({ message: "Session not found" });
    }

    const user_session = session.user_id;

    await coll.updateOne(
      { id: session_id.value},
      { $push: { events: event } },
      { upsert: true }
    );

    const mqttInstance = MqttClient.getInstance();
    try {
      await mqttInstance.connect();
    } catch (error) {}

    mqttInstance.publish(`event/${user_session}/`, JSON.stringify(event));


    return reply.send(["Event received successfully"]);
  })

  server.get("/auth/audio/:audio_name", async (request, reply) => {
    const { audio_name } = request.params as { audio_name: string };
    if (!audio_name) {
      return reply.status(400).send({ message: "Audio name is required" });
    }

    try {
      const file = AudioHandler.getAudioFile(audio_name);
      reply.header('Content-Type', 'application/octet-stream');
      return reply.send(file);

    } catch (error) {
      console.error("Error sending audio file:", error);
      return reply.status(404).send({ message: "Audio file not found" });
    }
  })
}
