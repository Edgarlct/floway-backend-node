import {Collection, Db, MongoClient} from "mongodb";

export class MongoHandler {

    private static mongoClient:MongoClient|null = null;
    private static sessionCollection:Collection|null = null;


    private constructor() {
        //We just prevent external instantiation by setting the constructor to private
    }

    public static async init() {
        await this.getMongoClient();
        await this.prepareSessionCollections();
    }

    public static async getMongoClient() {
        if(!this.mongoClient) {
            this.mongoClient = await MongoClient.connect(process.env.MONGO_URI);
            //Watch for signals to close the connection
            process.on('SIGINT', async () => {
                console.log("Closing mongo connection");
                await this.mongoClient.close();
                process.exit(0);
            });

            process.on('SIGTERM', async () => {
                console.log("Closing mongo connection");
                await this.mongoClient.close();
                process.exit(0);
            });
            return this.mongoClient;
        }

        return this.mongoClient;
    }

    private static async prepareSessionCollections() {
        const db = this.mongoClient.db(process.env.MONGO_DB_NAME);
        const collections = await db.collections();
        if(!collections?.find((collection) => collection.collectionName === "sessions")) {
            console.log(`No session collection found, creating it.`);
            await db?.createCollection("sessions");
            await this.createSessionIndex(db);
        }

        this.sessionCollection  = db.collection("sessions");
    }

    private static async createSessionIndex(db:Db) {
        // create index for id, company_tag, last_tps_unix, reference_day,device_id
        await db.collection("sessions").createIndex({id: 1});
        await db.collection("sessions").createIndex({user_id: 1});
        await db.collection("sessions").createIndex({reference_day: 1});
    }

    public static getSessionCollection() {
        return this.sessionCollection;
    }

}
