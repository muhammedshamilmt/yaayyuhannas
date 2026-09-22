import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

export async function POST(req: Request) {
  try {
    const { password, data } = await req.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "Invalid admin password" }, { status: 401 });
    }

    if (!data || typeof data !== 'object') {
      return NextResponse.json({ success: false, error: "Invalid data format" }, { status: 400 });
    }

    const db = await getDatabase();
    const results = [];

    for (const [collectionName, docs] of Object.entries(data)) {
      if (!Array.isArray(docs)) continue;

      const col = db.collection(collectionName);
      let inserted = 0;
      let skipped = 0;

      // Handle duplicate keys gracefully
      for (const doc of docs) {
        try {
          if (doc._id && typeof doc._id === 'object' && doc._id.$oid) {
            // Restore ObjectId if it was serialized as { $oid: "..." }
            // Using any to bypass type strictness for this simple restore
            const { ObjectId } = require('mongodb');
            doc._id = new ObjectId(doc._id.$oid);
          }
          await col.insertOne(doc);
          inserted++;
        } catch (err: any) {
          if (err.code === 11000) {
            skipped++;
          } else {
            console.error(`Error inserting into ${collectionName}:`, err);
            throw err;
          }
        }
      }

      results.push({
        collection: collectionName,
        inserted,
        skipped
      });
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error("Restore error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
