/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
"use client";

import { useEffect, useRef, useState } from "react";
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

const voiceEffects = [
  { label: "Normal", value: "normal" },
  { label: "Deep", value: "deep" },
  { label: "Chipmunk", value: "chipmunk" },
];

type MediaItem = {
  url: string;
  type: string;
  name: string;
};

function getEmojiFromName(name: string) {
  const emojiMatch = name.match(/[\u{1F300}-\u{1FAFF}]/u);
  return emojiMatch?.[0] || "☕";
}

function readSavedUser() {
  const savedUser = localStorage.getItem("TeaTame_user");
  if (!savedUser) return null;

  try {
    const parsedUser = JSON.parse(savedUser);

    if (parsedUser?.anonymous_name === "Anonymous User") {
      localStorage.removeItem("TeaTame_user");
      return null;
    }

    return parsedUser;
  } catch {
    localStorage.removeItem("TeaTame_user");
    return null;
  }
}

async function getOrCreateAnonymousUser() {
  const parsedUser = readSavedUser();

  if (parsedUser?.id && parsedUser?.anonymous_name) {
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
      avatar: getEmojiFromName(anonymousName),
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

function audioBufferToWav(buffer: AudioBuffer) {
  const numberOfChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);
  const channels = Array.from({ length: numberOfChannels }, (_, index) =>
    buffer.getChannelData(index)
  );

  const writeString = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) {
      view.setUint8(offset + index, value.charCodeAt(index));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + length, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, length, true);

  let offset = 44;

  for (let index = 0; index < buffer.length; index += 1) {
    for (let channel = 0; channel < numberOfChannels; channel += 1) {
      const sample = Math.max(-1, Math.min(1, channels[channel][index]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: "audio/wav" });
}

async function applyVoiceEffect(audioBlob: Blob, effect: string) {
  if (effect === "normal") return audioBlob;

  const AudioContextClass =
    window.AudioContext ||
    (window as typeof window & {
      webkitAudioContext?: typeof AudioContext;
    }).webkitAudioContext;

  if (!AudioContextClass) {
    throw new Error("AudioContext not supported");
  }

  const audioContext = new AudioContextClass();
  const originalBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
  await audioContext.close();

  const playbackRate = effect === "deep" ? 0.78 : 1.32;
  const duration = originalBuffer.duration / playbackRate;

  const offlineContext = new OfflineAudioContext(
    originalBuffer.numberOfChannels,
    Math.ceil(originalBuffer.sampleRate * duration),
    originalBuffer.sampleRate
  );

  const source = offlineContext.createBufferSource();
  source.buffer = originalBuffer;
  source.playbackRate.value = playbackRate;
  source.connect(offlineContext.destination);
  source.start(0);

  const renderedBuffer = await offlineContext.startRendering();
  return audioBufferToWav(renderedBuffer);
}

export default function CreateTeaForm() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("Random");
  const [activeType, setActiveType] = useState("text");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState("");
  const [originalRecordedAudioBlob, setOriginalRecordedAudioBlob] = useState<Blob | null>(null);
  const [voiceEffect, setVoiceEffect] = useState("normal");
  const [processingVoiceEffect, setProcessingVoiceEffect] = useState(false);

  const previewUrls = selectedFiles.map((file) => URL.createObjectURL(file));

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    return () => {
      if (recordedAudioUrl) {
        URL.revokeObjectURL(recordedAudioUrl);
      }
    };
  }, [recordedAudioUrl]);

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const incomingFiles = Array.from(files);
    const acceptedFiles = incomingFiles.filter((file) => {
      if (activeType === "image") return file.type.startsWith("image/");
      if (activeType === "video") return file.type.startsWith("video/");
      return true;
    });

    if (acceptedFiles.length === 0) {
      setStatusMessage("Please choose a valid file for the selected tea type.");
      return;
    }

    setSelectedFiles((prev) => {
      const existingKeys = new Set(prev.map((file) => `${file.name}-${file.size}`));
      const uniqueFiles = acceptedFiles.filter(
        (file) => !existingKeys.has(`${file.name}-${file.size}`)
      );
      const nextFiles = [...prev, ...uniqueFiles];

      if (nextFiles.length > 8) {
        setStatusMessage("You can attach up to 8 media files only.");
      }

      return nextFiles.slice(0, 8);
    });
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const applyEffectToRecordedVoice = async (audioBlob: Blob, effect: string) => {
    setProcessingVoiceEffect(true);
    setVoiceEffect(effect);

    let processedAudioBlob = audioBlob;
    let extension = "webm";

    try {
      processedAudioBlob = await applyVoiceEffect(audioBlob, effect);
      extension = effect === "normal" ? "webm" : "wav";
    } catch (error) {
      console.error(error);
      setStatusMessage("Voice effect could not be applied. Original voice attached.");
    }

    const audioFile = new File(
      [processedAudioBlob],
      `voice-${effect}-${crypto.randomUUID()}.${extension}`,
      { type: processedAudioBlob.type || "audio/webm" }
    );

    setSelectedFiles((prev) => {
      const filesWithoutOldVoice = prev.filter(
        (file) =>
          !file.name.startsWith("voice-normal-") &&
          !file.name.startsWith("voice-deep-") &&
          !file.name.startsWith("voice-chipmunk-")
      );

      return [...filesWithoutOldVoice, audioFile].slice(0, 8);
    });

    setRecordedAudioUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return URL.createObjectURL(processedAudioBlob);
    });

    setProcessingVoiceEffect(false);
  };

  const startRecording = async () => {
    if (selectedFiles.length >= 8) {
      setStatusMessage("You can attach up to 8 media files only.");
      return;
    }
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

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        setOriginalRecordedAudioBlob(audioBlob);
        await applyEffectToRecordedVoice(audioBlob, voiceEffect);
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

  const handleTypeSelect = (typeValue: string) => {
    setActiveType(typeValue);

    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    if (!isMobile) return;

    window.setTimeout(() => {
      if (typeValue === "image") {
        imageInputRef.current?.click();
      }

      if (typeValue === "video") {
        videoInputRef.current?.click();
      }

      if (typeValue === "audio" && !isRecording) {
        setStatusMessage("Tap Start Recording when you are ready.");
      }
    }, 80);
  };

  const clearForm = () => {
    setContent("");
    setCategory("Random");
    setActiveType("text");
    setSelectedFiles([]);
    setOriginalRecordedAudioBlob(null);
    setVoiceEffect("normal");
    setProcessingVoiceEffect(false);
    setRecordedAudioUrl((prevUrl) => {
      if (prevUrl) URL.revokeObjectURL(prevUrl);
      return "";
    });
    setIsRecording(false);
    setStatusMessage("");

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  };

  const handleSubmit = async () => {
    setStatusMessage("");
    if (!content.trim() && selectedFiles.length === 0) {
      setStatusMessage("Please write text, upload media, or record voice first ☕");
      return;
    }

    setLoading(true);

    if (selectedFiles.length > 8) {
      setStatusMessage("You can attach up to 8 media files only.");
      setLoading(false);
      return;
    }

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
      if (file.size > 50 * 1024 * 1024) {
        setStatusMessage("Each media file should be under 50 MB.");
        setLoading(false);
        return;
      }
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
    setShowSuccessPopup(true);

    window.setTimeout(() => {
      setShowSuccessPopup(false);
    }, 2200);
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
              onClick={() => handleTypeSelect(type.value)}
              className={`rounded-[1.25rem] border p-3 text-left transition active:scale-[0.98] sm:rounded-3xl md:p-5 ${activeType === type.value
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

      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
        className="hidden"
      />

      <input
        ref={videoInputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
        className="hidden"
      />

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
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition active:scale-95 md:text-sm ${category === item
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
        placeholder="Spill your tea here... add caption, context, or story."
        className="min-h-32 w-full resize-none rounded-[1.35rem] border border-white/10 bg-black/25 p-4 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-purple-300/40 focus:bg-black/30 sm:rounded-3xl sm:p-5 sm:text-base md:min-h-44"
      />
      <div className="mb-4 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[11px] leading-4 text-white/45 sm:mb-5 sm:text-xs">
        Keep it anonymous. Avoid real names, phone numbers, addresses, or personal details.
      </div>

      {(activeType === "image" || activeType === "video") && (
        <label className="flex cursor-pointer flex-col items-center justify-center rounded-[1.35rem] border border-dashed border-white/15 bg-black/20 p-5 text-center transition hover:border-purple-300/40 hover:bg-purple-500/10 sm:rounded-3xl md:p-8">
          <input
            type="file"
            multiple
            accept={activeType === "image" ? "image/*" : "video/*"}
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
            className="hidden"
          />
          {activeType === "video" ? (
            <Video className="mb-3 text-white/70" />
          ) : (
            <Image className="mb-3 text-white/70" />
          )}
          <p className="font-medium">Add {activeType === "image" ? "images" : "videos"}</p>
          <p className="mt-1 text-xs leading-5 text-white/40 sm:text-sm">
            Add up to 8 files. On mobile, tapping Images or Videos opens your gallery directly.
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

          <h3 className="font-semibold">Anonymous Voice Tea</h3>
          <p className="mt-1 text-sm text-white/45">
            {isRecording
              ? `Recording with ${voiceEffect} effect... tap stop when done`
              : "Record voice and combine it with your text/images/videos"}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {voiceEffects.map((effect) => (
              <button
                key={effect.value}
                type="button"
                disabled={isRecording || processingVoiceEffect}
                onClick={() => {
                  if (originalRecordedAudioBlob) {
                    applyEffectToRecordedVoice(originalRecordedAudioBlob, effect.value);
                    return;
                  }

                  setVoiceEffect(effect.value);
                }}
                className={`rounded-2xl border px-3 py-2 text-xs transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 ${voiceEffect === effect.value
                  ? "border-purple-300/40 bg-purple-500/20 text-purple-100"
                  : "border-white/10 bg-white/[0.05] text-white/60 hover:bg-white/[0.08]"
                  }`}
              >
                {effect.label}
                {voiceEffect === effect.value && (

                  <span className="ml-1 text-[10px] text-purple-100">✓</span>

                )}
              </button>
            ))}
          </div>

          {originalRecordedAudioBlob && (
            <p className="mt-2 text-xs text-white/40">
              Tap any effect to preview and replace the recorded voice.
            </p>
          )}

          {processingVoiceEffect && (
            <p className="mt-2 text-xs text-purple-200">
              Applying voice effect...
            </p>
          )}

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
                setRecordedAudioUrl((prevUrl) => {
                  if (prevUrl) URL.revokeObjectURL(prevUrl);
                  return "";
                });
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
                      src={previewUrls[index]}
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
        <div className="rounded-2xl border border-purple-300/20 bg-purple-500/10 px-4 py-3 text-sm leading-5 text-purple-100 shadow-lg shadow-purple-500/10">
          {statusMessage}
        </div>
      )}
      {showSuccessPopup && (
  <div className="fixed left-1/2 top-6 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-3xl border border-purple-300/25 bg-[#16091f]/95 px-5 py-4 text-center shadow-[0_20px_70px_rgba(168,85,247,0.28)] backdrop-blur-xl sm:top-8">
    <p className="text-lg font-bold text-white">
      Tea posted successfully ☕
    </p>
    <p className="mt-1 text-sm text-white/55">
      Your anonymous tea is live.
    </p>
  </div>
)}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading || (!content.trim() && selectedFiles.length === 0)}
        className="sticky bottom-24 z-10 mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-5 py-4 font-semibold shadow-lg shadow-purple-500/25 transition active:scale-[0.99] hover:from-purple-400 hover:to-fuchsia-400 disabled:cursor-not-allowed disabled:opacity-50 sm:static sm:static sm:mt-7"
      >
        <Send size={18} />
        {loading ? "Posting..." : "Post Tea"}
      </button>
    </div>
  );
}