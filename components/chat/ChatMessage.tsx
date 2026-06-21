type ChatMessageProps = {
  sender: "me" | "stranger";
  text: string;
};

export default function ChatMessage({ sender, text }: ChatMessageProps) {
  return (
    <div className={`flex ${sender === "me" ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-3xl px-5 py-3 leading-7 ${
          sender === "me"
            ? "rounded-br-md bg-purple-500 text-white"
            : "rounded-bl-md bg-white/10 text-white/80"
        }`}
      >
        {text}
      </div>
    </div>
  );
}