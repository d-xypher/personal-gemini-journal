"use client";

import Link from "next/link";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { auth } from "@/lib/firebase";

type AppHeaderProps = {
  active: "journal" | "history" | "mirror";
  email?: string | null;
};

const wobbly = "255px 15px 225px 15px / 15px 225px 15px 255px";
const wobblyMd = "35px 18px 42px 12px / 18px 38px 14px 40px";

export default function AppHeader({
  active,
  email,
}: AppHeaderProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);

  async function handleSignOut() {
    await signOut(auth);
    window.location.href = "/";
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete your account and all journal data? This cannot be undone."
    );

    if (!confirmed) {
      return;
    }

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        window.location.href = "/";
        return;
      }

      const idToken = await currentUser.getIdToken();

      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error("Account deletion failed");
      }

      await signOut(auth);
      window.location.href = "/";
    } catch (error) {
      console.error("Account deletion failed:", error);
      window.alert("Unable to delete your account. Please try again.");
    }
  }

  return (
    <header className="relative border-b-[3px] border-dashed border-[#2d2d2d] pb-5">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <Link href="/journal" className="group">
          <div className="flex items-center gap-3">
            <div
              className="-rotate-2 border-[3px] border-[#2d2d2d] bg-white px-3 py-1 text-xl shadow-[3px_3px_0px_0px_#2d2d2d] transition-transform duration-100 group-hover:rotate-1"
              style={{ borderRadius: wobbly }}
            >
              🪞
            </div>

            <div>
              <p className="font-sans text-sm text-[#2d5da1]">
                PRIVATE NOTEBOOK
              </p>

              <h1 className="font-heading text-3xl font-bold leading-none md:text-4xl">
                Personal Gemini Journal
              </h1>
            </div>
          </div>
        </Link>

        <nav
          aria-label="Main navigation"
          className="flex flex-wrap items-center gap-2 font-sans text-lg"
        >
          <Link
            href="/journal"
            className={`min-h-12 px-4 py-2 ${
              active === "journal"
                ? "border-[2px] border-[#2d2d2d] bg-[#fff9c4] font-bold shadow-[3px_3px_0px_0px_#2d2d2d]"
                : "text-[#2d2d2d]/60 hover:text-[#2d2d2d]"
            }`}
            style={{ borderRadius: active === "journal" ? wobblyMd : undefined }}
          >
            Journal
          </Link>

          <Link
            href="/history"
            className={`min-h-12 px-4 py-2 ${
              active === "history"
                ? "border-[2px] border-[#2d2d2d] bg-[#fff9c4] font-bold shadow-[3px_3px_0px_0px_#2d2d2d]"
                : "text-[#2d2d2d]/60 hover:text-[#2d2d2d]"
            }`}
            style={{ borderRadius: active === "history" ? wobblyMd : undefined }}
          >
            History
          </Link>

          <Link
            href="/mirror"
            className={`min-h-12 px-4 py-2 ${
              active === "mirror"
                ? "border-[2px] border-[#2d2d2d] bg-[#fff9c4] font-bold shadow-[3px_3px_0px_0px_#2d2d2d]"
                : "text-[#2d2d2d]/60 hover:text-[#2d2d2d]"
            }`}
            style={{ borderRadius: active === "mirror" ? wobblyMd : undefined }}
          >
            AI Mirror
          </Link>

          <div className="relative">
            <button
              onClick={() => setSettingsOpen((open) => !open)}
              className="min-h-12 border-[3px] border-[#2d2d2d] bg-white px-4 py-2 shadow-[3px_3px_0px_0px_#2d2d2d] transition-transform duration-100 hover:translate-x-[2px] hover:translate-y-[2px] hover:bg-[#fff9c4] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none"
              style={{ borderRadius: wobbly }}
              aria-expanded={settingsOpen}
              aria-haspopup="menu"
            >
              ⚙️ Settings
            </button>

            {settingsOpen && (
              <div
                className="absolute right-0 top-14 z-50 w-56 border-[3px] border-[#2d2d2d] bg-white p-2 shadow-[5px_5px_0px_0px_#2d2d2d]"
                style={{ borderRadius: wobbly }}
                role="menu"
              >
                <button
                  onClick={async () => {
                    setSettingsOpen(false);

                    try {
                      const currentUser = auth.currentUser;

                      if (!currentUser) {
                        window.location.href = "/";
                        return;
                      }

                      const idToken = await currentUser.getIdToken();

                      const response = await fetch("/api/entries/export", {
                        headers: {
                          Authorization: `Bearer ${idToken}`,
                        },
                      });

                      if (!response.ok) {
                        throw new Error("Export failed");
                      }

                      const blob = await response.blob();
                      const url = URL.createObjectURL(blob);
                      const link = document.createElement("a");

                      link.href = url;
                      link.download = "personal-gemini-journal.json";
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      URL.revokeObjectURL(url);
                    } catch (error) {
                      console.error("Journal export failed:", error);
                      window.alert("Unable to export your journal. Please try again.");
                    }
                  }}
                  className="w-full px-4 py-3 text-left text-lg hover:bg-[#fff9c4]"
                  role="menuitem"
                >
                  ↓ Export JSON
                </button>

                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    void handleDeleteAccount();
                  }}
                  className="w-full px-4 py-3 text-left text-lg hover:bg-[#ff4d4d] hover:text-white"
                  role="menuitem"
                >
                  🗑 Delete account
                </button>

                <button
                  onClick={() => {
                    setSettingsOpen(false);
                    void handleSignOut();
                  }}
                  className="w-full px-4 py-3 text-left text-lg hover:bg-[#e5e0d8]"
                  role="menuitem"
                  aria-label={`Sign out${email ? ` ${email}` : ""}`}
                >
                  ↪ Sign out
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}
