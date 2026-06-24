import Link from "next/link";
import Image from "next/image";
import { Plus } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0611]/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-2">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 shadow-lg shadow-purple-500/10">
            <Image
              src="/logo3.png"
              alt="TeaTame Logo"
              width={56}
              height={56}
              priority
              className="h-9 w-9 object-contain"
            />
          </div>

          <div>
            <h1 className="text-xl font-bold leading-none text-white md:text-2xl">TeaTame</h1>
            <p className="mt-1 text-[11px] text-zinc-500 md:text-xs">Spill it. Stay anonymous.</p>
          </div>
        </Link>

        <Link
          href="/create"
          className="flex items-center gap-2 rounded-full bg-purple-500 px-4 py-2.5 text-sm font-semibold shadow-lg shadow-purple-500/20 transition hover:bg-purple-400 md:px-5 md:py-3"
        >
          <Plus size={18} />
          Create Tea
        </Link>
      </nav>
    </header>
  );
}