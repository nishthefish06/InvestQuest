import { MongoClient } from 'mongodb';

let cached = global._mongoClient;

export async function getDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined');
  
  if (!cached) {
    cached = global._mongoClient = await MongoClient.connect(uri);
  }
  return cached.db('investquest');
}
