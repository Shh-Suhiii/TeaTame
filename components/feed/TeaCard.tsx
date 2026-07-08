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

  const displayAuthor = getStableAnonymousName(id, author);
  const displayEmoji = getAuthorEmoji(displayAuthor, emoji);

  return (
    <article className="rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-3.5 shadow-xl shadow-purple-500/5 backdrop-blur-xl transition hover:border-purple-300/30 hover:bg-white/[0.075] sm:rounded-[2rem] sm:p-4 md:p-5">
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-2xl bg-purple-500/15 text-lg ring-1 ring-purple-300/10 sm:h-11 sm:w-11 sm:text-xl">
            {displayEmoji}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold md:text-base">{displayAuthor}</h3>
            <p className="truncate text-xs text-white/40 md:text-sm">
              {time} • {type}
            </p>
          </div>
        </div>

        <span className="hidden shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/45 min-[380px]:inline-flex">
          Anonymous
        </span>
      </div>

      {content && (
        <p className="mt-3 line-clamp-4 whitespace-pre-wrap break-words text-[15px] leading-7 text-white/85 [overflow-wrap:anywhere] sm:mt-4 md:text-lg md:leading-8">
          {content}
        </p>
      )}

      {displayMedia.length > 0 && (
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

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/10 pt-3 sm:flex sm:flex-wrap sm:items-center sm:pt-4">
        <button
          type="button"
          onClick={handleLike}
          disabled={isUpdatingLike}
          aria-label={isLiked ? "Unlike tea" : "Like tea"}
          className={`flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm transition active:scale-95 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 ${
            isLiked
              ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
              : "bg-white/5 text-white/70 hover:text-white"
          }`}
        >
          <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
          {likesCount}
        </button>

        <Link
          href={`/tea/${id}`}
          className="flex items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70 transition active:scale-95 hover:bg-white/10 hover:text-white"
        >
          <MessageCircle size={17} />
          {comments} comments
        </Link>

        <Link
          href="/chat"
          className="col-span-2 inline-flex items-center justify-center gap-2 rounded-full border border-purple-300/25 px-4 py-2 text-sm text-purple-100 transition active:scale-95 hover:bg-purple-500/15 sm:ml-auto"
        >
          <Headphones size={16} />
          Talk to TeaTame
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
              <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="text-5xl">🎤</div>
                <h3 className="text-xl font-bold text-white">Voice Tea</h3>
                <audio src={previewMedia.url} controls className="w-full max-w-xl" />
              </div>
            )}
          </div>
        </div>
      )}
    </article>
  );
}