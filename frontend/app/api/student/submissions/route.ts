import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getStudentSubmissions } from "@/lib/dynamodb-submissions";
import { getAllLabs } from "@/lib/dynamodb";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await getStudentSubmissions(user.id);
    const allLabs = await getAllLabs();

    // Attach labName to each submission so the frontend can display it
    const enriched = submissions.map((s) => {
      const lab = allLabs.find(l => l.id === s.labId);
      return {
        ...s,
        labName: lab ? lab.labName : "Unknown Lab"
      };
    });

    // Sort by newest first
    enriched.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json(enriched);
  } catch (error: unknown) {
    console.error("Student submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
