import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase-admin";
import { adminDb } from "@/lib/firestore";

async function deleteCollection(
  collectionRef: FirebaseFirestore.CollectionReference
) {
  const snapshot = await collectionRef.get();

  if (snapshot.empty) {
    return;
  }

  const batch = adminDb.batch();

  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
}

export async function DELETE(request: NextRequest) {
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

    const userRef = adminDb.collection("users").doc(uid);

    // Delete all known user-owned subcollections first.
    await deleteCollection(userRef.collection("entries"));
    await deleteCollection(userRef.collection("patterns"));

    // Delete distributed rate-limit state.
    await adminDb.collection("rateLimits").doc(`chat:${uid}`).delete();
    await adminDb.collection("rateLimits").doc(`mirror:${uid}`).delete();

    // Delete the user document itself.
    await userRef.delete();

    // Finally delete the Firebase Authentication account.
    await adminAuth.deleteUser(uid);

    return NextResponse.json({
      success: true,
      message: "Account and associated journal data deleted",
    });
  } catch (error) {
    console.error("Account deletion failed:", error);

    return NextResponse.json(
      { error: "Unable to delete your account" },
      { status: 500 }
    );
  }
}
