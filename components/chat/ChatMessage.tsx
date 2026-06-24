type ChatMessageProps = {
  sender: "me" | "stranger";
  text: string;
  time?: string;
  status?: "sending" | "sent" | "seen";
};

export default function ChatMessage({
  sender,
  text,
  time = "Now",
  status = "sent",
}: ChatMessageProps) {
  const isMe = sender === "me";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`group max-w-[82%] rounded-[1.6rem] px-4 py-3 shadow-lg backdrop-blur-xl transition md:max-w-[72%] ${
          isMe
            ? "rounded-br-md bg-gradient-to-br from-purple-500 to-fuchsia-500 text-white shadow-purple-500/20"
            : "rounded-bl-md border border-white/10 bg-white/[0.08] text-white/85 shadow-black/20"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm leading-6 md:text-base md:leading-7">
          {text}
        </p>

        <div
          className={`mt-1 flex items-center gap-1 text-[10px] ${
            isMe ? "justify-end text-white/70" : "justify-start text-white/35"
          }`}
        >
          <span>{time}</span>
          {isMe && (
            <span aria-label={status} className="tracking-[-2px]">
              {status === "sending" ? "•" : status === "seen" ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}