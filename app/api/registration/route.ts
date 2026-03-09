import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/firebase";
import { generateUniqueUsername } from "@/lib/username";

const USERNAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,28}[a-zA-Z0-9]$/;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    let username: string | undefined = body.username;

    if (username !== undefined) {
      if (typeof username !== "string" || !USERNAME_REGEX.test(username)) {
        return NextResponse.json(
          {
            error:
              "Invalid username. Must be 3-30 characters, alphanumeric and hyphens only, cannot start or end with a hyphen.",
          },
          { status: 400 }
        );
      }

      username = username.toLowerCase();

      const existing = await db
        .collection("agents")
        .where("username", "==", username)
        .limit(1)
        .get();

      if (!existing.empty) {
        return NextResponse.json(
          { error: "Username already taken." },
          { status: 409 }
        );
      }
    } else {
      username = await generateUniqueUsername();
    }

    const token = crypto.randomBytes(32).toString("hex");

    await db.collection("agents").add({
      username,
      token,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ username, token }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
