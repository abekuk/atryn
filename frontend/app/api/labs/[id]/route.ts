import { NextRequest, NextResponse } from "next/server";
import { getLabById } from "@/lib/dynamodb";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const lab = await getLabById(Number(id));

    if (!lab) {
      return NextResponse.json({ error: "Lab not found" }, { status: 404 });
    }

    return NextResponse.json(lab);
  } catch (error: unknown) {
    console.error("Lab detail error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
