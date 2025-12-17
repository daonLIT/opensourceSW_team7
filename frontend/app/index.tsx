// app/index.tsx
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { getAuth } from "@/util/utils/auth"; // ✅ getUser 대신 getAuth 가져오기

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    const checkLogin = async () => {
      try {
        // ✅ getUser() 대신 getAuth() 사용
        const auth = await getAuth();
        
        // 토큰이 있으면 로그인 된 것으로 간주 -> 메인으로 이동
        if (auth && auth.accessToken) {
          router.replace("/(tabs)");
        } else {
          // 없으면 로그인 화면으로 이동
          router.replace("/login");
        }
      } catch (e) {
        // 에러 나면 안전하게 로그인 화면으로
        console.error(e);
        router.replace("/login");
      }
    };

    checkLogin();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0f172a" }}>
      <ActivityIndicator size="large" color="#ffffff" />
    </View>
  );
}
//ㅁㄴㅇㅁㄴㅇ