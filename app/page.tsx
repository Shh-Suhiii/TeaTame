"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import BottomNav from "@/components/common/BottomNav";
import TeaCard from "@/components/feed/TeaCard";
import { useAnonymousUser } from "@/hooks/useAnonymousUser";
import { supabase } from "@/lib/supabase";

type TeaPost = {
  id: string;
  content: string | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string | null;
  media_url: string | null;
  media_type: string | null;
  category: string | null;
  media_items: {
    url: string;
    type: string;
    name?: string;
  }[] | null;
  anonymous_users: {
    anonymous_name: string;
    avatar: string | null;
  } | null;
};

function getEmoji(name?: string | null) {
  if (!name) return "☕";
  const parts = name.split(" ");
  return parts[parts.length - 1] || "☕";
}

function formatTime(dateString?: string | null) {
  if (!dateString) return "Just now";

  const createdAt = new Date(dateString).getTime();
  const now = Date.now();
  const diffInSeconds = Math.max(Math.floor((now - createdAt) / 1000), 0);

  if (diffInSeconds < 60) return "Just now";

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hr ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? "s" : ""} ago`;

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const categories = ["All", "College", "Work", "Relationship", "Confession", "Family"];

export default function Home() {
  const username = useAnonymousUser();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [teaPosts, setTeaPosts] = useState<TeaPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);

  useEffect(() => {
    const fetchPosts = async () => {
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          content,
          likes_count,
          comments_count,
          created_at,
          media_url,
          media_type,
          category,
          media_items,
          anonymous_users (
            anonymous_name,
            avatar
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to fetch posts:", error.message);
        setLoadingPosts(false);
        return;
      }

      setTeaPosts((data || []) as unknown as TeaPost[]);
      setLoadingPosts(false);
    };

    fetchPosts();
  }, []);

  const filteredPosts = teaPosts.filter((post) => {
    const content = post.content?.toLowerCase() || "";
    const search = searchQuery.toLowerCase().trim();
    const category = post.category?.toLowerCase() || "random";

    const matchesSearch = search ? content.includes(search) : true;
    const matchesCategory =
      selectedCategory === "All" ? true : category === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

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
              <p className="mt-4 inline-flex rounded-full border border-purple-300/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-100">
                Welcome, {username}
              </p>
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-3xl border border-white/10 bg-black/20 p-3 sm:flex-row">
              <div className="flex flex-1 items-center gap-3 rounded-2xl bg-white/5 px-4 py-3 text-white/40">
                <Search size={18} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
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
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-full border px-5 py-2 text-sm transition ${
                  selectedCategory === category
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
            {loadingPosts && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-white/60 backdrop-blur-xl">
                Loading fresh tea...
              </div>
            )}

            {!loadingPosts && filteredPosts.length === 0 && (
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center backdrop-blur-xl">
                <h3 className="text-xl font-bold">☕ No tea found</h3>
                <p className="mt-2 text-white/55">Try another search or category.</p>
              </div>
            )}

            {!loadingPosts &&
              filteredPosts.map((post) => {
                const author = post.anonymous_users?.anonymous_name || "Anonymous User";

                return (
                  <TeaCard
                    key={post.id}
                    id={post.id}
                    author={author}
                    emoji={getEmoji(author)}
                    time={formatTime(post.created_at)}
                    type={post.category || `${post.media_type || "text"} Tea`}
                    content={post.content || ""}
                    likes={post.likes_count || 0}
                    comments={post.comments_count || 0}
                    mediaUrl={post.media_url}
                    mediaType={post.media_type}
                    mediaItems={post.media_items || []}
                  />
                );
              })}
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