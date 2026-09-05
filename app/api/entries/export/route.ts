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
    const uid = decodedToken.uid;

    const snapshot = await adminDb
      .collection("users")
      .doc(uid)
      .collection("entries")
      .orderBy("createdAt", "desc")
      .get();

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        content: data.content ?? "",
        reflection: data.reflection ?? "",
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        uid,
        email: decodedToken.email ?? null,
      },
      entries,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": 'attachment; filename="personal-gemini-journal.json"',
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Journal export failed:", error);

    return NextResponse.json(
      { error: "Unable to export journal data" },
      { status: 500 }
    );
  }
}
