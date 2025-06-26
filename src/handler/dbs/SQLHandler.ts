import {createPool, Pool} from 'mysql2/promise';
import {parse} from "url";

class SQLHandler {
  private pool: Pool;
  private static instance: SQLHandler|null = null;

  //I set this constructor to private to prevent any external instantiation of the class.
  private constructor() {
    if (!SQLHandler.instance) {
      const { hostname: host, auth, pathname, port } = parse(process.env.MYSQL_URI);

      const [user, password] = auth.split(':');
      this.pool = createPool({
        host:     host,
        user:     user,
        port:     port ? parseInt(port) : 3306, // Default MySQL port is 3306
        password: password,
        database: process.env.MYSQL_DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        timezone: 'Z',
        dateStrings: true
      });

      SQLHandler.instance = this;
    }

    return SQLHandler.instance;
  }

  //This method is set to static for two reasons :
  // 1 - it prevents any override of this method in the child classes
  // 2 - it allows us to call this method without instantiating the class
  public static getInstance(): SQLHandler {
    if(!this.instance) {
      this.instance = new SQLHandler();
    }
    return this.instance;
  }

  async query(sql:string, values = []) {
    let connection;

    try {
      connection = await this.pool.getConnection();
      const [rows] = await connection.execute(sql, values);
      return rows;
    } catch (error) {
      throw new Error(`Error executing query: ${error.message}`);
    } finally {
      // Release the connection back to the prodPool when done
      connection && connection.release();
    }
  }

  public static genQMS(count:number): string {
    let qms = Array(count).fill("?").join(",");
    return `(${qms})`;
  }

  public static genNQMS(count:number, n:number): string {
    let qms = Array(count).fill("?").join(",");
    return Array(n).fill(`(${qms})`).join(",");
  }
}

export default SQLHandler;
