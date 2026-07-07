/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useRef, useState } from "react";
import {
  FileImage,
  Image,
  Mic,
  Pause,
  Send,
  Square,
  Trash2,
  Type,
  Video,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import NextImage from "next/image";
import { generateAnonymousName } from "@/lib/anonymous-user";

const teaTypes = [
  { title: "Text", value: "text", icon: Type, hint: "Write a confession" },
  { title: "Images", value: "image", icon: Image, hint: "Add photos" },
  { title: "Videos", value: "video", icon: Video, hint: "Add short clips" },
  { title: "Voice", value: "audio", icon: Mic, hint: "Record audio" },
];

const categories = ["College", "Work", "Relationship", "Confession", "Family", "Random"];

type MediaItem = {
  url: string;
  type: string;
  name: string;
};

async function getOrCreateAnonymousUser() {
  const savedUser = localStorage.getItem("TeaTame_user");

  if (savedUser) {
    const parsedUser = JSON.parse(savedUser);

    if (parsedUser?.id) {
      return parsedUser;
    }

    const anonymousName =
      parsedUser?.anonymous_name && parsedUser.anonymous_name !== "Anonymous User"
        ? parsedUser.anonymous_name
        : generateAnonymousName();

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

  const anonymousName = generateAnonymousName();

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

function getFileType(file: File) {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

export default function CreateTeaForm() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Random");
  const [activeType, setActiveType] = useState("text");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState("");

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const incomingFiles = Array.from(files);
    const acceptedFiles = incomingFiles.filter((file) => {
      if (activeType === "image") return file.type.startsWith("image/");
      if (activeType === "video") return file.type.startsWith("video/");
      return true;
    });

    setSelectedFiles((prev) => [...prev, ...acceptedFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/mp4")
        ? "audio/mp4"
        : MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream, { mimeType });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        const extension = mimeType.includes("mp4") ? "m4a" : "webm";
        const audioFile = new File([audioBlob], `voice-${Date.now()}.${extension}`, {
          type: mimeType,
        });

        setSelectedFiles((prev) => [...prev, audioFile]);
        setRecordedAudioUrl(URL.createObjectURL(audioBlob));

        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error(error);
      alert("Microphone permission denied or unavailable.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    mediaRecorderRef.current.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);
  };

  const clearForm = () => {
    setContent("");
    setCategory("Random");
    setActiveType("text");
    setSelectedFiles([]);
    setRecordedAudioUrl("");
    setIsRecording(false);
    setStatusMessage("");
  };

  const handleSubmit = async () => {
    setStatusMessage("");
    if (!content.trim() && selectedFiles.length === 0) {
      setStatusMessage("Please write text, upload media, or record voice first ☕");
      return;
    }

    setLoading(true);

    let user;

    try {
      user = await getOrCreateAnonymousUser();
    } catch (error) {
      console.error(error);
      setStatusMessage("Anonymous user could not be created.");
      setLoading(false);
      return;
    }

    const uploadedMedia: MediaItem[] = [];

    for (const file of selectedFiles) {
      const fileExt = file.name.split(".").pop();
      const fileType = getFileType(file);
      const filePath = `${user.id}/${fileType}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("tea-media")
        .upload(filePath, file);

      if (uploadError) {
        console.error(uploadError);
        setStatusMessage("Failed to upload one of the media files.");
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("tea-media")
        .getPublicUrl(filePath);

      uploadedMedia.push({
        url: publicUrlData.publicUrl,
        type: fileType,
        name: file.name,
      });
    }

    const firstMedia = uploadedMedia[0];
    const postMediaType = uploadedMedia.length > 1 ? "mixed" : firstMedia?.type || "text";

    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: content.trim(),
      category,
      media_type: postMediaType,
      media_url: firstMedia?.url || null,
      media_items: uploadedMedia,
    });

    setLoading(false);

    if (error) {
      console.error(error);
      setStatusMessage("Failed to post tea.");
      return;
    }

    clearForm();
    setStatusMessage("Tea posted successfully ☕");
  };

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-black/20 p-3.5 sm:rounded-3xl sm:p-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-purple-500/20 bg-purple-500/10 shadow-lg shadow-purple-500/10 sm:h-12 sm:w-12">
          <NextImage
            src="/logo3.png"
            alt="TeaTame Logo"
            width={56}
            height={56}
            className="h-8 w-8 object-contain sm:h-9 sm:w-9"
          />
        </div>

        <div>
          <h2 className="text-lg font-bold text-white sm:text-xl">Create Your Tea</h2>
          <p className="text-xs text-zinc-400 sm:text-sm">
            Spill safely. Stay anonymous.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 md:gap-3">
        {teaTypes.map((type) => {
          const Icon = type.icon;

          return (
            <button
              key={type.title}
              type="button"
              onClick={() => setActiveType(type.value)}
              className={`rounded-[1.25rem] border p-3 text-left transition active:scale-[0.98] sm:rounded-3xl md:p-5 ${
                activeType === type.value
                  ? "border-purple-300/40 bg-purple-500/20 shadow-lg shadow-purple-500/10"
                  : "border-white/10 bg-black/20 hover:border-purple-300/40 hover:bg-purple-500/10"
              }`}
            >
              <Icon size={20} className="mb-2 text-purple-200 sm:mb-3" />
              <h3 className="text-sm font-semibold sm:text-base">{type.title}</h3>
              <p className="mt-1 text-[11px] text-white/40 sm:text-xs">{type.hint}</p>
              {activeType === type.value && (
                <p className="mt-2 text-xs text-purple-200">Selected</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/70">
          Category
        </label>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:gap-3 sm:px-0 [&::-webkit-scrollbar]:hidden">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition active:scale-95 md:text-sm ${
                category === item
                  ? "border-purple-300/40 bg-purple-500 text-white shadow-lg shadow-purple-500/20"
                  : "border-white/10 bg-white/[0.06] text-white/70 hover:border-purple-300/40 hover:text-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={1000}
        placeholder="Spill your tea here... add caption, context, or story."
        className="min-h-32 w-full resize-none rounded-[1.35rem] border border-white/10 bg-black/25 p-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-purple-300/40 focus:bg-black/30 sm:rounded-3xl sm:p-5 sm:text-base md:min-h-44"
      />
      <div className="flex items-start justify-between gap-3 text-[11px] leading-4 text-white/40 sm:text-xs">
        <span>Keep it anonymous. Avoid real names or personal details.</span>
        <span>{content.length}/1000</span>
      </div>

      {(activeType === "image" || activeType === "video") && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-white/15 bg-black/20 p-5 text-center transition hover:border-purple-300/40 hover:bg-purple-500/10 sm:rounded-3xl md:p-8">
          <input
            type="file"
            multiple
            accept={activeType === "image" ? "image/*" : "video/*"}
            onChange={(event) => addFiles(event.target.files)}
            className="hidden"
          />
          {activeType === "video" ? (
            <Video className="mb-3 text-white/70" />
          ) : (
            <Image className="mb-3 text-white/70" />
          )}
          <p className="font-medium">Add {activeType === "image" ? "images" : "videos"}</p>
          <p className="mt-1 text-sm text-white/40">
            Add multiple files. You can also switch tabs and add voice/text.
          </p>
        </label>
      )}

      {activeType === "audio" && (
        <div className="rounded-[1.35rem] border border-dashed border-white/15 bg-black/20 p-5 text-center sm:rounded-3xl md:p-6">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-500/20">
            {isRecording ? (
              <Pause className="text-purple-100" />
            ) : (
              <Mic className="text-purple-100" />
            )}
          </div>

          <h3 className="font-semibold">Record Voice Tea</h3>
          <p className="mt-1 text-sm text-white/45">
            {isRecording
              ? "Recording... tap stop when done"
              : "Record voice and combine it with your text/images/videos"}
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {!isRecording && (
              <button
                type="button"
                onClick={startRecording}
                className="rounded-full bg-purple-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-purple-400"
              >
                Start Recording
              </button>
            )}

            {isRecording && (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-full bg-red-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-400"
              >
                <Square size={16} />
                Stop Recording
              </button>
            )}
          </div>

          {recordedAudioUrl && (
            <audio src={recordedAudioUrl} controls className="mt-5 w-full" />
          )}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-3.5 sm:rounded-3xl sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white/70">
              <FileImage size={16} />
              Attached media ({selectedFiles.length})
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedFiles([]);
                setRecordedAudioUrl("");
              }}
              className="text-xs text-white/40 transition hover:text-white"
            >
              Clear all
            </button>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-3 py-3 text-sm text-white/70 sm:px-4"
              >
                <div className="flex min-w-0 items-center gap-3">
                  {getFileType(file) === "image" ? (
                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-12 w-12 shrink-0 rounded-xl object-cover"
                    />
                  ) : getFileType(file) === "video" ? (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-lg">
                      🎥
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-lg">
                      🎤
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-white/75">{file.name}</p>
                    <p className="text-xs text-white/35">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="rounded-full p-2 text-white/45 transition hover:bg-white/10 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {statusMessage && (
        <div className="rounded-2xl border border-purple-300/20 bg-purple-500/10 px-4 py-3 text-sm leading-5 text-purple-100">
          {statusMessage}
        </div>
      )}
      <button
        onClick={handleSubmit}
        disabled={loading || (!content.trim() && selectedFiles.length === 0)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-4 font-semibold shadow-lg shadow-purple-500/25 transition active:scale-[0.99] hover:from-purple-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Send size={18} />
        {loading ? "Posting..." : "Post Tea"}
      </button>
    </div>
  );
}