import Link from "next/link";
import { Home, MessageCircle, PlusCircle } from "lucide-react";

export default function BottomNav() {
  return (
    <nav className="fixed bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full border border-white/10 bg-[#120817]/90 px-4 py-3 backdrop-blur-xl md:hidden">
      <Link href="/" className="rounded-full p-2 text-white/70">
        <Home size={22} />
      </Link>

      <Link href="/create" className="rounded-full bg-purple-500 p-3 text-white">
        <PlusCircle size={24} />
      </Link>

      <Link href="/chat" className="rounded-full p-2 text-white/70">
        <MessageCircle size={22} />
      </Link>
    </nav>
  );
}