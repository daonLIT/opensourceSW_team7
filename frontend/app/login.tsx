import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // 아이콘 사용

import { API_BASE_URL } from "@/constants/api";
import { saveAuth } from "@/util/utils/auth";

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("로그인 실패", "이메일과 비밀번호를 입력해주세요.");
      return;
    }

    setLoading(true);

    try {
      // ✅ 수정 1: 주소에 /api 추가 (백엔드 설정에 따라 다를 수 있음)
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        // 백엔드에서 에러 메시지를 주면 그걸 보여주고, 아니면 기본 메시지
        const errData = await res.json().catch(() => ({}));
        Alert.alert("로그인 실패", errData.detail || "이메일 또는 비밀번호가 틀렸습니다.");
        return;
      }

      const data = await res.json();
      console.log("LOGIN SUCCESS:", data);

      // ✅ auth.ts의 saveAuth 사용 (UserOut 스키마와 맞춤)
      await saveAuth({
        accessToken: data.access_token,
        user: data.user,
      });

      // ✅ 수정 2: 탭이 있는 메인 화면으로 이동
      router.replace("/(tabs)");
      
    } catch (e) {
      console.error(e);
      Alert.alert("연결 오류", "서버와 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <Text style={styles.logoEmoji}>🥬</Text>
          <Text style={styles.title}>냉장고를 부탁해</Text>
          <Text style={styles.subtitle}>로그인하여 식재료를 관리해보세요.</Text>

          <View style={styles.form}>
            {/* 이메일 입력 */}
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                placeholderTextColor="#6b7280"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* 비밀번호 입력 */}
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color="#9ca3af" />
              <TextInput
                style={styles.input}
                placeholder="비밀번호"
                placeholderTextColor="#6b7280"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {/* 로그인 버튼 */}
            <TouchableOpacity 
              style={[styles.loginButton, loading && styles.disabledButton]} 
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={styles.loginButtonText}>
                {loading ? "로그인 중..." : "로그인"}
              </Text>
            </TouchableOpacity>
            
            {/* 회원가입 이동 버튼 (필요시) */}
            <TouchableOpacity onPress={() => router.push("/register")} style={styles.linkButton}>
              <Text style={styles.linkText}>계정이 없으신가요? 회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  keyboardView: { flex: 1 },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  logoEmoji: { fontSize: 48, marginBottom: 10, textAlign: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#e5e7eb",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#94a3b8",
    textAlign: "center",
    marginBottom: 32,
  },
  form: { gap: 16 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#334155",
    gap: 12,
  },
  input: {
    flex: 1,
    color: "white",
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: "#1d4ed8",
    opacity: 0.7,
  },
  loginButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  linkButton: {
    alignItems: "center",
    marginTop: 12,
  },
  linkText: {
    color: "#60a5fa",
    fontSize: 14,
  },
});