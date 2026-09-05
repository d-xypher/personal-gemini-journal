"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AppHeader from "@/components/AppHeader";

const wobbly =
  "255px 15px 225px 15px / 15px 225px 15px 255px";

const wobblyMd =
  "35px 18px 42px 12px / 18px 38px 14px 40px";

export default function JournalPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [content, setContent] = useState("");
  const [reflection, setReflection] = useState("");
  const [mirror, setMirror] = useState("");
  const [loading, setLoading] = useState(false);
  const [mirrorLoading, setMirrorLoading] = useState(false);
  const [error, setError] = useState("");
  const [mirrorError, setMirrorError] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      window.location.href = "/";
    }
  }, [authLoading, user]);

  async function saveEntry() {
    if (!content.trim() || loading) return;

    setLoading(true);
    setError("");
    setReflection("");

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        window.location.href = "/";
        return;
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          prompt: content.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to save your entry");
      }

      setReflection(data.response || "");
      setContent("");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function generateMirror() {
    if (mirrorLoading) return;

    setMirrorLoading(true);
    setMirrorError("");

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        window.location.href = "/";
        return;
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch("/api/mirror", {
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate your AI Mirror");
      }

      setMirror(data.mirror || "");
    } catch (err) {
      console.error(err);
      setMirrorError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setMirrorLoading(false);
    }
  }

  if (authLoading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <p className="font-sans text-lg text-[#2d2d2d]/60">
          Opening your notebook...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto max-w-5xl">
        <AppHeader active="journal" email={user.email} />

        <section className="py-8 md:py-12">
          <div className="mb-8 max-w-3xl">
            <p className="mb-2 font-sans text-sm font-bold uppercase tracking-[0.18em] text-[#2d5da1]">
              Today&apos;s page
            </p>

            <h2 className="font-heading text-4xl font-bold leading-tight md:text-6xl">
              What&apos;s on your mind?
            </h2>

            <p className="mt-4 font-sans text-lg text-[#2d2d2d]/65 md:text-xl">
              Write freely. Your AI Mirror will help you notice what you might
              otherwise miss.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.45fr_0.8fr]">
            <section
              className="relative border-[3px] border-[#2d2d2d] bg-white p-5 shadow-[6px_6px_0px_0px_#2d2d2d] md:p-7"
              style={{ borderRadius: wobbly }}
            >
              <div className="absolute -top-4 left-8 rotate-[-2deg] border-[2px] border-[#2d2d2d] bg-[#fff9c4] px-4 py-1 font-sans text-sm shadow-[2px_2px_0px_0px_#2d2d2d]">
                PRIVATE
              </div>

              <div className="mb-5 flex items-center justify-between gap-4">
                <span className="font-heading text-2xl font-bold">
                  New entry
                </span>

                <span className="font-sans text-sm text-[#2d2d2d]/50">
                  {content.length}/10,000
                </span>
              </div>

              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                maxLength={10000}
                placeholder="Dear notebook..."
                className="min-h-[300px] w-full resize-y border-[3px] border-[#2d2d2d] bg-[#fdfbf7] p-5 font-sans text-xl leading-relaxed outline-none placeholder:text-[#2d2d2d]/30 focus:border-[#2d5da1] md:min-h-[380px]"
                style={{ borderRadius: wobblyMd }}
              />

              {error && (
                <p className="mt-4 border-[2px] border-[#2d2d2d] bg-[#ffe1e1] p-3 font-sans text-base">
                  {error}
                </p>
              )}

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-sans text-sm text-[#2d2d2d]/55">
                  No pressure. A few honest lines are enough.
                </p>

                <button
                  onClick={saveEntry}
                  disabled={loading || !content.trim()}
                  className="min-h-12 border-[3px] border-[#2d2d2d] bg-[#ff4d4d] px-6 py-3 font-sans text-lg font-bold text-white shadow-[4px_4px_0px_0px_#2d2d2d] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d] disabled:cursor-not-allowed disabled:opacity-40"
                  style={{ borderRadius: wobblyMd }}
                >
                  {loading ? "Reflecting..." : "Save & Reflect →"}
                </button>
              </div>
            </section>

            <aside className="space-y-6">
              <section
                className="border-[3px] border-[#2d2d2d] bg-[#fff9c4] p-5 shadow-[5px_5px_0px_0px_#2d2d2d]"
                style={{ borderRadius: wobblyMd }}
              >
                <p className="mb-2 font-sans text-sm font-bold uppercase tracking-[0.15em] text-[#2d5da1]">
                  AI reflection
                </p>

                <h3 className="font-heading text-3xl font-bold">
                  A second pair of eyes.
                </h3>

                {reflection ? (
                  <p className="mt-4 whitespace-pre-wrap font-sans text-lg leading-relaxed">
                    {reflection}
                  </p>
                ) : (
                  <p className="mt-4 font-sans text-lg leading-relaxed text-[#2d2d2d]/65">
                    Write an entry and Gemini will reflect it back to you with
                    a fresh perspective.
                  </p>
                )}
              </section>

              <section
                className="rotate-[1deg] border-[3px] border-[#2d2d2d] bg-white p-5 shadow-[4px_4px_0px_0px_#2d2d2d]"
                style={{ borderRadius: wobblyMd }}
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="font-heading text-2xl font-bold">
                    AI Mirror
                  </h3>

                  <span className="text-xl">🪞</span>
                </div>

                <p className="font-sans text-lg leading-relaxed text-[#2d2d2d]/70">
                  See recurring patterns, possible contradictions, emerging
                  insights, and questions worth sitting with.
                </p>

                <button
                  onClick={generateMirror}
                  disabled={mirrorLoading}
                  className="mt-5 w-full min-h-12 border-[3px] border-[#2d2d2d] bg-white px-4 py-2 font-sans text-lg font-bold shadow-[3px_3px_0px_0px_#2d2d2d] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#ff4d4d] hover:text-white disabled:opacity-50"
                  style={{ borderRadius: wobblyMd }}
                >
                  {mirrorLoading ? "Looking in the mirror..." : "Open AI Mirror"}
                </button>

                {mirrorError && (
                  <p className="mt-4 font-sans text-sm text-[#ff4d4d]">
                    {mirrorError}
                  </p>
                )}
              </section>

              {mirror && (
                <section
                  className="border-[3px] border-[#2d2d2d] bg-white p-5 shadow-[5px_5px_0px_0px_#2d2d2d]"
                  style={{ borderRadius: wobbly }}
                >
                  <p className="mb-3 font-sans text-sm font-bold uppercase tracking-[0.15em] text-[#2d5da1]">
                    Mirror notes
                  </p>

                  <div className="whitespace-pre-wrap font-sans text-lg leading-relaxed">
                    {mirror}
                  </div>
                </section>
              )}
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
