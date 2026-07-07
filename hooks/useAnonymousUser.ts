"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateAnonymousName } from "@/lib/anonymous-user";

export function useAnonymousUser() {
  const [username, setUsername] = useState("Loading...");

  useEffect(() => {
    const createUser = async () => {
      try {
        const saved = localStorage.getItem("TeaTame_user");

        if (saved) {
          const user = JSON.parse(saved);

          if (user?.anonymous_name) {
            setUsername(user.anonymous_name);
            return;
          }

          localStorage.removeItem("TeaTame_user");
        }

        const anonymous_name = generateAnonymousName();

        const { data, error } = await supabase
          .from("anonymous_users")
          .insert({
            anonymous_name,
            avatar: anonymous_name,
          })
          .select()
          .single();

        if (error) {
          console.error("Supabase Error:", error);
          setUsername(anonymous_name);

          localStorage.setItem(
            "TeaTame_user",
            JSON.stringify({
              anonymous_name,
              created_at: new Date().toISOString(),
            })
          );
          return;
        }

        localStorage.setItem(
          "TeaTame_user",
          JSON.stringify({
            ...data,
            created_at: data.created_at ?? new Date().toISOString(),
          })
        );
        setUsername(data.anonymous_name);
      } catch (err) {
        console.error(err);
        setUsername("Anonymous Panda 🐼");
      }
    };

    createUser();
  }, []);

  return username;
}