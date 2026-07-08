"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

function getEmojiFromName(name?: string) {
  if (!name) return "☕";
  const emojiMatch = name.match(/[\u{1F300}-\u{1FAFF}]/u);
  return emojiMatch?.[0] || "☕";
}

function getSavedAnonymousSign() {
  if (typeof window === "undefined") return "☕";

  try {
    const savedUser = localStorage.getItem("TeaTame_user");
    if (!savedUser) return "☕";

    const user = JSON.parse(savedUser);
    return user?.avatar || getEmojiFromName(user?.anonymous_name);
  } catch {
    return "☕";
  }
}

export default function Navbar() {
  const [anonymousSign, setAnonymousSign] = useState("☕");

  useEffect(() => {
    const updateSign = () => setAnonymousSign(getSavedAnonymousSign());

    updateSign();
    window.addEventListener("storage", updateSign);
    window.addEventListener("teatame-notifications-updated", updateSign);

    return () => {
      window.removeEventListener("storage", updateSign);
      window.removeEventListener("teatame-notifications-updated", updateSign);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0611]/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 sm:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 shadow-lg shadow-purple-500/10 sm:h-12 sm:w-12">
            <Image
              src="/logo3.png"
              alt="TeaTame Logo"
              width={56}
              height={56}
              priority
              className="h-8 w-8 object-contain sm:h-9 sm:w-9"
            />
          </div>

          <div>
            <h1 className="truncate text-lg font-bold leading-none text-white sm:text-xl md:text-2xl">TeaTame</h1>
            <p className="mt-1 text-[11px] text-zinc-500 md:text-xs">Spill it. Stay anonymous.</p>
          </div>
        </Link>

        <Link
          href="/profile"
          aria-label="Open anonymous profile"
          className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-500/10 text-xl shadow-lg shadow-purple-500/10 transition active:scale-95 hover:bg-purple-500/20 sm:h-11 sm:w-11"
        >
          {anonymousSign}
        </Link>
      </nav>
    </header>
  );
}