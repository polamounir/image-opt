// src/app/api/image-preview/route.ts
import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";

export async function GET(req: NextRequest) {
  const path = req.nextUrl.searchParams.get("path");

  if (!path)
    return NextResponse.json({ error: "Missing path" }, { status: 400 });

  try {
    const file = await fs.readFile(path);
    return new NextResponse(file, {
      status: 200,
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.log(e)
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
