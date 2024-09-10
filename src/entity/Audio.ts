import SQLHandler from '../handler/dbs/SQLHandler';
import bcrypt from 'bcryptjs';
import {DateTools} from "../tools/DateTools";
import * as path from "node:path";
import * as fs from "fs";

class Audio {
  private static instance: Audio;

  private constructor() {
    this.initializeDatabase()
  }

  static getInstance(): Audio {
    if (!this.instance) {
      this.instance = new Audio();
    }
    return this.instance;
  }

  private async initializeDatabase() {
    const query = `
      CREATE TABLE IF NOT EXISTS audio (
        id INT AUTO_INCREMENT PRIMARY KEY UNIQUE,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(255),
        path VARCHAR(255) not null,
        duration FLOAT,
        created_at DATETIME NOT NULL,
        creator_id INT,
        FOREIGN KEY (creator_id) REFERENCES user(id)
      );
    `;
    await SQLHandler.getInstance().query(query, []);
  }

  private saveFile(file: Buffer) {
    // save file to disk and return path
    const folderPath = path.join(__dirname, '../audio');
    // generate unique file name
    const fileName = `${Date.now()}.mp3`;
    // save file
    fs.writeFileSync(path.join(folderPath, fileName), file);
    return path.join(folderPath, fileName);
  }

  // Utility function to convert stream to buffer
  streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }

  async createAudio(title: string, type: string, duration: number, creator_id: number, file: Buffer) {
    const path = this.saveFile(file);
    const created_at = DateTools.getNow(true);

    const inserted = await SQLHandler.getInstance().query(
        'INSERT INTO audio (title, type, path, duration, created_at, creator_id) VALUES (?, ?, ?, ?, ?, ?)',
        [title, type, path, duration, created_at, creator_id],
    );
    return inserted.insertId;
  }
}

export default Audio;
