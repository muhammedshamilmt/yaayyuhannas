import { z } from 'zod';
import { getDatabase } from '../db.js';
import { config } from '../config.js';
export function registerQueryTools(server) {
    // Tool: query_documents
    server.tool('query_documents', 'Finds documents in a MongoDB collection using standard query filters, sorting, and pagination.', {
        collectionName: z.string().describe('Target collection (e.g., "candidates", "teams", "programmes", "results")'),
        filterJson: z.string().optional().default('{}').describe('MongoDB JSON filter object (e.g., \'{"section": "senior"}\' or \'{"team": "SMD"}\')'),
        sortJson: z.string().optional().default('{}').describe('MongoDB JSON sort object (e.g., \'{"points": -1}\')'),
        projectionJson: z.string().optional().describe('MongoDB JSON projection object (e.g., \'{"name": 1, "chestNumber": 1}\')'),
        limit: z.number().optional().default(20).describe('Maximum documents to return (clamped to max configured limit)'),
        skip: z.number().optional().default(0).describe('Number of documents to skip for pagination'),
    }, async ({ collectionName, filterJson, sortJson, projectionJson, limit, skip }) => {
        try {
            let filter = {};
            let sort = {};
            let projection = undefined;
            if (filterJson && filterJson.trim() !== '') {
                try {
                    filter = JSON.parse(filterJson);
                }
                catch (e) {
                    return {
                        isError: true,
                        content: [{ type: 'text', text: `Invalid filterJson syntax: ${e.message}` }],
                    };
                }
            }
            if (sortJson && sortJson.trim() !== '') {
                try {
                    sort = JSON.parse(sortJson);
                }
                catch (e) {
                    return {
                        isError: true,
                        content: [{ type: 'text', text: `Invalid sortJson syntax: ${e.message}` }],
                    };
                }
            }
            if (projectionJson && projectionJson.trim() !== '') {
                try {
                    projection = JSON.parse(projectionJson);
                }
                catch (e) {
                    return {
                        isError: true,
                        content: [{ type: 'text', text: `Invalid projectionJson syntax: ${e.message}` }],
                    };
                }
            }
            // Clamp limit
            const safeLimit = Math.min(Math.max(1, limit || 20), config.maxDocumentLimit);
            const safeSkip = Math.max(0, skip || 0);
            const db = await getDatabase();
            const cursor = db.collection(collectionName).find(filter).sort(sort).skip(safeSkip).limit(safeLimit);
            if (projection) {
                cursor.project(projection);
            }
            const documents = await cursor.toArray();
            const totalMatches = await db.collection(collectionName).countDocuments(filter);
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            collection: collectionName,
                            returnedCount: documents.length,
                            totalMatchingCount: totalMatches,
                            skip: safeSkip,
                            limit: safeLimit,
                            documents,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Query execution error: ${error.message}` }],
            };
        }
    });
    // Tool: run_aggregation
    server.tool('run_aggregation', 'Runs an aggregation pipeline on a MongoDB collection for statistics, groupings, sums, and data transformation.', {
        collectionName: z.string().describe('Target collection (e.g., "candidates", "results", "programme_participants")'),
        pipelineJson: z.string().describe('JSON array of MongoDB aggregation stages (e.g., \'[{"$group": {"_id": "$team", "totalPoints": {"$sum": "$points"}}}]\')'),
    }, async ({ collectionName, pipelineJson }) => {
        try {
            let pipeline = [];
            try {
                pipeline = JSON.parse(pipelineJson);
            }
            catch (e) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: `Invalid pipelineJson syntax: ${e.message}` }],
                };
            }
            if (!Array.isArray(pipeline)) {
                return {
                    isError: true,
                    content: [{ type: 'text', text: 'pipelineJson must be a JSON array of aggregation stages.' }],
                };
            }
            // Read-only safety guard: block $out and $merge stages
            if (config.readOnly) {
                for (const stage of pipeline) {
                    if (stage.$out || stage.$merge) {
                        return {
                            isError: true,
                            content: [{ type: 'text', text: 'Permission denied: $out and $merge stages are forbidden in read-only mode.' }],
                        };
                    }
                }
            }
            const db = await getDatabase();
            const results = await db.collection(collectionName).aggregate(pipeline).toArray();
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            collection: collectionName,
                            resultCount: results.length,
                            results,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                isError: true,
                content: [{ type: 'text', text: `Aggregation error: ${error.message}` }],
            };
        }
    });
}
