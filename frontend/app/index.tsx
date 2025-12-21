// app/index.tsx
import { Redirect } from "expo-router";
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { getAuth } from "@/util/utils/auth";

export default function Index() {
  const [to, setTo] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        // ✅ 웹에서 getAuth가 불안정하면 일단 로그인 페이지로 보내기
        if (Platform.OS === "web") {
          setTo("/login");
          return;
        }

        const auth = await getAuth();
        setTo(auth?.accessToken ? "/(tabs)" : "/login");
      } catch {
        setTo("/login");
      }
    };
    run();
  }, []);

  if (!to) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" }}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  return <Redirect href={to as any} />;
}
