

import Link from "next/link";
import { ArrowLeft, Bell, Heart, MessageCircle, Coffee } from "lucide-react";
import BottomNav from "@/components/common/BottomNav";

const notifications = [
  {
    id: 1,
    icon: Heart,
    title: "Someone liked your tea",
    description: "Your Workplace Tea received a new reaction.",
    time: "2 min ago",
  },
  {
    id: 2,
    icon: MessageCircle,
    title: "New anonymous comment",
    description: "Someone replied to your post.",
    time: "12 min ago",
  },
  {
    id: 3,
    icon: Coffee,
    title: "New chat request",
    description: "Anonymous Fox wants to chat with you.",
    time: "1 hour ago",
  },
];

export default function NotificationsPage() {
  return (
    <main className="min-h-screen bg-[#0c0611] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0611]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10">
            <ArrowLeft size={16} />
            Back
          </Link>

          <div className="flex items-center gap-2">
            <Bell size={20} />
            <h1 className="font-semibold">Notifications</h1>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-8">
        <div className="space-y-4">
          {notifications.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/15">
                    <Icon className="text-purple-200" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="mt-1 text-white/60">{item.description}</p>
                    <p className="mt-2 text-sm text-white/40">{item.time}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <BottomNav />
    </main>
  );
}