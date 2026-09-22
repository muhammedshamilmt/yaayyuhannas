import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/mongodb";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const collection = url.searchParams.get("collection");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "20");

    if (!collection) {
      return NextResponse.json({ success: false, error: "Collection is required" }, { status: 400 });
    }

    const db = await getDatabase();
    const col = db.collection(collection);

    const skip = (page - 1) * limit;
    const docs = await col.find({}).skip(skip).limit(limit).toArray();
    const total = await col.countDocuments();

    return NextResponse.json({
      success: true,
      docs,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error: any) {
    console.error("Preview error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
