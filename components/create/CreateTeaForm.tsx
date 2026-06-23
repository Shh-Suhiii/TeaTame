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

const teaTypes = [
  { title: "Text", value: "text", icon: Type },
  { title: "Images", value: "image", icon: Image },
  { title: "Videos", value: "video", icon: Video },
  { title: "Voice", value: "audio", icon: Mic },
];

const categories = ["College", "Work", "Relationship", "Confession", "Family", "Random"];

type MediaItem = {
  url: string;
  type: string;
  name: string;
};

async function getOrCreateAnonymousUser() {
  const savedUser = localStorage.getItem("teatime_user");

  if (savedUser) {
    const parsedUser = JSON.parse(savedUser);

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

    localStorage.setItem("teatime_user", JSON.stringify(data));
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

  localStorage.setItem("teatime_user", JSON.stringify(data));
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

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState("");

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const incomingFiles = Array.from(files);
    setSelectedFiles((prev) => [...prev, ...incomingFiles]);
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
  };

  const handleSubmit = async () => {
    if (!content.trim() && selectedFiles.length === 0) {
      alert("Please write text, upload media, or record voice first ☕");
      return;
    }

    setLoading(true);

    let user;

    try {
      user = await getOrCreateAnonymousUser();
    } catch (error) {
      console.error(error);
      alert("Anonymous user could not be created.");
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
        alert("Failed to upload one of the media files.");
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
      alert("Failed to post tea.");
      return;
    }

    alert("Tea posted successfully ☕");
    clearForm();
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        {teaTypes.map((type) => {
          const Icon = type.icon;

          return (
            <button
              key={type.title}
              type="button"
              onClick={() => setActiveType(type.value)}
              className={`rounded-3xl border p-5 text-left transition ${
                activeType === type.value
                  ? "border-purple-300/40 bg-purple-500/20 shadow-lg shadow-purple-500/10"
                  : "border-white/10 bg-black/20 hover:border-purple-300/40 hover:bg-purple-500/10"
              }`}
            >
              <Icon className="mb-4 text-purple-200" />
              <h3 className="font-semibold">{type.title}</h3>
              {activeType === type.value && (
                <p className="mt-2 text-xs text-purple-200">Selected</p>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-white/70">
          Choose category
        </label>
        <div className="flex flex-wrap gap-3">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
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
        placeholder="Text/caption/context yahan spill karo..."
        className="min-h-44 w-full resize-none rounded-3xl border border-white/10 bg-black/25 p-5 text-white outline-none placeholder:text-white/30"
      />

      {(activeType === "image" || activeType === "video") && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-3xl border border-dashed border-white/15 bg-black/20 p-8 text-center transition hover:border-purple-300/40 hover:bg-purple-500/10">
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
            You can combine text, images, videos, and voice in one tea.
          </p>
        </label>
      )}

      {activeType === "audio" && (
        <div className="rounded-3xl border border-dashed border-white/15 bg-black/20 p-6 text-center">
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
        <div className="rounded-3xl border border-white/10 bg-black/20 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/70">
            <FileImage size={16} />
            Attached media ({selectedFiles.length})
          </div>

          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 px-4 py-3 text-sm text-white/70"
              >
                <span className="truncate">
                  {getFileType(file) === "image"
                    ? "🖼️"
                    : getFileType(file) === "video"
                      ? "🎥"
                      : "🎤"}{" "}
                  {file.name}
                </span>
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

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-purple-500 px-5 py-4 font-semibold disabled:opacity-50"
      >
        <Send size={18} />
        {loading ? "Posting..." : "Post Tea"}
      </button>
    </div>
  );
}