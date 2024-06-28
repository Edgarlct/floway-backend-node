import SQLHandler from '../handler/dbs/SQLHandler';
import bcrypt from 'bcrypt';

class User {
  private id: number;
  private name: string;
  private email: string;
  private password: string;
  private created_at: Date;
  private updated_at: Date;
  private deleted_at: Date;
  private subscription: boolean;
  private static instance: User;

  private constructor() {
    this.initializeDatabase().then(() => {
      this.initializeDefaultUser();
    });
  }

  static getInstance(): User {
    if (!this.instance) {
      this.instance = new User();
    }
    return this.instance;
  }

  private async initializeDatabase() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        deleted_at DATETIME,
        subscription BOOLEAN NOT NULL DEFAULT 0
      );
    `;
    await SQLHandler.getInstance().query(query, []);
  }

  private async initializeDefaultUser() {
    const hasUsers = await this.hasUsers();
    if (!hasUsers) {
      const name = 'Admin';
      const email = 'admin@example.com';
      const password = await bcrypt.hash('adminpassword', 10);
      const created_at = new Date();
      const updated_at = new Date();

      await SQLHandler.getInstance().query(
          'INSERT INTO users (name, email, password, created_at, updated_at, subscription) VALUES (?, ?, ?, ?, ?, ?)',
          [name, email, password, created_at, updated_at, false],
      );
      console.log('Default admin user created');
    }
  }

  private async hasUsers(): Promise<boolean> {
    const rows = await SQLHandler.getInstance().query('SELECT COUNT(*) as count FROM users', []);
    return rows[0].count > 0;
  }

  async getUserById(id: number): Promise<User | null> {
    const rows = await SQLHandler.getInstance().query('SELECT * FROM users WHERE id = ?', [id]);
    if (rows.length > 0) {
      const user = rows[0];
      return new User();
    }
    return null;
  }

  async createUser(name: string, email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const created_at = new Date();
    const updated_at = new Date();
    const result = await SQLHandler.getInstance().query(
        'INSERT INTO users (name, email, password, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        [name, email, hashedPassword, created_at, updated_at],
    );
    const userId = result.insertId;
    return new User();
  }
}

export default User;
