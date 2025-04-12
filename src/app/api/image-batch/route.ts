import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const tempDir = path.join(process.cwd(), "tmp");

// Define the image processing options interface
interface ImageProcessingOption {
  width?: string;
  height?: string;
  quality?: string;
  format?: string;
}

// Valid format options for Sharp
type SharpFormat = 'jpeg' | 'jpg' | 'png' | 'webp' | 'avif' | 'tiff' | 'gif' | 'heif';

// Ensure tmp folder exists
async function ensureTempDir() {
  try {
    await fs.mkdir(tempDir, { recursive: true });
  } catch (err) {
    console.error("Failed to create temp dir:", err);
  }
}

export async function POST(req: NextRequest) {
  await ensureTempDir();

  const formData = await req.formData();

  const files = formData.getAll("images") as File[];
  const optionsRaw = formData.get("options");

  console.log(optionsRaw);
  if (!files || files.length === 0 || !optionsRaw) {
    return NextResponse.json(
      { error: "Missing files or options" },
      { status: 400 }
    );
  }

  let options: ImageProcessingOption[];
  try {
    options = JSON.parse(optionsRaw.toString());
  } catch (e) {
    console.log(e)
    return NextResponse.json(
      { error: "Invalid JSON in options" },
      { status: 400 }
    );
  }

  const results = await Promise.all(
    files.map(async (file, index) => {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { width, height, quality, format } = options[index] || {};
      const outputFormat = (format || "jpeg") as SharpFormat;

      const filename = `${Date.now()}_${index}.${outputFormat}`;
      const filepath = path.join(tempDir, filename);

      let sharpInstance = sharp(buffer);
      
      if (width || height) {
        sharpInstance = sharpInstance.resize(
          width ? parseInt(width) : undefined,
          height ? parseInt(height) : undefined
        );
      }
      
      const processedImage = await sharpInstance
        .toFormat(outputFormat, { quality: quality ? parseInt(quality) : 80 })
        .toBuffer();

      await fs.writeFile(filepath, processedImage);

      return {
        originalName: file.name,
        filename,
        tempPath: filepath,
      };
    })
  );

 return new NextResponse(JSON.stringify({ images: results }), {
   headers: {
     "Access-Control-Allow-Origin": "*", 
     "Content-Type": "application/json",
   },
 });
}