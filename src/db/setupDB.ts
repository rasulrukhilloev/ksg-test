import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT),
});

client.connect();

const createTable = async () => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      balance DECIMAL(10, 2) NOT NULL
    )
  `);

  console.log('Users table created!');
};

const insertUser = async () => {
  await client.query(`
    INSERT INTO users (id, balance) VALUES (1, 500.00)
    ON CONFLICT (id) DO NOTHING
  `);

  console.log('User with balance of 500 CREATED');
};

const setupDb = async () => {
  try {
    await createTable();
    await insertUser();
  } catch (error) {
    console.error('Error while setting up DB', error);
  } finally {
    client.end();
  }
};

setupDb();