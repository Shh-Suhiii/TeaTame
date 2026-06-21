import Link from "next/link";
import { ArrowLeft, Coffee, Sparkles } from "lucide-react";
import CreateTeaForm from "@/components/create/CreateTeaForm";
import BottomNav from "@/components/common/BottomNav";

export default function CreateTeaPage() {
  return (
    <main className="min-h-screen bg-[#0c0611] text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0611]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-4xl items-center justify-between px-5 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-purple-300/30 bg-purple-500/20">
              <Coffee className="text-purple-200" size={22} />
            </div>
            <div>
              <h1 className="font-bold leading-tight">Create Tea</h1>
              <p className="text-xs text-white/45">Anonymous post</p>
            </div>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-5 py-8">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl md:p-7">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-400/10 px-4 py-2 text-sm text-purple-100">
            <Sparkles size={16} />
            Spill safely, stay unknown
          </p>

          <h2 className="text-4xl font-bold tracking-tight md:text-5xl">
            What do you want to share?
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-white/55">
            Your post will appear with a random anonymous identity. Don&apos;t include real names, addresses, phone numbers, or personal details.
          </p>

          <div className="mt-7">
            <CreateTeaForm />
          </div>
        </div>
      </section>
      <BottomNav />
    </main>
  );
}