

import Link from "next/link";
import { ArrowLeft, Coffee, Heart, MessageCircle, Send } from "lucide-react";

const comments = [
  {
    id: 1,
    author: "Anonymous Cat",
    emoji: "🐱",
    text: "Same thing happened with me last semester 😭",
  },
  {
    id: 2,
    author: "Anonymous Rabbit",
    emoji: "🐰",
    text: "Honestly, you should speak up but smartly.",
  },
  {
    id: 3,
    author: "Anonymous Bear",
    emoji: "🐻",
    text: "This tea is too real.",
  },
];

export default function TeaDetailPage() {
  return (
    <main className="min-h-screen bg-[#0c0611] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0611]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-300/30 bg-purple-500/20">
              <Coffee className="text-purple-200" size={22} />
            </div>
            <div>
              <h1 className="font-bold leading-tight">Tea Detail</h1>
              <p className="text-xs text-white/45">Anonymous comments</p>
            </div>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl space-y-5 px-5 py-8">
        <article className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-2xl">
              🐼
            </div>
            <div>
              <h2 className="font-semibold">Anonymous Panda</h2>
              <p className="text-sm text-white/40">2 min ago • Workplace Tea</p>
            </div>
          </div>

          <p className="mt-5 text-lg leading-8 text-white/85">
            My manager took credit for my idea in today’s meeting and everyone clapped for him. I am just sitting here pretending to be fine.
          </p>

          <div className="mt-5 flex items-center gap-3 border-t border-white/10 pt-4">
            <button className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70">
              <Heart size={17} />
              128
            </button>
            <button className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70">
              <MessageCircle size={17} />
              34 comments
            </button>
            <Link
              href="/chat"
              className="ml-auto rounded-full border border-purple-300/30 px-4 py-2 text-sm text-purple-100 transition hover:bg-purple-500/20"
            >
              Anonymous Chat
            </Link>
          </div>
        </article>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-3">
            <input
              placeholder="Comment anonymously..."
              className="flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
            />
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 transition hover:bg-purple-400">
              <Send size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl"
            >
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/15 text-xl">
                  {comment.emoji}
                </div>
                <h3 className="font-medium">{comment.author}</h3>
              </div>
              <p className="leading-7 text-white/70">{comment.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}