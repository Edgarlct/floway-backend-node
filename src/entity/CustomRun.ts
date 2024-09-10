import SQLHandler from '../handler/dbs/SQLHandler';
import {DateTools} from "../tools/DateTools";

class CustomRun {
  private static instance: CustomRun;

  private constructor() {
    this.initializeDatabase()
  }

  static getInstance(): CustomRun {
    if (!this.instance) {
      this.instance = new CustomRun();
    }
    return this.instance;
  }

  private async initializeDatabase() {
    const query = `
      CREATE TABLE IF NOT EXISTS custom_run (
        id INT AUTO_INCREMENT PRIMARY KEY UNIQUE,
        title VARCHAR(255) NOT NULL,
        distance FLOAT,
        duration FLOAT,
        created_at DATETIME NOT NULL,
        updated_at DATETIME,
        owner_id INT,
        run_id INT,
        FOREIGN KEY (owner_id) REFERENCES user(id),
        FOREIGN KEY (run_id) REFERENCES run(id)
      );
    `;

    const query_alter_run_audio = `
      ALTER TABLE run_audio
      ADD COLUMN custom_run_id INT,
      ADD FOREIGN KEY (custom_run_id) REFERENCES custom_run(id);
    `;

    await SQLHandler.getInstance().query(query, []);

    // check if column already exists
    const columns = await SQLHandler.getInstance().query('SHOW COLUMNS FROM run_audio LIKE "custom_run_id";', []);
    if (columns.length === 0) await SQLHandler.getInstance().query(query_alter_run_audio, []);
  }

  async createCustomRun(title: string, distance: number, duration: number, owner_id: number, run_id?: number, audios?: {audio_id: number, start_time?: string, start_distance?: number}[]) {
    const created_at = DateTools.getNow(true);

    const inserted = await SQLHandler.getInstance().query(
        'INSERT INTO custom_run (title, distance, duration, created_at, owner_id, run_id) VALUES (?, ?, ?, ?, ?, ?)',
        [title, distance, duration, created_at, owner_id, run_id || null],
    );
    const custom_run_id = inserted.insertId;

    if(audios) {
      const params = [];
      for(const audio of audios) {
        params.push(custom_run_id, audio.audio_id, audio.start_time, audio.start_distance);
      }
      await SQLHandler.getInstance().query(
          `INSERT INTO run_audio (custom_run_id, audio_id, start_time, start_distance) VALUES ${SQLHandler.genNQMS(4, audios.length)}`,
          params,
      );
    }

    return custom_run_id;
  }
}

export default CustomRun;
