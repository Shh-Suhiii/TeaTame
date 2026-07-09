/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle, Headphones, X } from "lucide-react";
import { supabase } from "@/lib/supabase";

type TeaCardProps = {
  id: string | number;
  author: string;
  emoji: string;
  time: string;
  type: string;
  content: string;
  likes: number;
  comments: number;
  mediaUrl?: string | null;
  mediaType?: string | null;
  mediaItems?: {
    url: string;
    type: string;
    name?: string;
  }[];
  isAdminPost?: boolean;
  adminName?: string | null;
};

const anonymousAnimals = [
  "Bear 🐻",
  "Panda 🐼",
  "Fox 🦊",
  "Tiger 🐯",
  "Wolf 🐺",
  "Koala 🐨",
  "Cat 🐱",
  "Rabbit 🐰",
  "Penguin 🐧",
  "Owl 🦉",
];

function getStableAnonymousName(id: string | number, author: string) {
  if (author && author.trim() !== "" && author !== "Anonymous User") {
    return author;
  }

  const idString = String(id);
  const charTotal = idString.split("").reduce((total, char) => total + char.charCodeAt(0), 0);
  const animal = anonymousAnimals[charTotal % anonymousAnimals.length];

  return `Anonymous ${animal}`;
}

function getAuthorEmoji(displayAuthor: string, fallbackEmoji: string) {
  const emojiMatch = displayAuthor.match(/[\u{1F300}-\u{1FAFF}]/u);
  return emojiMatch?.[0] || fallbackEmoji || "🐻";
}

