import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { readFileSync } from "node:fs";
import { beforeAll, afterAll, afterEach, describe, expect, it } from "vitest";

const PROJECT_ID = "apac-3-507614";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
    },
  });
});

afterEach(async () => {
  await testEnv.clearFirestore();
});

afterAll(async () => {
  await testEnv.cleanup();
});

describe("Firestore user isolation", () => {
  it("allows a user to read their own journal entry", async () => {
    const userA = testEnv.authenticatedContext("user-a");
    const entryRef = doc(userA.firestore(), "users/user-a/entries/entry-1");

    await setDoc(entryRef, {
      content: "Private journal entry",
    });

    await assertSucceeds(getDoc(entryRef));
  });

  it("denies a user access to another user's journal entry", async () => {
    const userA = testEnv.authenticatedContext("user-a");
    const userB = testEnv.authenticatedContext("user-b");

    const entryRef = doc(userA.firestore(), "users/user-a/entries/entry-1");

    await setDoc(entryRef, {
      content: "User A private journal entry",
    });

    const userBEntryRef = doc(
      userB.firestore(),
      "users/user-a/entries/entry-1"
    );

    await assertFails(getDoc(userBEntryRef));
  });

  it("denies unauthenticated access", async () => {
    const unauthenticated = testEnv.unauthenticatedContext();

    const entryRef = doc(
      unauthenticated.firestore(),
      "users/user-a/entries/entry-1"
    );

    await assertFails(getDoc(entryRef));
  });
});
