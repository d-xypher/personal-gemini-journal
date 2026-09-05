"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AppHeader from "@/components/AppHeader";

const wobbly =
  "255px 15px 225px 15px / 15px 225px 15px 255px";

const wobblyMd =
  "35px 18px 42px 12px / 18px 38px 14px 40px";

export default function MirrorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mirror, setMirror] = useState("");
  const [entryCount, setEntryCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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

  async function generateMirror() {
    if (loading) return;

    setLoading(true);
    setError("");

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
      setEntryCount(data.entryCount || 0);
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
        <AppHeader active="mirror" email={user.email} />

        <section className="py-8 md:py-12">
          <div className="mb-10 max-w-3xl">
            <p className="mb-2 font-sans text-sm font-bold uppercase tracking-[0.18em] text-[#2d5da1]">
              Step back & look
            </p>

            <h2 className="font-heading text-4xl font-bold leading-tight md:text-6xl">
              Your AI Mirror 🪞
            </h2>

            <p className="mt-4 font-sans text-lg leading-relaxed text-[#2d2d2d]/65 md:text-xl">
              Not a judge. Not a therapist. Just a second pair of eyes looking
              for patterns in the things you&apos;ve written.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-[0.75fr_1.5fr]">
            <aside className="space-y-6">
              <section
                className="rotate-[-1deg] border-[3px] border-[#2d2d2d] bg-[#fff9c4] p-6 shadow-[5px_5px_0px_0px_#2d2d2d]"
                style={{ borderRadius: wobblyMd }}
              >
                <div className="mb-4 text-4xl">🪞</div>

                <h3 className="font-heading text-3xl font-bold">
                  What it notices
                </h3>

                <ul className="mt-5 space-y-4 font-sans text-lg leading-relaxed">
                  <li>✦ Recurring patterns</li>
                  <li>✦ Possible contradictions</li>
                  <li>✦ Emerging insights</li>
                  <li>✦ Questions worth reflecting on</li>
                </ul>
              </section>

              <section
                className="border-[3px] border-[#2d2d2d] bg-white p-6 shadow-[4px_4px_0px_0px_#2d2d2d]"
                style={{ borderRadius: wobbly }}
              >
                <p className="font-sans text-sm font-bold uppercase tracking-[0.15em] text-[#2d5da1]">
                  Ground rules
                </p>

                <p className="mt-3 font-sans text-lg leading-relaxed text-[#2d2d2d]/70">
                  Your writing is treated as data to reflect on. The Mirror
                  avoids diagnoses, unsupported claims, and made-up patterns.
                </p>
              </section>

              <a
                href="/journal"
                className="block border-[3px] border-[#2d2d2d] bg-white px-5 py-3 text-center font-sans text-lg font-bold shadow-[4px_4px_0px_0px_#2d2d2d] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#ff4d4d] hover:text-white"
                style={{ borderRadius: wobblyMd }}
              >
                ← Back to Journal
              </a>
            </aside>

            <section
              className="min-h-[500px] border-[3px] border-[#2d2d2d] bg-white p-6 shadow-[6px_6px_0px_0px_#2d2d2d] md:p-8"
              style={{ borderRadius: wobbly }}
            >
              {!mirror && !loading && !error && (
                <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
                  <div className="mb-5 -rotate-2 border-[3px] border-[#2d2d2d] bg-[#fdfbf7] px-6 py-4 text-5xl shadow-[4px_4px_0px_0px_#2d2d2d]">
                    🪞
                  </div>

                  <h3 className="font-heading text-3xl font-bold md:text-4xl">
                    Ready when you are.
                  </h3>

                  <p className="mt-4 max-w-lg font-sans text-lg leading-relaxed text-[#2d2d2d]/65">
                    The Mirror will read your recent journal entries and look
                    for connections you may not have noticed yourself.
                  </p>

                  <button
                    onClick={generateMirror}
                    className="mt-7 min-h-12 border-[3px] border-[#2d2d2d] bg-[#ff4d4d] px-7 py-3 font-sans text-lg font-bold text-white shadow-[4px_4px_0px_0px_#2d2d2d] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d]"
                    style={{ borderRadius: wobblyMd }}
                  >
                    Look in the mirror →
                  </button>
                </div>
              )}

              {loading && (
                <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
                  <div className="animate-pulse text-5xl">🪞</div>

                  <h3 className="mt-5 font-heading text-3xl font-bold">
                    Looking closely...
                  </h3>

                  <p className="mt-3 font-sans text-lg text-[#2d2d2d]/60">
                    Connecting the dots across your recent pages.
                  </p>
                </div>
              )}

              {error && !loading && (
                <div className="flex min-h-[440px] flex-col items-center justify-center text-center">
                  <div className="text-4xl">✎</div>

                  <h3 className="mt-4 font-heading text-3xl font-bold">
                    Something got smudged.
                  </h3>

                  <p className="mt-3 max-w-md font-sans text-lg text-[#2d2d2d]/65">
                    {error}
                  </p>

                  <button
                    onClick={generateMirror}
                    className="mt-6 border-[3px] border-[#2d2d2d] bg-white px-6 py-3 font-sans text-lg font-bold shadow-[3px_3px_0px_0px_#2d2d2d] hover:bg-[#ff4d4d] hover:text-white"
                    style={{ borderRadius: wobblyMd }}
                  >
                    Try again
                  </button>
                </div>
              )}

              {mirror && !loading && (
                <div>
                  <div className="mb-7 flex flex-col gap-2 border-b-[2px] border-dashed border-[#2d2d2d]/30 pb-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <p className="font-sans text-sm font-bold uppercase tracking-[0.15em] text-[#2d5da1]">
                        Mirror notes
                      </p>

                      <h3 className="font-heading text-3xl font-bold md:text-4xl">
                        What your pages are saying
                      </h3>
                    </div>

                    <span className="font-sans text-sm text-[#2d2d2d]/50">
                      Based on {entryCount} recent{" "}
                      {entryCount === 1 ? "entry" : "entries"}
                    </span>
                  </div>

                  <div className="whitespace-pre-wrap font-sans text-lg leading-relaxed md:text-xl">
                    {mirror}
                  </div>

                  <div className="mt-8 border-t-[2px] border-dashed border-[#2d2d2d]/30 pt-6">
                    <button
                      onClick={generateMirror}
                      disabled={loading}
                      className="border-[3px] border-[#2d2d2d] bg-white px-5 py-3 font-sans text-lg font-bold shadow-[3px_3px_0px_0px_#2d2d2d] hover:bg-[#fff9c4] disabled:opacity-50"
                      style={{ borderRadius: wobblyMd }}
                    >
                      ↻ Reflect again
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
