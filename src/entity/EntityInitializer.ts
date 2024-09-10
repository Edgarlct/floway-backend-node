import User from "./User";
import Audio from "./Audio";
import Run from "./Run";
import CustomRun from "./CustomRun";

export class EntityInitializer {
  /**
   * This method is called in the main.ts file to initialize the entities
   */
  static init() {
    User.getInstance();
    Audio.getInstance();
    Run.getInstance();
    CustomRun.getInstance();
  }
}
