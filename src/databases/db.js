const { MongoClient } = require('mongodb');

const url = process.env.DATABASE_CONNECTION;
const dbName = 'comp531';

let db;
let client;

const connectDB = async () => {
  const client = new MongoClient(url);
  await client.connect();
  console.log('Connected to MongoDB');
  db = client.db(dbName);
};

const getDB = () => {
  if (!db) {
    throw Error('No database connected!');
  }
  return db;
};

const closeConnection = async () => {
  if (client) {
    await client.close();
  }
};

module.exports = { connectDB, closeConnection, getDB };
