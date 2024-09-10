import SQLHandler from '../handler/dbs/SQLHandler';

class Run {
  private static instance: Run;

  private constructor() {
    this.initializeDatabase()
  }

  static getInstance(): Run {
    if (!this.instance) {
      this.instance = new Run();
    }
    return this.instance;
  }

  private async initializeDatabase() {
    const query = `
      CREATE TABLE IF NOT EXISTS run (
        id INT AUTO_INCREMENT PRIMARY KEY UNIQUE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(255),
        distance FLOAT,
        duration FLOAT,
        created_at DATETIME NOT NULL,
        creator_id INT,
        FOREIGN KEY (creator_id) REFERENCES user(id)
      );
    `;
    const run_audio_query = `
      CREATE TABLE IF NOT EXISTS run_audio (
        id INT AUTO_INCREMENT PRIMARY KEY UNIQUE,
        run_id INT,
        audio_id INT,
        start_time DATETIME,
        start_distance FLOAT,
        FOREIGN KEY (run_id) REFERENCES run(id),
        FOREIGN KEY (audio_id) REFERENCES audio(id)
      );
    `;
    await SQLHandler.getInstance().query(query, []);
    await SQLHandler.getInstance().query(run_audio_query, []);
  }

}

export default Run;
