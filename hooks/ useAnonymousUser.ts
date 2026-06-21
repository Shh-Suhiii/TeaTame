"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { generateAnonymousName } from "@/lib/anonymous-user";

export function useAnonymousUser() {
  const [username, setUsername] = useState("");

  useEffect(() => {
    const createUser = async () => {
      const saved = localStorage.getItem("teatime_user");

      if (saved) {
        setUsername(JSON.parse(saved).anonymous_name);
        return;
      }

      const anonymous_name = generateAnonymousName();

      const { data } = await supabase
        .from("anonymous_users")
        .insert({
          anonymous_name,
          avatar: anonymous_name,
        })
        .select()
        .single();

      if (data) {
        localStorage.setItem(
          "teatime_user",
          JSON.stringify(data)
        );

        setUsername(data.anonymous_name);
      }
    };

    createUser();
  }, []);

  return username;
}