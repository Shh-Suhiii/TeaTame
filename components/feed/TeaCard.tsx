"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";
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
  const likeKey = `teatime_liked_${id}`;
  const [likesCount, setLikesCount] = useState(likes);
  const [isLiked, setIsLiked] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(likeKey) === "true";
  });

  const handleLike = async () => {
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

  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl transition hover:border-purple-300/30">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15 text-2xl">
            {emoji}
          </div>
          <div>
            <h3 className="font-semibold">{author}</h3>
            <p className="text-sm text-white/40">
              {time} • {type}
            </p>
          </div>
        </div>

        <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">
          Anonymous
        </span>
      </div>

      {content && (
        <p className="mt-5 text-lg leading-8 text-white/85">{content}</p>
      )}

      {displayMedia.length > 0 && (
        <Link
          href={`/tea/${id}`}
          className={`mt-5 grid aspect-square overflow-hidden rounded-3xl border border-white/10 bg-black/20 ${
            visibleMedia.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {visibleMedia.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              className={`relative overflow-hidden border-white/10 ${
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
                    <span className="rounded-full bg-black/60 px-4 py-2 text-sm font-semibold text-white">
                      ▶ Video
                    </span>
                  </div>
                </div>
              )}

              {item.type === "audio" && (
                <div className="flex h-full w-full flex-col items-center justify-center bg-purple-500/15 p-4 text-center">
                  <span className="text-4xl">🎤</span>
                  <span className="mt-2 text-sm font-semibold text-white/80">
                    Voice Tea
                  </span>
                </div>
              )}

              {extraMediaCount > 0 && index === visibleMedia.length - 1 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/65 text-3xl font-bold text-white">
                  +{extraMediaCount}
                </div>
              )}
            </div>
          ))}
        </Link>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
            isLiked
              ? "bg-purple-500 text-white"
              : "bg-white/5 text-white/70"
          }`}
        >
          <Heart size={17} fill={isLiked ? "currentColor" : "none"} />
          {likesCount}
        </button>

        <Link
          href={`/tea/${id}`}
          className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70"
        >
          <MessageCircle size={17} />
          {comments} comments
        </Link>

        <Link
          href="/chat"
          className="ml-auto rounded-full border border-purple-300/30 px-4 py-2 text-sm text-purple-100"
        >
          Anonymous Chat
        </Link>
      </div>
    </article>
  );
}