import Link from "next/link";
import { Coffee, Plus } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0611]/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-300/30 bg-purple-500/20">
            <Coffee className="text-purple-200" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">TeaTime</h1>
            <p className="text-xs text-white/45">Spill it. Stay anonymous.</p>
          </div>
        </Link>

        <Link
          href="/create"
          className="flex items-center gap-2 rounded-full bg-purple-500 px-5 py-3 text-sm font-semibold"
        >
          <Plus size={18} />
          Create Tea
        </Link>
      </nav>
    </header>
  );
}