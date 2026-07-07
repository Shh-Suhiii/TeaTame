/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Coffee, Heart, MessageCircle, Send, Headphones } from "lucide-react";
import { supabase } from "@/lib/supabase";
import BottomNav from "@/components/common/BottomNav";
import { generateAnonymousName } from "@/lib/anonymous-user";

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

type Comment = {
  id: string;
  content: string;
  created_at: string | null;
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

function getEmojiFromName(name: string) {
  const emojiMatch = name.match(/[\u{1F300}-\u{1FAFF}]/u);
  return emojiMatch?.[0] || "☕";
}

function readSavedUser() {
  const savedUser = localStorage.getItem("TeaTame_user");
  if (!savedUser) return null;

  try {
    const parsedUser = JSON.parse(savedUser);

    if (parsedUser?.anonymous_name === "Anonymous User") {
      localStorage.removeItem("TeaTame_user");
      return null;
    }

    return parsedUser;
  } catch {
    localStorage.removeItem("TeaTame_user");
    return null;
  }
}

async function getOrCreateAnonymousUser() {
  const parsedUser = readSavedUser();

  if (parsedUser?.id && parsedUser?.anonymous_name) {
    return parsedUser;
  }

  const anonymousName = generateAnonymousName();

  const { data, error } = await supabase
    .from("anonymous_users")
    .insert({
      anonymous_name: anonymousName,
      avatar: getEmojiFromName(anonymousName),
    })
    .select("id, anonymous_name, avatar, created_at")
    .single();

  if (error) throw error;

  localStorage.setItem("TeaTame_user", JSON.stringify(data));
  return data;
}

export default function TeaDetailPage() {
  const params = useParams();
  const postId = params.id as string;

  const likeKey = `TeaTame_liked_${postId}`;
  const [isLiked, setIsLiked] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(likeKey) === "true";
  });
  const [updatingLike, setUpdatingLike] = useState(false);

  const [post, setPost] = useState<TeaPost | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [postingComment, setPostingComment] = useState(false);

  useEffect(() => {
    const fetchPostAndComments = async () => {
      const { data: postData, error: postError } = await supabase
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
        .eq("id", postId)
        .single();

      if (postError) {
        console.error("Post fetch failed:", postError.message);
        setLoading(false);
        return;
      }

      const { data: commentsData, error: commentsError } = await supabase
        .from("comments")
        .select(`
          id,
          content,
          created_at,
          anonymous_users (
            anonymous_name,
            avatar
          )
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: false });

      if (commentsError) {
        console.error("Comments fetch failed:", commentsError.message);
      }

      setPost(postData as unknown as TeaPost);
      setComments((commentsData || []) as unknown as Comment[]);
      setLoading(false);
    };

    fetchPostAndComments();
  }, [postId]);

  const handleCommentSubmit = async () => {
    if (!comment.trim()) {
      alert("Please write a comment first.");
      return;
    }

    setPostingComment(true);

    let user;

    try {
      user = await getOrCreateAnonymousUser();
    } catch (error) {
      console.error(error);
      alert("Anonymous user could not be prepared.");
      setPostingComment(false);
      return;
    }

    const { data, error } = await supabase
      .from("comments")
      .insert({
        post_id: postId,
        user_id: user.id,
        content: comment.trim(),
      })
      .select(`
        id,
        content,
        created_at,
        anonymous_users (
          anonymous_name,
          avatar
        )
      `)
      .single();

    if (error) {
      console.error("Comment failed:", error.message);
      alert("Failed to post comment.");
      setPostingComment(false);
      return;
    }

    const nextCommentsCount = (post?.comments_count || 0) + 1;

    const { error: updateCountError } = await supabase
      .from("posts")
      .update({ comments_count: nextCommentsCount })
      .eq("id", postId);

    if (updateCountError) {
      console.error("Comment count update failed:", updateCountError.message);
    }

    setComments((prev) => [data as unknown as Comment, ...prev]);
    setPost((prev) =>
      prev
        ? {
            ...prev,
            comments_count: (prev.comments_count || 0) + 1,
          }
        : prev
    );
    setComment("");
    setPostingComment(false);
  };

  const handleLike = async () => {
    if (!post || updatingLike) return;

    setUpdatingLike(true);

    const currentlyLiked = localStorage.getItem(likeKey) === "true";
    const nextLiked = !currentlyLiked;
    const nextLikesCount = nextLiked
      ? (post.likes_count || 0) + 1
      : Math.max((post.likes_count || 0) - 1, 0);

    setIsLiked(nextLiked);
    setPost({ ...post, likes_count: nextLikesCount });

    if (nextLiked) {
      localStorage.setItem(likeKey, "true");
    } else {
      localStorage.removeItem(likeKey);
    }

    const { error } = await supabase
      .from("posts")
      .update({ likes_count: nextLikesCount })
      .eq("id", postId);

    if (error) {
      console.error("Like update failed:", error.message);
      setIsLiked(isLiked);
      setPost(post);
      if (isLiked) {
        localStorage.setItem(likeKey, "true");
      } else {
        localStorage.removeItem(likeKey);
      }
      alert("Failed to update like.");
    }

    setUpdatingLike(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0c0611] px-5 py-8 text-white">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-white/60 backdrop-blur-xl">
          Loading tea...
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main className="min-h-screen bg-[#0c0611] px-5 py-8 text-white">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center backdrop-blur-xl">
          <h1 className="text-2xl font-bold">Tea not found</h1>
          <Link href="/" className="mt-4 inline-block text-purple-200">
            Go back home
          </Link>
        </div>
      </main>
    );
  }

  const author = post.anonymous_users?.anonymous_name || "Anonymous User";
  const mediaItems = post.media_items || [];

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0611] pb-32 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0611]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white sm:px-4"
          >
            <ArrowLeft size={17} />
            Back
          </Link>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-purple-300/30 bg-purple-500/20 sm:h-10 sm:w-10">
              <Coffee className="text-purple-200" size={20} />
            </div>
            <div>
              <h1 className="truncate font-bold leading-tight">Tea Detail</h1>
              <p className="text-xs text-white/45">Anonymous comments</p>
            </div>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-3xl space-y-4 px-3 py-4 sm:space-y-5 sm:px-5 sm:py-8">
        <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 shadow-xl shadow-purple-500/5 backdrop-blur-xl sm:rounded-[2rem] sm:p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-xl sm:h-12 sm:w-12 sm:text-2xl">
              {getEmoji(author)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate font-semibold">{author}</h2>
              <p className="text-sm text-white/40">
                {formatTime(post.created_at)} • {post.category || `${post.media_type || "text"} Tea`}
              </p>
            </div>
          </div>

          {post.content && (
            <p className="mt-4 whitespace-pre-wrap text-[15px] leading-7 text-white/85 sm:mt-5 sm:text-lg sm:leading-8">{post.content}</p>
          )}

          {mediaItems.length > 0 ? (
            <div className="mt-5 space-y-4">
              {mediaItems.map((item, index) => (
                <div key={`${item.url}-${index}`}>
                  {item.type === "image" && (
                    <img
                      src={item.url}
                      alt="Tea media"
                      className="max-h-[72vh] w-full rounded-[1.35rem] border border-white/10 object-contain sm:rounded-3xl"
                    />
                  )}

                  {item.type === "video" && (
                    <video
                      src={item.url}
                      controls
                      className="max-h-[72vh] w-full rounded-[1.35rem] border border-white/10 object-contain sm:rounded-3xl"
                    />
                  )}

                  {item.type === "audio" && (
                    <audio src={item.url} controls className="w-full" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <>
              {post.media_url && post.media_type === "image" && (
                <img
                  src={post.media_url}
                  alt="Anonymous tea media"
                  className="mt-5 max-h-[72vh] w-full rounded-[1.35rem] border border-white/10 object-contain sm:rounded-3xl"
                />
              )}

              {post.media_url && post.media_type === "video" && (
                <video
                  src={post.media_url}
                  controls
                  className="mt-5 max-h-[72vh] w-full rounded-[1.35rem] border border-white/10 object-contain sm:rounded-3xl"
                />
              )}

              {post.media_url && post.media_type === "audio" && (
                <audio src={post.media_url} controls className="mt-5 w-full" />
              )}
            </>
          )}

          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-white/10 pt-4 sm:flex sm:items-center sm:gap-3">
            <button
              onClick={handleLike}
              disabled={updatingLike}
              className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm transition disabled:opacity-60 ${
                isLiked
                  ? "bg-purple-500 text-white"
                  : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
              {post.likes_count || 0}
            </button>
            <button className="flex items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70">
              <MessageCircle size={17} />
              {Math.max(post.comments_count || 0, comments.length)} comments
            </button>
            <Link
              href="/chat"
              className="col-span-2 flex items-center justify-center gap-2 rounded-full border border-purple-300/30 px-4 py-2 text-sm text-purple-100 transition hover:bg-purple-500/20 sm:ml-auto sm:inline-flex"
            >
              <Headphones size={16} />
              Anonymous Chat
            </Link>
          </div>
        </article>

        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-3 backdrop-blur-xl sm:rounded-[2rem] sm:p-4">
          <div className="flex items-center gap-3 rounded-[1.35rem] border border-white/10 bg-black/25 px-3 py-3 sm:rounded-full sm:px-4">
            <input
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCommentSubmit();
                }
              }}
              placeholder="Comment anonymously..."
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35 sm:text-base"
            />
            <button
              onClick={handleCommentSubmit}
              disabled={postingComment}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 transition hover:bg-purple-400 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {comments.length === 0 && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-center text-white/55 backdrop-blur-xl">
              No comments yet. Be the first anonymous reply.
            </div>
          )}

          {comments.map((item) => {
            const commentAuthor = item.anonymous_users?.anonymous_name || "Anonymous User";

            return (
              <div
                key={item.id}
                className="rounded-[1.35rem] border border-white/10 bg-white/[0.06] p-3.5 backdrop-blur-xl sm:rounded-3xl sm:p-4"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-lg sm:h-10 sm:w-10 sm:text-xl">
                    {getEmoji(commentAuthor)}
                  </div>
                  <h3 className="truncate text-sm font-medium sm:text-base">{commentAuthor}</h3>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-6 text-white/70 sm:leading-7">{item.content}</p>
              </div>
            );
          })}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}