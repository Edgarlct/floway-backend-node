import User from "./User";


export class EntityInitializer {
  /**
   * This method is called in the main.ts file to initialize the entities
   */
  static init() {
    User.getInstance();
  }
}
