
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Sparkles, User } from "lucide-react";
import Navbar from "@/components/common/Navbar";
import BottomNav from "@/components/common/BottomNav";
import TeaCard from "@/components/feed/TeaCard";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [feedFilter, setFeedFilter] =
    useState<"latest" | "liked" | "commented">("latest");

  const [teaPosts, setTeaPosts] = useState<TeaPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [visiblePostCount, setVisiblePostCount] = useState(8);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
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
      } catch (err) {
        console.error("Exception while fetching posts:", err);
        setTeaPosts([]);
        setLoadingPosts(false);
      }
    };

    fetchPosts();

    // Subscribe to realtime changes on posts table
    const channel = supabase
      .channel("realtime-posts")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => {
          fetchPosts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filteredPosts = [...teaPosts].filter((post) => {
    const content = post.content?.toLowerCase() || "";
    const search = searchQuery.toLowerCase().trim();
    const category = post.category?.toLowerCase() || "random";

    const matchesSearch = search ? content.includes(search) : true;
    const matchesCategory =
      selectedCategory === "All" ? true : category === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    if (feedFilter === "liked") {
      return (b.likes_count || 0) - (a.likes_count || 0);
    }

    if (feedFilter === "commented") {
      return (b.comments_count || 0) - (a.comments_count || 0);
    }

    return (
      new Date(b.created_at || 0).getTime() -
      new Date(a.created_at || 0).getTime()
    );
  });

  const visiblePosts = filteredPosts.slice(0, visiblePostCount);
  const hasMorePosts = visiblePostCount < filteredPosts.length;

  const trendingPosts = [...teaPosts]
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 3);


  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0611] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <Navbar />

      <section className="mx-auto grid w-full max-w-full gap-5 px-3.5 pb-40 pt-3.5 sm:max-w-6xl sm:gap-5 sm:px-5 sm:py-6 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0 space-y-4 sm:space-y-5">
          <div className="relative overflow-hidden rounded-[2rem] border border-purple-300/15 bg-gradient-to-br from-purple-500/16 via-white/[0.06] to-fuchsia-500/10 p-5 shadow-[0_18px_70px_rgba(168,85,247,0.16)] backdrop-blur-xl sm:p-5">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-purple-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 left-10 h-32 w-32 rounded-full bg-fuchsia-500/10 blur-3xl" />
            <div className="flex items-start justify-between gap-2.5 sm:gap-3">
              <div className="min-w-0 flex-1">
                <p className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-purple-300/25 bg-purple-400/15 px-3 py-1.5 text-[10px] font-medium text-purple-100 sm:mb-3 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
                  <Sparkles size={14} />
                  Anonymous feed
                </p>
                <h2 className="max-w-2xl bg-gradient-to-r from-purple-200 via-white to-fuchsia-300 bg-clip-text text-[2.25rem] font-black leading-[1.04] tracking-tight text-transparent sm:text-4xl md:text-5xl">
                  What&apos;s the tea?
                </h2>
                <p className="mt-2.5 max-w-2xl text-[13px] leading-6 text-white/62 sm:mt-3 sm:text-base sm:leading-7 sm:text-white/60">
                  Spill anonymously. No names. No judgments.
                </p>
              </div>

              <Link
                href="/profile"
                aria-label="Open profile"
                className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-300/20 bg-purple-500/10 text-purple-100 transition hover:scale-105 hover:bg-purple-500/20 sm:flex"
              >
                <User size={20} />
              </Link>
            </div>

            <div className="mt-5 flex flex-col gap-2 rounded-[1.5rem] border border-white/10 bg-black/30 p-3 sm:flex-row sm:rounded-3xl">
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-white/[0.08] px-4 py-4 text-white/40 sm:gap-3 sm:py-3">
                <Search size={18} />
                <input
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setVisiblePostCount(8);
                    setFeedFilter("latest");
                  }}
                  placeholder="Search anonymous tea..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/35 sm:text-base"
                />
              </div>
              <Link
                href="/create"
                className="hidden rounded-2xl bg-white px-5 py-2.5 text-center text-sm font-semibold text-[#120817] transition hover:bg-purple-100 sm:block sm:py-3 sm:text-base"
              >
                Spill Your Tea
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 sm:hidden">
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2 text-center">
                <p className="text-sm font-bold tabular-nums">{teaPosts.length}</p>
                <p className="text-[10px] text-white/35">Teas</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2 text-center">
                <p className="text-sm font-bold">24/7</p>
                <p className="text-[10px] text-white/35">Live Feed</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.055] px-3 py-2 text-center">
                <p className="text-sm font-bold">No ID</p>
                <p className="text-[10px] text-white/35">Needed</p>
              </div>
            </div>
          </div>

          <div className="sticky top-[68px] z-10 -mx-3.5 flex snap-x gap-2.5 overflow-x-auto border-y border-white/5 bg-[#0c0611]/95 px-4 py-3 shadow-[0_10px_30px_rgba(0,0,0,0.22)] backdrop-blur-xl [scroll-padding-inline:1rem] [scrollbar-width:none] sm:static sm:mx-0 sm:gap-3 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:shadow-none sm:backdrop-blur-0 [&::-webkit-scrollbar]:hidden">
            <span className="w-0.5 shrink-0 sm:hidden" aria-hidden="true" />
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  setSelectedCategory(category);
                  setVisiblePostCount(8);
                  setFeedFilter("latest");
                }}
                className={`shrink-0 snap-start rounded-full border px-[1.125rem] py-3 text-xs font-semibold shadow-sm transition active:scale-95 sm:px-5 sm:py-2 sm:text-sm ${selectedCategory === category
                  ? "border-purple-300/40 bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/30"
                  : "border-white/10 bg-white/[0.065] text-white/70 hover:border-purple-300/40 hover:bg-white/[0.09] hover:text-white"
                  }`}
              >
                {category}
              </button>
            ))}
            <span className="w-0.5 shrink-0 sm:hidden" aria-hidden="true" />
          </div>

          <div className="-mt-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { key: "latest", label: "🆕 Latest" },
              { key: "liked", label: "❤️ Most Liked" },
              { key: "commented", label: "💬 Discussed" },
            ].map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => {
                  setFeedFilter(
                    filter.key as "latest" | "liked" | "commented"
                  );
                  setVisiblePostCount(8);
                }}
                className={`shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition active:scale-95 ${feedFilter === filter.key
                    ? "border-purple-300/30 bg-purple-500/20 text-purple-100"
                    : "border-white/10 bg-white/[0.05] text-white/55 hover:bg-white/[0.08]"
                  }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.035] px-4 py-3 backdrop-blur-xl sm:border-0 sm:bg-transparent sm:px-1 sm:py-0 sm:backdrop-blur-0">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-white/95">
                  {feedFilter === "liked"
                    ? "Most Liked"
                    : feedFilter === "commented"
                      ? "Most Discussed"
                      : "Latest Teas"}
                </h3>
                <p className="text-[11px] text-white/35">Fresh anonymous posts</p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/50">
                {filteredPosts.length} {filteredPosts.length === 1 ? "post" : "posts"}
              </span>
            </div>
          </div>

          <div className="space-y-6 sm:space-y-6">
            {loadingPosts && (
              <div className="flex flex-col items-center justify-center rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl sm:rounded-[2rem]">
                <span className="mb-3 flex items-center justify-center">
                  <span className="h-4 w-4 rounded-full bg-purple-500 animate-pulse" />
                </span>
                <span className="text-white/60">Loading fresh tea...</span>
              </div>
            )}

            {!loadingPosts && filteredPosts.length === 0 && (
              <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] px-6 py-8 text-center backdrop-blur-xl sm:rounded-[2rem]">
                <h3 className="text-xl font-bold">Nothing spilled yet ☕</h3>
                <p className="mt-2 text-white/55">
                  Try another keyword or category.
                </p>
                <p className="mt-1 text-xs text-white/35">
                  Be the first to spill some tea.
                </p>
              </div>
            )}

            {!loadingPosts &&
              visiblePosts.map((post) => {
                const author =
                  post.anonymous_users?.anonymous_name &&
                    post.anonymous_users.anonymous_name !== "Anonymous User"
                    ? post.anonymous_users.anonymous_name
                    : "Anonymous Bear 🐻";

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

            {!loadingPosts && hasMorePosts && (
              <button
                type="button"
                onClick={() => setVisiblePostCount((prev) => prev + 8)}
                className="w-full rounded-[1.35rem] border border-purple-300/20 bg-purple-500/10 px-5 py-4 text-sm font-semibold text-purple-100 shadow-lg shadow-purple-500/10 transition active:scale-[0.99] hover:bg-purple-500/20"
              >
                Load more teas
              </button>
            )}
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
            <h3 className="text-xl font-bold">Tea Types</h3>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/70">
              <p className="rounded-2xl bg-white/5 px-3 py-2">📝 Text</p>
              <p className="rounded-2xl bg-white/5 px-3 py-2">📷 Image</p>
              <p className="rounded-2xl bg-white/5 px-3 py-2">🎥 Video</p>
              <p className="rounded-2xl bg-white/5 px-3 py-2">🎤 Voice</p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold">🔥 Trending</h3>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/45">
                Top 3
              </span>
            </div>

            <div className="mt-4 space-y-3">
              {trendingPosts.length === 0 && (
                <p className="rounded-2xl bg-white/5 px-3 py-3 text-sm text-white/45">
                  No trending teas yet.
                </p>
              )}

              {trendingPosts.map((post, index) => {
                const author =
                  post.anonymous_users?.anonymous_name &&
                    post.anonymous_users.anonymous_name !== "Anonymous User"
                    ? post.anonymous_users.anonymous_name
                    : "Anonymous Bear 🐻";

                return (
                  <Link
                    key={post.id}
                    href={`/tea/${post.id}`}
                    className="group block rounded-2xl border border-white/10 bg-white/[0.045] p-3 transition hover:border-purple-300/30 hover:bg-white/[0.075]"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-sm font-bold text-purple-100">
                        #{index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white/85">
                          {author}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-white/48">
                          {post.content || `${post.media_type || "Media"} post`}
                        </p>
                        <p className="mt-2 text-[11px] text-white/35">
                          ❤️ {post.likes_count || 0} • 💬 {post.comments_count || 0}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </section>
      <BottomNav />
    </main>
  );
}