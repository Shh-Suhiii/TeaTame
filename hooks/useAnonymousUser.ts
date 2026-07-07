"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateAnonymousName } from "@/lib/anonymous-user";

function getEmojiFromName(name: string) {
  const emojiMatch = name.match(/[\u{1F300}-\u{1FAFF}]/u);
  return emojiMatch?.[0] || "☕";
}

function readSavedUser() {
  const saved = localStorage.getItem("TeaTame_user");
  if (!saved) return null;

  try {
    const user = JSON.parse(saved);

    if (
      !user?.anonymous_name ||
      user.anonymous_name.trim() === "" ||
      user.anonymous_name === "Anonymous User"
    ) {
      localStorage.removeItem("TeaTame_user");
      return null;
    }

    return user;
  } catch {
    localStorage.removeItem("TeaTame_user");
    return null;
  }
}

export function useAnonymousUser() {
  const [username, setUsername] = useState("Loading...");

  useEffect(() => {
    const createUser = async () => {
      try {
        const savedUser = readSavedUser();

        if (savedUser?.id && savedUser?.anonymous_name) {
          setUsername(savedUser.anonymous_name);
          return;
        }

        const anonymous_name =
          savedUser?.anonymous_name && savedUser.anonymous_name !== "Anonymous User"
            ? savedUser.anonymous_name
            : generateAnonymousName();

        const { data, error } = await supabase
          .from("anonymous_users")
          .insert({
            anonymous_name,
            avatar: getEmojiFromName(anonymous_name),
          })
          .select("id, anonymous_name, avatar, created_at")
          .single();

        if (error || !data) {
          console.error("Supabase Error:", error);
          setUsername(anonymous_name);

          localStorage.setItem(
            "TeaTame_user",
            JSON.stringify({
              anonymous_name,
              avatar: getEmojiFromName(anonymous_name),
              created_at: new Date().toISOString(),
            })
          );
          return;
        }

        localStorage.setItem("TeaTame_user", JSON.stringify(data));
        setUsername(data.anonymous_name);
      } catch (err) {
        console.error(err);
        const fallbackName = generateAnonymousName();
        setUsername(fallbackName);
      }
    };

    createUser();
  }, []);

  return username;
}