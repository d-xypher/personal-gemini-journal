import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { adminDb } from "@/lib/firestore";

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

    const snapshot = await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .collection("entries")
      .orderBy("createdAt", "desc")
      .limit(20)
      .get();

    const entries = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Failed to load journal entries:", error);

    return NextResponse.json(
      { error: "Unable to load journal entries" },
      { status: 500 }
    );
  }
}
