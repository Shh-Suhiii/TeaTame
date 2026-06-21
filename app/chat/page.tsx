"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Coffee, Flag, Send, ShieldCheck } from "lucide-react";
import ChatMessage from "@/components/chat/ChatMessage";
import BottomNav from "@/components/common/BottomNav";

type Message = {
  id: number;
  sender: "me" | "stranger";
  text: string;
};

const initialMessages: Message[] = [
  {
    id: 1,
    sender: "stranger",
    text: "Hey, I saw your tea. Want to talk about it anonymously?",
  },
  {
    id: 2,
    sender: "me",
    text: "Yes, but I don’t want anyone to know it was me.",
  },
  {
    id: 3,
    sender: "stranger",
    text: "Don’t worry. TeaTime keeps this anonymous.",
  },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [message, setMessage] = useState("");

  const sendMessage = () => {
    if (!message.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: "me",
        text: message,
      },
    ]);

    setMessage("");
  };

  return (
    <main className="min-h-screen bg-[#0c0611] px-4 py-5 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <section className="mx-auto flex h-[88vh] max-w-4xl flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] backdrop-blur-xl">
        <header className="flex items-center justify-between border-b border-white/10 px-4 py-4 md:px-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft size={18} />
            </Link>

            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-purple-300/30 bg-purple-500/20">
              <Coffee className="text-purple-200" size={22} />
            </div>

            <div>
              <h1 className="font-semibold">Anonymous Chat</h1>
              <p className="text-xs text-green-300">● Online • Anonymous Fox</p>
            </div>
          </div>

          <button className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/60 transition hover:bg-white/10 hover:text-white">
            <Flag size={16} />
            Report
          </button>
        </header>

        <div className="border-b border-white/10 bg-green-400/10 px-5 py-3 text-sm text-green-100">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} />
            This chat is anonymous. Do not share personal details.
          </div>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              sender={msg.sender}
              text={msg.text}
            />
          ))}
        </div>

        <footer className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-4 py-3">
            <input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="Message anonymously..."
              className="flex-1 bg-transparent text-white outline-none placeholder:text-white/35"
            />

            <button
              onClick={sendMessage}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500 transition hover:bg-purple-400"
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