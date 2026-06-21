

import Link from "next/link";
import {
  ArrowLeft,
  Coffee,
  Shield,
  Bell,
  Ban,
  ChevronRight,
  UserCircle,
} from "lucide-react";
import BottomNav from "@/components/common/BottomNav";

export default function ProfilePage() {
  return (
    <main className="min-h-screen bg-[#0c0611] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0611]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/10"
          >
            <ArrowLeft size={16} />
            Back
          </Link>

          <h1 className="font-semibold">Anonymous Profile</h1>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          <div className="flex flex-col items-center text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-500/20 border border-purple-300/30">
              <UserCircle size={60} className="text-purple-200" />
            </div>

            <h2 className="mt-4 text-2xl font-bold">Anonymous Panda 🐼</h2>
            <p className="mt-2 text-white/55">
              Your identity is hidden from other users.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="text-purple-200" />
              <span>Privacy Settings</span>
            </div>
            <ChevronRight size={18} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="text-purple-200" />
              <span>Notifications</span>
            </div>
            <ChevronRight size={18} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Ban className="text-purple-200" />
              <span>Blocked Users</span>
            </div>
            <ChevronRight size={18} />
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Coffee className="text-purple-200" />
              <span>TeaTime Guidelines</span>
            </div>
            <ChevronRight size={18} />
          </div>
        </div>
      </section>

      <BottomNav />
    </main>
  );
}