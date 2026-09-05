import { getFirestore } from "firebase-admin/firestore";
import { adminAuth } from "@/lib/firebase-admin";

export const adminDb = getFirestore();

export { adminAuth };
