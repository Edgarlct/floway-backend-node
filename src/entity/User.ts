import SQLHandler from '../handler/dbs/SQLHandler';
import bcrypt from 'bcryptjs';
import {DateTools} from "../tools/DateTools";

class User {
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
      CREATE TABLE IF NOT EXISTS user (
        id INT AUTO_INCREMENT PRIMARY KEY UNIQUE,
        first_name VARCHAR(255) NOT NULL,
        last_name VARCHAR(255) NOT NULL,
        roles VARCHAR(255) DEFAULT '[\"ROLE_USER\"]' NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME,
        deleted_at DATETIME
      );
    `;
    await SQLHandler.getInstance().query(query, []);
  }

  private async initializeDefaultUser() {
    const hasUsers = await this.hasUsers();
    if (!hasUsers) {
      const first_name = 'Admin';
      const last_name = 'Floway';
      const email = 'admin@example.com';
      const password = await bcrypt.hash('adminpassword', 10);
      const created_at = DateTools.getNow(true);

      await SQLHandler.getInstance().query(
          'INSERT INTO user (first_name, last_name, roles, email, password, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [first_name, last_name, "[\"ROLE_ADMIN\"]", email, password, created_at],
      );
      console.log('Default admin user created');
    }
  }

  private async hasUsers(): Promise<boolean> {
    const rows = await SQLHandler.getInstance().query('SELECT COUNT(*) as count FROM user', []);
    return rows[0].count > 0;
  }

  async getUserById(id: number) {
    const rows = await SQLHandler.getInstance().query('SELECT * FROM user WHERE id = ?', [id]);
    if (rows.length > 0) {
      const user = rows[0];
      return user;
    }
    return null;
  }

  async createUser(first_name: string, last_name: string, email: string, password: string) {
    // check if email is valid
    if (email.match(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/g) === null) {
      throw new Error('User error: Invalid email');
    }

    // check strong password (8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character)
    if (password.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-\.]).{8,}$/g) === null) {
      throw new Error('User error: Password is not strong enough, it must contain at least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character');
    }

    // check if email already exists
    const rows = await SQLHandler.getInstance().query('SELECT * FROM user WHERE email = ?', [email]);
    if (rows.length > 0) {
      throw new Error('User error: Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const created_at = DateTools.getNow(true);
    const result = await SQLHandler.getInstance().query(
        'INSERT INTO user (first_name, last_name, email, password, created_at) VALUES (?, ?, ?, ?, ?)',
        [first_name, last_name, email, hashedPassword, created_at],
    );
    return result.insertId;
  }

  async login(email: string, password: string) {
    const rows = await SQLHandler.getInstance().query('SELECT * FROM user WHERE email = ?', [email]);
    if (rows.length === 0) {
      throw new Error('User error: Email not found');
    }

    const user = rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new Error('User error: Password does not match');
    }

    return {
      id: user.id,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      roles: JSON.parse(user.roles),
    };
  }
}

export default User;
