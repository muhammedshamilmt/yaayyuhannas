import { z } from 'zod';
import { getDatabase } from '../db.js';
export function registerMetadataTools(server) {
    // Tool: list_collections
    server.tool('list_collections', 'Lists all collections in the Wattaqa Arts Fest database with document counts and size estimations.', {}, async () => {
        try {
            const db = await getDatabase();
            const collectionsList = await db.listCollections().toArray();
            const collectionStats = await Promise.all(collectionsList.map(async (col) => {
                const count = await db.collection(col.name).countDocuments().catch(() => 0);
                return {
                    name: col.name,
                    documentCount: count,
                };
            }));
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            database: db.databaseName,
                            totalCollections: collectionStats.length,
                            collections: collectionStats,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Failed to list collections: ${error.message}` }],
            };
        }
    });
    // Tool: describe_collection_schema
    server.tool('describe_collection_schema', 'Infers and describes the data schema of a specific collection by sampling documents.', {
        collectionName: z.string().describe('The name of the collection to inspect (e.g. "candidates", "programmes", "teams", "results", "programme_participants")'),
        sampleSize: z.number().optional().default(10).describe('Number of documents to sample (default 10)'),
    }, async ({ collectionName, sampleSize }) => {
        try {
            const db = await getDatabase();
            const samples = await db
                .collection(collectionName)
                .find({})
                .limit(sampleSize || 10)
                .toArray();
            if (samples.length === 0) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Collection "${collectionName}" is empty. No documents found.`,
                        },
                    ],
                };
            }
            // Infer schema fields & types
            const schemaMap = {};
            for (const doc of samples) {
                for (const [key, val] of Object.entries(doc)) {
                    if (!schemaMap[key]) {
                        schemaMap[key] = new Set();
                    }
                    if (val === null)
                        schemaMap[key].add('null');
                    else if (Array.isArray(val))
                        schemaMap[key].add(`Array<${val.length > 0 ? typeof val[0] : 'any'}>`);
                    else if (val instanceof Date)
                        schemaMap[key].add('Date');
                    else
                        schemaMap[key].add(typeof val);
                }
            }
            const fieldSummary = {};
            for (const [key, types] of Object.entries(schemaMap)) {
                fieldSummary[key] = Array.from(types).join(' | ');
            }
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            collection: collectionName,
                            sampleCount: samples.length,
                            inferredFields: fieldSummary,
                            sampleDocument: samples[0],
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Failed to describe schema: ${error.message}` }],
            };
        }
    });
}
