"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  ChevronRight,
  Coffee,
  MessageCircle,
  RefreshCw,
  Shield,
  Sparkles,
} from "lucide-react";
import BottomNav from "@/components/common/BottomNav";
import { generateAnonymousName } from "@/lib/anonymous-user";
import { supabase } from "@/lib/supabase";

type TeaTimeUser = {
  id?: string;
  anonymous_name?: string;
  created_at?: string;
};

type ProfileStats = {
  posts: number;
  comments: number;
  likes: number;
};

function getSavedUser() {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem("TeaTame_user");
  if (!saved) return null;

  try {
    const parsedUser = JSON.parse(saved) as TeaTimeUser;

    if (
      !parsedUser?.anonymous_name ||
      parsedUser.anonymous_name.trim() === "" ||
      parsedUser.anonymous_name === "Anonymous User"
    ) {
      localStorage.removeItem("TeaTame_user");
      return null;
    }

    return parsedUser;
  } catch {
    localStorage.removeItem("TeaTame_user");
    return null;
  }
}

function getEmojiFromName(name?: string) {
  if (!name) return "☕";
  const emojiMatch = name.match(/[\u{1F300}-\u{1FAFF}]/u);
  return emojiMatch?.[0] || "☕";
}

function formatJoinedDate(dateString?: string) {
  if (!dateString) return "Today";

  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ProfilePage() {
  const [user, setUser] = useState<TeaTimeUser | null>(null);
  const [stats, setStats] = useState<ProfileStats>({
    posts: 0,
    comments: 0,
    likes: 0,
  });
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const savedUser = getSavedUser();

    if (
      savedUser?.anonymous_name &&
      savedUser.anonymous_name.trim() !== "" &&
      savedUser.anonymous_name !== "Anonymous User"
    ) {
      setUser(savedUser);
      return;
    }

    localStorage.removeItem("TeaTame_user");

    const anonymousName = generateAnonymousName();
    const newUser = {
      anonymous_name: anonymousName,
      created_at: new Date().toISOString(),
    };

    localStorage.setItem("TeaTame_user", JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user?.id) return;

      const { data: postsData } = await supabase
        .from("posts")
        .select("id, likes_count")
        .eq("user_id", user.id);

      const { count: commentsCount } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const totalLikes = (postsData || []).reduce(
        (sum, post) => sum + (post.likes_count || 0),
        0
      );

      setStats({
        posts: postsData?.length || 0,
        comments: commentsCount || 0,
        likes: totalLikes,
      });
    };

    fetchStats();
  }, [user?.id]);

  const resetIdentity = () => {
    const confirmReset = confirm(
      "Reset your anonymous identity? Your old posts will stay as they are, but your future activity will use a new identity."
    );

    if (!confirmReset) return;

    const anonymousName = generateAnonymousName();
    const newUser = {
      anonymous_name: anonymousName,
      created_at: new Date().toISOString(),
    };

    localStorage.setItem("TeaTame_user", JSON.stringify(newUser));
    setUser(newUser);
    setStatusMessage("Anonymous identity reset successfully ☕");
  };

  const displayName =
    user?.anonymous_name && user.anonymous_name !== "Anonymous User"
      ? user.anonymous_name
      : "Anonymous Bear 🐻";
  const emoji = getEmojiFromName(displayName);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0611] pb-28 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0611]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3 sm:px-5 sm:py-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white sm:px-4"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <h1 className="font-semibold">Anonymous Profile</h1>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-5 sm:py-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] backdrop-blur-xl">
          <div className="border-b border-white/10 bg-purple-500/10 px-5 py-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-400/10 px-3 py-1.5 text-xs text-purple-100">
              <Sparkles size={14} />
              Your private TeaTime identity
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-[2rem] border border-purple-300/30 bg-gradient-to-br from-purple-500/30 to-fuchsia-500/20 text-5xl shadow-2xl shadow-purple-500/20">
                {emoji}
              </div>

              <h2 className="mt-4 text-2xl font-bold">{displayName}</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/55 sm:text-base">
                This is your anonymous identity on TeaTime. Other users cannot see your real name.
              </p>

              <div className="mt-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/45">
                Joined {formatJoinedDate(user?.created_at)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur-xl">
            <p className="text-2xl font-bold">{stats.posts}</p>
            <p className="mt-1 text-xs text-white/45">Teas</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur-xl">
            <p className="text-2xl font-bold">{stats.comments}</p>
            <p className="mt-1 text-xs text-white/45">Comments</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 text-center backdrop-blur-xl">
            <p className="text-2xl font-bold">{stats.likes}</p>
            <p className="mt-1 text-xs text-white/45">Likes</p>
          </div>
        </div>

        {statusMessage && (
          <div className="rounded-2xl border border-purple-300/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
            {statusMessage}
          </div>
        )}

        <div className="space-y-3">
          <Link
            href="/notifications"
            className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl transition hover:bg-white/[0.08]"
          >
            <div className="flex items-center gap-3">
              <Bell className="text-purple-200" />
              <div>
                <span className="font-medium">Notifications</span>
                <p className="text-xs text-white/40">Likes, comments, and TeaTime updates</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/40" />
          </Link>

          <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Shield className="text-purple-200" />
              <div>
                <span className="font-medium">Privacy Mode</span>
                <p className="text-xs text-white/40">Real identity hidden by default</p>
              </div>
            </div>
            <span className="rounded-full bg-green-400/10 px-3 py-1 text-xs text-green-200">
              Active
            </span>
          </div>

          <Link
            href="/chat"
            className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl transition hover:bg-white/[0.08]"
          >
            <div className="flex items-center gap-3">
              <MessageCircle className="text-purple-200" />
              <div>
                <span className="font-medium">TeaTime Support</span>
                <p className="text-xs text-white/40">Ask AI support or request admin review</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/40" />
          </Link>

          <button
            type="button"
            onClick={resetIdentity}
            className="flex w-full items-center justify-between rounded-3xl border border-purple-300/20 bg-purple-500/10 p-4 text-left backdrop-blur-xl transition hover:bg-purple-500/15"
          >
            <div className="flex items-center gap-3">
              <RefreshCw className="text-purple-200" />
              <div>
                <span className="font-medium">Reset Anonymous Identity</span>
                <p className="text-xs text-white/40">Get a new anonymous name for future activity</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-white/40" />
          </button>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <Coffee className="text-purple-200" />
              <div>
                <span className="font-medium">TeaTime Guidelines</span>
                <p className="mt-1 text-xs leading-5 text-white/40">
                  Keep posts anonymous, avoid real names, and report harmful content when needed.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}