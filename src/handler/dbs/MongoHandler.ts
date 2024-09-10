import {Collection, Db, MongoClient} from "mongodb";

export class MongoHandler {

    private static mongoClient:MongoClient|null = null;
    private static userPositionCollection:Collection|null = null;


    private constructor() {
        //We just prevent external instantiation by setting the constructor to private
    }

    public static async init() {
        await this.getMongoClient();
        await this.prepareCollections();
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

    private static async prepareCollections() {
        const db = this.mongoClient.db(process.env.MONGO_DB_NAME);
        const collections = await db.collections();
        if(!collections?.find((collection) => collection.collectionName === "user-position")) {
            console.log(`No user-position collection found, creating it.`);
            await db?.createCollection("user-position");
            await this.createIndex(db);
        }

        this.userPositionCollection  = db.collection("user-position");
    }

    private static async createIndex(db:Db) {
        // create index for id, company_tag, last_tps_unix, reference_day,device_id
        await db.collection("user-position").createIndex({id: 1});
        await db.collection("user-position").createIndex({last_tps_unix: 1});
        await db.collection("user-position").createIndex({reference_day: 1});
    }

    public static getUserPositionCollection() {
        return this.userPositionCollection;
    }

}
