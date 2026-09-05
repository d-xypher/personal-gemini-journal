import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { adminDb } from "@/lib/firestore";
import { generateGeminiResponse } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
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

    const body = await request.json();

    if (!body.prompt || typeof body.prompt !== "string") {
      return NextResponse.json(
        { error: "A valid prompt is required" },
        { status: 400 }
      );
    }

    const prompt = body.prompt.trim();

    if (!prompt || prompt.length > 10000) {
      return NextResponse.json(
        { error: "Prompt must be between 1 and 10,000 characters" },
        { status: 400 }
      );
    }

    const uid = decodedToken.uid;

    const rateLimit = await checkRateLimit(`chat:${uid}`);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    console.log("Gemini request from authenticated user:", uid);

    const response = await generateGeminiResponse(prompt);

    await adminDb
      .collection("users")
      .doc(uid)
      .collection("entries")
      .add({
        content: prompt,
        reflection: response,
        createdAt: new Date(),
      });

    return NextResponse.json({
      response,
    });
  } catch (error) {
    console.error("Journal request failed:", error);

    return NextResponse.json(
      { error: "Unable to process your journal entry" },
      { status: 500 }
    );
  }
}
