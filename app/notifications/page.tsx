"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Bell,
  CheckCheck,
  Coffee,
  Heart,
  MessageCircle,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import BottomNav from "@/components/common/BottomNav";
import { supabase } from "@/lib/supabase";

type TeaTameUser = {
  id?: string;
  anonymous_name?: string;
};

type NotificationItem = {
  id: string;
  icon: typeof Heart;
  title: string;
  description: string;
  time: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

type UserPost = {
  id: string;
  content: string | null;
  category: string | null;
  likes_count: number | null;
  comments_count: number | null;
  created_at: string | null;
};

type UserComment = {
  id: string;
  content: string | null;
  post_id: string | null;
  user_id: string | null;
  created_at: string | null;
};

type SupportMessage = {
  id: string;
  sender_id: string | null;
  message: string | null;
  created_at: string | null;
};

function getSavedUser() {
  if (typeof window === "undefined") return null;

  const saved = localStorage.getItem("TeaTame_user");
  if (!saved) return null;

  try {
    return JSON.parse(saved) as TeaTameUser;
  } catch {
    return null;
  }
}

function formatRelativeTime(dateString?: string | null) {
  if (!dateString) return "Just now";

  const createdAt = new Date(dateString).getTime();
  const diffInSeconds = Math.max(Math.floor((Date.now() - createdAt) / 1000), 0);

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
  });
}

function cleanMessage(message?: string | null) {
  return (message || "").replace(/^\[ADMIN\]\s*/, "");
}

function safetyNotification(): NotificationItem {
  return {
    id: "safety-reminder",
    icon: ShieldAlert,
    title: "Safety reminder",
    description: "Avoid sharing real names, phone numbers, addresses, or private details in posts.",
    time: "Always active",
    type: "Safety",
    isRead: true,
    createdAt: "1970-01-01T00:00:00.000Z",
  };
}

