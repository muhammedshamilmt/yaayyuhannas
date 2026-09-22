import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin";

export async function GET() {
  try {
    const db = await getDatabase();
    
    // Get all collections
    const collectionsList = await db.listCollections().toArray();
    
    const collections = await Promise.all(
      collectionsList.map(async (c) => {
        let count = 0;
        let estimatedKB = 0;
        try {
          const stats = await db.command({ collStats: c.name });
          count = stats.count || 0;
          estimatedKB = Math.round((stats.size || 0) / 1024);
        } catch (e) {
          try {
            count = await db.collection(c.name).estimatedDocumentCount();
          } catch(err) {
             count = await db.collection(c.name).countDocuments();
          }
        }

        return {
          name: c.name,
          count,
          estimatedKB,
        };
      })
    );

    return NextResponse.json({ success: true, collections });
  } catch (error: any) {
    console.error("Failed to list collections:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { action, collection, password } = await req.json();

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json({ success: false, error: "Invalid admin password" }, { status: 401 });
    }

    const db = await getDatabase();

    if (action === 'backup-all' || action === 'backup') {
      let dataToBackup: Record<string, any[]> = {};
      
      if (action === 'backup' && collection) {
        dataToBackup[collection] = await db.collection(collection).find({}).toArray();
      } else {
        const collectionsList = await db.listCollections().toArray();
        for (const c of collectionsList) {
          dataToBackup[c.name] = await db.collection(c.name).find({}).toArray();
        }
      }
      
      const jsonStr = JSON.stringify(dataToBackup);
      const buffer = Buffer.from(jsonStr, 'utf-8');
      
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${action === 'backup' ? collection : 'full'}-backup-${Date.now()}.json"`
        }
      });
    }

    if (action === 'clear' && collection) {
      const result = await db.collection(collection).deleteMany({});
      return NextResponse.json({ success: true, deleted: result.deletedCount });
    }

    if (action === 'clear-all') {
      const collectionsList = await db.listCollections().toArray();
      let totalDeleted = 0;
      for (const c of collectionsList) {
        const result = await db.collection(c.name).deleteMany({});
        totalDeleted += result.deletedCount || 0;
      }
      return NextResponse.json({ success: true, deleted: totalDeleted });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Database action error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
