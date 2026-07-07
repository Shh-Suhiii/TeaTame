import Link from "next/link";
import { ArrowLeft, Coffee, Sparkles } from "lucide-react";
import CreateTeaForm from "@/components/create/CreateTeaForm";
import BottomNav from "@/components/common/BottomNav";

export default function CreateTeaPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0c0611] pb-28 text-white">
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top,#6d28d966,transparent_35%),radial-gradient(circle_at_bottom_right,#be185d44,transparent_30%)]" />

      <header className="sticky top-0 z-20 border-b border-white/10 bg-[#0c0611]/80 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-4">
          <Link
            href="/"
            className="flex shrink-0 items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm text-white/70 transition hover:bg-white/10 hover:text-white sm:px-4"
          >
            <ArrowLeft size={17} />
            Back
          </Link>

          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-purple-300/30 bg-purple-500/20 sm:h-10 sm:w-10">
              <Coffee className="text-purple-200" size={20} />
            </div>
            <div>
              <h1 className="truncate font-bold leading-tight">Create Tea</h1>
              <p className="text-xs text-white/45">Anonymous post</p>
            </div>
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-4xl px-3 py-4 sm:px-5 sm:py-8">
        <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl sm:rounded-[2rem] sm:p-5 md:p-7">
          <p className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-purple-300/20 bg-purple-400/10 px-3 py-1.5 text-xs text-purple-100 sm:mb-4 sm:gap-2 sm:px-4 sm:py-2 sm:text-sm">
            <Sparkles size={16} />
            Spill safely, stay unknown
          </p>

          <h2 className="text-[2rem] font-bold leading-tight tracking-tight sm:text-4xl md:text-5xl">
            What do you want to share?
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55 sm:mt-3 sm:text-base sm:leading-7">
            Your post will appear with a random anonymous identity. Don&apos;t include real names, addresses, phone numbers, or personal details.
          </p>

          <div className="mt-5 sm:mt-7">
            <CreateTeaForm />
          </div>
        </div>
      </section>
      <BottomNav />
    </main>
  );
}