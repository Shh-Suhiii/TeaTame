"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Flag, Send, ShieldCheck, Sparkles } from "lucide-react";
import ChatMessage from "@/components/chat/ChatMessage";
import BottomNav from "@/components/common/BottomNav";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  sender_id: string | null;
  message: string;
  created_at: string | null;
};

type TeaTameUser = {
  id?: string;
  anonymous_name?: string;
};

const quickSupportOptions = [
  "Request post deletion",
  "Report a comment",
  "Report a bug",
  "Privacy concern",
  "Contact admin",
];

function getBotReply(userMessage: string) {
  const text = userMessage.toLowerCase();

  if (text.includes("request post deletion")) {
    return "Sure. Please send the post details, why it should be deleted, and any extra context. TeaTame will review it.";
  }

  if (text.includes("report a comment")) {
    return "Please share which comment you want to report and the reason. TeaTame will review it.";
  }

  if (text.includes("report a bug")) {
    return "Please describe the bug, where it happened, and what you expected instead. A screenshot also helps.";
  }

  if (text.includes("contact admin")) {
    return "You can write your message here. TeaTame admin can review this chat from the admin dashboard.";
  }

  if (text.includes("delete") || text.includes("remove")) {
    return "I understand. If something needs to be removed, TeaTame will review it. You can also report unsafe content anytime.";
  }

  if (text.includes("help") || text.includes("issue") || text.includes("problem")) {
    return "I’m here with you. Tell me what happened, and I’ll guide you step by step.";
  }

  if (text.includes("hi") || text.includes("hello") || text.includes("hey")) {
    return "Hey, welcome to TeaTame support ☕ How can I help you today?";
  }

  if (text.includes("anonymous") || text.includes("privacy")) {
    return "TeaTame is designed to keep your identity private. Still, avoid sharing names, phone numbers, addresses, or personal details.";
  }

  return "Thanks for sharing this with TeaTame ☕ We’ll review your request and get back to you if more details are needed.";
}

