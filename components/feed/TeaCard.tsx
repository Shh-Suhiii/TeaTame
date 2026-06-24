/* eslint-disable @next/next/no-img-element */
"use client";

import { useState } from "react";
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

  const [previewMedia, setPreviewMedia] = useState<{
    url: string;
    type: string;
    name?: string;
  } | null>(null);

  const handleLike = async () => {
    if (isUpdatingLike) return;
    setIsUpdatingLike(true);

    const currentlyLiked = localStorage.getItem(likeKey) === "true";
    const nextLiked = !currentlyLiked;
    const nextLikes = nextLiked ? likesCount + 1 : Math.max(likesCount - 1, 0);

    setLikesCount(nextLikes);
    setIsLiked(nextLiked);

    if (nextLiked) {
      localStorage.setItem(likeKey, "true");
    } else {
      localStorage.removeItem(likeKey);
    }

    const { error } = await supabase
      .from("posts")
      .update({ likes_count: nextLikes })
      .eq("id", String(id));

    if (error) {
      console.error(error);
      setLikesCount(likesCount);
      setIsLiked(isLiked);

      if (isLiked) {
        localStorage.setItem(likeKey, "true");
      } else {
        localStorage.removeItem(likeKey);
      }
      setIsUpdatingLike(false);
      return;
    }

    setIsUpdatingLike(false);
  };

  const displayMedia =
    mediaItems && mediaItems.length > 0
      ? mediaItems
      : mediaUrl && mediaType
        ? [{ url: mediaUrl, type: mediaType, name: "Tea media" }]
        : [];

  const visibleMedia = displayMedia.slice(0, 4);
  const extraMediaCount = Math.max(displayMedia.length - visibleMedia.length, 0);

  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-4 backdrop-blur-xl transition hover:border-purple-300/30 hover:bg-white/[0.075] md:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/15 text-xl ring-1 ring-purple-300/10">
            {emoji}
          </div>
          <div>
            <h3 className="text-sm font-semibold md:text-base">{author}</h3>
            <p className="text-xs text-white/40 md:text-sm">
              {time} • {type}
            </p>
          </div>
        </div>

        <span className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/45">
          Anonymous
        </span>
      </div>

      {content && (
        <p className="mt-4 line-clamp-4 text-base leading-7 text-white/85 md:text-lg md:leading-8">
          {content}
        </p>
      )}

      {displayMedia.length > 0 && (
        <div
          className={`mt-4 grid aspect-square overflow-hidden rounded-[1.35rem] border border-white/10 bg-black/20 sm:rounded-[1.6rem] ${
            visibleMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {visibleMedia.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setPreviewMedia(item)}
              className={`relative overflow-hidden border-white/10 text-left ${
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

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
        <button
          onClick={handleLike}
          disabled={isUpdatingLike}
          aria-label={isLiked ? "Unlike tea" : "Like tea"}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 ${
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
          className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <MessageCircle size={17} />
          {comments} comments
        </Link>

        <Link
          href="/chat"
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-purple-300/25 px-4 py-2 text-sm text-purple-100 transition hover:bg-purple-500/15"
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
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition hover:bg-white/20"
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