export default function TeaCard({
  id,
  author,
  emoji,
  time,
  type,
  content,
  likes,
  comments,
  mediaUrl,
  mediaType,
  mediaItems,
  isAdminPost = false,
  adminName,
}: TeaCardProps) {
  const likeKey = `TeaTame_liked_${id}`;
  const [likesCount, setLikesCount] = useState(likes);
  const [isUpdatingLike, setIsUpdatingLike] = useState(false);
  const [isLiked, setIsLiked] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(likeKey) === "true";
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLikesCount(likes);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [likes]);

  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: string;
    name?: string;
  } | null>(null);

  const handleLike = async () => {
    if (isUpdatingLike) return;

    setIsUpdatingLike(true);

    const previousLiked = isLiked;
    const previousLikes = likesCount;
    const nextLiked = !previousLiked;

    const optimisticLikes = nextLiked
      ? previousLikes + 1
      : Math.max(previousLikes - 1, 0);

    setLikesCount(optimisticLikes);
    setIsLiked(nextLiked);

    if (nextLiked) {
      localStorage.setItem(likeKey, "true");
    } else {
      localStorage.removeItem(likeKey);
    }

    try {
      const { data: latestPost, error: fetchError } = await supabase
        .from("posts")
        .select("likes_count")
        .eq("id", String(id))
        .single();

      if (fetchError) throw fetchError;

      const latestLikes = latestPost?.likes_count || 0;
      const nextLikes = nextLiked
        ? latestLikes + 1
        : Math.max(latestLikes - 1, 0);

      const { data: updatedPost, error: updateError } = await supabase
        .from("posts")
        .update({ likes_count: nextLikes })
        .eq("id", String(id))
        .select("likes_count")
        .single();

      if (updateError) throw updateError;

      setLikesCount(updatedPost?.likes_count || nextLikes);
    } catch (error) {
      console.error(error);
      setLikesCount(previousLikes);
      setIsLiked(previousLiked);

      if (previousLiked) {
        localStorage.setItem(likeKey, "true");
      } else {
        localStorage.removeItem(likeKey);
      }
    } finally {
      setIsUpdatingLike(false);
    }
  };

  const displayMedia =
    mediaItems && mediaItems.length > 0
      ? mediaItems
      : mediaUrl && mediaType
        ? [{ url: mediaUrl, type: mediaType, name: "Tea media" }]
        : [];

  const visibleMedia = displayMedia.slice(0, 4);
  const extraMediaCount = Math.max(displayMedia.length - visibleMedia.length, 0);

  const displayAuthor = isAdminPost
    ? adminName || "TeaTame"
    : getStableAnonymousName(id, author);
  const displayEmoji = isAdminPost ? "☕" : getAuthorEmoji(displayAuthor, emoji);
  const hasVoiceTea = displayMedia.some((item) => item.type === "audio");
  const onlyVoiceTea = displayMedia.length > 0 && displayMedia.every((item) => item.type === "audio");
  const isHotTea = likesCount >= 10;
  const isDiscussedTea = comments >= 5;
  const lowerTime = time.toLowerCase();
  const isNewTea =
    lowerTime.includes("just now") ||
    lowerTime.includes("now") ||
    lowerTime.includes("min") ||
    lowerTime.startsWith("1h") ||
    lowerTime.includes("1 hour");
  const highlightBadge = isHotTea
    ? "🔥 Hot"
    : isDiscussedTea
      ? "💬 Discussed"
      : isNewTea
        ? "🆕 New"
        : null;
  const shouldShowReadMore = content.trim().length > 90 || content.split(/\n+/).length > 3;

  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4 shadow-xl shadow-purple-500/5 backdrop-blur-xl transition duration-300 active:scale-[0.99] hover:border-purple-400/40 hover:bg-white/[0.075] hover:shadow-purple-500/10 sm:rounded-[2rem] sm:p-5 md:p-5">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-2xl bg-purple-500/15 text-lg ring-1 ring-purple-300/10 sm:h-11 sm:w-11 sm:text-xl">
            {displayEmoji}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold md:text-base">{displayAuthor}</h3>
            <p className="truncate text-xs text-white/40 md:text-sm">
              {isAdminPost ? "Official TeaTame post" : `${time} • ${type}`}
            </p>
          </div>
        </div>

        {(isAdminPost || highlightBadge) && (
          <span className="shrink-0 rounded-full border border-purple-300/20 bg-purple-500/10 px-2.5 py-1 text-[10px] font-medium text-purple-100 sm:px-3 sm:text-[11px]">
            {isAdminPost ? "✓ Official" : highlightBadge}
          </span>
        )}
      </div>

      {content && (
        <Link
          href={`/tea/${id}`}
          className="mt-3 block overflow-hidden break-words rounded-2xl text-[15px] leading-7 text-white/85 transition hover:text-white active:scale-[0.995] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:4] [overflow-wrap:anywhere] sm:mt-4 md:text-lg md:leading-8"
        >
          {content}
        </Link>
      )}

      {content && shouldShowReadMore && (
        <Link
          href={`/tea/${id}`}
          className="mt-1 inline-flex text-xs font-medium text-purple-200/80 transition hover:text-purple-100"
        >
          Read full tea →
        </Link>
      )}

      {hasVoiceTea && !onlyVoiceTea && (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-100">
          <span>🎤</span>
          <span>Voice Tea</span>
        </div>
      )}

      {displayMedia.length > 0 && !onlyVoiceTea && (
        <div
          className={`mt-3 grid aspect-square overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/20 sm:mt-4 sm:rounded-[1.6rem] ${
            visibleMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {visibleMedia.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setPreviewMedia(item)}
              className={`relative overflow-hidden border-white/10 text-left active:scale-[0.99] ${
                visibleMedia.length > 1 ? "border" : ""
              }`}
            >
              {item.type === "image" && (
                <img
                  src={item.url}
                  alt="Tea media"
                  className="h-full w-full object-cover transition duration-300 hover:scale-105"
                />
              )}

              {item.type === "video" && (
                <div className="relative h-full w-full">
                  <video
                    src={item.url}
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/25">
                    <span className="rounded-full bg-black/65 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm md:text-sm">
                      ▶ Video
                    </span>
                  </div>
                </div>
              )}

              {item.type === "audio" && (
                <div className="flex h-full w-full flex-col items-center justify-center bg-purple-500/15 p-4 text-center">
                  <span className="text-3xl md:text-4xl">🎤</span>
                  <span className="mt-2 text-xs font-semibold text-white/80 md:text-sm">
                    Voice Tea
                  </span>
                </div>
              )}

              {extraMediaCount > 0 && index === visibleMedia.length - 1 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/65 text-3xl font-bold text-white">
                  +{extraMediaCount}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {onlyVoiceTea && (
        <button
          type="button"
          onClick={() => setPreviewMedia(displayMedia[0])}
          className="mt-3 flex w-full items-center justify-between gap-3 rounded-[1.25rem] border border-purple-300/20 bg-gradient-to-r from-purple-500/15 to-fuchsia-500/10 px-4 py-2.5 text-left transition active:scale-[0.99] hover:bg-purple-500/15 sm:mt-4 sm:rounded-[1.5rem] sm:px-5 sm:py-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/20 text-xl">
              🎤
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white/90">Voice Tea</p>
              <p className="text-xs text-white/45">Anonymous voice note</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs text-white/70">
            Listen
          </span>
        </button>
      )}
      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 sm:mt-4 sm:flex sm:flex-wrap sm:items-center sm:pt-4">
        <button
          type="button"
          onClick={handleLike}
          disabled={isUpdatingLike}
          aria-label={isLiked ? "Unlike tea" : "Like tea"}
          className={`flex items-center justify-center gap-2 rounded-full px-3 py-1.5 text-sm transition active:scale-95 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 ${
            isLiked
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
              : "bg-white/5 text-white/70 hover:text-white"
          }`}
        >
          <Heart
            size={17}
            className={isLiked ? "scale-110 transition" : "transition"}
            fill={isLiked ? "currentColor" : "none"}
          />
          {likesCount}
        </button>

        <Link
          href={`/tea/${id}`}
          className="flex items-center justify-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-sm text-white/70 transition active:scale-95 hover:bg-white/10 hover:text-white"
        >
          <MessageCircle size={17} />
          {comments}
          <span className="hidden min-[360px]:inline">comments</span>
        </Link>

        <Link
          href="/chat"
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-full border border-purple-300/25 bg-purple-500/5 px-3 py-1.5 text-sm text-purple-100 transition active:scale-95 hover:bg-purple-500/15 sm:ml-auto"
        >
          <Headphones size={16} />
          Talk to Admin
        </Link>
      </div>

      {previewMedia && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-xl sm:p-6"
          onClick={() => setPreviewMedia(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewMedia(null)}
            className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
            aria-label="Close preview"
          >
            <X size={22} />
          </button>

          <div
            className="max-h-[92vh] w-full max-w-5xl overflow-hidden rounded-[1.5rem] border border-white/10 bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {previewMedia.type === "image" && (
              <img
                src={previewMedia.url}
                alt={previewMedia.name || "Tea media preview"}
                className="max-h-[92vh] w-full object-contain"
              />
            )}

            {previewMedia.type === "video" && (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                playsInline
                className="max-h-[92vh] w-full bg-black object-contain"
              />
            )}

            {previewMedia.type === "audio" && (
              <div className="flex min-h-[220px] flex-col items-center justify-center gap-4 p-5 text-center sm:min-h-[260px] sm:p-6">
                <div className="text-5xl">🎤</div>
                <h3 className="text-xl font-bold text-white">Voice Tea</h3>
                <p className="text-sm text-white/50">Anonymous voice note</p>
                <audio src={previewMedia.url} controls className="w-full max-w-xl" />
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}