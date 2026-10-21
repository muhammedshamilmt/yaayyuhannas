import { MongoClient, Db } from 'mongodb';
import { config } from './config.js';

let client: MongoClient | null = null;
let dbInstance: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!client) {
    client = new MongoClient(config.mongoUri, {
      maxPoolSize: 20,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 10000,
    });
  }

  try {
    await client.connect();
    dbInstance = client.db(config.dbName);
    console.log(`[Database] Connected successfully to MongoDB: "${config.dbName}"`);
    return dbInstance;
  } catch (error) {
    console.error('[Database] Connection failed:', error);
    throw error;
  }
}

export async function getDatabase(): Promise<Db> {
  if (!dbInstance) {
    return await connectToDatabase();
  }
  return dbInstance;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    dbInstance = null;
    console.log('[Database] Connection closed');
  }
}

export async function testConnection(): Promise<{ ok: boolean; message: string; collections?: string[] }> {
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    const collections = await db.listCollections().toArray();
    return {
      ok: true,
      message: `Successfully connected to database "${config.dbName}"`,
      collections: collections.map(c => c.name),
    };
  } catch (error: any) {
    return {
      ok: false,
      message: `Failed to ping database: ${error.message}`,
    };
  }
}
