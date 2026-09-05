import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { adminDb } from "@/lib/firestore";
import { generateGeminiResponse } from "@/lib/gemini";
import { checkRateLimit } from "@/lib/rate-limit";

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

    const rateLimit = checkRateLimit(`mirror:${decodedToken.uid}`);

    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const snapshot = await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .collection("entries")
      .orderBy("createdAt", "desc")
      .limit(30)
      .get();

    const entries = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        content: data.content,
        createdAt: data.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });

    if (entries.length === 0) {
      return NextResponse.json({
        mirror: "Write a few journal entries first, then your AI Mirror can look for patterns.",
      });
    }

    const journalText = entries
      .map(
        (entry, index) =>
          `Entry ${index + 1} (${entry.createdAt ?? "unknown date"}):\n${entry.content}`
      )
      .join("\n\n");

    const prompt = `
You are the AI Mirror inside a private personal journal.

Your job is to help the user notice patterns in their own writing.
Do not diagnose the user.
Do not claim to know their psychological state.
Do not invent facts.
Do not treat speculation as certainty.

Separate observations from interpretations.

Analyze the journal entries below and respond using exactly these sections:

RECURRING PATTERNS
- Identify themes, behaviors, concerns, goals, or situations that appear repeatedly.
- Only mention patterns supported by the entries.

POSSIBLE CONTRADICTIONS
- Identify places where the user's stated goals, feelings, or actions may appear to conflict.
- Use cautious language such as "may", "might", or "appears".

EMERGING INSIGHTS
- Identify changes or developments that appear across the entries.
- Focus on what the writing itself supports.

REFLECTION PROMPTS
- Give 2 or 3 thoughtful questions the user could consider.
- Do not give medical or mental-health treatment advice.

Keep the response concise, specific, and grounded entirely in the journal entries.

JOURNAL ENTRIES:

${journalText}
`;

    const mirror = await generateGeminiResponse(prompt);

    return NextResponse.json({
      mirror,
      entryCount: entries.length,
    });
  } catch (error) {
    console.error("AI Mirror request failed:", error);

    return NextResponse.json(
      { error: "Unable to generate your AI Mirror" },
      { status: 500 }
    );
  }
}
