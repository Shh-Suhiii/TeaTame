import { Image, Mic, Send, Type, Video } from "lucide-react";

const teaTypes = [
  { title: "Text Tea", icon: Type },
  { title: "Image Tea", icon: Image },
  { title: "Video Tea", icon: Video },
  { title: "Voice Tea", icon: Mic },
];

export default function CreateTeaForm() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {teaTypes.map((type) => {
          const Icon = type.icon;

          return (
            <button
              key={type.title}
              className="rounded-3xl border border-white/10 bg-black/20 p-5 text-left transition hover:border-purple-300/40 hover:bg-purple-500/10"
            >
              <Icon className="mb-4 text-purple-200" />
              <h3 className="font-semibold">{type.title}</h3>
            </button>
          );
        })}
      </div>

      <textarea
        placeholder="Aaj ka tea yahan spill karo..."
        className="min-h-44 w-full resize-none rounded-3xl border border-white/10 bg-black/25 p-5 text-white outline-none placeholder:text-white/30"
      />

      <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-black/20 p-8 text-center">
        <input type="file" accept="image/*,video/*,audio/*" className="hidden" />
        <Image className="mb-3 text-white/70" />
        <p className="font-medium">Upload image, video, or audio</p>
      </label>

      <button className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-500 px-5 py-4 font-semibold">
        <Send size={18} />
        Post Anonymously
      </button>
    </div>
  );
}