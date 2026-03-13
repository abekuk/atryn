import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, createUser } from "@/lib/dynamodb-users";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role, name, email, password, ...rest } = body;

    if (!role || !name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    if (role === "student") {
      const { program, year, interests } = rest;
      if (!program || !year) {
        return NextResponse.json({ error: "Missing program or year" }, { status: 400 });
      }

      const user = await createUser({
        email,
        role: "student",
        name,
        password: hashedPassword,
        program,
        year: Number(year),
        interests: interests ?? "",
      });

      const token = signToken({
        id: user.userId,
        email,
        role: "student",
        name,
      });

      return NextResponse.json({
        token,
        user: {
          id: user.userId,
          role: "student",
          name,
          email,
          program,
          year: Number(year),
          interests: interests ?? "",
        },
      });
    }

    if (role === "professor") {
      const { department, labName } = rest;
      if (!department || !labName) {
        return NextResponse.json({ error: "Missing department or labName" }, { status: 400 });
      }

      const user = await createUser({
        email,
        role: "professor",
        name,
        password: hashedPassword,
        department,
        labName,
      });

      const token = signToken({
        id: user.userId,
        email,
        role: "professor",
        name,
      });

      return NextResponse.json({
        token,
        user: {
          id: user.userId,
          role: "professor",
          name,
          email,
          department,
          labName,
        },
      });
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  } catch (error: unknown) {
    console.error("Register error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