function formatChatTime(dateString?: string | null) {
  if (!dateString) return "Now";

  return new Date(dateString).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

async function getOrCreateAnonymousUser() {
  const savedUser = localStorage.getItem("TeaTame_user");

  if (savedUser) {
    const parsedUser = JSON.parse(savedUser) as TeaTameUser;

    if (parsedUser?.id) {
      return parsedUser;
    }

    const anonymousName = parsedUser?.anonymous_name || "Anonymous User";

    const { data, error } = await supabase
      .from("anonymous_users")
      .insert({
        anonymous_name: anonymousName,
        avatar: anonymousName,
      })
      .select()
      .single();

    if (error) throw error;

    localStorage.setItem("TeaTame_user", JSON.stringify(data));
    return data;
  }

  const anonymousName = "Anonymous User";

  const { data, error } = await supabase
    .from("anonymous_users")
    .insert({
      anonymous_name: anonymousName,
      avatar: anonymousName,
    })
    .select()
    .single();

  if (error) throw error;

  localStorage.setItem("TeaTame_user", JSON.stringify(data));
  return data;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState("");
  const [currentUser, setCurrentUser] = useState<TeaTameUser | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const setupChat = async () => {
      try {
        const user = await getOrCreateAnonymousUser();
        setCurrentUser(user);

        const privateChatId = user.id as string;
        setChatId(privateChatId);

        await supabase.from("chats").upsert({
          id: privateChatId,
          user1: user.id,
          user2: null,
        });

        const { data, error } = await supabase
          .from("messages")
          .select("id, sender_id, message, created_at")
          .eq("chat_id", privateChatId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Messages fetch failed:", error.message);
          setStatusMessage("Could not load messages.");
          setLoading(false);
          return;
        }

        setMessages((data || []) as Message[]);
        setLoading(false);
      } catch (error) {
        console.error(error);
        setStatusMessage("Anonymous chat could not start.");
        setLoading(false);
      }
    };

    setupChat();
  }, []);

  useEffect(() => {
    if (!chatId) return;

    const channel = supabase
      .channel(`TeaTame-support-chat-${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            const exists = prev.some((item) => item.id === newMessage.id);
            return exists ? prev : [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!message.trim() || !currentUser?.id || !chatId || sending) return;

    const messageText = message.trim();
    setMessage("");
    setSending(true);
    setStatusMessage("");

    const { data: sentMessage, error } = await supabase
      .from("messages")
      .insert({
        chat_id: chatId,
        sender_id: currentUser.id,
        message: messageText,
      })
      .select("id, sender_id, message, created_at")
      .single();

    if (error) {
      console.error("Message send failed:", error.message);
      setStatusMessage("Message could not be sent.");
      setMessage(messageText);
      setSending(false);
      return;
    }

    if (sentMessage) {
      setMessages((prev) => {
        const exists = prev.some((item) => item.id === sentMessage.id);
        return exists ? prev : [...prev, sentMessage as Message];
      });
    }

    window.setTimeout(async () => {
      try {
        const { data: botMessage, error: botError } = await supabase
          .from("messages")
          .insert({
            chat_id: chatId,
            sender_id: null,
            message: getBotReply(messageText),
          })
          .select("id, sender_id, message, created_at")
          .single();

        if (botError) {
          console.error("Bot reply failed:", botError.message);
          return;
        }

        if (botMessage) {
          setMessages((prev) => {
            const exists = prev.some((item) => item.id === botMessage.id);
            return exists ? prev : [...prev, botMessage as Message];
          });
        }
      } catch (error) {
        console.error("Bot reply failed:", error);
      }
    }, 900);

    setSending(false);
  };

  return (
    <main className="min-h-screen bg-[#0c0611] px-4 py-5 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <section className="mx-auto flex h-[88vh] max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-[0_20px_80px_rgba(168,85,247,0.12)] backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-white/10 bg-black/10 px-4 py-4 md:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 shadow-lg shadow-purple-500/10">
              <Image
                src="/logo3.png"
                alt="TeaTame Logo"
                width={56}
                height={56}
                priority
                className="h-9 w-9 object-contain"
              />
            </div>

            <div className="min-w-0">
              <h1 className="truncate font-semibold">Talk to TeaTame</h1>
              <p className="truncate text-xs text-green-300">
                ● AI support online • {currentUser?.anonymous_name || "Anonymous User"}
              </p>
            </div>
          </div>

          <button className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white md:px-4">
            <Flag size={16} />
            <span className="hidden sm:inline">Report</span>
          </button>
        </header>

        <div className="border-b border-white/10 bg-green-400/10 px-5 py-3 text-sm text-green-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            TeaTame AI can reply instantly. Avoid sharing personal details.
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
          {loading && (
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 text-center text-white/55">
              Loading live chat...
            </div>
          )}

          {!loading && messages.length === 0 && (
            <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 text-center backdrop-blur-xl">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/15">
                <Sparkles className="text-purple-200" />
              </div>
              <h2 className="text-xl font-bold">Ask TeaTame privately</h2>
              <p className="mt-2 text-sm leading-6 text-white/50">
                Choose a quick option or type your issue. TeaTame AI replies instantly.
              </p>
            </div>
          )}

          {!loading && (
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.045] p-4">
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-white/35">
                Quick support
              </p>
              <div className="flex flex-wrap gap-2">
                {quickSupportOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMessage(option)}
                    className="rounded-full border border-purple-300/20 bg-purple-500/10 px-4 py-2 text-sm text-purple-100 transition hover:bg-purple-500/20"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              sender={msg.sender_id === currentUser?.id ? "me" : "stranger"}
              text={msg.message}
              time={formatChatTime(msg.created_at)}
              status="sent"
            />
          ))}

          <div ref={bottomRef} />
        </div>

        {statusMessage && (
          <div className="mx-4 mb-2 rounded-2xl border border-purple-300/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-100 md:mx-5">
            {statusMessage}
          </div>
        )}

        <footer className="border-t border-white/10 bg-black/10 p-4">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-3 transition focus-within:border-purple-300/40">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Describe your issue or choose a quick option..."
              className="flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
            />

            <button
              onClick={sendMessage}
              disabled={sending || !message.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/25 transition hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </footer>
      </section>
      <BottomNav />
    </main>
  );
}