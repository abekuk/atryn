import { NextRequest, NextResponse } from "next/server";

const USE_S3 = process.env.USE_S3 !== "false";
const S3_BUCKET = process.env.S3_BUCKET || "atryn-videos";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("video") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No video file provided" }, { status: 400 });
    }

    const ext = file.name.split(".").pop() || "webm";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    if (USE_S3) {
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

      const client = new S3Client({
        region: process.env.AWS_REGION || "us-west-2",
        credentials: process.env.AWS_ACCESS_KEY_ID
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
              sessionToken: process.env.AWS_SESSION_TOKEN,
            }
          : undefined,
      });

      const key = `videos/${filename}`;

      await client.send(
        new PutObjectCommand({
          Bucket: S3_BUCKET,
          Key: key,
          Body: buffer,
          ContentType: file.type || "video/webm",
        })
      );

      const videoUrl = `https://${S3_BUCKET}.s3.${process.env.AWS_REGION || "us-west-2"}.amazonaws.com/${key}`;
      return NextResponse.json({ videoUrl });
    }

    // Local fallback
    const { writeFile, mkdir } = await import("fs/promises");
    const path = await import("path");
    const uploadsDir = path.join(process.cwd(), "public", "uploads", "videos");
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);

    return NextResponse.json({ videoUrl: `/uploads/videos/${filename}` });
  } catch (error: unknown) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
