import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
let cached = global._mongoClient;

export async function getDb() {
  if (!cached) {
    cached = global._mongoClient = await MongoClient.connect(uri);
  }
  return cached.db('investquest');
}
