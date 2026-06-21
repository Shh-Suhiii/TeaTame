"use client";
import Link from "next/link";
import { Search, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import BottomNav from "@/components/common/BottomNav";
import TeaCard from "@/components/feed/TeaCard";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";

const teaPosts = [
  {
    id: 1,
    author: "Anonymous Panda",
    emoji: "🐼",
    time: "2 min ago",
    type: "Workplace Tea",
    content:
      "My manager took credit for my idea in today’s meeting and everyone clapped for him. I am just sitting here pretending to be fine.",
    likes: 128,
    comments: 34,
  },
  {
    id: 2,
    author: "Anonymous Fox",
    emoji: "🦊",
    time: "12 min ago",
    type: "Relationship Tea",
    content:
      "He said he was busy, but his location was at the same cafe where his ex usually goes. Should I ask or stay silent?",
    likes: 94,
    comments: 41,
  },
  {
    id: 3,
    author: "Anonymous Owl",
    emoji: "🦉",
    time: "28 min ago",
    type: "College Tea",
    content:
      "Group project ka pura kaam maine kiya, presentation ke time sab bol rahe the ‘we worked so hard’. I need emotional support.",
    likes: 211,
    comments: 63,
  },
];

const categories = ["All", "College", "Work", "Relationship", "Confession", "Family"];

export default function Home() {
  const username = useAnonymousUser();

  return (
    <main className="min-h-screen bg-[#0c0611] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <Navbar />

      <section className="mx-auto grid max-w-6xl gap-6 px-5 py-8 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-400/10 px-4 py-2 text-sm text-purple-100">
                <Sparkles size={16} />
                Anonymous social feed
              </p>
              <h2 className="max-w-2xl text-4xl font-bold tracking-tight md:text-6xl">
                What&apos;s the tea today?
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-white/60 md:text-lg">
                Share confessions, daily drama, stories, thoughts, images, voice notes and videos — without revealing your identity.
              </p>
              {username && (
                <p className="mt-4 inline-flex rounded-full border border-purple-300/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-100">
                  Welcome, {username}
                </p>
              )}
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/20 p-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-white/40">
                <Search size={18} />
                <input
                  placeholder="Search anonymous tea..."
                  className="w-full bg-transparent text-white outline-none placeholder:text-white/35"
                />
              </div>
              <Link
                href="/create"
                className="rounded-2xl bg-white px-5 py-3 text-center font-semibold text-[#120817] transition hover:bg-purple-100"
              >
                Spill Your Tea
              </Link>
            </div>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-1">
            {categories.map((category) => (
              <button
                key={category}
                className={`shrink-0 rounded-full border px-5 py-2 text-sm transition ${
                  category === "All"
                    ? "border-purple-300/40 bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : "border-white/10 bg-white/[0.06] text-white/70 hover:border-purple-300/40 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <h3 className="mb-4 text-lg font-bold">🔥 Trending Today</h3>
            <div className="flex flex-wrap gap-3">
              {["#WorkDrama", "#RelationshipTea", "#CollegeLife", "#Confessions"].map(
                (tag) => (
                  <button
                    key={tag}
                    className="rounded-full border border-purple-300/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-100 transition hover:bg-purple-500/20"
                  >
                    {tag}
                  </button>
                )
              )}
            </div>
          </div>

          <div className="space-y-5">
            {teaPosts.map((post) => (
              <TeaCard
                key={post.id}
                id={post.id}
                author={post.author}
                emoji={post.emoji}
                time={post.time}
                type={post.type}
                content={post.content}
                likes={post.likes}
                comments={post.comments}
              />
            ))}
          </div>
        </div>

        <aside className="hidden space-y-5 lg:block">
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-400/10">
              <ShieldCheck className="text-green-200" />
            </div>
            <h3 className="text-xl font-bold">Anonymous by design</h3>
            <p className="mt-3 leading-7 text-white/55">
              No public profile, no real name, and every post appears with a random anonymous identity.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <h3 className="text-xl font-bold">🔥 Trending Topics</h3>
            <div className="mt-4 space-y-3 text-white/65">
              <p>Work Drama</p>
              <p>Relationship Tea</p>
              <p>College Confessions</p>
              <p>Family Secrets</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <h3 className="text-xl font-bold">Tea types</h3>
            <div className="mt-4 space-y-3 text-white/65">
              <p>📝 Text confession</p>
              <p>📷 Image tea</p>
              <p>🎥 Video story</p>
              <p>🎤 Voice note</p>
              <p>💬 Anonymous comments</p>
            </div>
          </div>
        </aside>
      </section>
      <BottomNav />
    </main>
  );
}
