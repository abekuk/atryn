import { NextResponse } from "next/server";
import { getAllLabs } from "@/lib/dynamodb";

export async function GET() {
  try {
    const labs = await getAllLabs();
    return NextResponse.json(labs);
  } catch (error: unknown) {
    console.error("Labs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
