import * as path from "node:path";
import * as fs from "node:fs";
import {ReadStream} from "node:fs";

export class AudioHandler {
  static audio_path: string = path.join(__dirname, "..", "upload", "audios");
  static async saveAudioFile(file: any): Promise<string> {
    if (!file || !file.filename) {
      throw new Error("No file provided or file has no filename");
    }

    const file_extension = path.extname(file.filename);
    const unique_filename = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${file_extension}`;

    const file_path = path.join(this.audio_path, unique_filename);

    // Ensure the directory exists
    await fs.promises.mkdir(this.audio_path, { recursive: true });

    if (fs.existsSync(file_path)) {
      throw new Error(`File already exists: ${file_path}`);
    }

    // Write the file to the specified path
    const buffer = await file.toBuffer();

    fs.writeFileSync(file_path, buffer);
    console.log(`File saved successfully: ${file_path}`);
    return unique_filename;
  }

  static getAudioFile(file_name: string): ReadStream {
    if (!file_name) {
      throw new Error("File name is required");
    }

    const file_path = path.join(this.audio_path, file_name);
    if (!fs.existsSync(file_path)) {
      throw new Error(`File not found: ${file_path}`);
    }

    return fs.createReadStream(file_path);
  }
}
