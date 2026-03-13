import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { getSubmissions } from "@/lib/dynamodb-submissions";
import { getAllLabs } from "@/lib/dynamodb";
import { getUserById } from "@/lib/dynamodb-users";

export async function GET(req: NextRequest) {
  try {
    const user = getAuthUser(req);
    if (!user || user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const submissions = await getSubmissions();
    const labs = await getAllLabs();
    const labMap = new Map(labs.map((l) => [String(l.id), l.labName]));

    const enriched = await Promise.all(
      submissions.map(async (s) => {
        const student =
          s.studentId != null ? await getUserById(String(s.studentId)) : null;
        return {
          ...s,
          labName: labMap.get(String(s.labId)) ?? "Unknown Lab",
          studentName: student?.name ?? s.studentName,
          studentEmail: student?.email ?? s.studentEmail,
          studentProgram: student?.program ?? s.studentProgram,
          studentYear: student?.year ?? s.studentYear,
          studentInterests: student?.interests ?? s.studentInterests,
        };
      })
    );

    enriched.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(enriched);
  } catch (error: unknown) {
    console.error("Professor submissions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