function syncNotificationBadge(items: NotificationItem[]) {
  const unreadItems = items.filter((item) => !item.isRead);
  localStorage.setItem("TeaTame_notification_count", String(unreadItems.length));
  window.dispatchEvent(new Event("teatame-notifications-updated"));
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<TeaTameUser | null>(null);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const buildNotifications = async (user: TeaTameUser | null, savedReadIds: string[]) => {
    if (!user?.id) {
      const fallbackNotifications = [safetyNotification()];
      setNotifications(fallbackNotifications);
      syncNotificationBadge(fallbackNotifications);
      setLoading(false);
      return;
    }

    setLoading(true);

    const { data: postsData } = await supabase
      .from("posts")
      .select("id, content, category, likes_count, comments_count, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const userPosts = (postsData || []) as UserPost[];
    const postIds = userPosts.map((post) => post.id);

    const commentNotifications: NotificationItem[] = [];

    if (postIds.length > 0) {
      const { data: commentsData } = await supabase
        .from("comments")
        .select("id, content, post_id, user_id, created_at")
        .in("post_id", postIds)
        .order("created_at", { ascending: false })
        .limit(20);

      ((commentsData || []) as UserComment[])
        .filter((comment) => comment.user_id !== user.id)
        .forEach((comment) => {
          const linkedPost = userPosts.find((post) => post.id === comment.post_id);
          const notificationId = `comment-${comment.id}`;

          commentNotifications.push({
            id: notificationId,
            icon: MessageCircle,
            title: "New anonymous comment",
            description: `Someone commented on your ${linkedPost?.category || "Tea"}: ${comment.content || "New comment"}`,
            time: formatRelativeTime(comment.created_at),
            type: "Comment",
            isRead: savedReadIds.includes(notificationId),
            createdAt: comment.created_at || new Date().toISOString(),
          });
        });
    }

    const likeNotifications = userPosts
      .filter((post) => (post.likes_count || 0) > 0)
      .slice(0, 10)
      .map((post) => {
        const notificationId = `likes-${post.id}-${post.likes_count || 0}`;

        return {
          id: notificationId,
          icon: Heart,
          title: "Someone liked your tea",
          description: `Your ${post.category || "Tea"} received ${post.likes_count || 0} reaction${(post.likes_count || 0) > 1 ? "s" : ""}.`,
          time: formatRelativeTime(post.created_at),
          type: "Reaction",
          isRead: savedReadIds.includes(notificationId),
          createdAt: post.created_at || new Date().toISOString(),
        } satisfies NotificationItem;
      });

    const { data: supportData } = await supabase
      .from("messages")
      .select("id, sender_id, message, created_at")
      .eq("chat_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    const supportNotifications = ((supportData || []) as SupportMessage[])
      .filter((message) => message.sender_id !== user.id)
      .map((message) => {
        const notificationId = `support-${message.id}`;

        return {
          id: notificationId,
          icon: Coffee,
          title: message.message?.startsWith("[ADMIN]")
            ? "TeaTame admin replied"
            : "TeaTame AI replied",
          description: cleanMessage(message.message) || "Your support chat has a new reply.",
          time: formatRelativeTime(message.created_at),
          type: "Support",
          isRead: savedReadIds.includes(notificationId),
          createdAt: message.created_at || new Date().toISOString(),
        } satisfies NotificationItem;
      });

    const nextNotifications = [
      ...commentNotifications,
      ...likeNotifications,
      ...supportNotifications,
      safetyNotification(),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setNotifications(nextNotifications);
    syncNotificationBadge(nextNotifications);
    setLoading(false);
  };

  useEffect(() => {
    const savedReadIds = JSON.parse(
      localStorage.getItem("TeaTame_read_notifications") || "[]"
    ) as string[];
    const savedUser = getSavedUser();

    setReadIds(savedReadIds);
    setCurrentUser(savedUser);
    buildNotifications(savedUser, savedReadIds);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const refresh = () => buildNotifications(currentUser, readIds);

    const commentsChannel = supabase
      .channel(`notifications-comments-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "comments",
        },
        refresh
      )
      .subscribe();

    const postsChannel = supabase
      .channel(`notifications-posts-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "posts",
        },
        refresh
      )
      .subscribe();

    const messagesChannel = supabase
      .channel(`notifications-messages-${currentUser.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${currentUser.id}`,
        },
        refresh
      )
      .subscribe();

    return () => {
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(postsChannel);
      supabase.removeChannel(messagesChannel);
    };
  }, [currentUser?.id, readIds]);

  const saveReadIds = (ids: string[]) => {
    setReadIds(ids);
    localStorage.setItem("TeaTame_read_notifications", JSON.stringify(ids));
  };

  const markAllRead = () => {
    const allIds = notifications.map((item) => item.id);
    saveReadIds(allIds);
    const nextNotifications = notifications.map((item) => ({ ...item, isRead: true }));
    setNotifications(nextNotifications);
    syncNotificationBadge(nextNotifications);
  };

  const markOneRead = (id: string) => {
    const nextReadIds = Array.from(new Set([...readIds, id]));
    saveReadIds(nextReadIds);
    const nextNotifications = notifications.map((notification) =>
      notification.id === id ? { ...notification, isRead: true } : notification
    );

    setNotifications(nextNotifications);
    syncNotificationBadge(nextNotifications);
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0611] pb-28 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0611]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white sm:px-4"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <div className="flex min-w-0 items-center gap-2">
            <Bell size={20} className="shrink-0 text-purple-200" />
            <h1 className="truncate font-semibold">Notifications</h1>
          </div>

          <button
            type="button"
            onClick={markAllRead}
            className="shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <CheckCheck size={14} className="mr-1 inline" />
            <span className="hidden sm:inline">Mark all read</span>
            <span className="sm:hidden">Read</span>
          </button>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl space-y-5 px-4 py-5 sm:px-5 sm:py-8">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-purple-500/15 to-fuchsia-500/10 backdrop-blur-xl">
          <div className="border-b border-white/10 px-5 py-4">
            <p className="inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-400/10 px-3 py-1.5 text-xs text-purple-100">
              <Sparkles size={14} />
              TeaTame Activity
            </p>
          </div>

          <div className="p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">Stay in the loop</h2>
                <p className="mt-2 max-w-xl text-sm leading-6 text-white/55 sm:text-base">
                  Track reactions, anonymous comments, support replies, and safety updates in one place.
                </p>
              </div>

              <div className="rounded-3xl border border-purple-300/20 bg-purple-500/10 px-5 py-4 text-center">
                <p className="text-3xl font-bold">{unreadCount}</p>
                <p className="mt-1 text-xs text-purple-100">Unread</p>
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center text-white/55 backdrop-blur-xl">
            Loading realtime notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15">
              <Bell className="text-purple-200" />
            </div>
            <h2 className="mt-4 text-xl font-bold">No notifications yet</h2>
            <p className="mt-2 text-sm leading-6 text-white/50">
              Likes, comments, and support updates will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {notifications.map((item) => {
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => markOneRead(item.id)}
                  className={`group w-full rounded-3xl border p-4 text-left backdrop-blur-xl transition hover:-translate-y-0.5 hover:bg-white/[0.08] hover:shadow-xl hover:shadow-purple-500/10 sm:p-5 ${
                    item.isRead
                      ? "border-white/10 bg-white/[0.045]"
                      : "border-purple-300/20 bg-purple-500/[0.09]"
                  }`}
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 sm:h-12 sm:w-12">
                      <Icon className="text-purple-200" size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-white/95">{item.title}</h3>
                          <p className="mt-1 text-sm leading-6 text-white/58">
                            {item.description}
                          </p>
                        </div>

                        {!item.isRead && (
                          <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-purple-300 shadow-lg shadow-purple-400/40" />
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-purple-300/20 bg-purple-500/10 px-3 py-1 text-[11px] text-purple-100">
                          {item.type}
                        </span>
                        {!item.isRead && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/50">
                            New
                          </span>
                        )}
                        <span className="text-xs text-white/35">{item.time}</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <BottomNav />
    </main>
  );
}