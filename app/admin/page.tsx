"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  BarChart3,
  MessageCircle,
  Send,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type Post = {
  id: string;
  content: string | null;
  category: string | null;
  media_type: string | null;
  created_at: string | null;
  likes_count: number | null;
  comments_count: number | null;
  anonymous_users: {
    anonymous_name: string;
  } | null;
};

type Comment = {
  id: string;
  content: string;
  created_at: string | null;
  posts: {
    content: string | null;
  } | null;
  anonymous_users: {
    anonymous_name: string;
  } | null;
};

type Chat = {
  id: string;
  created_at: string | null;
  user1: string | null;
  latestMessage?: string;
  latestMessageTime?: string;
  anonymous_users: {
    anonymous_name: string;
  } | null;
};

type Message = {
  id: string;
  sender_id: string | null;
  message: string;
  created_at: string | null;
};

const ADMIN_PASSWORD = "TeaTame-admin";

// const ADMIN_ID = "00000000-0000-0000-0000-000000000000";
const BOT_LABEL = "TeaTame AI";


function formatDate(dateString?: string | null) {
  if (!dateString) return "Just now";

  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}


export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "comments" | "chats" | "announcements">("posts");

  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [announcement, setAnnouncement] = useState("");
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const postAsTeaTame = async () => {
    if (!announcement.trim()) return;

    setPostingAnnouncement(true);

    const { error } = await supabase
      .from("posts")
      .insert({
        content: announcement.trim(),
        category: "Announcement",
        media_type: "text",
        is_admin_post: true,
        admin_name: "TeaTame",
      });

    setPostingAnnouncement(false);

    if (error) {
      console.error(error);
      setStatusMessage("Failed to publish announcement.");
      return;
    }

    setAnnouncement("");
    setStatusMessage("TeaTame announcement posted.");
    refreshAdmin();
  };

  const stats = useMemo(
    () => [
      { label: "Posts", value: posts.length },
      { label: "Comments", value: comments.length },
      { label: "Support Chats", value: chats.length },
    ],
    [posts.length, comments.length, chats.length]
  );

  const unlockAdmin = () => {
    if (password !== ADMIN_PASSWORD) {
      setStatusMessage("Wrong admin password.");
      return;
    }

    setIsUnlocked(true);
    setStatusMessage("");
  };

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select(`
        id,
        content,
        category,
        media_type,
        created_at,
        likes_count,
        comments_count,
        anonymous_users (
          anonymous_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setStatusMessage("Failed to load posts.");
      return;
    }

    setPosts((data || []) as unknown as Post[]);
  };

  const fetchComments = async () => {
    const { data, error } = await supabase
      .from("comments")
      .select(`
        id,
        content,
        created_at,
        posts (
          content
        ),
        anonymous_users (
          anonymous_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setStatusMessage("Failed to load comments.");
      return;
    }

    setComments((data || []) as unknown as Comment[]);
  };
  const fetchChats = async () => {
    const { data, error } = await supabase
      .from("chats")
      .select(`
        id,
        created_at,
        user1,
        anonymous_users!chats_user1_fkey (
          anonymous_name
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setStatusMessage("Failed to load chats.");
      return;
    }

    const chatRows = (data || []) as unknown as Chat[];
    const chatIds = chatRows.map((chat) => chat.id);

    if (chatIds.length === 0) {
      setChats([]);
      return;
    }

    const { data: latestMessages, error: latestError } = await supabase
      .from("messages")
      .select("chat_id, message, created_at")
      .in("chat_id", chatIds)
      .order("created_at", { ascending: false });

    if (latestError) {
      console.error(latestError);
      setChats(chatRows);
      return;
    }

    const latestMessageMap = new Map<
  string,
  {
    message: string;
    created_at: string;
  }
>();

((latestMessages || []) as {
  chat_id: string;
  message: string;
  created_at: string | null;
}[]).forEach((message) => {
  if (!latestMessageMap.has(message.chat_id) && message.created_at) {
    latestMessageMap.set(message.chat_id, {
      message: message.message,
      created_at: message.created_at,
    });
  }
});
    const sortedChats = [...chatRows].sort((a, b) => {
const aTime =
  latestMessageMap.get(a.id)?.created_at ||
  a.created_at ||
  "";

const bTime =
  latestMessageMap.get(b.id)?.created_at ||
  b.created_at ||
  "";

      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });

    const chatsWithMessages = sortedChats.filter((chat) =>
  latestMessageMap.has(chat.id)
);

const enrichedChats = chatsWithMessages.map((chat) => ({
  ...chat,
  latestMessage: latestMessageMap.get(chat.id)?.message,
  latestMessageTime: latestMessageMap.get(chat.id)?.created_at,
}));

setChats(enrichedChats);
  };

  const refreshAdmin = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPosts(), fetchComments(), fetchChats()]);
    setLoading(false);
  }, []);


  useEffect(() => {
    if (!isUnlocked) return;

    const timer = window.setTimeout(() => {
      refreshAdmin();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [isUnlocked, refreshAdmin]);

  useEffect(() => {
    if (!isUnlocked) return;

    const channel = supabase
      .channel("admin-chat-list")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          fetchChats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isUnlocked]);

  const deletePost = async (postId: string) => {
    const confirmDelete = confirm("Delete this post permanently?");
    if (!confirmDelete) return;

    const { error: commentsError } = await supabase
      .from("comments")
      .delete()
      .eq("post_id", postId);

    if (commentsError) {
      console.error(commentsError);
      setStatusMessage("Failed to delete post comments.");
      return;
    }

    const { data, error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .select("id");

    if (error) {
      console.error(error);
      setStatusMessage("Failed to delete post.");
      return;
    }

    if (!data || data.length === 0) {
      setStatusMessage("Post delete was blocked by Supabase policy.");
      return;
    }

    setPosts((prev) => prev.filter((post) => post.id !== postId));
    setComments((prev) => prev.filter((comment) => comment.posts?.content !== null));
    setStatusMessage("Post deleted from database.");
    refreshAdmin();
  };

  const deleteComment = async (commentId: string) => {
    const confirmDelete = confirm("Delete this comment permanently?");
    if (!confirmDelete) return;

    const { data, error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .select("id");

    if (error) {
      console.error(error);
      setStatusMessage("Failed to delete comment.");
      return;
    }

    if (!data || data.length === 0) {
      setStatusMessage("Comment delete was blocked by Supabase policy.");
      return;
    }

    setComments((prev) => prev.filter((comment) => comment.id !== commentId));
    setStatusMessage("Comment deleted from database.");
    refreshAdmin();
  };

  const openChat = async (chat: Chat) => {
    setSelectedChat(chat);
    setStatusMessage("");

    const { data, error } = await supabase
      .from("messages")
      .select("id, sender_id, message, created_at")
      .eq("chat_id", chat.id)
      .order("created_at", { ascending: true });

    if (error) {
      console.error(error);
      setStatusMessage("Failed to load chat messages.");
      return;
    }

    setMessages((data || []) as Message[]);
  };

  useEffect(() => {
    if (!selectedChat) return;

    const channel = supabase
      .channel(`admin-chat-${selectedChat.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${selectedChat.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            const exists = prev.some((message) => message.id === newMessage.id);
            return exists ? prev : [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedChat]);

  const sendReply = async () => {
    if (!selectedChat || !reply.trim()) return;

    const replyText = reply.trim();
    setReply("");

    const { data: adminMessage, error } = await supabase
      .from("messages")
      .insert({
        chat_id: selectedChat.id,
        sender_id: null,
        message: `[ADMIN] ${replyText}`,
      })
      .select("id, sender_id, message, created_at")
      .single();

    if (error) {
      console.error(error);
      setStatusMessage("Failed to send reply.");
      setReply(replyText);
      return;
    }

    if (adminMessage) {
      setMessages((prev) => {
        const exists = prev.some((message) => message.id === adminMessage.id);
        return exists ? prev : [...prev, adminMessage as Message];
      });
    }
  };

  if (!isUnlocked) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#0c0611] px-4 py-6 text-white sm:px-5">
        <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

        <div className="w-full max-w-md rounded-[1.6rem] border border-white/10 bg-white/[0.06] p-5 shadow-[0_20px_80px_rgba(168,85,247,0.16)] backdrop-blur-xl sm:rounded-[2rem] sm:p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 shadow-lg shadow-purple-500/10">
              <Image
                src="/logo3.png"
                alt="TeaTame Logo"
                width={56}
                height={56}
                priority
                className="h-9 w-9 object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold">TeaTame Admin</h1>
              <p className="text-sm text-white/45">Moderate posts, comments, and chats.</p>
            </div>
          </div>

          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") unlockAdmin();
            }}
            type="password"
            placeholder="Enter admin password"
            className="w-full rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-white outline-none transition placeholder:text-white/35 focus:border-purple-300/40"
          />

          {statusMessage && (
            <p className="mt-3 rounded-2xl border border-purple-300/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
              {statusMessage}
            </p>
          )}

          <button
            type="button"
            onClick={unlockAdmin}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-500 px-5 py-4 font-semibold shadow-lg shadow-purple-500/20 transition hover:bg-purple-400"
          >
            <ShieldCheck size={18} />
            Unlock Admin
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0611] pb-8 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0c0611]/85 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:px-5">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              href="/"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white sm:h-10 sm:w-10"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 shadow-lg shadow-purple-500/10 sm:flex">
              <Image
                src="/logo3.png"
                alt="TeaTame Logo"
                width={56}
                height={56}
                priority
                className="h-9 w-9 object-contain"
              />
            </div>

            <div>
              <h1 className="truncate text-lg font-bold leading-none sm:text-xl md:text-2xl">Admin Dashboard</h1>
              <p className="mt-1 text-xs text-white/45">Manage TeaTame safely.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={refreshAdmin}
            className="shrink-0 rounded-full border border-purple-300/25 px-3 py-2 text-xs text-purple-100 transition hover:bg-purple-500/15 sm:px-4 sm:text-sm"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl space-y-4 px-3 py-4 sm:space-y-6 sm:px-5 sm:py-6">
        <div className="grid gap-4 md:grid-cols-3">
          {stats.map((item) => (
            <div
              key={item.label}
              className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:rounded-[2rem] sm:p-5"
            >
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-500/15">
                <BarChart3 className="text-purple-200" size={20} />
              </div>
              <p className="text-sm text-white/45">{item.label}</p>
              <h2 className="mt-1 text-3xl font-bold tabular-nums">{item.value}</h2>
            </div>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-2.5 backdrop-blur-xl [scrollbar-width:none] sm:flex-wrap sm:gap-3 sm:rounded-[2rem] sm:p-3 [&::-webkit-scrollbar]:hidden">
          {[
            { id: "posts", label: "Posts" },
            { id: "comments", label: "Comments" },
            { id: "chats", label: "Support Chats" },
            { id: "announcements", label: "TeaTame Posts" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as "posts" | "comments" | "chats" | "announcements")}
              className={`shrink-0 rounded-full px-4 py-2 text-xs transition active:scale-95 sm:px-5 sm:text-sm ${
                activeTab === tab.id
                  ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                  : "bg-white/5 text-white/65 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "announcements" && (
          <div className="mx-auto w-full max-w-2xl rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl sm:rounded-[2rem]">
            <h2 className="text-xl font-bold">☕ Post as TeaTame</h2>

            <p className="mt-2 text-sm text-white/45">
              Publish official announcements that appear in the public feed.
            </p>

            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Write an official TeaTame update..."
              className="mt-5 min-h-40 w-full resize-none rounded-3xl border border-white/10 bg-black/25 p-4 text-white outline-none placeholder:text-white/35 focus:border-purple-300/40"
            />

            <button
              type="button"
              onClick={postAsTeaTame}
              disabled={!announcement.trim() || postingAnnouncement}
              className="mt-4 rounded-2xl bg-purple-500 px-5 py-3 font-semibold transition hover:bg-purple-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {postingAnnouncement ? "Posting..." : "Publish Announcement"}
            </button>
          </div>
        )}

        {statusMessage && (
          <div className="rounded-2xl border border-purple-300/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-100">
            {statusMessage}
          </div>
        )}

        {activeTab === "posts" && (
          <div className="space-y-4">
            {posts.map((post) => (
              <div
                key={post.id}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:rounded-[2rem] sm:p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-white/40">
                      {post.anonymous_users?.anonymous_name || "Anonymous User"} • {formatDate(post.created_at)}
                    </p>
                    <h3 className="mt-2 break-words text-base font-semibold leading-6 text-white/90 sm:text-lg">
                      {post.content || "Media post"}
                    </h3>
                    <p className="mt-2 text-sm text-white/45">
                      {post.category || "Random"} • {post.media_type || "text"} • ❤️ {post.likes_count || 0} • 💬 {post.comments_count || 0}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deletePost(post.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-red-400/20 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:rounded-[2rem] sm:p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="text-sm text-white/40">
                      {comment.anonymous_users?.anonymous_name || "Anonymous User"} • {formatDate(comment.created_at)}
                    </p>
                    <h3 className="mt-2 break-words text-base font-semibold leading-6 text-white/90 sm:text-lg">{comment.content}</h3>
                    <p className="mt-2 line-clamp-2 text-sm text-white/45">
                      On post: {comment.posts?.content || "Media post"}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteComment(comment.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-red-400/20 px-4 py-2 text-sm text-red-200 transition hover:bg-red-500/10"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "chats" && (
          <div className="grid gap-4 lg:grid-cols-[360px_1fr] lg:gap-5">
            <div className="space-y-3">
              {chats.map((chat) => (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => openChat(chat)}
                  className={`w-full rounded-[1.35rem] border p-3.5 text-left transition sm:rounded-[1.6rem] sm:p-4 ${
                    selectedChat?.id === chat.id
                      ? "border-purple-300/40 bg-purple-500/15"
                      : "border-white/10 bg-white/[0.06] hover:bg-white/[0.08]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-500/15">
                      <MessageCircle size={18} className="text-purple-200" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold">
                        {chat.anonymous_users?.anonymous_name || "Anonymous User"}
                      </h3>
<p className="truncate text-xs text-white/40">
  {formatDate(chat.latestMessageTime || chat.created_at)}
</p>

<p className="mt-1 truncate text-xs text-purple-200/70">
  {chat.latestMessage || "No messages"}
</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex min-h-[520px] flex-col overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.06] backdrop-blur-xl sm:min-h-[560px] sm:rounded-[2rem]">
              {!selectedChat ? (
                <div className="flex flex-1 items-center justify-center p-8 text-center text-white/50">
                  Select a support chat to reply.
                </div>
              ) : (
                <>
                  <div className="border-b border-white/10 px-5 py-4">
                    <h3 className="font-semibold">
                      Chat with {selectedChat.anonymous_users?.anonymous_name || "Anonymous User"}
                    </h3>
                    <p className="text-xs text-white/40">Realtime support conversation</p>
                  </div>

                  <div className="flex-1 space-y-3 overflow-y-auto p-3 sm:p-5">
                    {messages.map((msg) => {
                      const isAdmin = msg.message.startsWith("[ADMIN]");
                      const isBot = msg.sender_id === null && !msg.message.startsWith("[ADMIN]");
                      const visibleMessage = msg.message.replace(/^\[ADMIN\]\s*/, "");

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[86%] break-words rounded-[1.25rem] px-3.5 py-2.5 text-sm leading-6 [overflow-wrap:anywhere] sm:max-w-[78%] sm:rounded-[1.4rem] sm:px-4 sm:py-3 ${
                              isAdmin
                                ? "rounded-br-md bg-purple-500 text-white"
                                : "rounded-bl-md bg-white/10 text-white/85"
                            }`}
                          >
                            {!isAdmin && (
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                                {isBot ? BOT_LABEL : selectedChat.anonymous_users?.anonymous_name || "Anonymous User"}
                              </p>
                            )}
                            <p className="whitespace-pre-wrap">{visibleMessage}</p>
                            <p className="mt-1 text-[10px] text-white/45">{formatDate(msg.created_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="border-t border-white/10 p-4">
                    <div className="flex items-center gap-2 rounded-[1.35rem] border border-white/10 bg-black/25 px-3 py-3 focus-within:border-purple-300/40 sm:gap-3 sm:rounded-full sm:px-4">
                      <input
                        value={reply}
                        onChange={(event) => setReply(event.target.value)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            sendReply();
                          }
                        }}
                        placeholder="Reply as TeaTame admin..."
                        className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-white/35 sm:text-base"
                      />
                      <button
                        type="button"
                        onClick={sendReply}
                        disabled={!reply.trim()}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-purple-500 text-white transition active:scale-95 hover:bg-purple-400 disabled:opacity-50"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}