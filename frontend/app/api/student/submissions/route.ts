import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
<<<<<<< HEAD
=======
import { getStudentSubmissions } from "@/lib/dynamodb-submissions";
>>>>>>> e3998f95191c85358e6e96898e0604e9495b16b6
import { getAllLabs } from "@/lib/dynamodb";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user || user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

<<<<<<< HEAD
    const db = getDb();
    const submissions = db.prepare(`
      SELECT id, studentId, labId, videoUrl, status, createdAt
      FROM submissions
      WHERE studentId = ?
      ORDER BY createdAt DESC
    `).all(user.id) as { id: number; studentId: number; labId: string; videoUrl: string; status: string; createdAt: string }[];

    // Look up lab names from DynamoDB
    const labs = await getAllLabs();
    const labMap = new Map(labs.map((l) => [String(l.id), l.labName]));

    const enriched = submissions.map((s) => ({
      ...s,
      labName: labMap.get(String(s.labId)) || "Unknown Lab",
    }));
=======
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
>>>>>>> e3998f95191c85358e6e96898e0604e9495b16b6

    return NextResponse.json(enriched);
  } catch (error: unknown) {
    console.error("Student submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
