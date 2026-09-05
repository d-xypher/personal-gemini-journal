"use client";

import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useState } from "react";

const wobbly =
  "255px 15px 225px 15px / 15px 225px 15px 255px";

const wobblyMd =
  "35px 18px 42px 12px / 18px 38px 14px 40px";

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);

      window.location.href = "/journal";
    } catch (err) {
      console.error("Google sign-in failed:", err);

      setError("Sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen overflow-hidden px-4 py-8 md:px-8 md:py-10">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="rotate-[-2deg] border-[3px] border-[#2d2d2d] bg-white px-3 py-1 text-2xl shadow-[3px_3px_0px_0px_#2d2d2d]"
              style={{ borderRadius: wobbly }}
            >
              🪞
            </div>

            <div>
              <p className="font-sans text-xs font-bold uppercase tracking-[0.15em] text-[#2d5da1]">
                Private notebook
              </p>

              <p className="font-heading text-xl font-bold">
                Personal Gemini Journal
              </p>
            </div>
          </div>

          <span className="hidden font-sans text-sm text-[#2d2d2d]/45 sm:block">
            Your thoughts, reflected.
          </span>
        </header>

        <section className="relative py-16 md:py-24">
          <div className="absolute -right-20 top-20 hidden rotate-12 text-7xl opacity-20 md:block">
            ✦
          </div>

          <div className="absolute -left-12 bottom-10 hidden -rotate-12 text-6xl opacity-20 md:block">
            ✎
          </div>

          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-6 inline-block rotate-[-1deg] border-[2px] border-[#2d2d2d] bg-[#fff9c4] px-4 py-2 font-sans text-sm font-bold shadow-[3px_3px_0px_0px_#2d2d2d]">
              WRITE · REFLECT · NOTICE
            </div>

            <h1 className="font-heading text-5xl font-bold leading-[0.95] md:text-8xl">
              Your thoughts
              <br />
              <span className="relative inline-block">
                have patterns.
                <span className="absolute -bottom-2 left-0 right-0 h-[3px] rotate-[-1deg] bg-[#ff4d4d]" />
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-2xl font-sans text-xl leading-relaxed text-[#2d2d2d]/70 md:text-2xl">
              A private journal that doesn&apos;t just store your thoughts.
              Gemini helps you reflect on them — while your AI Mirror looks
              for recurring patterns, possible contradictions, and emerging
              insights.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-9 min-h-14 border-[3px] border-[#2d2d2d] bg-[#ff4d4d] px-8 py-4 font-sans text-xl font-bold text-white shadow-[5px_5px_0px_0px_#2d2d2d] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[3px_3px_0px_0px_#2d2d2d] disabled:cursor-not-allowed disabled:opacity-50"
              style={{ borderRadius: wobblyMd }}
            >
              {loading ? "Opening your notebook..." : "Start writing →"}
            </button>

            {error && (
              <p className="mx-auto mt-4 max-w-md border-[2px] border-[#2d2d2d] bg-[#ffe1e1] p-3 font-sans text-base">
                {error}
              </p>
            )}

            <p className="mt-4 font-sans text-sm text-[#2d2d2d]/45">
              Sign in securely with Google
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <article
            className="rotate-[-1deg] border-[3px] border-[#2d2d2d] bg-white p-6 shadow-[5px_5px_0px_0px_#2d2d2d]"
            style={{ borderRadius: wobblyMd }}
          >
            <div className="mb-4 text-3xl">✎</div>

            <h2 className="font-heading text-3xl font-bold">
              Write freely
            </h2>

            <p className="mt-3 font-sans text-lg leading-relaxed text-[#2d2d2d]/65">
              Put down whatever is on your mind. No prompts required. No
              perfect sentences needed.
            </p>
          </article>

          <article
            className="rotate-[1deg] border-[3px] border-[#2d2d2d] bg-[#fff9c4] p-6 shadow-[5px_5px_0px_0px_#2d2d2d]"
            style={{ borderRadius: wobblyMd }}
          >
            <div className="mb-4 text-3xl">💭</div>

            <h2 className="font-heading text-3xl font-bold">
              Get reflection
            </h2>

            <p className="mt-3 font-sans text-lg leading-relaxed text-[#2d2d2d]/65">
              Gemini gives your writing a thoughtful second perspective,
              grounded in what you actually wrote.
            </p>
          </article>

          <article
            className="rotate-[-0.5deg] border-[3px] border-[#2d2d2d] bg-white p-6 shadow-[5px_5px_0px_0px_#2d2d2d]"
            style={{ borderRadius: wobblyMd }}
          >
            <div className="mb-4 text-3xl">🪞</div>

            <h2 className="font-heading text-3xl font-bold">
              See the bigger picture
            </h2>

            <p className="mt-3 font-sans text-lg leading-relaxed text-[#2d2d2d]/65">
              Your AI Mirror connects recent entries to surface recurring
              themes and questions worth exploring.
            </p>
          </article>
        </section>

        <section className="py-16 text-center md:py-20">
          <div
            className="mx-auto max-w-3xl border-[3px] border-dashed border-[#2d2d2d] bg-white/60 p-7"
            style={{ borderRadius: wobbly }}
          >
            <p className="font-heading text-2xl font-bold md:text-3xl">
              A journal is a record of where you&apos;ve been.
              <br />
              <span className="text-[#ff4d4d]">
                The Mirror helps you notice where you&apos;re going.
              </span>
            </p>
          </div>
        </section>

        <footer className="border-t-[3px] border-dashed border-[#2d2d2d] py-6 text-center">
          <p className="font-sans text-sm text-[#2d2d2d]/45">
            Personal Gemini Journal · Private by design
          </p>
        </footer>
      </div>
    </main>
  );
}
