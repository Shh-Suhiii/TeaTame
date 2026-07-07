"use client";
import Link from "next/link";
import { Home, MessageCircle, PlusCircle, Bell, User } from "lucide-react";
import { useEffect, useState } from "react";

export default function BottomNav() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const updateUnread = () => {
      try {
        const readIds = JSON.parse(localStorage.getItem("TeaTame_read_notifications") || "[]");
        const total = Number(localStorage.getItem("TeaTame_notification_count") || "0");
        setUnreadCount(Math.max(total - readIds.length, 0));
      } catch {
        setUnreadCount(0);
      }
    };

    updateUnread();
    window.addEventListener("focus", updateUnread);
    return () => window.removeEventListener("focus", updateUnread);
  }, []);

  return (
    <nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-purple-500/20 bg-[#120817]/95 px-4 py-3 shadow-[0_8px_30px_rgba(168,85,247,0.25)] backdrop-blur-xl md:hidden">
      <Link
        href="/"
        className="rounded-full p-2 text-white/70 transition-all duration-300 hover:bg-white/5 hover:text-purple-300"
      >
        <Home size={22} />
      </Link>

      <Link
        href="/notifications"
        className="relative rounded-full p-2 text-white/70 transition-all duration-300 hover:bg-white/5 hover:text-purple-300"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Link>

      <Link
        href="/create"
        className="rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 p-3 text-white shadow-lg shadow-purple-500/30 transition-transform duration-300 hover:scale-110"
      >
        <PlusCircle size={24} />
      </Link>

      <Link
        href="/chat"
        className="rounded-full p-2 text-white/70 transition-all duration-300 hover:bg-white/5 hover:text-purple-300"
      >
        <MessageCircle size={22} />
      </Link>

      <Link
        href="/profile"
        className="rounded-full p-2 text-white/70 transition-all duration-300 hover:bg-white/5 hover:text-purple-300"
      >
        <User size={22} />
      </Link>
    </nav>
  );
}