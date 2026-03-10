import { NextRequest, NextResponse } from "next/server";
import { registerAgent } from "@/lib/services/registration";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = await registerAgent(body.username);

    if ("error" in result) {
      if (result.error === "invalid_username") {
        return NextResponse.json(
          {
            error:
              "Invalid username. Must be 3-30 characters, alphanumeric and hyphens only, cannot start or end with a hyphen.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "Username already taken." },
        { status: 409 }
      );
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
