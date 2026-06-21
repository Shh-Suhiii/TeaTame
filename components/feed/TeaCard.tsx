import Link from "next/link";
import { Heart, MessageCircle } from "lucide-react";

type TeaCardProps = {
  id: number;
  author: string;
  emoji: string;
  time: string;
  type: string;
  content: string;
  likes: number;
  comments: number;
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
}: TeaCardProps) {
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

      <p className="mt-5 text-lg leading-8 text-white/85">{content}</p>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-white/10 pt-4">
        <button className="flex items-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm text-white/70">
          <Heart size={17} />
          {likes}
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