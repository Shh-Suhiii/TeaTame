"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Sparkles } from "lucide-react";
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
    <main className="min-h-screen overflow-x-hidden bg-[#0c0611] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <Navbar />

      <section className="mx-auto grid w-full max-w-full gap-4 px-3 pb-32 pt-3 sm:max-w-6xl sm:px-5 sm:py-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-3 sm:space-y-5">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:rounded-[2rem] sm:p-5">
            <div>
              <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-purple-300/20 bg-purple-400/10 px-3 py-1.5 text-[11px] text-purple-100 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
                <Sparkles size={16} />
                Anonymous social feed
              </p>
              <h2 className="max-w-2xl text-[2rem] font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
                What&apos;s the tea today?
              </h2>
              <p className="mt-2 max-w-2xl text-xs leading-5 text-white/55 sm:mt-3 sm:text-base sm:leading-7 sm:text-white/60">
                Spill your thoughts anonymously. No names. No judgments.
              </p>
            </div>

            <div className="mt-4 flex flex-col gap-2 rounded-[1.2rem] border border-white/10 bg-black/20 p-2 sm:mt-5 sm:flex-row sm:rounded-3xl sm:p-3">
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/5 px-3 py-3 text-white/40 sm:gap-3 sm:px-4">
                <Search size={18} />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search anonymous tea..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35 sm:text-base"
                />
              </div>
              <Link
                href="/create"
                className="rounded-2xl bg-white px-5 py-3 text-center text-sm font-semibold text-[#120817] transition hover:bg-purple-100 sm:text-base"
              >
                Spill Your Tea
              </Link>
            </div>
          </div>

          <div className="-mx-2.5 flex gap-2 overflow-x-auto px-2.5 pb-1 sm:mx-0 sm:gap-3 sm:px-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs transition sm:px-5 sm:text-sm ${
                  selectedCategory === category
                    ? "border-purple-300/40 bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : "border-white/10 bg-white/[0.06] text-white/70 hover:border-purple-300/40 hover:text-white"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="-mx-2.5 flex items-center gap-2 overflow-x-auto border-y border-white/10 bg-white/[0.045] px-2.5 py-2.5 backdrop-blur-xl sm:mx-0 sm:rounded-[2rem] sm:border sm:bg-white/[0.06] sm:px-4 sm:py-3 sm:gap-3">
            <span className="shrink-0 text-sm font-semibold text-white/80">🔥 Trending</span>
            {["#WorkDrama", "#RelationshipTea", "#CollegeLife", "#Confessions"].map((tag) => (
              <button
                key={tag}
                className="shrink-0 rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-2 text-xs text-purple-100 transition hover:bg-purple-500/20 sm:px-4 sm:text-sm"
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="space-y-4 sm:space-y-5">
            {loadingPosts && (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 text-white/60 backdrop-blur-xl sm:rounded-[2rem] sm:p-6">
                Loading fresh tea...
              </div>
            )}

            {!loadingPosts && filteredPosts.length === 0 && (
              <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 text-center backdrop-blur-xl sm:rounded-[2rem] sm:p-6">
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

        <aside className="hidden space-y-4 lg:sticky lg:top-24 lg:block lg:self-start">
          <div className="rounded-[2rem] border border-purple-300/20 bg-purple-500/10 p-5 backdrop-blur-xl">
            <h3 className="text-xl font-bold">Ready to spill?</h3>
            <p className="mt-2 text-sm leading-6 text-white/55">
              Share text, images, videos, or voice notes anonymously.
            </p>
            <Link
              href="/create"
              className="mt-4 block rounded-2xl bg-purple-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-purple-400"
            >
              Create Tea
            </Link>
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
            <h3 className="text-xl font-bold">Tea Types</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/70">
              <p className="rounded-2xl bg-white/5 px-3 py-2">📝 Text</p>
              <p className="rounded-2xl bg-white/5 px-3 py-2">📷 Image</p>
              <p className="rounded-2xl bg-white/5 px-3 py-2">🎥 Video</p>
              <p className="rounded-2xl bg-white/5 px-3 py-2">🎤 Voice</p>
            </div>
          </div>
        </aside>
      </section>
      <BottomNav />
    </main>
  );
}