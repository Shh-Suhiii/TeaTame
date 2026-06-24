import Link from "next/link";
import { Home, MessageCircle, PlusCircle } from "lucide-react";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-4 rounded-full border border-purple-500/20 bg-[#120817]/95 px-5 py-3 shadow-[0_8px_30px_rgba(168,85,247,0.25)] backdrop-blur-xl md:hidden">
      <Link
        href="/"
        className="rounded-full p-2 text-white/70 transition-all duration-300 hover:bg-white/5 hover:text-purple-300"
      >
        <Home size={22} />
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
    </nav>
  );
}