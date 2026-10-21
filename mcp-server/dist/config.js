import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Load .env from current directory or parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
export const config = {
    port: parseInt(process.env.PORT || '3001', 10),
    mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB || 'wattaqa-festival-2k25',
    authToken: process.env.MCP_AUTH_TOKEN || '',
    readOnly: process.env.READ_ONLY !== 'false', // Default to true for safety
    maxDocumentLimit: parseInt(process.env.MAX_DOCUMENTS_LIMIT || '100', 10),
};
