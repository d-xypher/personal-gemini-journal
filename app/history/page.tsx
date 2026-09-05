"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AppHeader from "@/components/AppHeader";

type Entry = {
  id: string;
  content: string;
  reflection?: string;
  createdAt?: {
    _seconds?: number;
  } | null;
};

const wobbly =
  "255px 15px 225px 15px / 15px 225px 15px 255px";

const wobblyMd =
  "35px 18px 42px 12px / 18px 38px 14px 40px";

export default function HistoryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    if (!user) return;

    async function loadEntries() {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          window.location.href = "/";
          return;
        }

        const idToken = await currentUser.getIdToken();

        const response = await fetch("/api/entries", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Unable to load your entries");
        }

        setEntries(data.entries || []);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your journal."
        );
      } finally {
        setLoading(false);
      }
    }

    loadEntries();
  }, [user]);

  function formatDate(entry: Entry) {
    if (!entry.createdAt?._seconds) return "Undated";

    return new Date(entry.createdAt._seconds * 1000).toLocaleDateString(
      undefined,
      {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      }
    );
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
        <AppHeader active="history" email={user.email} />

        <section className="py-8 md:py-12">
          <div className="mb-10 max-w-3xl">
            <p className="mb-2 font-sans text-sm font-bold uppercase tracking-[0.18em] text-[#2d5da1]">
              Your notebook
            </p>

            <h2 className="font-heading text-4xl font-bold leading-tight md:text-6xl">
              Recent history
            </h2>

            <p className="mt-4 font-sans text-lg text-[#2d2d2d]/65 md:text-xl">
              A quiet place to look back at what you&apos;ve been thinking
              about.
            </p>
          </div>

          {loading && (
            <div
              className="border-[3px] border-[#2d2d2d] bg-white p-8 text-center shadow-[5px_5px_0px_0px_#2d2d2d]"
              style={{ borderRadius: wobblyMd }}
            >
              <p className="font-heading text-2xl">
                Turning the pages...
              </p>
            </div>
          )}

          {error && !loading && (
            <div
              className="border-[3px] border-[#2d2d2d] bg-[#ffe1e1] p-6 shadow-[5px_5px_0px_0px_#2d2d2d]"
              style={{ borderRadius: wobblyMd }}
            >
              <p className="font-sans text-lg">{error}</p>
            </div>
          )}

          {!loading && !error && entries.length === 0 && (
            <div
              className="mx-auto max-w-2xl rotate-[-1deg] border-[3px] border-[#2d2d2d] bg-[#fff9c4] p-8 text-center shadow-[5px_5px_0px_0px_#2d2d2d] md:p-12"
              style={{ borderRadius: wobbly }}
            >
              <div className="mb-4 text-5xl">📖</div>

              <h3 className="font-heading text-3xl font-bold">
                The first page is waiting.
              </h3>

              <p className="mx-auto mt-4 max-w-md font-sans text-lg leading-relaxed text-[#2d2d2d]/70">
                Start writing in your journal and your reflections will appear
                here.
              </p>

              <a
                href="/journal"
                className="mt-6 inline-block border-[3px] border-[#2d2d2d] bg-white px-6 py-3 font-sans text-lg font-bold shadow-[4px_4px_0px_0px_#2d2d2d] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#ff4d4d] hover:text-white"
                style={{ borderRadius: wobblyMd }}
              >
                Write your first entry →
              </a>
            </div>
          )}

          {!loading && !error && entries.length > 0 && (
            <div className="space-y-7">
              {entries.map((entry, index) => (
                <article
                  key={entry.id}
                  className={`border-[3px] border-[#2d2d2d] bg-white p-5 shadow-[5px_5px_0px_0px_#2d2d2d] md:p-7 ${
                    index % 3 === 0
                      ? "rotate-[-0.5deg]"
                      : index % 3 === 1
                        ? "rotate-[0.5deg]"
                        : "rotate-[-0.25deg]"
                  }`}
                  style={{ borderRadius: wobblyMd }}
                >
                  <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="font-sans text-sm font-bold uppercase tracking-[0.14em] text-[#2d5da1]">
                      {formatDate(entry)}
                    </span>

                    <span className="font-sans text-sm text-[#2d2d2d]/40">
                      Page {entries.length - index}
                    </span>
                  </div>

                  <p className="whitespace-pre-wrap font-sans text-xl leading-relaxed">
                    {entry.content}
                  </p>

                  {entry.reflection && (
                    <div className="mt-6 border-t-[2px] border-dashed border-[#2d2d2d]/30 pt-5">
                      <p className="mb-2 font-sans text-sm font-bold uppercase tracking-[0.14em] text-[#2d5da1]">
                        AI reflection
                      </p>

                      <p className="whitespace-pre-wrap font-sans text-lg leading-relaxed text-[#2d2d2d]/75">
                        {entry.reflection}
                      </p>
                    </div>
                  )}
                </article>
              ))}

              <div className="pt-3 text-center">
                <a
                  href="/journal"
                  className="inline-block border-[3px] border-[#2d2d2d] bg-[#ff4d4d] px-6 py-3 font-sans text-lg font-bold text-white shadow-[4px_4px_0px_0px_#2d2d2d] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_#2d2d2d]"
                  style={{ borderRadius: wobblyMd }}
                >
                  Write another page →
                </a>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
