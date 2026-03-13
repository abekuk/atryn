import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "@/lib/dynamodb-users";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const valid = bcrypt.compareSync(password, user.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({
      id: user.userId,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    const userResponse =
      user.role === "student"
        ? {
            id: user.userId,
            role: "student" as const,
            name: user.name,
            email: user.email,
            program: user.program ?? "",
            year: user.year ?? 0,
            interests: user.interests ?? "",
          }
        : {
            id: user.userId,
            role: "professor" as const,
            name: user.name,
            email: user.email,
            department: user.department ?? "",
            labName: user.labName ?? "",
          };

    return NextResponse.json({ token, user: userResponse });
  } catch (error: unknown) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
