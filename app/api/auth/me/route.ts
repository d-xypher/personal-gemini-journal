import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing authentication token" },
        { status: 401 }
      );
    }

    const idToken = authHeader.substring("Bearer ".length);

    const decodedToken = await adminAuth.verifyIdToken(idToken);

    return NextResponse.json({
      authenticated: true,
      uid: decodedToken.uid,
      email: decodedToken.email ?? null,
    });
  } catch (error) {
    console.error("Authentication verification failed:", error);

    return NextResponse.json(
      { error: "Invalid authentication token" },
      { status: 401 }
    );
  }
}
